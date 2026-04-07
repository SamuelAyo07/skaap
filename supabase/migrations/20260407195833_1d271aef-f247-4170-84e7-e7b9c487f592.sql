CREATE TRIGGER prevent_store_status_self_update
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_status_self_update();