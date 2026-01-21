-- Migration: Add slug column to products table for SEO-friendly URLs
-- This migration adds a unique slug field and generates slugs for existing products

-- Enable unaccent extension if not already enabled (for handling Spanish accents)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Add slug column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug (allows NULL but unique non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL;

-- Function to generate a slug from product name
CREATE OR REPLACE FUNCTION generate_product_slug(product_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
BEGIN
  -- Convert to lowercase, remove accents, replace non-alphanumeric with hyphens
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        unaccent(product_name),
        '[^a-zA-Z0-9]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  );
  -- Remove consecutive hyphens
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique slug (appends counter if needed)
CREATE OR REPLACE FUNCTION generate_unique_product_slug(product_id UUID, product_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 2;
BEGIN
  base_slug := generate_product_slug(product_name);
  final_slug := base_slug;

  -- Check if slug already exists (excluding current product)
  WHILE EXISTS (
    SELECT 1 FROM products
    WHERE slug = final_slug
    AND id != product_id
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for all existing products that don't have one
DO $$
DECLARE
  product_record RECORD;
BEGIN
  FOR product_record IN
    SELECT id, name FROM products WHERE slug IS NULL
  LOOP
    UPDATE products
    SET slug = generate_unique_product_slug(product_record.id, product_record.name)
    WHERE id = product_record.id;
  END LOOP;
END $$;

-- Make slug NOT NULL after populating existing records
-- (Commenting out for now to allow gradual migration - uncomment when ready)
-- ALTER TABLE products ALTER COLUMN slug SET NOT NULL;

-- Create trigger to auto-generate slug on INSERT if not provided
CREATE OR REPLACE FUNCTION products_generate_slug_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_product_slug(NEW.id, NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_auto_slug ON products;
CREATE TRIGGER products_auto_slug
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_generate_slug_trigger();

-- Add comment for documentation
COMMENT ON COLUMN products.slug IS 'SEO-friendly URL slug for the product, auto-generated from name';
