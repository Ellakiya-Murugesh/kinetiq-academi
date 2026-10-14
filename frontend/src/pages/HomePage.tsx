import React from 'react';
import { SEO } from '../components/ui/SEO';
import { HeroSection } from '../components/ui/HeroSection';
import { ExamSelector } from '../components/sections/ExamSelector';
import { WhyPrepare } from '../components/sections/WhyPrepare';
import { HowWeHelp } from '../components/sections/HowWeHelp';
import { CTASection } from '../components/ui/CTASection';
import { PricingSection } from '../components/sections/PricingSection';
import { GuidanceCall } from '../components/sections/GuidanceCall';
import { HomeFAQ } from '../components/sections/HomeFAQ';
import {
  BRAND_HOME_DESCRIPTION,
  BRAND_HOME_TITLE,
  BRAND_OG_DESCRIPTION,
  BRAND_OG_TITLE,
} from '../config/brand';

export const HomePage: React.FC = () => {
  return (
    <>
      <SEO
        title={BRAND_HOME_TITLE}
        description={BRAND_HOME_DESCRIPTION}
        ogTitle={BRAND_OG_TITLE}
        ogDescription={BRAND_OG_DESCRIPTION}
      />
      <div className="space-y-0">
        <HeroSection />
        <ExamSelector />
        <WhyPrepare />
        <HowWeHelp />
        <CTASection />
        <PricingSection />
        <GuidanceCall />
        <HomeFAQ />
      </div>
    </>
  );
};

export default HomePage;
