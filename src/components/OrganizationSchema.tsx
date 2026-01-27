import { Helmet } from "react-helmet-async";
import { SITE_CONFIG } from "@/lib/siteConfig";

/**
 * Renders Organization and WebSite Schema.org structured data
 * Should be rendered once globally in App.tsx
 */
export function OrganizationSchema() {
  const organizationSchema = {
    "@type": "Organization",
    "@id": `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    email: SITE_CONFIG.email,
    ...(SITE_CONFIG.logo && { logo: SITE_CONFIG.logo }),
    sameAs: [],
  };

  const websiteSchema = {
    "@type": "WebSite",
    "@id": `${SITE_CONFIG.url}/#website`,
    url: SITE_CONFIG.url,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    publisher: {
      "@id": `${SITE_CONFIG.url}/#organization`,
    },
    inLanguage: SITE_CONFIG.language,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/catalogo?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [organizationSchema, websiteSchema],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
