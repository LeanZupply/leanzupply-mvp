-- Corregir la función get_order_funnel_analytics para evitar referencias ambiguas
DROP FUNCTION IF EXISTS public.get_order_funnel_analytics();

CREATE OR REPLACE FUNCTION public.get_order_funnel_analytics()
RETURNS TABLE(step text, count bigint, conversion_rate numeric)
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
  WHERE order_tracking.step = 'viewed';

  -- If no views, return empty result
  IF total_views = 0 THEN
    RETURN;
  END IF;

  -- Return funnel data with explicit table prefix
  RETURN QUERY
  SELECT 
    order_tracking.step::TEXT as step,
    COUNT(DISTINCT order_tracking.user_id) as count,
    ROUND((COUNT(DISTINCT order_tracking.user_id)::NUMERIC / total_views * 100), 2) as conversion_rate
  FROM order_tracking
  GROUP BY order_tracking.step
  ORDER BY 
    CASE order_tracking.step
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