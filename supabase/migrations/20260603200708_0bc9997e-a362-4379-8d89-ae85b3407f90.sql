DROP POLICY IF EXISTS "Authenticated users can create own orders" ON public.orders;

CREATE POLICY "Authenticated users can create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    store_id IS NULL
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id)
  )
);