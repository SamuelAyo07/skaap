
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Store owners can view own products"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = products.store_id AND s.owner_id = auth.uid()
  )
);
