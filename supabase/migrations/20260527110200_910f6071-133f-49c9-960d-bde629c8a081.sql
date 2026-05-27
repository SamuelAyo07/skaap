-- Make product-contributions bucket public so contributed photos display in community feed
UPDATE storage.buckets SET public = true WHERE id = 'product-contributions';

-- Allow anyone (anon or authenticated) to upload contribution photos.
-- This matches the existing "Anyone can submit a product contribution" RLS on product_contributions.
DROP POLICY IF EXISTS "Anyone can upload contribution photos" ON storage.objects;
CREATE POLICY "Anyone can upload contribution photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'product-contributions');

DROP POLICY IF EXISTS "Contribution photos are publicly readable" ON storage.objects;
CREATE POLICY "Contribution photos are publicly readable"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-contributions');