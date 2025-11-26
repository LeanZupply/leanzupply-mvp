-- Fix increment_product_views function to add session-based deduplication
-- This prevents view count manipulation by checking if the same session viewed recently

CREATE OR REPLACE FUNCTION public.increment_product_views(
  p_product_id uuid,
  p_session_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only increment if this session hasn't viewed this product recently (last hour)
  IF p_session_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM order_tracking
    WHERE product_id = p_product_id
      AND session_id = p_session_id
      AND step = 'viewed'
      AND created_at > now() - interval '1 hour'
  ) THEN
    UPDATE products
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_product_id;
  END IF;
END;
$function$;