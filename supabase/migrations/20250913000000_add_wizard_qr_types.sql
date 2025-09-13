-- Add new QR code types from the wizard to the existing constraint
ALTER TABLE public.qr_codes DROP CONSTRAINT IF EXISTS qr_codes_qr_type_check;
ALTER TABLE public.qr_codes ADD CONSTRAINT qr_codes_qr_type_check 
  CHECK (qr_type IN (
    'url', 'text', 'contact', 'sms', 'email', 'phone', 'location', 
    'app', 'socials', 'pdf', 'file', 'event', 'context-aware', 'multi-action',
    'static', 'dynamic', 'multi-url', 'action', 'geo', 'vcard'
  ));

-- Add a column for form data to store structured QR content
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS form_data JSONB;

-- Add index for better performance on form data queries
CREATE INDEX IF NOT EXISTS idx_qr_codes_form_data ON public.qr_codes USING GIN (form_data);

-- Add a column to store the QR code image data URL
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS qr_image_url TEXT;

-- Add a column to track the QR code content for analytics
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS content_preview TEXT;
