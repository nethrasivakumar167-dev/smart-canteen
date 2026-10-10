import bcrypt from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';
import { createAdminAccount } from '../scripts/createAdmin';

describe('createAdminAccount', () => {
  it('validates input, hashes with the auth cost, and creates a non-demo admin', async () => {
    const userStore = {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async ({ data }) => ({
        id: 'admin-1',
        name: data.name,
        email: data.email,
        role: data.role,
      })),
    };

    const created = await createAdminAccount({
      name: '  Campus Admin  ',
      email: '  ADMIN@CAMPUS.EDU ',
      role: 'ADMIN',
      password: 'a-secure-password',
    }, userStore);

    expect(userStore.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'admin@campus.edu', mode: 'insensitive' } },
    });
    expect(userStore.create).toHaveBeenCalledOnce();
    const { passwordHash, ...storedData } = userStore.create.mock.calls[0][0].data;
    expect(storedData).toEqual({
      name: 'Campus Admin',
      email: 'admin@campus.edu',
      role: 'ADMIN',
      isActive: true,
      isDemo: false,
    });
    expect(passwordHash).toMatch(/^\$2[ab]\$10\$/);
    expect(await bcrypt.compare('a-secure-password', passwordHash)).toBe(true);
    expect(created).toEqual({
      id: 'admin-1',
      name: 'Campus Admin',
      email: 'admin@campus.edu',
      role: 'ADMIN',
    });
  });

  it('refuses duplicate emails without creating a user', async () => {
    const userStore = {
      findFirst: vi.fn().mockResolvedValue({ id: 'existing' }),
      create: vi.fn(),
    };

    await expect(createAdminAccount({
      name: 'Campus Admin',
      email: 'admin@campus.edu',
      role: 'STAFF',
      password: 'a-secure-password',
    }, userStore)).rejects.toThrow('A user with this email already exists.');
    expect(userStore.create).not.toHaveBeenCalled();
  });

  it('requires at least 12 characters and the existing admin field rules', async () => {
    const userStore = { findFirst: vi.fn(), create: vi.fn() };
    await expect(createAdminAccount({
      name: 'A',
      email: 'not-an-email',
      role: 'STUDENT',
      password: 'too-short',
    }, userStore)).rejects.toThrow();
    expect(userStore.findFirst).not.toHaveBeenCalled();
  });
});
