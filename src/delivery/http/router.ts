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
const userRepo = new UserRepositoryImpl();
const refreshTokenRepo = new RefreshTokenRepositoryImpl();
const authUsecase = new AuthUsecase(userRepo, refreshTokenRepo);
const authHandler = new AuthHandler(authUsecase);


const router = new Hono(); 

import { authMiddleware } from './middleware/authMiddleware';


// Pages (+ Auth Middleware)
router.use('/api/pages/*', authMiddleware);
router.get('/api/pages', (c) => pageHandler.getPages(c));
router.get('/api/pages/:id', (c) => pageHandler.getPage(c));
router.post('/api/pages', (c) => pageHandler.createPage(c));
router.put('/api/pages/:id', (c) => pageHandler.updatePage(c));
router.delete('/api/pages/:id', (c) => pageHandler.deletePage(c));

// Members
router.get('/api/pages/:id/member', (c) => pageHandler.getMembers(c));
router.put('/api/pages/:id/member', (c) => pageHandler.addMember(c));
router.delete('/api/pages/:id/member', (c) => pageHandler.removeMember(c));

// Content
router.get('/api/pages/:id/md', (c) => pageHandler.downloadMarkdown(c));
router.get('/api/pages/:id/pdf', (c) => pageHandler.downloadPdf(c));
router.post('/api/pages/:id/content', (c) => pageHandler.updateContent(c));
router.get('/api/pages/:id/content', (c) => pageHandler.getContent(c));
router.get('/api/pages/:id/permission', (c) => pageHandler.getPermission(c));

// Auth
router.post('/api/auth/login', (c) => authHandler.login(c));
router.post('/api/auth/refresh', (c) => authHandler.refresh(c));
router.get('/api/auth/me', authMiddleware, (c) => authHandler.me(c));
router.post('/api/auth/logout', authMiddleware, (c) => authHandler.logout(c));

export default router;
