import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import menuRoutes from './menu.routes';
import studentRoutes from './student.routes';
import staffRoutes from './staff.routes';
import adminRoutes from './admin.routes';
import publicRoutes from './public.routes';
import chatRoutes from './chat.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/menu', menuRoutes);
router.use('/student', studentRoutes);
router.use('/chat', chatRoutes);
router.use('/staff', staffRoutes);
router.use('/admin', adminRoutes);

export default router;
