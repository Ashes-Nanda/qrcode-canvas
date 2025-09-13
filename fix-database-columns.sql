-- Fix Database Columns for QR Code Analytics
-- Run this in your Supabase SQL Editor

-- Add missing columns to qr_codes table
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS form_data JSONB;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS qr_image_url TEXT;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS content_preview TEXT;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS design_options JSONB;

-- Add missing column to qr_scan_logs table
ALTER TABLE public.qr_scan_logs ADD COLUMN IF NOT EXISTS scan_latency INTEGER;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON public.qr_codes (created_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_form_data ON public.qr_codes USING GIN (form_data);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_qr_code_id ON public.qr_scan_logs (qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_scanned_at ON public.qr_scan_logs (scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_latency ON public.qr_scan_logs (scan_latency) WHERE scan_latency IS NOT NULL;

-- Update QR code type constraints to include all new types
ALTER TABLE public.qr_codes DROP CONSTRAINT IF EXISTS qr_codes_qr_type_check;
ALTER TABLE public.qr_codes ADD CONSTRAINT qr_codes_qr_type_check 
  CHECK (qr_type IN (
    'url', 'text', 'contact', 'sms', 'email', 'phone', 'location', 
    'app', 'socials', 'pdf', 'file', 'event', 'context-aware', 'multi-action',
    'static', 'dynamic', 'multi-url', 'action', 'geo', 'vcard'
  ));

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
AND column_name IN ('form_data', 'qr_image_url', 'content_preview', 'design_options')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'qr_scan_logs' 
AND column_name = 'scan_latency';

-- Show success message
SELECT 'Database columns successfully added!' as status;
