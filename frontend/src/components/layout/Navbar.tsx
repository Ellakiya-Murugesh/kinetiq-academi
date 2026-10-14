import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LogIn, Menu, X } from 'lucide-react';
import { BRAND_NAME, BRAND_TAGLINE } from '../../config/brand';
import { GATE_COURSES } from '../../data/gateCourses';
import { BrandLogo } from '../ui/BrandLogo';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);
  const location = useLocation();
  const coursesMenuRef = useRef<HTMLDivElement>(null);
  const coursesTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsCoursesOpen(false);
    setIsMobileCoursesOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!coursesMenuRef.current?.contains(event.target as Node)) {
        setIsCoursesOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCoursesOpen) {
        setIsCoursesOpen(false);
        coursesTriggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCoursesOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const courseSignupPath = (code: string) => `/signup?course=${encodeURIComponent(code)}`;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md py-3'
          : 'bg-white/90 backdrop-blur-sm border-b border-gray-100 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 shrink-0"
            aria-label={`${BRAND_NAME} Home`}
          >
            <BrandLogo className="h-16 w-[52px] object-contain transition-transform group-hover:scale-[1.02] sm:h-[72px] sm:w-[58px]" loading="eager" />
            <span className="sr-only">{BRAND_TAGLINE}</span>
          </Link>

          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2" aria-label="Main Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  isActive ? 'text-primary-500 bg-primary-50' : 'text-gray-700 hover:text-primary-500 hover:bg-gray-50'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  isActive ? 'text-primary-500 bg-primary-50' : 'text-gray-700 hover:text-primary-500 hover:bg-gray-50'
                }`
              }
            >
              About Us
            </NavLink>

            <div
              ref={coursesMenuRef}
              className="relative ml-1"
              onMouseEnter={() => setIsCoursesOpen(true)}
              onMouseLeave={() => {
                if (!coursesMenuRef.current?.contains(document.activeElement)) setIsCoursesOpen(false);
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsCoursesOpen(false);
              }}
            >
              <button
                ref={coursesTriggerRef}
                type="button"
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  location.pathname === '/courses' || isCoursesOpen
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-500'
                }`}
                aria-expanded={isCoursesOpen}
                aria-controls="desktop-courses-menu"
                onClick={() => setIsCoursesOpen(true)}
                onFocus={() => setIsCoursesOpen(true)}
              >
                Courses
                <ChevronDown className={`h-4 w-4 transition-transform ${isCoursesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {isCoursesOpen && (
                <div
                  id="desktop-courses-menu"
                  className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
                >
                  <NavLink
                    to="/courses"
                    className="mb-1 block rounded-lg px-3 py-2.5 text-sm font-bold text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    View all courses
                  </NavLink>
                  <div className="border-t border-gray-100 pt-1">
                    {GATE_COURSES.map((course) => (
                      <Link
                        key={course.code}
                        to={courseSignupPath(course.code)}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        {course.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  isActive ? 'text-primary-500 bg-primary-50' : 'text-gray-700 hover:text-primary-500 hover:bg-gray-50'
                }`
              }
            >
              Contact Us
            </NavLink>
          </nav>

          <div className="hidden xl:flex items-center justify-end min-w-[220px]">
            <span className="whitespace-nowrap text-right text-sm font-bold tracking-wide text-primary-700">
              Prepare for GATE with Confidence
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-navy-500 transition-colors hover:bg-gray-100 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <LogIn className="h-3.5 w-3.5 text-primary-500" />
              <span>Login</span>
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-1.5">
            <span className="hidden min-[360px]:inline text-right text-[10px] font-bold tracking-wide text-primary-700 sm:text-xs">
              Prepare for GATE with Confidence
            </span>
            <Link
              to="/login"
              className="rounded-lg p-2 text-navy-500 hover:bg-gray-100 hover:text-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Student Login"
            >
              <LogIn className="h-5 w-5 text-gray-700" />
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="rounded-xl p-2 text-gray-700 hover:bg-gray-100 hover:text-navy-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <div
        id="mobile-navigation"
        className={`lg:hidden overflow-hidden border-b border-gray-200 bg-white transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-screen py-4 opacity-100 shadow-xl' : 'max-h-0 py-0 opacity-0'
        }`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <nav className="max-w-7xl mx-auto space-y-1 px-4 sm:px-6" aria-label="Mobile Navigation">
          {navLinks.slice(0, 2).map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  isActive ? 'bg-primary-50 font-bold text-primary-500' : 'text-gray-700 hover:bg-gray-50 hover:text-primary-500'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <div className="rounded-xl">
            <button
              type="button"
              onClick={() => setIsMobileCoursesOpen((open) => !open)}
              className="flex min-h-12 w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-expanded={isMobileCoursesOpen}
              aria-controls="mobile-courses-menu"
            >
              Courses
              <ChevronDown className={`h-5 w-5 transition-transform ${isMobileCoursesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {isMobileCoursesOpen && (
              <div id="mobile-courses-menu" className="ml-3 border-l-2 border-primary-100 py-1 pl-3">
                <NavLink
                  to="/courses"
                  className="block rounded-lg px-3 py-3 text-sm font-bold text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  View all courses
                </NavLink>
                {GATE_COURSES.map((course) => (
                  <Link
                    key={course.code}
                    to={courseSignupPath(course.code)}
                    className="block rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {course.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isActive ? 'bg-primary-50 font-bold text-primary-500' : 'text-gray-700 hover:bg-gray-50 hover:text-primary-500'
              }`
            }
          >
            Contact Us
          </NavLink>
          <div className="space-y-2 pt-3 pb-1">
            <Link
              to="/login"
              className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-center text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <LogIn className="h-4 w-4 text-primary-500" />
              <span>Login</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};
