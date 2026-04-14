
-- Fix: community_scans INSERT should require authentication
DROP POLICY IF EXISTS "Anyone can insert community scans" ON public.community_scans;
CREATE POLICY "Authenticated users can insert community scans"
  ON public.community_scans FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix: Remove user ability to update orders (financial data should be server-side only)
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
