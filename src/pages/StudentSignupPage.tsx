import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
} from 'lucide-react';
import { SEO } from '../components/ui/SEO';
import { BrandLogo } from '../components/ui/BrandLogo';
import { BRAND_NAME } from '../config/brand';
import { apiRequest } from '../utils/api';
import { GATE_COURSES } from '../data/gateCourses';

type RegistrationResponse = {
  message: string;
  developmentCode?: string;
};

export const StudentSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedCourse = searchParams.get('course') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [courseCode, setCourseCode] = useState(
    GATE_COURSES.some((course) => course.code === requestedCourse) ? requestedCourse : ''
  );
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (GATE_COURSES.some((course) => course.code === requestedCourse)) {
      setCourseCode(requestedCourse);
    }
  }, [requestedCourse]);

  const requestOtp = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    if (!GATE_COURSES.some((course) => course.code === courseCode)) {
      setError('Choose a GATE course to continue.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest<RegistrationResponse>('/api/auth/register/otp/request', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: `+91${phone}`,
          password,
          courseCode,
        }),
      });
      setOtp('');
      setOtpMessage(result.message);
      setDevelopmentOtp(result.developmentCode || '');
      setStep('verify');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request a verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest<{ message: string }>('/api/auth/register/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: `+91${phone}`, code: otp }),
      });
      navigate('/login', {
        replace: true,
        state: { registrationMessage: result.message },
      });
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Unable to verify your number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const returnToDetails = () => {
    setStep('details');
    setOtp('');
    setOtpMessage('');
    setDevelopmentOtp('');
    setError('');
  };

  return (
    <>
      <SEO title={`Create Student Account — ${BRAND_NAME}`} description="Create a GATE student account and verify your mobile number." noindex />
      <main className="flex min-h-[82vh] items-center justify-center bg-gradient-to-b from-blue-50/60 via-gray-50/70 to-white px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <header className="mb-7 text-center">
            <Link to="/" aria-label={`${BRAND_NAME} home`} className="mb-4 inline-flex rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00245C] focus:ring-offset-4">
              <BrandLogo className="h-[95px] w-[76px] object-contain" loading="eager" />
            </Link>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">GATE preparation, with purpose</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#00245C] sm:text-3xl">
              {step === 'details' ? 'Create Your Student Account' : 'Verify Your Mobile Number'}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">
              {step === 'details'
                ? 'Choose your GATE course and create an account to get started.'
                : `Enter the 6-digit code sent to the number ending in ${phone.slice(-4)}.`}
            </p>
          </header>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_54px_-30px_rgba(0,36,92,0.3)] sm:p-8">
            {error && (
              <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 'details' ? (
              <form onSubmit={(event) => void requestOtp(event)} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Full Name</span>
                  <input type="text" autoComplete="name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="input-field text-sm" />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Email Address</span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="input-field pl-10 text-sm" />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">Mobile Number</span>
                  <span className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-[#00245C] focus-within:ring-2 focus-within:ring-[#00245C]/20">
                    <span className="flex items-center gap-2 border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700"><Phone className="h-4 w-4 text-[#00245C]" />+91</span>
                    <input type="tel" inputMode="numeric" autoComplete="tel-national" required maxLength={10} minLength={10} pattern="[6-9][0-9]{9}" aria-label="10-digit mobile number" placeholder="10-digit mobile number" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} className="min-w-0 flex-1 border-0 bg-white px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0" />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">GATE Course</span>
                  <select required value={courseCode} onChange={(event) => setCourseCode(event.target.value)} className="select-field text-sm">
                    <option value="" disabled>Select your GATE course</option>
                    {GATE_COURSES.map((course) => (
                      <option key={course.code} value={course.code}>{course.label}</option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-xs text-gray-500">Your course is linked to your student profile.</span>
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

                <button type="submit" disabled={loading || phone.length !== 10} className="btn-primary w-full gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? 'Requesting verification code…' : 'Continue to Verification'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
                <p className="border-t border-gray-100 pt-4 text-center text-xs text-gray-600">
                  Already have an account? <Link to="/login" className="font-semibold text-[#00245C] hover:underline">Sign In</Link>
                </p>
              </form>
            ) : (
              <form onSubmit={(event) => void verifyOtp(event)} className="space-y-5">
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-[#00245C]">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-700">Selected GATE Course</span>
                  <span className="mt-1 block font-semibold">
                    {GATE_COURSES.find((course) => course.code === courseCode)?.label}
                  </span>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{otpMessage}</span>
                  </div>
                </div>
                {developmentOtp && (
                  <p className="text-center text-xs text-amber-700">
                    Development verification code: <strong className="font-mono">{developmentOtp}</strong>
                  </p>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-600">6-Digit Verification Code</span>
                  <span className="relative block">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} pattern="[0-9]{6}" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="input-field pl-10 text-center font-mono text-lg tracking-[0.35em]" aria-label="6-digit verification code" />
                  </span>
                </label>


                <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? 'Verifying…' : 'Verify & Create Account'}
                  {!loading && <CheckCircle2 className="h-4 w-4" />}
                </button>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
                  <button type="button" onClick={returnToDetails} disabled={loading} className="inline-flex items-center gap-1 font-semibold text-gray-600 hover:text-[#00245C] disabled:opacity-50">
                    <ArrowLeft className="h-3.5 w-3.5" /> Edit details
                  </button>
                  <button type="button" onClick={() => void requestOtp()} disabled={loading} className="font-semibold text-[#00245C] hover:underline disabled:opacity-50">
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </section>

          <footer className="mt-5 flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <LockKeyhole className="h-3.5 w-3.5" />
            <span>Your account details stay protected</span>
          </footer>
        </div>
      </main>
    </>
  );
};
