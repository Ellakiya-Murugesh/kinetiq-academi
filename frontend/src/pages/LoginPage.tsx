import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SEO } from '../components/ui/SEO';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand';
import { BrandLogo } from '../components/ui/BrandLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const locationState = location.state as {
    registrationMessage?: string;
    from?: { pathname?: string; search?: string; hash?: string };
  } | null;
  const registrationMessage = locationState?.registrationMessage;

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation & status
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const validatePasswordMode = () => {
    const errs: { [key: string]: string } = {};
    if (!identifier.trim()) {
      errs.identifier = 'Please enter your registered email address or mobile number';
    }
    if (!password) {
      errs.password = 'Please enter your password';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validatePasswordMode();
    if (!isValid) return;

    setIsLoading(true);
    setErrors({});

    try {
      await login(identifier.trim(), password, 'STUDENT');
      setIsLoading(false);
      const requestedDestination = locationState?.from;
      const destination = requestedDestination?.pathname?.startsWith('/student')
        ? requestedDestination
        : '/student/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setIsLoading(false);
      setErrors({ form: err.message || 'Invalid credentials or inactive account' });
    }
  };

  return (
    <>
      <SEO
        title="Student Portal Login — GATE Preparation"
        description={`Login to your ${BRAND_NAME} learning portal to attend daily live lectures, solve GATE mock tests, and view study materials.`}
      />

      <div className="min-h-[85vh] bg-gradient-to-b from-slate-100 via-white to-slate-50 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] overflow-hidden">
            <div className="bg-[#00245C] px-6 py-5 text-center text-white">
              <Link to="/" className="inline-flex flex-col items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-full">
                <BrandLogo className="h-[72px] w-[58px] object-contain transition-transform group-hover:scale-[1.02]" loading="eager" />
                <span className="text-lg font-black tracking-wide">{BRAND_NAME}</span>
              </Link>
              <p className="mt-2 text-[11px] font-medium tracking-[0.18em] uppercase text-slate-200">
                {BRAND_TAGLINE}
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-6 text-center">
                <h1 className="text-2xl sm:text-3xl font-black text-[#00245C]">
                  Student Login
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Welcome back. Continue your GATE preparation journey.
                </p>
              </div>

              {registrationMessage && (
                <div role="status" className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs leading-5 text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{registrationMessage}</span>
                </div>
              )}

              {errors.form && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs leading-5 text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="identifier" className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    Email or mobile number
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="identifier"
                      type="text"
                      placeholder="Enter your email or mobile number"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      className={`w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ${
                        errors.identifier ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#00245C]/20'
                      }`}
                      aria-invalid={Boolean(errors.identifier)}
                    />
                  </div>
                  {errors.identifier && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.identifier}</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-semibold text-[#00245C] hover:text-[#003b8e] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ${
                        errors.password ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#00245C]/20'
                      }`}
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00245C]/30"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#00245C] focus:ring-[#00245C]"
                    />
                    Keep me signed in
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[#00245C] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#00245C]/20 transition hover:bg-[#00357a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00245C]/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                      Verifying credentials...
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Lock className="h-4 w-4" />
                      Sign In to Dashboard
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-4 text-center">
                <p className="text-sm text-slate-600">
                  New here?{' '}
                  <Link to="/signup" className="font-bold text-[#00245C] underline-offset-2 hover:underline">
                    Create a student account
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            Having trouble logging in?{' '}
            <Link to="/contact" className="font-semibold text-[#00245C] hover:underline">
              Contact Student Support
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-[#00245C]">
              Reset Your Portal Password
            </h3>
            <p className="text-xs text-gray-600">
              Enter your registered email address or mobile number to receive a secure password reset link.
            </p>

            {forgotSent ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <p className="font-bold">Password Reset Instructions Dispatched</p>
                <p>If an account matches <strong>{forgotEmail}</strong>, an OTP and reset link have been transmitted.</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSent(false);
                      setForgotEmail('');
                    }}
                    className="btn-primary text-xs py-2 px-4 w-full"
                  >
                    Return to Login
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!forgotEmail) return;
                  setForgotSent(true);
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  placeholder="Enter registered email / mobile"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="input-field text-xs py-2.5"
                  required
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs py-2 px-5">
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;
