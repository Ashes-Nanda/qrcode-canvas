-- Add new QR code types to the existing constraint
ALTER TABLE public.qr_codes DROP CONSTRAINT IF EXISTS qr_codes_qr_type_check;
ALTER TABLE public.qr_codes ADD CONSTRAINT qr_codes_qr_type_check 
  CHECK (qr_type IN ('static', 'dynamic', 'multi-url', 'action', 'geo', 'vcard', 'text', 'event'));

-- Add scan latency tracking to scan logs
ALTER TABLE public.qr_scan_logs ADD COLUMN IF NOT EXISTS scan_latency INTEGER;