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

// Auth Deps
const userRepo = new UserRepositoryImpl();
const authUsecase = new AuthUsecase(userRepo);
const authHandler = new AuthHandler(authUsecase);


const router = new Hono(); 

import { authMiddleware } from './middleware/authMiddleware';


// Pages (+ Auth Middleware)
router.use('/v1/pages/*', authMiddleware);
router.get('/v1/pages', (c) => pageHandler.getPages(c));
router.get('/v1/pages/:id', (c) => pageHandler.getPage(c));
router.post('/v1/pages', (c) => pageHandler.createPage(c));
router.put('/v1/pages/:id', (c) => pageHandler.updatePage(c));
router.delete('/v1/pages/:id', (c) => pageHandler.deletePage(c));

// Members
router.get('/v1/pages/:id/member', (c) => pageHandler.getMembers(c));
router.put('/v1/pages/:id/member', (c) => pageHandler.addMember(c));
router.delete('/v1/pages/:id/member', (c) => pageHandler.removeMember(c));

// Content
router.get('/v1/pages/:id/md', (c) => pageHandler.downloadMarkdown(c));
router.get('/v1/pages/:id/pdf', (c) => pageHandler.downloadPdf(c));
router.post('/v1/pages/:id/content', (c) => pageHandler.updateContent(c));
router.get('/v1/pages/:id/content', (c) => pageHandler.getContent(c));
router.get('/v1/pages/:id/permission', (c) => pageHandler.getPermission(c));

// Auth
router.post('/v1/auth/login', (c) => authHandler.login(c));
router.post('/v1/auth/refresh', (c) => authHandler.refresh(c));
router.get('/v1/auth/me', authMiddleware, (c) => authHandler.me(c));
router.post('/v1/auth/logout', authMiddleware, (c) => authHandler.logout(c));

export default router;
