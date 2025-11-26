-- Create RPC functions for dashboard statistics

-- Function: Get users statistics
CREATE OR REPLACE FUNCTION get_users_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_manufacturers BIGINT,
  total_buyers BIGINT,
  total_superadmins BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE role = 'manufacturer')::BIGINT AS total_manufacturers,
    COUNT(*) FILTER (WHERE role = 'buyer')::BIGINT AS total_buyers,
    COUNT(*) FILTER (WHERE role = 'superadmin')::BIGINT AS total_superadmins
  FROM profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get products statistics
CREATE OR REPLACE FUNCTION get_products_stats()
RETURNS TABLE (
  total_products BIGINT,
  active_products BIGINT,
  pending_products BIGINT,
  rejected_products BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_products,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT AS active_products,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_products,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT AS rejected_products
  FROM products;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get orders statistics
CREATE OR REPLACE FUNCTION get_orders_stats()
RETURNS TABLE (
  total_orders BIGINT,
  completed_orders BIGINT,
  pending_orders BIGINT,
  total_income NUMERIC,
  avg_order_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_orders,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_orders,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_orders,
    COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) AS total_income,
    COALESCE(AVG(total_price) FILTER (WHERE status = 'completed'), 0) AS avg_order_value
  FROM orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get categories statistics
CREATE OR REPLACE FUNCTION get_categories_stats()
RETURNS TABLE (
  total_categories BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(DISTINCT category)::BIGINT AS total_categories
  FROM products
  WHERE category IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get top products by orders
CREATE OR REPLACE FUNCTION get_top_products()
RETURNS TABLE (
  name TEXT,
  total_orders BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name,
    COUNT(o.id)::BIGINT AS total_orders,
    COALESCE(SUM(o.total_price), 0) AS total_revenue
  FROM products p
  LEFT JOIN orders o ON o.product_id = p.id
  WHERE p.status = 'active'
  GROUP BY p.id, p.name
  ORDER BY total_orders DESC, total_revenue DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get products by category
CREATE OR REPLACE FUNCTION get_products_by_category()
RETURNS TABLE (
  category TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.category, 'Sin Categoría') AS category,
    COUNT(p.id)::BIGINT AS count
  FROM products p
  WHERE p.status = 'active'
  GROUP BY p.category
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get top manufacturers by sales
CREATE OR REPLACE FUNCTION get_top_manufacturers()
RETURNS TABLE (
  name TEXT,
  total_products BIGINT,
  total_sales NUMERIC,
  total_orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prof.company_name AS name,
    COUNT(DISTINCT p.id)::BIGINT AS total_products,
    COALESCE(SUM(o.total_price) FILTER (WHERE o.status = 'completed'), 0) AS total_sales,
    COUNT(o.id) FILTER (WHERE o.status = 'completed')::BIGINT AS total_orders
  FROM profiles prof
  LEFT JOIN products p ON p.manufacturer_id = prof.id
  LEFT JOIN orders o ON o.manufacturer_id = prof.id
  WHERE prof.role = 'manufacturer'
  GROUP BY prof.id, prof.company_name
  ORDER BY total_sales DESC, total_orders DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get orders by country
CREATE OR REPLACE FUNCTION get_orders_by_country()
RETURNS TABLE (
  country TEXT,
  total_orders BIGINT,
  total_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.country, 'No especificado') AS country,
    COUNT(o.id)::BIGINT AS total_orders,
    COALESCE(SUM(o.total_price), 0) AS total_amount
  FROM orders o
  LEFT JOIN profiles p ON p.id = o.buyer_id
  GROUP BY p.country
  ORDER BY total_orders DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get recent activity
CREATE OR REPLACE FUNCTION get_recent_activity()
RETURNS TABLE (
  action TEXT,
  entity TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.action,
    al.entity,
    al.created_at,
    p.email AS user_email
  FROM activity_log al
  LEFT JOIN profiles p ON p.id = al.user_id
  ORDER BY al.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_users_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_products_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_categories_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products() TO authenticated;
GRANT EXECUTE ON FUNCTION get_products_by_category() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_manufacturers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_by_country() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity() TO authenticated;