/**
 * SEO Helper functions for building optimized meta tags and structured data
 */

/**
 * Detects placeholder/invalid product names
 * Returns false for: UUIDs, "Producto 1", "test", "untitled", etc.
 */
export function isValidProductTitle(name: string | null | undefined): boolean {
  if (!name || name.trim().length === 0) return false;

  const trimmed = name.trim().toLowerCase();

  // UUID pattern (8-4-4-4-12 hex chars)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(trimmed)) return false;

  // Common placeholder patterns
  const placeholderPatterns = [
    /^producto\s*\d*$/i,           // "Producto", "Producto 1", "Producto 123"
    /^product\s*\d*$/i,            // "Product", "Product 1"
    /^test\s*\d*$/i,               // "test", "test1", "test 123"
    /^untitled\s*\d*$/i,           // "untitled", "Untitled 1"
    /^sin\s*nombre$/i,             // "sin nombre"
    /^nuevo\s*producto$/i,         // "nuevo producto"
    /^new\s*product$/i,            // "new product"
    /^sample\s*\d*$/i,             // "sample", "sample1"
    /^ejemplo\s*\d*$/i,            // "ejemplo", "ejemplo 1"
    /^prueba\s*\d*$/i,             // "prueba", "prueba 1"
    /^temp\s*\d*$/i,               // "temp", "temp1"
    /^tmp\s*\d*$/i,                // "tmp", "tmp1"
    /^draft\s*\d*$/i,              // "draft", "draft 1"
    /^borrador\s*\d*$/i,           // "borrador", "borrador 1"
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(trimmed)) return false;
  }

  // Too short (less than 3 chars after trimming)
  if (trimmed.length < 3) return false;

  return true;
}

interface ProductSeoTitleParams {
  name: string | null | undefined;
  brand: string | null | undefined;
  model: string | null | undefined;
  category: string | null | undefined;
}

/**
 * Builds SEO-optimized product title
 * Output format: `{brand} {model} - {name} | {category}`
 * Falls back gracefully when brand/model missing
 */
export function buildProductSeoTitle({
  name,
  brand,
  model,
  category,
}: ProductSeoTitleParams): string {
  const validName = isValidProductTitle(name);
  const hasBrand = brand && brand.trim().length > 0;
  const hasModel = model && model.trim().length > 0;
  const hasCategory = category && category.trim().length > 0;

  // Build brand/model prefix
  let brandModelPrefix = "";
  if (hasBrand && hasModel) {
    brandModelPrefix = `${brand.trim()} ${model.trim()}`;
  } else if (hasBrand) {
    brandModelPrefix = brand.trim();
  } else if (hasModel) {
    brandModelPrefix = model.trim();
  }

  // Build category suffix
  const categorySuffix = hasCategory ? category.trim() : "Equipamiento Profesional";

  // Assemble title based on available data
  if (validName && brandModelPrefix) {
    // Best case: Brand/Model + Name + Category
    return `${brandModelPrefix} - ${name!.trim()} | ${categorySuffix}`;
  } else if (validName) {
    // Only name available
    return `${name!.trim()} | ${categorySuffix}`;
  } else if (brandModelPrefix) {
    // Invalid name but brand/model available
    return `${brandModelPrefix} | ${categorySuffix}`;
  } else {
    // Fallback: just category
    return `${categorySuffix} - Equipamiento Profesional`;
  }
}

interface ProductSeoDescriptionParams {
  description: string | null | undefined;
  name: string | null | undefined;
  brand: string | null | undefined;
  model: string | null | undefined;
  category: string | null | undefined;
}

/**
 * Builds SEO-optimized product description
 * Prepends brand/model to description if available
 * Generates fallback description if none exists
 * Truncates to 160 chars
 */
export function buildProductSeoDescription({
  description,
  name,
  brand,
  model,
  category,
}: ProductSeoDescriptionParams): string {
  const hasBrand = brand && brand.trim().length > 0;
  const hasModel = model && model.trim().length > 0;
  const hasDescription = description && description.trim().length > 0;
  const validName = isValidProductTitle(name);

  // Build brand/model prefix for description
  let brandModelPrefix = "";
  if (hasBrand && hasModel) {
    brandModelPrefix = `${brand.trim()} ${model.trim()}`;
  } else if (hasBrand) {
    brandModelPrefix = brand.trim();
  } else if (hasModel) {
    brandModelPrefix = model.trim();
  }

  let result: string;

  if (hasDescription && brandModelPrefix) {
    // Prepend brand/model to description
    result = `${brandModelPrefix}: ${description.trim()}`;
  } else if (hasDescription) {
    // Just use description
    result = description.trim();
  } else if (brandModelPrefix && validName) {
    // Generate fallback with brand/model and name
    result = `Compra ${brandModelPrefix} ${name!.trim()} de fabricantes certificados en LeanZupply. Precio FOB directo de fábrica.`;
  } else if (validName) {
    // Generate fallback with just name
    result = `Compra ${name!.trim()} de fabricantes certificados en LeanZupply. Precio FOB directo de fábrica.`;
  } else if (brandModelPrefix) {
    // Generate fallback with just brand/model
    result = `Compra ${brandModelPrefix} de fabricantes certificados en LeanZupply. Precio FOB directo de fábrica.`;
  } else {
    // Ultimate fallback
    const cat = category && category.trim().length > 0 ? category.trim() : "equipamiento profesional";
    result = `Compra ${cat} de fabricantes certificados en LeanZupply. Precio FOB directo de fábrica.`;
  }

  // Truncate to 160 characters
  if (result.length > 160) {
    return result.substring(0, 157) + "...";
  }

  return result;
}

interface ProductJsonLdParams {
  product: {
    name: string;
    description: string | null;
    images: { url: string; alt: string }[];
    sku: string | null;
    brand: string | null;
    model: string | null;
    category: string;
    price_unit: number;
    stock: number;
    id: string;
  };
  manufacturer: {
    registered_brand: string;
    legal_name?: string;
  } | null;
  productUrl: string;
}

interface ProductJsonLdOutput {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  image: string[];
  sku: string;
  url: string;
  category: string;
  brand?: {
    "@type": "Brand";
    name: string;
  };
  mpn?: string;
  manufacturer?: {
    "@type": "Organization";
    name: string;
  };
  offers: {
    "@type": "Offer";
    priceCurrency: string;
    price: number;
    availability: string;
    seller?: {
      "@type": "Organization";
      name: string;
    };
  };
}

/**
 * Builds JSON-LD structured data for product
 * Adds `mpn` field using product.model
 * Adds `manufacturer` object using legal_name
 * Uses `@type: "Brand"` for brand (not Organization)
 * Cleans undefined values from output
 */
export function buildProductJsonLd({
  product,
  manufacturer,
  productUrl,
}: ProductJsonLdParams): ProductJsonLdOutput {
  const hasBrand = product.brand && product.brand.trim().length > 0;
  const hasModel = product.model && product.model.trim().length > 0;
  const hasLegalName = manufacturer?.legal_name && manufacturer.legal_name.trim().length > 0;
  const hasRegisteredBrand = manufacturer?.registered_brand && manufacturer.registered_brand.trim().length > 0;

  // Build base structure
  const jsonLd: ProductJsonLdOutput = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `Compra ${product.name} de fabricantes certificados en LeanZupply.`,
    image: product.images.map((img) => img.url),
    sku: product.sku || product.id,
    url: productUrl,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.price_unit,
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  // Add brand if available (using Brand type, not Organization)
  if (hasBrand) {
    jsonLd.brand = {
      "@type": "Brand",
      name: product.brand!.trim(),
    };
  } else if (hasRegisteredBrand) {
    // Fallback to manufacturer's registered brand
    jsonLd.brand = {
      "@type": "Brand",
      name: manufacturer!.registered_brand.trim(),
    };
  }

  // Add MPN (Manufacturer Part Number) if model is available
  if (hasModel) {
    jsonLd.mpn = product.model!.trim();
  }

  // Add manufacturer if legal_name is available
  if (hasLegalName) {
    jsonLd.manufacturer = {
      "@type": "Organization",
      name: manufacturer!.legal_name!.trim(),
    };
  }

  // Add seller to offers if manufacturer available
  if (hasRegisteredBrand) {
    jsonLd.offers.seller = {
      "@type": "Organization",
      name: manufacturer!.registered_brand.trim(),
    };
  }

  return jsonLd;
}
