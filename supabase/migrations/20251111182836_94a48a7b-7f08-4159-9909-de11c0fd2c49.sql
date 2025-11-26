-- Actualizar funciones para aceptar parámetros de fecha

-- 1. Actualizar get_orders_stats para filtrar por fechas
CREATE OR REPLACE FUNCTION public.get_orders_stats(
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(total_orders bigint, completed_orders bigint, pending_orders bigint, total_income numeric, avg_order_value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_orders,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_orders,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_orders,
    COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) AS total_income,
    COALESCE(AVG(total_price) FILTER (WHERE status = 'completed'), 0) AS avg_order_value
  FROM orders
  WHERE (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$function$;

-- 2. Actualizar get_top_products para filtrar por fechas
CREATE OR REPLACE FUNCTION public.get_top_products(
  limit_count integer DEFAULT 10,
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(name text, total_orders bigint, total_revenue numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.name,
    COUNT(o.id)::BIGINT AS total_orders,
    COALESCE(SUM(o.total_price), 0) AS total_revenue
  FROM products p
  LEFT JOIN orders o ON o.product_id = p.id
    AND (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  WHERE p.status = 'active'
  GROUP BY p.id, p.name
  ORDER BY total_orders DESC, total_revenue DESC
  LIMIT limit_count;
END;
$function$;

-- 3. Actualizar get_top_manufacturers para filtrar por fechas
CREATE OR REPLACE FUNCTION public.get_top_manufacturers(
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(name text, total_products bigint, total_sales numeric, total_orders bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    prof.company_name AS name,
    COUNT(DISTINCT p.id)::BIGINT AS total_products,
    COALESCE(SUM(o.total_price) FILTER (
      WHERE o.status = 'completed'
        AND (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    ), 0) AS total_sales,
    COUNT(o.id) FILTER (
      WHERE o.status = 'completed'
        AND (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    )::BIGINT AS total_orders
  FROM profiles prof
  LEFT JOIN products p ON p.manufacturer_id = prof.id
  LEFT JOIN orders o ON o.manufacturer_id = prof.id
  WHERE prof.role = 'manufacturer'
  GROUP BY prof.id, prof.company_name
  ORDER BY total_sales DESC, total_orders DESC
  LIMIT 5;
END;
$function$;

-- 4. Actualizar get_orders_by_country para filtrar por fechas
CREATE OR REPLACE FUNCTION public.get_orders_by_country(
  p_start_date timestamp with time zone DEFAULT NULL,
  p_end_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(country text, total_orders bigint, total_amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.country, 'No especificado') AS country,
    COUNT(o.id)::BIGINT AS total_orders,
    COALESCE(SUM(o.total_price), 0) AS total_amount
  FROM orders o
  LEFT JOIN profiles p ON p.id = o.buyer_id
  WHERE (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  GROUP BY p.country
  ORDER BY total_orders DESC
  LIMIT 5;
END;
$function$;