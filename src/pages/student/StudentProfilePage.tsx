import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LockKeyhole, Save, UserRound } from 'lucide-react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  qualification: string;
  college: string;
  gatePaper: string;
  gateAttemptYear: string;
}

const blankProfile: ProfileForm = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  qualification: '',
  college: '',
  gatePaper: '',
  gateAttemptYear: '',
};

export const StudentProfilePage: React.FC = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCompletion = location.pathname === '/student/complete-profile';
  const [profile, setProfile] = useState<ProfileForm>(blankProfile);
  const displayMobile = profile.phone.replace(/\D/g, '').slice(-10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const result = await api.get<{ student: Partial<ProfileForm> }>('/student/profile');
        if (!result.success || !result.data?.student) {
          throw new Error(result.error || 'Unable to load your profile. Please try again.');
        }
        if (active) {
          setProfile({ ...blankProfile, ...result.data.student });
        }
      } catch (error) {
        if (active) setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load your profile.' });
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadProfile();
    return () => { active = false; };
  }, []);

  const setField = (field: keyof ProfileForm, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!profile.name.trim() || !profile.email.trim()) {
      setMessage({ type: 'error', text: 'Enter your name and email address.' });
      return;
    }

    setSaving(true);
    const result = await api.put<{ user: { name: string; email: string } }>('/student/profile', profile);
    setSaving(false);
    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Your profile could not be saved. Please try again.' });
      return;
    }
    const profileCompleted = [
      profile.dateOfBirth,
      profile.gender,
      profile.address,
      profile.qualification,
      profile.college,
      profile.gatePaper,
      profile.gateAttemptYear,
    ].every((value) => value.trim());
    updateUser({ name: profile.name, email: profile.email, profileCompleted });
    if (isCompletion) {
      navigate('/student/dashboard', { replace: true });
      return;
    }
    setMessage({ type: 'success', text: 'Your profile has been updated.' });
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-500" role="status">Loading your profile…</div>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-7">
      <header>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#00245C]">
          <UserRound className="h-3.5 w-3.5" />
          <span>{isCompletion ? 'Profile settings' : 'Account settings'}</span>
        </div>
        <h1 className="text-2xl font-bold text-[#00245C] md:text-3xl">
          Your student profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          Add any academic details you would like to share. Your name and email are required; the other fields are optional. Your verified mobile number cannot be changed here.
        </p>
      </header>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <section aria-labelledby="account-mobile-title" className="mb-7 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <h2 id="account-mobile-title" className="mb-2 text-xs font-bold uppercase tracking-wide text-[#00245C]">Account mobile number</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#00245C]">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">+91 {displayMobile}</p>
              <p className="text-xs text-gray-600">Provided during account creation</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field label="Full name" required>
            <input autoComplete="name" required value={profile.name} onChange={(event) => setField('name', event.target.value)} className="input-field text-sm" />
          </Field>
          <Field label="Email address" required>
            <input type="email" autoComplete="email" required value={profile.email} onChange={(event) => setField('email', event.target.value)} className="input-field text-sm" />
          </Field>
          <Field label="Date of birth">
            <input type="date" max={new Date().toISOString().slice(0, 10)} value={profile.dateOfBirth} onChange={(event) => setField('dateOfBirth', event.target.value)} className="input-field text-sm" />
          </Field>
          <Field label="Gender">
            <select value={profile.gender} onChange={(event) => setField('gender', event.target.value)} className="select-field text-sm">
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Highest qualification">
            <input value={profile.qualification} onChange={(event) => setField('qualification', event.target.value)} className="input-field text-sm" placeholder="e.g. B.Sc. Chemistry" />
          </Field>
          <Field label="College / university">
            <input value={profile.college} onChange={(event) => setField('college', event.target.value)} className="input-field text-sm" placeholder="Your institution" />
          </Field>
          <Field label="GATE paper / subject">
            <input value={profile.gatePaper} onChange={(event) => setField('gatePaper', event.target.value)} className="input-field text-sm" placeholder="e.g. Chemistry" />
          </Field>
          <Field label="GATE attempt year">
            <select value={profile.gateAttemptYear} onChange={(event) => setField('gateAttemptYear', event.target.value)} className="select-field text-sm">
              <option value="">Select year</option>
              {Array.from({ length: 7 }, (_, index) => new Date().getFullYear() + index - 1).map((year) => (
                <option key={year} value={String(year)}>{year}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <textarea rows={3} autoComplete="street-address" value={profile.address} onChange={(event) => setField('address', event.target.value)} className="input-field resize-y text-sm" placeholder="House / street, city, state, PIN code" />
            </Field>
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {!isCompletion && <p className="text-xs text-gray-500">Your verified mobile stays attached to this account.</p>}
          <button type="submit" disabled={saving} className="btn-primary min-w-44 gap-2 self-end text-sm disabled:cursor-not-allowed disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </main>
  );
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
      </span>
      {children}
    </label>
  );
}
