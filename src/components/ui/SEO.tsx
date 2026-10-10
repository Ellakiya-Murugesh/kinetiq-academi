import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BRAND_HOME_DESCRIPTION,
  BRAND_HOME_TITLE,
  BRAND_LOGO_ALT,
  BRAND_LOGO_PATH,
  BRAND_NAME,
  BRAND_OG_DESCRIPTION,
  BRAND_OG_IMAGE_PATH,
  BRAND_OG_TITLE,
  BRAND_SITE_URL,
  CONTACT_EMAIL,
  CONTACT_PHONE_PRIMARY,
  CONTACT_PHONE_SECONDARY,
  SOCIAL_LINKS,
} from '../../config/brand';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

const breadcrumbNames: Record<string, string> = {
  about: 'About',
  exams: 'GATE Exam Preparation',
  courses: 'GATE Courses',
  materials: 'GATE Study Materials',
  'live-sessions': 'Live Classes',
  payment: 'Enrollment & Payment',
  contact: 'Contact',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
};

function normalizeCanonical(value: string): string {
  const url = new URL(value, BRAND_SITE_URL);
  url.search = '';
  url.hash = '';
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.href;
}

function getBreadcrumbData(pathname: string): Record<string, unknown> | undefined {
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${BRAND_SITE_URL}/`,
      },
      ...segments.map((segment, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: breadcrumbNames[segment] || segment.replace(/-/g, ' '),
        item: `${BRAND_SITE_URL}/${segments.slice(0, index + 1).join('/')}`,
      })),
    ],
  };
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  noindex = false,
  ogTitle,
  ogDescription,
  ogImage = BRAND_OG_IMAGE_PATH,
  structuredData,
}) => {
  useEffect(() => {
    document.head.querySelectorAll('[data-seo-fallback]').forEach((element) => element.remove());
  }, []);

  const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;
  const effectiveOgTitle = ogTitle || fullTitle;
  const effectiveOgDesc = ogDescription || description;
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const effectiveCanonical = normalizeCanonical(canonical || pathname);
  const effectiveOgImage = new URL(ogImage, BRAND_SITE_URL).href;
  const isHomePage = title === BRAND_HOME_TITLE;
  const customStructuredData = structuredData
    ? (Array.isArray(structuredData) ? structuredData : [structuredData])
    : [];
  const breadcrumbData = getBreadcrumbData(pathname);
  const schemaData = noindex
    ? []
    : [
        {
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          '@id': `${BRAND_SITE_URL}/#organization`,
          name: BRAND_NAME,
          url: `${BRAND_SITE_URL}/`,
          logo: new URL(BRAND_LOGO_PATH, BRAND_SITE_URL).href,
          email: CONTACT_EMAIL,
          telephone: [CONTACT_PHONE_PRIMARY, CONTACT_PHONE_SECONDARY],
          sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.linkedin],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${BRAND_SITE_URL}/#website`,
          name: BRAND_NAME,
          url: `${BRAND_SITE_URL}/`,
          publisher: { '@id': `${BRAND_SITE_URL}/#organization` },
          inLanguage: 'en-IN',
        },
        ...(breadcrumbData ? [breadcrumbData] : []),
        ...customStructuredData.map((schema) => ({
          '@context': 'https://schema.org',
          ...schema,
        })),
      ];
  const serializedSchema = JSON.stringify(schemaData).replace(/</g, '\\u003c');

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={isHomePage ? BRAND_HOME_DESCRIPTION : description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      <meta name="googlebot" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      <link rel="canonical" href={effectiveCanonical} />

      {/* Open Graph metadata */}
      <meta property="og:title" content={isHomePage ? BRAND_OG_TITLE : effectiveOgTitle} />
      <meta property="og:description" content={isHomePage ? BRAND_OG_DESCRIPTION : effectiveOgDesc} />
      <meta property="og:image" content={effectiveOgImage} />
      <meta property="og:url" content={effectiveCanonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:image:alt" content={BRAND_LOGO_ALT} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={effectiveOgTitle} />
      <meta name="twitter:description" content={effectiveOgDesc} />
      <meta name="twitter:image" content={effectiveOgImage} />
      {schemaData.length > 0 && <script type="application/ld+json">{serializedSchema}</script>}
    </Helmet>
  );
};
