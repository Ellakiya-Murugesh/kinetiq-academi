import React from 'react';
import { BRAND_LOGO_ALT, BRAND_LOGO_PATH } from '../../config/brand';

interface BrandLogoProps {
  className?: string;
  loading?: 'eager' | 'lazy';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-12 w-auto',
  loading = 'lazy',
}) => (
  <img
    src={BRAND_LOGO_PATH}
    alt={BRAND_LOGO_ALT}
    width={768}
    height={960}
    loading={loading}
    decoding="async"
    className={className}
  />
);