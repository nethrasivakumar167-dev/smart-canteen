import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { formatOrder } from '../utils/orderUtils';
import { availableNow, menuTimeWindowsEnabled, unavailableReason } from '../config/menuAvailability';
import { emitOrderStatusUpdated, emitAvailabilityUpdated } from '../socket';
import { OrderStatus } from '@prisma/client';

const router = Router();

const statusUpdateSchema = z.object({
  status: z.enum(['RECEIVED', 'PREPARING', 'READY_TO_PICK', 'DELIVERED', 'CANCELLED', 'PENDING', 'READY', 'COMPLETED']),
  verificationId: z.string().trim().min(1).optional(),
}).superRefine((value, context) => {
  if (value.status === 'DELIVERED' && !value.verificationId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verificationId'],
      message: 'Order ID is required to verify delivery.',
    });
  }
});

const verifyDeliverySchema = z.object({
  orderNumber: z.string().trim().min(1).optional(),
  id: z.string().trim().min(1).optional(),
}).refine((data) => data.orderNumber || data.id, {
  message: 'Either orderNumber or id must be provided for delivery verification.',
});

const toggleAvailabilitySchema = z.object({
  isAvailable: z.boolean().optional(),
  isSpecial: z.boolean().optional(),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_TO_PICK', 'CANCELLED'],
  READY_TO_PICK: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const orderInclude = {
  items: {
    include: {
      menuItem: {
        include: { category: true },
      },
    },
  },
  payments: true,
  student: {
    select: { id: true, name: true, email: true, phone: true },
  },
};

async function transitionOrder(
  orderId: string,
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  staffId: string
) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, orderStatus: currentStatus },
      data: {
        orderStatus: targetStatus,
        ...(targetStatus === 'DELIVERED'
          ? { deliveredAt: new Date(), deliveredById: staffId, paymentStatus: 'PAID' }
          : {}),
      },
    });

    if (result.count !== 1) return null;

    if (targetStatus === 'DELIVERED') {
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: 'PAID' },
      });
    }

    const updated = await tx.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });

    if (!updated) {
      throw new Error(`Order ${orderId} disappeared after its status transition.`);
    }

    return updated;
  });
}

// Map legacy status strings if received from UI buttons
function mapLegacyStatus(status: string): OrderStatus {
  if (status === 'PENDING') return 'RECEIVED';
  if (status === 'READY') return 'READY_TO_PICK';
  if (status === 'COMPLETED') return 'DELIVERED';
  return status as OrderStatus;
}

// Protect all staff routes
router.use(authenticateToken);
router.use(requireRole('STAFF', 'ADMIN'));

/**
 * @route   GET /api/staff/orders
 * @desc    Get all active kitchen orders grouped by status
 * @access  Private (Staff, Admin)
 */
router.get(
  '/orders',
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
          select: { id: true, name: true, email: true, phone: true, institutionId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = orders.map(formatOrder).sort((left, right) => {
      if (left.pickupSlotStart && right.pickupSlotStart) {
        const slotOrder = left.pickupSlotStart.getTime() - right.pickupSlotStart.getTime();
        if (slotOrder !== 0) return slotOrder;
      } else if (left.pickupSlotStart) return -1;
      else if (right.pickupSlotStart) return 1;
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });

    const pending = formatted.filter((o) => o.orderStatus === 'RECEIVED');
    const preparing = formatted.filter((o) => o.orderStatus === 'PREPARING');
    const ready = formatted.filter((o) => o.orderStatus === 'READY_TO_PICK');
    const completed = formatted.filter((o) => o.orderStatus === 'DELIVERED');
    const cancelled = formatted.filter((o) => o.orderStatus === 'CANCELLED');

    res.status(200).json({
      success: true,
      data: {
        all: formatted,
        counts: {
          pending: pending.length,
          preparing: preparing.length,
          ready: ready.length,
          completed: completed.length,
          cancelled: cancelled.length,
          totalActive: pending.length + preparing.length + ready.length,
        },
        grouped: {
          pending,
          preparing,
          ready,
          completed,
        },
      },
    });
  })
);

/**
 * @route   POST /api/staff/verify-delivery
 * @desc    Staff verifies student pickup using Order ID/Number
 * @access  Private (Staff, Admin)
 */
router.post(
  '/verify-delivery',
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { orderNumber, id } = verifyDeliverySchema.parse(req.body);
    const lookupId = orderNumber || id!;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: lookupId }, { id: lookupId }],
      },
      include: {
        ...orderInclude,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: `Order #${lookupId} not found in canteen database.`,
      });
      return;
    }

    if (order.orderStatus === 'DELIVERED') {
      res.status(400).json({
        success: false,
        error: `Duplicate delivery: Order #${order.orderNumber} has already been delivered.`,
      });
      return;
    }

    if (order.orderStatus !== 'READY_TO_PICK') {
      res.status(400).json({
        success: false,
        error: `Invalid delivery: Order #${order.orderNumber} is in state ${order.orderStatus}. Order must be in READY_TO_PICK state before delivery.`,
      });
      return;
    }

    const updated = await transitionOrder(order.id, 'READY_TO_PICK', 'DELIVERED', req.user!.id);
    if (!updated) {
      res.status(409).json({
        success: false,
        error: `Order #${order.orderNumber} changed state before delivery could be recorded. Refresh and verify it again.`,
      });
      return;
    }

    const formatted = formatOrder(updated);

    emitOrderStatusUpdated(formatted);

    res.status(200).json({
      success: true,
      message: `Order #${updated.orderNumber} verified and delivered successfully.`,
      data: formatted,
    });
  })
);

/**
 * @route   PATCH /api/staff/orders/:id/status
 * @desc    Update order preparation status with strict transition and delivery validation
 * @access  Private (Staff, Admin)
 */
router.patch(
  '/orders/:id/status',
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const bodyValidation = statusUpdateSchema.parse(req.body);
    const targetStatus = mapLegacyStatus(bodyValidation.status);

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
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
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found in kitchen queue.' });
      return;
    }

    const currentStatus = order.orderStatus;

    if (
      targetStatus === 'DELIVERED'
      && bodyValidation.verificationId !== order.id
      && bodyValidation.verificationId !== order.orderNumber
    ) {
      res.status(400).json({
        success: false,
        error: 'The entered Order ID does not match this order.',
      });
      return;
    }

    if (currentStatus === targetStatus) {
      res.status(200).json({
        success: true,
        message: `Order #${order.orderNumber} is already in state ${targetStatus}.`,
        data: formatOrder(order),
      });
      return;
    }

    // Explicit check for delivery verification rules
    if (targetStatus === 'DELIVERED') {
      if (currentStatus === 'DELIVERED') {
        res.status(400).json({
          success: false,
          error: `Duplicate delivery: Order #${order.orderNumber} has already been delivered.`,
        });
        return;
      }
      if (currentStatus !== 'READY_TO_PICK') {
        res.status(400).json({
          success: false,
          error: `Invalid delivery: Order #${order.orderNumber} is in state ${currentStatus}. Order must be in READY_TO_PICK state before delivery.`,
        });
        return;
      }
    }

    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      res.status(400).json({
        success: false,
        error: `Cannot transition order status from ${currentStatus} to ${targetStatus}.`,
      });
      return;
    }

    const updated = await transitionOrder(order.id, currentStatus, targetStatus, req.user!.id);
    if (!updated) {
      res.status(409).json({
        success: false,
        error: `Order #${order.orderNumber} changed state before the update could be recorded. Refresh the kitchen queue and try again.`,
      });
      return;
    }

    const formatted = formatOrder(updated);

    emitOrderStatusUpdated(formatted);

    res.status(200).json({
      success: true,
      message: `Order #${updated.orderNumber} status updated to ${targetStatus}.`,
      data: formatted,
    });
  })
);

/**
 * @route   GET /api/staff/menu-status
 * @desc    Get item availability catalog from Prisma DB
 * @access  Private (Staff, Admin)
 */
router.get(
  '/menu-status',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const now = new Date();
    const enforceTimeWindows = menuTimeWindowsEnabled();
    const items = await prisma.menuItem.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = items.map((item) => {
      const timeAvailable = enforceTimeWindows ? availableNow(item, now) : item.isAvailable;
      const effectiveAvailable = item.isAvailable && (item.category?.isAvailable ?? true) && timeAvailable;
      return {
      id: item.id,
      name: item.name,
      category: item.category?.name || 'General',
      cuisine: item.cuisines,
      cuisines: item.cuisines,
      categoryId: item.categoryId,
      categoryAvailable: item.category?.isAvailable ?? true,
      isAvailable: item.isAvailable,
      availableNow: effectiveAvailable,
      unavailableReason: !item.isAvailable
        ? 'Disabled by staff'
        : !item.category?.isAvailable
          ? 'Disabled by staff'
          : enforceTimeWindows
            ? unavailableReason(item, now)
            : null,
      mealTimes: item.mealTimes,
      isSpecial: item.isSpecial,
      stockStatus: item.isAvailable ? 'AVAILABLE' : 'OUT_OF_STOCK',
      price: Number(item.price),
      };
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  })
);

/**
 * @route   PATCH /api/staff/menu-status/:id
 * @desc    Toggle menu item availability in kitchen
 * @access  Private (Staff, Admin)
 */
router.patch(
  '/menu-status/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { isAvailable, isSpecial } = toggleAvailabilitySchema.parse(req.body);

    const item = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      res.status(404).json({ success: false, error: 'Menu item not found.' });
      return;
    }

    const updatesAvailability = isAvailable !== undefined || isSpecial === undefined;
    const nextAvailable = isAvailable !== undefined ? isAvailable : !item.isAvailable;

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(updatesAvailability ? { isAvailable: nextAvailable } : {}),
        ...(isSpecial !== undefined ? { isSpecial } : {}),
      },
    });

    if (updatesAvailability) {
      emitAvailabilityUpdated({ type: 'MENU_ITEM', id: updated.id, isAvailable: updated.isAvailable });
    }

    res.status(200).json({
      success: true,
      message: updatesAvailability
        ? `${updated.name} availability is now ${updated.isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}.`
        : `${updated.name} special status is now ${updated.isSpecial ? 'ON' : 'OFF'}.`,
      data: {
        id: updated.id,
        name: updated.name,
        isAvailable: updated.isAvailable,
        isSpecial: updated.isSpecial,
        stockStatus: updated.isAvailable ? 'AVAILABLE' : 'OUT_OF_STOCK',
      },
    });
  })
);

/**
 * @route   PATCH /api/staff/categories/:id/availability
 * @desc    Toggle category availability in kitchen
 * @access  Private (Staff, Admin)
 */
router.patch(
  '/categories/:id/availability',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { isAvailable } = toggleAvailabilitySchema.parse(req.body);

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found.' });
      return;
    }

    const nextAvailable = isAvailable !== undefined ? isAvailable : !category.isAvailable;

    const updated = await prisma.category.update({
      where: { id },
      data: { isAvailable: nextAvailable },
    });

    emitAvailabilityUpdated({ type: 'CATEGORY', id: updated.id, isAvailable: updated.isAvailable });

    res.status(200).json({
      success: true,
      message: `Category "${updated.name}" availability is now ${updated.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}.`,
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