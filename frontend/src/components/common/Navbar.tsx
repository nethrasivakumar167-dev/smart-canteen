import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';
import { useToastStore } from '../../store/toastStore';
import { PixelIcon } from '../pixel/PixelIcon';
import {
  UtensilsCrossed,
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
  const isLoggedInDashboard = Boolean(isAuthenticated && user && location.pathname.endsWith('/dashboard'));

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
    { name: 'Favourites', path: '/favourites' },
    { name: 'Access Portals', path: '/portals' },
  ];

  return (
    <header className="theme-nav-header sticky top-0 z-40 w-full border-b transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo & Live Status */}
          <div className={`flex items-center gap-4 sm:gap-6 ${isLoggedInDashboard ? 'order-last' : ''}`}>
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/brand/campusbite-logo.jpg"
                width={56}
                height={56}
                className="object-contain"
                alt="CampusBite"
              />
            </Link>

            {/* Live Rush / Open Pill */}
            <div className="theme-sky-badge hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-rust" />
              <span>Live: <strong>Open</strong> (~8m wait)</span>
            </div>
          </div>

          {/* Desktop Nav Links - Only show when authenticated and STUDENT role */}
          {isAuthenticated && user?.role === 'STUDENT' && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`theme-nav-link px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${isActive ? 'is-active' : ''}`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* If logged in, show their role dashboard button in top nav */}
          {isAuthenticated && user && (
            <Link
              to={getDashboardPath()}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                location.pathname.includes('dashboard')
                  ? 'theme-nav-link is-active shadow-sm'
                  : 'theme-nav-action'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{getDashboardLabel()}</span>
            </Link>
          )}

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="theme-toggle p-2.5 rounded-full transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Cart Button with Count Badge - Only for STUDENT role */}
            {isAuthenticated && user?.role === 'STUDENT' && (
              <Link
                to="/cart"
                className="theme-nav-action relative flex items-center gap-2 px-3.5 py-2 rounded-full transition group"
              >
                <PixelIcon name="cart" size={20} />
                <span className="hidden sm:inline text-xs font-bold">
                  {cartCount > 0 ? `₹${grandTotal.toFixed(0)}` : 'Cart'}
                </span>
                {cartCount > 0 && (
                  <span key={cartCount} className="theme-count-badge px-cart-count flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-extrabold rounded-full shadow-sm animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth Dropdown / Login CTA */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="theme-nav-action flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full border transition"
                >
                  <div className="theme-avatar w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="theme-primary-text text-xs font-bold truncate max-w-[110px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="theme-secondary-text text-[10px] font-semibold tracking-wider uppercase">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="theme-primary-text w-3.5 h-3.5 hidden sm:inline" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="theme-nav-dropdown absolute right-0 mt-2 w-64 rounded-2xl border shadow-sm p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-line">
                      <p className="theme-primary-text text-sm font-bold truncate">
                        {user.name}
                      </p>
                      <p className="theme-secondary-text text-xs truncate">
                        {user.email}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="theme-sky-badge inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Go to {getDashboardLabel()}
                      </Link>
                      {user?.role === 'STUDENT' && (
                        <React.Fragment>
                          <Link
                            to="/menu"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition"
                          >
                            <UtensilsCrossed className="theme-primary-text w-4 h-4" />
                            Explore Canteen Menu
                          </Link>
                          <Link
                            to="/favourites"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition"
                          >
                            <PixelIcon name="heart" size={16} />
                            Favourites
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            My Orders
                          </Link>
                        </React.Fragment>
                      )}
                      <Link
                        to="/portals"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="theme-dropdown-item flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition"
                      >
                        <Layers className="theme-primary-text w-4 h-4" />
                        Switch Role Portal
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-line">
                      <button
                        onClick={handleLogout}
                        className="theme-dropdown-danger w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition"
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
                  to="/register"
                  className="theme-nav-action theme-primary-text hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <span className="font-bold">Register</span>
                </Link>
                <Link
                  to="/student/login"
                  className="theme-nav-action theme-primary-text hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <Flame className="w-4 h-4" />
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;