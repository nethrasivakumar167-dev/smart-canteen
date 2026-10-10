import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import app from '../src/app';
import { prisma } from '../src/prisma';
import bcrypt from 'bcryptjs';

describe('Strict Portal Role Enforcement', () => {
  let studentUser: any;
  let staffUser: any;
  let adminUser: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const commonPasswordHash = await bcrypt.hash('password123', 10);

    studentUser = {
      id: 'student-id-1',
      name: 'Test Student',
      email: 'student@demo.com',
      passwordHash: commonPasswordHash,
      role: 'STUDENT',
      isActive: true,
      isDemo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    staffUser = {
      id: 'staff-id-1',
      name: 'Test Staff',
      email: 'staff@demo.com',
      passwordHash: commonPasswordHash,
      role: 'STAFF',
      isActive: true,
      isDemo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    adminUser = {
      id: 'admin-id-1',
      name: 'Test Admin',
      email: 'admin@demo.com',
      passwordHash: commonPasswordHash,
      role: 'ADMIN',
      isActive: true,
      isDemo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  it('STUDENT portal login succeeds for STUDENT, rejected for STAFF and ADMIN', async () => {
    vi.spyOn(prisma.user, 'findFirst').mockImplementation(async (args: any) => {
      const email = args?.where?.OR?.[0]?.email?.equals;
      if (email === 'student@demo.com') return studentUser;
      if (email === 'staff@demo.com') return staffUser;
      if (email === 'admin@demo.com') return adminUser;
      return null;
    });

    // Student -> Student login (200)
    const resStudent = await request(app)
      .post('/api/auth/student/login')
      .send({ identifier: 'student@demo.com', password: 'password123' });
    expect(resStudent.status).toBe(200);

    // Staff -> Student login (403)
    const resStaff = await request(app)
      .post('/api/auth/student/login')
      .send({ identifier: 'staff@demo.com', password: 'password123' });
    expect(resStaff.status).toBe(403);

    // Admin -> Student login (403)
    const resAdmin = await request(app)
      .post('/api/auth/student/login')
      .send({ identifier: 'admin@demo.com', password: 'password123' });
    expect(resAdmin.status).toBe(403);
  });

  it('STAFF portal login succeeds for STAFF, rejected for STUDENT and ADMIN', async () => {
    vi.spyOn(prisma.user, 'findFirst').mockImplementation(async (args: any) => {
      const email = args?.where?.OR?.[0]?.email?.equals;
      if (email === 'student@demo.com') return studentUser;
      if (email === 'staff@demo.com') return staffUser;
      if (email === 'admin@demo.com') return adminUser;
      return null;
    });

    // Staff -> Staff login (200)
    const resStaff = await request(app)
      .post('/api/auth/staff/login')
      .send({ identifier: 'staff@demo.com', password: 'password123' });
    expect(resStaff.status).toBe(200);

    // Student -> Staff login (403)
    const resStudent = await request(app)
      .post('/api/auth/staff/login')
      .send({ identifier: 'student@demo.com', password: 'password123' });
    expect(resStudent.status).toBe(403);

    // Admin -> Staff login (403)
    const resAdmin = await request(app)
      .post('/api/auth/staff/login')
      .send({ identifier: 'admin@demo.com', password: 'password123' });
    expect(resAdmin.status).toBe(403);
  });

  it('ADMIN portal login succeeds for ADMIN, rejected for STUDENT and STAFF', async () => {
    vi.spyOn(prisma.user, 'findFirst').mockImplementation(async (args: any) => {
      const email = args?.where?.OR?.[0]?.email?.equals;
      if (email === 'student@demo.com') return studentUser;
      if (email === 'staff@demo.com') return staffUser;
      if (email === 'admin@demo.com') return adminUser;
      return null;
    });

    // Admin -> Admin login (200)
    const resAdmin = await request(app)
      .post('/api/auth/admin/login')
      .send({ identifier: 'admin@demo.com', password: 'password123' });
    expect(resAdmin.status).toBe(200);

    // Student -> Admin login (403)
    const resStudent = await request(app)
      .post('/api/auth/admin/login')
      .send({ identifier: 'student@demo.com', password: 'password123' });
    expect(resStudent.status).toBe(403);

    // Staff -> Admin login (403)
    const resStaff = await request(app)
      .post('/api/auth/admin/login')
      .send({ identifier: 'staff@demo.com', password: 'password123' });
    expect(resStaff.status).toBe(403);
  });
});
