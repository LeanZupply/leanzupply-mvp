-- Agregar nuevas columnas a la tabla orders para el flujo de confirmación
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS agreement_notes TEXT,
ADD COLUMN IF NOT EXISTS buyer_company TEXT,
ADD COLUMN IF NOT EXISTS buyer_email TEXT,
ADD COLUMN IF NOT EXISTS delivery_estimate TEXT,
ADD COLUMN IF NOT EXISTS manufacturer_notes TEXT,
ADD COLUMN IF NOT EXISTS response_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

-- Actualizar estados posibles (documentación)
-- Estados: 'pending_confirmation' | 'confirmed' | 'rejected' | 'in_production' | 'in_shipping' | 'delivered'
-- Payment_status: 'awaiting_agreement' | 'awaiting_payment' | 'paid'

-- Función para rellenar automáticamente los datos del comprador cuando se crea un pedido
CREATE OR REPLACE FUNCTION public.fill_order_buyer_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE orders
  SET 
    buyer_email = (SELECT email FROM profiles WHERE id = NEW.buyer_id),
    buyer_company = (SELECT company_name FROM profiles WHERE id = NEW.buyer_id)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger para rellenar datos del comprador al insertar
DROP TRIGGER IF EXISTS trg_fill_order_buyer_data ON orders;
CREATE TRIGGER trg_fill_order_buyer_data
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION fill_order_buyer_data();

-- Función para notificar al fabricante cuando hay un nuevo pedido
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_name TEXT;
  v_product_name TEXT;
BEGIN
  -- Obtener nombre de la empresa del comprador
  SELECT company_name INTO v_company_name
  FROM profiles 
  WHERE id = NEW.buyer_id;
  
  -- Obtener nombre del producto
  SELECT name INTO v_product_name
  FROM products 
  WHERE id = NEW.product_id;
  
  -- Insertar notificación para el fabricante
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
$$;

-- Trigger para notificar nuevo pedido (reemplazar el existente)
DROP TRIGGER IF EXISTS trg_notify_new_order ON orders;
CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- Función para notificar al comprador cuando el fabricante responde
CREATE OR REPLACE FUNCTION public.notify_order_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo notificar si el estado cambió
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
$$;

-- Trigger para notificar respuesta del fabricante
DROP TRIGGER IF EXISTS trg_notify_order_response ON orders;
CREATE TRIGGER trg_notify_order_response
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION notify_order_response();

-- Actualizar el trigger existente de cambio de estado para que no duplique notificaciones
DROP TRIGGER IF EXISTS trg_handle_order_status_update ON orders;

-- Actualizar el trigger de nuevo pedido existente para evitar duplicados
DROP TRIGGER IF EXISTS trg_handle_new_order ON orders;