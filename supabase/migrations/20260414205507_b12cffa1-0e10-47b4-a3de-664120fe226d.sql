
-- Fix analytics_events: restrict INSERT to only authenticated users (was anon+authenticated with true)
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Authenticated users can insert analytics events" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (true);

-- Fix community_scans: tighten INSERT with_check
DROP POLICY IF EXISTS "Authenticated users can insert community scans" ON public.community_scans;
CREATE POLICY "Authenticated users can insert community scans" ON public.community_scans FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Fix orders: add explicit deny for UPDATE and DELETE
CREATE POLICY "No one can update orders" ON public.orders FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No one can delete orders" ON public.orders FOR DELETE TO authenticated USING (false);

-- Fix contact_submissions: add explicit deny for UPDATE and DELETE
CREATE POLICY "No one can update contact submissions" ON public.contact_submissions FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No one can delete contact submissions" ON public.contact_submissions FOR DELETE TO authenticated USING (false);
