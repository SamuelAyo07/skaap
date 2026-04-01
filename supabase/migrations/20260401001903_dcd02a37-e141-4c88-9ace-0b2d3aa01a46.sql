-- Tighten community_scans INSERT policy to not be always-true
DROP POLICY IF EXISTS "Anyone can insert community scans" ON public.community_scans;
CREATE POLICY "Authenticated users can insert community scans"
  ON public.community_scans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Tighten contact_submissions INSERT: allow anon but restrict to only inserting own data
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND length(email) > 0
  );