/**
 * Centralized site configuration for SEO and structured data
 */
export const SITE_CONFIG = {
  name: "LeanZupply",
  url: "https://leanzupply.com",
  description: "Plataforma D2B para equipamiento industrial que conecta fabricantes certificados con empresas de todo el mundo.",
  email: "info@leanzupply.com",
  logo: null as string | null, // Add logo URL when available
  language: "es-ES",
  currency: "EUR",
  defaultImage: "https://leanzupply.com/OG-image.png",
} as const;
