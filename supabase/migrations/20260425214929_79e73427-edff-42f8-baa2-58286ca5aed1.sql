-- Fix 1: analytics_events INSERT must bind session_id to a non-empty value (prevent flood of empty rows)
DROP POLICY IF EXISTS "Authenticated users can insert analytics events" ON public.analytics_events;
CREATE POLICY "Authenticated users can insert analytics events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (session_id IS NOT NULL AND length(session_id) BETWEEN 1 AND 100 AND length(event_type) BETWEEN 1 AND 100);

-- Fix 2: community_scans — drop zip_code from public reads to reduce location precision (privacy)
-- Keep city/state for community map, but remove zip_code values from existing rows and from future writes by clearing column.
UPDATE public.community_scans SET zip_code = NULL WHERE zip_code IS NOT NULL;

-- Fix 3: community_scans inserts should not allow arbitrary zip_code (anonymize)
DROP POLICY IF EXISTS "Authenticated users can insert community scans" ON public.community_scans;
CREATE POLICY "Authenticated users can insert community scans"
ON public.community_scans
FOR INSERT
TO authenticated
WITH CHECK (zip_code IS NULL AND length(barcode) BETWEEN 1 AND 50 AND length(product_name) BETWEEN 1 AND 300);

-- Fix 4: contact_submissions stricter check (length bounds + email format basic)
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (name IS NULL OR length(name) <= 100)
  AND (message IS NULL OR length(message) <= 2000)
);