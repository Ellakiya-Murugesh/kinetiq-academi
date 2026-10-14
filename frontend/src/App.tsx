import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { Home } from 'lucide-react';
import { BrandLogo } from './components/ui/BrandLogo';
import { BRAND_NAME, BRAND_TAGLINE } from './config/brand';

// Public pages
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ExamsPage = lazy(() => import('./pages/ExamsPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const MaterialsPage = lazy(() => import('./pages/MaterialsPage'));
const LiveSessionsPage = lazy(() => import('./pages/LiveSessionsPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const StudentSignupPage = lazy(() =>
  import('./pages/StudentSignupPage').then(({ StudentSignupPage }) => ({ default: StudentSignupPage }))
);
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const RefundPage = lazy(() => import('./pages/RefundPage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminStudentsPage = lazy(() => import('./pages/admin/AdminStudentsPage'));
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'));
const AdminEnrollmentsPage = lazy(() => import('./pages/admin/AdminEnrollmentsPage'));
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage'));
const AdminLiveSessionsPage = lazy(() => import('./pages/admin/AdminLiveSessionsPage'));
const AdminMaterialsPage = lazy(() => import('./pages/admin/AdminMaterialsPage'));
const AdminTestsPage = lazy(() => import('./pages/admin/AdminTestsPage'));
const AdminResultsPage = lazy(() => import('./pages/admin/AdminResultsPage'));
const AdminRefundsPage = lazy(() => import('./pages/admin/AdminRefundsPage'));
const AdminEnquiriesPage = lazy(() => import('./pages/admin/AdminEnquiriesPage'));
const AdminAnnouncementsPage = lazy(() => import('./pages/admin/AdminAnnouncementsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));

// Student pages
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage'));
const StudentCoursePage = lazy(() => import('./pages/student/StudentCoursePage'));
const StudentLiveSessionsPage = lazy(() => import('./pages/student/StudentLiveSessionsPage'));
const StudentMaterialsPage = lazy(() => import('./pages/student/StudentMaterialsPage'));
const StudentTestsPage = lazy(() => import('./pages/student/StudentTestsPage'));
const StudentResultsPage = lazy(() => import('./pages/student/StudentResultsPage'));
const StudentPaymentsPage = lazy(() => import('./pages/student/StudentPaymentsPage'));
const StudentAnnouncementsPage = lazy(() => import('./pages/student/StudentAnnouncementsPage'));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage'));
const StudentEnrollmentPage = lazy(() => import('./pages/student/StudentEnrollmentPage'));
const StudentPaymentPage = lazy(() => import('./pages/student/StudentPaymentPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminCreateAccountPage = lazy(() => import('./pages/AdminCreateAccountPage'));
const AdminForgotPasswordPage = lazy(() => import('./pages/AdminForgotPasswordPage'));
const AdminResetPasswordPage = lazy(() => import('./pages/AdminResetPasswordPage'));

// Fallback Loading Spinner
const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
    <BrandLogo className="h-20 w-16 object-contain" />
    <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      {BRAND_TAGLINE}
    </p>
  </div>
);

// 404 Not Found Page
const NotFoundPage: React.FC = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
    <BrandLogo className="mb-5 h-24 w-[76px] object-contain" />
    <span className="text-6xl font-black text-primary-500 mb-2">404</span>
    <h1 className="text-3xl font-extrabold text-navy-500 mb-3">
      Page Not Found
    </h1>
    <p className="text-sm text-gray-600 max-w-md mb-8">
      The academic resource, examination track, or page you requested could not be located.
    </p>
    <Link to="/" className="btn-primary text-sm">
      <Home className="w-4 h-4" />
      <span>Return to {BRAND_NAME}</span>
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ======================================================== */}
              {/* PUBLIC WEBSITE ROUTES — Fully Preserved                   */}
              {/* ======================================================== */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="exams" element={<ExamsPage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="materials" element={<MaterialsPage />} />
                <Route path="live-sessions" element={<LiveSessionsPage />} />
                <Route path="payment" element={<PaymentPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="student/login" element={<LoginPage />} />
                <Route path="signup" element={<StudentSignupPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="refund" element={<RefundPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
              <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
              <Route path="/admin/create-account" element={<AdminCreateAccountPage />} />

              {/* ======================================================== */}
              {/* ADMIN DASHBOARD ROUTES — Protected for ADMIN role        */}
              {/* ======================================================== */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="courses" element={<AdminCoursesPage />} />
                <Route path="enrollments" element={<AdminEnrollmentsPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="live-sessions" element={<AdminLiveSessionsPage />} />
                <Route path="materials" element={<AdminMaterialsPage />} />
                <Route path="tests" element={<AdminTestsPage />} />
                <Route path="results" element={<AdminResultsPage />} />
                <Route path="refunds" element={<AdminRefundsPage />} />
                <Route path="enquiries" element={<AdminEnquiriesPage />} />
                <Route path="announcements" element={<AdminAnnouncementsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* ======================================================== */}
              {/* STUDENT DASHBOARD ROUTES — Protected for STUDENT role    */}
              {/* ======================================================== */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/student/dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboardPage />} />
                <Route path="course" element={<StudentCoursePage />} />
                <Route path="live-sessions" element={<StudentLiveSessionsPage />} />
                <Route path="materials" element={<StudentMaterialsPage />} />
                <Route path="tests" element={<StudentTestsPage />} />
                <Route path="results" element={<StudentResultsPage />} />
                <Route path="payments" element={<StudentPaymentsPage />} />
                <Route path="enroll" element={<StudentEnrollmentPage />} />
                <Route path="payment/:paymentId" element={<StudentPaymentPage />} />
                <Route path="announcements" element={<StudentAnnouncementsPage />} />
                <Route path="profile" element={<StudentProfilePage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
