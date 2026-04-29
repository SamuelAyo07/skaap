
ALTER VIEW public.public_stores SET (security_invoker = true);

-- Allow anyone to read active store metadata via the view's underlying table.
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
CREATE POLICY "Public can view active stores"
ON public.stores
FOR SELECT
TO anon, authenticated
USING (status = 'active');
