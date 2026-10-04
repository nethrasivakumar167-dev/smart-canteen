import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Staff kitchen order state (in-memory live tracking for responsiveness)
let kitchenOrders = [
  {
    id: 'ord-1048',
    orderNumber: 'SC-1048',
    customerName: 'Nethra Sundaram',
    customerPhone: '+91 98401 23456',
    status: 'PREPARING',
    items: [
      { name: 'Crispy Ghee Podi Masala Dosa', quantity: 1, notes: 'Extra crispy, less oil' },
      { name: 'Kumbakonam Degree Filter Coffee', quantity: 1, notes: 'Medium sugar' },
    ],
    subtotal: 105,
    pickupSlot: '13:45 - 14:00',
    elapsedMinutes: 4,
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
  },
  {
    id: 'ord-1049',
    orderNumber: 'SC-1049',
    customerName: 'Rohit Verma',
    customerPhone: '+91 94441 99887',
    status: 'PENDING',
    items: [
      { name: 'Steamed Rice Idli with Medu Vada (2+1)', quantity: 2, notes: 'Extra sambar' },
    ],
    subtotal: 110,
    pickupSlot: '14:00 - 14:15',
    elapsedMinutes: 1,
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
  },
  {
    id: 'ord-1047',
    orderNumber: 'SC-1047',
    customerName: 'Dr. S. Ramanathan',
    customerPhone: '+91 94440 87654',
    status: 'READY',
    items: [
      { name: 'South Indian Executive Mini Meals', quantity: 1, notes: 'Faculty parcel' },
    ],
    subtotal: 95,
    pickupSlot: '13:30 - 13:45',
    elapsedMinutes: 12,
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 'ord-1045',
    orderNumber: 'SC-1045',
    customerName: 'Karthik Raja',
    customerPhone: '+91 91234 56780',
    status: 'COMPLETED',
    items: [
      { name: 'Kumbakonam Degree Filter Coffee', quantity: 2, notes: '' },
    ],
    subtotal: 60,
    pickupSlot: '13:15',
    elapsedMinutes: 25,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
];

let menuAvailability = [
  { id: 'item-1', name: 'Crispy Ghee Podi Masala Dosa', category: 'Breakfast', isAvailable: true, stockStatus: 'AVAILABLE' },
  { id: 'item-2', name: 'Steamed Rice Idli with Medu Vada', category: 'Breakfast', isAvailable: true, stockStatus: 'AVAILABLE' },
  { id: 'item-3', name: 'South Indian Executive Mini Meals', category: 'Lunch', isAvailable: true, stockStatus: 'AVAILABLE' },
  { id: 'item-4', name: 'Authentic Kumbakonam Filter Coffee', category: 'Beverages', isAvailable: true, stockStatus: 'AVAILABLE' },
  { id: 'item-5', name: 'Paneer Butter Masala Biryani Box', category: 'Lunch', isAvailable: false, stockStatus: 'OUT_OF_STOCK' },
  { id: 'item-6', name: 'Crispy Veg Spring Rolls (4 pcs)', category: 'Snacks', isAvailable: true, stockStatus: 'AVAILABLE' },
];

// Protect all staff routes
router.use(authenticateToken);
router.use(requireRole('STAFF', 'ADMIN'));

/**
 * @route   GET /api/staff/orders
 * @desc    Get all active kitchen orders grouped by status
 * @access  Private (Staff, Admin)
 */
router.get('/orders', (req: AuthenticatedRequest, res: Response): void => {
  const pending = kitchenOrders.filter((o) => o.status === 'PENDING');
  const preparing = kitchenOrders.filter((o) => o.status === 'PREPARING');
  const ready = kitchenOrders.filter((o) => o.status === 'READY');
  const completed = kitchenOrders.filter((o) => o.status === 'COMPLETED');

  res.status(200).json({
    success: true,
    data: {
      all: kitchenOrders,
      counts: {
        pending: pending.length,
        preparing: preparing.length,
        ready: ready.length,
        completed: completed.length,
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
});

/**
 * @route   PATCH /api/staff/orders/:id/status
 * @desc    Update order preparation status
 * @access  Private (Staff, Admin)
 */
router.patch('/orders/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: 'Invalid order status specified.' });
    return;
  }

  const order = kitchenOrders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found in kitchen queue.' });
    return;
  }

  order.status = status;
  res.status(200).json({
    success: true,
    message: `Order #${order.orderNumber} status updated to ${status}.`,
    data: order,
  });
});

/**
 * @route   GET /api/staff/menu-status
 * @desc    Get item availability catalog
 * @access  Private (Staff, Admin)
 */
router.get('/menu-status', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: menuAvailability,
  });
});

/**
 * @route   PATCH /api/staff/menu-status/:id
 * @desc    Toggle menu item availability in kitchen
 * @access  Private (Staff, Admin)
 */
router.patch('/menu-status/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  const item = menuAvailability.find((m) => m.id === id);
  if (!item) {
    res.status(404).json({ success: false, error: 'Menu item not found.' });
    return;
  }

  item.isAvailable = typeof isAvailable === 'boolean' ? isAvailable : !item.isAvailable;
  item.stockStatus = item.isAvailable ? 'AVAILABLE' : 'OUT_OF_STOCK';

  res.status(200).json({
    success: true,
    message: `${item.name} availability is now ${item.isAvailable ? 'ACTIVE' : 'OUT OF STOCK'}.`,
    data: item,
  });
});

export default router;
