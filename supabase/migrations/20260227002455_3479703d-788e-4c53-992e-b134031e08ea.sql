
-- Create lead activity log table
CREATE TABLE public.lead_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lead activity" ON public.lead_activity_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Chief architect can manage lead activity" ON public.lead_activity_log
  FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Allow inserts from triggers (service role)
CREATE POLICY "Service can insert lead activity" ON public.lead_activity_log
  FOR INSERT WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_lead_activity_log_user ON public.lead_activity_log(user_id, created_at DESC);
CREATE INDEX idx_lead_activity_log_lead ON public.lead_activity_log(lead_id);

-- Trigger function to log pipeline status changes
CREATE OR REPLACE FUNCTION public.log_lead_pipeline_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status THEN
    INSERT INTO public.lead_activity_log (lead_id, user_id, from_status, to_status)
    VALUES (NEW.id, NEW.user_id, OLD.pipeline_status, NEW.pipeline_status);
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to leads table
CREATE TRIGGER on_lead_pipeline_change
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_pipeline_change();

-- Enable realtime for leads and lead_activity_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activity_log;
