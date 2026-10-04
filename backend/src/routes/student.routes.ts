import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Protect all student routes
router.use(authenticateToken);
router.use(requireRole('STUDENT', 'ADMIN'));

/**
 * @route   GET /api/student/dashboard-summary
 * @desc    Get student personalized dashboard data
 * @access  Private (Student, Admin)
 */
router.get('/dashboard-summary', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;

  // Return realistic student dashboard state
  const summary = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.institutionId || 'CS-2024-8841',
      role: user.role,
    },
    stats: {
      activeOrdersCount: 1,
      totalOrdersCount: 14,
      savedFavoritesCount: 4,
    },
    activeOrder: {
      id: 'ord-live-892',
      orderNumber: 'SC-1048',
      status: 'PREPARING',
      estimatedMinutes: 8,
      pickupSlot: '13:45 - 14:00',
      items: [
        { name: 'Crispy Ghee Podi Masala Dosa', quantity: 1, price: 75 },
        { name: 'Kumbakonam Degree Filter Coffee', quantity: 1, price: 30 },
      ],
      total: 105,
    },
    recentOrders: [
      {
        id: 'ord-hist-101',
        orderNumber: 'SC-1022',
        date: 'Yesterday, 1:15 PM',
        items: 'South Indian Executive Mini Meals',
        total: 95,
        status: 'COMPLETED',
      },
      {
        id: 'ord-hist-100',
        orderNumber: 'SC-0985',
        date: '02 Oct 2026, 9:30 AM',
        items: 'Steamed Rice Idli with Medu Vada (2+1)',
        total: 55,
        status: 'COMPLETED',
      },
    ],
    quickFavorites: [
      {
        id: 'item-1',
        name: 'Crispy Ghee Podi Masala Dosa',
        price: 75,
        preparationTime: 8,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
      },
      {
        id: 'item-4',
        name: 'Authentic Kumbakonam Filter Coffee',
        price: 30,
        preparationTime: 3,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
      },
    ],
  };

  res.status(200).json({ success: true, data: summary });
}));

export default router;