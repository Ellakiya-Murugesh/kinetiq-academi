import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const featuredCourses = [
  {
    code: 'GATE-CSE',
    name: 'GATE Computer Science & Information Technology',
    description: 'Build a strong foundation across core computer science and information technology topics.',
  },
  {
    code: 'GATE-ECE',
    name: 'GATE Electronics & Communication Engineering',
    description: 'Prepare across key electronics and communication engineering concepts and problem types.',
  },
  {
    code: 'GATE-EE',
    name: 'GATE Electrical Engineering',
    description: 'Strengthen electrical engineering fundamentals with structured exam-focused preparation.',
  },
  {
    code: 'GATE-ME',
    name: 'GATE Mechanical Engineering',
    description: 'Review essential mechanical engineering concepts through focused preparation and practice.',
  },
  {
    code: 'GATE-CE',
    name: 'GATE Civil Engineering',
    description: 'Develop a clear, topic-based approach to civil engineering exam preparation.',
  },
];

export const FeaturedGateCourses: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const registerForCourse = (code: string) => {
    const search = `?course=${encodeURIComponent(code)}`;
    if (isAuthenticated && user?.role === 'STUDENT') {
      navigate({ pathname: '/student/enroll', search });
      return;
    }

    navigate('/login', {
      state: { from: { pathname: '/student/enroll', search } },
    });
  };

  return (
    <section className="section-padding border-b border-gray-100 bg-white" aria-labelledby="featured-gate-courses-heading">
      <div className="container-max">
        <header className="mx-auto mb-10 max-w-3xl space-y-3 text-center sm:mb-12">
          <h2 id="featured-gate-courses-heading" className="section-heading">
            Explore Our GATE Courses
          </h2>
          <p className="section-subheading mx-auto">
            Choose your GATE branch and start your preparation with Kinetiq Academi.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCourses.map((course) => (
            <article key={course.code} className="card flex h-full flex-col p-5 transition-shadow hover:shadow-md sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="rounded-xl bg-primary-50 p-3 text-primary-600" aria-hidden="true">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-extrabold tracking-wide text-primary-700">
                  {course.code}
                </span>
              </div>
              <h3 className="text-lg font-extrabold leading-snug text-navy-500">{course.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{course.description}</p>
              <button
                type="button"
                onClick={() => registerForCourse(course.code)}
                className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 text-sm"
                aria-label={`Register now for ${course.name}`}
              >
                Register Now
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
