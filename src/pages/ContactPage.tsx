import React from 'react';
import { SEO } from '../components/ui/SEO';
import { ContactForm } from '../components/ui/ContactForm';
import {
  BRAND_NAME,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_PRIMARY,
  CONTACT_PHONE_PRIMARY_HREF,
  CONTACT_PHONE_SECONDARY,
  CONTACT_PHONE_SECONDARY_HREF,
  SOCIAL_LINK_LABELS,
  SOCIAL_LINKS,
} from '../config/brand';
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Share2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { InstagramIcon, LinkedInIcon } from '../components/ui/SocialBrandIcons';

export const ContactPage: React.FC = () => {
  const socialChannels = [
    {
      name: 'Instagram',
      href: SOCIAL_LINKS.instagram,
      label: SOCIAL_LINK_LABELS.instagram,
      icon: InstagramIcon,
      external: true,
    },
    {
      name: 'LinkedIn',
      href: SOCIAL_LINKS.linkedin,
      label: SOCIAL_LINK_LABELS.linkedin,
      icon: LinkedInIcon,
      external: true,
    },
    { name: 'X / Twitter', href: null, label: '', icon: null, external: false },
    { name: 'Threads', href: null, label: '', icon: null, external: false },
    { name: 'Facebook', href: null, label: '', icon: null, external: false },
    { name: 'WhatsApp Discussion Group', href: null, label: '', icon: null, external: false },
  ];

  return (
    <>
      <SEO
        title="Contact Us — Academic Admissions & Support"
        description={`Get in touch with ${BRAND_NAME} admissions advisors for guidance on GATE, UGC NET and CSIR NET preparation in Chemistry and Physics.`}
      />

      <section className="bg-gradient-to-b from-primary-50/60 to-white py-14 sm:py-20 border-b border-gray-100">
        <div className="container-max text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admissions &amp; Academic Helpdesk</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-navy-500">
            Get in Touch With Our Mentors
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Have questions about syllabus pacing, study notes, or enrollment? Our team is here to guide your preparation journey.
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50/70 border-b border-gray-100">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 space-y-8">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-xl space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black">Chat With Us on WhatsApp</h3>
                <p className="text-sm text-emerald-100 leading-relaxed">
                  Fastest response time for syllabus queries, fee verification, and timetable queries. Average response time: under 15 minutes.
                </p>
                <div className="pt-2">
                  <a
                    href="https://wa.me/919629302414"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-white text-emerald-700 py-3.5 px-6 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-50"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <span>Open WhatsApp Chat</span>
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <div className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Telephone Helpline</h4>
                    <a href={CONTACT_PHONE_PRIMARY_HREF} className="block text-base font-bold text-navy-500 mt-0.5 hover:text-primary-600">
                      {CONTACT_PHONE_PRIMARY}
                    </a>
                    <a href={CONTACT_PHONE_SECONDARY_HREF} className="block text-base font-bold text-navy-500 mt-1 hover:text-primary-600">
                      {CONTACT_PHONE_SECONDARY}
                    </a>
                    <p className="text-xs text-gray-500 mt-1">Monday to Saturday • 09:30 AM – 07:00 PM IST</p>
                  </div>
                </div>

                <div className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Inquiries</h4>
                    <a href={CONTACT_EMAIL_HREF} className="block text-base font-bold text-navy-500 mt-0.5 hover:text-primary-600 break-all">
                      {CONTACT_EMAIL}
                    </a>
                    <p className="text-xs text-gray-500 mt-1">Admissions, syllabus clarifications &amp; billing receipts</p>
                  </div>
                </div>

                <div className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Operating Hours</h4>
                    <p className="text-sm font-semibold text-navy-500 mt-0.5">100% Online Coaching across All India</p>
                    <p className="text-xs text-gray-500 mt-1">Live batch sessions run evenings (06:00 PM – 09:00 PM)</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-navy-500 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary-500" />
                  <span>Official Social Community Channels</span>
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {socialChannels.map((social) => {
                    const Icon = social.icon;
                    if (social.href && social.external) {
                      return (
                        <a
                          key={social.name}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.label}
                          title={social.label}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-600 transition-colors font-medium"
                        >
                          {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                          <span>{social.name}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      );
                    }

                    return (
                      <span key={social.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium">
                        {social.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ContactForm
                mode="general"
                title="Send Us a Detailed Message"
                subtitle="Fill out the form below and an academic coordinator will contact you with syllabus details and batch enrollment procedures."
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
