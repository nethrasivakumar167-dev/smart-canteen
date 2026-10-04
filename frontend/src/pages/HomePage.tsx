import React from 'react';
import { Link } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection';
import { LiveRushMeter } from '../components/home/LiveRushMeter';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { SmartFeaturesSection } from '../components/home/SmartFeaturesSection';
import { FoodCard } from '../components/menu/FoodCard';
import { MOCK_MENU_ITEMS, MOCK_CATEGORIES, MOCK_REVIEWS } from '../data/mockData';
import {
  Flame,
  ArrowRight,
  Sparkles,
  Star,
  Quote,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const popularItems = MOCK_MENU_ITEMS.filter((item) => item.isPopular).slice(0, 6);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Live Kitchen Rush Bar */}
        <LiveRushMeter />

        {/* Category Shortcut Strip */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Explore Categories
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Freshly prepared campus meals cooked with premium ingredients
              </p>
            </div>
            <Link
              to="/menu"
              className="text-xs sm:text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 group"
            >
              <span>See all categories</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {MOCK_CATEGORIES.filter((c) => c.slug !== 'all').map((cat) => (
              <Link
                key={cat.id}
                to={`/menu?category=${cat.id}`}
                className="group bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-200/80 dark:border-dark-border shadow-sm hover:shadow-md hover:border-brand-500/40 text-center transition flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {cat.itemCount} items
                  </p>
                </div>
              </Link>
            ))}
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
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Most Preordered Items
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Highest rated dishes by students and professors today
              </p>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-card text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-brand-500 hover:text-white transition group"
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
      </div>

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Smart Features Section */}
      <SmartFeaturesSection />

      {/* Campus Testimonials / Reviews Section */}
      <section className="py-16 bg-white dark:bg-dark-surface border-t border-gray-200/80 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Community Love
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              What Students & Faculty Say
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Transforming everyday lunch queues into seamless dining experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {MOCK_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="bg-gray-50 dark:bg-dark-card p-6 rounded-3xl border border-gray-200/80 dark:border-dark-border shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <Quote className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200/60 dark:border-dark-border flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{review.userName}</h4>
                    <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 uppercase">
                      {review.userRole}
                    </span>
                  </div>
                  <span className="text-gray-400">{review.date}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-gray-800">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold border border-brand-500/30">
              <Award className="w-3.5 h-3.5" />
              Smart Preordering Live Now
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Ready to skip the canteen queue and eat on time?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Open your phone, choose your meal, and pick up your hot food the second you step out of class.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/menu"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg hover:shadow-glow transition text-center"
              >
                Explore Today's Menu
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition text-center border border-white/10"
              >
                Create Student Account
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
