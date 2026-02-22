
-- Call logs table for tracking VAPI calls
CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  call_type text NOT NULL,
  country_code text DEFAULT '+1',
  vapi_call_id text,
  status text NOT NULL DEFAULT 'initiated',
  duration_seconds integer,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage call logs"
  ON public.call_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Chief architect can manage call logs"
  ON public.call_logs FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

CREATE POLICY "Users can view own call logs"
  ON public.call_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_call_logs_updated_at
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
