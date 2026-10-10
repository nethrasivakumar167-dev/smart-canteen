import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { emitAvailabilityUpdated } from '../socket';
import { z } from 'zod';

const router = Router();

const toggleCategorySchema = z.object({
  isAvailable: z.boolean().optional(),
});

/**
 * @route   GET /api/categories
 * @desc    Get all available menu categories
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const categories = await prisma.category.findMany({
      where: { isAvailable: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            menuItems: {
              where: { isAvailable: true },
            },
          },
        },
      },
    });

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      isAvailable: cat.isAvailable,
      displayOrder: cat.displayOrder,
      itemCount: cat._count.menuItems,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  })
);

/**
 * @route   PATCH /api/categories/:id/availability
 * @desc    Toggle category availability (Staff / Admin)
 * @access  Private (Staff, Admin)
 */
router.patch(
  '/:id/availability',
  authenticateToken,
  requireRole('STAFF', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const bodyData = toggleCategorySchema.parse(req.body);

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Category not found.' });
      return;
    }

    const nextAvailable = bodyData.isAvailable !== undefined ? bodyData.isAvailable : !existing.isAvailable;

    const updated = await prisma.category.update({
      where: { id },
      data: { isAvailable: nextAvailable },
    });

    emitAvailabilityUpdated({ type: 'CATEGORY', id: updated.id, isAvailable: updated.isAvailable });

    res.status(200).json({
      success: true,
      message: `Category "${updated.name}" is now ${updated.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}.`,
      data: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        isAvailable: updated.isAvailable,
      },
    });
  })
);

export default router;
