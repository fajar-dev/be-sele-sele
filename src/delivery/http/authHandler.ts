import { Context } from 'hono';
import { AuthUsecase } from '../../usecase/authUsecase';

export class AuthHandler {
  constructor(private authUsecase: AuthUsecase) {}

  async login(c: Context) {
    try {
      const body = await c.req.json();
      const code = body.code || body.idToken;
      
      if (!code) {
        return c.json({ 
          success: false,
          message: 'Code or ID Token is required',
          data: null
        }, 400);
      }

      // Get IP (Hono might need proxies setup if behind one, but standard request header usually ok)
      // c.req.header('x-forwarded-for') or similar.
      const ip = c.req.header('x-forwarded-for') || '127.0.0.1';

      const { user, token } = await this.authUsecase.loginWithGoogle(code as string, ip);

      return c.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token
        }
      });
    } catch (error: any) {
      console.error(error);
      return c.json({
        success: false,
        message: error.message || 'Authentication failed',
        data: null
      }, 401);
    }
  }

  async me(c: Context) {
    const user = c.get('user');
    return c.json({
        success: true,
        data: user,
    });
  }

  async logout(c: Context) {
      return c.json({
          success: true,
          message: 'Logged out successfully',
      });
  }
}
