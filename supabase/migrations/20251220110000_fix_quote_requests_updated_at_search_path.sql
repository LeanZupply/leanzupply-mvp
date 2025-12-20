-- Fix security warning: set search_path for update_quote_requests_updated_at function
CREATE OR REPLACE FUNCTION public.update_quote_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
