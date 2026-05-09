-- Stores: owner-only visibility
DROP POLICY IF EXISTS "Authenticated users can view active stores" ON public.stores;

-- Drop dependent insert policy, drop column, recreate policy without zip_code
DROP POLICY IF EXISTS "Authenticated users can insert community scans" ON public.community_scans;

UPDATE public.community_scans SET zip_code = NULL WHERE zip_code IS NOT NULL;
ALTER TABLE public.community_scans DROP COLUMN IF EXISTS zip_code;

CREATE POLICY "Authenticated users can insert community scans"
ON public.community_scans
FOR INSERT
TO authenticated
WITH CHECK (
  length(barcode) BETWEEN 1 AND 50
  AND length(product_name) BETWEEN 1 AND 300
);