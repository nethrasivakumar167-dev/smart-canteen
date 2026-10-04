import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import staffRoutes from './staff.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/staff', staffRoutes);
router.use('/admin', adminRoutes);

export default router;
