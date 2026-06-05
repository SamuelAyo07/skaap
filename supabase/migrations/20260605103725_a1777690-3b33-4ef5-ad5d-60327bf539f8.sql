
-- 1) Lock down stores: add restrictive policy so only owners can SELECT
CREATE POLICY "Block non-owner reads on stores"
  ON public.stores
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = owner_id);

-- 2) Move pg_trgm out of public into dedicated extensions schema
DROP INDEX IF EXISTS public.idx_cosmetics_catalog_name_trgm;
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
CREATE INDEX idx_cosmetics_catalog_name_trgm
  ON public.cosmetics_catalog
  USING gin (product_name extensions.gin_trgm_ops);
