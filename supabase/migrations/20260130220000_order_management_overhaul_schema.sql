-- Phase 1A: Order Management Overhaul - Schema Changes

-- 1. Drop existing status CHECK constraint and replace with expanded one
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending', 'pending_confirmation', 'confirmed', 'rejected',
    'in_production', 'in_shipping',
    'awaiting_payment', 'payment_confirmed', 'in_transit', 'delivered', 'cancelled'
  )
);

-- 2. Add new columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transport_message TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ;

-- 3. Create order_documents table
CREATE TABLE IF NOT EXISTS order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_receipt', 'invoice', 'transport_doc', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_documents_order_id ON order_documents(order_id);

-- 4. Create order_activity_log table
CREATE TABLE IF NOT EXISTS order_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_state TEXT,
  new_state TEXT,
  user_id UUID REFERENCES auth.users(id),
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_activity_log_order_id ON order_activity_log(order_id);

-- 5. RLS for order_documents
ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own order documents"
  ON order_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_documents.order_id AND orders.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can upload documents for own orders"
  ON order_documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_documents.order_id AND orders.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Manufacturers can view own order documents"
  ON order_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_documents.order_id AND orders.manufacturer_id = auth.uid()
    )
  );

CREATE POLICY "Manufacturers can upload documents for own orders"
  ON order_documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_documents.order_id AND orders.manufacturer_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins have full access to order documents"
  ON order_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'superadmin'
    )
  );

-- 6. RLS for order_activity_log
ALTER TABLE order_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own order activity"
  ON order_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_activity_log.order_id AND orders.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Manufacturers can view own order activity"
  ON order_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_activity_log.order_id AND orders.manufacturer_id = auth.uid()
    )
  );

CREATE POLICY "Superadmins have full access to order activity"
  ON order_activity_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Authenticated users can insert activity log"
  ON order_activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Create order-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-documents',
  'order-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage RLS policies for order-documents bucket
CREATE POLICY "Authenticated users can upload to order-documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'order-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can view order documents in storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'order-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Superadmins can delete order documents from storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'order-documents' AND
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'superadmin'
    )
  );
