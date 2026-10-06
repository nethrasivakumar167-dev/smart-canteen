import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'online',
        database: 'up',
        service: 'Smart Canteen API',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });
    } catch {
      res.status(503).json({
        status: 'degraded',
        database: 'down',
      });
    }
  })
);

export default router;
