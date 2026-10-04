import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';
import { useToastStore } from '../../store/toastStore';
import {
  UtensilsCrossed,
  ShoppingBag,
  Sun,
  Moon,
  LogOut,
  Menu as MenuIcon,
  X,
  Sparkles,
  Flame,
  Award,
  ChevronDown,
  LayoutDashboard,
  ChefHat,
  ShieldCheck,
  GraduationCap,
  Layers,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getTotalItemsCount, getGrandTotal } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const { addToast } = useToastStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const cartCount = getTotalItemsCount();
  const grandTotal = getGrandTotal();

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been signed out successfully.',
    });
    navigate('/portals');
  };

  const getDashboardPath = () => {
    if (!user) return '/portals';
    if (user.role === 'STAFF') return '/staff/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/student/dashboard';
  };

  const getDashboardLabel = () => {
    if (!user) return 'Dashboard';
    if (user.role === 'STAFF') return 'Kitchen Dashboard';
    if (user.role === 'ADMIN') return 'Admin Console';
    return 'Student Dashboard';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Access Portals', path: '/portals' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-dark-surface/85 border-b border-gray-200/80 dark:border-dark-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Live Status */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform duration-200">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                  SMART<span className="text-brand-500">CANTEEN</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-gray-400 dark:text-gray-400 hidden sm:inline">
                  Skip the Queue • Eat Smarter
                </span>
              </div>
            </Link>

            {/* Live Rush / Open Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live: <strong>Open</strong> (~8m wait)</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-hover'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* If logged in, show their role dashboard button in top nav */}
            {isAuthenticated && user && (
              <Link
                to={getDashboardPath()}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                  location.pathname.includes('dashboard')
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{getDashboardLabel()}</span>
              </Link>
            )}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Cart Button with Count Badge */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-dark-card hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/30 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-200 transition group"
            >
              <ShoppingBag className="w-5 h-5 text-brand-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs font-bold">
                {cartCount > 0 ? `₹${grandTotal.toFixed(0)}` : 'Cart'}
              </span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-extrabold text-white bg-brand-500 rounded-full shadow-sm animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Dropdown / Login CTA */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-brand-500/50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-amber-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate max-w-[110px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-semibold text-brand-500 tracking-wider uppercase">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-gray-100 dark:border-dark-border">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                          {user.role}
                        </span>
                        {user.points !== undefined && (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                            <Award className="w-3.5 h-3.5" />
                            {user.points} pts
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-xl transition font-bold"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Go to {getDashboardLabel()}
                      </Link>
                      <Link
                        to="/menu"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition"
                      >
                        <UtensilsCrossed className="w-4 h-4 text-brand-500" />
                        Explore Canteen Menu
                      </Link>
                      <Link
                        to="/portals"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-xl transition"
                      >
                        <Layers className="w-4 h-4 text-gray-400" />
                        Switch Role Portal
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-gray-100 dark:border-dark-border">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/portals"
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 transition"
                >
                  Portals
                </Link>
                <Link
                  to="/student/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-glow transition-all duration-200"
                >
                  <Flame className="w-4 h-4" />
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Kitchen Live: Active & Taking Orders
            </span>
            <span className="text-[11px] font-bold">~8 min wait</span>
          </div>

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  location.pathname === link.path
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-hover'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {isAuthenticated && user && (
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400"
              >
                {getDashboardLabel()}
              </Link>
            )}

            <Link
              to="/menu"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 text-white font-bold text-sm shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              Order Food Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
