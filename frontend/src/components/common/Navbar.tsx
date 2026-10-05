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
    <header className="sticky top-0 z-40 w-full bg-navy border-b border-navy transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Live Status */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-cream flex items-center justify-center text-navy shadow-sm group-hover:scale-105 transition-transform duration-200">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display italic font-semibold text-xl tracking-wide text-cream flex items-center gap-1.5">
                  SMART<span className="text-cream">CANTEEN</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-skyblue hidden sm:inline">
                  Skip the Queue • Eat Smarter
                </span>
              </div>
            </Link>

            {/* Live Rush / Open Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-skyblue text-navy text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-rust" />
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
                      ? 'text-navy bg-cream'
                      : 'text-skyblue hover:text-cream hover:bg-slateblue-light'
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
                    ? 'text-navy bg-cream shadow-sm'
                    : 'bg-slateblue-light text-cream hover:bg-dark-hover'
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
              className="p-2.5 rounded-full text-skyblue hover:text-cream hover:bg-slateblue-light transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-skyblue hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Cart Button with Count Badge */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-cream hover:bg-skysoft text-navy transition group"
            >
              <ShoppingBag className="w-5 h-5 text-navy group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs font-bold">
                {cartCount > 0 ? `₹${grandTotal.toFixed(0)}` : 'Cart'}
              </span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-extrabold text-cream bg-rust rounded-full shadow-sm animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Dropdown / Login CTA */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-cream border border-cream hover:bg-skysoft transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cream to-mist text-ink font-bold flex items-center justify-center text-xs shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-navy truncate max-w-[110px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-semibold text-espresso tracking-wider uppercase">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-navy hidden sm:inline" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-cream border border-line shadow-sm p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-line">
                      <p className="text-sm font-bold text-navy truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-espresso truncate">
                        {user.email}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-skyblue text-navy border border-skyblue">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-navy hover:bg-skysoft rounded-xl transition font-bold"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Go to {getDashboardLabel()}
                      </Link>
                      <Link
                        to="/menu"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-espresso hover:bg-skysoft rounded-xl transition"
                      >
                        <UtensilsCrossed className="w-4 h-4 text-navy" />
                        Explore Canteen Menu
                      </Link>
                      <Link
                        to="/portals"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-espresso hover:bg-skysoft rounded-xl transition"
                      >
                        <Layers className="w-4 h-4 text-navy" />
                        Switch Role Portal
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-line">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rust hover:bg-sand rounded-xl transition"
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
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-skyblue hover:text-cream transition"
                >
                  Portals
                </Link>
                <Link
                  to="/student/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cream hover:bg-skysoft text-navy text-xs sm:text-sm font-bold shadow-sm transition-all duration-200"
                >
                  <Flame className="w-4 h-4" />
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="stripe-band" aria-hidden="true" />
    </header>
  );
};
