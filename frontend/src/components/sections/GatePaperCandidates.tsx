import React from 'react';
import { Link } from 'react-router-dom';

const gatePapers = [
  { code: 'CS', name: 'Computer Science & IT', candidates: '2.5–3.0 lakh', rangeMin: 2.5, rangeMax: 3 },
  { code: 'CE', name: 'Civil Engineering', candidates: '1.5–2.0 lakh', rangeMin: 1.5, rangeMax: 2 },
  { code: 'ME', name: 'Mechanical Engineering', candidates: '1.2–1.5 lakh', rangeMin: 1.2, rangeMax: 1.5 },
  { code: 'EE', name: 'Electrical Engineering', candidates: '1.0–1.3 lakh', rangeMin: 1, rangeMax: 1.3 },
  { code: 'EC', name: 'Electronics & Communication', candidates: '70,000–1.0 lakh', rangeMin: 0.7, rangeMax: 1 },
  { code: 'CH', name: 'Chemical Engineering', candidates: '20,000–30,000', rangeMin: 0.2, rangeMax: 0.3 },
  { code: 'XE', name: 'Engineering Sciences', candidates: '15,000–25,000', rangeMin: 0.15, rangeMax: 0.25 },
  { code: 'IN', name: 'Instrumentation Engineering', candidates: '10,000–20,000', rangeMin: 0.1, rangeMax: 0.2 },
  { code: 'CY', name: 'Chemistry', candidates: '8,000–15,000', rangeMin: 0.08, rangeMax: 0.15 },
  { code: 'PH', name: 'Physics', candidates: '5,000–10,000', rangeMin: 0.05, rangeMax: 0.1 },
];

export const GatePaperCandidates: React.FC = () => {
  return (
    <section
      id="gate-paper-candidates"
      className="section-padding bg-white border-b border-gray-100"
      aria-labelledby="gate-paper-candidates-heading"
    >
      <div className="container-max">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-3">
          <h2 id="gate-paper-candidates-heading" className="section-heading">
            GATE Papers &amp; Approximate Candidates
          </h2>
          <p className="section-subheading mx-auto">
            GATE is conducted across multiple engineering, science, and interdisciplinary papers. The number of candidates varies by paper and changes every year.
          </p>
        </div>

        <p className="mx-auto mb-4 max-w-5xl text-right text-xs text-gray-500">
          Range markers show approximate candidates on a shared 0–3 lakh scale.
        </p>

        <div className="hidden md:block max-w-5xl mx-auto overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full table-fixed text-left">
            <caption className="sr-only">
              Approximate number of candidates by GATE paper
            </caption>
            <colgroup>
              <col className="w-[65%]" />
              <col className="w-[35%]" />
            </colgroup>
            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th scope="col" className="px-5 py-4">GATE Paper</th>
                <th scope="col" className="px-5 py-4">Approximate candidates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gatePapers.map((paper) => (
                <tr
                  key={paper.code}
                  className="transition-colors hover:bg-primary-50/40"
                >
                  <th scope="row" className="px-5 py-4">
                    <span className="mr-3 inline-flex min-w-10 items-center justify-center rounded-lg bg-primary-50 px-2.5 py-1.5 text-sm font-extrabold tracking-wide text-primary-600">
                      {paper.code}
                    </span>
                    <span className="break-words text-sm font-medium text-navy-500">{paper.name}</span>
                  </th>
                  <td className="break-words px-5 py-4 text-sm">
                    <span className="inline-flex rounded-lg bg-primary-50 px-2.5 py-1.5 font-bold tabular-nums text-primary-600">
                      {paper.candidates}
                    </span>
                    <div className="relative mt-2 h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                      <span
                        className="absolute inset-y-0 rounded-full bg-primary-500"
                        style={{
                          left: `${(paper.rangeMin / 3) * 100}%`,
                          width: `${((paper.rangeMax - paper.rangeMin) / 3) * 100}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden" aria-label="Approximate candidates by GATE paper">
          {gatePapers.map((paper) => (
            <li
              key={paper.code}
              className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/30"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-extrabold tracking-wide text-primary-600">
                {paper.code}
              </span>
              <div className="min-w-0">
                <h3 className="break-words text-sm font-bold leading-snug text-navy-500">
                  {paper.name}
                </h3>
                <p className="mt-1">
                  <span className="inline-flex rounded-lg bg-primary-50 px-2.5 py-1.5 text-sm font-bold tabular-nums text-primary-600">
                    {paper.candidates}
                  </span>
                </p>
                <div className="relative mt-2 h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                  <span
                    className="absolute inset-y-0 rounded-full bg-primary-500"
                    style={{
                      left: `${(paper.rangeMin / 3) * 100}%`,
                      width: `${((paper.rangeMax - paper.rangeMin) / 3) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-6 max-w-5xl rounded-xl border border-gold-100 bg-gold-50/70 px-4 py-3 text-sm leading-relaxed text-gray-700 sm:px-5">
          <span className="font-bold text-navy-500">Important:</span>{' '}
          These are approximate ranges. The exact candidate numbers and ranking may change each year.
        </p>

        <div className="mt-10 text-center">
          <h3 className="text-xl font-bold text-navy-500 sm:text-2xl">
            Ready to Start Your GATE Preparation?
          </h3>
          <Link to="/courses" className="btn-primary mt-4 text-sm sm:text-base">
            Explore Courses
          </Link>
        </div>
      </div>
    </section>
  );
};
