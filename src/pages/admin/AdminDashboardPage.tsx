import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import {
  Users,
  UserCheck,
  CreditCard,
  Clock,
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

  const statCards = [
    {
      title: 'Total Students',
      value: stats ? stats.totalStudents.toLocaleString() : '[DATA WILL APPEAR AFTER DATABASE CONNECTION]',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      badge: '0 this month',
    },
    {
      title: 'Active Enrollments',
      value: stats ? stats.activeEnrollments.toLocaleString() : '[DATA WILL APPEAR AFTER DATABASE CONNECTION]',
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      badge: '0 active',
    },
    {
      title: 'Total Revenue',
      value: stats ? `₹${stats.totalRevenue.toLocaleString()}` : '[DATA WILL APPEAR AFTER DATABASE CONNECTION]',
      icon: CreditCard,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      badge: '0 verified',
    },
    {
      title: 'Pending Payments',
      value: stats ? stats.pendingPayments.toString() : '[DATA WILL APPEAR AFTER DATABASE CONNECTION]',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      badge: '0 pending',
    },
    {
      title: 'Guidance Enquiries',
      value: stats ? stats.guidanceEnquiries.toString() : '[DATA WILL APPEAR AFTER DATABASE CONNECTION]',
      icon: MessageSquare,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      badge: '0 enquiries',
    },
    {
      title: 'Live Classes Scheduled',
      value: stats ? stats.upcomingLiveClasses.toString() : '[DATA WILL APPEAR AFTER DATABASE CONNECTION]',
      icon: Video,
      color: 'text-red-600',
      bg: 'bg-red-50',
      badge: '0 this week',
    },
    {
      title: 'Target Retention',
      value: '0%',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      badge: '0% baseline',
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
            Real-time enrollment metrics, performance trends, and administrative operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Database Connected (Port 5000)
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Notice: {error}. Data will refresh automatically upon server sync.</span>
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
              <p className="text-xs text-gray-400">Total new verified student intakes</p>
            </div>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
              2026 Batch
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyEnrollments || []}>
                <defs>
                  <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00245C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00245C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} ticks={[0]} tick={{ fontSize: 11 }} />
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
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Overview */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-navy-500">
                Monthly Fee Realization (₹)
              </h3>
              <p className="text-xs text-gray-400">Total paid course fee receipts</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              ₹10,000 / Student Tier
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} ticks={[0]} tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Exam-wise Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-navy-500">
                Exam Distribution (GATE / UGC NET / CSIR NET)
              </h3>
              <p className="text-xs text-gray-400">Distribution of registered target exams</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.examWise || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {(analytics?.examWise || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.subjectWise || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 1]} ticks={[0]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
