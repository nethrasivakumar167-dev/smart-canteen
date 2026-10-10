import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import app from '../src/app';
import { prisma } from '../src/prisma';
import bcrypt from 'bcryptjs';

describe('Part 10: Complete Main Flow E2E Integration Test', () => {
  const mockPassword = 'password123';
  let hashedPassword: string;

  const mockStudent = {
    id: 'e2e-student-1',
    name: 'E2E Student',
    email: 'e2estudent@campus.edu',
    passwordHash: '',
    role: 'STUDENT',
    institutionId: 'STU-999',
    phone: '9876543210',
    isDemo: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStaff = {
    id: 'e2e-staff-1',
    name: 'Chef Raj',
    email: 'e2estaff@canteen.edu',
    passwordHash: '',
    role: 'STAFF',
    institutionId: 'STF-101',
    phone: null,
    isDemo: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin = {
    id: 'e2e-admin-1',
    name: 'Admin Manager',
    email: 'e2eadmin@canteen.edu',
    passwordHash: '',
    role: 'ADMIN',
    institutionId: 'ADM-001',
    phone: null,
    isDemo: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory = {
    id: 'cat-1',
    name: 'South Indian Breakfast',
    slug: 'south-indian-breakfast',
    description: 'Fresh & authentic breakfast',
    isAvailable: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMenuItem = {
    id: 'item-1',
    categoryId: 'cat-1',
    name: 'Ghee Podi Dosa',
    description: 'Crispy rice crepe with ghee',
    price: 75.0,
    imageUrl: null,
    isVegetarian: true,
    ingredients: [],
    allergens: [],
    preparationTime: 10,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory,
  };

  let studentToken: string;
  let staffToken: string;
  let adminToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    hashedPassword = await bcrypt.hash(mockPassword, 10);

    mockStudent.passwordHash = hashedPassword;
    mockStaff.passwordHash = hashedPassword;
    mockAdmin.passwordHash = hashedPassword;
  });

  it('runs complete lifecycle: register -> login -> menu -> order -> payment -> status update -> delivery -> feedback -> admin analytics', async () => {
    // 1. Register Student
    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.user, 'create').mockResolvedValue(mockStudent as any);

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'E2E Student',
        email: 'e2estudent@campus.edu',
        password: mockPassword,
        institutionId: 'STU-999',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);

    // 2. Student Login
    vi.spyOn(prisma.user, 'findFirst').mockImplementation(async (args: any) => {
      const orList = args?.where?.OR || [];
      const email = orList[0]?.email?.equals || args?.where?.email;
      if (email === mockStudent.email) return mockStudent as any;
      if (email === mockStaff.email) return mockStaff as any;
      if (email === mockAdmin.email) return mockAdmin as any;
      return null;
    });

    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.email === mockStudent.email || args.where.id === mockStudent.id) return mockStudent as any;
      if (args.where.email === mockStaff.email || args.where.id === mockStaff.id) return mockStaff as any;
      if (args.where.email === mockAdmin.email || args.where.id === mockAdmin.id) return mockAdmin as any;
      return null;
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'e2estudent@campus.edu',
        password: mockPassword,
        portal: 'STUDENT',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    studentToken = loginRes.body.token;

    // Login Staff & Admin
    const staffLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'e2estaff@canteen.edu', password: mockPassword, portal: 'STAFF' });
    staffToken = staffLoginRes.body.token;

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'e2eadmin@canteen.edu', password: mockPassword, portal: 'ADMIN' });
    adminToken = adminLoginRes.body.token;

    // 3. Browse Menu
    vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockMenuItem] as any);

    const menuRes = await request(app).get('/api/menu');
    expect(menuRes.status).toBe(200);
    expect(menuRes.body.data).toHaveLength(1);
    expect(menuRes.body.data[0].name).toBe('Ghee Podi Dosa');

    // 4. Create Order & Process Payment
    let currentOrderStatus = 'RECEIVED';
    const mockCreatedOrder = {
      id: 'ord-e2e-100',
      orderNumber: 'SC-100200',
      studentId: mockStudent.id,
      totalAmount: 75.0,
      paymentMethod: 'ONLINE_MOCK',
      paymentStatus: 'PAID',
      orderStatus: 'RECEIVED',
      estimatedPrepTime: 10,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item-snap-1',
          orderId: 'ord-e2e-100',
          menuItemId: mockMenuItem.id,
          name: mockMenuItem.name,
          priceAtPurchase: 75.0,
          quantity: 1,
          menuItem: mockMenuItem,
        },
      ],
      student: mockStudent,
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      const tx = {
        menuItem: {
          findUnique: vi.fn().mockResolvedValue(mockMenuItem),
        },
        order: {
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue(mockCreatedOrder),
          findUnique: vi.fn().mockResolvedValue(null),
        },
        orderItem: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        payment: {
          create: vi.fn().mockResolvedValue({
            id: 'pay-1',
            orderId: 'ord-e2e-100',
            amount: 75.0,
            paymentMethod: 'ONLINE_MOCK',
            status: 'COMPLETED',
          }),
        },
      };
      return cb(tx);
    });

    const orderRes = await request(app)
      .post('/api/student/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        items: [{ menuItemId: mockMenuItem.id, quantity: 1 }],
        paymentMethod: 'ONLINE_MOCK',
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.orderNumber).toBe('SC-100200');

    // 5. Staff Updates Order Status (RECEIVED -> PREPARING -> READY_TO_PICK)
    vi.spyOn(prisma.order, 'findFirst').mockImplementation(async () => {
      return { ...mockCreatedOrder, orderStatus: currentOrderStatus } as any;
    });

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        order: {
          updateMany: vi.fn().mockImplementation(async (args: any) => {
            if (args.where.orderStatus !== currentOrderStatus) return { count: 0 };
            currentOrderStatus = args.data.orderStatus;
            return { count: 1 };
          }),
          findUnique: vi.fn().mockImplementation(async () => ({
            ...mockCreatedOrder,
            orderStatus: currentOrderStatus,
            paymentStatus: currentOrderStatus === 'DELIVERED' ? 'PAID' : mockCreatedOrder.paymentStatus,
          })),
        },
        payment: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(tx);
    });

    const prepRes = await request(app)
      .patch('/api/staff/orders/ord-e2e-100/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'PREPARING' });

    expect(prepRes.status).toBe(200);
    expect(prepRes.body.data.orderStatus).toBe('PREPARING');

    const readyRes = await request(app)
      .patch('/api/staff/orders/ord-e2e-100/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'READY_TO_PICK' });

    expect(readyRes.status).toBe(200);
    expect(readyRes.body.data.orderStatus).toBe('READY_TO_PICK');

    // 6. Staff Performs Delivery Verification (READY_TO_PICK -> DELIVERED)
    vi.spyOn(prisma.order, 'findFirst').mockImplementation(async () => {
      return { ...mockCreatedOrder, orderStatus: currentOrderStatus } as any;
    });

    const deliverRes = await request(app)
      .post('/api/staff/verify-delivery')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ orderNumber: 'SC-100200' });

    expect(deliverRes.status).toBe(200);
    expect(deliverRes.body.success).toBe(true);
    expect(deliverRes.body.data.orderStatus).toBe('DELIVERED');

    // 7. Student Submits Feedback for DELIVERED order
    const mockFeedback = {
      id: 'fb-e2e-1',
      studentId: mockStudent.id,
      orderId: mockCreatedOrder.id,
      rating: 5,
      comment: 'Super fast and hot food!',
      createdAt: new Date(),
      items: [],
    };

    vi.spyOn(prisma.feedback, 'create').mockResolvedValue(mockFeedback as any);

    const feedbackRes = await request(app)
      .post('/api/student/orders/SC-100200/feedback')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ rating: 5, comment: 'Super fast and hot food!' });

    expect(feedbackRes.status).toBe(201);
    expect(feedbackRes.body.data.rating).toBe(5);

    // 8. Admin Retrieves Analytics & AI Feedback Summary
    vi.spyOn(prisma.order, 'count').mockResolvedValue(1);
    vi.spyOn(prisma.order, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 75.0 } } as any);
    vi.spyOn(prisma.order, 'groupBy').mockResolvedValue([{ orderStatus: 'DELIVERED', _count: { id: 1 } }] as any);
    vi.spyOn(prisma.user, 'count').mockResolvedValue(3);
    vi.spyOn(prisma, '$queryRaw').mockResolvedValue([]);
    vi.spyOn(prisma.feedback, 'aggregate').mockResolvedValue({ _avg: { rating: 5.0 }, _count: { id: 1 } } as any);
    vi.spyOn(prisma.feedback, 'findMany').mockResolvedValue([mockFeedback] as any);

    const statsRes = await request(app)
      .get('/api/admin/overview-stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.financials.revenue).toBe(75);

    const aiSummaryRes = await request(app)
      .get('/api/admin/feedback/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(aiSummaryRes.status).toBe(200);
    expect(aiSummaryRes.body.data.themes).toBeDefined();
  });
});
