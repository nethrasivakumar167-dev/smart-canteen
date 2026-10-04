import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ChefHat,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Clock,
  QrCode,
  Flame,
  LayoutDashboard,
  BarChart3,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const PortalSelectionPage: React.FC = () => {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl space-y-3 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Smart Campus Dining Network
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
          Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-amber-500">Access Portal</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Smart Canteen provides dedicated workspaces tailored specifically for Students, Kitchen Staff, and Campus Administration.
        </p>
      </div>

      {/* 3 Dedicated Portal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
        
        {/* Portal 1: Student / Campus Diner */}
        <div className="group relative rounded-3xl bg-white dark:bg-dark-surface border-2 border-brand-500/20 hover:border-brand-500 p-7 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-bl-full -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          
          <div className="space-y-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center shadow-glow">
              <GraduationCap className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Public Access
              </span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                Student & Diner Portal
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                Order campus meals ahead of time, avoid waiting in lunch lines, and track live food preparation.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Preorder meals & select pickup times</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                <span>QR-code contactless food collection</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Earn campus dining loyalty rewards</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-3 relative z-10">
            <Link
              to="/student/login"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-bold text-sm shadow-md hover:shadow-glow transition flex items-center justify-center gap-2"
            >
              <span>Student Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="text-center">
              <Link
                to="/register"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                New student? Create an account →
              </Link>
            </div>
          </div>
        </div>

        {/* Portal 2: Staff & Kitchen Operations */}
        <div className="group relative rounded-3xl bg-white dark:bg-dark-surface border-2 border-emerald-500/20 hover:border-emerald-500 p-7 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          
          <div className="space-y-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ChefHat className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Kitchen Operations
              </span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                Staff & Chef Portal
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                Manage incoming orders, update prep status in real-time, and control menu item availability.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Live Kanban order fulfillment queue</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Instant 1-click stock availability toggle</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Kitchen rush time monitoring</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-3 relative z-10">
            <Link
              to="/staff/login"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Staff Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-center text-[11px] text-gray-400">
              Staff access is provisioned by administration
            </p>
          </div>
        </div>

        {/* Portal 3: Administration */}
        <div className="group relative rounded-3xl bg-white dark:bg-dark-surface border-2 border-indigo-500/20 hover:border-indigo-500 p-7 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          
          <div className="space-y-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Management Control
              </span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                Administration Portal
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                Oversee campus dining finances, manage staff credentials, and view comprehensive order analytics.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Revenue, transaction & sales metrics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>User directory & role permission control</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Peak hour demand analytics</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 space-y-3 relative z-10">
            <Link
              to="/admin/login"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Admin Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-center text-[11px] text-gray-400">
              Restricted management zone
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
