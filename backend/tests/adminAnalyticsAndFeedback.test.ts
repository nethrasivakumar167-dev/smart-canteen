import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import app from '../src/app';
import { prisma } from '../src/prisma';
import jwt from 'jsonwebtoken';

describe('Part 9: Admin Analytics, Feedback & RBAC Authorization API', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-32-chars-minimum-length-for-jwt-signing';

  const mockAdminUser = {
    id: 'user-admin-1',
    name: 'Admin Officer',
    email: 'admin@campus.edu',
    role: 'ADMIN',
    isActive: true,
  };

  const mockStaffUser = {
    id: 'user-staff-1',
    name: 'Staff Chef',
    email: 'staff@campus.edu',
    role: 'STAFF',
    isActive: true,
  };

  const mockStudentUser = {
    id: 'user-student-1',
    name: 'Student Diner',
    email: 'student@campus.edu',
    role: 'STUDENT',
    isActive: true,
  };

  const adminToken = jwt.sign(
    { userId: mockAdminUser.id, email: mockAdminUser.email, role: mockAdminUser.role },
    JWT_SECRET
  );

  const staffToken = jwt.sign(
    { userId: mockStaffUser.id, email: mockStaffUser.email, role: mockStaffUser.role },
    JWT_SECRET
  );

  const studentToken = jwt.sign(
    { userId: mockStudentUser.id, email: mockStudentUser.email, role: mockStudentUser.role },
    JWT_SECRET
  );

  const mockDeliveredOrder = {
    id: 'ord-deliv-101',
    orderNumber: 'SC-998877',
    studentId: mockStudentUser.id,
    totalAmount: 150.0,
    paymentMethod: 'ONLINE_MOCK',
    paymentStatus: 'PAID',
    orderStatus: 'DELIVERED',
    createdAt: new Date(),
    updatedAt: new Date(),
    feedback: null,
    items: [{ menuItemId: 'menu-item-1' }],
  };

  const mockPreparingOrder = {
    id: 'ord-prep-102',
    orderNumber: 'SC-112233',
    studentId: mockStudentUser.id,
    totalAmount: 95.0,
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    orderStatus: 'PREPARING',
    createdAt: new Date(),
    updatedAt: new Date(),
    feedback: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.id === mockAdminUser.id) return mockAdminUser as any;
      if (args.where.id === mockStaffUser.id) return mockStaffUser as any;
      if (args.where.id === mockStudentUser.id) return mockStudentUser as any;
      return null;
    });
  });

  describe('Admin Authorization & RBAC', () => {
    it('allows ADMIN to access admin endpoints', async () => {
      vi.spyOn(prisma.order, 'count').mockResolvedValue(10);
      vi.spyOn(prisma.order, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 1500.0 } } as any);
      vi.spyOn(prisma.order, 'groupBy').mockResolvedValue([]);
      vi.spyOn(prisma.user, 'count').mockResolvedValue(5);
      vi.spyOn(prisma, '$queryRaw')
        .mockResolvedValueOnce([{ hour: 12, orders: 4 }] as any)
        .mockResolvedValueOnce([{ name: 'Masala Dosa', ordersCount: 5, revenue: 450 }] as any)
        .mockResolvedValueOnce([{ averageMinutes: 8.5 }] as any);
      vi.spyOn(prisma.feedback, 'aggregate').mockResolvedValue({ _avg: { rating: 4.8 }, _count: { id: 3 } } as any);

      const res = await request(app)
        .get('/api/admin/overview-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.financials.revenue).toBe(1500);
      expect(res.body.data.operations.totalOrders).toBe(10);
      expect(res.body.data.hourlyDemand).toHaveLength(9);
      expect(res.body.data.hourlyDemand[4]).toEqual({ hour: '12 PM', orders: 4 });
      expect(res.body.data.operations.peakRushHour).toBe('12 PM - 1 PM');
      expect(res.body.data.operations.averageFulfillmentMinutes).toBe(8.5);
      expect(res.body.data.topSellingItems).toEqual([
        { name: 'Masala Dosa', ordersCount: 5, revenue: 450 },
      ]);
    });

    it('rejects STAFF and STUDENT roles from accessing admin endpoints (403 Forbidden)', async () => {
      const resStaff = await request(app)
        .get('/api/admin/overview-stats')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(resStaff.status).toBe(403);

      const resStudent = await request(app)
        .get('/api/admin/overview-stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(resStudent.status).toBe(403);
    });

    it('does not allow admin provisioning to create student accounts', async () => {
      const createSpy = vi.spyOn(prisma.user, 'create');

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Unapproved student',
          email: 'new-student@campus.edu',
          password: 'password123',
          role: 'STUDENT',
        });

      expect(response.status).toBe(400);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('Student Feedback Submission & Completed-Order Restriction', () => {
    it('does not allow admin accounts to submit student feedback', async () => {
      const response = await request(app)
        .post('/api/student/orders/SC-998877/feedback')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rating: 5, comment: 'Admin feedback' });

      expect(response.status).toBe(403);
    });

    it('allows student to submit rating and comment for a DELIVERED order', async () => {
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockDeliveredOrder as any);
      vi.spyOn(prisma.feedback, 'create').mockResolvedValue({
        id: 'fb-101',
        studentId: mockStudentUser.id,
        orderId: mockDeliveredOrder.id,
        rating: 5,
        comment: 'Delicious dosa, fast service!',
        createdAt: new Date(),
        student: mockStudentUser,
      } as any);

      const res = await request(app)
        .post('/api/student/orders/SC-998877/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 5,
          comment: 'Delicious dosa, fast service!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
    });

    it('stores valid per-item feedback tags with the feedback record', async () => {
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockDeliveredOrder as any);
      const createSpy = vi.spyOn(prisma.feedback, 'create').mockResolvedValue({
        id: 'fb-102',
        studentId: mockStudentUser.id,
        orderId: mockDeliveredOrder.id,
        rating: 4,
        comment: null,
        createdAt: new Date(),
        student: mockStudentUser,
        items: [{ menuItemId: 'menu-item-1', tags: ['too_spicy', 'great_taste'] }],
      } as any);

      const res = await request(app)
        .post('/api/student/orders/SC-998877/feedback')
        .set('Authorization', ['Bearer', studentToken].join(' '))
        .send({
          rating: 4,
          items: [{ menuItemId: 'menu-item-1', tags: ['too_spicy', 'great_taste'] }],
        });

      expect(res.status).toBe(201);
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [{ menuItemId: 'menu-item-1', tags: ['too_spicy', 'great_taste'] }],
          },
        }),
      }));
    });

    it('rejects feedback tags outside the allowlist', async () => {
      const createSpy = vi.spyOn(prisma.feedback, 'create');

      const res = await request(app)
        .post('/api/student/orders/SC-998877/feedback')
        .set('Authorization', ['Bearer', studentToken].join(' '))
        .send({
          rating: 4,
          items: [{ menuItemId: 'menu-item-1', tags: ['too_expensive'] }],
        });

      expect(res.status).toBe(400);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('rejects feedback for a menu item that was not in the order', async () => {
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockDeliveredOrder as any);
      const createSpy = vi.spyOn(prisma.feedback, 'create');

      const res = await request(app)
        .post('/api/student/orders/SC-998877/feedback')
        .set('Authorization', ['Bearer', studentToken].join(' '))
        .send({
          rating: 4,
          items: [{ menuItemId: 'menu-item-not-ordered', tags: ['bland'] }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must belong to the submitted order/i);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('rejects feedback submission when order is NOT DELIVERED (400 Bad Request)', async () => {
      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockPreparingOrder as any);

      const res = await request(app)
        .post('/api/student/orders/SC-112233/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 4,
          comment: 'Not delivered yet',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/only be submitted for completed\/delivered orders/i);
    });

    it('rejects duplicate feedback submission for an order (409 Conflict)', async () => {
      const orderWithFeedback = {
        ...mockDeliveredOrder,
        feedback: { id: 'existing-fb-id', rating: 4 },
      };

      vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(orderWithFeedback as any);

      const res = await request(app)
        .post('/api/student/orders/SC-998877/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 5,
          comment: 'Trying to review again',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already been submitted/i);
    });
  });

  describe('Admin Feedback Overview Retrieval', () => {
    it('returns feedback list and average rating for Admin', async () => {
      const mockFeedbackList = [
        {
          id: 'fb-101',
          rating: 5,
          comment: 'Great meal!',
          createdAt: new Date(),
          student: mockStudentUser,
          order: mockDeliveredOrder,
        },
      ];

      vi.spyOn(prisma.feedback, 'findMany').mockResolvedValue(mockFeedbackList as any);
      vi.spyOn(prisma.feedback, 'aggregate').mockResolvedValue({
        _avg: { rating: 5.0 },
        _count: { id: 1 },
      } as any);

      const res = await request(app)
        .get('/api/admin/feedback')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.averageRating).toBe(5.0);
      expect(res.body.data.list).toHaveLength(1);
    });

    it('generates optional, failure-safe AI summary for Admin', async () => {
      vi.spyOn(prisma.feedback, 'findMany').mockResolvedValue([
        { rating: 5, comment: 'Excellent coffee and quick service', createdAt: new Date(), items: [] },
        { rating: 4, comment: 'Fresh breakfast dosa', createdAt: new Date(), items: [] },
      ] as any);

      const res = await request(app)
        .get('/api/admin/feedback/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.themes).toBeDefined();
      expect(res.body.data.source).toBe('rule');
    });
  });
});
