import React from 'react';
import {
  Zap,
  Layers,
  QrCode,
  Sparkles,
  Award,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

export const SmartFeaturesSection: React.FC = () => {
  const features = [
    {
      title: 'Real-Time Smart Queue',
      description: 'Calculates dynamic wait times and live queue ranks based on kitchen load, ensuring your order is ready precisely on time.',
      icon: Zap,
      badge: 'Live Dispatch',
    },
    {
      title: 'Kitchen Display System (KDS)',
      description: 'Kitchen staff receive instant order tickets with prep recipes, streamlining preparation without missing instructions.',
      icon: Layers,
      badge: 'Kitchen Sync',
    },
    {
      title: 'Encrypted QR Pickup Pass',
      description: 'Zero paper tokens. Every confirmed order generates a verified QR code that staff can scan in a split second.',
      icon: QrCode,
      badge: 'Touchless',
    },
    {
      title: 'AI Food Assistant & Search',
      description: 'Natural language menu queries like "Vegetarian meals under ₹100 in 10 mins" convert directly into instant meal selections.',
      icon: Sparkles,
      badge: 'AI Powered',
    },
    {
      title: 'Campus Loyalty & Rewards',
      description: 'Earn Smart Canteen points with every order. Redeem for student discounts, combo upgrades, and complimentary snacks.',
      icon: Award,
      badge: 'Loyalty Tier',
    },
    {
      title: 'Predictive Inventory & Waste Control',
      description: 'Automatic ingredient deduction upon order confirmation keeps inventory updated and minimizes food wastage.',
      icon: BarChart3,
      badge: 'Zero Waste',
    },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-rust bg-sand px-3 py-1 rounded-full border border-line">
            Enterprise Grade Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-navy tracking-[0.15em] uppercase">
            Built for Modern High-Traffic Campuses
          </h2>
          <p className="text-sm sm:text-base text-espresso">
            A cohesive platform connecting students, faculty, kitchen chefs, inventory managers, and administrators.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-cream p-7 rounded-3xl border border-line shadow-sm hover:border-skyblue transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-skyblue text-navy flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-espresso uppercase tracking-wider bg-sand px-2.5 py-1 rounded-full">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-navy mb-2 group-hover:text-rust transition">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-espresso leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-rust">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Production Ready</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
