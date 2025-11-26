-- Update order_tracking table to include session_id if not exists
ALTER TABLE order_tracking 
ADD COLUMN IF NOT EXISTS session_id text;

-- Ensure timestamp column exists with proper default
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='order_tracking' AND column_name='timestamp'
  ) THEN
    ALTER TABLE order_tracking ADD COLUMN timestamp timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_order_tracking_user_product ON order_tracking(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_step ON order_tracking(step);
CREATE INDEX IF NOT EXISTS idx_order_tracking_timestamp ON order_tracking(created_at DESC);

-- Update orders table to include session tracking
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS session_id text;

-- Create function to track order steps
CREATE OR REPLACE FUNCTION track_order_step(
  p_user_id uuid,
  p_product_id uuid,
  p_order_id uuid,
  p_step text,
  p_session_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO order_tracking (user_id, product_id, order_id, step, session_id, created_at)
  VALUES (p_user_id, p_product_id, p_order_id, p_step, p_session_id, now());
END;
$$;

-- Create function to get funnel analytics
CREATE OR REPLACE FUNCTION get_order_funnel_analytics()
RETURNS TABLE (
  step text,
  count bigint,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_views bigint;
BEGIN
  -- Get total views as baseline
  SELECT COUNT(*) INTO total_views
  FROM order_tracking
  WHERE step = 'viewed_product';

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
    CASE ot.step
      WHEN 'viewed_product' THEN 1
      WHEN 'clicked_order' THEN 2
      WHEN 'registered' THEN 3
      WHEN 'checkout_started' THEN 4
      WHEN 'payment_initiated' THEN 5
      WHEN 'order_submitted' THEN 6
      ELSE 7
    END;
END;
$$;

-- Create function to get most viewed products with tracking
CREATE OR REPLACE FUNCTION get_most_viewed_products_tracking(limit_count integer DEFAULT 10)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  view_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ot.product_id,
    p.name as product_name,
    COUNT(*)::bigint as view_count
  FROM order_tracking ot
  INNER JOIN products p ON p.id = ot.product_id
  WHERE ot.step = 'viewed_product'
  GROUP BY ot.product_id, p.name
  ORDER BY view_count DESC
  LIMIT limit_count;
END;
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert tracking" ON order_tracking;

-- Create new policy for inserting tracking (allow anonymous)
CREATE POLICY "Anyone can insert tracking" ON order_tracking
  FOR INSERT
  WITH CHECK (true);