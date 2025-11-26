-- Fix track_order_step to cast text to enum tracking_step
CREATE OR REPLACE FUNCTION public.track_order_step(
  p_user_id uuid,
  p_product_id uuid,
  p_order_id uuid,
  p_step text,
  p_session_id text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO order_tracking (user_id, product_id, order_id, step, session_id, created_at)
  VALUES (
    p_user_id,
    p_product_id,
    p_order_id,
    p_step::tracking_step,
    p_session_id,
    now()
  );
EXCEPTION WHEN invalid_text_representation THEN
  -- Ignore invalid step values to avoid breaking UX; record as 'viewed' fallback
  INSERT INTO order_tracking (user_id, product_id, order_id, step, session_id, created_at)
  VALUES (
    p_user_id,
    p_product_id,
    p_order_id,
    'viewed'::tracking_step,
    p_session_id,
    now()
  );
END;
$$;