import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Users,
  UserCheck,
  CreditCard,
  Clock,
  RefreshCcw,
  MessageSquare,
  Video,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiRequest('/api/admin/dashboard');
        setData(res);
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
        setError(err.message || 'Error communicating with database');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const analytics = data?.analytics;
  const requiredStatKeys = [
    'totalStudents',
    'activeStudents',
    'activeEnrollments',
    'totalRevenue',
    'verifiedPayments',
    'pendingPayments',
    'refundRequests',
    'guidanceEnquiries',
    'upcomingLiveClasses',
    'onTrackStudents',
    'onTrackPercentage',
  ];
  const dashboardAvailable = Boolean(
    stats &&
    analytics &&
    requiredStatKeys.every((key) => Number.isFinite(Number(stats[key]))) &&
    Array.isArray(analytics.monthlyEnrollments) &&
    Array.isArray(analytics.monthlyRevenue) &&
    Array.isArray(analytics.examWise) &&
    Array.isArray(analytics.subjectWise)
  );
  const hasEnrollmentActivity = analytics?.monthlyEnrollments?.some((entry: any) => Number(entry.enrollments) > 0);
  const hasRevenueActivity = analytics?.monthlyRevenue?.some((entry: any) => Number(entry.revenue) > 0);
  const hasExamRecords = analytics?.examWise?.some((entry: any) => Number(entry.count) > 0);
  const hasSubjectRecords = analytics?.subjectWise?.some((entry: any) => Number(entry.count) > 0);

  const statCards = [
    {
      title: 'Total Students',
      value: dashboardAvailable ? Number(stats.totalStudents).toLocaleString() : '—',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      badge: dashboardAvailable ? `${Number(stats.activeStudents).toLocaleString()} active` : '—',
    },
    {
      title: 'Active Enrollments',
      value: dashboardAvailable ? Number(stats.activeEnrollments).toLocaleString() : '—',
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      badge: 'Verified',
    },
    {
      title: 'Total Revenue',
      value: dashboardAvailable ? `₹${Number(stats.totalRevenue).toLocaleString()}` : '—',
      icon: CreditCard,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      badge: dashboardAvailable ? `${Number(stats.verifiedPayments).toLocaleString()} verified payments` : '—',
    },
    {
      title: 'Pending Payments',
      value: dashboardAvailable ? String(stats.pendingPayments) : '—',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      badge: 'Awaiting review',
    },
    {
      title: 'Refund Requests',
      value: dashboardAvailable ? String(stats.refundRequests) : '—',
      icon: RefreshCcw,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      badge: 'Open requests',
    },
    {
      title: 'Guidance Enquiries',
      value: dashboardAvailable ? String(stats.guidanceEnquiries) : '—',
      icon: MessageSquare,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      badge: 'Awaiting follow-up',
    },
    {
      title: 'Live Classes Scheduled',
      value: dashboardAvailable ? String(stats.upcomingLiveClasses) : '—',
      icon: Video,
      color: 'text-red-600',
      bg: 'bg-red-50',
      badge: 'Upcoming',
    },
    {
      title: 'Students On Track',
      value: dashboardAvailable ? `${stats.onTrackPercentage}%` : '—',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      badge: dashboardAvailable ? `${Number(stats.onTrackStudents).toLocaleString()} students at 60%+` : '—',
    },
  ];

  const PIE_COLORS = ['#00245C', '#10B981', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-500">
            System Overview &amp; Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Current enrollment metrics, performance trends, and administrative operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dashboardAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            dashboardAvailable
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-amber-800 bg-amber-50 border-amber-200'
          }`}>
            {dashboardAvailable ? 'Database Connected' : 'Database Unavailable'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Notice: {error}. Refresh the page after the API becomes available.</span>
        </div>
      )}

      {/* 8 Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {card.title}
                </span>
                <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-navy-500 tracking-tight">
                  {card.value}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                  {card.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Monthly Enrollments */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-navy-500">
                Monthly Enrollment Trajectory
              </h3>
              <p className="text-xs text-gray-400">Recorded enrollments by month</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {!dashboardAvailable ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">Enrollment analytics unavailable.</div>
            ) : !hasEnrollmentActivity ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No enrollment activity recorded.</div>
            ) : <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyEnrollments}>
                <defs>
                  <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00245C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00245C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#00245C"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#enrollmentGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>}
          </div>
        </div>

        {/* Chart 2: Revenue Overview */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-navy-500">
                Monthly Fee Realization (₹)
              </h3>
              <p className="text-xs text-gray-400">Recorded paid course fees by month</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {!dashboardAvailable ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">Revenue analytics unavailable.</div>
            ) : !hasRevenueActivity ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No paid revenue recorded.</div>
            ) : <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${Number(v).toLocaleString()}`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>}
          </div>
        </div>

        {/* Chart 3: Exam-wise Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-navy-500">
                Exam Distribution
              </h3>
              <p className="text-xs text-gray-400">Distribution of registered target exams</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {!dashboardAvailable ? (
              <p className="text-sm text-gray-500">Exam analytics unavailable.</p>
            ) : !hasExamRecords ? (
              <p className="text-sm text-gray-500">No student exam records.</p>
            ) : <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.examWise}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {analytics.examWise.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>}
          </div>
        </div>

        {/* Chart 4: Subject-wise Split */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-navy-500">
                Subject Split (Chemistry vs Physics)
              </h3>
              <p className="text-xs text-gray-400">Specialization preference across cohorts</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {!dashboardAvailable ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">Subject analytics unavailable.</div>
            ) : !hasSubjectRecords ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">No student subject records.</div>
            ) : <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.subjectWise} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
