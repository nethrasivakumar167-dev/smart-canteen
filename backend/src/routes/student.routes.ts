import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { generateOrderNumber, formatOrder } from '../utils/orderUtils';
import { emitOrderCreated } from '../socket';
import { availableNow, menuTimeWindowsEnabled, unavailableReason } from '../config/menuAvailability';
import { formatMenuItem } from './menu.routes';
import { getStudentRecommendations, invalidateStudentRecommendations } from '../services/recommendationService';
import { recomputeCookingTips } from '../services/feedbackInsightsService';
import {
  generatePickupSlots,
  kolkataDateKey,
  minutesUntilPickupSlot,
  PICKUP_SLOT_CONFIG,
  pickupSlotDayBoundary,
  pickupSlotStrictEnabled,
  validatePickupSlotStart,
} from '../config/pickupSlots';

const router = Router();

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.string().trim().min(1, 'menuItemId is required'),
      quantity: z.number().int().min(1, 'quantity must be at least 1'),
      customizations: z.array(
        z.object({
          groupName: z.string(),
          selectedOption: z.string(),
          additionalPrice: z.number().nonnegative(),
        })
      ).optional(),
    })
  ).min(1, 'Order must contain at least one item'),
  paymentMethod: z.enum(['CASH', 'ONLINE_MOCK', 'DEMO', 'UPI', 'CARD']).default('CASH'),
  pickupSlotStart: z.string().datetime({ offset: true }).optional(),
  specialInstructions: z.string().optional(),
  scheduledTime: z.string().optional(),
});

const orderIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Order ID is required'),
});

const favoriteParamSchema = z.object({
  menuItemId: z.string().trim().min(1, 'Menu item ID is required.'),
});

const feedbackItemTags = [
  'too_spicy',
  'too_salty',
  'bland',
  'cold',
  'undercooked',
  'oily',
  'small_portion',
  'great_taste',
] as const;

const feedbackSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating must be at most 5 stars'),
  comment: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.string().trim().min(1, 'menuItemId is required'),
    tags: z.array(z.enum(feedbackItemTags)).default([]),
  })).optional().superRefine((items, ctx) => {
    if (!items) return;
    const ids = new Set<string>();
    items.forEach((item, index) => {
      if (ids.has(item.menuItemId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'menuItemId'],
          message: 'Each menu item may only be listed once.',
        });
      }
      ids.add(item.menuItemId);
    });
  }),
});

// Protect all student routes
router.use(authenticateToken);
router.use(requireRole('STUDENT', 'ADMIN'));

router.get(
  '/favorites',
  requireRole('STUDENT'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: { menuItem: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    const enforceTimeWindows = menuTimeWindowsEnabled();
    res.status(200).json({
      success: true,
      data: favorites.map(({ menuItem }) => formatMenuItem(menuItem, now, enforceTimeWindows)),
    });
  })
);

router.put(
  '/favorites/:menuItemId',
  requireRole('STUDENT'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { menuItemId } = favoriteParamSchema.parse(req.params);
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { category: true },
    });
    if (!menuItem) {
      res.status(404).json({ success: false, error: 'Menu item not found.' });
      return;
    }
    await prisma.favorite.upsert({
      where: { userId_menuItemId: { userId: req.user!.id, menuItemId } },
      create: { userId: req.user!.id, menuItemId },
      update: { menuItemId },
    });
    invalidateStudentRecommendations(req.user!.id);
    res.status(200).json({
      success: true,
      data: formatMenuItem(menuItem, new Date(), menuTimeWindowsEnabled()),
    });
  })
);

router.delete(
  '/favorites/:menuItemId',
  requireRole('STUDENT'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { menuItemId } = favoriteParamSchema.parse(req.params);
    await prisma.favorite.deleteMany({
      where: { userId: req.user!.id, menuItemId },
    });
    invalidateStudentRecommendations(req.user!.id);
    res.status(200).json({ success: true });
  })
);

router.get(
  '/recommendations',
  requireRole('STUDENT'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const recommendations = await getStudentRecommendations(req.user!.id);
    res.status(200).json({ success: true, data: recommendations });
  })
);

/**
 * @route   POST /api/student/orders
 * @desc    Create a new student order using a Prisma transaction
 * @access  Private (Student, Admin)
 */
router.post(
  '/orders',
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = createOrderSchema.parse(req.body);
    const { items, paymentMethod, specialInstructions } = validatedData;
    const userId = req.user!.id;

    // Standardize payment mode
    const isCash = paymentMethod === 'CASH';
    const pMethod = isCash ? 'CASH' : 'ONLINE_MOCK';
    const pStatus = isCash ? 'PENDING' : 'PAID';
    const enforceTimeWindows = menuTimeWindowsEnabled();
    const strictSlots = pickupSlotStrictEnabled();
    const availabilityCheckedAt = new Date();

    try {
      const newOrder = await prisma.$transaction(async (tx) => {
        const dateKey = kolkataDateKey(availabilityCheckedAt);
        const opening = pickupSlotDayBoundary(dateKey, PICKUP_SLOT_CONFIG.CANTEEN_OPEN);
        const closing = pickupSlotDayBoundary(dateKey, PICKUP_SLOT_CONFIG.CANTEEN_CLOSE);
        const existingSlots = await tx.order.findMany({
          where: {
            pickupSlotStart: { gte: opening, lt: closing },
            orderStatus: { not: 'CANCELLED' },
          },
          select: { pickupSlotStart: true },
        });
        const capacityByStart = new Map<number, number>();
        existingSlots.forEach((order) => {
          if (!order.pickupSlotStart) return;
          const key = order.pickupSlotStart.getTime();
          capacityByStart.set(key, (capacityByStart.get(key) || 0) + 1);
        });
        const slotStart = validatedData.pickupSlotStart
          ? new Date(validatedData.pickupSlotStart)
          : generatePickupSlots(availabilityCheckedAt, capacityByStart, strictSlots)
              .find((slot) => slot.bookable)?.start;
        if (!slotStart) throw new Error('NO_BOOKABLE_SLOT');
        const slotError = validatePickupSlotStart(slotStart, availabilityCheckedAt, strictSlots);
        if (slotError) throw new Error(`INVALID_PICKUP_SLOT:${slotError}`);

        const slotOccupancy = capacityByStart.get(slotStart.getTime()) || 0;
        if (slotOccupancy >= PICKUP_SLOT_CONFIG.SLOT_CAPACITY) {
          throw new Error('PICKUP_SLOT_FULL');
        }

        let totalAmount = 0;
        const orderItemsData = [];
        const quantitiesByMenuItem = new Map<string, number>();

        for (const itemInput of items) {
          quantitiesByMenuItem.set(
            itemInput.menuItemId,
            (quantitiesByMenuItem.get(itemInput.menuItemId) || 0) + itemInput.quantity
          );
        }

        for (const [menuItemId, quantity] of quantitiesByMenuItem) {
          const menuItem = await tx.menuItem.findUnique({
            where: { id: menuItemId },
            include: { category: true },
          });

          if (!menuItem) {
            throw new Error(`NOT_FOUND:${menuItemId}`);
          }

          if (!menuItem.isAvailable) {
            throw new Error(`ITEM_UNAVAILABLE:${menuItem.name}`);
          }

          if (!menuItem.category || !menuItem.category.isAvailable) {
            throw new Error(`CATEGORY_UNAVAILABLE:${menuItem.name}`);
          }

          if (enforceTimeWindows && !availableNow({ ...menuItem, isAvailable: true }, slotStart)) {
            throw new Error(
              `ITEM_UNAVAILABLE_TIME:${menuItem.name}:${unavailableReason({ ...menuItem, isAvailable: true }, slotStart) || 'Outside serving hours'}`
            );
          }

          const unitPrice = Number(menuItem.price);
          const lineTotal = unitPrice * quantity;
          totalAmount += lineTotal;

          orderItemsData.push({
            menuItemId: menuItem.id,
            quantity,
            priceAtPurchase: unitPrice,
          });
        }

        // Generate unique order number
        let orderNumber = generateOrderNumber();
        let existing = await tx.order.findUnique({ where: { orderNumber } });
        while (existing) {
          orderNumber = generateOrderNumber();
          existing = await tx.order.findUnique({ where: { orderNumber } });
        }

        const order = await tx.order.create({
          data: {
            orderNumber,
            studentId: userId,
            totalAmount,
            paymentMethod: pMethod,
            paymentStatus: pStatus,
            orderStatus: 'RECEIVED',
            pickupSlotStart: slotStart,
            items: {
              create: orderItemsData,
            },
            payments: {
              create: [
                {
                  amount: totalAmount,
                  method: pMethod,
                  status: pStatus,
                  transactionRef: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                },
              ],
            },
          },
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
              select: { id: true, name: true, email: true, institutionId: true, phone: true },
            },
          },
        });

        return order;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      const formatted = formatOrder(newOrder);
      invalidateStudentRecommendations(userId);

      // Emit Socket.IO real-time order creation event
      emitOrderCreated(formatted);

      res.status(201).json({
        success: true,
        message: 'Order created successfully!',
        data: formatted,
      });
    } catch (err: any) {
      if (typeof err?.message === 'string') {
        if (err.message.startsWith('NOT_FOUND:')) {
          res.status(404).json({
            success: false,
            error: 'One or more menu items were not found.',
          });
          return;
        }
        if (err.message.startsWith('ITEM_UNAVAILABLE_TIME:')) {
          const [, name, ...reasonParts] = err.message.split(':');
          res.status(400).json({
            success: false,
            error: `Dish "${name}" is not available now. ${reasonParts.join(':')}`,
          });
          return;
        }
        if (err.message.startsWith('INVALID_PICKUP_SLOT:')) {
          res.status(400).json({ success: false, error: err.message.slice('INVALID_PICKUP_SLOT:'.length) });
          return;
        }
        if (err.message === 'PICKUP_SLOT_FULL') {
          res.status(409).json({ success: false, error: 'That pickup slot is full. Please choose another slot.' });
          return;
        }
        if (err.message === 'NO_BOOKABLE_SLOT') {
          res.status(400).json({ success: false, error: 'No pickup slots are currently bookable today.' });
          return;
        }
        if (err.message.startsWith('ITEM_UNAVAILABLE:') || err.message.startsWith('CATEGORY_UNAVAILABLE:')) {
          const name = err.message.split(':')[1];
          res.status(400).json({
            success: false,
            error: `Dish "${name}" or its category is currently unavailable.`,
          });
          return;
        }
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        res.status(409).json({
          success: false,
          error: 'That slot just filled, pick another.',
        });
        return;
      }
      throw err;
    }
  })
);

router.get(
  '/slots',
  asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    const now = new Date();
    const dateKey = kolkataDateKey(now);
    const opening = pickupSlotDayBoundary(dateKey, PICKUP_SLOT_CONFIG.CANTEEN_OPEN);
    const closing = pickupSlotDayBoundary(dateKey, PICKUP_SLOT_CONFIG.CANTEEN_CLOSE);
    const existingSlots = await prisma.order.findMany({
      where: {
        pickupSlotStart: { gte: opening, lt: closing },
        orderStatus: { not: 'CANCELLED' },
      },
      select: { pickupSlotStart: true },
    });
    const capacityByStart = new Map<number, number>();
    existingSlots.forEach((order) => {
      if (!order.pickupSlotStart) return;
      const key = order.pickupSlotStart.getTime();
      capacityByStart.set(key, (capacityByStart.get(key) || 0) + 1);
    });
    const slots = generatePickupSlots(now, capacityByStart).map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      label: slot.label,
      remainingCapacity: slot.remainingCapacity,
      bookable: slot.bookable,
      unavailableReason: slot.unavailableReason,
    }));
    res.status(200).json({ success: true, data: slots });
  })
);

/**
 * @route   POST /api/student/orders/:id/feedback
 * @desc    Submit rating and feedback for a completed/delivered order
 * @access  Private (Student, Admin)
 */
router.post(
  '/orders/:id/feedback',
  requireRole('STUDENT'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = orderIdParamSchema.parse(req.params);
    const { rating, comment, items } = feedbackSchema.parse(req.body);
    const userId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        ...(req.user!.role === 'STUDENT' ? { studentId: userId } : {}),
      },
      include: {
        feedback: true,
        items: { select: { menuItemId: true } },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found or access denied.' });
      return;
    }

    if (order.orderStatus !== 'DELIVERED') {
      res.status(400).json({
        success: false,
        error: 'Feedback can only be submitted for completed/delivered orders.',
      });
      return;
    }

    if (order.feedback) {
      res.status(409).json({
        success: false,
        error: 'Feedback has already been submitted for this order.',
      });
      return;
    }

    const orderedMenuItemIds = new Set(order.items.map((item) => item.menuItemId));
    if (items?.some((item) => !orderedMenuItemIds.has(item.menuItemId))) {
      res.status(400).json({
        success: false,
        error: 'Feedback items must belong to the submitted order.',
      });
      return;
    }

    let created;
    try {
      created = await prisma.feedback.create({
        data: {
          studentId: userId,
          orderId: order.id,
          rating,
          comment: comment?.trim() || null,
          ...(items?.length
            ? {
                items: {
                  create: items.map(({ menuItemId, tags }) => ({ menuItemId, tags })),
                },
              }
            : {}),
        },
        include: {
          student: { select: { id: true, name: true, email: true } },
          items: true,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        res.status(409).json({
          success: false,
          error: 'Feedback has already been submitted for this order.',
        });
        return;
      }
      throw err;
    }

    let cookingTipsUpdated = true;
    if (items?.length) {
      try {
        await recomputeCookingTips(items.map((item) => item.menuItemId));
      } catch (error) {
        cookingTipsUpdated = false;
        console.error('[CookingTips] Failed to recompute tips after feedback submission:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: cookingTipsUpdated
        ? 'Thank you for your rating and feedback!'
        : 'Feedback was saved, but staff cooking tips could not be refreshed.',
      data: created,
    });
  })
);

/**
 * @route   GET /api/student/feedback
 * @desc    Get feedback submitted by the current student
 * @access  Private (Student)
 */
router.get(
  '/feedback',
  requireRole('STUDENT'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const feedback = await prisma.feedback.findMany({
      where: { studentId: req.user!.id },
      include: {
        order: { select: { orderNumber: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback.map((entry) => ({
        id: entry.id,
        rating: entry.rating,
        comment: entry.comment,
        orderNumber: entry.order.orderNumber,
        createdAt: entry.createdAt,
      })),
    });
  })
);

/**
 * @route   GET /api/student/orders
 * @desc    Get order history for current authenticated student
 * @access  Private (Student, Admin)
 */
router.get(
  '/orders',
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const orders = await prisma.order.findMany({
      where: { studentId: req.user!.id },
      include: {
        items: {
          include: {
            menuItem: {
              include: { category: true },
            },
          },
        },
        payments: true,
        feedback: { include: { items: true } },
        student: {
          select: { id: true, name: true, email: true, institutionId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = orders.map(formatOrder);

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  })
);

/**
 * @route   GET /api/student/orders/:id
 * @desc    Get single order details by ID or orderNumber
 * @access  Private (Student, Admin)
 */
router.get(
  '/orders/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = orderIdParamSchema.parse(req.params);

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        ...(req.user!.role === 'STUDENT' ? { studentId: req.user!.id } : {}),
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: { category: true },
            },
          },
        },
        payments: true,
        feedback: { include: { items: true } },
        student: {
          select: { id: true, name: true, email: true, institutionId: true },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found or access denied.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatOrder(order),
    });
  })
);

/**
 * @route   GET /api/student/dashboard-summary
 * @desc    Get student personalized dashboard data
 * @access  Private (Student, Admin)
 */
router.get(
  '/dashboard-summary',
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const [orders, favoritesCount] = await Promise.all([
      prisma.order.findMany({
        where: { studentId: userId },
        include: {
          items: {
            include: {
              menuItem: {
                include: { category: true },
              },
            },
          },
          payments: true,
          feedback: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    const activeOrders = orders.filter((o) =>
      ['RECEIVED', 'PREPARING', 'READY_TO_PICK'].includes(o.orderStatus)
    );
    const latestOrder = orders[0];
    const trackedOrder = activeOrders[0] ||
      (latestOrder?.orderStatus === 'DELIVERED' ? latestOrder : null);
    const activeOrder = trackedOrder ? formatOrder(trackedOrder) : null;

    const formattedOrders = orders.map(formatOrder);

    const summary = {
      user: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        studentId: req.user!.institutionId ?? null,
        role: req.user!.role,
      },
      stats: {
        activeOrdersCount: activeOrders.length,
        totalOrdersCount: orders.length,
        savedFavoritesCount: favoritesCount,
      },
      activeOrder: activeOrder
        ? {
            id: activeOrder.id,
            orderNumber: activeOrder.orderNumber,
            status: activeOrder.orderStatus,
            estimatedMinutes: activeOrder.orderStatus === 'DELIVERED'
              ? null
              : minutesUntilPickupSlot(trackedOrder.pickupSlotStart, new Date()),
            pickupSlot: activeOrder.pickupSlot,
            items: activeOrder.items.map((i: any) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
            })),
            total: activeOrder.totalAmount,
          }
        : null,
      recentOrders: formattedOrders.slice(0, 5).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        date: new Date(o.createdAt).toLocaleDateString(),
        items: o.items.map((i) => i.name).join(', '),
        total: o.totalAmount,
        status: o.orderStatus,
      })),
      quickFavorites: [],
    };

    res.status(200).json({ success: true, data: summary });
  })
);

export default router;