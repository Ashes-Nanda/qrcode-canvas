-- Fix function search path security warnings by adding set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.qr_codes 
  SET scan_count = scan_count + 1
  WHERE id = NEW.qr_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;