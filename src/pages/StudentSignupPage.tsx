import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, LockKeyhole, Phone } from 'lucide-react';
import { SEO } from '../components/ui/SEO';
import { BrandLogo } from '../components/ui/BrandLogo';
import { BRAND_NAME } from '../config/brand';
import { apiRequest } from '../utils/api';

export const StudentSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest<{ message: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          mobile: `+91${phone}`,
          password,
          confirmPassword,
        }),
      });
      navigate('/login', {
        replace: true,
        state: { accountCreated: true, message: result.message },
      });
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title={`Create Student Account — ${BRAND_NAME}`} description="Create a Kinetiq Academi student account." noindex />
      <main className="flex min-h-[82vh] items-center justify-center bg-gradient-to-b from-blue-50/60 via-gray-50/70 to-white px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <header className="mb-7 text-center">
            <Link to="/" aria-label={`${BRAND_NAME} home`} className="mb-4 inline-flex rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00245C] focus:ring-offset-4">
              <BrandLogo className="h-auto w-[154px]" loading="eager" />
            </Link>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">GATE preparation, with purpose</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#00245C] sm:text-3xl">Create Your Student Account</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">Create your account to continue to student sign in.</p>
          </header>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_54px_-30px_rgba(0,36,92,0.3)] sm:p-8">
            {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

            <form onSubmit={(event) => void submitSignup(event)} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Full Name</span>
                <input type="text" autoComplete="name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="input-field text-sm" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Email Address</span>
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="input-field text-sm" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Mobile Number</span>
                <span className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-[#00245C] focus-within:ring-2 focus-within:ring-[#00245C]/20">
                  <span className="flex items-center gap-2 border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700"><Phone className="h-4 w-4 text-[#00245C]" />+91</span>
                  <input type="tel" inputMode="numeric" autoComplete="tel-national" required maxLength={10} pattern="[6-9][0-9]{9}" placeholder="10-digit mobile number" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} className="min-w-0 flex-1 border-0 bg-white px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0" />
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Password</span>
                <input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} className="input-field text-sm" />
                <span className="mt-1.5 block text-xs text-gray-500">Use at least 8 characters.</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Confirm Password</span>
                <input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-field text-sm" />
              </label>
              <button type="submit" disabled={loading || phone.length !== 10} className="btn-primary w-full gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Creating account…' : 'Create Account'}{!loading && <ArrowRight className="h-4 w-4" />}</button>
              <p className="border-t border-gray-100 pt-4 text-center text-xs text-gray-600">Already have an account? <Link to="/login" className="font-semibold text-[#00245C] hover:underline">Sign In</Link></p>
            </form>
          </section>

          <footer className="mt-5 flex items-center justify-center gap-2 text-[11px] text-gray-500"><LockKeyhole className="h-3.5 w-3.5" /><span>Your account details stay protected</span></footer>
        </div>
      </main>
    </>
  );
};
