
-- Optional phone on signups
ALTER TABLE public.scan_signups
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Product contributions table
CREATE TABLE IF NOT EXISTS public.product_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT,
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  country TEXT,
  image_url TEXT,
  contributor_name TEXT,
  contributor_email TEXT,
  contributor_phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No one can read product contributions"
  ON public.product_contributions FOR SELECT TO public USING (false);

CREATE POLICY "No one can update product contributions"
  ON public.product_contributions FOR UPDATE TO authenticated USING (false);

CREATE POLICY "No one can delete product contributions"
  ON public.product_contributions FOR DELETE TO authenticated USING (false);

CREATE POLICY "Anyone can submit a product contribution"
  ON public.product_contributions FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(product_name) BETWEEN 1 AND 300
    AND (barcode IS NULL OR char_length(barcode) BETWEEN 1 AND 50)
    AND (brand IS NULL OR char_length(brand) <= 300)
    AND (category IS NULL OR category IN ('food','beauty','other'))
    AND (country IS NULL OR char_length(country) <= 100)
    AND (image_url IS NULL OR char_length(image_url) <= 1000)
    AND (contributor_name IS NULL OR char_length(contributor_name) <= 100)
    AND (contributor_email IS NULL OR (
      char_length(contributor_email) BETWEEN 5 AND 255
      AND contributor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    ))
    AND (contributor_phone IS NULL OR char_length(contributor_phone) <= 32)
    AND (notes IS NULL OR char_length(notes) <= 1000)
  );

-- Public storage bucket for contribution photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-contributions', 'product-contributions', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read contribution photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-contributions');

CREATE POLICY "Anyone can upload contribution photos"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'product-contributions'
    AND (octet_length(COALESCE(metadata->>'size',''))::int < 16
         OR (metadata->>'size')::bigint < 8 * 1024 * 1024)
  );
