import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { getAllUsersList, createNewUser, findUserByEmailOrId } from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getFeedbackSummary, recomputeCookingTips } from '../services/feedbackInsightsService';

const router = Router();

// Protect ALL admin routes with ADMIN RBAC
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

const rangeQuerySchema = z.object({
  range: z.enum(['today', '7d', '30d', 'all']).optional().default('all'),
});

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
  role: z.enum(['STAFF', 'ADMIN']),
  institutionId: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

/**
 * @route   GET /api/admin/overview-stats
 * @desc    Get real executive-level metrics and analytics calculated from PostgreSQL DB
 * @access  Private (Admin Only)
 */
router.get(
  '/overview-stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { range } = rangeQuerySchema.parse(req.query);

    let startDate: Date | undefined;
    const now = new Date();
    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const orderWhere = startDate ? { createdAt: { gte: startDate } } : {};
    const dateFilter = startDate
      ? Prisma.sql`o."createdAt" >= ${startDate}`
      : Prisma.sql`TRUE`;

    // 1. Financials & Revenue
    const totalOrdersCount = await prisma.order.count({ where: orderWhere });
    const paidOrdersCount = await prisma.order.count({
      where: { ...orderWhere, paymentStatus: 'PAID' },
    });

    const revAgg = await prisma.order.aggregate({
      where: { ...orderWhere, paymentStatus: 'PAID' },
      _sum: { totalAmount: true },
    });
    const totalRevenue = revAgg._sum.totalAmount ? Number(revAgg._sum.totalAmount) : 0;

    const avgOrderVal = paidOrdersCount > 0
      ? Math.round((totalRevenue / paidOrdersCount) * 100) / 100
      : 0;

    let growthPercentage: number | null = null;
    if (startDate && range !== 'all') {
      const periodMs = range === 'today'
        ? 24 * 60 * 60 * 1000
        : (range === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000;
      const previousRevenue = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - periodMs),
            lt: startDate,
          },
          paymentStatus: 'PAID',
        },
        _sum: { totalAmount: true },
      });
      const previousTotal = previousRevenue._sum.totalAmount
        ? Number(previousRevenue._sum.totalAmount)
        : 0;
      growthPercentage = previousTotal > 0
        ? Math.round(((totalRevenue - previousTotal) / previousTotal) * 1000) / 10
        : null;
    }

    // 2. Orders by Status Breakdown
    const statusGroups = await prisma.order.groupBy({
      by: ['orderStatus'],
      where: orderWhere,
      _count: { id: true },
    });

    const statusCounts: Record<string, number> = {
      RECEIVED: 0,
      PREPARING: 0,
      READY_TO_PICK: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    statusGroups.forEach((sg) => {
      statusCounts[sg.orderStatus] = sg._count.id;
    });

    // 3. User Metrics
    const studentsCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const staffCount = await prisma.user.count({ where: { role: 'STAFF' } });
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });

    // Aggregate each historical line at its purchase-time price.
    const [hourlyRows, topItemRows, fulfillmentRows] = await Promise.all([
      prisma.$queryRaw<Array<{ hour: number; orders: number }>>`
        SELECT EXTRACT(HOUR FROM o."createdAt")::int AS "hour",
               COUNT(*)::int AS "orders"
        FROM "Order" o
        WHERE ${dateFilter}
          AND EXTRACT(HOUR FROM o."createdAt") BETWEEN 8 AND 16
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<Array<{ name: string; ordersCount: number; revenue: number }>>`
        SELECT m."name" AS "name",
               SUM(oi."quantity")::int AS "ordersCount",
               COALESCE(SUM(oi."quantity" * oi."priceAtPurchase"), 0)::float8 AS "revenue"
        FROM "OrderItem" oi
        JOIN "MenuItem" m ON m."id" = oi."menuItemId"
        JOIN "Order" o ON o."id" = oi."orderId"
        WHERE ${dateFilter}
          AND o."orderStatus" <> 'CANCELLED'
        GROUP BY m."id", m."name"
        ORDER BY SUM(oi."quantity") DESC
        LIMIT 5
      `,
      prisma.$queryRaw<Array<{ averageMinutes: number | null }>>`
        SELECT AVG(EXTRACT(EPOCH FROM (o."deliveredAt" - o."createdAt")) / 60)::float8
                 AS "averageMinutes"
        FROM "Order" o
        WHERE ${dateFilter}
          AND o."orderStatus" = 'DELIVERED'
          AND o."deliveredAt" IS NOT NULL
      `,
    ]);

    const hourlyOrders = new Map(hourlyRows.map((row) => [row.hour, row.orders]));
    const formatHour = (hour: number) =>
      new Date(2000, 0, 1, hour).toLocaleTimeString('en-US', { hour: 'numeric' });
    const hourlyDemand = Array.from({ length: 9 }, (_, index) => {
      const hour = index + 8;
      return { hour: formatHour(hour), orders: hourlyOrders.get(hour) || 0 };
    });
    const peakHour = hourlyRows.reduce<{ hour: number; orders: number } | null>(
      (peak, row) => (!peak || row.orders > peak.orders ? row : peak),
      null
    );
    const peakRushHour = peakHour
      ? `${formatHour(peakHour.hour)} - ${formatHour(peakHour.hour + 1)}`
      : 'No orders';
    const topSellingItems = topItemRows.map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * 100) / 100,
    }));
    const averageFulfillmentMinutes = fulfillmentRows[0]?.averageMinutes;

    // 5. Feedback Aggregates
    const feedbackAgg = await prisma.feedback.aggregate({
      where: startDate ? { createdAt: { gte: startDate } } : {},
      _avg: { rating: true },
      _count: { id: true },
    });
    const averageRating = feedbackAgg._avg.rating
      ? Math.round(feedbackAgg._avg.rating * 10) / 10
      : 0;

    const stats = {
      range,
      financials: {
        revenue: totalRevenue,
        averageOrderValue: avgOrderVal,
        growthPercentage,
      },
      operations: {
        totalOrders: totalOrdersCount,
        activeOrdersNow: statusCounts.RECEIVED + statusCounts.PREPARING + statusCounts.READY_TO_PICK,
        completedOrders: statusCounts.DELIVERED,
        averageFulfillmentMinutes: averageFulfillmentMinutes
          ? Math.round(averageFulfillmentMinutes * 10) / 10
          : 0,
        peakRushHour,
        statusCounts,
      },
      userMetrics: {
        totalRegisteredUsers: studentsCount + staffCount + adminCount,
        studentsCount,
        staffCount,
        adminCount,
      },
      topSellingItems,
      hourlyDemand,
      feedback: {
        averageRating,
        totalCount: feedbackAgg._count.id,
      },
    };

    res.status(200).json({ success: true, data: stats });
  })
);

/**
 * @route   GET /api/admin/feedback
 * @desc    Get student ratings and feedback submissions
 * @access  Private (Admin Only)
 */
router.get(
  '/feedback',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        student: {
          select: { id: true, name: true, email: true, role: true },
        },
        order: {
          select: { id: true, orderNumber: true, totalAmount: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const agg = await prisma.feedback.aggregate({
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0;

    const formatted = feedbacks.map((f) => ({
      id: f.id,
      studentName: f.student?.name || 'Student',
      studentEmail: f.student?.email || '',
      orderNumber: f.order?.orderNumber || '',
      rating: f.rating,
      comment: f.comment || '',
      createdAt: f.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        averageRating,
        totalFeedbacks: agg._count.id,
        list: formatted,
      },
    });
  })
);

/**
 * @route   GET /api/admin/feedback/summary
 * @desc    Get cached, failure-safe feedback insights
 * @access  Private (Admin Only)
 */
router.get(
  '/feedback/summary',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refresh = 'false' } = z.object({
      refresh: z.enum(['true', 'false']).optional(),
    }).parse(req.query);
    const summary = await getFeedbackSummary(refresh === 'true');
    if (!summary) {
      res.status(429).json({
        success: false,
        error: 'Feedback summary refresh is limited to once every 5 minutes.',
      });
      return;
    }
    res.status(200).json({ success: true, data: summary });
  })
);

/**
 * @route   POST /api/admin/cooking-tips/recompute
 * @desc    Recompute staff cooking tips from the last 14 days of item feedback
 * @access  Private (Admin Only)
 */
router.post(
  '/cooking-tips/recompute',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const updatedCount = await recomputeCookingTips();
    res.status(200).json({
      success: true,
      data: { updatedCount },
    });
  })
);

/**
 * @route   GET /api/admin/users
 * @desc    Get user registry with roles and status
 * @access  Private (Admin Only)
 */
router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const users = await getAllUsersList();
    res.status(200).json({
      success: true,
      data: users,
    });
  })
);

/**
 * @route   POST /api/admin/users
 * @desc    Admin provisions a new Staff or Admin user
 * @access  Private (Admin Only)
 */
router.post(
  '/users',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role, institutionId, phone } = createUserSchema.parse(req.body);

    const existing = await findUserByEmailOrId(email);
    if (existing) {
      res.status(409).json({ success: false, error: 'User with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await createNewUser({
      name,
      email,
      passwordHash,
      role,
      institutionId,
      phone,
    });

    res.status(201).json({
      success: true,
      message: `User ${name} provisioned successfully with role ${role}.`,
      data: newUser,
    });
  })
);

/**
 * @route   GET /api/admin/orders
 * @desc    Get comprehensive master orders log from PostgreSQL database
 * @access  Private (Admin Only)
 */
router.get(
  '/orders',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            menuItem: {
              include: { category: true },
            },
          },
        },
        payments: true,
        student: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = orders.map((o) => {
      const totalNum = typeof o.totalAmount === 'number' ? o.totalAmount : Number(o.totalAmount);
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.student?.name || 'Student',
        customerRole: o.student?.role || 'STUDENT',
        items: o.items.map((i) => `${i.menuItem?.name || 'Item'} (x${i.quantity})`).join(', '),
        total: totalNum,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: o.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  })
);

export default router;