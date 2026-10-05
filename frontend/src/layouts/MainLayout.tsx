import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ToastContainer } from '../components/common/ToastContainer';
import { BottomNav } from '../components/common/BottomNav';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-beige text-navy transition-colors duration-200">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      <Footer />
      <ToastContainer />
    </div>
  );
};
