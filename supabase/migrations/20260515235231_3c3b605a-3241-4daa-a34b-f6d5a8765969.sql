
REVOKE ALL ON public.user_subscriptions FROM anon;
REVOKE ALL ON public.products FROM anon;

DROP POLICY IF EXISTS "Anon cannot insert subscriptions" ON public.user_subscriptions;
CREATE POLICY "Anon cannot insert subscriptions"
ON public.user_subscriptions
AS RESTRICTIVE
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Anon cannot read products"
ON public.products
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);
