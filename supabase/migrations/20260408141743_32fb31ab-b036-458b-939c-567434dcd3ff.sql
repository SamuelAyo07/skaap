-- Add INSERT policy for orders table scoped to authenticated users
CREATE POLICY "Authenticated users can create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for orders table scoped to owner
CREATE POLICY "Users can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);