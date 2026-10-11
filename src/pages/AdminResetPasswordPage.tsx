import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Lock } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { BrandLogo } from '../components/ui/BrandLogo';
import { SEO } from '../components/ui/SEO';
import { BRAND_NAME } from '../config/brand';

export const AdminResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    if (password !== confirmPassword) {
      setError('The password and confirmation do not match.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await apiRequest('/api/admin-auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      setComplete(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Password reset failed. Request a new link and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title={`Set New Admin Password — ${BRAND_NAME}`} description="Set a new administrator password using a secure reset link." noindex />
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50/60 via-gray-50/70 to-white px-4 py-12">
        <section className="w-full max-w-md space-y-6">
          <header className="text-center">
            <BrandLogo className="mx-auto mb-3 h-[84px] w-[68px] object-contain" loading="eager" />
            <h1 className="text-2xl font-black text-[#00245C] sm:text-3xl">Choose a New Password</h1>
            <p className="mt-2 text-sm text-gray-600">Your reset link is single-use and expires after 30 minutes.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
            {complete ? (
              <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                Your password has been changed. Existing sessions have been revoked; sign in again with your new password.
              </p>
            ) : (
              <>
                {!token && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This reset link is missing its token. Request a fresh link to continue.</p>}
                <div>
                  <label htmlFor="new-reset-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">New password</label>
                  <div className="relative"><Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="new-reset-password" type="password" autoComplete="new-password" minLength={12} required disabled={!token} value={password} onChange={(event) => setPassword(event.target.value)} className="input-field py-2.5 pl-10 text-sm" /></div>
                  <p className="mt-1 text-xs text-gray-500">Use 12–72 UTF-8 bytes.</p>
                </div>
                <div>
                  <label htmlFor="confirm-reset-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Confirm new password</label>
                  <input id="confirm-reset-password" type="password" autoComplete="new-password" required disabled={!token} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-field py-2.5 text-sm" />
                </div>
                <button type="submit" disabled={isLoading || !token} className="btn-primary w-full py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
                  {isLoading ? 'Updating password…' : 'Update Password'}
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

export default AdminResetPasswordPage;
