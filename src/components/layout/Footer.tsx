import React from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Mail,
  Phone,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_PRIMARY,
  CONTACT_PHONE_PRIMARY_HREF,
  CONTACT_PHONE_SECONDARY,
  CONTACT_PHONE_SECONDARY_HREF,
  SOCIAL_LINK_LABELS,
  SOCIAL_LINKS,
} from '../../config/brand';
import { BrandLogo } from '../ui/BrandLogo';
import { InstagramIcon, LinkedInIcon } from '../ui/SocialBrandIcons';

const socialLinks = [
  {
    label: SOCIAL_LINK_LABELS.instagram,
    href: SOCIAL_LINKS.instagram,
    icon: InstagramIcon,
    text: 'Instagram',
  },
  {
    label: SOCIAL_LINK_LABELS.linkedin,
    href: SOCIAL_LINKS.linkedin,
    icon: LinkedInIcon,
    text: 'LinkedIn',
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-900 text-gray-300 pt-16 pb-12 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-10 lg:gap-8 pb-12 border-b border-navy-800">
          <div className="xl:col-span-2 space-y-4">
            <Link to="/" className="inline-flex bg-white rounded-md p-1.5">
              <BrandLogo className="w-[168px] h-auto" />
            </Link>
            <p className="text-sm font-semibold text-gold-300">{BRAND_TAGLINE}</p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Structured online preparation for GATE in Chemistry and Physics.
              Empowering research aspirations and academic careers through concept clarity and disciplined practice.
            </p>

            <div className="pt-2">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary-400 mb-2">
                Stay Updated With Batch Announcements
              </span>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-navy-800 border border-navy-700 text-white text-sm rounded-xl px-4 py-2.5 w-full focus:outline-none focus:border-primary-500 placeholder-gray-500"
                />
                <button
                  type="button"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                No spam. Only syllabus updates, batch dates & revision notes.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-base mb-4 tracking-wide">Exams</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/exams?tab=gate" className="hover:text-primary-400 transition-colors">
                  GATE Chemistry & Physics
                </Link>
              </li>
              <li>
                <Link to="/exams?tab=ugc-net" className="hover:text-primary-400 transition-colors">
                  UGC NET Assistant Professor
                </Link>
              </li>
              <li>
                <Link to="/exams?tab=csir-net" className="hover:text-primary-400 transition-colors">
                  CSIR NET Junior Research Fellowship
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-primary-400 transition-colors">
                  100-Day Integrated Program
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-base mb-4 tracking-wide">Team Kinetiq</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-primary-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <span className="text-gray-500 cursor-not-allowed">Careers</span>
              </li>
              <li>
                <Link to="/payment" className="hover:text-primary-400 transition-colors">
                  Pricing & Seat Counter
                </Link>
              </li>
            </ul>
          </div>

          <div className="min-w-0">
            <h4 className="text-white font-bold text-base mb-4 tracking-wide">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={CONTACT_EMAIL_HREF} className="inline-flex max-w-full items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors">
                  <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                  <span className="break-all">{CONTACT_EMAIL}</span>
                </a>
              </li>
              <li>
                <a href={CONTACT_PHONE_PRIMARY_HREF} className="inline-flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors">
                  <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                  <span>{CONTACT_PHONE_PRIMARY}</span>
                </a>
              </li>
              <li>
                <a href={CONTACT_PHONE_SECONDARY_HREF} className="inline-flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors">
                  <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                  <span>{CONTACT_PHONE_SECONDARY}</span>
                </a>
              </li>
            </ul>

            <h5 className="text-xs uppercase font-bold tracking-wider text-gray-400 mt-6 mb-3">
              Connect With Us
            </h5>
            <div className="flex flex-wrap gap-2 text-xs">
              {socialLinks.map(({ label, href, icon: Icon, text }) => (
                <a
                  key={text}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy-800 text-gray-200 hover:bg-primary-500/20 hover:text-primary-400 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{text}</span>
                </a>
              ))}
              <span className="px-2.5 py-1.5 rounded-lg bg-navy-800 text-gray-300">X</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-navy-800 text-gray-300">Threads</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-navy-800 text-gray-300">Facebook</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 font-semibold">WhatsApp Group</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-base mb-4 tracking-wide">Resources</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/materials" className="hover:text-primary-400 transition-colors">
                  Study Materials & PYQs
                </Link>
              </li>
              <li>
                <Link to="/live-sessions" className="hover:text-primary-400 transition-colors">
                  Live Sessions & Recordings
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary-400 transition-colors text-primary-400 font-semibold">
                  Student &amp; Faculty Login
                </Link>
              </li>
              <li>
                <Link to="/#faq" className="hover:text-primary-400 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>

          </div>
        </div>

        <div className="py-6 border-b border-navy-800 text-xs text-gray-400 leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            <strong className="text-gray-300">Important Disclaimer:</strong> {BRAND_NAME} is an independent educational coaching initiative.
            GATE, UGC NET, and CSIR NET are trademarks or registered trademarks of their respective organizing institutes/bodies.
            All qualifications, exam rankings, admissions, and JRF awards are subject to official conducting body notifications and individual merit.
            No guaranteed ranks or PhD admissions are claimed.
          </p>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            © 2026 {BRAND_NAME}. All Rights Reserved.
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
