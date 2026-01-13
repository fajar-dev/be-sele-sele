export interface RefreshToken {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date | null;
}
  
export interface RefreshTokenRepository {
    create(token: { token: string; userId: string; expiresAt: Date }): Promise<void>;
    findByToken(token: string): Promise<RefreshToken | null>;
    deleteByToken(token: string): Promise<void>;
}
