import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { SEO } from '../components/ui/SEO';
import { BrandLogo } from '../components/ui/BrandLogo';
import { BRAND_NAME, CONTACT_EMAIL_HREF } from '../config/brand';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminLogin = location.pathname === '/admin/login';
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const loginState = location.state as {
    accountCreated?: boolean;
    message?: string;
    from?: { pathname?: string; search?: string; hash?: string };
  } | null;
  const signupNotice = loginState;

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password, isAdminLogin ? 'ADMIN' : 'STUDENT');
      const requestedEnrollment = !isAdminLogin && user.role === 'STUDENT' &&
        loginState?.from?.pathname === '/student/enroll'
        ? {
            pathname: loginState.from.pathname,
            search: loginState.from.search || '',
            hash: loginState.from.hash || '',
          }
        : null;
      navigate(
        user.role === 'ADMIN' ? '/admin/dashboard' : requestedEnrollment || '/student/dashboard',
        { replace: true },
      );
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Sign-in failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title={`${isAdminLogin ? 'Administrator' : 'Student'} Sign In — ${BRAND_NAME}`}
        description={isAdminLogin ? 'Secure administrator sign-in.' : 'Sign in to your Kinetiq Academi student account.'}
        noindex
      />
      <main className="flex min-h-[82vh] items-center justify-center bg-gradient-to-b from-blue-50/60 via-gray-50/70 to-white px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <header className="mb-7 text-center">
            <Link to="/" aria-label={`${BRAND_NAME} home`} className="mb-4 inline-flex rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00245C] focus:ring-offset-4">
              <BrandLogo className="h-auto w-[154px]" loading="eager" />
            </Link>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">GATE preparation, with purpose</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#00245C] sm:text-3xl">
              {isAdminLogin ? 'Administrator Sign In' : 'Student Sign In'}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">
              {isAdminLogin
                ? 'Sign in to manage academy courses, students, and payments.'
                : 'Sign in to continue your learning with Kinetiq Academi.'}
            </p>
          </header>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_54px_-30px_rgba(0,36,92,0.3)] sm:p-8">
            {signupNotice?.accountCreated && (
              <p role="status" className="mb-5 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{signupNotice.message || 'Account created successfully. Please sign in to continue.'}</span>
              </p>
            )}
            {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

            <form onSubmit={(event) => void submitLogin(event)} className="space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">
                  {isAdminLogin ? 'Administrator email or account ID' : 'Email Address'}
                </span>
                <input
                  type={isAdminLogin ? 'text' : 'email'}
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={isAdminLogin ? undefined : 'you@example.com'}
                  className="input-field text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Password</span>
                <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="input-field text-sm" />
              </label>
              {!isAdminLogin && (
                <div className="text-right">
                  <a href={`${CONTACT_EMAIL_HREF}?subject=Student%20password%20assistance`} className="text-xs font-semibold text-[#00245C] hover:underline">
                    Forgot Password?
                  </a>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full gap-2 text-sm disabled:opacity-60">
                {loading ? 'Signing in…' : isAdminLogin ? 'Admin Sign In' : 'Sign In'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
              {isAdminLogin ? (
                <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-[#00245C] hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Return to website</Link>
              ) : (
                <p className="border-t border-gray-100 pt-4 text-center text-xs text-gray-600">
                  Don&apos;t have an account? <Link to="/signup" className="font-semibold text-[#00245C] hover:underline">Create Account</Link>
                </p>
              )}
            </form>
          </section>

          <footer className="mt-5 flex items-center justify-center gap-2 text-[11px] text-gray-500"><LockKeyhole className="h-3.5 w-3.5" /><span>Secure sign-in · Your account details stay protected</span></footer>
        </div>
      </main>
    </>
  );
};
