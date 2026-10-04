import React from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  Clock,
  QrCode,
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-20">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-500/15 via-amber-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Campus Preorder Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-500/30 text-brand-700 dark:text-brand-400 text-xs font-bold tracking-wide shadow-sm animate-pulse-subtle">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Next-Gen Campus Dining Technology</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <span className="text-amber-600 dark:text-amber-400">Zero Waiting Times</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 dark:text-white tracking-tight leading-[1.1]">
              Skip the Queue. <br />
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 bg-clip-text text-transparent">
                Eat Smarter.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Preorder your favorite campus meals, schedule your pickup window, and track your kitchen queue in real-time. No more losing class time standing in long lines.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to="/menu"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-extrabold text-base shadow-lg hover:shadow-glow transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Flame className="w-5 h-5 fill-white" />
                <span>Preorder Food Now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-200 font-bold text-base hover:bg-gray-50 dark:hover:bg-dark-hover transition shadow-sm"
              >
                <span>How It Works</span>
              </a>
            </div>

            {/* Value Props Bullet Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Instant QR Pickup Pass</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Live Kitchen Queue Rank</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Special Student Discounts</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Visual Card Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Featured Food Card */}
              <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-2xl border border-white/40 dark:border-white/10 relative z-20">
                <div className="relative h-56 rounded-2xl overflow-hidden shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80"
                    alt="Crispy Ghee Podi Masala Dosa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5 shadow-sm">
                    <Flame className="w-3.5 h-3.5 fill-brand-500" />
                    #1 Campus Bestseller
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-xs font-semibold text-amber-300">South Indian Special</span>
                    <h3 className="text-lg font-bold">Crispy Ghee Podi Masala Dosa</h3>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Estimated Prep Time</span>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                      <Clock className="w-4 h-4 text-brand-500" />
                      <span>8 - 10 Minutes</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Campus Price</span>
                    <div className="text-xl font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                      ₹75
                    </div>
                  </div>
                </div>

                <Link
                  to="/menu/item-1"
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md hover:shadow-glow transition"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  Quick Preorder
                </Link>
              </div>

              {/* Floating Live Queue Rank Badge */}
              <div className="absolute -top-6 -right-4 sm:-right-6 bg-white dark:bg-dark-surface p-3.5 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border z-30 flex items-center gap-3 animate-float">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-sm">
                  #3
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Kitchen Queue
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Your Order Preparing</p>
                </div>
              </div>

              {/* Floating QR Code Badge */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white dark:bg-dark-surface p-3.5 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border z-30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Express Handover</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Scan & Pick Up</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Live Quick Counters Row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/70 dark:bg-dark-surface/70 backdrop-blur-md border border-gray-200/70 dark:border-dark-border shadow-sm">
          <div className="flex flex-col items-center text-center p-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400 font-mono">
              9 Mins
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Average Meal Prep Time
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-3 border-l border-gray-200 dark:border-dark-border">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
              1,400+
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Daily Campus Orders
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-3 border-l border-gray-200 dark:border-dark-border">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
              4.9 ★
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Food & Taste Rating
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-3 border-l border-gray-200 dark:border-dark-border">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-500 font-mono">
              0 Mins
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Physical Line Waiting Time
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
