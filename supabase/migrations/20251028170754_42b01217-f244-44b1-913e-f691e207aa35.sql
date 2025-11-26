-- Agregar campos adicionales a orders para costos detallados y tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS logistics_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customs_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_final NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS contract_url TEXT,
  ADD COLUMN IF NOT EXISTS tracking_stage TEXT DEFAULT 'created',
  ADD COLUMN IF NOT EXISTS buyer_notes TEXT;

-- Agregar campos adicionales a profiles para ciudad y código postal
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Índice para mejorar queries por tracking_stage
CREATE INDEX IF NOT EXISTS idx_orders_tracking_stage ON public.orders(tracking_stage);

COMMENT ON COLUMN public.orders.logistics_cost IS 'Costo de transporte/logística';
COMMENT ON COLUMN public.orders.insurance_cost IS 'Costo de seguro';
COMMENT ON COLUMN public.orders.customs_cost IS 'Costo de aduanas y aranceles';
COMMENT ON COLUMN public.orders.total_final IS 'Total final incluyendo todos los costos';
COMMENT ON COLUMN public.orders.tracking_stage IS 'Etapa actual del pedido en el timeline';
COMMENT ON COLUMN public.orders.buyer_notes IS 'Notas adicionales del comprador';