import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ToastContainer } from '../components/common/ToastContainer';
import { BottomNav } from '../components/common/BottomNav';
import { StudentChatWidget } from '../components/common/StudentChatWidget';
import { useAuthStore } from '../store/authStore';

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen bg-beige text-navy transition-colors duration-200">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      <Footer />
      <ToastContainer />
      {isAuthenticated && user?.role === 'STUDENT' && <StudentChatWidget key={user.id} />}
    </div>
  );
};
