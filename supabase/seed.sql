-- Seed data for QRCode Canvas Pro
-- This file provides initial data for development and testing

-- Insert sample QR code templates
INSERT INTO public.qr_codes (
  user_id,
  title,
  description,
  qr_type,
  destination_url,
  design_options,
  is_active
) VALUES
-- Sample static QR
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Sample Website QR',
  'Demo QR code for website',
  'static',
  'https://example.com',
  '{"foregroundColor": "#000000", "backgroundColor": "#ffffff", "size": 200}',
  true
),
-- Sample dynamic QR
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Sample Dynamic QR',
  'Demo dynamic QR code',
  'dynamic',
  'https://google.com',
  '{"foregroundColor": "#1a73e8", "backgroundColor": "#ffffff", "size": 200}',
  true
);

-- Note: Replace the UUID with actual user IDs in production