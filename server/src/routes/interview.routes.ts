import { Router } from 'express';
import { createInterview, getInterviewById, getUserInterviews, finishInterviewAndGenerateReport } from '../controllers/interview.controller';
import { evaluateAnswer } from '../controllers/evaluation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { aiLimiter } from '../middlewares/rateLimiter.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { createInterviewSchema, submitAnswerSchema } from '../validations/interview.validation';

const router = Router();

router.use(authenticateToken);

router.post('/create', aiLimiter, validateBody(createInterviewSchema), createInterview);
router.post('/evaluate-answer', aiLimiter, validateBody(submitAnswerSchema), evaluateAnswer);
router.post('/:id/finish', aiLimiter, finishInterviewAndGenerateReport);
router.get('/', getUserInterviews);
router.get('/:id', getInterviewById);

export default router;
