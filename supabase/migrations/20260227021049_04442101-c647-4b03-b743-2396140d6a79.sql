
-- User settings table for persisted agent toggles and preferences
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  agent_toggles jsonb NOT NULL DEFAULT '{"sms_followup": true, "email_followup": true, "voice_call": false, "booking_agent": false}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin can manage settings" ON public.user_settings FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Outreach log table for tracking email/SMS/call outreach history
CREATE TABLE public.outreach_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  company_name text,
  recipient_email text,
  recipient_phone text,
  email_subject text,
  email_body text,
  sms_body text,
  channel text NOT NULL DEFAULT 'email',
  delivery_status text NOT NULL DEFAULT 'sent',
  grade text,
  issues text[],
  source_url text,
  niche text,
  phone_found text,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.outreach_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outreach" ON public.outreach_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own outreach" ON public.outreach_log FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can manage outreach" ON public.outreach_log FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));
