
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  page text,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  screen_width integer
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read analytics"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_analytics_events_type ON public.analytics_events (event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at);
CREATE INDEX idx_analytics_events_session ON public.analytics_events (session_id);
