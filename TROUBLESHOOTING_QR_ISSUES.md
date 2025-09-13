# QR Code and Analytics Issues Troubleshooting Guide

## ⚠️ URGENT FIX NEEDED

**Database columns are missing!** The error `column qr_codes.form_data does not exist` indicates your database is missing required columns.

### Quick Fix Steps:

1. **Go to your Supabase Dashboard** → SQL Editor
2. **Copy and paste** the content from `fix-database-columns.sql`
3. **Run the SQL script**
4. **Refresh your app** - analytics should now work

### Verify the Fix:
```javascript
// Run this in browser console:
verifyDatabaseFix()
```

---

## Issues Fixed

### 1. QR Codes Not Showing in Manage Section ✅

**Problem**: QR codes were not displaying in the "Manage QR Codes" section even after being saved.

**Root Causes**:
- Missing error handling in `fetchQRCodes()` function
- Potential RLS (Row Level Security) policy issues
- Database connection problems not being properly logged

**Solutions Applied**:
- Enhanced error logging in `QRList.tsx` with detailed console output
- Added user authentication checks before queries
- Improved error messages to show specific error details
- Added logging to track the number of QR codes fetched

**Testing**:
```javascript
// In browser console, check:
// 1. User authentication status
// 2. Database query results
// 3. Console for detailed error logs
```

### 2. Analytics Showing "Failed to fetch analytics" ✅

**Problem**: Analytics component was throwing "Failed to fetch analytics" errors and showing no stats.

**Root Causes**:
- Missing `scan_latency` column in some database instances
- Unhandled database query errors
- Missing graceful error handling for scan logs

**Solutions Applied**:
- Added comprehensive error handling in `Analytics.tsx`
- Made `scan_latency` queries optional with null safety checks
- Added fallback empty analytics data on error
- Enhanced logging for troubleshooting
- Applied database migration to ensure all required columns exist

**Database Migration Applied**:
```sql
-- Ensure all required columns exist
ALTER TABLE public.qr_scan_logs ADD COLUMN IF NOT EXISTS scan_latency INTEGER;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS form_data JSONB;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS qr_image_url TEXT;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS content_preview TEXT;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS design_options JSONB;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes (user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_qr_code_id ON public.qr_scan_logs (qr_code_id);
```

## Testing Your Fixes

### Method 1: Automated Testing Script

1. Load your app in the browser
2. Open browser console (F12)
3. Copy and paste the content from `test-qr-functionality.js`
4. Run `testQRFunctionality()` in the console
5. Check the results for any failures

### Method 2: Manual Testing

1. **Test QR Code Creation**:
   - Go to Create QR Code section
   - Create a new URL QR code
   - Save it to dashboard
   - Check console for success logs

2. **Test Manage QR Codes**:
   - Go to Manage QR Codes section
   - Verify all your QR codes appear
   - Check console logs for fetch results

3. **Test Analytics**:
   - Go to Analytics section
   - Verify it loads without errors
   - Check that stats display properly (even if 0)

### Method 3: Database Verification

```javascript
// In browser console, run:
const { supabase } = await import('./src/integrations/supabase/client.js');

// Check QR codes
const { data, error } = await supabase.from('qr_codes').select('*');
console.log('QR codes:', data?.length, error);

// Check scan logs structure
const { data: logs, error: logError } = await supabase.from('qr_scan_logs').select('*').limit(1);
console.log('Scan logs structure:', logs?.[0], logError);
```

## Debugging Console Commands

### Check Authentication Status
```javascript
const { data: { user }, error } = await supabase.auth.getUser();
console.log('User:', user?.email, 'Error:', error);
```

### Check QR Codes
```javascript
const { data: qrs, error } = await supabase
  .from('qr_codes')
  .select('*')
  .eq('user_id', user.id);
console.log(`Found ${qrs?.length || 0} QR codes`, error);
```

### Check Analytics Data
```javascript
const { data: stats, error } = await supabase
  .from('qr_codes')
  .select('id, title, scan_count, is_active, qr_type')
  .eq('user_id', user.id);
console.log('Analytics data:', stats, error);
```

## Common Issues and Solutions

### Issue: "No QR codes found but I created some"
- **Check**: User authentication in console
- **Check**: RLS policies are working
- **Solution**: Log out and log back in, or check the user_id in database

### Issue: "Analytics still shows 0 after creating QRs"
- **Check**: QR codes have `scan_count` field
- **Check**: Database migration was successful
- **Solution**: Refresh the analytics page

### Issue: "QR codes created but not saved properly"
- **Check**: All required columns exist in database
- **Check**: Console logs during save operation
- **Solution**: Run the database migration script

## Enhanced Logging

The fixes include extensive logging to help diagnose issues:

- **QRList.tsx**: Logs user ID, query results, and error details
- **Analytics.tsx**: Logs analytics calculation steps and data processing
- **QrPreview.tsx**: Logs QR save operations with detailed data

To see these logs:
1. Open browser console (F12)
2. Navigate to the problematic section
3. Look for detailed log messages
4. Check for any red error messages

## Migration Verification

To verify the database migration worked:

```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
AND column_name IN ('form_data', 'qr_image_url', 'content_preview', 'design_options');

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'qr_scan_logs' 
AND column_name = 'scan_latency';
```

## Support

If you continue to experience issues:
1. Check browser console for error messages
2. Run the test script provided
3. Verify database structure with the migration
4. Check RLS policies are correctly configured

All major issues should now be resolved with the applied fixes!
