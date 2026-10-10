import request from 'supertest';
import { vi } from 'vitest';
import { Prisma } from '@prisma/client';
import app from '../src/app';
import { prisma } from '../src/prisma';

describe('Error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/auth/login returns 503 when Prisma connection error', async () => {
    const err = new Prisma.PrismaClientInitializationError("Can't reach database server at localhost:5432", undefined, 'P1001');
    vi.spyOn(prisma.user, 'findFirst').mockRejectedValue(err);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'student@demo.com', password: 'password123' })
      .expect(503);

    expect(response.body).toEqual({
      success: false,
      error: 'Service temporarily unavailable.',
    });
    // Ensure no internal details leaked
    expect(JSON.stringify(response.body)).not.toMatch(/prisma|table|localhost/i);
  });

  it('POST /api/auth/login returns 500 when Prisma P2021 (missing table)', async () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Table "User" does not exist in the current database.',
      { code: 'P2021', clientVersion: '5.22.0' }
    );
    vi.spyOn(prisma.user, 'findFirst').mockRejectedValue(err);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'student@demo.com', password: 'password123' })
      .expect(500);

    expect(response.body).toEqual({
      success: false,
      error: 'Something went wrong. Please try again.',
    });
    // Ensure no internal details leaked
    expect(JSON.stringify(response.body)).not.toMatch(/prisma|table|localhost/i);
  });

  it('returns 400 for malformed JSON request bodies', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ invalid json')
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: 'Request body contains invalid JSON.',
    });
  });
});