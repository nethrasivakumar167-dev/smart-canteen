import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/prisma';
import {
  getFeedbackSummary,
  recomputeCookingTips,
  resetFeedbackInsightStateForTests,
} from '../src/services/feedbackInsightsService';

describe('Feedback summaries and staff cooking tips', () => {
  const users = {
    admin: { id: 'insight-admin', name: 'Admin', email: 'admin@test.invalid', role: 'ADMIN', isActive: true },
    staff: { id: 'insight-staff', name: 'Staff', email: 'staff@test.invalid', role: 'STAFF', isActive: true },
    student: { id: 'insight-student', name: 'Student', email: 'student@test.invalid', role: 'STUDENT', isActive: true },
  };
  const token = (role: keyof typeof users) => jwt.sign(
    { userId: users[role].id, email: users[role].email, role: users[role].role },
    env.JWT_SECRET
  );
  const feedbackFixtures = [
    {
      rating: 2,
      comment: 'This was a fixture comment.',
      createdAt: new Date(),
      studentId: 'student-1',
      items: [{ tags: ['too_spicy', 'too_spicy'], menuItem: { id: 'dish-1', name: 'Chilli Rice' } }],
    },
    {
      rating: 4,
      comment: null,
      createdAt: new Date(),
      studentId: 'student-2',
      items: [{ tags: ['too_spicy'], menuItem: { id: 'dish-1', name: 'Chilli Rice' } }],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network access is disabled during tests.'))));
    resetFeedbackInsightStateForTests();
    env.AI_PROVIDER = 'mock';
    env.GEMINI_API_KEY = undefined;
    env.GEMINI_MODEL = undefined;
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) =>
      Object.values(users).find((user) => user.id === args.where.id) as any || null
    );
  });

  afterEach(() => {
    env.AI_PROVIDER = 'mock';
    env.GEMINI_API_KEY = undefined;
    env.GEMINI_MODEL = undefined;
    resetFeedbackInsightStateForTests();
  });

  it('builds a rule summary from database feedback and item tag aggregates', async () => {
    vi.spyOn(prisma.feedback, 'findMany').mockResolvedValue(feedbackFixtures as any);

    const summary = await getFeedbackSummary();

    expect(summary).toMatchObject({
      source: 'rule',
      themes: expect.arrayContaining([expect.stringContaining('3.0/5'), expect.stringContaining('too spicy (2)')]),
      complaints: expect.arrayContaining([expect.stringContaining('too spicy (2)')]),
    });
    expect(summary?.generatedAt).toEqual(expect.any(String));
  });

  it('falls back to rule insights when Gemini invents unsupported claims or returns invalid JSON', async () => {
    env.AI_PROVIDER = 'gemini';
    env.GEMINI_API_KEY = 'test-key';
    env.GEMINI_MODEL = 'test-model';
    vi.spyOn(prisma.feedback, 'findMany').mockResolvedValue(feedbackFixtures as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: JSON.stringify({
            themes: ['The canteen needs improved hygiene.'],
            complaints: ['Students reported too spicy food.'],
            recommendations: ['Improve food quality.'],
          }) }] },
        }],
      }),
    }));

    const invented = await getFeedbackSummary();
    expect(invented?.source).toBe('rule');

    resetFeedbackInsightStateForTests();
    vi.spyOn(prisma.feedback, 'findMany').mockResolvedValue(feedbackFixtures as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{"themes": []' }] } }] }),
    }));
    const invalid = await getFeedbackSummary();
    expect(invalid?.source).toBe('rule');
  });

  it('caches one daily summary and limits explicit refreshes to five minutes', async () => {
    const feedbackQuery = vi.spyOn(prisma.feedback, 'findMany').mockResolvedValue(feedbackFixtures as any);
    const now = new Date('2026-10-10T10:00:00.000Z');

    const initial = await getFeedbackSummary(false, now);
    const cached = await getFeedbackSummary(false, new Date(now.getTime() + 60_000));
    expect(cached).toBe(initial);
    expect(feedbackQuery).toHaveBeenCalledTimes(1);

    await getFeedbackSummary(true, now);
    expect(feedbackQuery).toHaveBeenCalledTimes(2);
    expect(await getFeedbackSummary(true, new Date(now.getTime() + 4 * 60_000 + 59_000))).toBeNull();
    expect(await getFeedbackSummary(true, new Date(now.getTime() + 5 * 60_000))).not.toBeNull();
    expect(feedbackQuery).toHaveBeenCalledTimes(3);
  });

  it('requires two distinct students, ignores repeated tags, and clears tips when the window drops below threshold', async () => {
    let currentTip: string | null = null;
    let feedback = [
      { studentId: 'student-1', tags: ['too_spicy', 'too_spicy'], createdAt: new Date() },
      { studentId: 'student-1', tags: ['too_spicy'], createdAt: new Date() },
    ];
    vi.spyOn(prisma.menuItem, 'findMany').mockImplementation(async () => [
      { id: 'dish-1', cookingTip: currentTip } as any,
    ]);
    const feedbackItemQuery = vi.spyOn(prisma.feedbackItem, 'findMany').mockImplementation(async (args: any) =>
      feedback.map((entry) => ({
        menuItemId: 'dish-1',
        tags: entry.tags,
        feedback: { studentId: entry.studentId, createdAt: entry.createdAt },
      })).filter((entry) => entry.feedback.createdAt >= args.where.feedback.createdAt.gte) as any
    );
    const update = vi.spyOn(prisma.menuItem, 'update').mockImplementation(async (args: any) => {
      currentTip = args.data.cookingTip;
      return { id: 'dish-1', ...args.data } as any;
    });

    await recomputeCookingTips();
    expect(update).not.toHaveBeenCalled();

    feedback = [
      { studentId: 'student-1', tags: ['too_spicy', 'too_spicy'], createdAt: new Date() },
      { studentId: 'student-2', tags: ['too_spicy'], createdAt: new Date() },
    ];
    await recomputeCookingTips();
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        cookingTip: 'Several students found this too spicy. Reduce chilli slightly.',
        cookingTipUpdatedAt: expect.any(Date),
      }),
    }));

    feedback = [
      { studentId: 'student-1', tags: ['too_spicy'], createdAt: new Date() },
      { studentId: 'student-2', tags: ['bland'], createdAt: new Date() },
    ];
    await recomputeCookingTips();
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({
      data: { cookingTip: null, cookingTipUpdatedAt: null },
    }));

    feedback = [
      { studentId: 'student-1', tags: ['too_spicy'], createdAt: new Date() },
      { studentId: 'student-2', tags: ['too_spicy'], createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    ];
    currentTip = 'Several students found this too spicy. Reduce chilli slightly.';
    await recomputeCookingTips();
    expect(feedbackItemQuery).toHaveBeenLastCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        feedback: { createdAt: { gte: expect.any(Date) } },
      }),
    }));
    expect(update).toHaveBeenLastCalledWith(expect.objectContaining({
      data: { cookingTip: null, cookingTipUpdatedAt: null },
    }));
  });

  it('includes a cooking tip in the staff queue order item response', async () => {
    vi.spyOn(prisma.order, 'findMany').mockResolvedValue([{
      id: 'order-tip',
      orderNumber: 'SC-TIP001',
      studentId: users.student.id,
      totalAmount: 10,
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      orderStatus: 'RECEIVED',
      deliveredAt: null,
      deliveredById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      pickupSlotStart: null,
      items: [{
        id: 'line-tip',
        menuItemId: 'dish-1',
        quantity: 1,
        priceAtPurchase: 10,
        menuItem: {
          name: 'Chilli Rice',
          cookingTip: 'Several students found this too spicy. Reduce chilli slightly.',
          category: { name: 'Lunch' },
        },
      }],
      payments: [],
      student: { name: 'Student', email: 'student@test.invalid' },
    }] as any);

    const response = await request(app)
      .get('/api/staff/orders')
      .set('Authorization', `Bearer ${token('staff')}`);

    expect(response.status).toBe(200);
    expect(response.body.data.all[0].items[0].cookingTip).toMatch(/too spicy/i);
  });

  it('restricts both admin insight endpoints to administrators', async () => {
    for (const role of ['student', 'staff'] as const) {
      const summary = await request(app)
        .get('/api/admin/feedback/summary')
        .set('Authorization', `Bearer ${token(role)}`);
      const tips = await request(app)
        .post('/api/admin/cooking-tips/recompute')
        .set('Authorization', `Bearer ${token(role)}`);
      expect(summary.status).toBe(403);
      expect(tips.status).toBe(403);
    }
  });

  it('serves the required summary shape to administrators', async () => {
    vi.spyOn(prisma.feedback, 'findMany').mockResolvedValue(feedbackFixtures as any);

    const response = await request(app)
      .get('/api/admin/feedback/summary')
      .set('Authorization', `Bearer ${token('admin')}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.objectContaining({
      themes: expect.any(Array),
      complaints: expect.any(Array),
      recommendations: expect.any(Array),
      generatedAt: expect.any(String),
      source: 'rule',
    }));
  });
});
