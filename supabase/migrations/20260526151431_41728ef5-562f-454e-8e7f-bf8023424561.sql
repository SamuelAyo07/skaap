
-- 1. Make the product-contributions bucket private
UPDATE storage.buckets SET public = false WHERE id = 'product-contributions';

-- 2. Clean up any existing policies for this bucket to ensure a clean slate
DROP POLICY IF EXISTS "Anyone can upload product contribution photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product contribution photos" ON storage.objects;
DROP POLICY IF EXISTS "Product contributions public read" ON storage.objects;
DROP POLICY IF EXISTS "Product contributions anon insert" ON storage.objects;
DROP POLICY IF EXISTS "Product contributions authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "product_contributions_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_contributions_select" ON storage.objects;
DROP POLICY IF EXISTS "product_contributions_update" ON storage.objects;
DROP POLICY IF EXISTS "product_contributions_delete" ON storage.objects;

-- 3. Allow anyone (anon + authenticated) to INSERT a contribution photo only
CREATE POLICY "product_contributions_insert"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'product-contributions');

-- 4. Block SELECT / UPDATE / DELETE for anon and authenticated.
--    Only service_role (edge functions / admin) can read, modify, or remove files.
CREATE POLICY "product_contributions_no_select"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-contributions' AND false);

CREATE POLICY "product_contributions_no_update"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'product-contributions' AND false);

CREATE POLICY "product_contributions_no_delete"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'product-contributions' AND false);
