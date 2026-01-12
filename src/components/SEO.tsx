import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  type?: 'website' | 'product';
  noindex?: boolean;
}

const DEFAULT_IMAGE = 'https://leanzupply.com/OG-image.png';
const SITE_NAME = 'LeanZupply';

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  type = 'website',
  noindex = false
}: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const image = ogImage || DEFAULT_IMAGE;
  const truncatedDescription = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={truncatedDescription} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={image} />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
