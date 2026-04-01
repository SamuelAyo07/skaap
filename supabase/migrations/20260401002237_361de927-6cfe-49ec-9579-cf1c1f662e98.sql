-- 1. Remove overly broad SELECT on contact_submissions
DROP POLICY IF EXISTS "Authenticated users can view submissions" ON public.contact_submissions;

-- 2. Remove client-side INSERT on orders (prevents arbitrary pricing)
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- 3. Remove self-grant INSERT/UPDATE on user_subscriptions
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;