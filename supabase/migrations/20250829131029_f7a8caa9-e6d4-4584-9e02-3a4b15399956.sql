-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create QR codes table
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  qr_type TEXT NOT NULL CHECK (qr_type IN ('static', 'dynamic', 'multi-url', 'action', 'geo')),
  destination_url TEXT,
  multi_urls JSONB,
  action_type TEXT,
  action_data JSONB,
  geo_data JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for QR codes
CREATE POLICY "Users can view their own QR codes" 
ON public.qr_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own QR codes" 
ON public.qr_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own QR codes" 
ON public.qr_codes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own QR codes" 
ON public.qr_codes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create QR scan logs table
CREATE TABLE public.qr_scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT,
  referrer TEXT
);

-- Enable RLS
ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for scan logs
CREATE POLICY "Users can view scan logs for their QR codes" 
ON public.qr_scan_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.qr_codes 
    WHERE qr_codes.id = qr_scan_logs.qr_code_id 
    AND qr_codes.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment scan count
CREATE OR REPLACE FUNCTION public.increment_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.qr_codes 
  SET scan_count = scan_count + 1
  WHERE id = NEW.qr_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to increment scan count when new scan is logged
CREATE TRIGGER increment_qr_scan_count
  AFTER INSERT ON public.qr_scan_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_scan_count();