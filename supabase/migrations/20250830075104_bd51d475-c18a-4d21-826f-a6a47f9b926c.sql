-- Create secure RPC function for QR resolution and logging
CREATE OR REPLACE FUNCTION public.resolve_qr_and_log(
  qr_id uuid,
  user_agent text DEFAULT NULL,
  referrer text DEFAULT NULL,
  device_type text DEFAULT NULL,
  country text DEFAULT NULL,
  city text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  qr_record record;
  result jsonb;
  selected_url text;
  total_weight int;
  random_val numeric;
  url_record record;
BEGIN
  -- Get QR code details (bypasses RLS via SECURITY DEFINER)
  SELECT * INTO qr_record
  FROM public.qr_codes
  WHERE id = qr_id AND is_active = true;
  
  -- Return error if QR not found or inactive
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'QR code not found or inactive');
  END IF;
  
  -- Log the scan (bypasses RLS via SECURITY DEFINER)
  INSERT INTO public.qr_scan_logs (
    qr_code_id,
    user_agent,
    device_type,
    referrer,
    country,
    city
  ) VALUES (
    qr_id,
    user_agent,
    device_type,
    referrer,
    country,
    city
  );
  
  -- Update scan count (increment by 1)
  UPDATE public.qr_codes 
  SET scan_count = scan_count + 1
  WHERE id = qr_id;
  
  -- Prepare response based on QR type
  CASE qr_record.qr_type
    WHEN 'static', 'dynamic' THEN
      result := jsonb_build_object(
        'type', 'link',
        'url', qr_record.destination_url
      );
      
    WHEN 'multi-url' THEN
      -- Handle weighted URL selection server-side
      IF qr_record.multi_urls IS NOT NULL AND jsonb_array_length(qr_record.multi_urls) > 0 THEN
        -- Calculate total weight
        SELECT COALESCE(SUM((url_obj->>'weight')::int), jsonb_array_length(qr_record.multi_urls))
        INTO total_weight
        FROM jsonb_array_elements(qr_record.multi_urls) AS url_obj;
        
        -- Generate random value
        random_val := random() * total_weight;
        
        -- Select URL based on weight
        FOR url_record IN 
          SELECT url_obj->>'url' as url, COALESCE((url_obj->>'weight')::int, 1) as weight
          FROM jsonb_array_elements(qr_record.multi_urls) AS url_obj
        LOOP
          random_val := random_val - url_record.weight;
          IF random_val <= 0 THEN
            selected_url := url_record.url;
            EXIT;
          END IF;
        END LOOP;
        
        -- Fallback to first URL if selection failed
        IF selected_url IS NULL THEN
          SELECT qr_record.multi_urls->0->>'url' INTO selected_url;
        END IF;
        
        result := jsonb_build_object(
          'type', 'link',
          'url', selected_url
        );
      ELSE
        result := jsonb_build_object('error', 'No URLs configured');
      END IF;
      
    WHEN 'action' THEN
      result := jsonb_build_object(
        'type', 'action',
        'action_type', qr_record.action_type,
        'action_data', qr_record.action_data
      );
      
    WHEN 'geo' THEN
      result := jsonb_build_object(
        'type', 'geo',
        'geo_data', qr_record.geo_data
      );
      
    WHEN 'vcard', 'text', 'event' THEN
      result := jsonb_build_object(
        'type', 'content',
        'content_type', qr_record.qr_type,
        'content', qr_record.destination_url
      );
      
    ELSE
      result := jsonb_build_object('error', 'Unknown QR type');
  END CASE;
  
  RETURN result;
END;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.resolve_qr_and_log(uuid, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_qr_and_log(uuid, text, text, text, text, text) TO authenticated;

-- Remove the existing trigger since we're handling scan count in the function
DROP TRIGGER IF EXISTS increment_scan_count_trigger ON public.qr_scan_logs;