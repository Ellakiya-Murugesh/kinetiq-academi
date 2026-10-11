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
  const registrationMessage = (location.state as { registrationMessage?: string } | null)?.registrationMessage;

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
      navigate('/student/dashboard');
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

      <div className="min-h-[85vh] bg-gradient-to-b from-blue-50/50 via-gray-50/50 to-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex flex-col items-center gap-1 group focus:outline-none">
              <BrandLogo className="h-[110px] w-[88px] object-contain transition-transform group-hover:scale-[1.02]" loading="eager" />
              <span className="sr-only font-extrabold text-2xl text-navy-500">
                {BRAND_NAME}
              </span>
            </Link>
            <p className="text-xs font-semibold text-gold-700">{BRAND_TAGLINE}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#00245C]">
              Student Portal
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Log in to access your live lectures, mock tests, and learning management system.
            </p>
          </div>

          {registrationMessage && (
            <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs leading-5 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{registrationMessage}</span>
            </div>
          )}

          {/* Main Card */}
          <div className="card p-6 sm:p-8 bg-white border border-gray-100 shadow-xl rounded-3xl">
            {/* Global Form Error */}
            {errors.form && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errors.form}</span>
              </div>
            )}

            <div>
              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                {/* Identifier Input */}
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5"
                  >
                    Email, Mobile, or Account ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="identifier"
                      type="text"
                      placeholder="Email / mobile / account ID"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      className={`input-field pl-10 text-sm py-2.5 ${
                        errors.identifier ? 'border-rose-400 focus:ring-rose-400' : ''
                      }`}
                    />
                  </div>
                  {errors.identifier && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.identifier}</span>
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="password"
                        className="block text-xs font-bold uppercase tracking-wider text-gray-600"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-xs font-semibold text-[#00245C] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`input-field pl-10 pr-10 text-sm py-2.5 ${
                          errors.password ? 'border-rose-400 focus:ring-rose-400' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.password}</span>
                      </p>
                    )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00245C] focus:ring-blue-400 border-gray-300"
                    />
                    <span>Keep me signed in on this device</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-3 text-sm font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In to Dashboard</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Not enrolled yet card */}
          <div className="p-5 rounded-2xl bg-white border border-gray-200 text-center space-y-2 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#00245C]">
              New Student Preparing for GATE?
            </h4>
            <p className="text-xs text-gray-600">
              Create an account and verify your mobile number to set up your student portal access.
            </p>
            <div className="pt-1">
              <Link
                to="/payment"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00245C] hover:underline"
              >
                <span>Enroll in 100-Day Program (₹10,000)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-gray-600">
              New here? <Link to="/signup" className="font-bold text-[#00245C] hover:underline">Create a student account</Link>
            </p>
          </div>

          {/* Help & Support Link */}
          <div className="text-center text-xs text-gray-400">
            Having trouble logging in?{' '}
            <Link to="/contact" className="text-[#00245C] hover:underline font-semibold">
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
