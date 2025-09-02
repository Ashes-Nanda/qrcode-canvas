-- Add scan_latency column to qr_scan_logs table for performance tracking
ALTER TABLE public.qr_scan_logs ADD COLUMN scan_latency INTEGER;

-- Add index for better performance on latency queries
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_latency ON public.qr_scan_logs (scan_latency);

-- Add comment for documentation
COMMENT ON COLUMN public.qr_scan_logs.scan_latency IS 'Scan latency in milliseconds for performance monitoring';