-- Tighten analytics_events INSERT policy
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND length(session_id) BETWEEN 1 AND 100
  AND length(event_type) BETWEEN 1 AND 100
  AND (page IS NULL OR length(page) <= 500)
  AND (user_agent IS NULL OR length(user_agent) <= 512)
  AND (event_data IS NULL OR pg_column_size(event_data::text) <= 4096)
);

-- Tighten scan_signups INSERT policy
DROP POLICY IF EXISTS "Anyone can submit scan signup" ON public.scan_signups;
CREATE POLICY "Anyone can submit scan signup"
ON public.scan_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) >= 1 AND char_length(name) <= 100
  AND char_length(email) >= 5 AND char_length(email) <= 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
