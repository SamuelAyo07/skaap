
-- Strengthen user_alerts INSERT policy with length guards
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.user_alerts;
CREATE POLICY "Users can insert own alerts" ON public.user_alerts
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND char_length(ingredient_name) BETWEEN 1 AND 200
  AND (ingredient_code IS NULL OR char_length(ingredient_code) <= 200)
);

-- Tighten product-contributions storage upload policies
DROP POLICY IF EXISTS "Anyone can upload contribution photos" ON storage.objects;
DROP POLICY IF EXISTS "product_contributions_insert" ON storage.objects;

CREATE POLICY "product_contributions_insert"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'product-contributions'
  AND (metadata->>'size')::bigint < 8 * 1024 * 1024
  AND (metadata->>'mimetype') IN ('image/jpeg','image/png','image/webp')
);
