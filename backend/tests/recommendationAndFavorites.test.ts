import request from 'supertest';
import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/app';
import { prisma } from '../src/prisma';

const jwtSecret = process.env.JWT_SECRET || 'test-secret-key-32-chars-minimum-length-for-jwt-signing';
const tokenFor = (userId: string, role: 'STUDENT' | 'STAFF' = 'STUDENT') =>
  jwt.sign({ userId, email: `${userId}@campus.edu`, role }, jwtSecret);

const menuItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'menu-breakfast',
  name: 'Breakfast Dosa',
  description: 'Crispy dosa',
  price: new Prisma.Decimal(75),
  categoryId: 'category-1',
  imageUrl: '/images/menu/dosa.jpg',
  isVegetarian: true,
  isAvailable: true,
  dietaryTags: ['veg'],
  tags: ['breakfast'],
  cuisines: ['south-indian'],
  mealTimes: ['BREAKFAST'],
  allergens: [],
  allergenNote: null,
  spiceLevel: 'MILD',
  isSpecial: false,
  preparationTime: 10,
  category: {
    id: 'category-1',
    name: 'Breakfast',
    slug: 'breakfast',
    description: null,
    isAvailable: true,
    displayOrder: 1,
  },
  ...overrides,
});

describe('Student favourites and recommendations', () => {
  const originalTimeWindows = process.env.MENU_TIME_WINDOWS;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-10T02:30:00.000Z'));
    process.env.MENU_TIME_WINDOWS = 'true';
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => ({
      id: args.where.id,
      name: 'Test User',
      email: `${args.where.id}@campus.edu`,
      role: args.where.id === 'staff-user' ? 'STAFF' : 'STUDENT',
      isActive: true,
    }) as any);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    if (originalTimeWindows === undefined) delete process.env.MENU_TIME_WINDOWS;
    else process.env.MENU_TIME_WINDOWS = originalTimeWindows;
  });

  it('serves, adds and removes only the signed-in student favorites idempotently', async () => {
    const item = menuItem();
    const getFavorites = vi.spyOn(prisma.favorite, 'findMany').mockResolvedValue([
      { menuItem: item },
    ] as any);
    const findItem = vi.spyOn(prisma.menuItem, 'findUnique').mockResolvedValue(item as any);
    const upsert = vi.spyOn(prisma.favorite, 'upsert').mockResolvedValue({ id: 'favorite-1' } as any);
    const remove = vi.spyOn(prisma.favorite, 'deleteMany').mockResolvedValue({ count: 1 });

    const get = await request(app)
      .get('/api/student/favorites')
      .set('Authorization', `Bearer ${tokenFor('student-favorites')}`);
    expect(get.status).toBe(200);
    expect(get.body.data[0]).toMatchObject({ id: item.id, availableNow: true, categoryName: 'Breakfast' });
    expect(getFavorites).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'student-favorites' } }));

    const put = await request(app)
      .put(`/api/student/favorites/${item.id}`)
      .set('Authorization', `Bearer ${tokenFor('student-favorites')}`);
    expect(put.status).toBe(200);
    expect(findItem).toHaveBeenCalledWith(expect.objectContaining({ where: { id: item.id } }));
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_menuItemId: { userId: 'student-favorites', menuItemId: item.id } },
    }));

    for (let index = 0; index < 2; index += 1) {
      const del = await request(app)
        .delete(`/api/student/favorites/${item.id}`)
        .set('Authorization', `Bearer ${tokenFor('student-favorites')}`);
      expect(del.status).toBe(200);
    }
    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledWith({ where: { userId: 'student-favorites', menuItemId: item.id } });
  });

  it('restricts favorites endpoints to students and validates menu item ids', async () => {
    const forbidden = await request(app)
      .get('/api/student/favorites')
      .set('Authorization', `Bearer ${tokenFor('staff-user', 'STAFF')}`);
    expect(forbidden.status).toBe(403);

    const invalid = await request(app)
      .delete('/api/student/favorites/%20')
      .set('Authorization', `Bearer ${tokenFor('student-invalid-id')}`);
    expect(invalid.status).toBe(400);
  });

  it('returns only currently available items and explains no-history suggestions with real facts', async () => {
    const available = menuItem({ isSpecial: true });
    const outsideMeal = menuItem({
      id: 'menu-lunch',
      name: 'Lunch Rice',
      mealTimes: ['LUNCH'],
      isSpecial: false,
    });
    const disabled = menuItem({
      id: 'menu-disabled',
      name: 'Unavailable Dosa',
      isAvailable: false,
    });
    vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([available, outsideMeal, disabled] as any);
    vi.spyOn(prisma.orderItem, 'groupBy')
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([{ menuItemId: available.id, _count: { _all: 12 } }] as any);
    vi.spyOn(prisma.favorite, 'findMany').mockResolvedValue([]);

    const response = await request(app)
      .get('/api/student/recommendations')
      .set('Authorization', `Bearer ${tokenFor('student-no-history')}`);

    expect(response.status).toBe(200);
    expect(response.body.data.map((entry: any) => entry.item.id)).toEqual([available.id]);
    expect(response.body.data[0]).toMatchObject({
      label: 'Smart pick',
      reason: "No order history yet; today's special.",
    });
  });

  it('ranks previously ordered items as smart picks', async () => {
    const ordered = menuItem({ id: 'menu-ordered', name: 'Ordered Dosa' });
    const popular = menuItem({ id: 'menu-popular', name: 'Popular Dosa', isSpecial: true });
    vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([popular, ordered] as any);
    vi.spyOn(prisma.orderItem, 'groupBy')
      .mockResolvedValueOnce([{ menuItemId: ordered.id, _count: { _all: 2 } }] as any)
      .mockResolvedValueOnce([
        { menuItemId: popular.id, _count: { _all: 20 } },
        { menuItemId: ordered.id, _count: { _all: 1 } },
      ] as any);
    vi.spyOn(prisma.favorite, 'findMany').mockResolvedValue([]);

    const response = await request(app)
      .get('/api/student/recommendations')
      .set('Authorization', `Bearer ${tokenFor('student-with-history')}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].item.id).toBe(ordered.id);
    expect(response.body.data[0]).toMatchObject({
      label: 'Smart pick',
      reason: 'You ordered this 2 times before.',
    });
  });

  it('falls back to rule-based reasons when Gemini returns an invented item id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({
          recommendations: [{ id: 'invented-id', reason: 'A great pick.' }],
        }) }] } }],
      }),
    }));
    vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([menuItem({ isSpecial: true })] as any);
    vi.spyOn(prisma.orderItem, 'groupBy').mockResolvedValue([] as any);
    vi.spyOn(prisma.favorite, 'findMany').mockResolvedValue([]);

    const response = await request(app)
      .get('/api/student/recommendations')
      .set('Authorization', `Bearer ${tokenFor('student-invented-ai')}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].reason).toBe("No order history yet; today's special.");
  });

  it('falls back to rule-based reasons when Gemini returns no response', async () => {
    vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([menuItem({ isSpecial: true })] as any);
    vi.spyOn(prisma.orderItem, 'groupBy').mockResolvedValue([] as any);
    vi.spyOn(prisma.favorite, 'findMany').mockResolvedValue([]);

    const response = await request(app)
      .get('/api/student/recommendations')
      .set('Authorization', `Bearer ${tokenFor('student-null-ai')}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0].reason).toBe("No order history yet; today's special.");
  });
});
