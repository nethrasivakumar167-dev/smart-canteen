import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Role } from '../types';
import {
  UtensilsCrossed,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  Briefcase,
  ChefHat,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { demoLogin } = useAuthStore();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState<string>('student@demo.com');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please enter both email and password.',
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      let role: Role = 'STUDENT';
      if (email.includes('faculty')) role = 'FACULTY';
      else if (email.includes('staff')) role = 'STAFF';
      else if (email.includes('admin')) role = 'ADMIN';

      demoLogin(role);
      addToast({
        type: 'success',
        title: `Welcome back!`,
        message: `Signed in as ${role}.`,
      });
      navigate('/menu');
    }, 600);
  };

  const handleQuickDemoLogin = (role: Role) => {
    demoLogin(role);
    addToast({
      type: 'success',
      title: `Demo Account Activated`,
      message: `Signed in instantly as ${role}.`,
    });
    navigate('/menu');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-glow">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Sign in to Smart Canteen
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Skip the queue and preorder meals in seconds
          </p>
        </div>

        {/* Quick Demo Switcher Buttons */}
        <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200/80 dark:border-dark-border shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400">
              <Sparkles className="w-3.5 h-3.5" />
              1-Click Demo Accounts
            </span>
            <span>Select Role</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('STUDENT')}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-card hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 border border-gray-200 dark:border-dark-border text-left font-bold transition flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-brand-500 shrink-0" />
              <div className="truncate">
                <div>Student</div>
                <div className="text-[10px] text-gray-400 font-normal">student@demo.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('FACULTY')}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-card hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 border border-gray-200 dark:border-dark-border text-left font-bold transition flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="truncate">
                <div>Faculty</div>
                <div className="text-[10px] text-gray-400 font-normal">faculty@demo.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('STAFF')}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-card hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 border border-gray-200 dark:border-dark-border text-left font-bold transition flex items-center gap-2"
            >
              <ChefHat className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <div>Kitchen Staff</div>
                <div className="text-[10px] text-gray-400 font-normal">staff@demo.com</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('ADMIN')}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-card hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 border border-gray-200 dark:border-dark-border text-left font-bold transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="truncate">
                <div>Admin</div>
                <div className="text-[10px] text-gray-400 font-normal">admin@demo.com</div>
              </div>
            </button>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-4 bg-white dark:bg-dark-surface p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-dark-border shadow-md">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Campus Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@campus.edu"
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
                Forgot?
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
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-bold text-sm shadow-md hover:shadow-glow transition transform active:scale-98 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In to Account'}
          </button>

          {/* Visitor link */}
          <div className="pt-2 text-center border-t border-gray-100 dark:border-dark-border">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('VISITOR')}
              className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-600 transition flex items-center justify-center gap-1 mx-auto"
            >
              <UserCheck className="w-3.5 h-3.5 text-brand-500" />
              <span>Visiting campus? Preorder as Guest →</span>
            </button>
          </div>
        </form>

        {/* Footer Link to Register */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Don't have an institutional account yet?{' '}
          <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Register as Student / Faculty
          </Link>
        </p>

      </div>
    </div>
  );
};
