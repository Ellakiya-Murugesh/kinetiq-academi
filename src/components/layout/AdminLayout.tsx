import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BRAND_NAME } from '../../config/brand';
import { BrandLogo } from '../ui/BrandLogo';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  CreditCard,
  Video,
  FolderDown,
  FileQuestion,
  Award,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    document.title = `${BRAND_NAME} | Admin Portal`;
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Courses', path: '/admin/courses', icon: BookOpen },
    { name: 'Enrollments', path: '/admin/enrollments', icon: UserCheck },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Live Sessions', path: '/admin/live-sessions', icon: Video },
    { name: 'Materials', path: '/admin/materials', icon: FolderDown },
    { name: 'Tests', path: '/admin/tests', icon: FileQuestion },
    { name: 'Results', path: '/admin/results', icon: Award },
    { name: 'Enquiries', path: '/admin/enquiries', icon: MessageSquare },
    { name: 'Announcements', path: '/admin/announcements', icon: Bell },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row text-navy-500 font-sans">
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-navy-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-navy-800 text-gray-300 hover:text-white"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <BrandLogo className="w-[82px] h-auto rounded-sm" />
            <span className="font-extrabold text-sm tracking-tight text-white">
              Admin Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            target="_blank"
            className="text-xs text-primary-300 hover:text-white flex items-center gap-1"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-navy-800 text-red-400 hover:bg-navy-700"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 text-gray-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-64'
        }`}
      >
        <div>
          {/* Brand & App Title */}
          <div className="p-5 border-b border-navy-800 flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
              <span className="bg-white rounded-md p-1 shrink-0">
                <BrandLogo className="w-[104px] h-auto" />
              </span>
              <div className="flex flex-col">
                <span className="font-black text-sm text-white tracking-tight">
                  {BRAND_NAME}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-400">
                  Admin Administration
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20 font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-navy-800'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Current Admin Details */}
        <div className="p-4 border-t border-navy-800 bg-navy-950/60">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-600/30 text-primary-400 border border-primary-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                AD
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {user?.email || 'admin@gateprep.com'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-navy-800/80">
            <Link
              to="/"
              target="_blank"
              className="flex-1 py-1.5 px-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-gray-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={handleLogout}
              className="py-1.5 px-2.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-8 py-3.5 items-center justify-between sticky top-0 z-30 shadow-sm">
          {/* Quick Search */}
          <div className="flex items-center gap-6">
            <Link to="/admin/dashboard" aria-label={`${BRAND_NAME} admin dashboard`}>
              <BrandLogo className="w-[92px] h-auto" />
            </Link>
            <div className="relative w-80 xl:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students, courses, enrollments or payments..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-navy-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
            />
            </div>
          </div>

          {/* Top Right Utilities */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              className="text-xs font-semibold text-gray-600 hover:text-primary-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary-500" />
              <span>View Public Website</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-gray-500 hover:text-navy-500 hover:bg-gray-100 relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 animate-pulse" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy-500">
                      System Notifications
                    </span>
                    <span className="text-[10px] text-primary-600 font-semibold cursor-pointer">
                      Mark all read
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <p className="font-bold text-navy-500">New Student Enrolled</p>
                      <p className="text-[11px] text-gray-500">Rahul Verma paid ₹10,000 for GATE Physics.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Badge */}
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-xl bg-primary-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                AD
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-navy-500 leading-tight">
                  {user?.name || 'Academic Director'}
                </span>
                <span className="block text-[10px] text-emerald-600 font-semibold">
                  Admin Verified
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
