import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { PixelIcon } from '../components/pixel/PixelIcon';
import {
  Clock,
  RefreshCw,
  LogOut,
  ToggleLeft,
  ToggleRight,
  PackageCheck,
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

  const handleToggleTodaysSpecial = async (itemId: string, currentStatus: boolean) => {
    try {
      const res = await axios.patch(`/staff/menu-status/${itemId}/todays-special`, {
        isTodaysSpecial: !currentStatus,
      });
      if (res.data.success) {
        addToast({
          type: 'info',
          title: 'Today’s Special Updated',
          message: res.data.message,
        });
        await loadData();
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not update today’s special status.',
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
  const displayedOrders = selectedStatusFilter === 'ALL'
    ? filteredOrders
        .map((order: any, index: number) => ({ order, index }))
        .sort((left: any, right: any) => {
          const statusOrder: Record<string, number> = {
            RECEIVED: 0,
            PREPARING: 1,
            READY_TO_PICK: 2,
            DELIVERED: 3,
            CANCELLED: 4,
          };
          const leftRank = statusOrder[left.order.orderStatus] ?? 5;
          const rightRank = statusOrder[right.order.orderStatus] ?? 5;
          if (leftRank !== rightRank) return leftRank - rightRank;
          if (leftRank > 4) return left.index - right.index;
          const createdAtOrder =
            new Date(left.order.createdAt).getTime() - new Date(right.order.createdAt).getTime();
          if (createdAtOrder === 0) return left.index - right.index;
          return leftRank <= 2 ? createdAtOrder : -createdAtOrder;
        })
        .map(({ order }: { order: any }) => order)
    : filteredOrders;
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
      <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-cream shadow-xl sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-butter px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy">
              <PixelIcon name="bowl" size={14} />
              <span>Kitchen Operations Panel • Station 01</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Chef {user?.name || 'Staff Member'}
            </h1>
            <p className="max-w-xl text-xs text-butter sm:text-sm">
              Monitor incoming campus meal orders, advance kitchen preparation stages, and manage live stock availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-btn px-btn--cream"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
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

      {/* Summary Counts Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => { setActiveTab('queue'); setSelectedStatusFilter('PENDING'); }}
          className={`p-5 rounded-2xl border text-left transition ${
            selectedStatusFilter === 'PENDING' && activeTab === 'queue'
              ? 'bg-butter border-gold shadow-sm'
              : 'bg-sand border border-line hover:border-gold'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-label text-xs font-extrabold uppercase tracking-wider text-navy">
              New / Pending
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
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
              ? 'bg-skyblue border-skyblue shadow-sm'
              : 'bg-sand border border-line hover:border-skyblue'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-label text-xs font-extrabold uppercase tracking-wider text-navy">
              Cooking / In Kitchen
            </span>
            <PixelIcon name="bowl" size={18} />
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
              ? 'bg-skyblue border-skyblue shadow-sm'
              : 'bg-sand border border-line hover:border-skyblue'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-label text-xs font-extrabold uppercase tracking-wider text-navy">
              Ready for Pickup
            </span>
            <PixelIcon name="check" size={16} />
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
            <span className="px-label text-xs font-extrabold uppercase tracking-wider text-navy">
              Completed
            </span>
            <PixelIcon name="check" size={16} />
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
                ? 'bg-gold text-navy shadow-md'
                : 'bg-sand border border-line text-slateblue hover:bg-sand/50'
            }`}
          >
            Live Kitchen Order Queue ({ordersData?.all?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'availability'
                ? 'bg-gold text-navy shadow-md'
                : 'bg-sand border border-line text-slateblue hover:bg-sand/50'
            }`}
          >
            Menu Stock & Availability ({menuItems.length})
          </button>
        </div>

        {activeTab === 'queue' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-label text-navy hidden sm:inline">Filter:</span>
            {['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-chip transition ${
                  selectedStatusFilter === st
                    ? 'bg-navy text-cream'
                    : 'hover:bg-skyblue'
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
        <div className="px-stagger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedOrders.length === 0 ? (
            <div className="col-span-full flex items-center justify-center gap-3 rounded-2xl bg-sand px-4 py-6 text-center text-sm text-navy">
              <PixelIcon name="bowl" size={20} />
              <span>No orders match this filter.</span>
            </div>
          ) : (
            displayedOrders.map((order: any) => {
              const isPending = order.orderStatus === 'RECEIVED';
              const isPreparing = order.orderStatus === 'PREPARING';
              const isReady = order.orderStatus === 'READY_TO_PICK';
              const isActive = isPending || isPreparing || isReady;
              const statusSteps = [
                { status: 'RECEIVED', label: 'Received' },
                { status: 'PREPARING', label: 'Cooking' },
                { status: 'READY_TO_PICK', label: 'Ready' },
                { status: 'DELIVERED', label: 'Delivered' },
              ];

              return (
                <div
                  key={order.id}
                  className={`px-card h-full rounded-3xl border-2 p-6 transition-all flex flex-col ${
                    isPending
                      ? 'border-gold'
                      : isPreparing
                      ? 'border-skyblue'
                      : isReady
                      ? 'border-navy'
                      : 'border-line opacity-70'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-label text-2xl font-black text-slateblue">
                          #{order.orderNumber}
                        </span>
                        <div className="text-xs font-bold text-navy/80 mt-0.5">
                          {order.studentName}
                        </div>
                        <div className="text-[11px] text-navy/70">{order.studentEmail}</div>
                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2" aria-label="Order status progress">
                      {order.orderStatus === 'CANCELLED' ? (
                        <span className="px-chip">Cancelled</span>
                      ) : statusSteps.map((step) => (
                        <span
                          key={step.status}
                          className={`px-chip px-order-step ${order.orderStatus === step.status ? 'is-current' : ''}`}
                        >
                          {step.label}
                        </span>
                      ))}
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
                      <span className="px-label text-[11px] font-bold text-navy uppercase tracking-wider">
                        Kitchen Ticket
                      </span>
                      <ul className="space-y-2 text-xs font-semibold">
                        {order.items.map((item: any, idx: number) => (
                          <li key={idx} className="flex flex-col bg-cream p-2.5 rounded-xl border border-line">
                            <div className="flex justify-between text-slateblue font-bold">
                              <span className="flex flex-wrap items-center gap-2">
                                {item.quantity}x {item.name}
                                {item.isTodaysSpecial && (
                                  <span className="pixel-gold-badge">
                                    Today&apos;s Special
                                  </span>
                                )}
                              </span>
                            </div>
                            {item.notes && (
                              <span className="text-[11px] text-rust font-medium italic mt-0.5">
                                ↳ Note: {item.notes}
                              </span>
                            )}
                            {item.cookingTip && (
                              <span className="px-card bg-butter mt-1 block rounded-lg p-2 text-[11px] font-medium text-navy">
                                Cooking tip: {item.cookingTip}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {order.specialInstructions && (
                      <div className="px-card rounded-xl bg-butter p-3 text-navy">
                        <div className="text-[11px] font-bold uppercase tracking-wider">Cooking instruction</div>
                        <p className="mt-1 text-xs font-medium">{order.specialInstructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Transition Buttons */}
                  {isActive && <div className="mt-auto pt-4 border-t border-line">
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleUpdateStatus(order, 'PREPARING')}
                          disabled={actionLoadingId === order.id}
                          className="px-btn flex-1 disabled:opacity-50"
                        >
                          <PixelIcon name="bowl" size={16} />
                          Start cooking
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
                          className="px-btn px-btn--sky flex-1 disabled:opacity-50"
                        >
                          <PixelIcon name="check" size={16} />
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
                        <label htmlFor={`delivery-id-${order.id}`} className="px-label block text-xs font-bold text-navy">
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
                          className="px-btn w-full disabled:opacity-50"
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
              <p className="text-xs text-espresso">
                Instantly turn items ON or OFF in the student mobile ordering menu when kitchen stock runs out.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-skyblue px-2 py-1 text-xs font-semibold text-navy">
              {menuItems.filter((m) => m.availableNow).length} / {menuItems.length} items available now
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso" />
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

          <p className="text-[11px] text-espresso">Showing {filteredMenuItems.length} of {menuItems.length} items</p>
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
                  <span className="text-[10px] font-semibold text-espresso uppercase tracking-wider">
                    {item.category}
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        effectiveAvailable
                          ? 'bg-skyblue text-navy'
                          : !item.isAvailable
                            ? 'bg-red-500/10 text-red-700'
                            : 'bg-amber-500/10 text-amber-700'
                      }`}
                    >
                      {statusText}
                    </span>
                    {!effectiveAvailable && item.unavailableReason && item.isAvailable && (
                      <div className="mt-1 text-[10px] text-espresso">{item.unavailableReason}</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                    aria-pressed={item.isAvailable}
                    aria-label={`${item.isAvailable ? 'Disable' : 'Enable'} ${item.name} availability`}
                    className={`staff-pixel-switch ${item.isAvailable ? 'is-enabled' : ''} ${
                      item.isAvailable
                        ? ''
                        : 'is-disabled'
                    }`}
                  >
                    {item.isAvailable ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    <span>{item.isAvailable ? 'Active' : 'Disabled'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTodaysSpecial(item.id, item.isTodaysSpecial)}
                    aria-pressed={item.isTodaysSpecial}
                    aria-label={`${item.isTodaysSpecial ? 'Remove' : 'Mark'} ${item.name} as today’s special`}
                    className={`border-2 border-navy px-2 py-2 font-pixel text-[8px] uppercase leading-tight shadow-[2px_2px_0_#0B2A4A] transition-colors ${
                      item.isTodaysSpecial ? 'bg-[#F2C94C] text-navy' : 'bg-cream text-navy hover:bg-butter'
                    }`}
                  >
                    Today&apos;s Special
                  </button>
                </div>
              </div>
            );})}
            {!filteredMenuItems.length && <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-center gap-3 rounded-2xl bg-cream border border-line p-4 text-center text-sm text-navy"><PixelIcon name="bowl" size={18} /><span>No menu items match these filters.</span></div>}
          </div>
        </div>
      )}

    </div>
  );
};