import { Router } from 'express';
import { signup, login, logout, refreshToken, getMe, forgotPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.get('/me', authenticateToken, getMe);

export default router;
