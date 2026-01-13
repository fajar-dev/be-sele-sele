import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { refreshTokens } from '../../db/schema';
import { RefreshToken, RefreshTokenRepository } from '../../domain/entity/refreshToken';

export class RefreshTokenRepositoryImpl implements RefreshTokenRepository {
    async create(data: { token: string; userId: string; expiresAt: Date }): Promise<void> {
        await db.insert(refreshTokens).values(data);
    }

    async findByToken(token: string): Promise<RefreshToken | null> {
        const [result] = await db.select()
            .from(refreshTokens)
            .where(eq(refreshTokens.token, token))
            .limit(1);
        return result || null;
    }

    async deleteByToken(token: string): Promise<void> {
        await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
    }
}
