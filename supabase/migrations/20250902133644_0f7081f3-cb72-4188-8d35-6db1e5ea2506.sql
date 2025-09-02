-- Ensure design_options column exists in qr_codes table
-- This migration ensures the column is added even if previous migration didn't run

DO $$ 
BEGIN
    -- Check if column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'qr_codes' 
        AND column_name = 'design_options'
    ) THEN
        ALTER TABLE public.qr_codes ADD COLUMN design_options JSONB;
    END IF;
END $$;

-- Add index for better performance on design options queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_qr_codes_design_options ON public.qr_codes USING GIN (design_options);

-- Ensure the updated_at trigger works for design_options column
-- (This should already be handled by the existing trigger, but just to be safe)