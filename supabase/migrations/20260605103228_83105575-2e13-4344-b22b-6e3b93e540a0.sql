
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.cosmetics_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  ingredients_text TEXT,
  inci_list TEXT[],
  allergens TEXT[],
  allergen_highlights TEXT[],
  cosmetic_form TEXT,
  skin_type TEXT[],
  spf INTEGER,
  size TEXT,
  categories TEXT[],
  periods_after_opening TEXT,
  packaging TEXT,
  source TEXT NOT NULL DEFAULT 'open_beauty_facts',
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cosmetics_catalog TO anon, authenticated;
GRANT ALL ON public.cosmetics_catalog TO service_role;

ALTER TABLE public.cosmetics_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can browse cosmetics catalog"
  ON public.cosmetics_catalog
  FOR SELECT
  USING (true);

CREATE POLICY "Service role manages cosmetics catalog"
  ON public.cosmetics_catalog
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cosmetics_catalog_brand ON public.cosmetics_catalog (brand);
CREATE INDEX IF NOT EXISTS idx_cosmetics_catalog_form ON public.cosmetics_catalog (cosmetic_form);
CREATE INDEX IF NOT EXISTS idx_cosmetics_catalog_spf ON public.cosmetics_catalog (spf) WHERE spf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cosmetics_catalog_name_trgm ON public.cosmetics_catalog USING gin (product_name gin_trgm_ops);

CREATE TRIGGER update_cosmetics_catalog_updated_at
  BEFORE UPDATE ON public.cosmetics_catalog
  FOR EACH ROW EXECUTE FUNCTION public.touch_health_profile_updated_at();
