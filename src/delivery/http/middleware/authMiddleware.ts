import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { UserRepositoryImpl } from '../../../data/repository/userRepositoryImpl';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const userRepo = new UserRepositoryImpl();

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing Token' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verify(token, JWT_SECRET);
    
    if (!payload || !payload.email) {
      return c.json({ error: 'Unauthorized: Invalid Token Payload' }, 401);
    }

    const email = payload.email as string;
    const user = await userRepo.findByEmail(email);
    
    if (!user) {
        return c.json({ error: 'Unauthorized: User not found' }, 401);
    }
    
    // Check if active
    if (user.isActive === false) {
         return c.json({ error: 'Unauthorized: User is inactive' }, 401);
    }

    c.set('user', user);
    await next();
  } catch (e) {
    console.error('Auth Error:', e);
    return c.json({ error: 'Unauthorized: Invalid Token' }, 401);
  }
}
