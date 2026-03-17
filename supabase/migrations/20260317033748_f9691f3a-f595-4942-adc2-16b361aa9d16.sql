
-- Community scans table for anonymous aggregate intelligence
CREATE TABLE public.community_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text NOT NULL,
  product_name text NOT NULL,
  brand text,
  score integer,
  image_url text,
  city text,
  state text,
  zip_code text,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  scan_timestamp timestamptz NOT NULL DEFAULT now(),
  saved boolean DEFAULT false,
  additives_flagged jsonb DEFAULT '[]'::jsonb
);

-- RLS: anyone can insert (we strip user identity), authenticated can read aggregates
ALTER TABLE public.community_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert community scans"
  ON public.community_scans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read community scans"
  ON public.community_scans FOR SELECT
  TO authenticated
  USING (true);

-- Index for fast city+time queries
CREATE INDEX idx_community_scans_city_time ON public.community_scans (city, scan_timestamp DESC);
CREATE INDEX idx_community_scans_barcode ON public.community_scans (barcode);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_scans;
