-- Add logo_url to profiles for manufacturers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS logo_url TEXT;