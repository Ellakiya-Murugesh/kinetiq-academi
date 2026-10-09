import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../ui/BrandLogo';
import { BRAND_TAGLINE } from '../../config/brand';
import { SEO } from '../ui/SEO';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isAdmin = allowedRoles.includes('ADMIN');
  const privatePageName = location.pathname
    .split('/')
    .filter(Boolean)
    .slice(1)
    .map((segment) => segment.replace(/-/g, ' '))
    .join(' — ');
  const privateTitle = `${isAdmin ? 'Admin' : 'Student'} Portal${privatePageName ? ` — ${privatePageName}` : ''}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <BrandLogo className="w-[112px] h-auto mb-5" />
        <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin mb-4" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {BRAND_TAGLINE}
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={allowedRoles.includes('ADMIN') ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  }

  // Role verification check
  if (!allowedRoles.includes(user.role)) {
    // If student attempted to access admin
    if (user.role === 'STUDENT') {
      return <Navigate to="/student/dashboard" replace />;
    }
    // If admin attempted to access student
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="card max-w-md p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-navy-500">
            Access Unauthorized
          </h2>
          <p className="text-sm text-gray-600">
            Your current account role (<strong>{user.role}</strong>) does not have authorization to view this secure portal.
          </p>
          <div className="pt-2">
            <Link to="/" className="btn-secondary text-xs px-5 py-2.5 inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={privateTitle}
        description={`Secure ${isAdmin ? 'administrator' : 'student'} portal for ${isAdmin ? 'managing' : 'accessing'} Kinetiq Academi services.`}
        noindex
      />
      {children}
    </>
  );
};
