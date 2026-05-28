-- Trigger functions don't need EXECUTE for trigger firing; revoke direct callability.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_plus_for_alerts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_status_self_update() FROM PUBLIC, anon, authenticated;