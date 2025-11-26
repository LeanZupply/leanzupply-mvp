-- Create settings table for platform configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'json')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Only superadmins can manage settings
CREATE POLICY "Superadmins can manage settings"
ON public.settings
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Create activity_log table for audit trail
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view activity logs
CREATE POLICY "Superadmins can view activity logs"
ON public.activity_log
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Superadmins can insert activity logs
CREATE POLICY "Superadmins can insert activity logs"
ON public.activity_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Insert default settings
INSERT INTO public.settings (key, value, type, description) VALUES
('landing_seo_title', 'LenzSupply – Plataforma B2B D2B', 'text', 'SEO title for landing page'),
('landing_seo_description', 'Conectamos fabricantes certificados con compradores internacionales. Simplifica tu sourcing B2B.', 'text', 'SEO meta description'),
('max_products_per_manufacturer', '50', 'number', 'Maximum products a manufacturer can create'),
('enable_auto_approval', 'false', 'boolean', 'Auto-approve new products'),
('platform_commission_rate', '5', 'number', 'Platform commission percentage')
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();