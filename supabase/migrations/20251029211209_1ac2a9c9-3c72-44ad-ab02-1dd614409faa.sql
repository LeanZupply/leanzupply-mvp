-- Add new fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS specs TEXT,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS material TEXT,
ADD COLUMN IF NOT EXISTS dimensions TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT;

-- Create function to increment product views
CREATE OR REPLACE FUNCTION increment_product_views(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get top viewed products
CREATE OR REPLACE FUNCTION get_top_viewed_products(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  manufacturer_name TEXT,
  views_count INTEGER,
  category TEXT,
  price_unit NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    prof.company_name AS manufacturer_name,
    COALESCE(p.views_count, 0) AS views_count,
    p.category,
    p.price_unit
  FROM products p
  LEFT JOIN profiles prof ON prof.id = p.manufacturer_id
  WHERE p.status = 'active'
  ORDER BY COALESCE(p.views_count, 0) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get user stats by city
CREATE OR REPLACE FUNCTION get_users_by_city()
RETURNS TABLE(
  city TEXT,
  total_users BIGINT,
  manufacturers BIGINT,
  buyers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.city, 'No especificado') AS city,
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE p.role = 'manufacturer')::BIGINT AS manufacturers,
    COUNT(*) FILTER (WHERE p.role = 'buyer')::BIGINT AS buyers
  FROM profiles p
  GROUP BY p.city
  ORDER BY total_users DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;