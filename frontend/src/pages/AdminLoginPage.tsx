import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';
import { SEO } from '../components/ui/SEO';
import { BRAND_NAME } from '../config/brand';
import { useAuth } from '../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const needsApprovalLogin = returnPath === '/admin/create-account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password, 'ADMIN');
      navigate(returnPath?.startsWith('/admin') ? returnPath : '/admin/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title={`Administrator Sign In — ${BRAND_NAME}`}
        description={`Secure administrator sign in for ${BRAND_NAME}.`}
        noindex
      />
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50/60 via-gray-50/70 to-white px-4 py-12">
        <section className="w-full max-w-md space-y-6">
          <header className="text-center">
            <BrandLogo className="mx-auto mb-3 h-[96px] w-[76px] object-contain" loading="eager" />
            <h1 className="text-2xl font-black text-[#00245C] sm:text-3xl">Administrator Sign In</h1>
            <p className="mt-2 text-sm text-gray-600">Use your existing administrator account to open the dashboard.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {needsApprovalLogin && (
              <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-sm leading-6 text-blue-900">
                Sign in with an existing administrator account first. After sign-in, you’ll return to the account creation form to approve the new admin.
              </p>
            )}

            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">
                Administrator email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input-field py-2.5 pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field py-2.5 pl-10 text-sm"
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? 'Verifying credentials…' : 'Sign in to Admin Dashboard'}
            </button>
            <div className="flex flex-col items-center gap-2 pt-2 text-sm">
              <Link to="/admin/create-account" className="font-semibold text-primary-700 hover:text-primary-900 transition-colors">
                Create Admin Account
              </Link>
              <p className="max-w-xs text-center text-xs leading-5 text-gray-500">
                New accounts require authorization and verification by an existing administrator.
              </p>
            </div>
          </form>
        </section>
      </main>
    </>
  );
};

export default AdminLoginPage;
