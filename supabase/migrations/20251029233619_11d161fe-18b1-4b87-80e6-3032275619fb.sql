-- Create enum for tracking steps
CREATE TYPE tracking_step AS ENUM (
  'viewed',
  'added_to_pallet',
  'requested',
  'pending_confirmation',
  'confirmed',
  'paid',
  'shipped',
  'delivered'
);

-- Create order_tracking table
CREATE TABLE public.order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  step tracking_step NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pallet_items table (carrito de compra)
CREATE TABLE public.pallet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id, status)
);

-- Enable RLS
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pallet_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_tracking
CREATE POLICY "Users can view own tracking"
ON public.order_tracking FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tracking"
ON public.order_tracking FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Superadmins can view all tracking"
ON public.order_tracking FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for pallet_items
CREATE POLICY "Users can manage own pallet"
ON public.pallet_items FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Superadmins can view all pallets"
ON public.pallet_items FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_order_tracking_user ON order_tracking(user_id);
CREATE INDEX idx_order_tracking_product ON order_tracking(product_id);
CREATE INDEX idx_order_tracking_order ON order_tracking(order_id);
CREATE INDEX idx_pallet_items_user ON pallet_items(user_id);
CREATE INDEX idx_pallet_items_status ON pallet_items(status);

-- Trigger to update pallet_items updated_at
CREATE TRIGGER update_pallet_items_updated_at
  BEFORE UPDATE ON pallet_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to track product view
CREATE OR REPLACE FUNCTION track_product_view(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment product views
  PERFORM increment_product_views(p_product_id);
  
  -- Track in order_tracking if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO order_tracking (user_id, product_id, step)
    VALUES (auth.uid(), p_product_id, 'viewed');
  END IF;
END;
$$;