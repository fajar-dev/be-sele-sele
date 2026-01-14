import { eq, isNull, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../../db';
import { pages, collaborations, users } from '../../db/schema';
import { Page, PageRepository } from '../../domain/entity/page';
import { uuidv7 } from 'uuidv7';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const FILE_DIR = path.join(process.cwd(), 'file');

async function ensureDir() {
    try {
        await fs.access(FILE_DIR);
    } catch {
        await fs.mkdir(FILE_DIR, { recursive: true });
    }
}

export class PageRepositoryImpl implements PageRepository {
    async findAll(userEmail: string, pageNumber: number, limitArg: number, owned?: boolean): Promise<{ data: Page[]; total: number }> {
        const offset = (pageNumber - 1) * limitArg;

        const conditions = [
            eq(collaborations.email, userEmail),
            // isPending logic removed from DB. 
            // Query assumes if collaboration exists, it's valid, 
            // OR if we only want "active" collaborations, we check if user exists in users table.
            // But checking that in `conditions` for findAll is tricky without join.
            // Requirement: "findAll(userEmail...)" - typically means pages where *this user* is a member.
            // If userEmail is in collaborations, and userEmail exists in users table (which they must to be logged in and calling this),
            // then it matters less. 
            // But wait, "invited email" might not be in users table. 
            // If I am looking at "my pages", I am a user. So I exist.
            // So basic check is fine.
            isNull(pages.deletedAt)
        ];

        if (owned === true) {
            conditions.push(eq(collaborations.isOwner, true));
        } else if (owned === false) {
            conditions.push(eq(collaborations.isOwner, false));
        }

        // Data Query
        const data = await db.select({
            id: pages.id,
            icon: pages.icon,
            title: pages.title,
            description: pages.description,
            createdAt: pages.createdAt,
            updatedAt: pages.updatedAt,
            deletedAt: pages.deletedAt,
            // We can't eagerly fetch array in one query easily with Drizzle MySQL without complex joins/aggregation
            // So we will fetch basic data first, then fetch members.
        })
        .from(pages)
        .innerJoin(collaborations, eq(pages.id, collaborations.pageId))
        .where(and(...conditions))
        .limit(limitArg)
        .offset(offset)
        .orderBy(desc(pages.updatedAt));

        // Fetch Members for these pages
        const pageIds = data.map(p => p.id);
        let membersMap: Record<string, { email: string; name: string | null; isOwner: boolean; isPending: boolean; avatar: string | null }[]> = {};

        if (pageIds.length > 0) {
            const membersData = await db.select({
                pageId: collaborations.pageId,
                email: collaborations.email,
                isOwner: collaborations.isOwner,
                // Removed isPending column
                userName: users.name,
                userAvatar: users.avatar,
                userId: users.id
            })
            .from(collaborations)
            .innerJoin(users, eq(collaborations.email, users.email))
            .where(inArray(collaborations.pageId, pageIds));

            membersData.forEach(m => {
                if (!membersMap[m.pageId]) membersMap[m.pageId] = [];
                // Dynamic isPending: true if user not found (userId is null)
                const isPending = !m.userId;
                
                membersMap[m.pageId].push({
                    email: m.email,
                    name: m.userName || null,
                    isOwner: m.isOwner || false,
                    isPending: isPending,
                    avatar: m.userAvatar || null
                });
            });
        }

        // Attach members to data
        const finalData: Page[] = data.map(p => ({
            ...p,
            members: membersMap[p.id] || []
        }));

        // Count Query
        const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(pages)
        .innerJoin(collaborations, eq(pages.id, collaborations.pageId))
        .where(and(...conditions));
        
        return {
            data: finalData,
            total: Number(countResult[0]?.count || 0)
        };
    }

    async findById(id: string, userEmail: string): Promise<Page | null> {
        // Must check collaboration exists and not pending
        const result = await db.select({
                id: pages.id,
                icon: pages.icon,
                title: pages.title,
                description: pages.description,
                createdAt: pages.createdAt,
                updatedAt: pages.updatedAt,
                deletedAt: pages.deletedAt
        })
        .from(pages)
        .innerJoin(collaborations, eq(pages.id, collaborations.pageId))
        .where(
            and(
                eq(pages.id, id),
            and(
                eq(pages.id, id),
                eq(collaborations.email, userEmail),
                // Removed isPending check
                isNull(pages.deletedAt)
            )
            )
        )
        .limit(1);



        return result[0] || null;
    }

    async checkOwnership(id: string, userEmail: string): Promise<boolean> {
        const result = await db.select()
        .from(collaborations)
        .where(
            and(
            eq(collaborations.pageId, id),
            eq(collaborations.email, userEmail),
            eq(collaborations.isOwner, true)
            )
        )
        .limit(1);
        
        return result.length > 0;
    }

    async create(page: Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>, userEmail: string): Promise<Page> {
        const newPageId = uuidv7();
        
        const newPage = {
            id: newPageId,
            ...page,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null
        };

        // Transaction to insert page and collaboration
        await db.transaction(async (tx) => {
            await tx.insert(pages).values(newPage);
            await tx.insert(collaborations).values({
                pageId: newPageId,
                email: userEmail,
                // isPending removed
                isOwner: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });

        // Create empty markdown file
        await ensureDir();
        await fs.writeFile(path.join(FILE_DIR, `${newPageId}.md`), '');

        return newPage;
    }

    // Permissions are checked in Usecase before calling update/delete?
    // Actually, Usecase calls update, but update needs to ensure allowed.
    // But standard repo update usually just updates by ID. Usecase should check permission via findById first.
    async update(id: string, page: Partial<Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<Page | null> {
        // Assuming permission checked by Usecase calling findById
        await db.update(pages)
            .set({ ...page, updatedAt: new Date() })
            .where(eq(pages.id, id));
            
        // We can't easily return the object here without basic findById, but to call findById we need userEmail.
        // So usecase should re-fetch if needed. Or we just return what we have updated combined.
        // Let's follow previous pattern: simple update.
        // But wait, findById is now findById(id, userEmail). 
        // I will leave it to Usecase to re-fetch if it wants, or implement a basic internal findById if absolutely needed.
        // But implementing "findByIdInternal" is better.
        const result = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
        return result[0];
    }

    async delete(id: string): Promise<boolean> {
        // Permission checked by Usecase
        const run = await db.update(pages)
            .set({ deletedAt: new Date() })
            .where(eq(pages.id, id));
            
        return run[0].affectedRows > 0;
    }

    // Member Management
    async getMembers(pageId: string, pending?: boolean): Promise<{ email: string; name: string | null; isOwner: boolean; isPending: boolean; avatar: string | null }[]> {
        const result = await db.select({
            email: collaborations.email,
            isOwner: collaborations.isOwner,
            // Removed isPending
            userName: users.name,
            userAvatar: users.avatar,
            userId: users.id
        })
        .from(collaborations)
        .leftJoin(users, eq(collaborations.email, users.email))
        .where(eq(collaborations.pageId, pageId));
        
        let members = result.map(r => ({
            email: r.email,
            name: r.userName || null,
            isOwner: r.isOwner || false,
            isPending: !r.userId, // If user not found, pending is true
            avatar: r.userAvatar || null
        }));

        if (pending !== undefined) {
            members = members.filter(m => m.isPending === pending);
        }

        return members;
    }

    async addMember(pageId: string, email: string): Promise<boolean> {
        // Check if already exists
        const existing = await db.select().from(collaborations).where(
            and(eq(collaborations.pageId, pageId), eq(collaborations.email, email))
        ).limit(1);

        if (existing.length > 0) return false;

        await db.insert(collaborations).values({
            id: uuidv7(),
            pageId: pageId,
            email: email,
            isOwner: false,
            // isPending removed
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return true;
    }

    async removeMember(pageId: string, email: string): Promise<boolean> {
        const run = await db.delete(collaborations).where(
            and(eq(collaborations.pageId, pageId), eq(collaborations.email, email))
        );
        return run[0].affectedRows > 0;
    }

    async updateContent(id: string, content: string): Promise<boolean> {
        await ensureDir();
        await fs.writeFile(path.join(FILE_DIR, `${id}.md`), content);
        
        await db.update(pages)
            .set({ updatedAt: new Date() })
            .where(eq(pages.id, id));
            
        return true;
    }
}
