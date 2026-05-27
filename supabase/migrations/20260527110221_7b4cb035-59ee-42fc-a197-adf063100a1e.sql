-- Public buckets serve files via direct URL without needing a broad SELECT policy.
-- Drop the broad read policy to prevent file-listing while keeping URL access working.
DROP POLICY IF EXISTS "Contribution photos are publicly readable" ON storage.objects;