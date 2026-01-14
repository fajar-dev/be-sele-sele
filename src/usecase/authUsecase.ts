import { OAuth2Client } from 'google-auth-library';
import { sign } from 'hono/jwt';
import { UserRepository } from '../domain/entity/user';
import { User } from '../domain/entity/user';
import { RefreshTokenRepository } from '../domain/entity/refreshToken';
import { uuidv7 } from 'uuidv7';

export class AuthUsecase {
  // Using process.env directly as we don't have the user's specific 'env' module from the snippet
  private CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  private SECRET_KEY = process.env.GOOGLE_CLIENT_SECRET || '';
  private JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

  constructor(
    private userRepo: UserRepository,
    private refreshTokenRepo: RefreshTokenRepository
  ) {}

  private getOauth2Client() {
    const oAuth2Client = new OAuth2Client(
      this.CLIENT_ID,
      this.SECRET_KEY,
      'postmessage'
    );
    return oAuth2Client;
  }

  async verify(code: string): Promise<any> {
    const oAuth2Client = this.getOauth2Client();
    const result = await oAuth2Client.getToken(code);
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: result.tokens.id_token!,
      audience: this.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }

  async loginWithGoogle(code: string, ip: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    try {
      const payload = await this.verify(code);
      
      if (!payload || !payload.email) {
          throw new Error('Invalid Google Token: Email not found.');
      }
      
      // Upsert User
      const user = await this.userRepo.upsert({
          email: payload.email,
          sub: payload.sub,
          name: payload.name,
          avatar: payload.picture,
          lastLoginIp: ip,
          lastLoginAt: new Date(),
      });

      // Generate Access Token (JWT)
      const accessToken = await sign({
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      }, this.JWT_SECRET);

      // Generate Refresh Token
      const refreshTokenStr = uuidv7();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiry for refresh token

      await this.refreshTokenRepo.create({
          token: refreshTokenStr,
          userId: user.id,
          expiresAt: expiresAt
      });

      return { user, accessToken, refreshToken: refreshTokenStr };

    } catch (error: any) {
        console.error('[Auth] Verification Error Details:', error);
        if (error.response) {
            console.error('[Auth] Google Error Response:', error.response.data);
        }
        throw new Error(`User Verification Failed: ${error.message}`);
    }
  }

  async refresh(refreshTokenStr: string): Promise<{ accessToken: string; refreshToken: string }> {
      const storedToken = await this.refreshTokenRepo.findByToken(refreshTokenStr);
      if (!storedToken) {
          throw new Error('Invalid Refresh Token');
      }

      if (storedToken.expiresAt < new Date()) {
          await this.refreshTokenRepo.deleteByToken(refreshTokenStr);
          throw new Error('Refresh Token Expired');
      }

      // Rotate Token: Delete old, create new
      await this.refreshTokenRepo.deleteByToken(refreshTokenStr);

      const user = await this.userRepo.findById(storedToken.userId);
      
      if (!user) {
          throw new Error('User not found');
      }

      // Generate New Access Token
      const accessToken = await sign({
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      }, this.JWT_SECRET);

      // Generate New Refresh Token
      const newRefreshTokenStr = uuidv7();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14); // 14 days

      await this.refreshTokenRepo.create({
          token: newRefreshTokenStr,
          userId: user.id,
          expiresAt: expiresAt
      });

      return { accessToken, refreshToken: newRefreshTokenStr };
  }
}
