import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, Mail, Phone } from 'lucide-react';
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_PRIMARY,
  CONTACT_PHONE_PRIMARY_HREF,
  CONTACT_PHONE_SECONDARY,
  CONTACT_PHONE_SECONDARY_HREF,
} from '../../config/brand';
import { BrandLogo } from '../ui/BrandLogo';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer upon route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Courses', path: '/courses' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md py-3'
          : 'bg-white/90 backdrop-blur-sm border-b border-gray-100 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group focus:outline-none shrink-0"
            aria-label={`${BRAND_NAME} Home`}
          >
            <BrandLogo className="h-14 w-auto max-w-[108px] sm:max-w-[128px] object-contain group-hover:scale-[1.02] transition-transform" loading="eager" />
            <span className="sr-only">{BRAND_TAGLINE}</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-500 hover:bg-gray-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Login */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-navy-500 hover:text-primary-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-primary-500" />
              <span>Login</span>
            </Link>
          </div>

          {/* Mobile Buttons */}
          <div className="flex lg:hidden items-center gap-1.5">
            <Link
              to="/login"
              className="p-2 text-navy-500 hover:text-primary-500 rounded-lg hover:bg-gray-100"
              aria-label="Student Login"
            >
              <LogIn className="w-5 h-5 text-gray-700" />
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-gray-700 hover:text-navy-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden border-b border-gray-200 bg-white ${
          isOpen ? 'max-h-screen opacity-100 py-4 shadow-xl' : 'max-h-0 opacity-0 py-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                  isActive
                    ? 'text-primary-500 bg-primary-50 font-bold'
                    : 'text-gray-700 hover:text-primary-500 hover:bg-gray-50'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="px-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              Contact {BRAND_NAME}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-2.5 text-sm font-medium">
              <a
                href={CONTACT_EMAIL_HREF}
                aria-label={`Email ${BRAND_NAME}`}
                className="inline-flex items-center gap-2 text-gray-700 hover:text-primary-500"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary-500" />
                <span className="break-all">{CONTACT_EMAIL}</span>
              </a>
              <a
                href={CONTACT_PHONE_PRIMARY_HREF}
                aria-label={`Call ${BRAND_NAME} at ${CONTACT_PHONE_PRIMARY}`}
                className="inline-flex items-center gap-2 text-gray-700 hover:text-primary-500"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary-500" />
                <span>{CONTACT_PHONE_PRIMARY}</span>
              </a>
              <a
                href={CONTACT_PHONE_SECONDARY_HREF}
                aria-label={`Call ${BRAND_NAME} at ${CONTACT_PHONE_SECONDARY}`}
                className="inline-flex items-center gap-2 text-gray-700 hover:text-primary-500"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary-500" />
                <span>{CONTACT_PHONE_SECONDARY}</span>
              </a>
            </div>
          </div>
          <div className="pt-3 pb-1 space-y-2">
            <Link
              to="/login"
              className="w-full btn-secondary py-2.5 text-center flex items-center justify-center gap-2 text-sm font-bold"
            >
              <LogIn className="w-4 h-4 text-primary-500" />
              <span>Student / Faculty Login</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
