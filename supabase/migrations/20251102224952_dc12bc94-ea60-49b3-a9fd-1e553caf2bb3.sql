-- Fix security warnings by setting search_path for functions
DROP FUNCTION IF EXISTS get_order_funnel_analytics();
DROP FUNCTION IF EXISTS get_most_viewed_products_tracking(integer);

-- Function to get funnel analytics with proper search_path
CREATE OR REPLACE FUNCTION get_order_funnel_analytics()
RETURNS TABLE (
  step TEXT,
  count BIGINT,
  conversion_rate NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_views BIGINT;
BEGIN
  -- Get total views (first step in funnel)
  SELECT COUNT(DISTINCT user_id) INTO total_views
  FROM order_tracking
  WHERE step = 'viewed';

  -- If no views, return empty result
  IF total_views = 0 THEN
    RETURN;
  END IF;

  -- Return funnel data
  RETURN QUERY
  SELECT 
    ot.step::TEXT as step,
    COUNT(DISTINCT ot.user_id) as count,
    ROUND((COUNT(DISTINCT ot.user_id)::NUMERIC / total_views * 100), 2) as conversion_rate
  FROM order_tracking ot
  GROUP BY ot.step
  ORDER BY 
    CASE ot.step
      WHEN 'viewed' THEN 1
      WHEN 'added_to_pallet' THEN 2
      WHEN 'requested' THEN 3
      WHEN 'pending_confirmation' THEN 4
      WHEN 'confirmed' THEN 5
      WHEN 'paid' THEN 6
      WHEN 'shipped' THEN 7
      WHEN 'delivered' THEN 8
    END;
END;
$$;

-- Function to get most viewed products with proper search_path
CREATE OR REPLACE FUNCTION get_most_viewed_products_tracking(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  view_count BIGINT
)
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(DISTINCT ot.user_id) as view_count
  FROM order_tracking ot
  JOIN products p ON p.id = ot.product_id
  WHERE ot.step = 'viewed'
  GROUP BY p.id, p.name
  ORDER BY view_count DESC
  LIMIT limit_count;
END;
$$;