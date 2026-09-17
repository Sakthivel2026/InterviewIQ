import { Router } from 'express';
import { uploadResume, getUserResumes, getResumeById } from '../controllers/resume.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/upload', upload.single('resumeFile'), uploadResume);
router.get('/', getUserResumes);
router.get('/:id', getResumeById);

export default router;
