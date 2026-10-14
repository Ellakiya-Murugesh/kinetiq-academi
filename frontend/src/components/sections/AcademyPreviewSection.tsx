import React from 'react';

export const AcademyPreviewSection: React.FC = () => {
  return (
    <section id="academy-preview" aria-labelledby="academy-preview-heading" className="section-padding bg-white border-b border-gray-100">
      <div className="container-max">
        <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-12">
          <h2 id="academy-preview-heading" className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy-500 leading-tight">
            Explore Kinetiq Academi
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
            Get a preview of our GATE coaching, courses, learning experience and student support.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <figure className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_24px_60px_rgba(2,36,92,0.08)]">
            <div className="aspect-video w-full bg-navy-900">
              <video
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
                title="Kinetiq Academi preview video"
                aria-label="Kinetiq Academi preview video"
              >
                <source src="/media/academy-preview.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
};
