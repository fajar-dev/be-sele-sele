import { OAuth2Client } from 'google-auth-library';
import { sign } from 'hono/jwt';
import { UserRepository } from '../domain/entity/user';
import { User } from '../domain/entity/user';

export class AuthUsecase {
  // Using process.env directly as we don't have the user's specific 'env' module from the snippet
  private CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  private SECRET_KEY = process.env.GOOGLE_CLIENT_SECRET || '';
  private JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

  constructor(
    private userRepo: UserRepository
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

  async loginWithGoogle(code: string, ip: string): Promise<{ user: User; token: string }> {
    try {
      const payload = await this.verify(code);
      
      if (!payload || !payload.email) {
          throw new Error('Invalid Google Token: Email not found.');
      }
      
      console.log(`[Auth] User verified: ${payload.email}`);

      // Upsert User
      const user = await this.userRepo.upsert({
          email: payload.email,
          sub: payload.sub,
          name: payload.name,
          avatar: payload.picture,
          lastLoginIp: ip,
          lastLoginAt: new Date(),
      });

      // Generate JWT
      const token = await sign({
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      }, this.JWT_SECRET);

      return { user, token };

    } catch (error: any) {
        console.error('[Auth] Verification Error Details:', error);
        if (error.response) {
            console.error('[Auth] Google Error Response:', error.response.data);
        }
        throw new Error(`User Verification Failed: ${error.message}`);
    }
  }
}
