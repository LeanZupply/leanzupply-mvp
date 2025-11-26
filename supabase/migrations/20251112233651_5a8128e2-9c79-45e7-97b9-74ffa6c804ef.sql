-- Create local_shipping_zones table
CREATE TABLE public.local_shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC NOT NULL CHECK (base_price >= 0),
  postal_code_ranges JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create volume_surcharges table
CREATE TABLE public.volume_surcharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_volume NUMERIC NOT NULL CHECK (min_volume >= 0),
  max_volume NUMERIC CHECK (max_volume IS NULL OR max_volume > min_volume),
  surcharge_amount NUMERIC NOT NULL DEFAULT 0 CHECK (surcharge_amount >= 0),
  requires_quote BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_volume_range CHECK (max_volume IS NULL OR max_volume > min_volume)
);

-- Enable RLS
ALTER TABLE public.local_shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volume_surcharges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for local_shipping_zones
CREATE POLICY "Anyone can view active shipping zones"
ON public.local_shipping_zones
FOR SELECT
USING (active = true);

CREATE POLICY "Superadmins can manage shipping zones"
ON public.local_shipping_zones
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for volume_surcharges
CREATE POLICY "Anyone can view active volume surcharges"
ON public.volume_surcharges
FOR SELECT
USING (active = true);

CREATE POLICY "Superadmins can manage volume surcharges"
ON public.volume_surcharges
FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_local_shipping_zones_active ON public.local_shipping_zones(active, display_order);
CREATE INDEX idx_volume_surcharges_active ON public.volume_surcharges(active, display_order);
CREATE INDEX idx_volume_surcharges_volume ON public.volume_surcharges(min_volume, max_volume) WHERE active = true;

-- Add triggers for updated_at
CREATE TRIGGER update_local_shipping_zones_updated_at
  BEFORE UPDATE ON public.local_shipping_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_volume_surcharges_updated_at
  BEFORE UPDATE ON public.volume_surcharges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default zones (as per requirements)
INSERT INTO public.local_shipping_zones (name, description, base_price, postal_code_ranges, display_order) VALUES
('Zona 1 - Barcelona y Valencia Ciudad', 'Tarifa para Barcelona ciudad y Valencia ciudad', 120, 
  '[{"start": "08000", "end": "08999", "label": "Barcelona ciudad"}, {"start": "46000", "end": "46999", "label": "Valencia ciudad"}]'::jsonb, 1),
('Zona 2 - Cataluña y Comunidad Valenciana', 'Tarifa para Tarragona, Castellón, Alicante y alrededores', 150,
  '[{"start": "43000", "end": "43999", "label": "Tarragona"}, {"start": "12000", "end": "12999", "label": "Castellón"}, {"start": "03000", "end": "03999", "label": "Alicante"}]'::jsonb, 2),
('Zona 3 - Centro', 'Tarifa para Madrid, Zaragoza, Murcia, Cuenca, Albacete, La Rioja', 220,
  '[{"start": "28000", "end": "28999", "label": "Madrid"}, {"start": "50000", "end": "50999", "label": "Zaragoza"}, {"start": "30000", "end": "30999", "label": "Murcia"}, {"start": "16000", "end": "16999", "label": "Cuenca"}, {"start": "02000", "end": "02999", "label": "Albacete"}, {"start": "26000", "end": "26999", "label": "La Rioja"}]'::jsonb, 3),
('Zona 4 - Resto Península', 'Tarifa para el resto de España peninsular', 320,
  '[{"start": "01000", "end": "52999", "label": "Resto de España peninsular", "is_fallback": true}]'::jsonb, 4);

-- Insert default volume surcharges
INSERT INTO public.volume_surcharges (min_volume, max_volume, surcharge_amount, requires_quote, description, display_order) VALUES
(0, 1, 0, false, 'Sin recargo para volúmenes hasta 1 m³', 1),
(1, 2, 40, false, 'Recargo para volúmenes entre 1 y 2 m³', 2),
(2, 3, 80, false, 'Recargo para volúmenes entre 2 y 3 m³', 3),
(3, 4, 120, false, 'Recargo para volúmenes entre 3 y 4 m³', 4),
(4, NULL, 160, true, 'Recargo para volúmenes superiores a 4 m³ - Requiere cotización manual', 5);

COMMENT ON TABLE public.local_shipping_zones IS 'Zonas de envío local configurables por código postal';
COMMENT ON TABLE public.volume_surcharges IS 'Recargos por volumen para envíos locales';
COMMENT ON COLUMN public.local_shipping_zones.postal_code_ranges IS 'Array de rangos de CP: [{"start": "08000", "end": "08999", "label": "Barcelona"}]';
COMMENT ON COLUMN public.volume_surcharges.requires_quote IS 'Si es true, se requiere cotización manual del equipo comercial';