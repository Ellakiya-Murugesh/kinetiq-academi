import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { BrandLogo } from '../components/ui/BrandLogo';
import { SEO } from '../components/ui/SEO';
import { BRAND_NAME } from '../config/brand';

export const AdminCreateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [approverPassword, setApproverPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [approverPasswordVisible, setApproverPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || success) return;
    if (!name.trim()) {
      setError('Enter the administrator’s full name.');
      return;
    }
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid administrator email address.');
      return;
    }
    const passwordBytes = new TextEncoder().encode(password).length;
    if (passwordBytes < 12 || passwordBytes > 72) {
      setError('Choose a password between 12 and 72 UTF-8 bytes.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The password and confirmation do not match.');
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await apiRequest('/api/admin-auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password,
          confirmPassword,
          approverPassword,
        }),
      });
      setSuccess('Administrator account created successfully. Returning to the dashboard…');
      window.setTimeout(() => navigate('/admin/dashboard', { replace: true }), 1200);
    } catch (registrationError) {
      setError(registrationError instanceof Error ? registrationError.message : 'Unable to create the administrator account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title={`Create Admin Account — ${BRAND_NAME}`} description="Create an administrator account with approval from an existing administrator." noindex />
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50/60 via-gray-50/70 to-white px-4 py-10">
        <section className="w-full max-w-lg space-y-6">
          <header className="text-center">
            <BrandLogo className="mx-auto mb-3 h-[84px] w-[68px] object-contain" loading="eager" />
            <h1 className="text-2xl font-black text-[#00245C] sm:text-3xl">Create Admin Account</h1>
            <p className="mt-2 text-sm text-gray-600">An existing administrator must approve this request with their current password.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
            {success && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{success}</span></div>}

            <div>
              <label htmlFor="new-admin-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Admin Name</label>
              <div className="relative"><UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="new-admin-name" type="text" autoComplete="name" maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} className="input-field py-2.5 pl-10 text-sm" /></div>
            </div>

            <div>
              <label htmlFor="new-admin-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Admin Email</label>
              <div className="relative"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="new-admin-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} className="input-field py-2.5 pl-10 text-sm" /></div>
            </div>

            <div>
              <label htmlFor="new-admin-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input id="new-admin-password" type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="input-field py-2.5 pl-10 pr-11 text-sm" />
                <button type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800">
                  {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Use 12–72 UTF-8 bytes.</p>
            </div>

            <div>
              <label htmlFor="confirm-admin-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Confirm Password</label>
              <div className="relative">
                <input id="confirm-admin-password" type={confirmPasswordVisible ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-field py-2.5 pr-11 text-sm" />
                <button type="button" aria-label={confirmPasswordVisible ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={confirmPasswordVisible} onClick={() => setConfirmPasswordVisible((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800">
                  {confirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="approver-admin-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600">Approving Administrator Password</label>
              <div className="relative">
                <input id="approver-admin-password" type={approverPasswordVisible ? 'text' : 'password'} autoComplete="current-password" required value={approverPassword} onChange={(event) => setApproverPassword(event.target.value)} className="input-field py-2.5 pr-11 text-sm" />
                <button type="button" aria-label={approverPasswordVisible ? 'Hide approving administrator password' : 'Show approving administrator password'} aria-pressed={approverPasswordVisible} onClick={() => setApproverPasswordVisible((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800">
                  {approverPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading || Boolean(success)} className="btn-primary w-full py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>
            <p className="text-center text-sm text-gray-600"><Link to="/admin/login" className="font-semibold text-primary-700 hover:text-primary-900">Back to Admin Login</Link></p>
          </form>
        </section>
      </main>
    </>
  );
};

export default AdminCreateAccountPage;
