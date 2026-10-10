import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/Landing';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { FoodDetailsPage } from './pages/FoodDetailsPage';
import { CartPage } from './pages/CartPage';
import { PortalSelectionPage } from './pages/PortalSelectionPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/authStore';

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public Dining & Menu Routes */}
          <Route index element={<LandingPage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="menu/:id" element={<FoodDetailsPage />} />
          
          {/* Student-only routes - Protected for STUDENT role only */}
          <Route
            path="menu"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MenuPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="cart"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="student/orders" element={<Navigate to="/orders" replace />} />
          <Route
            path="favourites"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          
          {/* Portal Gateway */}
          <Route path="portals" element={<PortalSelectionPage />} />

          {/* Dedicated Login & Registration Routes */}
          <Route path="login" element={<StudentLoginPage />} />
          <Route path="student/login" element={<StudentLoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="staff/login" element={<StaffLoginPage />} />
          <Route path="admin/login" element={<AdminLoginPage />} />

          {/* Role Protected Dashboards */}
          <Route
            path="student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
