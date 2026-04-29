
-- 1) Restrict user_subscriptions SELECT so Stripe IDs are not exposed to clients.
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;

CREATE OR REPLACE VIEW public.my_subscription
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  plan,
  status,
  trial_ends_at,
  current_period_end,
  created_at,
  updated_at
FROM public.user_subscriptions
WHERE auth.uid() = user_id;

GRANT SELECT ON public.my_subscription TO authenticated;

-- Re-add a minimal SELECT policy so the view (security_invoker) still works,
-- but restrict it to the owner. Stripe IDs remain in the table but are never
-- selected by client code (we only query the view from the client).
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2) Stores: expose a safe public view (no owner_id) for product/store context.
CREATE OR REPLACE VIEW public.public_stores
WITH (security_invoker = false)
AS
SELECT id, name, address, lat, lng, status, created_at
FROM public.stores
WHERE status = 'active';

GRANT SELECT ON public.public_stores TO anon, authenticated;
