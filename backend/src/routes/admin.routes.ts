import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { getAllUsersList, createNewUser, findUserByEmailOrId, Role } from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Protect all admin routes
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

/**
 * @route   GET /api/admin/overview-stats
 * @desc    Get executive-level metrics and analytics
 * @access  Private (Admin Only)
 */
router.get('/overview-stats', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const users = await getAllUsersList();

  const stats = {
    financials: {
      todayRevenue: 28450,
      monthlyRevenue: 642800,
      averageOrderValue: 88.5,
      growthPercentage: 14.2,
    },
    operations: {
      totalOrdersToday: 322,
      activeOrdersNow: 8,
      completedOrdersToday: 314,
      averagePreparationMinutes: 7.4,
      peakRushHour: '12:30 PM - 1:30 PM',
    },
    userMetrics: {
      totalRegisteredUsers: users.length,
      studentsCount: users.filter((u) => u.role === 'STUDENT').length,
      facultyCount: users.filter((u) => u.role === 'FACULTY').length,
      staffCount: users.filter((u) => u.role === 'STAFF').length,
      adminCount: users.filter((u) => u.role === 'ADMIN').length,
    },
    topSellingItems: [
      { name: 'Crispy Ghee Podi Masala Dosa', ordersCount: 142, revenue: 10650 },
      { name: 'South Indian Executive Mini Meals', ordersCount: 118, revenue: 11210 },
      { name: 'Authentic Kumbakonam Filter Coffee', ordersCount: 240, revenue: 7200 },
      { name: 'Steamed Rice Idli with Medu Vada', ordersCount: 94, revenue: 5170 },
    ],
    hourlyDemand: [
      { hour: '8 AM', orders: 42 },
      { hour: '9 AM', orders: 68 },
      { hour: '10 AM', orders: 35 },
      { hour: '11 AM', orders: 28 },
      { hour: '12 PM', orders: 95 },
      { hour: '1 PM', orders: 112 },
      { hour: '2 PM', orders: 46 },
      { hour: '3 PM', orders: 22 },
      { hour: '4 PM', orders: 54 },
    ],
  };

  res.status(200).json({ success: true, data: stats });
}));

/**
 * @route   GET /api/admin/users
 * @desc    Get user registry with roles and status
 * @access  Private (Admin Only)
 */
router.get('/users', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const users = await getAllUsersList();
  res.status(200).json({
    success: true,
    data: users,
  });
}));

/**
 * @route   POST /api/admin/users
 * @desc    Admin provisions a new Staff or Admin user
 * @access  Private (Admin Only)
 */
router.post('/users', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, institutionId, phone } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ success: false, error: 'Name, email, password, and role are required.' });
    return;
  }

  const validRoles: Role[] = ['STUDENT', 'FACULTY', 'STAFF', 'ADMIN', 'VISITOR'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ success: false, error: 'Invalid role specified.' });
    return;
  }

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
}));

/**
 * @route   GET /api/admin/orders
 * @desc    Get comprehensive master orders log
 * @access  Private (Admin Only)
 */
router.get('/orders', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const masterOrders = [
    {
      id: 'ord-1049',
      orderNumber: 'SC-1049',
      customerName: 'Rohit Verma',
      customerRole: 'STUDENT',
      items: 'Steamed Rice Idli with Medu Vada (x2)',
      total: 110,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      orderStatus: 'PENDING',
      time: '13:42',
    },
    {
      id: 'ord-1048',
      orderNumber: 'SC-1048',
      customerName: 'Nethra Sundaram',
      customerRole: 'STUDENT',
      items: 'Crispy Ghee Podi Masala Dosa (x1), Kumbakonam Filter Coffee (x1)',
      total: 105,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      orderStatus: 'PREPARING',
      time: '13:38',
    },
    {
      id: 'ord-1047',
      orderNumber: 'SC-1047',
      customerName: 'Dr. S. Ramanathan',
      customerRole: 'FACULTY',
      items: 'South Indian Executive Mini Meals (x1)',
      total: 95,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      orderStatus: 'READY',
      time: '13:30',
    },
    {
      id: 'ord-1046',
      orderNumber: 'SC-1046',
      customerName: 'Aishwarya K.',
      customerRole: 'STUDENT',
      items: 'Kumbakonam Degree Filter Coffee (x3)',
      total: 90,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      orderStatus: 'COMPLETED',
      time: '13:20',
    },
    {
      id: 'ord-1045',
      orderNumber: 'SC-1045',
      customerName: 'Karthik Raja',
      customerRole: 'STUDENT',
      items: 'Kumbakonam Degree Filter Coffee (x2)',
      total: 60,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      orderStatus: 'COMPLETED',
      time: '13:15',
    },
  ];

  res.status(200).json({
    success: true,
    data: masterOrders,
  });
}));

export default router;