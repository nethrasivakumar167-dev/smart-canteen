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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-cream">
      
      {/* Top Welcome Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slateblue via-slate to-amber-600 p-6 sm:p-8 text-cream shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-cream/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slateblue/20 backdrop-blur-md text-cream text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Account • {user?.institutionId || 'Campus Member'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-cream/90 text-xs sm:text-sm max-w-xl">
              Preorder your favorite campus meals, check live queue times, and earn rewards on every meal.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/menu"
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-cream text-slateblue hover:bg-mist font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Order Food Now</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-3 rounded-2xl bg-slateblue/20 hover:bg-slateblue/30 text-cream transition flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 KPI Summary Cards (Loyalty hidden) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-sand border border-line shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slateblue/10 text-slateblue flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              {dashboardData?.stats?.activeOrdersCount ?? 1}
            </div>
            <div className="text-xs text-dusty font-medium">Active Orders</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-sand border border-line shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              {dashboardData?.stats?.totalOrdersCount ?? 14}
            </div>
            <div className="text-xs text-dusty font-medium">Total Preorders</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-sand border border-line shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              {dashboardData?.stats?.savedFavoritesCount ?? 4}
            </div>
            <div className="text-xs text-dusty font-medium">Favorite Items</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Order + Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Live Order Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-sand border border-line shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slateblue">
                  Live Order Tracker
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slateblue mt-0.5">
                  Order #{dashboardData?.activeOrder?.orderNumber || 'SC-1048'}
                </h2>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Preparing in Kitchen (~8 mins)</span>
              </div>
            </div>

            {/* Preparation Steps Progress */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold pt-2">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                <span>1. Confirmed</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/30 animate-pulse">
                <Flame className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <span>2. Cooking</span>
              </div>
              <div className="p-3 rounded-xl bg-sand/30 text-slateblue border border-line">
                <span className="w-4 h-4 mx-auto mb-1 text-dusty">📦</span>
                <span>3. Ready for Pickup</span>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="p-4 rounded-2xl bg-cream border border-line space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between font-medium text-slateblue">
                <span>1x Crispy Ghee Podi Masala Dosa</span>
                <span className="font-bold text-slateblue">₹75</span>
              </div>
              <div className="flex justify-between font-medium text-slateblue">
                <span>1x Authentic Kumbakonam Filter Coffee</span>
                <span className="font-bold text-slateblue">₹30</span>
              </div>
              <div className="pt-2 border-t border-line flex justify-between font-extrabold text-slateblue">
                <span>Total Amount Paid</span>
                <span className="text-slateblue">₹105</span>
              </div>
            </div>

            {/* Pickup Info (QR removed) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slateblue/5 border border-slateblue/10 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slateblue text-cream flex items-center justify-center font-bold">
                  <span className="font-mono text-xs">SC-892</span>
                </div>
                <div>
                  <div className="font-bold text-cream">Show Order ID at Counter 02</div>
                  <div className="text-dusty">Scheduled Pickup: 13:45 - 14:00</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-cream text-slateblue font-extrabold text-[11px]">
                Order ID: SC-892
              </span>
            </div>
          </div>

          {/* Past Order History */}
          <div className="p-6 sm:p-7 rounded-3xl bg-sand border border-line shadow-md space-y-4">
            <h3 className="text-base font-bold text-slateblue flex items-center justify-between">
              <span>Recent Preorder History</span>
              <Link to="/menu" className="text-xs text-slateblue hover:underline">
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-cream border border-line text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slateblue">
                      #{order.orderNumber} • {order.items}
                    </div>
                    <div className="text-dusty text-[11px]">{order.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slateblue">₹{order.total}</div>
                    <span className="inline-block text-[10px] font-bold text-emerald-600">
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
          <div className="p-6 rounded-3xl bg-sand border border-line shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slateblue flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-slateblue" />
                <span>Quick Re-Order</span>
              </h3>
              <span className="text-xs text-dusty">Top Picks</span>
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
                  className="p-3 rounded-2xl bg-cream border border-line flex items-center justify-between gap-3"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slateblue truncate">
                      {item.name}
                    </h4>
                    <span className="text-xs font-extrabold text-slateblue">
                      ₹{item.price}
                    </span>
                  </div>
                  <button
                    onClick={() => handleQuickAdd(item)}
                    className="p-2 rounded-xl bg-slateblue hover:bg-slateblue-light text-cream font-bold transition shadow-sm"
                    title="Add to tray"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <Link
              to="/menu"
              className="w-full py-3 rounded-xl bg-cream hover:bg-slateblue hover:text-cream text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>View Complete Canteen Menu</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};