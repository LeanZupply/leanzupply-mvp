-- Fix ambiguous column reference in get_order_funnel_analytics function
CREATE OR REPLACE FUNCTION public.get_order_funnel_analytics()
 RETURNS TABLE(step text, count bigint, conversion_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_views bigint;
BEGIN
  -- Get total views as baseline
  SELECT COUNT(*) INTO total_views
  FROM order_tracking
  WHERE order_tracking.step = 'viewed_product';

  RETURN QUERY
  SELECT 
    ot.step,
    COUNT(*)::bigint as count,
    CASE 
      WHEN total_views > 0 THEN ROUND((COUNT(*)::numeric / total_views::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM order_tracking ot
  GROUP BY ot.step
  ORDER BY 
    CASE 
      WHEN ot.step = 'viewed_product' THEN 1
      WHEN ot.step = 'clicked_order' THEN 2
      WHEN ot.step = 'registered' THEN 3
      WHEN ot.step = 'checkout_started' THEN 4
      WHEN ot.step = 'payment_initiated' THEN 5
      WHEN ot.step = 'order_submitted' THEN 6
      ELSE 7
    END;
END;
$function$;