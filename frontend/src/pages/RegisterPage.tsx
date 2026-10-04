import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { Role } from '../types';
import {
  UtensilsCrossed,
  User,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useToastStore();

  const [role, setRole] = useState<Role>('STUDENT');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [institutionId, setInstitutionId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast({
        type: 'warning',
        title: 'Required Information',
        message: 'Please fill in all mandatory fields.',
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        phone,
        role,
        institutionId: institutionId || (role === 'STUDENT' ? 'STU-2026-99' : 'FAC-2026-99'),
        isActive: true,
        points: 50, // Welcome bonus loyalty points!
      };
      const fakeToken = `jwt-token-${Date.now()}`;
      login(newUser, fakeToken);

      addToast({
        type: 'success',
        title: 'Account Created!',
        message: `Welcome to Smart Canteen! +50 bonus loyalty points added.`,
      });
      navigate('/menu');
    }, 800);
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
            Create Campus Account
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Join the smart preorder queue and earn campus dining rewards
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleRegister} className="space-y-4 bg-white dark:bg-dark-surface p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-dark-border shadow-md">
          
          {/* Role Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Select Your Campus Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                  role === 'STUDENT'
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('FACULTY')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                  role === 'FACULTY'
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Faculty / Staff</span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nethra Sundaram"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>

          {/* Campus Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Campus Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rollno@campus.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>

          {/* Mobile & ID Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98401..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {role === 'STUDENT' ? 'Student ID / Roll No' : 'Staff ID'}
              </label>
              <input
                type="text"
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                placeholder={role === 'STUDENT' ? 'CS-2024-8841' : 'FAC-104'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Create Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-bold text-sm shadow-md hover:shadow-glow transition transform active:scale-98 disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        {/* Link to Login */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Already registered on Smart Canteen?{' '}
          <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Sign in here
          </Link>
        </p>

      </div>
    </div>
  );
};
