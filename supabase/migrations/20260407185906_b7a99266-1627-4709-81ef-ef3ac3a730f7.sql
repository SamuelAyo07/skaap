-- 1. Drop the overly permissive SELECT policy on analytics_events
DROP POLICY IF EXISTS "Authenticated users can read analytics" ON public.analytics_events;

-- 2. Add trigger to prevent store owners from self-approving store status
CREATE OR REPLACE FUNCTION public.prevent_status_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Store status can only be changed by administrators';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_store_status_admin_only
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.prevent_status_self_update();