import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { prisma } from '../src/prisma';
import { env } from '../src/config/env';

describe('Auth & RBAC Comprehensive Tests', () => {
  const commonPassword = 'password123';
  let commonHash: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    commonHash = await bcrypt.hash(commonPassword, 10);
  });

  describe('1. Student Registration Security', () => {
    it('always forces STUDENT role and ignores client-supplied role, isDemo, isActive, and custom id', async () => {
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      let createdData: any = null;
      vi.spyOn(prisma.user, 'create').mockImplementation(async (args: any) => {
        createdData = args.data;
        return {
          id: 'server-gen-id-123',
          name: args.data.name,
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          phone: args.data.phone,
          role: 'STUDENT',
          institutionId: args.data.institutionId,
          isActive: true,
          isDemo: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'janedoe@campus.edu',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'ADMIN', // malicious attempt to register as ADMIN
          isDemo: true, // malicious attempt to set isDemo
          isActive: false, // malicious attempt to deactivate
          id: 'hacked-id', // malicious custom ID
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('STUDENT');
      expect(res.body.user.isDemo).toBe(false);
      expect(res.body.user.isActive).toBe(true);
      expect(res.body.user.passwordHash).toBeUndefined();

      expect(createdData.role).toBe('STUDENT');
      expect(createdData.isActive).toBe(true);
      expect(createdData.isDemo).toBe(false);
    });
  });

  describe('2. Login Security & Timing Protection', () => {
    it('rejects wrong password with 401', async () => {
      const mockUser = {
        id: 'u1',
        name: 'User One',
        email: 'user1@test.com',
        passwordHash: commonHash,
        role: 'STUDENT',
        isActive: true,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'user1@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('executes dummy bcrypt compare when user does not exist for timing protection', async () => {
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);
      const compareSpy = vi.spyOn(bcrypt, 'compare');

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'nonexistent@test.com', password: 'somepassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(compareSpy).toHaveBeenCalledWith('somepassword', expect.stringMatching(/^\$2a\$10\$/));
    });

    it('rejects inactive user with 403', async () => {
      const mockUser = {
        id: 'u2',
        name: 'Disabled User',
        email: 'disabled@test.com',
        passwordHash: commonHash,
        role: 'STUDENT',
        isActive: false,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser as any);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'disabled@test.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/deactivated/i);
    });
  });

  describe('3. JWT & authenticateToken Middleware', () => {
    it('accepts valid token and returns safe user on GET /api/auth/me', async () => {
      const mockUser = {
        id: 'u3',
        name: 'Valid User',
        email: 'valid@test.com',
        passwordHash: commonHash,
        role: 'STUDENT',
        isActive: true,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const token = jwt.sign({ userId: 'u3', email: 'valid@test.com', role: 'STUDENT' }, env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '1h',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('valid@test.com');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('rejects expired token with 401', async () => {
      const expiredToken = jwt.sign(
        { userId: 'u3', email: 'valid@test.com', role: 'STUDENT' },
        env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/expired/i);
    });

    it('rejects token signed with wrong secret with 401', async () => {
      const badSecretToken = jwt.sign(
        { userId: 'u3', email: 'valid@test.com', role: 'STUDENT' },
        'wrong_secret_key_that_is_32_chars_long_12345',
        { algorithm: 'HS256' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${badSecretToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('rejects token signed with wrong algorithm (e.g. HS512 when pinned to HS256)', async () => {
      const wrongAlgoToken = jwt.sign(
        { userId: 'u3', email: 'valid@test.com', role: 'STUDENT' },
        env.JWT_SECRET,
        { algorithm: 'HS512' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongAlgoToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('rejects token if user has been deleted from database', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const token = jwt.sign({ userId: 'deleted-user-id', email: 'deleted@test.com', role: 'STUDENT' }, env.JWT_SECRET, {
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/not be found/i);
    });

    it('rejects token if user is deactivated in database', async () => {
      const inactiveUser = {
        id: 'deactivated-id',
        name: 'Deactivated User',
        email: 'deactivated@test.com',
        passwordHash: commonHash,
        role: 'STUDENT',
        isActive: false,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(inactiveUser as any);

      const token = jwt.sign({ userId: 'deactivated-id', email: 'deactivated@test.com', role: 'STUDENT' }, env.JWT_SECRET, {
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/deactivated/i);
    });

    it('respects role changes in the database instead of blindly trusting role from JWT', async () => {
      // User role in JWT is STUDENT, but database now has ADMIN
      const updatedUser = {
        id: 'promoted-user-id',
        name: 'Promoted User',
        email: 'promoted@test.com',
        passwordHash: commonHash,
        role: 'ADMIN', // DB has ADMIN
        isActive: true,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(updatedUser as any);
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([updatedUser as any]);

      const tokenWithOldRole = jwt.sign(
        { userId: 'promoted-user-id', email: 'promoted@test.com', role: 'STUDENT' },
        env.JWT_SECRET,
        { algorithm: 'HS256' }
      );

      // Attempt accessing ADMIN-only route
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokenWithOldRole}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].role).toBe('ADMIN');
    });
  });

  describe('4. RBAC requireRole Enforcement on Mounted Endpoints', () => {
    it('STUDENT cannot access STAFF route /api/staff/orders', async () => {
      const studentUser = {
        id: 's1',
        name: 'Student User',
        email: 'student@test.com',
        passwordHash: commonHash,
        role: 'STUDENT',
        isActive: true,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(studentUser as any);

      const token = jwt.sign({ userId: 's1', email: 'student@test.com', role: 'STUDENT' }, env.JWT_SECRET, {
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/staff/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Access denied/i);
    });

    it('STUDENT cannot access ADMIN route /api/admin/users', async () => {
      const studentUser = {
        id: 's1',
        name: 'Student User',
        email: 'student@test.com',
        passwordHash: commonHash,
        role: 'STUDENT',
        isActive: true,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(studentUser as any);

      const token = jwt.sign({ userId: 's1', email: 'student@test.com', role: 'STUDENT' }, env.JWT_SECRET, {
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Access denied/i);
    });

    it('STAFF cannot access ADMIN route /api/admin/users', async () => {
      const staffUser = {
        id: 'st1',
        name: 'Staff User',
        email: 'staff@test.com',
        passwordHash: commonHash,
        role: 'STAFF',
        isActive: true,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(staffUser as any);

      const token = jwt.sign({ userId: 'st1', email: 'staff@test.com', role: 'STAFF' }, env.JWT_SECRET, {
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Access denied/i);
    });

    it('ADMIN can access ADMIN route /api/admin/users', async () => {
      const adminUser = {
        id: 'adm1',
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: commonHash,
        role: 'ADMIN',
        isActive: true,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(adminUser as any);
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([adminUser as any]);

      const token = jwt.sign({ userId: 'adm1', email: 'admin@test.com', role: 'ADMIN' }, env.JWT_SECRET, {
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Password Hash Exclusion in Responses', () => {
    it('never exposes passwordHash in /api/admin/users response', async () => {
      const adminUser = {
        id: 'adm1',
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: commonHash,
        role: 'ADMIN',
        isActive: true,
        isDemo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(adminUser as any);
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([adminUser as any]);

      const token = jwt.sign({ userId: 'adm1', email: 'admin@test.com', role: 'ADMIN' }, env.JWT_SECRET, {
        algorithm: 'HS256',
      });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const userItem = res.body.data[0];
      expect(userItem.passwordHash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain(commonHash);
    });
  });
});
