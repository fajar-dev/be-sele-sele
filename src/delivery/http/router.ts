import { Hono } from 'hono';
import { PageHandler } from './pageHandler';
import { PageRepositoryImpl } from '../../data/repository/pageRepositoryImpl';
import { PageUsecase } from '../../usecase/pageUsecase';
import { UserRepositoryImpl } from '../../data/repository/userRepositoryImpl';
import { AuthUsecase } from '../../usecase/authUsecase';
import { AuthHandler } from './authHandler';

// Page Deps
const pageRepo = new PageRepositoryImpl();
const pageUsecase = new PageUsecase(pageRepo);
const pageHandler = new PageHandler(pageUsecase);

import { RefreshTokenRepositoryImpl } from '../../data/repository/refreshTokenRepositoryImpl';

// Auth Deps
// Ensure these env vars are set!
const userRepo = new UserRepositoryImpl();
const refreshTokenRepo = new RefreshTokenRepositoryImpl();
const authUsecase = new AuthUsecase(userRepo, refreshTokenRepo);
const authHandler = new AuthHandler(authUsecase);


const router = new Hono(); 

import { authMiddleware } from './middleware/authMiddleware';

// ... (previous imports)

// Pages (+ Auth Middleware)
router.use('/api/pages/*', authMiddleware);
router.get('/api/pages', (c) => pageHandler.getPages(c));
router.get('/api/pages/:id', (c) => pageHandler.getPage(c));
router.post('/api/pages', (c) => pageHandler.createPage(c));
router.put('/api/pages/:id', (c) => pageHandler.updatePage(c));
router.delete('/api/pages/:id', (c) => pageHandler.deletePage(c));

// Members
router.get('/api/pages/:id/member', (c) => pageHandler.getMembers(c));
router.put('/api/pages/:id/member', (c) => pageHandler.addMember(c)); // User asked for PUT/DELETE to /pages/:id/member for adding/removing?
// Prompt: "buat endpoint /pages/:id/member isinya, put,delete ke table collaborations."
// "add email table collaboration dan hapus row pada table collaboration."
// Is standard to use POST for add, but user specifically said "isinya, put,delete".
// I will use PUT for add and DELETE for remove as requested.
// Wait, PUT usually implies idempotency or update. POST is for create. 
// Adding a member is creating a collaboration row. 
// But if user requested PUT, I should probably stick to it or clarify?
// "isinya, put,delete ke table collaborations"
// Let's use PUT for Add and DELETE for Remove as explicitly requested.
router.delete('/api/pages/:id/member', (c) => pageHandler.removeMember(c));

// Content
// Content
router.get('/api/pages/:id/md', (c) => pageHandler.downloadMarkdown(c));
router.get('/api/pages/:id/pdf', (c) => pageHandler.downloadPdf(c));
router.post('/api/pages/:id/content', (c) => pageHandler.updateContent(c));
router.get('/api/pages/:id/content', (c) => pageHandler.getContent(c));

// Auth
router.post('/api/auth/login', (c) => authHandler.login(c));
router.post('/api/auth/refresh', (c) => authHandler.refresh(c));
router.get('/api/auth/me', authMiddleware, (c) => authHandler.me(c));
router.post('/api/auth/logout', authMiddleware, (c) => authHandler.logout(c));

export default router;
