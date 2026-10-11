import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // 1. Validation
    if (!name.trim() || !email.trim() || !password) {
      setLocalError('Please fill in all mandatory fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please re-enter.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid campus email address.');
      return;
    }

    // 2. Submit to backend
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      studentId: studentId.trim() || undefined,
      phone: phone.trim() || undefined,
      password,
      confirmPassword,
    });

    if (res.success && res.user) {
      addToast({
        type: 'success',
        title: 'Account Registered Successfully!',
        message: `Welcome to Smart Canteen, ${res.user.name.split(' ')[0]}!`,
      });
      navigate('/student/dashboard', { replace: true });
    } else {
      setLocalError(res.error || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-beige">
      <div className="max-w-lg w-full space-y-6">
        
        {/* Back Link */}
        <Link
          to="/student/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso hover:text-navy transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Login</span>
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
          <div className="inline-block px-3 py-0.5 rounded-full bg-navy/10 text-navy text-xs font-extrabold uppercase tracking-wider">
            New Student Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Create Student Account
          </h1>
          <p className="text-xs sm:text-sm text-espresso">
            Sign up to preorder hot food, skip queue lines & earn campus loyalty perks
          </p>
        </div>

        {/* Error Alert */}
        {(localError || error) && (
          <div className="px-card flex items-center gap-2.5 rounded-2xl bg-butter p-3.5 text-xs text-navy animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-navy" />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleRegister} className="px-card space-y-4 rounded-2xl p-6 sm:p-8">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy font-pixel">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nethra Sundaram"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/50"
              />
            </div>
          </div>

          {/* Email & Student ID Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-navy font-pixel">
                Campus Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rollno@campus.edu"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-navy font-pixel">
                Student ID / Roll No
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. CS-2026-8841"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/50"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy font-pixel">
              Mobile Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98401 23456"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/50"
              />
            </div>
          </div>

          {/* Password & Confirm Password Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-navy font-pixel">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso hover:text-navy"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-navy font-pixel">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/50"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-btn w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                  Creating Student Account...
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>

        {/* Link to Login */}
        <p className="text-center text-xs text-espresso">
          Already have an account?{' '}
          <Link to="/student/login" className="font-bold text-navy hover:underline">
            Sign in here
          </Link>
        </p>

      </div>
    </div>
  );
};