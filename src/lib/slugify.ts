/**
 * Generates a URL-friendly slug from a given text string.
 * Handles Spanish characters (accents, ñ) and special characters.
 *
 * @param text - The text to convert to a slug
 * @returns A lowercase, hyphenated slug
 *
 * @example
 * slugify("Amasadora Industrial 20L") // "amasadora-industrial-20l"
 * slugify("Horno de Convección") // "horno-de-conveccion"
 * slugify("Máquina para Panadería") // "maquina-para-panaderia"
 */
export function slugify(text: string): string {
  // Character replacements for Spanish/accented characters
  const charMap: Record<string, string> = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
    'ñ': 'n',
    'ç': 'c',
    '&': 'y',
  };

  return text
    .toLowerCase()
    .trim()
    // Replace special characters
    .split('')
    .map(char => charMap[char] || char)
    .join('')
    // Replace any non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Replace multiple consecutive hyphens with a single one
    .replace(/-+/g, '-');
}

/**
 * Generates a unique slug by appending a numeric suffix if needed.
 * Used when a slug already exists in the database.
 *
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 *
 * @example
 * generateUniqueSlug("amasadora-20l", ["amasadora-20l"]) // "amasadora-20l-2"
 * generateUniqueSlug("amasadora-20l", ["amasadora-20l", "amasadora-20l-2"]) // "amasadora-20l-3"
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

/**
 * Checks if a string is a valid UUID v4.
 * Used to distinguish between UUID-based and slug-based product lookups.
 *
 * @param str - The string to check
 * @returns True if the string is a valid UUID v4
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
