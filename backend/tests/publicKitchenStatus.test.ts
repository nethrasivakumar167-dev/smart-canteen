import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import app from '../src/app';
import { prisma } from '../src/prisma';

describe('GET /api/public/kitchen-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns public aggregate kitchen and feedback metrics without personal data', async () => {
    vi.spyOn(prisma.order, 'count').mockResolvedValue(3);
    vi.spyOn(prisma.feedback, 'aggregate').mockResolvedValue({
      _avg: { rating: 4.6 },
      _count: { id: 7 },
    } as any);

    const response = await request(app)
      .get('/api/public/kitchen-status')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        activeOrdersCount: 3,
        averageRating: 4.6,
        feedbackCount: 7,
      },
    });
    expect(prisma.order.count).toHaveBeenCalledWith({
      where: { orderStatus: { in: ['RECEIVED', 'PREPARING'] } },
    });
  });

  it('returns a null average rating when there is no feedback', async () => {
    vi.spyOn(prisma.order, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.feedback, 'aggregate').mockResolvedValue({
      _avg: { rating: null },
      _count: { id: 0 },
    } as any);

    const response = await request(app)
      .get('/api/public/kitchen-status')
      .expect(200);

    expect(response.body.data.averageRating).toBeNull();
    expect(response.body.data.feedbackCount).toBe(0);
  });
});
