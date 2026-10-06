import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import app from '../src/app';
import { prisma } from '../src/prisma';
import bcrypt from 'bcryptjs';

describe('Login Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('failed logins eventually return 429 while successful logins do not count against the limit', async () => {
    const mockUser = {
      id: 'test-user-id',
      name: 'Test Student',
      email: 'student@demo.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'STUDENT',
      isActive: true,
      isDemo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser as any);

    // 1. Send successful logins - should succeed each time and NOT decrease rate limit counter
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'student@demo.com', password: 'password123' });
      expect(res.status).toBe(200);
    }

    // 2. Send 10 failed logins (max = 10 for loginLimiter)
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'student@demo.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    }

    // 3. The 11th failed login attempt should hit rate limit and return 429
    const rateLimitedRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'student@demo.com', password: 'wrongpassword' });

    expect(rateLimitedRes.status).toBe(429);
    expect(rateLimitedRes.body).toEqual({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
    });
  });
});
