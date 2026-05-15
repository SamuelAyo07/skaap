
-- 1) Explicit deny for anon SELECT on user_subscriptions
CREATE POLICY "Anon cannot read subscriptions"
ON public.user_subscriptions
FOR SELECT
TO anon
USING (false);

-- 2) Tighten community_scans INSERT: store_id must be null or owned by user
DROP POLICY IF EXISTS "Authenticated users can insert community scans" ON public.community_scans;

CREATE POLICY "Authenticated users can insert community scans"
ON public.community_scans
FOR INSERT
TO authenticated
WITH CHECK (
  length(barcode) BETWEEN 1 AND 50
  AND length(product_name) BETWEEN 1 AND 300
  AND (
    store_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = community_scans.store_id AND s.owner_id = auth.uid()
    )
  )
);

-- 3) Allow anon to insert analytics events (landing page is public)
DROP POLICY IF EXISTS "Authenticated users can insert analytics events" ON public.analytics_events;

CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND length(session_id) BETWEEN 1 AND 100
  AND length(event_type) BETWEEN 1 AND 100
);
