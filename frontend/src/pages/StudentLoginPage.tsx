import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const StudentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useToastStore();

  const [identifier, setIdentifier] = useState<string>('student@demo.com');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/student/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!identifier.trim() || !password) {
      setLocalError('Please provide both your Student Email / ID and Password.');
      return;
    }

    const res = await login(identifier.trim(), password, 'STUDENT');
    if (res.success && res.user) {
      addToast({
        type: 'success',
        title: `Welcome back, ${res.user.name.split(' ')[0]}!`,
        message: 'Signed in successfully to Student Portal.',
      });
      navigate(from, { replace: true });
    } else {
      setLocalError(res.error || 'Invalid credentials or access denied.');
    }
  };

  const handleQuickFill = () => {
    setIdentifier('student@demo.com');
    setPassword('password123');
    setLocalError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Back to portals */}
        <Link
          to="/portals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Switch Portal</span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-glow">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="inline-block px-3 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 text-xs font-extrabold uppercase tracking-wider">
            Student & Diner Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Student Sign In
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Preorder meals, skip the canteen queue & track orders live
          </p>
        </div>

        {/* Demo Credentials Quick Fill Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Demo: <strong>student@demo.com</strong> / <strong>password123</strong></span>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 transition"
          >
            Auto-fill
          </button>
        </div>

        {/* Error Alert */}
        {(localError || error) && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 bg-white dark:bg-dark-surface p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-dark-border shadow-md">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Student Email or Roll ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="student@demo.com or CS-2024-8841"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <span className="text-[11px] text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-bold text-sm shadow-md hover:shadow-glow transition transform active:scale-98 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              'Sign In to Student Portal'
            )}
          </button>
        </form>

        {/* Footer Link to Register */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Don't have a student account yet?{' '}
            <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
              Create Student Account
            </Link>
          </p>
          <div className="text-[11px] text-gray-400">
            Are you Canteen Staff?{' '}
            <Link to="/staff/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Staff Portal →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
