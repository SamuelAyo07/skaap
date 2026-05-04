-- Restrict store address/coordinates to authenticated users only
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;

CREATE POLICY "Authenticated users can view active stores"
ON public.stores FOR SELECT
TO authenticated
USING (status = 'active');

-- Defense-in-depth: explicitly add a SELECT policy comment for user_subscriptions
-- (Already has user-scoped SELECT only; no broader policies exist)
COMMENT ON TABLE public.user_subscriptions IS 'Stripe subscription state. SELECT restricted to row owner via RLS. Writes only via service-role from edge functions. Never expose stripe_customer_id / stripe_subscription_id to other users.';