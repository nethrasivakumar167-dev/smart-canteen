import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchAvailableMenuItems,
  fetchKitchenStatus,
  getKitchenActivity,
  KitchenStatus,
} from '../../api/publicApi';
import { MenuItem } from '../../types';
import {
  Flame,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';

const WaveDivider = () => (
  <svg aria-hidden="true" viewBox="0 0 1440 64" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-10 w-full text-beige">
    <path fill="currentColor" d="M0,32 C240,64 480,0 720,32 C960,64 1200,0 1440,32 L1440,64 L0,64 Z" />
  </svg>
);

export const HeroSection: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [kitchenStatus, setKitchenStatus] = useState<KitchenStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchAvailableMenuItems()
      .then((items) => {
        if (isMounted) setMenuItems(items);
      })
      .catch((error) => console.error('Failed to load featured menu item:', error));
    fetchKitchenStatus()
      .then((status) => {
        if (isMounted) setKitchenStatus(status);
      })
      .catch((error) => console.error('Failed to load hero kitchen status:', error));

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredItem = menuItems?.[0];
  const kitchenActivity = kitchenStatus
    ? getKitchenActivity(kitchenStatus.activeOrdersCount)
    : null;
  const stats = [
    ...(menuItems === null
      ? []
      : [{ value: menuItems.length, label: 'Available Menu Items' }]),
    ...(kitchenStatus
      ? [{ value: kitchenStatus.activeOrdersCount, label: 'Active Orders' }]
      : []),
    ...(kitchenStatus?.feedbackCount && kitchenStatus.averageRating !== null
      ? [{ value: `${kitchenStatus.averageRating}★`, label: 'Average Rating' }]
      : []),
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-24 lg:pt-20 lg:pb-28 bg-navy">
      <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-slateblue-light/70 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Campus Preorder Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-skyblue text-navy text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-navy" />
              <span>Next-Gen Campus Dining Technology</span>
              <span className="w-1.5 h-1.5 rounded-full bg-navy" />
              <span className="text-rust">Less Time in Line</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-cream tracking-tight leading-[1.1]">
              Skip the Queue. <br />
              <span className="text-skyblue">
                Eat Smarter.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-skyblue max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Preorder your favorite campus meals, schedule your pickup window, and track your kitchen queue in real-time. No more losing class time standing in long lines.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to="/menu"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-cream hover:bg-skysoft text-navy font-extrabold text-base shadow-sm transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Flame className="w-5 h-5 fill-cream" />
                <span>Preorder Food Now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-skyblue text-navy font-bold text-base hover:bg-skysoft transition shadow-sm"
              >
                <span>How It Works</span>
              </a>
            </div>

            {/* Value Props Bullet Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-skyblue font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-skyblue" />
                <span>Live Order Status</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-skyblue" />
                <span>Special Student Discounts</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Visual Card Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Featured available menu item */}
              {featuredItem && (
              <div className="bg-cream rounded-3xl p-4 sm:p-5 shadow-sm border border-line relative z-20">
                <div className="relative h-56 rounded-3xl overflow-hidden">
                  {featuredItem.imageUrl && (
                    <img
                      src={featuredItem.imageUrl}
                      alt={featuredItem.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 bg-cream px-3 py-1 rounded-full text-xs font-bold text-navy flex items-center gap-1.5 shadow-sm">
                    <Flame className="w-3.5 h-3.5 fill-navy" />
                    Available now
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-cream">
                    <span className="text-xs font-semibold text-cream/85">{featuredItem.categoryName}</span>
                    <h3 className="text-lg font-bold">{featuredItem.name}</h3>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-xs text-espresso">Campus Price</span>
                    <div className="text-xl font-extrabold text-rust font-mono">
                      ₹{featuredItem.price}
                    </div>
                  </div>
                </div>

                <Link
                  to={`/menu/${featuredItem.id}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-navy hover:bg-slateblue-light text-cream font-bold text-sm shadow-sm transition"
                >
                  <Zap className="w-4 h-4 fill-cream" />
                  Quick Preorder
                </Link>
              </div>
              )}

            </div>
          </div>
        </div>

        {/* Live menu and kitchen statistics */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-4 p-5 rounded-3xl bg-sand border border-line shadow-sm">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center text-center p-3 ${index > 0 ? 'border-l border-line' : ''}`}
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-navy font-mono">
                {stat.value}
              </span>
              <span className="text-xs text-espresso font-medium mt-0.5">
                {stat.label}
              </span>
              {stat.label === 'Active Orders' && kitchenActivity && (
                <span className="text-xs text-rust font-semibold mt-1">
                  {kitchenActivity.label}
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
      <WaveDivider />
    </section>
  );
};
