import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertCircle,
  RefreshCw,
  LogOut,
  ToggleLeft,
  ToggleRight,
  PackageCheck,
  UtensilsCrossed,
  Layers,
  Search,
} from 'lucide-react';

export const StaffDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'queue' | 'availability'>('queue');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [ordersData, setOrdersData] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes] = await Promise.all([
        axios.get('/staff/orders'),
        axios.get('/staff/menu-status'),
      ]);

      if (ordersRes.data.success) {
        setOrdersData(ordersRes.data.data);
      }
      if (menuRes.data.success) {
        setMenuItems(menuRes.data.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await axios.patch(`/staff/orders/${orderId}/status`, {
        status: nextStatus,
      });
      if (res.data.success) {
        addToast({
          type: 'success',
          title: 'Order Status Updated',
          message: res.data.message,
        });
        loadData();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.error || 'Could not update order status.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const res = await axios.patch(`/staff/menu-status/${itemId}`, {
        isAvailable: !currentStatus,
      });
      if (res.data.success) {
        addToast({
          type: 'info',
          title: 'Item Stock Updated',
          message: res.data.message,
        });
        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, isAvailable: !currentStatus, stockStatus: !currentStatus ? 'AVAILABLE' : 'OUT_OF_STOCK' } : item
          )
        );
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not toggle item availability.',
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Signed out from Staff Kitchen Operations.',
    });
    navigate('/staff/login');
  };

  const filteredOrders = (ordersData?.all || []).filter((o: any) => {
    if (selectedStatusFilter === 'ALL') return true;
    return o.status === selectedStatusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Staff Kitchen Control Header */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              <ChefHat className="w-3.5 h-3.5 text-emerald-300" />
              <span>Kitchen Operations Panel • Station 01</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Chef {user?.name || 'Staff Member'}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
              Monitor incoming campus meal orders, advance kitchen preparation stages, and manage live stock availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2 backdrop-blur-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-black/25 hover:bg-black/40 text-white transition flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Counts Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => { setActiveTab('queue'); setSelectedStatusFilter('PENDING'); }}
          className={`p-5 rounded-2xl border text-left transition ${
            selectedStatusFilter === 'PENDING' && activeTab === 'queue'
              ? 'bg-amber-500/15 border-amber-500 shadow-sm'
              : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              New / Pending
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            {ordersData?.counts?.pending ?? 1}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Awaiting kitchen confirmation</div>
        </button>

        <button
          onClick={() => { setActiveTab('queue'); setSelectedStatusFilter('PREPARING'); }}
          className={`p-5 rounded-2xl border text-left transition ${
            selectedStatusFilter === 'PREPARING' && activeTab === 'queue'
              ? 'bg-blue-500/15 border-blue-500 shadow-sm'
              : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Cooking / In Kitchen
            </span>
            <Flame className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            {ordersData?.counts?.preparing ?? 1}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Currently being prepared</div>
        </button>

        <button
          onClick={() => { setActiveTab('queue'); setSelectedStatusFilter('READY'); }}
          className={`p-5 rounded-2xl border text-left transition ${
            selectedStatusFilter === 'READY' && activeTab === 'queue'
              ? 'bg-emerald-500/15 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Ready for Pickup
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            {ordersData?.counts?.ready ?? 1}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">At collection counter</div>
        </button>

        <button
          onClick={() => { setActiveTab('queue'); setSelectedStatusFilter('COMPLETED'); }}
          className={`p-5 rounded-2xl border text-left transition ${
            selectedStatusFilter === 'COMPLETED' && activeTab === 'queue'
              ? 'bg-gray-500/15 border-gray-500 shadow-sm'
              : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border hover:border-gray-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Completed
            </span>
            <PackageCheck className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            {ordersData?.counts?.completed ?? 1}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Handed over to diners</div>
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-border pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'queue'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Live Kitchen Order Queue ({ordersData?.all?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'availability'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Menu Stock & Availability ({menuItems.length})
          </button>
        </div>

        {activeTab === 'queue' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 hidden sm:inline">Filter:</span>
            {['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  selectedStatusFilter === st
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-hover'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Live Kitchen Queue */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 text-sm">
              No orders found matching filter "{selectedStatusFilter}".
            </div>
          ) : (
            filteredOrders.map((order: any) => {
              const isPending = order.status === 'PENDING';
              const isPreparing = order.status === 'PREPARING';
              const isReady = order.status === 'READY';
              const isCompleted = order.status === 'COMPLETED';

              return (
                <div
                  key={order.id}
                  className={`rounded-3xl bg-white dark:bg-dark-surface border-2 p-6 shadow-md transition-all flex flex-col justify-between ${
                    isPending
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : isPreparing
                      ? 'border-blue-500/40 bg-blue-500/5'
                      : isReady
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-gray-200 dark:border-dark-border opacity-70'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">
                          #{order.orderNumber}
                        </span>
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-gray-400">{order.customerPhone}</div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                            : isPreparing
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 animate-pulse'
                            : isReady
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-dark-card dark:text-gray-400'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Pickup slot & elapsed time */}
                    <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-black/5 dark:bg-white/5 font-medium">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <Clock className="w-3.5 h-3.5" />
                        Pickup: <strong>{order.pickupSlot}</strong>
                      </span>
                      <span className="text-gray-400 text-[11px]">{order.elapsedMinutes}m ago</span>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-dark-border">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Kitchen Ticket:
                      </span>
                      <ul className="space-y-2 text-xs font-semibold">
                        {order.items.map((item: any, idx: number) => (
                          <li key={idx} className="flex flex-col bg-white dark:bg-dark-card p-2.5 rounded-xl border border-gray-100 dark:border-dark-border">
                            <div className="flex justify-between text-gray-900 dark:text-white font-bold">
                              <span>{item.quantity}x {item.name}</span>
                            </div>
                            {item.notes && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic mt-0.5">
                                ↳ Note: {item.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Transition Buttons */}
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border">
                    {isPending && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        disabled={actionLoadingId === order.id}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Start Cooking in Kitchen</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        disabled={actionLoadingId === order.id}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Ready for Pickup</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                        disabled={actionLoadingId === order.id}
                        className="w-full py-3 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Handed to Diner (Complete)</span>
                      </button>
                    )}

                    {isCompleted && (
                      <div className="text-center text-[11px] font-bold text-gray-400 py-2">
                        ✓ Order Fulfilled
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Menu Stock & Availability Manager */}
      {activeTab === 'availability' && (
        <div className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-200/80 dark:border-dark-border p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-dark-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Live Menu Item Availability Control
              </h2>
              <p className="text-xs text-gray-500">
                Instantly turn items ON or OFF in the student mobile ordering menu when kitchen stock runs out.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {menuItems.filter((m) => m.isAvailable).length} / {menuItems.length} items active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-card border border-gray-200/80 dark:border-dark-border flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    {item.name}
                  </h4>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      }`}
                    >
                      {item.isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                  className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    item.isAvailable
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-400'
                  }`}
                >
                  {item.isAvailable ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{item.isAvailable ? 'Active' : 'Disabled'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
