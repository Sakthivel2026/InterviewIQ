import { Router } from 'express';
import { signup, login, logout, refreshToken, getMe, forgotPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimiter.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { signupSchema, loginSchema, forgotPasswordSchema } from '../validations/auth.validation';

const router = Router();

router.post('/signup', authLimiter, validateBody(signupSchema), signup);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.get('/me', authenticateToken, getMe);

export default router;
