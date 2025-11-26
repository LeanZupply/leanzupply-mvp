-- Create enum for app roles (separate from profiles)
CREATE TYPE public.app_role AS ENUM ('superadmin', 'manufacturer', 'buyer');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  price_unit NUMERIC NOT NULL,
  moq INTEGER NOT NULL DEFAULT 1,
  stock INTEGER NOT NULL DEFAULT 0,
  packaging TEXT,
  hs_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  manufacturer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_production', 'in_shipping', 'delivered', 'cancelled')),
  incoterm TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  tracking_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'order', 'product', 'validation')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Manufacturers can insert own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'manufacturer') AND manufacturer_id = auth.uid());

CREATE POLICY "Manufacturers can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'manufacturer') AND manufacturer_id = auth.uid());

CREATE POLICY "Manufacturers can view own products"
  ON public.products FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'manufacturer') AND manufacturer_id = auth.uid());

CREATE POLICY "Buyers can view active products"
  ON public.products FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'buyer') AND status = 'active');

CREATE POLICY "Superadmins can manage all products"
  ON public.products FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'));

-- RLS Policies for orders
CREATE POLICY "Buyers can insert own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'buyer') AND buyer_id = auth.uid());

CREATE POLICY "Buyers can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'buyer') AND buyer_id = auth.uid());

CREATE POLICY "Buyers can update own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'buyer') AND buyer_id = auth.uid());

CREATE POLICY "Manufacturers can view orders for their products"
  ON public.orders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'manufacturer') AND manufacturer_id = auth.uid());

CREATE POLICY "Manufacturers can update orders for their products"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'manufacturer') AND manufacturer_id = auth.uid());

CREATE POLICY "Superadmins can manage all orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'));

-- RLS Policies for documents
CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all documents"
  ON public.documents FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can manage all notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'));

-- Performance indexes
CREATE INDEX idx_products_category_status ON public.products(category, status);
CREATE INDEX idx_products_manufacturer ON public.products(manufacturer_id);
CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_manufacturer ON public.orders(manufacturer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_documents_user_verified ON public.documents(user_id, verified);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to sync user roles from profiles table
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing role for this user
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.role::app_role);
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically sync roles from profiles to user_roles
CREATE TRIGGER sync_profile_role
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role();