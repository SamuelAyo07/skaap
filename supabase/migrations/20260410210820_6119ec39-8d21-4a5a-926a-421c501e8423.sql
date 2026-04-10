
-- Block all writes to user_subscriptions (server-only via service role)
CREATE POLICY "Block direct inserts to subscriptions"
ON public.user_subscriptions FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Block direct updates to subscriptions"
ON public.user_subscriptions FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Block direct deletes to subscriptions"
ON public.user_subscriptions FOR DELETE
TO authenticated
USING (false);

-- Block community_scans updates and deletes
CREATE POLICY "No one can update community scans"
ON public.community_scans FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No one can delete community scans"
ON public.community_scans FOR DELETE
TO authenticated
USING (false);

-- Allow anon to insert analytics (for unauthenticated visitors)
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anon to insert and read community scans
DROP POLICY IF EXISTS "Anyone can read community scans" ON public.community_scans;
CREATE POLICY "Anyone can read community scans"
ON public.community_scans FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert community scans" ON public.community_scans;
CREATE POLICY "Anyone can insert community scans"
ON public.community_scans FOR INSERT
TO anon, authenticated
WITH CHECK (true);
