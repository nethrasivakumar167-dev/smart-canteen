import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
  LogOut,
  Search,
} from 'lucide-react';
import { PixelIcon } from '../components/pixel/PixelIcon';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'feedback'>('overview');
  const [analyticsRange, setAnalyticsRange] = useState<'today' | '7d' | '30d' | 'all'>('today');
  const [statsData, setStatsData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // User filter state
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');

  // Provisioning modal state
  const [showProvisionModal, setShowProvisionModal] = useState<boolean>(false);
  const [provisionName, setProvisionName] = useState<string>('');
  const [provisionEmail, setProvisionEmail] = useState<string>('');
  const [provisionPassword, setProvisionPassword] = useState<string>('');
  const [provisionRole, setProvisionRole] = useState<string>('STAFF');
  const [provisionId, setProvisionId] = useState<string>('');
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async (range: typeof analyticsRange = analyticsRange) => {
    setLoading(true);
    try {
      const [statsRes, usersRes, ordersRes, feedbackRes] = await Promise.all([
        axios.get('/admin/overview-stats', { params: { range } }),
        axios.get('/admin/users'),
        axios.get('/admin/orders'),
        axios.get('/admin/feedback'),
      ]);

      if (statsRes.data.success) setStatsData(statsRes.data.data);
      if (usersRes.data.success) setUsersList(usersRes.data.data);
      if (ordersRes.data.success) setOrdersList(ordersRes.data.data);
      if (feedbackRes?.data?.success) {
        setFeedbackData(feedbackRes.data.data);
        if (feedbackRes.data.data.totalFeedbacks > 0) {
          try {
            const summaryRes = await axios.get('/admin/feedback/summary');
            setFeedbackSummary(summaryRes.data.data);
          } catch (summaryError) {
            console.error('Failed to load feedback summary:', summaryError);
            setFeedbackSummary(null);
          }
        } else {
          setFeedbackSummary(null);
        }
      }
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshFeedbackSummary = async () => {
    setGeneratingAi(true);
    try {
      const res = await axios.get('/admin/feedback/summary', { params: { refresh: true } });
      if (res.data.success) {
        setFeedbackSummary(res.data.data);
        addToast({
          type: 'success',
          title: 'Feedback Summary Refreshed',
          message: 'Feedback insights updated successfully.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'AI Summary Failed',
        message: err.response?.data?.error || 'Could not refresh the feedback summary.',
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionName || !provisionEmail || !provisionPassword) {
      addToast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please complete all required provisioning fields.',
      });
      return;
    }

    setIsProvisioning(true);
    try {
      const res = await axios.post('/admin/users', {
        name: provisionName.trim(),
        email: provisionEmail.trim(),
        password: provisionPassword,
        role: provisionRole,
        institutionId: provisionId.trim() || undefined,
      });

      if (res.data.success) {
        addToast({
          type: 'success',
          title: 'Account Provisioned',
          message: res.data.message,
        });
        setShowProvisionModal(false);
        setProvisionName('');
        setProvisionEmail('');
        setProvisionId('');
        loadAdminData();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Provisioning Failed',
        message: err.response?.data?.error || 'Could not provision account.',
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Signed out from Administration Console.',
    });
    navigate('/admin/login');
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.institutionId && u.institutionId.toLowerCase().includes(userSearchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 theme-surface">
      
      {/* Admin Executive Header */}
      <div className="relative overflow-hidden rounded-3xl theme-inverse-surface p-6 theme-nav-text shadow-xl sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full theme-gold-surface px-3 py-1 text-xs font-bold uppercase tracking-wider theme-primary-text">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Campus Dining Administration • Executive Level</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Administrator {user?.name || 'Officer'}
            </h1>
            <p className="max-w-xl text-xs theme-gold-text sm:text-sm">
              Canteen financial oversight, user credential provisioning, and real-time operational analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProvisionModal(true)}
              className="px-btn"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision User</span>
            </button>
            <button
              onClick={() => loadAdminData()}
              disabled={loading}
              className="px-btn h-11 w-11 p-0"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <select
              value={analyticsRange}
              onChange={(event) => {
                const range = event.target.value;
                if (range === 'today' || range === '7d' || range === '30d' || range === 'all') {
                  setAnalyticsRange(range);
                  void loadAdminData(range);
                }
              }}
              className="px-select rounded-xl theme-gold-surface px-3 py-2.5 text-xs font-bold theme-primary-text"
              aria-label="Analytics date range"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl theme-backdrop hover:theme-backdrop theme-nav-text transition flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Financial & Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="px-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl theme-gold-surface theme-primary-text flex items-center justify-center font-bold">
            <PixelIcon name="star" size={22} />
          </div>
          <div>
            <div className="px-stat-value text-2xl font-black theme-primary-text">
              ₹{(statsData?.financials?.revenue ?? 0).toLocaleString()}
            </div>
            <div className="px-label text-xs theme-primary-text font-medium">
              Revenue • {analyticsRange === 'today'
                ? 'Today'
                : analyticsRange === '7d'
                  ? 'Last 7 days'
                  : analyticsRange === '30d'
                    ? 'Last 30 days'
                    : 'All time'}
            </div>
          </div>
        </div>

        <div className="px-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl theme-secondary-surface theme-primary-text flex items-center justify-center font-bold">
            <PixelIcon name="cart" size={22} />
          </div>
          <div>
            <div className="px-stat-value text-2xl font-black theme-primary-text">
              {statsData?.operations?.totalOrders ?? 0}
            </div>
            <div className="px-label text-xs theme-primary-text font-medium">Orders Processed</div>
          </div>
        </div>

        <div className="px-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl theme-sky-surface theme-primary-text flex items-center justify-center font-bold">
            <PixelIcon name="heart" size={22} />
          </div>
          <div>
            <div className="px-stat-value text-2xl font-black theme-primary-text">
              {statsData?.userMetrics?.totalRegisteredUsers ?? usersList.length}
            </div>
            <div className="px-label text-xs theme-primary-text font-medium">Registered Accounts</div>
          </div>
        </div>

        <div className="px-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl theme-gold-surface theme-primary-text flex items-center justify-center font-bold">
            <PixelIcon name="clock" size={22} />
          </div>
          <div>
            <div className="px-stat-value text-2xl font-black theme-primary-text">
              {statsData?.operations?.averageFulfillmentMinutes ?? 0}m
            </div>
            <div className="px-label text-xs theme-primary-text font-medium">Avg Order Fulfillment</div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b theme-border pb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'overview'
              ? 'theme-inverse-surface theme-nav-text shadow-md'
              : 'theme-secondary-surface border theme-border theme-primary-text hover:theme-secondary-surface'
          }`}
        >
          Overview & Demand Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'users'
              ? 'theme-inverse-surface theme-nav-text shadow-md'
              : 'theme-secondary-surface border theme-border theme-primary-text hover:theme-secondary-surface'
          }`}
        >
          User Accounts Directory ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'orders'
              ? 'theme-inverse-surface theme-nav-text shadow-md'
              : 'theme-secondary-surface border theme-border theme-primary-text hover:theme-secondary-surface'
          }`}
        >
          Master Transaction Logs ({ordersList.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'feedback'
              ? 'theme-inverse-surface theme-nav-text shadow-md'
              : 'theme-secondary-surface border theme-border theme-primary-text hover:theme-secondary-surface'
          }`}
        >
          Student Feedback & AI Insights
        </button>
      </div>

      {/* Tab 1: Overview & Analytics */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Hourly Demand Breakdown */}
          <div className="px-card lg:col-span-2 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <div>
                <h3 className="text-base font-bold theme-primary-text">
                  Peak Dining Rush Demand (Hourly)
                </h3>
                <p className="text-xs theme-primary-text">
                  Orders placed from 8 AM to 4 PM across the selected date range.
                </p>
              </div>
              <span className="text-xs font-bold theme-primary-text">
                Peak: {statsData?.operations?.peakRushHour ?? 'No orders'}
              </span>
            </div>

            {(statsData?.hourlyDemand || []).length ? (
              <div className="grid grid-cols-9 gap-2 pt-6 items-end h-48 text-center text-xs">
                {(statsData?.hourlyDemand || []).map((item: any, idx: number, rows: any[]) => {
                const max = Math.max(...rows.map((row) => row.orders), 1);
                const heightPct = Math.min(100, Math.round((item.orders / max) * 100));
                const isPeak = item.orders > 0 && item.orders === max;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold theme-primary-text group-hover:theme-primary-text transition">
                      {item.orders}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isPeak
                          ? 'theme-gold-surface'
                          : 'theme-sky-surface group-hover:theme-inverse-surface'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-semibold theme-primary-text">{item.hour}</span>
                  </div>
                );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-3 text-sm theme-primary-text">
                <PixelIcon name="bowl" size={18} />
                <span>No hourly orders for this period.</span>
              </div>
            )}
          </div>

          {/* Top Selling Items */}
          <div className="px-card rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold theme-primary-text border-b theme-border pb-3">
              Top Selling Preorders
            </h3>

            <div className="space-y-3">
              {(statsData?.topSellingItems || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="px-card p-3 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold theme-primary-text">{item.name}</div>
                    <div className="text-[11px] theme-primary-text">{item.ordersCount} orders placed</div>
                  </div>
                  <div className="text-xs font-extrabold theme-primary-text">
                    ₹{item.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
              {!statsData?.topSellingItems?.length && (
                <div className="flex items-center gap-2 py-2 text-xs theme-primary-text"><PixelIcon name="bowl" size={16} /><span>No sales data for this period.</span></div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: User Directory */}
      {activeTab === 'users' && (
        <div className="px-card rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 theme-secondary-text" />
              <input
                type="text"
                placeholder="Search name, email, ID..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl theme-surface border theme-border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs overflow-x-auto w-full sm:w-auto">
              {['ALL', 'STUDENT', 'STAFF', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                    userRoleFilter === r
                      ? 'theme-inverse-surface theme-nav-text'
                      : 'theme-secondary-surface border theme-border theme-primary-text hover:theme-secondary-surface'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="px-label theme-inverse-surface theme-nav-text uppercase font-bold text-[10px]">
                <tr>
                  <th className="pb-3 px-3">User</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Campus / Staff ID</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:theme-gold-surface transition">
                    <td className="py-3.5 px-3">
                      <div className="font-bold theme-primary-text">{u.name}</div>
                      <div className="text-[11px] theme-secondary-text">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === 'ADMIN'
                            ? 'theme-sky-surface theme-primary-text'
                            : u.role === 'STAFF'
                            ? 'theme-gold-surface theme-primary-text'
                            : 'theme-secondary-surface theme-primary-text'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono theme-secondary-text">
                      {u.institutionId || '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 rounded-full theme-sky-surface px-2 py-0.5 theme-primary-text font-bold">
                        <span className="w-1.5 h-1.5 rounded-full theme-inverse-surface" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-3 theme-secondary-text">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length && (
                  <tr>
                    <td colSpan={5} className="py-4 px-3">
                      <div className="flex items-center justify-center gap-2 theme-primary-text"><PixelIcon name="bowl" size={16} /><span>No users match this search.</span></div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Master Orders Log */}
      {activeTab === 'orders' && (
        <div className="px-card rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold theme-primary-text border-b theme-border pb-3">
            Campus Master Preorder Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="px-label theme-inverse-surface theme-nav-text uppercase font-bold text-[10px]">
                <tr>
                  <th className="pb-3 px-3">Order #</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Items Summary</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Payment</th>
                  <th className="pb-3 px-3">Order Status</th>
                  <th className="pb-3 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium">
                {ordersList.map((ord) => (
                  <tr key={ord.id} className="hover:theme-gold-surface transition">
                    <td className="py-3.5 px-3 font-bold theme-primary-text">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold theme-primary-text">{ord.customerName}</div>
                      <div className="text-[10px] theme-secondary-text">{ord.customerRole}</div>
                    </td>
                    <td className="py-3.5 px-3 max-w-xs truncate theme-secondary-text">
                      {ord.items}
                    </td>
                    <td className="py-3.5 px-3 font-bold theme-primary-text">
                      ₹{ord.total}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded theme-secondary-surface font-mono text-[10px] font-bold">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-extrabold text-[10px] theme-sky-surface theme-primary-text">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 theme-secondary-text">{ord.time}</td>
                  </tr>
                ))}
                {!ordersList.length && (
                  <tr>
                    <td colSpan={7} className="py-4 px-3">
                      <div className="flex items-center justify-center gap-2 theme-primary-text"><PixelIcon name="bowl" size={16} /><span>No orders are available for this period.</span></div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Student Feedback & AI Insights */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {feedbackData?.totalFeedbacks > 0 && (
          <div className="px-card theme-gold-surface rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b theme-border pb-4">
              <div>
                <h3 className="text-base font-bold theme-primary-text flex items-center gap-2">
                  <PixelIcon name="star" size={18} />
                  <span>Feedback Summary</span>
                  {feedbackSummary?.source && (
                    <span className="px-label rounded-full theme-gold-surface px-2 py-1 text-[10px] font-extrabold uppercase theme-primary-text">
                      {feedbackSummary.source === 'ai' ? 'AI' : 'Rule-based'}
                    </span>
                  )}
                </h3>
                <p className="text-xs theme-secondary-text">
                  Aggregate themes, recurring complaints, and practical recommendations.
                </p>
              </div>
              <button
                onClick={handleRefreshFeedbackSummary}
                disabled={generatingAi}
                className="px-btn px-btn--sky disabled:opacity-100"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingAi ? 'animate-spin' : ''}`} />
                <span>{generatingAi ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>

            {feedbackSummary && (
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['Themes', feedbackSummary.themes],
                  ['Complaints', feedbackSummary.complaints],
                  ['Recommendations', feedbackSummary.recommendations],
                ].map(([title, entries]: any) => (
                  <div key={title} className="px-card p-4 rounded-2xl text-xs theme-primary-text">
                    <h4 className="px-label mb-2 font-extrabold">{title}</h4>
                    <ul className="list-disc space-y-1 pl-4 leading-relaxed">
                      {entries.map((entry: string, index: number) => <li key={`${title}-${index}`}>{entry}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          <div className="theme-secondary-surface border theme-border rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <h3 className="text-base font-bold theme-primary-text">
                Student Order Ratings & Reviews
              </h3>
              <span className="text-xs font-bold theme-primary-text">
                {feedbackData?.totalFeedbacks > 0
                  ? `Avg Rating: ⭐ ${feedbackData.averageRating} / 5.0 (${feedbackData.totalFeedbacks} reviews)`
                  : 'No ratings yet'}
              </span>
            </div>

            <div className="space-y-3">
              {feedbackData?.list && feedbackData.list.length > 0 ? (
                feedbackData.list.map((fb: any) => (
                  <div key={fb.id} className="p-4 rounded-2xl theme-surface border theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-bold theme-primary-text">
                        <span>{fb.studentName}</span>
                        <span className="theme-primary-text font-extrabold">⭐ {fb.rating}/5</span>
                        <span className="text-[10px] theme-secondary-text font-normal">Order #{fb.orderNumber}</span>
                      </div>
                      <p className="theme-secondary-text mt-1">{fb.comment || 'No text review provided.'}</p>
                    </div>
                    <div className="text-[10px] theme-secondary-text font-mono whitespace-nowrap">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 text-xs theme-primary-text">
                  <PixelIcon name="bowl" size={16} />
                  <span>No student feedback submissions recorded yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provisioning Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 theme-backdrop backdrop-blur-sm flex items-center justify-center p-4">
          <div className="px-card rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <h3 className="text-lg font-black theme-primary-text flex items-center gap-2">
                <UserPlus className="w-5 h-5 theme-primary-text" />
                <span>Provision User Account</span>
              </h3>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="theme-secondary-text hover:theme-primary-text text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="px-label font-bold theme-primary-text">Full Name *</label>
                <input
                  type="text"
                  required
                  value={provisionName}
                  onChange={(e) => setProvisionName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl theme-surface border theme-border focus:ring-2 focus:ring-[var(--color-focus)] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="px-label font-bold theme-primary-text">Email Address *</label>
                <input
                  type="email"
                  required
                  value={provisionEmail}
                  onChange={(e) => setProvisionEmail(e.target.value)}
                  placeholder="ramesh@canteen.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl theme-surface border theme-border focus:ring-2 focus:ring-[var(--color-focus)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="px-label font-bold theme-primary-text">Assigned Role *</label>
                  <select
                    value={provisionRole}
                    onChange={(e) => setProvisionRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl theme-surface border theme-border focus:ring-2 focus:ring-[var(--color-focus)] outline-none font-bold"
                  >
                    <option value="STAFF">STAFF (Kitchen)</option>
                    <option value="ADMIN">ADMIN (Manager)</option>
                    <option value="STUDENT">STUDENT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="px-label font-bold theme-primary-text">Staff / ID Code</label>
                  <input
                    type="text"
                    value={provisionId}
                    onChange={(e) => setProvisionId(e.target.value)}
                    placeholder="e.g. STF-KIT-02"
                    className="w-full px-3.5 py-2.5 rounded-xl theme-surface border theme-border focus:ring-2 focus:ring-[var(--color-focus)] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="px-label font-bold theme-primary-text">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={provisionPassword}
                  onChange={(e) => setProvisionPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl theme-surface border theme-border focus:ring-2 focus:ring-[var(--color-focus)] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2.5 rounded-xl theme-secondary-text font-bold hover:theme-secondary-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="px-btn disabled:opacity-100"
                >
                  {isProvisioning ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};