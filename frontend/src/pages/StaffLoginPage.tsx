import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import {
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso hover:text-navy transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Switch Portal</span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/brand/campusbite-logo.jpg"
            width={72}
            height={72}
            className="mx-auto object-contain"
            alt="CampusBite"
          />
          <div className="inline-block px-3 py-0.5 rounded-full bg-skyblue text-navy text-xs font-extrabold uppercase tracking-wider">
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
        <div className="p-3.5 rounded-2xl bg-butter border border-gold text-xs text-navy flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-navy shrink-0" />
            <span>Staff Demo: <strong>staff@demo.com</strong> / <strong>password123</strong></span>
          </div>
          <button type="button" onClick={handleQuickFill} className="px-btn px-btn--sky min-h-0 px-3 py-1 text-[10px]">
            Auto-fill
          </button>
        </div>

        {/* Error Alert */}
        {(localError || error) && (
          <div className="px-card flex items-center gap-2.5 rounded-2xl bg-butter p-3.5 text-xs text-navy animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-navy" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleLogin} className="px-card space-y-4 rounded-2xl p-6 sm:p-8">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy font-pixel">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-skyblue"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy font-pixel">
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
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-skyblue"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-espresso hover:text-navy"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-btn mt-2 w-full disabled:cursor-not-allowed disabled:opacity-50"
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
          <ShieldAlert className="w-3.5 h-3.5 text-navy shrink-0" />
          <span>Staff credentials are provisioned by Canteen Administration.</span>
        </div>

      </div>
    </div>
  );
};