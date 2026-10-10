import request from 'supertest';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../src/app';
import { prisma } from '../src/prisma';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

describe('Order Creation, Availability, Payment, Transitions & Authorization API', () => {
  const originalStrictSetting = process.env.PICKUP_SLOT_STRICT;
  const originalMenuWindowSetting = process.env.MENU_TIME_WINDOWS;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-32-chars-minimum-length-for-jwt-signing';

  const mockStudentUser = {
    id: 'user-student-1',
    name: 'Student User',
    email: 'student@campus.edu',
    role: 'STUDENT',
    isActive: true,
  };

  const mockStaffUser = {
    id: 'user-staff-1',
    name: 'Staff Chef',
    email: 'staff@campus.edu',
    role: 'STAFF',
    isActive: true,
  };

  const studentToken = jwt.sign(
    { userId: mockStudentUser.id, email: mockStudentUser.email, role: mockStudentUser.role },
    JWT_SECRET
  );

  const staffToken = jwt.sign(
    { userId: mockStaffUser.id, email: mockStaffUser.email, role: mockStaffUser.role },
    JWT_SECRET
  );

  const mockCategoryAvailable = {
    id: 'cat-breakfast-id',
    name: 'Breakfast',
    slug: 'breakfast',
    isAvailable: true,
  };

  const mockCategoryUnavailable = {
    id: 'cat-inactive-id',
    name: 'Discontinued Category',
    slug: 'discontinued',
    isAvailable: false,
  };

  const mockAvailableItem = {
    id: 'item-dosa-1',
    categoryId: 'cat-breakfast-id',
    name: 'Crispy Podi Dosa',
    price: 75.0,
    isAvailable: true,
    category: mockCategoryAvailable,
  };

  const mockUnavailableItem = {
    id: 'item-disabled-2',
    categoryId: 'cat-breakfast-id',
    name: 'Out of Stock Dosa',
    price: 80.0,
    isAvailable: false,
    category: mockCategoryAvailable,
  };

  const mockItemInUnavailableCat = {
    id: 'item-inactive-3',
    categoryId: 'cat-inactive-id',
    name: 'Inactive Category Dish',
    price: 120.0,
    isAvailable: true,
    category: mockCategoryUnavailable,
  };

  const mockCreatedOrder = {
    id: 'ord-uuid-1',
    orderNumber: 'SC-7K4M9Q',
    studentId: mockStudentUser.id,
    totalAmount: 75.0,
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    orderStatus: 'RECEIVED',
    deliveredAt: null,
    deliveredById: null,
    createdAt: new Date('2026-10-10T05:00:00.000Z'),
    updatedAt: new Date('2026-10-10T05:00:00.000Z'),
    items: [
      {
        id: 'ord-item-1',
        orderId: 'ord-uuid-1',
        menuItemId: mockAvailableItem.id,
        quantity: 1,
        priceAtPurchase: 75.0,
        menuItem: mockAvailableItem,
      },
    ],
    payments: [
      {
        id: 'pay-1',
        amount: 75.0,
        method: 'CASH',
        status: 'PENDING',
        transactionRef: 'TXN-12345',
      },
    ],
    student: mockStudentUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-10T05:00:00.000Z'));
    process.env.PICKUP_SLOT_STRICT = 'false';
    process.env.MENU_TIME_WINDOWS = 'false';
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.id === mockStudentUser.id) return mockStudentUser as any;
      if (args.where.id === mockStaffUser.id) return mockStaffUser as any;
      return null;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalStrictSetting === undefined) delete process.env.PICKUP_SLOT_STRICT;
    else process.env.PICKUP_SLOT_STRICT = originalStrictSetting;
    if (originalMenuWindowSetting === undefined) delete process.env.MENU_TIME_WINDOWS;
    else process.env.MENU_TIME_WINDOWS = originalMenuWindowSetting;
  });

  it('returns today pickup slots with capacity and bookable state', async () => {
    const originalStrictSetting = process.env.PICKUP_SLOT_STRICT;
    process.env.PICKUP_SLOT_STRICT = 'true';
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-10T01:00:00.000Z'));
    const fullSlotStart = new Date('2026-10-10T02:00:00.000Z');
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue(
      Array.from({ length: 15 }, () => ({ pickupSlotStart: fullSlotStart })) as any
    );

    try {
      const res = await request(app)
        .get('/api/student/slots')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(72);
      expect(res.body.data[3]).toMatchObject({
        label: '7:30-7:40 AM',
        remainingCapacity: 0,
        bookable: false,
        unavailableReason: 'Full',
      });
      expect(res.body.data[4].bookable).toBe(true);
    } finally {
      vi.useRealTimers();
      if (originalStrictSetting === undefined) delete process.env.PICKUP_SLOT_STRICT;
      else process.env.PICKUP_SLOT_STRICT = originalStrictSetting;
    }
  });

  describe('POST /api/student/orders (Order Creation & Transaction)', () => {
    it('creates student order successfully when items and categories are available', async () => {
      const createOrder = vi.fn().mockResolvedValue(mockCreatedOrder);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const txMock = {
          menuItem: {
            findUnique: vi.fn().mockResolvedValue(mockAvailableItem),
          },
          order: {
            findMany: vi.fn().mockResolvedValue([]),
            findUnique: vi.fn().mockResolvedValue(null),
            create: createOrder,
          },
        };
        return cb(txMock);
      });

      const res = await request(app)
        .post('/api/student/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          items: [
            {
              menuItemId: 'item-dosa-1',
              quantity: 1,
              customizations: [{ groupName: 'Size', selectedOption: 'Large', additionalPrice: 0 }],
            },
            { menuItemId: 'item-dosa-1', quantity: 1 },
          ],
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toBe('SC-7K4M9Q');
      expect(res.body.data.paymentMethod).toBe('CASH');
      expect(res.body.data.items[0].priceAtPurchase).toBe(75);
      expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: 150,
          items: {
            create: [{ menuItemId: 'item-dosa-1', quantity: 2, priceAtPurchase: 75 }],
          },
        }),
      }));
    });

    it('rejects order placement with 400 when an item is unavailable', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const txMock = {
          menuItem: {
            findUnique: vi.fn().mockResolvedValue(mockUnavailableItem),
          },
          order: { findMany: vi.fn().mockResolvedValue([]) },
        };
        return cb(txMock);
      });

      const res = await request(app)
        .post('/api/student/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          items: [{ menuItemId: 'item-disabled-2', quantity: 1 }],
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/currently unavailable/i);
    });

    it('rejects order placement with 400 when an item category is unavailable', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const txMock = {
          menuItem: {
            findUnique: vi.fn().mockResolvedValue(mockItemInUnavailableCat),
          },
          order: { findMany: vi.fn().mockResolvedValue([]) },
        };
        return cb(txMock);
      });

      const res = await request(app)
        .post('/api/student/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          items: [{ menuItemId: 'item-inactive-3', quantity: 1 }],
          paymentMethod: 'ONLINE_MOCK',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/currently unavailable/i);
    });

    it('returns a clear 409 when serializable slot-capacity validation conflicts', async () => {
      vi.spyOn(prisma, '$transaction').mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Serializable transaction conflict', {
          code: 'P2034',
          clientVersion: '5.22.0',
        })
      );

      const res = await request(app)
        .post('/api/student/orders')
        .set('Authorization', ['Bearer', studentToken].join(' '))
        .send({
          items: [{ menuItemId: 'item-dosa-1', quantity: 1 }],
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('That slot just filled, pick another.');
    });

    it('rejects an order outside the item meal-time window', async () => {
      const originalSetting = process.env.MENU_TIME_WINDOWS;
      process.env.MENU_TIME_WINDOWS = 'true';
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-10T05:00:00.000Z'));
      const breakfastOnlyItem = {
        ...mockAvailableItem,
        mealTimes: ['BREAKFAST'],
      };
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb({
          order: { findMany: vi.fn().mockResolvedValue([]) },
          menuItem: {
            findUnique: vi.fn().mockResolvedValue(breakfastOnlyItem),
          },
        });
      });

      try {
        const res = await request(app)
          .post('/api/student/orders')
          .set('Authorization', ['Bearer', studentToken].join(' '))
          .send({
            items: [{ menuItemId: 'item-dosa-1', quantity: 1 }],
            paymentMethod: 'CASH',
            pickupSlotStart: '2026-10-10T06:30:00.000Z',
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Breakfast ends at 12:00 PM');
      } finally {
        vi.useRealTimers();
        if (originalSetting === undefined) delete process.env.MENU_TIME_WINDOWS;
        else process.env.MENU_TIME_WINDOWS = originalSetting;
      }
    });

    it('rejects order creation without JWT token (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/student/orders')
        .send({
          items: [{ menuItemId: 'item-dosa-1', quantity: 1 }],
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/staff/orders/:id/status (Order Status Transition Validation)', () => {
    it('sorts the live staff queue by pickup slot and then creation time', async () => {
      const sameSlot = new Date('2026-10-10T07:00:00.000Z');
      const laterSlot = new Date('2026-10-10T07:10:00.000Z');
      const queueOrders = [
        { ...mockCreatedOrder, id: 'later-slot', pickupSlotStart: laterSlot, createdAt: new Date('2026-10-10T06:00:00Z') },
        { ...mockCreatedOrder, id: 'later-created', pickupSlotStart: sameSlot, createdAt: new Date('2026-10-10T06:02:00Z') },
        { ...mockCreatedOrder, id: 'earlier-created', pickupSlotStart: sameSlot, createdAt: new Date('2026-10-10T06:01:00Z') },
      ];
      vi.spyOn(prisma.order, 'findMany').mockResolvedValue(queueOrders as any);

      const res = await request(app)
        .get('/api/staff/orders')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.all.map((order: any) => order.id)).toEqual([
        'earlier-created',
        'later-created',
        'later-slot',
      ]);
    });

    it('allows valid step-by-step status transitions (RECEIVED -> PREPARING -> READY_TO_PICK -> DELIVERED)', async () => {
      const currentOrder = { ...mockCreatedOrder, orderStatus: 'RECEIVED' };
      const updatedOrder = { ...mockCreatedOrder, orderStatus: 'PREPARING' };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(currentOrder as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb({
        order: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockResolvedValue(updatedOrder),
        },
        payment: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      }));

      const res = await request(app)
        .patch('/api/staff/orders/SC-7K4M9Q/status')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'PREPARING' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe('PREPARING');
    });

    it('rejects invalid status transition (e.g. RECEIVED -> DELIVERED) with 400 Bad Request', async () => {
      const currentOrder = { ...mockCreatedOrder, orderStatus: 'RECEIVED' };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(currentOrder as any);

      const res = await request(app)
        .patch('/api/staff/orders/SC-7K4M9Q/status')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'DELIVERED', verificationId: 'SC-7K4M9Q' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid delivery|Cannot transition order status/i);
    });

    it('allows cancellation from RECEIVED', async () => {
      const receivedOrder = { ...mockCreatedOrder, orderStatus: 'RECEIVED' };
      const cancelledOrder = { ...mockCreatedOrder, orderStatus: 'CANCELLED' };
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(receivedOrder as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb({
        order: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockResolvedValue(cancelledOrder),
        },
        payment: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      }));

      const response = await request(app)
        .patch('/api/staff/orders/SC-7K4M9Q/status')
        .set('Authorization', ['Bearer', staffToken].join(' '))
        .send({ status: 'CANCELLED' });

      expect(response.status).toBe(200);
      expect(response.body.data.orderStatus).toBe('CANCELLED');
    });

    it('allows PREPARING to advance to READY_TO_PICK', async () => {
      const preparingOrder = { ...mockCreatedOrder, orderStatus: 'PREPARING' };
      const readyOrder = { ...mockCreatedOrder, orderStatus: 'READY_TO_PICK' };
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(preparingOrder as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb({
        order: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockResolvedValue(readyOrder),
        },
        payment: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      }));

      const response = await request(app)
        .patch('/api/staff/orders/SC-7K4M9Q/status')
        .set('Authorization', ['Bearer', staffToken].join(' '))
        .send({ status: 'READY_TO_PICK' });

      expect(response.status).toBe(200);
      expect(response.body.data.orderStatus).toBe('READY_TO_PICK');
    });

    it('requires the matching typed order ID to deliver a READY_TO_PICK order', async () => {
      const readyOrder = { ...mockCreatedOrder, orderStatus: 'READY_TO_PICK' };
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(readyOrder as any);
      const transaction = vi.spyOn(prisma, '$transaction');

      const response = await request(app)
        .patch('/api/staff/orders/SC-7K4M9Q/status')
        .set('Authorization', ['Bearer', staffToken].join(' '))
        .send({ status: 'DELIVERED', verificationId: 'SC-WRONG1' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/does not match/i);
      expect(transaction).not.toHaveBeenCalled();
    });

    it('delivers a READY_TO_PICK order after matching the typed order ID', async () => {
      const readyOrder = { ...mockCreatedOrder, orderStatus: 'READY_TO_PICK' };
      const deliveredOrder = { ...mockCreatedOrder, orderStatus: 'DELIVERED' };
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(readyOrder as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb({
        order: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockResolvedValue(deliveredOrder),
        },
        payment: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      }));

      const response = await request(app)
        .patch('/api/staff/orders/SC-7K4M9Q/status')
        .set('Authorization', ['Bearer', staffToken].join(' '))
        .send({ status: 'DELIVERED', verificationId: 'SC-7K4M9Q' });

      expect(response.status).toBe(200);
      expect(response.body.data.orderStatus).toBe('DELIVERED');
    });

    it('rejects cancellation after READY_TO_PICK', async () => {
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue({
        ...mockCreatedOrder,
        orderStatus: 'READY_TO_PICK',
      } as any);

      const response = await request(app)
        .patch('/api/staff/orders/SC-7K4M9Q/status')
        .set('Authorization', ['Bearer', staffToken].join(' '))
        .send({ status: 'CANCELLED' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Cannot transition/i);
    });

    it('rejects status updates when user has STUDENT role (403 Forbidden)', async () => {
      const res = await request(app)
        .patch('/api/staff/orders/SC-7K4M9Q/status')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'PREPARING' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/staff/verify-delivery (Delivery Verification)', () => {
    it('successfully delivers order when status is READY_TO_PICK', async () => {
      const readyOrder = { ...mockCreatedOrder, orderStatus: 'READY_TO_PICK' };
      const deliveredOrder = { ...mockCreatedOrder, orderStatus: 'DELIVERED', deliveredAt: new Date() };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(readyOrder as any);
      const paymentUpdate = vi.fn().mockResolvedValue({ count: 1 });
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb({
        order: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockResolvedValue(deliveredOrder),
        },
        payment: {
          updateMany: paymentUpdate,
        },
      }));

      const res = await request(app)
        .post('/api/staff/verify-delivery')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ orderNumber: 'SC-7K4M9Q' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe('DELIVERED');
      expect(paymentUpdate).toHaveBeenCalledWith({
        where: { orderId: readyOrder.id },
        data: { status: 'PAID' },
      });
    });

    it('rejects a concurrent duplicate delivery when the atomic status update loses the race', async () => {
      const readyOrder = { ...mockCreatedOrder, orderStatus: 'READY_TO_PICK' };
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(readyOrder as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb({
        order: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          findUnique: vi.fn(),
        },
        payment: {
          updateMany: vi.fn(),
        },
      }));

      const res = await request(app)
        .post('/api/staff/verify-delivery')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ orderNumber: 'SC-7K4M9Q' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/changed state/i);
    });

    it('rejects delivery verification when order is not READY_TO_PICK (Invalid Delivery)', async () => {
      const preparingOrder = { ...mockCreatedOrder, orderStatus: 'PREPARING' };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(preparingOrder as any);

      const res = await request(app)
        .post('/api/staff/verify-delivery')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ orderNumber: 'SC-7K4M9Q' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid delivery/i);
    });

    it('rejects duplicate delivery verification when order is already DELIVERED', async () => {
      const alreadyDelivered = { ...mockCreatedOrder, orderStatus: 'DELIVERED', deliveredAt: new Date() };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(alreadyDelivered as any);

      const res = await request(app)
        .post('/api/staff/verify-delivery')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ orderNumber: 'SC-7K4M9Q' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Duplicate delivery/i);
    });
  });

  describe('Staff MenuItem & Category Availability Controls', () => {
    it('returns cuisine and effective menu availability fields for staff', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([{
        ...mockAvailableItem,
        cuisines: ['south-indian'],
        mealTimes: ['BREAKFAST'],
        isSpecial: false,
      }] as any);

      const res = await request(app)
        .get('/api/staff/menu-status')
        .set('Authorization', ['Bearer', staffToken].join(' '));

      expect(res.status).toBe(200);
      expect(res.body.data[0]).toMatchObject({
        cuisine: ['south-indian'],
        cuisines: ['south-indian'],
        availableNow: true,
        unavailableReason: null,
      });
    });

    it('allows staff to toggle MenuItem availability', async () => {
      vi.spyOn(prisma.menuItem, 'findUnique').mockResolvedValue(mockAvailableItem as any);
      vi.spyOn(prisma.menuItem, 'update').mockResolvedValue({
        ...mockAvailableItem,
        isAvailable: false,
        isSpecial: false,
      } as any);

      const res = await request(app)
        .patch('/api/staff/menu-status/item-dosa-1')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ isAvailable: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAvailable).toBe(false);
    });

    it('allows staff to toggle a menu item special status without changing availability', async () => {
      vi.spyOn(prisma.menuItem, 'findUnique').mockResolvedValue({
        ...mockAvailableItem,
        isSpecial: false,
      } as any);
      const updateSpy = vi.spyOn(prisma.menuItem, 'update').mockResolvedValue({
        ...mockAvailableItem,
        isSpecial: true,
      } as any);

      const res = await request(app)
        .patch('/api/staff/menu-status/item-dosa-1')
        .set('Authorization', ['Bearer', staffToken].join(' '))
        .send({ isSpecial: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isSpecial).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'item-dosa-1' },
        data: { isSpecial: true },
      });
    });

    it('allows staff to toggle Category availability', async () => {
      vi.spyOn(prisma.category, 'findUnique').mockResolvedValue(mockCategoryAvailable as any);
      vi.spyOn(prisma.category, 'update').mockResolvedValue({
        ...mockCategoryAvailable,
        isAvailable: false,
      } as any);

      const res = await request(app)
        .patch('/api/staff/categories/cat-breakfast-id/availability')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ isAvailable: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAvailable).toBe(false);
    });

    it('rejects non-staff user from toggling item/category availability (403 Forbidden)', async () => {
      const resItem = await request(app)
        .patch('/api/staff/menu-status/item-dosa-1')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ isAvailable: false });

      expect(resItem.status).toBe(403);

      const resCat = await request(app)
        .patch('/api/staff/categories/cat-breakfast-id/availability')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ isAvailable: false });

      expect(resCat.status).toBe(403);
    });
  });

  describe('GET /api/student/orders & /api/student/orders/:id (History & Details)', () => {
    it('returns student order history for authenticated user', async () => {
      const orderWithFeedback = {
        ...mockCreatedOrder,
        orderStatus: 'DELIVERED',
        feedback: {
          id: 'feedback-1',
          rating: 4,
          comment: 'Good meal',
          createdAt: new Date('2026-10-10T08:00:00.000Z'),
          items: [{ menuItemId: 'item-dosa-1', tags: ['great_taste'] }],
        },
      };
      const findOrders = vi.spyOn(prisma.order, 'findMany').mockResolvedValue([orderWithFeedback] as any);

      const res = await request(app)
        .get('/api/student/orders')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].orderNumber).toBe('SC-7K4M9Q');
      expect(res.body.data[0].feedback).toMatchObject({
        rating: 4,
        comment: 'Good meal',
        items: [{ menuItemId: 'item-dosa-1', tags: ['great_taste'] }],
      });
      expect(findOrders).toHaveBeenCalledWith(expect.objectContaining({
        include: expect.objectContaining({
          feedback: { include: { items: true } },
        }),
      }));
    });

    it('returns only feedback belonging to the authenticated student', async () => {
      const createdAt = new Date('2026-10-10T08:00:00.000Z');
      const findFeedback = vi.spyOn(prisma.feedback, 'findMany').mockResolvedValue([{
        id: 'feedback-1',
        rating: 5,
        comment: 'Fresh and tasty',
        createdAt,
        order: { orderNumber: 'SC-7K4M9Q', createdAt },
      }] as any);

      const res = await request(app)
        .get('/api/student/feedback')
        .set('Authorization', ['Bearer', studentToken].join(' '));

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([{
        id: 'feedback-1',
        rating: 5,
        comment: 'Fresh and tasty',
        orderNumber: 'SC-7K4M9Q',
        createdAt: createdAt.toISOString(),
      }]);
      expect(findFeedback).toHaveBeenCalledWith(expect.objectContaining({
        where: { studentId: mockStudentUser.id },
      }));
    });

    it('returns order details for valid order ID', async () => {
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockCreatedOrder as any);

      const res = await request(app)
        .get('/api/student/orders/SC-7K4M9Q')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('ord-uuid-1');
      expect(res.body.data.orderNumber).toBe('SC-7K4M9Q');
    });
  });
});
