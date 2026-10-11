import React from 'react';

const testimonials = [
  {
    name: 'Aditi S.',
    tag: 'CSE GATE 2025',
    quote: 'The live classes made the toughest topics feel manageable. The weekly problem-solving rhythm was exactly what I needed to stay consistent.',
  },
  {
    name: 'Rahul M.',
    tag: 'Mechanical GATE 2025',
    quote: 'The test series gave me the confidence to improve my accuracy. The revision sheets and doubt support were extremely helpful.',
  },
  {
    name: 'Neha P.',
    tag: 'Chemistry GATE 2024',
    quote: 'The concept-first approach and structured mock tests helped me understand weak areas clearly and improve my scores steadily.',
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            Student Feedback
          </div>
          <h2 className="section-heading mt-4">Learners trust the GATE prep roadmap</h2>
          <p className="section-subheading mx-auto">
            Students stay consistent with disciplined, concept-led coaching and targeted practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div key={item.name} className="card p-6 border border-gray-200 hover:border-primary-200 transition-all">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-navy-500">{item.name}</h3>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{item.tag}</p>
                </div>
                <div className="text-amber-400 text-lg">★ ★ ★ ★ ★</div>
              </div>
              <p className="text-sm leading-relaxed text-gray-600">“{item.quote}”</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
