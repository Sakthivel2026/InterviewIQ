import { Router } from 'express';
import { parseJobDescription, matchResumeWithJd, getUserJds } from '../controllers/jd.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/parse', parseJobDescription);
router.post('/match', matchResumeWithJd);
router.get('/', getUserJds);

export default router;
