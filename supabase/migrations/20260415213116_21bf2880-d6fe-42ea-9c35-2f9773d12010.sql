
-- 1. Make orders.user_id NOT NULL
ALTER TABLE public.orders ALTER COLUMN user_id SET NOT NULL;

-- 2. Restrict community_scans SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view community scans" ON public.community_scans;
CREATE POLICY "Authenticated users can view community scans"
  ON public.community_scans FOR SELECT TO authenticated USING (true);

-- 3. Drop overly permissive community_scans insert if exists and tighten
DROP POLICY IF EXISTS "Authenticated users can insert community scans" ON public.community_scans;
DROP POLICY IF EXISTS "Anyone can insert community scans" ON public.community_scans;
CREATE POLICY "Authenticated users can insert community scans"
  ON public.community_scans FOR INSERT TO authenticated WITH CHECK (true);
