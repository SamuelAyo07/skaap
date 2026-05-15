
CREATE OR REPLACE FUNCTION public.is_plus_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND plan = 'plus'
      AND status IN ('active','trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.enforce_plus_for_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_plus_user(NEW.user_id) THEN
    RAISE EXCEPTION 'SKAAP Plus subscription required to create custom alerts';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_alerts_require_plus ON public.user_alerts;
CREATE TRIGGER user_alerts_require_plus
BEFORE INSERT ON public.user_alerts
FOR EACH ROW EXECUTE FUNCTION public.enforce_plus_for_alerts();
