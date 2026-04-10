-- Remove community_scans from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.community_scans;

-- Add explicit deny-SELECT policy on contact_submissions
CREATE POLICY "No one can read contact submissions"
ON public.contact_submissions
FOR SELECT
USING (false);

-- Add explicit deny-SELECT policy on analytics_events
CREATE POLICY "No one can read analytics events"
ON public.analytics_events
FOR SELECT
USING (false);