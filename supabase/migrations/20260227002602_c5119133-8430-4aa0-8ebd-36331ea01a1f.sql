
-- Replace overly permissive insert policy with a restrictive one
DROP POLICY "Service can insert lead activity" ON public.lead_activity_log;

-- Only allow inserts where user_id matches the authenticated user
CREATE POLICY "Users can insert own lead activity" ON public.lead_activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());
