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
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('');
  const [menuCuisineFilter, setMenuCuisineFilter] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deliveryIds, setDeliveryIds] = useState<Record<string, string>>({});
  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string>>({});

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

  const handleUpdateStatus = async (
    order: any,
    nextStatus: string,
    verificationId?: string
  ) => {
    if (nextStatus === 'CANCELLED' && !window.confirm(`Cancel order #${order.orderNumber}?`)) return;
    setActionLoadingId(order.id);
    try {
      const res = await axios.patch(`/staff/orders/${order.id}/status`, {
        status: nextStatus,
        ...(verificationId ? { verificationId } : {}),
      });
      if (res.data.success) {
        const updatedOrder = res.data.data;
        setOrdersData((current: any) => {
          if (!current) return current;
          const all = current.all.map((entry: any) =>
            entry.id === updatedOrder.id ? updatedOrder : entry
          );
          const pending = all.filter((entry: any) => entry.orderStatus === 'RECEIVED');
          const preparing = all.filter((entry: any) => entry.orderStatus === 'PREPARING');
          const ready = all.filter((entry: any) => entry.orderStatus === 'READY_TO_PICK');
          const completed = all.filter((entry: any) => entry.orderStatus === 'DELIVERED');
          const cancelled = all.filter((entry: any) => entry.orderStatus === 'CANCELLED');
          return {
            ...current,
            all,
            counts: {
              pending: pending.length,
              preparing: preparing.length,
              ready: ready.length,
              completed: completed.length,
              cancelled: cancelled.length,
              totalActive: pending.length + preparing.length + ready.length,
            },
            grouped: { pending, preparing, ready, completed },
          };
        });
        setDeliveryErrors((current) => ({ ...current, [order.id]: '' }));
        addToast({
          type: 'success',
          title: 'Order Status Updated',
          message: res.data.message,
        });
        loadData();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Could not update order status.';
      if (nextStatus === 'DELIVERED') {
        setDeliveryErrors((current) => ({ ...current, [order.id]: errorMessage }));
      }
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
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
        await loadData();
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
    const statusFilterMap: Record<string, string> = {
      PENDING: 'RECEIVED',
      READY: 'READY_TO_PICK',
      COMPLETED: 'DELIVERED',
    };
    return o.orderStatus === (statusFilterMap[selectedStatusFilter] || selectedStatusFilter);
  });
  const staffCategories = [...new Set(menuItems.map((item) => item.category))].sort();
  const staffCuisines = [...new Set(menuItems.flatMap((item) => item.cuisines || []))].sort();
  const filteredMenuItems = menuItems.filter((item) =>
    (!menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase().trim())) &&
    (!menuCategoryFilter || item.category === menuCategoryFilter) &&
    (!menuCuisineFilter || (item.cuisines || []).includes(menuCuisineFilter))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-cream">
      
      {/* Staff Kitchen Control Header */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-cream shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md text-cream text-xs font-bold uppercase tracking-wider">
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
              className="px-4 py-2.5 rounded-xl bg-cream/10 hover:bg-cream/20 text-cream font-bold text-xs transition flex items-center gap-2 backdrop-blur-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-black/25 hover:bg-black/40 text-cream transition flex items-center justify-center"
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
              : 'bg-sand border border-line hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              New / Pending
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-slateblue mt-2">
            {ordersData?.counts?.pending ?? 0}
          </div>
          <div className="text-[11px] text-navy mt-1">Awaiting kitchen confirmation</div>
        </button>

        <button
          onClick={() => { setActiveTab('queue'); setSelectedStatusFilter('PREPARING'); }}
          className={`p-5 rounded-2xl border text-left transition ${
            selectedStatusFilter === 'PREPARING' && activeTab === 'queue'
              ? 'bg-blue-500/15 border-blue-500 shadow-sm'
              : 'bg-sand border border-line hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-navy/80">
              Cooking / In Kitchen
            </span>
            <Flame className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slateblue mt-2">
            {ordersData?.counts?.preparing ?? 0}
          </div>
          <div className="text-[11px] text-navy mt-1">Currently being prepared</div>
        </button>

        <button
          onClick={() => { setActiveTab('queue'); setSelectedStatusFilter('READY'); }}
          className={`p-5 rounded-2xl border text-left transition ${
            selectedStatusFilter === 'READY' && activeTab === 'queue'
              ? 'bg-emerald-500/15 border-emerald-500 shadow-sm'
              : 'bg-sand border border-line hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
              Ready for Pickup
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slateblue mt-2">
            {ordersData?.counts?.ready ?? 0}
          </div>
          <div className="text-[11px] text-navy mt-1">At collection counter</div>
        </button>

        <button
          onClick={() => { setActiveTab('queue'); setSelectedStatusFilter('COMPLETED'); }}
          className={`p-5 rounded-2xl border text-left transition ${
            selectedStatusFilter === 'COMPLETED' && activeTab === 'queue'
              ? 'bg-sand/50 border-sand/50 shadow-sm'
              : 'bg-sand border border-line hover:border-sand/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-navy/75">
              Completed
            </span>
            <PackageCheck className="w-4 h-4 text-dusty" />
          </div>
          <div className="text-3xl font-black text-slateblue mt-2">
            {ordersData?.counts?.completed ?? 0}
          </div>
          <div className="text-[11px] text-navy mt-1">Handed over to diners</div>
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'queue'
                ? 'bg-emerald-600 text-cream shadow-md'
                : 'bg-sand border border-line text-slateblue hover:bg-sand/50'
            }`}
          >
            Live Kitchen Order Queue ({ordersData?.all?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'availability'
                ? 'bg-emerald-600 text-cream shadow-md'
                : 'bg-sand border border-line text-slateblue hover:bg-sand/50'
            }`}
          >
            Menu Stock & Availability ({menuItems.length})
          </button>
        </div>

        {activeTab === 'queue' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-navy hidden sm:inline">Filter:</span>
            {['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  selectedStatusFilter === st
                    ? 'bg-slateblue text-cream'
                    : 'text-navy hover:bg-sand/50'
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
            <div className="col-span-full py-12 text-center text-dusty text-sm">
              No orders found matching filter "{selectedStatusFilter}".
            </div>
          ) : (
            filteredOrders.map((order: any) => {
              const isPending = order.orderStatus === 'RECEIVED';
              const isPreparing = order.orderStatus === 'PREPARING';
              const isReady = order.orderStatus === 'READY_TO_PICK';
              const isActive = isPending || isPreparing || isReady;

              return (
                <div
                  key={order.id}
                  className={`h-full rounded-3xl bg-sand border-2 p-6 shadow-md transition-all flex flex-col ${
                    isPending
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : isPreparing
                      ? 'border-blue-500/40 bg-blue-500/5'
                      : isReady
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-line opacity-70'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-2xl font-black text-slateblue">
                          #{order.orderNumber}
                        </span>
                        <div className="text-xs font-bold text-navy/80 mt-0.5">
                          {order.studentName}
                        </div>
                        <div className="text-[11px] text-navy/70">{order.studentEmail}</div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-800'
                            : isPreparing
                            ? 'bg-blue-500/10 text-blue-800 animate-pulse'
                            : isReady
                            ? 'bg-emerald-500/10 text-emerald-800'
                            : 'bg-sand/30 text-dusty'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>

                    {/* Pickup slot & elapsed time */}
                    <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-sand/30 font-medium">
                      <span className="flex items-center gap-1.5 text-navy/75">
                        <Clock className="w-3.5 h-3.5" />
                        Pickup: <strong>{order.pickupSlot || 'Not scheduled'}</strong>
                      </span>
                      <span className="text-navy/70 text-[11px]">
                        {Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000))}m ago
                      </span>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-2 pt-1 border-t border-line">
                      <span className="text-[11px] font-bold text-navy/75 uppercase tracking-wider">
                        Kitchen Ticket
                      </span>
                      <ul className="space-y-2 text-xs font-semibold">
                        {order.items.map((item: any, idx: number) => (
                          <li key={idx} className="flex flex-col bg-cream p-2.5 rounded-xl border border-line">
                            <div className="flex justify-between text-slateblue font-bold">
                              <span>{item.quantity}x {item.name}</span>
                            </div>
                            {item.notes && (
                              <span className="text-[11px] text-amber-600 font-medium italic mt-0.5">
                                ↳ Note: {item.notes}
                              </span>
                            )}
                            {item.cookingTip && (
                              <span className="mt-1 rounded-lg bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-800">
                                Cooking tip: {item.cookingTip}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Transition Buttons */}
                  {isActive && <div className="mt-auto pt-4 border-t border-line">
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleUpdateStatus(order, 'PREPARING')}
                          disabled={actionLoadingId === order.id}
                          className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-cream font-extrabold text-xs shadow-md transition disabled:opacity-50"
                        >
                          <Flame className="inline w-4 h-4 mr-1" />
                          Start preparing
                        </button>
                        <button
                          onClick={() => void handleUpdateStatus(order, 'CANCELLED')}
                          disabled={actionLoadingId === order.id}
                          className="rounded-xl border border-rust/40 px-3 py-3 text-rust font-bold text-xs disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {isPreparing && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleUpdateStatus(order, 'READY_TO_PICK')}
                          disabled={actionLoadingId === order.id}
                          className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-cream font-extrabold text-xs shadow-md transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="inline w-4 h-4 mr-1" />
                          Mark ready
                        </button>
                        <button
                          onClick={() => void handleUpdateStatus(order, 'CANCELLED')}
                          disabled={actionLoadingId === order.id}
                          className="rounded-xl border border-rust/40 px-3 py-3 text-rust font-bold text-xs disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {isReady && (
                      <div className="space-y-2">
                        <label htmlFor={`delivery-id-${order.id}`} className="block text-xs font-bold text-navy/80">
                          Order ID
                        </label>
                        <input
                          id={`delivery-id-${order.id}`}
                          value={deliveryIds[order.id] || ''}
                          onChange={(event) => {
                            setDeliveryIds((current) => ({ ...current, [order.id]: event.target.value }));
                            setDeliveryErrors((current) => ({ ...current, [order.id]: '' }));
                          }}
                          disabled={actionLoadingId === order.id}
                          aria-invalid={Boolean(deliveryErrors[order.id])}
                          aria-describedby={deliveryErrors[order.id] ? `delivery-error-${order.id}` : undefined}
                          className="w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-skyblue disabled:opacity-50"
                        />
                        {deliveryErrors[order.id] && (
                          <p id={`delivery-error-${order.id}`} role="alert" className="text-xs font-semibold text-red-700">
                            {deliveryErrors[order.id]}
                          </p>
                        )}
                        <button
                          onClick={() => void handleUpdateStatus(order, 'DELIVERED', deliveryIds[order.id])}
                          disabled={actionLoadingId === order.id || !deliveryIds[order.id]?.trim()}
                          className="w-full py-3 rounded-xl bg-slateblue hover:bg-slateblue-light text-cream font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <PackageCheck className="w-4 h-4" />
                          Deliver
                        </button>
                      </div>
                    )}

                  </div>}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Menu Stock & Availability Manager */}
      {activeTab === 'availability' && (
        <div className="bg-sand border border-line rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-slateblue">
                Live Menu Item Availability Control
              </h2>
              <p className="text-xs text-dusty">
                Instantly turn items ON or OFF in the student mobile ordering menu when kitchen stock runs out.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              {menuItems.filter((m) => m.availableNow).length} / {menuItems.length} items available now
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dusty" />
              <input value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Search menu items" className="w-full rounded-xl border border-line bg-cream py-2.5 pl-9 pr-3 text-xs text-slateblue focus:outline-none focus:ring-2 focus:ring-skyblue" />
            </label>
            <select value={menuCategoryFilter} onChange={(event) => setMenuCategoryFilter(event.target.value)} aria-label="Filter by category" className="rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-slateblue">
              <option value="">All categories</option>
              {staffCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={menuCuisineFilter} onChange={(event) => setMenuCuisineFilter(event.target.value)} aria-label="Filter by cuisine" className="rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-slateblue">
              <option value="">All cuisines</option>
              {staffCuisines.map((cuisine: string) => <option key={cuisine} value={cuisine}>{cuisine.replace(/-/g, ' ')}</option>)}
            </select>
          </div>

          <p className="text-[11px] text-dusty">Showing {filteredMenuItems.length} of {menuItems.length} items</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.map((item) => {
              const effectiveAvailable = item.availableNow ?? item.isAvailable;
              const statusText = !item.isAvailable
                ? 'Disabled by staff'
                : !effectiveAvailable
                  ? 'Auto-unavailable (meal window)'
                  : 'Available now';
              return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-cream border border-line flex items-center justify-between gap-4 ${effectiveAvailable ? '' : 'opacity-70'}`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slateblue">
                    {item.name}
                  </h4>
                  <span className="text-[10px] font-semibold text-dusty uppercase tracking-wider">
                    {item.category}
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        effectiveAvailable
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : !item.isAvailable
                            ? 'bg-red-500/10 text-red-700'
                            : 'bg-amber-500/10 text-amber-700'
                      }`}
                    >
                      {statusText}
                    </span>
                    {!effectiveAvailable && item.unavailableReason && item.isAvailable && (
                      <div className="mt-1 text-[10px] text-dusty">{item.unavailableReason}</div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                  className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    item.isAvailable
                      ? 'bg-emerald-600 text-cream hover:bg-emerald-700'
                      : 'bg-sand/30 text-dusty hover:bg-sand/50'
                  }`}
                >
                  {item.isAvailable ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{item.isAvailable ? 'Active' : 'Disabled'}</span>
                </button>
              </div>
            );})}
            {!filteredMenuItems.length && <div className="sm:col-span-2 lg:col-span-3 rounded-2xl bg-cream border border-line p-6 text-center text-sm text-dusty">No menu items match these filters.</div>}
          </div>
        </div>
      )}

    </div>
  );
};