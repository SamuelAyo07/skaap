
REVOKE EXECUTE ON FUNCTION public.is_plus_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_plus_for_alerts() FROM PUBLIC, anon, authenticated;
