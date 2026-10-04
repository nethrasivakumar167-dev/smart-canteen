import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

export type Role = 'STUDENT' | 'FACULTY' | 'VISITOR' | 'STAFF' | 'ADMIN';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  institutionId?: string | null;
  isActive: boolean;
  points?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredUser extends SafeUser {
  passwordHash: string;
}

export function toSafeUser(user: StoredUser | any): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role as Role,
    institutionId: user.institutionId || null,
    isActive: user.isActive !== undefined ? user.isActive : true,
    points: user.points !== undefined ? user.points : (user.loyaltyAccount?.pointsBalance || 0),
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
  };
}

export async function findUserByEmailOrId(identifier: string): Promise<StoredUser | null> {
  const cleanId = identifier.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanId, mode: 'insensitive' } },
        { institutionId: { equals: identifier.trim(), mode: 'insensitive' } },
      ],
    },
    include: { loyaltyAccount: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    phone: user.phone,
    role: user.role as Role,
    institutionId: user.institutionId,
    isActive: user.isActive,
    points: user.loyaltyAccount?.pointsBalance || 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { loyaltyAccount: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    phone: user.phone,
    role: user.role as Role,
    institutionId: user.institutionId,
    isActive: user.isActive,
    points: user.loyaltyAccount?.pointsBalance || 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createNewUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role?: Role;
  institutionId?: string;
}): Promise<SafeUser> {
  const role: Role = data.role || 'STUDENT';
  const cleanEmail = data.email.trim().toLowerCase();

  const created = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash: data.passwordHash,
      phone: data.phone?.trim() || null,
      role: role as any,
      institutionId: data.institutionId?.trim() || null,
      isActive: true,
      loyaltyAccount: {
        create: {
          pointsBalance: 50,
          lifetimePoints: 50,
          tier: 'Silver',
        },
      },
    },
    include: { loyaltyAccount: true },
  });

  return toSafeUser(created);
}

export async function getAllUsersList(): Promise<SafeUser[]> {
  const users = await prisma.user.findMany({
    include: { loyaltyAccount: true },
    orderBy: { createdAt: 'desc' },
  });
  return users.map(toSafeUser);
}

export function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code);
  }
  return false;
}