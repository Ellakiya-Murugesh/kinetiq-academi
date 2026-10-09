import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BRAND_NAME } from '../../config/brand';
import { BrandLogo } from '../ui/BrandLogo';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  FolderDown,
  FileQuestion,
  Award,
  CreditCard,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = `${BRAND_NAME} | Student Portal`;
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Course', path: '/student/course', icon: BookOpen },
    { name: 'Live Sessions', path: '/student/live-sessions', icon: Video },
    { name: 'Materials', path: '/student/materials', icon: FolderDown },
    { name: 'Tests', path: '/student/tests', icon: FileQuestion },
    { name: 'Results', path: '/student/results', icon: Award },
    { name: 'Payments', path: '/student/payments', icon: CreditCard },
    { name: 'Announcements', path: '/student/announcements', icon: Bell },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row text-navy-500 font-sans">
      {/* Mobile Header Bar */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:text-navy-500"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <BrandLogo className="w-[78px] h-auto" />
            <span className="font-extrabold text-sm text-navy-500">
              Student LMS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            target="_blank"
            className="text-xs text-primary-600 flex items-center gap-1 font-semibold"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-64'
        }`}
      >
        <div>
          {/* Header Brand */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <Link to="/student/dashboard" className="flex items-center gap-2.5 min-w-0">
              <BrandLogo className="w-[104px] h-auto shrink-0" />
              <div className="flex flex-col">
                <span className="font-black text-sm text-navy-500 tracking-tight">
                  {BRAND_NAME}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600">
                  Student Learning Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-navy-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
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
                        ? 'bg-primary-50 text-primary-600 font-bold border border-primary-200 shadow-sm'
                        : 'text-gray-600 hover:text-navy-500 hover:bg-gray-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 text-primary-500" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 text-gray-400" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Student Profile Summary */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/70">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 font-black text-xs flex items-center justify-center shrink-0 border border-primary-200">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-navy-500 truncate">
                  {user?.name || 'Enrolled Student'}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {user?.email || 'student@gateprep.com'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
            <Link
              to="/"
              target="_blank"
              className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3 h-3 text-primary-500" />
            </Link>
            <button
              onClick={handleLogout}
              className="py-1.5 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-8 py-3.5 items-center justify-between sticky top-0 z-30 shadow-sm">
          {/* Left Greeting & Cohort Chip */}
          <div className="flex items-center gap-4">
            <Link to="/student/dashboard" aria-label={`${BRAND_NAME} student dashboard`}>
              <BrandLogo className="w-[92px] h-auto" />
            </Link>
            <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-navy-500">
              Welcome back, <strong className="text-primary-600">{user?.name || 'Aspirant'}</strong>!
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 font-extrabold text-xs border border-primary-200">
              100-Day Flagship Cohort
            </span>
            </div>
          </div>

          {/* Right Action Shortcuts */}
          <div className="flex items-center gap-4">
            <Link
              to="/student/live-sessions"
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Today&apos;s Class</span>
            </Link>

            <Link
              to="/"
              target="_blank"
              className="text-xs font-semibold text-gray-600 hover:text-primary-600 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-200">
                ST
              </div>
              <div className="text-left text-xs">
                <span className="block font-bold text-navy-500">Student Account</span>
                <span className="block text-[10px] text-emerald-600 font-semibold">Active Enrolled</span>
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

export default StudentLayout;
