-- Add enriched fields to quote_requests table for checkout flow
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS quantity INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS destination_port TEXT,
ADD COLUMN IF NOT EXISTS calculation_snapshot JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.quote_requests.quantity IS 'Quantity requested by the user';
COMMENT ON COLUMN public.quote_requests.notes IS 'Additional notes from the user';
COMMENT ON COLUMN public.quote_requests.destination_port IS 'Destination port for shipping calculation';
COMMENT ON COLUMN public.quote_requests.calculation_snapshot IS 'Snapshot of cost calculation at time of request';
