import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
import { User, UserRepository } from '../../domain/entity/user';
import { uuidv7 } from 'uuidv7';

export class UserRepositoryImpl implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async upsert(data: { email: string; sub?: string; name?: string; avatar?: string; lastLoginIp: string | null; lastLoginAt: Date }): Promise<User> {
    const existing = await this.findByEmail(data.email);

    if (existing) {
      await db.update(users)
        .set({
          sub: data.sub,
          name: data.name,
          avatar: data.avatar,
          lastLoginIp: data.lastLoginIp,
          lastLoginAt: data.lastLoginAt,
          updatedAt: new Date()
        })
        .where(eq(users.email, data.email));
        
      const updated = await this.findByEmail(data.email);
      return updated!;
    } else {
      const newUser = {
        id: uuidv7(),
        email: data.email,
        sub: data.sub,
        name: data.name,
        avatar: data.avatar,
        lastLoginIp: data.lastLoginIp,
        lastLoginAt: data.lastLoginAt,
        isActive: true, // Default active
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(users).values(newUser);
      
      // Drizzle MySQL insert doesn't return the row.
      const created = await this.findByEmail(data.email);
      return created!;
    }
  }
}
