
-- 1. Tighten community_scans INSERT policy with URL/score/length validation
DROP POLICY IF EXISTS "Authenticated users can insert community scans" ON public.community_scans;

CREATE POLICY "Authenticated users can insert community scans"
ON public.community_scans
FOR INSERT
TO authenticated
WITH CHECK (
  length(barcode) BETWEEN 1 AND 50
  AND length(product_name) BETWEEN 1 AND 300
  AND (brand IS NULL OR length(brand) <= 300)
  AND (city IS NULL OR length(city) <= 100)
  AND (state IS NULL OR length(state) <= 100)
  AND (score IS NULL OR (score >= 0 AND score <= 100))
  AND (
    image_url IS NULL
    OR image_url ~ '^https://images\.openfoodfacts\.org/'
    OR image_url ~ '^https://images\.openbeautyfacts\.org/'
    OR image_url ~ '^https://world\.openfoodfacts\.org/images/'
    OR image_url ~ '^https://world\.openbeautyfacts\.org/images/'
    OR image_url ~ '^https://static\.openfoodfacts\.org/'
  )
  AND (
    store_id IS NULL
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = community_scans.store_id AND s.owner_id = auth.uid())
  )
);

-- 2. Restrict "Anonymous can submit contact form" strictly to anon role (drop & recreate scoped to anon only)
DROP POLICY IF EXISTS "Anonymous can submit contact form" ON public.contact_submissions;

CREATE POLICY "Anonymous can submit contact form"
ON public.contact_submissions
FOR INSERT
TO anon
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (name IS NULL OR length(name) <= 100)
  AND (message IS NULL OR length(message) <= 2000)
);

-- 3. Explicitly block anon INSERT on user_subscriptions (restrictive)
DROP POLICY IF EXISTS "Anon cannot insert subscriptions" ON public.user_subscriptions;
CREATE POLICY "Anon cannot insert subscriptions"
ON public.user_subscriptions
AS RESTRICTIVE
FOR INSERT
TO anon
WITH CHECK (false);
