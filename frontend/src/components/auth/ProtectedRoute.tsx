import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Role } from '../../types';
import { UtensilsCrossed, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const location = useLocation();
  const { user, isAuthenticated, isCheckingAuth, checkAuth } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (isCheckingAuth) {
      checkAuth();
    }
  }, [isCheckingAuth, checkAuth]);

  // Loading state while checking session token
  if (isCheckingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center animate-pulse shadow-glow">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div className="w-14 h-14 rounded-2xl border-2 border-brand-500 border-t-transparent animate-spin absolute inset-0" />
        </div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          Verifying secure session...
        </p>
      </div>
    );
  }

  // Not authenticated -> redirect to appropriate portal login
  if (!isAuthenticated || !user) {
    let redirectPath = '/student/login';
    if (location.pathname.startsWith('/staff')) {
      redirectPath = '/staff/login';
    } else if (location.pathname.startsWith('/admin')) {
      redirectPath = '/admin/login';
    }

    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Determine the proper dashboard for this user
    let userDashboard = '/student/dashboard';
    if (user.role === 'STAFF') userDashboard = '/staff/dashboard';
    else if (user.role === 'ADMIN') userDashboard = '/admin/dashboard';

    // Show warning toast once
    setTimeout(() => {
      addToast({
        type: 'error',
        title: 'Access Denied (403)',
        message: `Your account role (${user.role}) does not have permission for that area.`,
      });
    }, 100);

    return <Navigate to={userDashboard} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
