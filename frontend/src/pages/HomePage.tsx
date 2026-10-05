import React from 'react';
import { Link } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection';
import { LiveRushMeter } from '../components/home/LiveRushMeter';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { SmartFeaturesSection } from '../components/home/SmartFeaturesSection';
import { FoodCard } from '../components/menu/FoodCard';
import { MOCK_MENU_ITEMS, MOCK_CATEGORIES } from '../data/mockData';
import {
  Flame,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Award,
  Sunrise,
  Soup,
  Sandwich,
  Coffee,
  IceCream,
  Salad,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const popularItems = MOCK_MENU_ITEMS.filter((item) => item.isPopular).slice(0, 6);
  const categories = MOCK_CATEGORIES.filter((c) => c.slug !== 'all');
  const categoryIcons = { Sunrise, Soup, Sandwich, Coffee, IceCream, Salad };
  const categoryCircleStyles = [
    'bg-dusty text-navy',
    'bg-cream text-rust',
    'bg-navy text-cream',
  ];

  return (
    <div className="bg-beige">
      {/* Hero Section */}
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 py-12 pb-20">
        {/* Live Kitchen Rush Bar */}
        <LiveRushMeter />

        {/* Category Tabs Strip */}
        <section className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-10 bg-sand space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold uppercase tracking-[0.15em] text-navy">
                Explore Categories
              </h2>
              <p className="text-xs sm:text-sm text-espresso mt-1">
                Freshly prepared campus meals cooked with premium ingredients
              </p>
            </div>
            <Link
              to="/menu"
              className="text-xs sm:text-sm font-bold text-navy hover:text-rust flex items-center gap-1 group"
            >
              <span>See all categories</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-3 min-w-max">
              {categories.map((cat, index) => {
                const Icon = categoryIcons[cat.icon as keyof typeof categoryIcons] || Flame;
                return (
                <Link
                  key={cat.id}
                  to={`/menu?category=${cat.id}`}
                  className="flex flex-col items-center gap-2 px-4 py-3 bg-cream text-navy hover:bg-sand rounded-3xl border border-line transition-all duration-200 whitespace-nowrap group"
                >
                  <div className="w-11 h-11 rounded-xl bg-cream text-navy flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-navy group-hover:text-rust transition-colors">
                    {cat.name}
                  </span>
                </Link>
                )})}
            </div>
          </div>
        </section>

        {/* Popular & Trending Items Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Today's Campus Favorites</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold uppercase tracking-[0.15em] text-navy">
                Most Preordered Items
              </h2>
              <p className="text-xs sm:text-sm text-espresso mt-1">
                Highest rated dishes by students and professors today
              </p>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sand text-xs sm:text-sm font-bold text-navy hover:bg-dusty transition group"
            >
              <span>Explore Complete Menu ({MOCK_MENU_ITEMS.length})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {popularItems.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Smart Features Section */}
        <SmartFeaturesSection />

        {/* Bottom CTA Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-navy rounded-3xl p-8 sm:p-12 text-cream shadow-sm relative overflow-hidden border border-navy-light">
            <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-slate/70 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream/20 text-cream text-xs font-bold border border-cream/30">
                <Award className="w-3.5 h-3.5" />
                Smart Preordering Live Now
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Ready to skip the canteen queue and eat on time?
              </h2>
              <p className="text-dusty text-sm sm:text-base leading-relaxed">
                Open your phone, choose your meal, and pick up your hot food the second you step out of class.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to="/menu"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-cream hover:bg-sand text-navy font-bold text-sm shadow-sm transition text-center"
                >
                  Explore Today's Menu
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-navy-light hover:bg-navy text-cream font-semibold text-sm transition text-center border border-dusty/30"
                >
                  Create Student Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};