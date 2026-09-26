import { Router } from 'express';
import { uploadResume, getUserResumes, getResumeById, deleteResume } from '../controllers/resume.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { aiLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/upload', aiLimiter, upload.single('resumeFile'), uploadResume);
router.get('/', getUserResumes);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);

export default router;
