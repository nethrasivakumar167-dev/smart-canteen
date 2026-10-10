import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  fetchAvailableMenuItems,
  fetchKitchenStatus,
  getKitchenActivity,
  KitchenStatus,
} from '../api/publicApi';
import { LayoutDashboard } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [menuItemCount, setMenuItemCount] = useState<number | null>(null);
  const [kitchenStatus, setKitchenStatus] = useState<KitchenStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchAvailableMenuItems()
      .then((items) => {
        if (isMounted) setMenuItemCount(items.length);
      })
      .catch((error) => console.error('Failed to load available menu count:', error));
    fetchKitchenStatus()
      .then((status) => {
        if (isMounted) setKitchenStatus(status);
      })
      .catch((error) => console.error('Failed to load landing kitchen status:', error));

    return () => {
      isMounted = false;
    };
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/menu';
    if (user.role === 'STUDENT') return '/menu';
    if (user.role === 'STAFF') return '/staff/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/menu';
  };

  const handleGoToDashboard = () => {
    navigate(getDashboardPath());
  };

  const kitchenActivity = kitchenStatus
    ? getKitchenActivity(kitchenStatus.activeOrdersCount)
    : null;
  const stats = [
    ...(menuItemCount === null
      ? []
      : [{ value: `${menuItemCount}`, label: "Available Menu Items" }]),
    ...(kitchenStatus
      ? [{ value: `${kitchenStatus.activeOrdersCount}`, label: 'Active Orders' }]
      : []),
    ...(kitchenStatus?.feedbackCount && kitchenStatus.averageRating !== null
      ? [{ value: `${kitchenStatus.averageRating}★`, label: 'Average Rating' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-beige flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 lg:py-24 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-orange-500/10 via-red-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-orange-500/10 to-red-500/10 blur-3xl rounded-full pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Logo / Brand Name */}
          <div className="mb-10 animate-fade-in-down">
            <h1 className="font-pacifico text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 bg-clip-text text-transparent tracking-wide">
              CampusBite
            </h1>
            <p className="text-espresso mt-2 text-sm sm:text-base font-medium uppercase tracking-wider">
              Campus Canteen • Preorder & Skip the Queue
            </p>
          </div>

          {/* Description - clean and simple */}
          <p className="text-lg sm:text-xl text-slateblue max-w-2xl mx-auto mb-10 leading-relaxed">
            Preorder your favorite campus meals from your phone, skip the lunch rush queue, 
            and pick up your hot food the moment you arrive.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isAuthenticated ? (
              <>
                {/* Primary - Login */}
                <Link
                  to="/student/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-navy text-cream font-extrabold text-base shadow-lg hover:shadow-glow hover:bg-slateblue transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5" aria-hidden="true">🔐</span>
                    <span className="font-extrabold">Login</span>
                  </span>
                </Link>

                {/* Secondary - Register */}
                <Link
                  to="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-cream text-navy font-extrabold text-base border-2 border-navy/30 hover:bg-navy hover:text-cream transition-all duration-200"
                >
                  <span className="font-extrabold">Register</span>
                </Link>

                {/* Tertiary - Sign In (Staff/Admin portal) */}
                <Link
                  to="/portals"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-transparent text-navy font-extrabold text-base border-2 border-navy/30 hover:bg-navy/5 transition-all duration-200"
                >
                  <span className="font-extrabold">Sign In</span>
                </Link>
              </>
            ) : (
              <button
                onClick={handleGoToDashboard}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-navy text-cream font-extrabold text-base shadow-lg hover:shadow-glow hover:bg-slateblue transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-extrabold">Go to Dashboard</span>
                </span>
              </button>
            )}
          </div>

          {/* Trust indicators - clean and minimal */}
          {kitchenActivity && (
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-slateblue">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kitchen: {kitchenActivity.label}</span>
              </div>
              {menuItemCount !== null && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-navy" />
                  <span>{menuItemCount} available menu items today</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats Bar - Clean and Minimal */}
      <section className="bg-navy py-8 px-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            {stats.map((stat) => (
              <div className="p-4" key={stat.label}>
                <div className="text-3xl sm:text-4xl font-extrabold text-cream">{stat.value}</div>
                <div className="text-xs text-slate text-uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA - Clean & Simple */}
      <section className="py-16 bg-beige">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slateblue mb-6">Ready to skip the queue and eat smarter?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/menu"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-navy text-cream font-extrabold text-base shadow-lg hover:shadow-glow transition-all duration-200"
            >
              Explore Menu & Preorder
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-transparent border-2 border-navy text-navy font-extrabold hover:bg-navy hover:text-cream transition-all duration-200"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;