import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { fetchStudentOrders } from '../api/orderApi';
import { FoodCard } from '../components/menu/FoodCard';
import {
  GraduationCap,
  UtensilsCrossed,
  Award,
  ArrowRight,
  Flame,
  AlertCircle,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { PixelIcon } from '../components/pixel/PixelIcon';

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [feedbackEntries, setFeedbackEntries] = useState<any[]>([]);
  const [hasUnreviewedDeliveredOrder, setHasUnreviewedDeliveredOrder] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboard();
    fetchFeedback();
    fetchUnreviewedDeliveredOrder();
    fetchRecommendations();
  }, []);

  const fetchUnreviewedDeliveredOrder = async () => {
    try {
      const response = await fetchStudentOrders();
      if (response.success) {
        setHasUnreviewedDeliveredOrder(
          (response.data || []).some((order: any) => order.orderStatus === 'DELIVERED' && !order.feedback)
        );
      }
    } catch (error) {
      console.error('Failed to check delivered orders awaiting feedback:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await axios.get('/student/feedback');
      if (response.data.success) setFeedbackEntries(response.data.data || []);
    } catch (error) {
      console.error('Failed to load student feedback:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get('/student/recommendations');
      if (response.data.success) setRecommendations(response.data.data || []);
    } catch (error) {
      console.error('Failed to load student recommendations:', error);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/student/dashboard-summary');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load student dashboard:', error);
    } finally {
      setLoading(false);
    }
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

  const orderSteps = [
    { status: 'RECEIVED', label: 'Confirmed' },
    { status: 'PREPARING', label: 'Preparing' },
    { status: 'READY_TO_PICK', label: 'Ready for Pickup' },
    { status: 'DELIVERED', label: 'Delivered' },
  ];
  const currentOrderStep = orderSteps.findIndex(
    (step) => step.status === dashboardData?.activeOrder?.status
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-cream">
      
      {/* Top Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-cream shadow-xl sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-butter px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Account • {user?.institutionId || 'Not set'}</span>
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight sm:text-4xl">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="max-w-xl text-xs text-butter sm:text-sm">
              Preorder your favorite campus meals, check live queue times, and earn rewards on every meal.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/menu"
              className="px-btn px-btn--cream flex-1 sm:flex-none"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Order Food Now</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-btn h-11 w-11 p-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3 KPI Summary Cards (Loyalty hidden) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="px-card flex items-center gap-4 rounded-2xl p-5">
          <div className="w-12 h-12 rounded-xl bg-skyblue text-navy flex items-center justify-center font-bold">
            <PixelIcon name="clock" size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              {dashboardData?.stats?.activeOrdersCount ?? 0}
            </div>
            <div className="text-xs text-navy font-medium">Active Orders</div>
          </div>
        </div>

        <div className="px-card flex items-center gap-4 rounded-2xl p-5">
          <div className="w-12 h-12 rounded-xl bg-butter text-navy flex items-center justify-center font-bold">
            <PixelIcon name="cart" size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              {dashboardData?.stats?.totalOrdersCount ?? 0}
            </div>
            <div className="text-xs text-navy font-medium">Total Preorders</div>
          </div>
        </div>

        <div className="px-card flex items-center gap-4 rounded-2xl p-5">
          <div className="w-12 h-12 rounded-xl bg-gold text-navy flex items-center justify-center font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              {dashboardData?.stats?.savedFavoritesCount ?? 0}
            </div>
            <div className="text-xs text-navy font-medium">Favorite Items</div>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-slateblue">Recommended for you</h2>
              <p className="text-xs text-espresso">Picks based on today's menu and your activity.</p>
            </div>
          </div>
          <div className="px-stagger-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((recommendation) => (
              <article key={recommendation.item.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-extrabold text-amber-800">
                    {recommendation.label === 'Smart pick' ? 'Smart pick' : 'Popular now'}
                  </span>
                  <span className="truncate text-right text-[10px] text-espresso">{recommendation.reason}</span>
                </div>
                <FoodCard item={recommendation.item} />
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Main Grid: Active Order + Favorites */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Left 2 Cols: Live Order Tracker */}
        <div className="space-y-6">
          <div className="px-card space-y-5 rounded-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slateblue">
                  Live Order Tracker
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slateblue mt-0.5">
                  {dashboardData?.activeOrder
                    ? `Order #${dashboardData.activeOrder.orderNumber}`
                    : 'No active orders'}
                </h2>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>
                  {dashboardData?.activeOrder
                    ? dashboardData.activeOrder.status.replace(/_/g, ' ')
                    : 'No active order'}
                </span>
              </div>
              <section className="p-6 sm:p-7 rounded-3xl bg-sand border border-line shadow-md space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-slateblue">My Feedback</h2>
                  {hasUnreviewedDeliveredOrder && (
                    <Link to="/orders" className="text-xs font-bold text-navy hover:text-rust hover:underline">
                      Rate your order
                    </Link>
                  )}
                </div>
                {feedbackEntries.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {feedbackEntries.map((feedback) => (
                      <article key={feedback.id} className="rounded-2xl bg-cream border border-line p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-slateblue">{feedback.rating}/5 stars</span>
                          <span className="text-[11px] text-espresso">{new Date(feedback.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-semibold text-espresso">Order #{feedback.orderNumber}</p>
                        <p className="text-sm text-espresso">{feedback.comment || 'No comment provided.'}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-cream border border-line p-4 text-sm text-navy/75">No feedback yet.</div>
                )}
              </section>
            </div>

            {/* Order Status Progress */}
            {dashboardData?.activeOrder && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold pt-2">
                {orderSteps.map((step, index) => {
                  const isComplete = currentOrderStep > index;
                  const isCurrent = currentOrderStep === index;
                  const isDelivered = step.status === 'DELIVERED' && isCurrent;
                  return (
                    <div
                      key={step.status}
                      className={`px-chip px-order-step flex-col justify-center rounded-xl p-3 ${
                        isComplete || isDelivered
                          ? 'bg-skyblue'
                          : isCurrent
                            ? 'is-current bg-butter'
                            : 'bg-cream'
                      }`}
                    >
                      {(isComplete || isDelivered) && (
                        <span className="mb-1"><PixelIcon name="check" size={16} /></span>
                      )}
                      {isCurrent && !isDelivered && (
                        <span className="mb-1"><PixelIcon name="clock" size={16} /></span>
                      )}
                      {!isComplete && !isCurrent && (
                        <span className="block mb-1">{index + 1}.</span>
                      )}
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Order Items Summary */}
            <div className="p-4 rounded-2xl bg-cream border border-line space-y-2 text-xs sm:text-sm">
              {dashboardData?.activeOrder ? (
                <>
                  {dashboardData.activeOrder.items.map((item: any, index: number) => (
                    <div key={`${item.name}-${index}`} className="flex justify-between font-medium text-slateblue">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-bold text-slateblue">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-line flex justify-between font-extrabold text-slateblue">
                    <span>Total Amount</span>
                    <span className="text-slateblue">₹{dashboardData.activeOrder.total}</span>
                  </div>
                </>
              ) : (
                <div className="p-3 text-center text-navy/75">
                  No active order. Place an order to see its status here.
                </div>
              )}
            </div>

            {dashboardData?.activeOrder && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slateblue/5 border border-slateblue/10 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slateblue text-cream flex items-center justify-center font-bold">
                    <span className="font-mono text-xs">{dashboardData.activeOrder.orderNumber}</span>
                  </div>
                  <div className="space-y-1">
                    {dashboardData.activeOrder.estimatedMinutes != null && (
                      <div className="text-navy/75">
                        ETA: {dashboardData.activeOrder.estimatedMinutes} minutes
                      </div>
                    )}
                    {dashboardData.activeOrder.pickupSlot != null && (
                      <div className="text-navy/75">
                        Pickup slot: {dashboardData.activeOrder.pickupSlot}
                      </div>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-cream text-slateblue font-extrabold text-[11px]">
                  Order ID: {dashboardData.activeOrder.orderNumber}
                </span>
              </div>
            )}
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
              {(dashboardData?.recentOrders || []).map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-cream border border-line text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slateblue">
                      #{order.orderNumber} • {order.items}
                    </div>
                    <div className="text-navy/70 text-[11px]">{order.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slateblue">₹{order.total}</div>
                    <span className="inline-block rounded-full bg-skyblue px-2 py-0.5 text-[10px] font-bold text-navy">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {!dashboardData?.recentOrders?.length && (
                <div className="p-3.5 text-xs text-espresso">No previous orders yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};