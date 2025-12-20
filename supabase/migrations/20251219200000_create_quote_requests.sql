-- Create quote_requests table for storing product information requests
-- This allows both authenticated and non-authenticated users to request quotes

CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- Nullable for non-auth users
  email TEXT NOT NULL,
  mobile_phone TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  admin_notes TEXT,
  is_authenticated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_quote_requests_product_id ON public.quote_requests(product_id);
CREATE INDEX idx_quote_requests_user_id ON public.quote_requests(user_id);
CREATE INDEX idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX idx_quote_requests_created_at ON public.quote_requests(created_at DESC);
CREATE INDEX idx_quote_requests_is_authenticated ON public.quote_requests(is_authenticated);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_quote_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_requests_updated_at();

-- RLS Policies
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Superadmins can read all quote requests
CREATE POLICY "Superadmins can read all quote requests"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Superadmins can update quote requests
CREATE POLICY "Superadmins can update quote requests"
  ON public.quote_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Anyone can insert quote requests (both authenticated and anonymous)
CREATE POLICY "Anyone can insert quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read their own quote requests
CREATE POLICY "Users can read own quote requests"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
