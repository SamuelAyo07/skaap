CREATE TABLE IF NOT EXISTS public.scan_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  source text DEFAULT 'first_scan',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scan_signups_name_len CHECK (char_length(name) BETWEEN 1 AND 100),
  CONSTRAINT scan_signups_email_len CHECK (char_length(email) BETWEEN 3 AND 255),
  CONSTRAINT scan_signups_email_shape CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

ALTER TABLE public.scan_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit scan signup"
  ON public.scan_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(name) > 0 AND char_length(email) > 0);

CREATE POLICY "No one can read scan signups"
  ON public.scan_signups FOR SELECT
  TO public
  USING (false);

CREATE POLICY "No one can update scan signups"
  ON public.scan_signups FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No one can delete scan signups"
  ON public.scan_signups FOR DELETE
  TO authenticated
  USING (false);