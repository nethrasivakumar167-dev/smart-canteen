import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/prisma';
import { answerChat, ChatMenuItem } from '../src/services/chatService';

const now = new Date('2026-01-01T07:00:00.000Z');

const menuFixtures: ChatMenuItem[] = [
  {
    id: 'chaat-special',
    name: 'Aloo Chaat',
    category: { name: 'Chaats', isAvailable: true },
    cuisines: ['Indian'],
    mealTimes: ['LUNCH'],
    dietaryTags: ['vegetarian'],
    allergens: [],
    allergenNote: null,
    spiceLevel: 'MEDIUM',
    price: 60,
    isAvailable: true,
    isSpecial: true,
    imageUrl: '/images/aloo-chaat.jpg',
  },
  {
    id: 'chinese-noodles',
    name: 'Vegetable Hakka Noodles',
    category: { name: 'Noodles', isAvailable: true },
    cuisines: ['Chinese'],
    mealTimes: ['ALL_DAY'],
    dietaryTags: ['vegetarian'],
    allergens: [],
    allergenNote: null,
    spiceLevel: 'MILD',
    price: 90,
    isAvailable: true,
    isSpecial: false,
    imageUrl: null,
  },
  {
    id: 'explicit-dairy-free-dessert',
    name: 'Coconut Sorbet',
    category: { name: 'Desserts', isAvailable: true },
    cuisines: [],
    mealTimes: ['ALL_DAY'],
    dietaryTags: ['dairy-free'],
    allergens: [],
    allergenNote: null,
    spiceLevel: null,
    price: 50,
    isAvailable: true,
    isSpecial: false,
    imageUrl: null,
  },
  {
    id: 'unconfirmed-dessert',
    name: 'Fruit Custard',
    category: { name: 'Desserts', isAvailable: true },
    cuisines: [],
    mealTimes: ['ALL_DAY'],
    dietaryTags: [],
    allergens: [],
    allergenNote: null,
    spiceLevel: null,
    price: 45,
    isAvailable: true,
    isSpecial: false,
    imageUrl: null,
  },
  {
    id: 'staff-disabled-lunch',
    name: 'Disabled Rice Bowl',
    category: { name: 'Rice Bowls', isAvailable: true },
    cuisines: ['Indian'],
    mealTimes: ['LUNCH'],
    dietaryTags: [],
    allergens: [],
    allergenNote: null,
    spiceLevel: null,
    price: 100,
    isAvailable: false,
    isSpecial: false,
    imageUrl: null,
  },
];

describe('Chat rules and grounded AI responses', () => {
  it('handles greetings and casual chat without AI', async () => {
    const greeting = await answerChat('Hello!', [], menuFixtures, now, vi.fn(), true);
    const casual = await answerChat('Thanks', [], menuFixtures, now, vi.fn(), true);

    expect(greeting.intent).toBe('greeting');
    expect(casual.intent).toBe('greeting');
    expect(greeting.reply).toMatch(/Hi!/);
  });

  it('redirects unrelated questions without listing items or calling AI', async () => {
    const generator = vi.fn();
    const result = await answerChat('Who won the cricket score today?', [], menuFixtures, now, generator, true);

    expect(result.intent).toBe('redirect');
    expect(result.items).toEqual([]);
    expect(generator).not.toHaveBeenCalled();
  });

  it('lists today’s special items from the database context', async () => {
    const result = await answerChat("What's today's special?", [], menuFixtures, now);

    expect(result.intent).toBe('specials');
    expect(result.items.map((item) => item.id)).toEqual(['chaat-special']);
  });

  it('filters cuisine and category recommendations to available items', async () => {
    const chinese = await answerChat('Recommend Chinese dishes', [], menuFixtures, now);
    const chaat = await answerChat('Recommend chaats', [], menuFixtures, now);

    expect(chinese.items.map((item) => item.id)).toEqual(['chinese-noodles']);
    expect(chaat.items.map((item) => item.id)).toEqual(['chaat-special']);
  });

  it('lists only explicitly confirmed dairy-free desserts and includes the safety line', async () => {
    const result = await answerChat('Milk-free desserts available now', [], menuFixtures, now);

    expect(result.intent).toBe('dairy_free');
    expect(result.items.map((item) => item.id)).toEqual(['explicit-dairy-free-dessert']);
    expect(result.reply).toContain('Please check allergens on the item page or ask the counter before ordering.');
  });

  it('splits lunch items by current availability and gives unavailable reasons', async () => {
    const result = await answerChat('Which lunch items are available or unavailable?', [], menuFixtures, now);

    expect(result.intent).toBe('lunch');
    expect(result.items.map((item) => [item.id, item.available])).toEqual([
      ['chaat-special', true],
      ['staff-disabled-lunch', false],
    ]);
    expect(result.reply).toContain('Disabled by staff'.toLowerCase());
  });

  it('reports lunch items outside their meal window', async () => {
    const result = await answerChat('Lunch items available?', [], menuFixtures, new Date('2026-01-01T05:00:00.000Z'));

    expect(result.items.find((item) => item.id === 'chaat-special')?.available).toBe(false);
    expect(result.reply).toContain('outside meal window');
  });

  it('falls back when Gemini returns an invented item id', async () => {
    const generator = vi.fn().mockResolvedValue({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: 'Try this dish.', itemIds: ['invented'] }) }] } }],
    });
    const result = await answerChat('Recommend Chinese dishes', [], menuFixtures, now, generator, true);

    expect(result.outcome).toBe('fallback');
    expect(result.items.map((item) => item.id)).toEqual(['chinese-noodles']);
  });

  it('uses a valid friendly response and only returns selected database items', async () => {
    const generator = vi.fn().mockResolvedValue({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({ reply: 'Vegetable Hakka Noodles are a tasty choice.', itemIds: ['chinese-noodles'] }),
          }],
        },
      }],
    });
    const result = await answerChat('Recommend Chinese dishes', [], menuFixtures, now, generator, true);

    expect(result.outcome).toBe('ai');
    expect(result.reply).toBe('Vegetable Hakka Noodles are a tasty choice.');
    expect(result.items.map((item) => item.id)).toEqual(['chinese-noodles']);
  });

  it('rejects Gemini allergen or dietary claims', async () => {
    const generator = vi.fn().mockResolvedValue({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: 'This is dairy-free.', itemIds: ['explicit-dairy-free-dessert'] }) }] } }],
    });
    const result = await answerChat('Milk-free desserts available now', [], menuFixtures, now, generator, true);

    expect(result.outcome).toBe('fallback');
    expect(result.reply).toContain('Please check allergens on the item page or ask the counter before ordering.');
    expect(result.items.map((item) => item.id)).toEqual(['explicit-dairy-free-dessert']);
  });

  it('uses the rule-based response when Gemini returns null', async () => {
    const generator = vi.fn().mockResolvedValue(null);
    const result = await answerChat('Recommend Chinese dishes', [], menuFixtures, now, generator, true);

    expect(result.outcome).toBe('fallback');
    expect(result.items.map((item) => item.id)).toEqual(['chinese-noodles']);
  });
});

describe('POST /api/chat', () => {
  const student = {
    id: 'chat-student',
    name: 'Chat Student',
    email: 'student@example.test',
    passwordHash: 'not-used',
    role: 'STUDENT',
    isActive: true,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };

  const tokenFor = (role: string, userId: string) =>
    jwt.sign({ userId, email: `${userId}@example.test`, role }, env.JWT_SECRET, { algorithm: 'HS256' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires authentication and restricts access to students', async () => {
    const menuRead = vi.spyOn(prisma.menuItem, 'findMany');
    const unauthorized = await request(app).post('/api/chat').send({ message: 'What is available?' });
    expect(unauthorized.status).toBe(401);

    const userLookup = vi.spyOn(prisma.user, 'findUnique');
    for (const role of ['STAFF', 'ADMIN']) {
      userLookup.mockResolvedValueOnce({ ...student, role } as any);
      const forbidden = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${tokenFor(role, student.id)}`)
        .send({ message: 'What is available?' });
      expect(forbidden.status).toBe(403);
    }
    expect(menuRead).not.toHaveBeenCalled();
  });

  it('validates message and history shape and limits', async () => {
    const validationStudent = { ...student, id: 'chat-validation-student' };
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(validationStudent as any);
    const menuRead = vi.spyOn(prisma.menuItem, 'findMany');
    const token = tokenFor('STUDENT', validationStudent.id);
    const invalidRequests = [
      { message: '   ' },
      { message: 'a'.repeat(301) },
      { message: 'hello', history: Array.from({ length: 7 }, () => ({ role: 'user', text: 'hi' })) },
      { message: 'hello', history: [{ role: 'system', text: 'hello' }] },
      { message: 'hello', history: [{ role: 'user', text: 'x'.repeat(301) }] },
    ];

    for (const body of invalidRequests) {
      const response = await request(app).post('/api/chat').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.status).toBe(400);
    }
    expect(menuRead).not.toHaveBeenCalled();
  });

  it('uses a dedicated per-user limit of 20 requests per five minutes', async () => {
    const limitedStudent = { ...student, id: 'chat-limited-student' };
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => ({
      ...limitedStudent,
      id: args.where.id,
    }) as any);
    vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue(menuFixtures as any);
    const token = tokenFor('STUDENT', limitedStudent.id);

    for (let index = 0; index < 20; index += 1) {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Hello' });
      expect(response.status).toBe(200);
    }
    const limited = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello' });

    expect(limited.status).toBe(429);
    const otherStudent = 'chat-another-student';
    const otherStudentResponse = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenFor('STUDENT', otherStudent)}`)
      .send({ message: 'Hello' });
    expect(otherStudentResponse.status).toBe(200);
    expect(prisma.menuItem.findMany).toHaveBeenCalledTimes(21);
  });

  it('reads menu context without invoking database writes or order creation', async () => {
    const readOnlyStudent = { ...student, id: 'chat-read-only-student' };
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(readOnlyStudent as any);
    vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue(menuFixtures as any);
    const menuCreate = vi.spyOn(prisma.menuItem, 'create').mockResolvedValue({} as any);
    const menuUpdate = vi.spyOn(prisma.menuItem, 'update').mockResolvedValue({} as any);
    const menuDelete = vi.spyOn(prisma.menuItem, 'delete').mockResolvedValue({} as any);
    const orderCreate = vi.spyOn(prisma.order, 'create').mockResolvedValue({} as any);
    const transaction = vi.spyOn(prisma, '$transaction').mockResolvedValue({} as any);

    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tokenFor('STUDENT', readOnlyStudent.id)}`)
      .send({ message: "What's today's special?" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      reply: expect.any(String),
      items: [{ id: 'chaat-special', name: 'Aloo Chaat', price: 60, available: expect.any(Boolean), imageUrl: '/images/aloo-chaat.jpg' }],
    });
    expect(menuCreate).not.toHaveBeenCalled();
    expect(menuUpdate).not.toHaveBeenCalled();
    expect(menuDelete).not.toHaveBeenCalled();
    expect(orderCreate).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
});
