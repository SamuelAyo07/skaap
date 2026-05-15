
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Authenticated users can view products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anon cannot insert subscriptions"
ON public.user_subscriptions
FOR INSERT
TO anon
WITH CHECK (false);
