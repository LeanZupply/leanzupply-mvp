-- Fix all SECURITY DEFINER functions to include SET search_path = public

-- 1. get_users_stats
CREATE OR REPLACE FUNCTION public.get_users_stats()
RETURNS TABLE(total_users bigint, total_manufacturers bigint, total_buyers bigint, total_superadmins bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE role = 'manufacturer')::BIGINT AS total_manufacturers,
    COUNT(*) FILTER (WHERE role = 'buyer')::BIGINT AS total_buyers,
    COUNT(*) FILTER (WHERE role = 'superadmin')::BIGINT AS total_superadmins
  FROM profiles;
END;
$function$;

-- 2. get_products_stats
CREATE OR REPLACE FUNCTION public.get_products_stats()
RETURNS TABLE(total_products bigint, active_products bigint, pending_products bigint, rejected_products bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_products,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT AS active_products,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_products,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT AS rejected_products
  FROM products;
END;
$function$;

-- 3. get_orders_stats
CREATE OR REPLACE FUNCTION public.get_orders_stats()
RETURNS TABLE(total_orders bigint, completed_orders bigint, pending_orders bigint, total_income numeric, avg_order_value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 4. get_categories_stats
CREATE OR REPLACE FUNCTION public.get_categories_stats()
RETURNS TABLE(total_categories bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT COUNT(DISTINCT category)::BIGINT AS total_categories
  FROM products
  WHERE category IS NOT NULL;
END;
$function$;

-- 5. get_top_products
CREATE OR REPLACE FUNCTION public.get_top_products()
RETURNS TABLE(name text, total_orders bigint, total_revenue numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 6. get_top_manufacturers
CREATE OR REPLACE FUNCTION public.get_top_manufacturers()
RETURNS TABLE(name text, total_products bigint, total_sales numeric, total_orders bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 7. get_orders_by_country
CREATE OR REPLACE FUNCTION public.get_orders_by_country()
RETURNS TABLE(country text, total_orders bigint, total_amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 8. get_products_by_category
CREATE OR REPLACE FUNCTION public.get_products_by_category()
RETURNS TABLE(category text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 9. get_recent_activity
CREATE OR REPLACE FUNCTION public.get_recent_activity()
RETURNS TABLE(action text, entity text, created_at timestamp with time zone, user_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 10. handle_new_user (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO profiles (id, email, full_name, company_name, country, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer')
  );
  RETURN NEW;
END;
$function$;

-- 11. handle_new_order
CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_manufacturer_id UUID;
  v_superadmin_id UUID;
  v_product_name TEXT;
BEGIN
  SELECT manufacturer_id, name INTO v_manufacturer_id, v_product_name
  FROM products 
  WHERE id = NEW.product_id;

  IF v_manufacturer_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      v_manufacturer_id,
      'New Order Received',
      'You have received a new order for ' || v_product_name || ' (' || NEW.quantity || ' units)',
      'order',
      false
    );
  END IF;

  SELECT id INTO v_superadmin_id 
  FROM profiles 
  WHERE role = 'superadmin' 
  LIMIT 1;
  
  IF v_superadmin_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      v_superadmin_id,
      'New Order Created',
      'Order placed for ' || v_product_name || ' by buyer',
      'system',
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 12. handle_order_status_update
CREATE OR REPLACE FUNCTION public.handle_order_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_product_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT name INTO v_product_name
    FROM products
    WHERE id = NEW.product_id;
    
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.buyer_id,
      'Order Status Updated',
      'Your order for ' || COALESCE(v_product_name, 'product') || ' is now: ' || REPLACE(NEW.status, '_', ' '),
      'order',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 13. handle_document_verification
CREATE OR REPLACE FUNCTION public.handle_document_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false) THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.user_id,
      'Document Verified ✓',
      'Your ' || NEW.type || ' document has been verified by admin',
      'validation',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 14. handle_new_product
CREATE OR REPLACE FUNCTION public.handle_new_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_superadmin_id UUID;
BEGIN
  SELECT id INTO v_superadmin_id 
  FROM profiles 
  WHERE role = 'superadmin' 
  LIMIT 1;
  
  IF v_superadmin_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      v_superadmin_id,
      'Nuevo Producto para Revisar',
      'El fabricante ha cargado un nuevo producto: ' || NEW.name || '. Por favor revisalo.',
      'product',
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 15. handle_product_status_update
CREATE OR REPLACE FUNCTION public.handle_product_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.manufacturer_id,
      CASE NEW.status
        WHEN 'active' THEN '✅ Producto Aprobado'
        WHEN 'rejected' THEN '❌ Producto Rechazado'
        ELSE '⚙️ Producto Actualizado'
      END,
      'Tu producto "' || NEW.name || '" ahora está en estado: ' || NEW.status || 
      CASE 
        WHEN NEW.status = 'rejected' AND NEW.admin_notes IS NOT NULL 
        THEN '. Nota del admin: ' || NEW.admin_notes
        ELSE ''
      END,
      'product',
      false
    );

    IF NEW.status = 'active' AND OLD.status != 'active' THEN
      NEW.validated_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 16. notify_profile_update
CREATE OR REPLACE FUNCTION public.notify_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_superadmin_id UUID;
BEGIN
  IF NEW.role = 'manufacturer' AND (
    NEW.company_name IS DISTINCT FROM OLD.company_name OR
    NEW.country IS DISTINCT FROM OLD.country OR
    NEW.verification_status IS DISTINCT FROM OLD.verification_status OR
    NEW.documents IS DISTINCT FROM OLD.documents
  ) THEN
    SELECT id INTO v_superadmin_id 
    FROM profiles 
    WHERE role = 'superadmin' 
    LIMIT 1;
    
    IF v_superadmin_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, read)
      VALUES (
        v_superadmin_id,
        'Perfil de Fabricante Actualizado',
        'El fabricante ' || COALESCE(NEW.company_name, NEW.email) || ' actualizó su información de empresa.',
        'system',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 17. notify_new_order
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_company_name TEXT;
  v_product_name TEXT;
BEGIN
  SELECT company_name INTO v_company_name
  FROM profiles 
  WHERE id = NEW.buyer_id;
  
  SELECT name INTO v_product_name
  FROM products 
  WHERE id = NEW.product_id;
  
  INSERT INTO notifications (user_id, title, message, type, read)
  VALUES (
    NEW.manufacturer_id,
    'Nuevo pedido recibido',
    'El comprador ' || COALESCE(v_company_name, 'desconocido') || 
    ' realizó un pedido de ' || COALESCE(v_product_name, 'producto') || 
    ' por ' || NEW.quantity || ' unidades.',
    'order',
    false
  );
  
  RETURN NEW;
END;
$function$;

-- 18. notify_order_response
CREATE OR REPLACE FUNCTION public.notify_order_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO notifications (user_id, title, message, type, read)
      VALUES (
        NEW.buyer_id, 
        '✅ Pedido confirmado', 
        'El fabricante confirmó tu pedido. Pronto recibirás información sobre los siguientes pasos.',
        'order',
        false
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, title, message, type, read)
      VALUES (
        NEW.buyer_id, 
        '❌ Pedido rechazado', 
        'El fabricante rechazó el pedido. Motivo: ' || COALESCE(NEW.rejected_reason, 'sin especificar'),
        'order',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 19. fill_order_buyer_data
CREATE OR REPLACE FUNCTION public.fill_order_buyer_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _email text;
  _company text;
BEGIN
  SELECT email, company_name 
  INTO _email, _company
  FROM profiles 
  WHERE id = NEW.buyer_id;

  UPDATE orders
  SET buyer_email = _email,
      buyer_company = _company
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;

-- 20. notify_manufacturer_verification
CREATE OR REPLACE FUNCTION public.notify_manufacturer_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status AND NEW.role = 'manufacturer' THEN
    INSERT INTO notifications (user_id, title, message, type, read)
    VALUES (
      NEW.id,
      CASE NEW.verification_status
        WHEN 'approved' THEN '✅ Perfil Aprobado'
        WHEN 'rejected' THEN '❌ Perfil Rechazado'
        WHEN 'changes_requested' THEN '📝 Cambios Solicitados'
        ELSE 'Estado de Verificación Actualizado'
      END,
      CASE NEW.verification_status
        WHEN 'approved' THEN 'Tu perfil de fabricante ha sido aprobado. Ya puedes comenzar a cargar productos.'
        WHEN 'rejected' THEN 'Tu perfil ha sido rechazado de forma permanente. ' || COALESCE('Razón: ' || NEW.verification_notes, '')
        WHEN 'changes_requested' THEN 'Se requieren cambios en tu perfil. ' || COALESCE(NEW.verification_notes, 'Por favor revisa la información.')
        ELSE 'El estado de tu perfil ha cambiado.'
      END,
      'validation',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$function$;