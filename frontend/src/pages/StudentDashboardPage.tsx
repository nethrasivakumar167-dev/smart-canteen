import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';
import {
  GraduationCap,
  UtensilsCrossed,
  ShoppingBag,
  Award,
  Clock,
  QrCode,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/student/dashboard-summary');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch {
      // Fallback local representation if network issue
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      description: item.name,
      price: item.price,
      categoryId: 'quick',
      imageUrl: item.imageUrl || '',
      isVegetarian: true,
      ingredients: [],
      allergens: [],
      preparationTime: item.preparationTime || 5,
      isAvailable: true,
      stockStatus: 'AVAILABLE',
      rating: 4.9,
      reviewCount: 50,
    });
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${item.name} added to your tray.`,
    });
  };

  const handleLogout = async () => {
    await logout();
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been signed out from the Student Portal.',
    });
    navigate('/student/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Welcome Header */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-amber-500 to-amber-600 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Account • {user?.institutionId || 'Campus Member'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-white/90 text-xs sm:text-sm max-w-xl">
              Preorder your favorite campus meals, check live queue times, and earn rewards on every meal.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/menu"
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-white text-brand-600 hover:bg-gray-100 font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Order Food Now</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-3 rounded-2xl bg-black/20 hover:bg-black/30 text-white transition flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200/80 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {dashboardData?.stats?.activeOrdersCount ?? 1}
            </div>
            <div className="text-xs text-gray-500 font-medium">Active Orders</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200/80 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-500">
              {user?.points || dashboardData?.stats?.loyaltyPoints || 340} pts
            </div>
            <div className="text-xs text-gray-500 font-medium">Dining Rewards</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200/80 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {dashboardData?.stats?.totalOrdersCount ?? 14}
            </div>
            <div className="text-xs text-gray-500 font-medium">Total Preorders</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200/80 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {dashboardData?.stats?.savedFavoritesCount ?? 4}
            </div>
            <div className="text-xs text-gray-500 font-medium">Favorite Items</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Order + Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Live Order Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-dark-surface border border-gray-200/80 dark:border-dark-border shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Live Order Tracker
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">
                  Order #{dashboardData?.activeOrder?.orderNumber || 'SC-1048'}
                </h2>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Preparing in Kitchen (~8 mins)</span>
              </div>
            </div>

            {/* Preparation Steps Progress */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold pt-2">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                <span>1. Confirmed</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-500/30 animate-pulse">
                <Flame className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <span>2. Cooking</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-card text-gray-400 border border-gray-200 dark:border-dark-border">
                <QrCode className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                <span>3. Ready for Pickup</span>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-card border border-gray-200/80 dark:border-dark-border space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between font-medium text-gray-700 dark:text-gray-300">
                <span>1x Crispy Ghee Podi Masala Dosa</span>
                <span className="font-bold">₹75</span>
              </div>
              <div className="flex justify-between font-medium text-gray-700 dark:text-gray-300">
                <span>1x Authentic Kumbakonam Filter Coffee</span>
                <span className="font-bold">₹30</span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-dark-border flex justify-between font-extrabold text-gray-900 dark:text-white">
                <span>Total Amount Paid</span>
                <span className="text-brand-600 dark:text-brand-400">₹105</span>
              </div>
            </div>

            {/* Pickup Info & QR placeholder */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-brand-500/5 border border-brand-500/10 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Show QR at Counter 02</div>
                  <div className="text-gray-500">Scheduled Pickup: 13:45 - 14:00</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-brand-500 text-white font-extrabold text-[11px]">
                Token: SC-892
              </span>
            </div>
          </div>

          {/* Past Order History */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-dark-surface border border-gray-200/80 dark:border-dark-border shadow-md space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span>Recent Preorder History</span>
              <Link to="/menu" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                Explore Menu →
              </Link>
            </h3>

            <div className="space-y-2.5">
              {(dashboardData?.recentOrders || [
                { id: '1', orderNumber: 'SC-1022', date: 'Yesterday, 1:15 PM', items: 'South Indian Executive Mini Meals', total: 95, status: 'COMPLETED' },
                { id: '2', orderNumber: 'SC-0985', date: '02 Oct 2026, 9:30 AM', items: 'Steamed Rice Idli with Medu Vada (2+1)', total: 55, status: 'COMPLETED' },
              ]).map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-dark-card border border-gray-200/80 dark:border-dark-border text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-900 dark:text-white">
                      #{order.orderNumber} • {order.items}
                    </div>
                    <div className="text-gray-500 text-[11px]">{order.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-gray-900 dark:text-white">₹{order.total}</div>
                    <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Re-Order Favorites */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-dark-surface border border-gray-200/80 dark:border-dark-border shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-brand-500" />
                <span>Quick Re-Order</span>
              </h3>
              <span className="text-xs text-gray-400">Top Picks</span>
            </div>

            <div className="space-y-3">
              {(dashboardData?.quickFavorites || [
                {
                  id: 'item-1',
                  name: 'Crispy Ghee Podi Masala Dosa',
                  price: 75,
                  preparationTime: 8,
                  imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
                },
                {
                  id: 'item-4',
                  name: 'Authentic Kumbakonam Filter Coffee',
                  price: 30,
                  preparationTime: 3,
                  imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
                },
              ]).map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-gray-50 dark:bg-dark-card border border-gray-200/80 dark:border-dark-border flex items-center justify-between gap-3"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
                      ₹{item.price}
                    </span>
                  </div>
                  <button
                    onClick={() => handleQuickAdd(item)}
                    className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition shadow-sm"
                    title="Add to tray"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <Link
              to="/menu"
              className="w-full py-3 rounded-xl bg-gray-100 dark:bg-dark-hover hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>View Complete Canteen Menu</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Loyalty Bonus Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6" />
              <span className="font-extrabold text-sm uppercase tracking-wider">Gold Tier Diner</span>
            </div>
            <p className="text-xs text-amber-50">
              You earn <strong>10 pts per ₹100</strong> spent. Redeem 500 points for a free breakfast combo meal!
            </p>
            <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
              <div className="bg-white h-full rounded-full" style={{ width: '68%' }} />
            </div>
            <div className="text-[11px] text-right text-amber-100 font-semibold">
              340 / 500 pts to next milestone
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
