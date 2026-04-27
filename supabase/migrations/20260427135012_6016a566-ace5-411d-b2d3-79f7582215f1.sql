
-- 1) Community scans: drop public anon SELECT, keep authenticated-only
DROP POLICY IF EXISTS "Anyone can read community scans" ON public.community_scans;
-- "Authenticated users can view community scans" already exists and remains

-- 2) Stores: replace permissive public SELECT with a column-safe view
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;

-- Public-safe view excluding owner_id
CREATE OR REPLACE VIEW public.public_stores
WITH (security_invoker = true) AS
SELECT id, name, address, lat, lng, status, created_at
FROM public.stores
WHERE status = 'active';

GRANT SELECT ON public.public_stores TO anon, authenticated;

-- Re-add a SELECT policy for authenticated users on the base table (own access only via existing "Owners can manage own stores")
-- Public reads must now go through public_stores view.

-- 3) Contact submissions: require authenticated users to match their JWT email
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

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

CREATE POLICY "Authenticated must use own email"
ON public.contact_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (name IS NULL OR length(name) <= 100)
  AND (message IS NULL OR length(message) <= 2000)
  AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- 4) Lock down SECURITY DEFINER trigger functions (not meant to be called via API)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_status_self_update() FROM anon, authenticated, public;
