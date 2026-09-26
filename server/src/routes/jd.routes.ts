import { Router } from 'express';
import { parseJobDescription, matchResumeWithJd, getUserJds } from '../controllers/jd.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { aiLimiter } from '../middlewares/rateLimiter.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { parseJdSchema } from '../validations/interview.validation';

const router = Router();

router.use(authenticateToken);

router.post('/parse', aiLimiter, validateBody(parseJdSchema), parseJobDescription);
router.post('/match', aiLimiter, matchResumeWithJd);
router.get('/', getUserJds);

export default router;
