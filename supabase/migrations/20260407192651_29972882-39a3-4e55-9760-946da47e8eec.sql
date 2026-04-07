DROP POLICY "Anyone can insert analytics events" ON analytics_events;
CREATE POLICY "Authenticated users can insert analytics" ON analytics_events
  FOR INSERT TO authenticated WITH CHECK (true);