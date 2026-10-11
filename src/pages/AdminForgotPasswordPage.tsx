import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Mail } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { BrandLogo } from '../components/ui/BrandLogo';
import { SEO } from '../components/ui/SEO';
import { BRAND_NAME } from '../config/brand';

export const AdminForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      await apiRequest('/api/admin-auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Password recovery is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title={`Admin Password Recovery — ${BRAND_NAME}`} description="Request a secure administrator password reset link." noindex />
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50/60 via-gray-50/70 to-white px-4 py-12">
        <section className="w-full max-w-md space-y-6">
          <header className="text-center">
            <BrandLogo className="mx-auto mb-3 h-[84px] w-[68px] object-contain" loading="eager" />
            <h1 className="text-2xl font-black text-[#00245C] sm:text-3xl">Reset Admin Password</h1>
            <p className="mt-2 text-sm text-gray-600">Enter your administrator email to request a secure reset link.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
            {submitted ? (
              <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                If an active administrator account matches that email and email delivery is configured, reset instructions will be sent. The link expires in 30 minutes.
              </p>
            ) : (
              <>
                <div>
                  <label htmlFor="admin-reset-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Administrator email</label>
                  <div className="relative"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="admin-reset-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} className="input-field py-2.5 pl-10 text-sm" /></div>
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                  {isLoading ? 'Requesting link…' : 'Email Reset Link'}
                </button>
              </>
            )}
            <p className="text-center text-sm text-gray-600"><Link to="/admin/login" className="font-semibold text-primary-700 hover:text-primary-900">Return to admin sign in</Link></p>
          </form>
        </section>
      </main>
    </>
  );
};

export default AdminForgotPasswordPage;
