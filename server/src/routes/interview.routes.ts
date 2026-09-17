import { Router } from 'express';
import { createInterview, getInterviewById, getUserInterviews, finishInterviewAndGenerateReport } from '../controllers/interview.controller';
import { evaluateAnswer } from '../controllers/evaluation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/create', createInterview);
router.post('/evaluate-answer', evaluateAnswer);
router.post('/:id/finish', finishInterviewAndGenerateReport);
router.get('/', getUserInterviews);
router.get('/:id', getInterviewById);

export default router;
