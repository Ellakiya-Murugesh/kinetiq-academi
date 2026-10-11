import React, { useState } from 'react';
import { Send, CheckCircle2, PhoneCall, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../utils/api';

const GATE_SUBJECT_OPTIONS = [
  'Chemistry',
  'Physics',
  'Mechanical Engineering',
  'Computer Science Engineering (CSE)',
  'Electronics and Communication Engineering (ECE)',
  'Others',
] as const;

interface ContactFormProps {
  mode?: 'guidance' | 'general';
  title?: string;
  subtitle?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  mode = 'guidance',
  title,
  subtitle,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    exam: 'GATE',
    subject: 'Chemistry',
    otherSubject: '',
    message: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedSubjectLabel = formData.subject === 'Others' ? (formData.otherSubject.trim() || 'Others') : formData.subject;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required';
    } else if (!/^[0-9+\s-]{10,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
    }

    if (formData.subject === 'Others' && !formData.otherSubject.trim()) {
      newErrors.otherSubject = 'Please tell us your preferred subject';
    }

    if (mode === 'general') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.message.trim()) {
        newErrors.message = 'Please provide your message or inquiry';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        exam: formData.exam,
        subject: formData.subject === 'Others' ? formData.otherSubject.trim() || 'Others' : formData.subject,
        message: formData.message.trim(),
      };

      await apiRequest('/api/admin/public-enquiry', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setIsSubmitted(true);
    } catch (submitError) {
      setErrors({
        submit: submitError instanceof Error ? submitError.message : 'Unable to submit your request right now. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-gray-100 relative">
      {/* Title & Description */}
      <div className="mb-6">
        <h3 className="text-2xl font-black text-navy-500 mb-1">
          {title || (mode === 'guidance' ? 'Book a Guidance Call with an Expert' : 'Send Us a Message')}
        </h3>
        <p className="text-sm text-gray-600">
          {subtitle ||
            (mode === 'guidance'
              ? 'Not sure which exam or preparation strategy is right for you? Speak directly with our academic mentoring team.'
              : 'Have queries regarding schedules, syllabus coverage, or enrollment? Drop us a line below.')}
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center py-10 space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto border-2 border-emerald-100 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-2xl font-bold text-navy-500">
            Guidance Request Received!
          </h4>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Thank you, <strong className="text-navy-500">{formData.fullName}</strong>. Our academic counselor will call you at{' '}
            <strong className="text-navy-500">{formData.phone}</strong> to guide you through your{' '}
            <strong className="text-primary-600">{formData.exam} ({selectedSubjectLabel})</strong> preparation roadmap.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                fullName: '',
                phone: '',
                email: '',
                exam: 'GATE',
                subject: 'Chemistry',
                otherSubject: '',
                message: '',
              });
            }}
            className="btn-secondary text-xs px-5 py-2 mt-2"
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. Ananya Sharma"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`input-field ${errors.fullName ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`input-field ${errors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Email (General mode) */}
          {mode === 'general' && (
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="e.g. ananya@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email}
                </p>
              )}
            </div>
          )}

          {/* Exam & Subject row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exam" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Target Exam
              </label>
              <select
                id="exam"
                value={formData.exam}
                onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
                className="select-field cursor-pointer font-medium"
              >
                <option value="GATE">GATE</option>
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Preferred Subject
              </label>
              <select
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value, otherSubject: e.target.value === 'Others' ? formData.otherSubject : '' })}
                className="select-field cursor-pointer font-medium"
              >
                <option value="Chemistry">Chemistry</option>
                <option value="Physics">Physics</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Computer Science Engineering (CSE)">Computer Science Engineering (CSE)</option>
                <option value="Electronics and Communication Engineering (ECE)">Electronics and Communication Engineering (ECE)</option>
                <option value="Others">Others</option>
              </select>
              {formData.subject === 'Others' && (
                <div className="mt-3">
                  <label htmlFor="otherSubject" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Preferred Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="otherSubject"
                    type="text"
                    placeholder="Type your preferred GATE subject"
                    value={formData.otherSubject}
                    onChange={(e) => setFormData({ ...formData, otherSubject: e.target.value })}
                    className={`input-field ${errors.otherSubject ? 'border-red-400 focus:ring-red-400' : ''}`}
                  />
                  {errors.otherSubject && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.otherSubject}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message field for general inquiries */}
          {mode === 'general' && (
            <div>
              <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Message / Query <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                rows={4}
                placeholder="Let us know what specific guidance or assistance you require..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`input-field resize-none ${errors.message ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              {errors.message && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.message}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-3.5 text-base font-bold shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <span>Submitting Request...</span>
            ) : mode === 'guidance' ? (
              <>
                <PhoneCall className="w-4 h-4" />
                <span>Book a Guidance Call</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </>
            )}
          </button>

        </form>
      )}
    </div>
  );
};
