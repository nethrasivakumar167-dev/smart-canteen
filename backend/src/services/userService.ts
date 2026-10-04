import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

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

// In-memory fallback store seeded with bcrypt hashes for resilience
let memoryUsers: StoredUser[] = [];
let isSeeded = false;

export async function initMemoryStore() {
  if (isSeeded) return;
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  memoryUsers = [
    {
      id: 'usr-student-01',
      name: 'Nethra Sundaram',
      email: 'student@demo.com',
      passwordHash,
      phone: '+91 98401 23456',
      role: 'STUDENT',
      institutionId: 'CS-2024-8841',
      isActive: true,
      points: 340,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr-faculty-01',
      name: 'Dr. S. Ramanathan',
      email: 'faculty@demo.com',
      passwordHash,
      phone: '+91 94440 87654',
      role: 'FACULTY',
      institutionId: 'FAC-EE-104',
      isActive: true,
      points: 820,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr-staff-01',
      name: 'Murugan (Chef & Kitchen Lead)',
      email: 'staff@demo.com',
      passwordHash,
      phone: '+91 98844 55667',
      role: 'STAFF',
      institutionId: 'STF-KIT-01',
      isActive: true,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'usr-admin-01',
      name: 'Ananya Sharma (General Manager)',
      email: 'admin@demo.com',
      passwordHash,
      phone: '+91 97909 11223',
      role: 'ADMIN',
      institutionId: 'ADM-GEN-01',
      isActive: true,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  isSeeded = true;
}

// Ensure memory store is initialized
initMemoryStore();

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
  
  // Try Prisma first
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanId, mode: 'insensitive' } },
          { institutionId: { equals: identifier.trim(), mode: 'insensitive' } },
        ],
      },
      include: { loyaltyAccount: true },
    });
    if (user) {
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
  } catch (err) {
    // If database unavailable, fall back to memory store
  }

  await initMemoryStore();
  const found = memoryUsers.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.institutionId && u.institutionId.toLowerCase() === cleanId)
  );
  return found || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { loyaltyAccount: true },
    });
    if (user) {
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
  } catch (err) {
    // Fall back to memory
  }

  await initMemoryStore();
  const found = memoryUsers.find((u) => u.id === id);
  return found || null;
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

  try {
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
            pointsBalance: 50, // Welcome points
            lifetimePoints: 50,
            tier: 'Silver',
          },
        },
      },
      include: { loyaltyAccount: true },
    });
    return toSafeUser(created);
  } catch (err) {
    // Fallback to memory
  }

  await initMemoryStore();
  const newUser: StoredUser = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: data.name.trim(),
    email: cleanEmail,
    passwordHash: data.passwordHash,
    phone: data.phone?.trim() || null,
    role,
    institutionId: data.institutionId?.trim() || null,
    isActive: true,
    points: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryUsers.push(newUser);
  return toSafeUser(newUser);
}

export async function getAllUsersList(): Promise<SafeUser[]> {
  try {
    const users = await prisma.user.findMany({
      include: { loyaltyAccount: true },
      orderBy: { createdAt: 'desc' },
    });
    if (users && users.length > 0) {
      return users.map(toSafeUser);
    }
  } catch (err) {
    // Fall back to memory
  }

  await initMemoryStore();
  return memoryUsers.map(toSafeUser);
}
