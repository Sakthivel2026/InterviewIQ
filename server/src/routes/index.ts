import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import resumeRoutes from './resume.routes';
import jdRoutes from './jd.routes';
import interviewRoutes from './interview.routes';

const router = Router();

// Version 1 API routes
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/jds', jdRoutes);
router.use('/interviews', interviewRoutes);

export default router;
