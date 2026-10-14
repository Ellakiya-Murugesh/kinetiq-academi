import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  BRAND_HOME_DESCRIPTION,
  BRAND_HOME_TITLE,
  BRAND_LOGO_ALT,
  BRAND_NAME,
  BRAND_OG_DESCRIPTION,
  BRAND_OG_IMAGE_PATH,
  BRAND_OG_TITLE,
} from '../../config/brand';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage = BRAND_OG_IMAGE_PATH,
  keywords = 'GATE Chemistry, GATE Physics, GATE Mechanical Engineering, GATE CSE, GATE ECE, GATE coaching, competitive exam coaching, 100 day coaching, live classes',
  noindex = false,
  structuredData,
}) => {
  const fullTitle = title.startsWith(`${BRAND_NAME} |`) ? title : `${title} | ${BRAND_NAME}`;
  const effectiveOgTitle = ogTitle || fullTitle;
  const effectiveOgDesc = ogDescription || description;
  const effectiveCanonical = canonical || (typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : undefined);
  const effectiveOgImage = typeof window !== 'undefined'
    ? new URL(ogImage, window.location.origin).href
    : ogImage;
  const isHomePage = title === BRAND_HOME_TITLE;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={isHomePage ? BRAND_HOME_DESCRIPTION : description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {effectiveCanonical && <link rel="canonical" href={effectiveCanonical} />}

      {/* Open Graph metadata */}
      <meta property="og:title" content={isHomePage ? BRAND_OG_TITLE : effectiveOgTitle} />
      <meta property="og:description" content={isHomePage ? BRAND_OG_DESCRIPTION : effectiveOgDesc} />
      <meta property="og:image" content={effectiveOgImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:image:alt" content={BRAND_LOGO_ALT} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={isHomePage ? BRAND_OG_TITLE : effectiveOgTitle} />
      <meta name="twitter:description" content={isHomePage ? BRAND_OG_DESCRIPTION : effectiveOgDesc} />
      <meta name="twitter:image" content={effectiveOgImage} />

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};
