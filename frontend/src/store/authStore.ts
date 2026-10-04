import { create } from 'zustand';
import axios from 'axios';
import { User, Role } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure Axios defaults
axios.defaults.baseURL = API_BASE_URL;

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  error?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  studentId?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  error: string | null;

  // Actions
  login: (identifier: string, password: string, targetPortal?: 'STUDENT' | 'STAFF' | 'ADMIN') => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (data: Partial<User>) => void;
}

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sc_token');
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

// Configure initial axios authorization header
const initialToken = getInitialToken();
if (initialToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  isAuthenticated: !!getInitialToken() && !!getInitialUser(),
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  clearError: () => set({ error: null }),

  login: async (identifier, password, targetPortal) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<AuthResponse>('/auth/login', {
        identifier,
        password,
        portal: targetPortal,
      });

      if (response.data.success && response.data.user && response.data.token) {
        const { user, token } = response.data;
        localStorage.setItem('sc_token', token);
        localStorage.setItem('sc_user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return { success: true, user };
      } else {
        const errMsg = response.data.error || 'Authentication failed. Please check credentials.';
        set({ isLoading: false, error: errMsg });
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to connect to authentication server. Please try again.';
      set({ isLoading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<AuthResponse>('/auth/register', data);

      if (response.data.success && response.data.user && response.data.token) {
        const { user, token } = response.data;
        localStorage.setItem('sc_token', token);
        localStorage.setItem('sc_user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return { success: true, user };
      } else {
        const errMsg = response.data.error || 'Registration failed.';
        set({ isLoading: false, error: errMsg });
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed. Please check your information.';
      set({ isLoading: false, error: errMsg });
      return { success: false, error: errMsg };
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('sc_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isCheckingAuth: false });
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get<AuthResponse>('/auth/me');

      if (response.data.success && response.data.user) {
        localStorage.setItem('sc_user', JSON.stringify(response.data.user));
        set({
          user: response.data.user,
          token,
          isAuthenticated: true,
          isCheckingAuth: false,
        });
      } else {
        localStorage.removeItem('sc_token');
        localStorage.removeItem('sc_user');
        delete axios.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false, isCheckingAuth: false });
      }
    } catch {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
      delete axios.defaults.headers.common['Authorization'];
      set({ user: null, token: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  logout: async () => {
    try {
      await axios.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
      delete axios.defaults.headers.common['Authorization'];
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  updateUser: (data) =>
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...data };
      localStorage.setItem('sc_user', JSON.stringify(updated));
      return { user: updated };
    }),
}));
