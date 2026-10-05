import React from 'react';
import { Smartphone, CreditCard, Clock, QrCode } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Browse & Customise',
      description: 'Explore today’s breakfast, lunch, and snack specials with real-time stock availability, spice choices, and dietary filters.',
      icon: Smartphone,
      color: 'bg-skyblue text-navy',
    },
    {
      number: '02',
      title: 'Preorder & Secure Pay',
      description: 'Select your preferred pickup window (ASAP or scheduled recess time), apply student coupons, and pay seamlessly.',
      icon: CreditCard,
      color: 'bg-navy text-cream',
    },
    {
      number: '03',
      title: 'Live Queue Tracking',
      description: 'Track your food in real-time as the chefs receive, prepare, and pack your meal with dynamic wait time updates.',
      icon: Clock,
      color: 'bg-cream text-rust',
    },
    {
      number: '04',
      title: 'Scan QR & Pickup',
      description: 'Arrive at the express pickup counter, flash your encrypted digital QR receipt, and pick up your hot, fresh meal instantly.',
      icon: QrCode,
      color: 'bg-skysoft text-navy',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-sand border-y border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-rust bg-cream px-3 py-1 rounded-full border border-line">
            Frictionless Ordering
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-navy tracking-[0.15em] uppercase">
            How Smart Canteen Works
          </h2>
          <p className="text-sm sm:text-base text-espresso">
            Engineered to save 20–30 minutes of waiting during peak campus recess and lunch hours.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-cream p-6 sm:p-7 rounded-3xl border border-line shadow-sm transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-extrabold text-skyblue font-mono">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-navy mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-espresso leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line text-[11px] font-bold text-rust flex items-center gap-1">
                  <span>Step {step.number} of 04</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
