import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { PixelIcon } from '../pixel/PixelIcon';
import {
  Home,
  UtensilsCrossed,
  ShoppingBag,
  Heart,
  LayoutDashboard,
  User,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { getTotalItemsCount } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const cartCount = getTotalItemsCount();
  const isStudent = isAuthenticated && user?.role === 'STUDENT';

  // Only show on public pages, /cart, and /student/dashboard (not staff/admin dashboards or login pages)
  const publicPaths = ['/', '/menu', '/menu/', '/cart', '/student/dashboard'];
  const isLoginPage = location.pathname.startsWith('/login') ||
                      location.pathname.startsWith('/staff/login') ||
                      location.pathname.startsWith('/admin/login') ||
                      location.pathname.startsWith('/register') ||
                      location.pathname.startsWith('/portals');
  const isStaffOrAdminDashboard = location.pathname.startsWith('/staff/dashboard') ||
                                  location.pathname.startsWith('/admin/dashboard');

  const shouldShow = publicPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/')) ||
                     location.pathname === '/cart' ||
                     location.pathname === '/student/dashboard' ||
                     (location.pathname === '/favourites' && isStudent);

  if (!shouldShow || isLoginPage || isStaffOrAdminDashboard) {
    return null;
  }

  const navItems: NavItem[] = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Menu', path: '/menu', icon: UtensilsCrossed },
    ...(isStudent ? [{ label: 'Favourites', path: '/favourites', icon: Heart }] : []),
    { label: 'Cart', path: '/cart', icon: ShoppingBag, badge: cartCount },
    {
      label: 'Profile',
      path: isAuthenticated ? (user?.role === 'STAFF' ? '/staff/dashboard' : user?.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard') : '/student/login',
      icon: isAuthenticated ? LayoutDashboard : User,
    },
  ];

  return (
    <nav className="theme-bottom-nav fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--color-border)] transition-colors duration-200">
      <div className={`grid ${isStudent ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 py-2.5 px-2 transition-colors ${
                isActive
                  ? 'text-[var(--color-nav-text)]'
                  : 'theme-nav-muted'
              }`}
            >
              {item.label === 'Cart' ? <PixelIcon name="cart" size={24} /> : item.label === 'Favourites' ? <PixelIcon name="heart" size={24} /> : <Icon className="w-6 h-6" />}
              <span className="text-[10px] font-semibold">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span key={item.badge} className="theme-count-badge px-cart-count absolute -top-1 -right-1 min-w-[16px] h-5 px-1.5 text-[10px] font-extrabold rounded-full flex items-center justify-center animate-in zoom-in">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
