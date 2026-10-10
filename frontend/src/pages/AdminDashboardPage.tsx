import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Clock,
  UserPlus,
  RefreshCw,
  LogOut,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-cream">
      
      {/* Admin Executive Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slateblue via-slate to-indigo-950 p-6 sm:p-8 text-cream shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-cream/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slateblue/20 backdrop-blur-md text-slateblue text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Campus Dining Administration • Executive Level</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Administrator {user?.name || 'Officer'}
            </h1>
            <p className="text-dusty text-xs sm:text-sm max-w-xl">
              Canteen financial oversight, user credential provisioning, and real-time operational analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProvisionModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slateblue hover:bg-slateblue-light text-cream font-bold text-xs transition flex items-center gap-2 shadow-md"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision User</span>
            </button>
            <button
              onClick={() => loadAdminData()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-cream/10 hover:bg-cream/20 text-cream transition flex items-center justify-center backdrop-blur-md"
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
              className="px-3 py-2.5 rounded-xl bg-sand border border-line text-slateblue text-xs font-bold"
              aria-label="Analytics date range"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-black/30 hover:bg-black/50 text-cream transition flex items-center justify-center"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Financial & Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-sand border border-line shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              ₹{(statsData?.financials?.revenue ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-navy/75 font-medium">
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

        <div className="p-5 rounded-2xl bg-sand border border-line shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slateblue/10 text-slateblue flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              {statsData?.operations?.totalOrders ?? 0}
            </div>
            <div className="text-xs text-navy/75 font-medium">Orders Processed</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-sand border border-line shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              {statsData?.userMetrics?.totalRegisteredUsers ?? usersList.length}
            </div>
            <div className="text-xs text-navy/75 font-medium">Registered Accounts</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-sand border border-line shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slateblue">
              {statsData?.operations?.averageFulfillmentMinutes ?? 0}m
            </div>
            <div className="text-xs text-navy/75 font-medium">Avg Order Fulfillment</div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-line pb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'overview'
              ? 'bg-slateblue text-cream shadow-md'
              : 'bg-sand border border-line text-slateblue hover:bg-sand/50'
          }`}
        >
          Overview & Demand Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'users'
              ? 'bg-slateblue text-cream shadow-md'
              : 'bg-sand border border-line text-slateblue hover:bg-sand/50'
          }`}
        >
          User Accounts Directory ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'orders'
              ? 'bg-slateblue text-cream shadow-md'
              : 'bg-sand border border-line text-slateblue hover:bg-sand/50'
          }`}
        >
          Master Transaction Logs ({ordersList.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'feedback'
              ? 'bg-slateblue text-cream shadow-md'
              : 'bg-sand border border-line text-slateblue hover:bg-sand/50'
          }`}
        >
          Student Feedback & AI Insights
        </button>
      </div>

      {/* Tab 1: Overview & Analytics */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Hourly Demand Breakdown */}
          <div className="lg:col-span-2 bg-sand border border-line rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold text-slateblue">
                  Peak Dining Rush Demand (Hourly)
                </h3>
                <p className="text-xs text-dusty">
                  Orders placed from 8 AM to 4 PM across the selected date range.
                </p>
              </div>
              <span className="text-xs font-bold text-slateblue">
                Peak: {statsData?.operations?.peakRushHour ?? 'No orders'}
              </span>
            </div>

            <div className="grid grid-cols-9 gap-2 pt-6 items-end h-48 text-center text-xs">
              {(statsData?.hourlyDemand || []).map((item: any, idx: number, rows: any[]) => {
                const max = Math.max(...rows.map((row) => row.orders), 1);
                const heightPct = Math.min(100, Math.round((item.orders / max) * 100));
                const isPeak = item.orders > 0 && item.orders === max;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-dusty group-hover:text-slateblue transition">
                      {item.orders}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isPeak
                          ? 'bg-gradient-to-t from-slateblue to-slate'
                          : 'bg-sand/50 dark:bg-slateblue group-hover:bg-slateblue'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-semibold text-dusty">{item.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-sand border border-line rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slateblue border-b border-line pb-3">
              Top Selling Preorders
            </h3>

            <div className="space-y-3">
              {(statsData?.topSellingItems || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-cream border border-line flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slateblue">{item.name}</div>
                    <div className="text-[11px] text-dusty">{item.ordersCount} orders placed</div>
                  </div>
                  <div className="text-xs font-extrabold text-slateblue">
                    ₹{item.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
              {!statsData?.topSellingItems?.length && (
                <div className="p-3 text-xs text-dusty">No sales data for this period.</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: User Directory */}
      {activeTab === 'users' && (
        <div className="bg-sand border border-line rounded-3xl p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dusty" />
              <input
                type="text"
                placeholder="Search name, email, ID..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-cream border border-line text-xs focus:outline-none focus:ring-2 focus:ring-slateblue/50"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs overflow-x-auto w-full sm:w-auto">
              {['ALL', 'STUDENT', 'STAFF', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                    userRoleFilter === r
                      ? 'bg-slateblue text-cream'
                      : 'bg-sand border border-line text-slateblue hover:bg-sand/50'
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
              <thead className="border-b border-line text-dusty uppercase font-bold text-[10px]">
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
                  <tr key={u.id} className="hover:bg-sand/50 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slateblue">{u.name}</div>
                      <div className="text-[11px] text-dusty">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-700'
                            : u.role === 'STAFF'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-slateblue/10 text-slateblue'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-dusty">
                      {u.institutionId || '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-dusty">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Master Orders Log */}
      {activeTab === 'orders' && (
        <div className="bg-sand border border-line rounded-3xl p-6 shadow-md space-y-4">
          <h3 className="text-base font-bold text-slateblue border-b border-line pb-3">
            Campus Master Preorder Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-dusty uppercase font-bold text-[10px]">
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
                  <tr key={ord.id} className="hover:bg-cream/50 transition">
                    <td className="py-3.5 px-3 font-bold text-slateblue">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slateblue">{ord.customerName}</div>
                      <div className="text-[10px] text-dusty">{ord.customerRole}</div>
                    </td>
                    <td className="py-3.5 px-3 max-w-xs truncate text-dusty">
                      {ord.items}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slateblue">
                      ₹{ord.total}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-sand/50 font-mono text-[10px] font-bold">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-extrabold text-[10px] bg-emerald-500/10 text-emerald-700">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-dusty">{ord.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Student Feedback & AI Insights */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {feedbackData?.totalFeedbacks > 0 && (
          <div className="bg-sand border border-line rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <h3 className="text-base font-bold text-slateblue flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Feedback Summary</span>
                  {feedbackSummary?.source && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-extrabold uppercase text-amber-800">
                      {feedbackSummary.source === 'ai' ? 'AI' : 'Rule-based'}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-dusty">
                  Aggregate themes, recurring complaints, and practical recommendations.
                </p>
              </div>
              <button
                onClick={handleRefreshFeedbackSummary}
                disabled={generatingAi}
                className="px-4 py-2 rounded-xl bg-slateblue hover:bg-slateblue-light text-cream font-bold text-xs shadow-md flex items-center gap-2 transition disabled:opacity-50"
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
                  <div key={title} className="p-4 rounded-2xl bg-cream border border-amber-500/30 text-xs text-slateblue shadow-inner">
                    <h4 className="mb-2 font-extrabold">{title}</h4>
                    <ul className="list-disc space-y-1 pl-4 leading-relaxed">
                      {entries.map((entry: string, index: number) => <li key={`${title}-${index}`}>{entry}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          <div className="bg-sand border border-line rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-slateblue">
                Student Order Ratings & Reviews
              </h3>
              <span className="text-xs font-bold text-slateblue">
                {feedbackData?.totalFeedbacks > 0
                  ? `Avg Rating: ⭐ ${feedbackData.averageRating} / 5.0 (${feedbackData.totalFeedbacks} reviews)`
                  : 'No ratings yet'}
              </span>
            </div>

            <div className="space-y-3">
              {feedbackData?.list && feedbackData.list.length > 0 ? (
                feedbackData.list.map((fb: any) => (
                  <div key={fb.id} className="p-4 rounded-2xl bg-cream border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-slateblue">
                        <span>{fb.studentName}</span>
                        <span className="text-amber-500 font-extrabold">⭐ {fb.rating}/5</span>
                        <span className="text-[10px] text-dusty font-normal">Order #{fb.orderNumber}</span>
                      </div>
                      <p className="text-dusty mt-1">{fb.comment || 'No text review provided.'}</p>
                    </div>
                    <div className="text-[10px] text-dusty font-mono whitespace-nowrap">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-navy/75">
                  No student feedback submissions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provisioning Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-slateblue/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-sand rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-line space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-lg font-black text-slateblue flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-slateblue" />
                <span>Provision User Account</span>
              </h3>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="text-dusty hover:text-slateblue text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slateblue">Full Name *</label>
                <input
                  type="text"
                  required
                  value={provisionName}
                  onChange={(e) => setProvisionName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream border border-line focus:ring-2 focus:ring-slateblue/50 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slateblue">Email Address *</label>
                <input
                  type="email"
                  required
                  value={provisionEmail}
                  onChange={(e) => setProvisionEmail(e.target.value)}
                  placeholder="ramesh@canteen.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream border border-line focus:ring-2 focus:ring-slateblue/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slateblue">Assigned Role *</label>
                  <select
                    value={provisionRole}
                    onChange={(e) => setProvisionRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cream border border-line focus:ring-2 focus:ring-slateblue/50 outline-none font-bold"
                  >
                    <option value="STAFF">STAFF (Kitchen)</option>
                    <option value="ADMIN">ADMIN (Manager)</option>
                    <option value="STUDENT">STUDENT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slateblue">Staff / ID Code</label>
                  <input
                    type="text"
                    value={provisionId}
                    onChange={(e) => setProvisionId(e.target.value)}
                    placeholder="e.g. STF-KIT-02"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cream border border-line focus:ring-2 focus:ring-slateblue/50 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slateblue">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={provisionPassword}
                  onChange={(e) => setProvisionPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream border border-line focus:ring-2 focus:ring-slateblue/50 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2.5 rounded-xl text-dusty font-bold hover:bg-sand/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="px-5 py-2.5 rounded-xl bg-slateblue hover:bg-slateblue-light text-cream font-bold shadow-md disabled:opacity-50"
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