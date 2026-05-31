CREATE TABLE public.user_health_profile (
  user_id uuid PRIMARY KEY,
  goal text NOT NULL DEFAULT 'general_wellness',
  dietary text[] NOT NULL DEFAULT '{}',
  avoid_ingredients text[] NOT NULL DEFAULT '{}',
  budget_sensitivity text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_health_profile TO authenticated;
GRANT ALL ON public.user_health_profile TO service_role;

ALTER TABLE public.user_health_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own health profile"
  ON public.user_health_profile FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own health profile"
  ON public.user_health_profile FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own health profile"
  ON public.user_health_profile FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own health profile"
  ON public.user_health_profile FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_health_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_health_profile_updated_at
  BEFORE UPDATE ON public.user_health_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_health_profile_updated_at();