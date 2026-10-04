import { create } from 'zustand';
import { User, Role } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  demoLogin: (role: Role) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const DEMO_USERS: Record<Role, User> = {
  STUDENT: {
    id: 'usr-student-1',
    name: 'Nethra Sundaram',
    email: 'student@demo.com',
    phone: '+91 98401 23456',
    role: 'STUDENT',
    institutionId: 'CS-2024-8841',
    isActive: true,
    points: 340,
  },
  FACULTY: {
    id: 'usr-faculty-1',
    name: 'Dr. S. Ramanathan',
    email: 'faculty@demo.com',
    phone: '+91 94440 87654',
    role: 'FACULTY',
    institutionId: 'FAC-EE-104',
    isActive: true,
    points: 820,
  },
  STAFF: {
    id: 'usr-staff-1',
    name: 'Murugan (Kitchen Lead)',
    email: 'staff@demo.com',
    phone: '+91 98844 55667',
    role: 'STAFF',
    institutionId: 'STF-KIT-01',
    isActive: true,
  },
  ADMIN: {
    id: 'usr-admin-1',
    name: 'Ananya Sharma (General Mgr)',
    email: 'admin@demo.com',
    phone: '+91 97909 11223',
    role: 'ADMIN',
    institutionId: 'ADM-GEN-01',
    isActive: true,
  },
  VISITOR: {
    id: 'usr-visitor-1',
    name: 'Campus Guest',
    email: 'visitor@guest.com',
    phone: '+91 91234 56789',
    role: 'VISITOR',
    institutionId: 'GUEST-V-99',
    isActive: true,
    points: 0,
  },
};

const getInitialUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('sc_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sc_token');
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthenticated: !!getInitialUser(),

  login: (user, token) => {
    localStorage.setItem('sc_user', JSON.stringify(user));
    localStorage.setItem('sc_token', token);
    set({ user, token, isAuthenticated: true });
  },

  demoLogin: (role) => {
    const demoUser = DEMO_USERS[role];
    const demoToken = `mock-jwt-token-for-${role.toLowerCase()}-${Date.now()}`;
    localStorage.setItem('sc_user', JSON.stringify(demoUser));
    localStorage.setItem('sc_token', demoToken);
    set({ user: demoUser, token: demoToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('sc_user');
    localStorage.removeItem('sc_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (data) =>
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...data };
      localStorage.setItem('sc_user', JSON.stringify(updated));
      return { user: updated };
    }),
}));
