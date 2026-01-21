-- Migration: add_order_reference_and_payment_flow
-- Purpose: Support payment flow with human-readable order references, consolidated orders, and bank settings

-- 1. Add order_reference column for human-readable order IDs (LZ-YYYY-XXX format)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_reference TEXT UNIQUE;

-- 2. Update payment_status check constraint to include new statuses
-- First drop the existing constraint, then add the new one
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'awaiting_transfer', 'pending_verification', 'paid', 'failed', 'refunded'));

-- 3. Create order_items table for consolidated orders with multiple products
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  manufacturer_id UUID NOT NULL REFERENCES profiles(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  calculation_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for order_items
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_manufacturer_id ON order_items(manufacturer_id);

-- 5. Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for order_items
-- Buyers can view their order items
CREATE POLICY "Buyers can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Buyers can insert order items for their orders
CREATE POLICY "Buyers can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- Manufacturers can view order items for their products
CREATE POLICY "Manufacturers can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    manufacturer_id = auth.uid()
  );

-- Superadmins can manage all order items
CREATE POLICY "Superadmins can manage all order items"
  ON order_items FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'));

-- 7. Add updated_at trigger for order_items
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 8. Add bank details to settings table for payment instructions
INSERT INTO settings (key, value, type, description) VALUES
  ('bank_name', '', 'text', 'Nombre del banco para transferencias'),
  ('bank_iban', '', 'text', 'IBAN de la cuenta bancaria'),
  ('bank_swift', '', 'text', 'Codigo SWIFT/BIC'),
  ('bank_beneficiary', 'LeanZupply S.L.', 'text', 'Nombre del beneficiario'),
  ('bank_address', '', 'text', 'Direccion del banco'),
  ('payment_deadline_hours', '48', 'number', 'Horas limite para subir comprobante de pago')
ON CONFLICT (key) DO NOTHING;

-- 9. Add payment-related columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount NUMERIC;

-- 10. Add buyer info snapshot to orders for audit trail
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_info_snapshot JSONB;
