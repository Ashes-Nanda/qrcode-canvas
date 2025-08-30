-- Add design options column to qr_codes table
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS design_options JSONB;

-- Add index for better performance on design options queries
CREATE INDEX IF NOT EXISTS idx_qr_codes_design_options ON public.qr_codes USING GIN (design_options);

-- Update the updated_at timestamp when design_options change
-- This is already handled by the existing trigger, but let's make sure it works for the new column