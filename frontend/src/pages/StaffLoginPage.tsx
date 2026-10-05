import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import {
  ChefHat,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const StaffLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useToastStore();

  const [identifier, setIdentifier] = useState<string>('staff@demo.com');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/staff/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!identifier.trim() || !password) {
      setLocalError('Please provide your Staff ID / Email and Password.');
      return;
    }

    const res = await login(identifier.trim(), password, 'STAFF');
    if (res.success && res.user) {
      addToast({
        type: 'success',
        title: `Welcome, ${res.user.name}!`,
        message: 'Signed in successfully to Staff Kitchen Operations.',
      });
      navigate(from, { replace: true });
    } else {
      setLocalError(res.error || 'Authentication failed. Please verify staff credentials.');
    }
  };

  const handleQuickFill = () => {
    setIdentifier('staff@demo.com');
    setPassword('password123');
    setLocalError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-beige">
      <div className="max-w-md w-full space-y-6">
        
        {/* Back Link */}
        <Link
          to="/portals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Switch Portal</span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <ChefHat className="w-7 h-7" />
          </div>
          <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-extrabold uppercase tracking-wider">
            Kitchen & Staff Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Staff Sign In
          </h1>
          <p className="text-xs sm:text-sm text-espresso">
            Canteen kitchen control, live orders & food availability panel
          </p>
        </div>

        {/* Demo Credentials Quick Fill Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Staff Demo: <strong>staff@demo.com</strong> / <strong>password123</strong></span>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition"
          >
            Auto-fill
          </button>
        </div>

        {/* Error Alert */}
        {(localError || error) && (
          <div className="p-3.5 rounded-2xl bg-rust/10 border border-rust/20 text-xs text-rust flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rust shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleLogin} className="space-y-4 bg-sand p-6 sm:p-8 rounded-3xl border border-line shadow-md">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-espresso">
              Staff ID or Canteen Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="staff@demo.com or STF-KIT-01"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-espresso">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-espresso hover:text-emerald-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md transition transform active:scale-98 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              'Sign In to Staff Portal'
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="p-3 rounded-xl bg-sand/30 border border-line text-center text-xs text-espresso flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Staff credentials are provisioned by Canteen Administration.</span>
        </div>

      </div>
    </div>
  );
};