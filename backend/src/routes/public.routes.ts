import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/kitchen-status',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const [activeOrdersCount, feedback] = await Promise.all([
      prisma.order.count({
        where: { orderStatus: { in: ['RECEIVED', 'PREPARING'] } },
      }),
      prisma.feedback.aggregate({
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeOrdersCount,
        averageRating: feedback._avg.rating === null
          ? null
          : Math.round(feedback._avg.rating * 10) / 10,
        feedbackCount: feedback._count.id,
      },
    });
  })
);

export default router;
