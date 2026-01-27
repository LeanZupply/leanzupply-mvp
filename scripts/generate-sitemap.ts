/**
 * Sitemap Generator for LeanZupply
 *
 * This script generates a sitemap.xml file at build time.
 * It fetches all active products from Supabase and combines them
 * with static pages and category URLs.
 *
 * Usage:
 *   npx tsx scripts/generate-sitemap.ts
 *
 * Environment variables required:
 *   - VITE_SUPABASE_URL or SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (for build-time access)
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Domain configuration (override with SITE_URL or VITE_SITE_URL for dev/prod)
const DOMAIN = process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://leanzupply.com';

// Category slugs (must match src/lib/categories.ts)
const CATEGORY_SLUGS = [
  'cocina-restauracion',
  'panaderia-pasteleria',
  'carniceria-chacinados',
  'heladeria-pasteleria-fria',
  'refrigeracion-comercial-industrial',
  'packaging-envasado',
  'mobiliario-equipamiento-hoteles',
  'equipamiento-audiovisual-eventos',
  'movilidad-logistica-intralogistica',
  'ferreteria-construccion',
  'vending-automatizacion-comercial',
  'centros-entrenamiento-gimnasios',
];

// Static pages
const STATIC_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/catalogo', priority: '0.9', changefreq: 'daily' },
  { loc: '/auth/login', priority: '0.3', changefreq: 'monthly' },
  { loc: '/auth/signup', priority: '0.5', changefreq: 'monthly' },
  { loc: '/legal/privacidad', priority: '0.2', changefreq: 'yearly' },
  { loc: '/legal/cookies', priority: '0.2', changefreq: 'yearly' },
];

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

async function generateSitemap() {
  console.log('🗺️  Generating sitemap...');

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let products: { slug: string | null; updated_at?: string | null }[] = [];

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Missing Supabase credentials, generating sitemap without product URLs.');
    console.warn('   - VITE_SUPABASE_URL or SUPABASE_URL');
    console.warn('   - SUPABASE_SERVICE_ROLE_KEY');
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active products with slugs
    console.log('📦 Fetching products from Supabase...');
    const { data, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'active')
      .not('slug', 'is', null);

    if (error) {
      console.error('❌ Error fetching products:', error.message);
      process.exit(1);
    }

    products = data || [];
    console.log(`   Found ${products?.length || 0} active products with slugs`);
  }

  // Build URL list
  const urls: SitemapUrl[] = [];

  // Add static pages
  for (const page of STATIC_PAGES) {
    urls.push({
      loc: `${DOMAIN}${page.loc}`,
      priority: page.priority,
      changefreq: page.changefreq,
    });
  }

  // Add category pages
  for (const slug of CATEGORY_SLUGS) {
    urls.push({
      loc: `${DOMAIN}/categoria/${slug}`,
      priority: '0.8',
      changefreq: 'weekly',
    });
  }

  // Add product pages
  for (const product of products || []) {
    if (product.slug) {
      urls.push({
        loc: `${DOMAIN}/producto/${product.slug}`,
        lastmod: product.updated_at?.split('T')[0],
        priority: '0.6',
        changefreq: 'weekly',
      });
    }
  }

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}${u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : ''}${u.priority ? `    <priority>${u.priority}</priority>\n` : ''}  </url>`
  )
  .join('\n')}
</urlset>`;

  // Write to public directory
  const publicDir = join(__dirname, '..', 'public');
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = join(publicDir, 'sitemap.xml');
  writeFileSync(outputPath, sitemap);

  console.log(`✅ Sitemap generated successfully!`);
  console.log(`   📍 Location: ${outputPath}`);
  console.log(`   📊 Total URLs: ${urls.length}`);
  console.log(`      - Static pages: ${STATIC_PAGES.length}`);
  console.log(`      - Categories: ${CATEGORY_SLUGS.length}`);
  console.log(`      - Products: ${products?.length || 0}`);
}

// Run the generator
generateSitemap().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
