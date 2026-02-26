
-- Workflow = a user's goal decomposed into steps
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  memory JSONB NOT NULL DEFAULT '{}'::jsonb,
  niche TEXT DEFAULT 'mlm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each step in the workflow
CREATE TABLE public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  position INT NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funnel templates marketplace
CREATE TABLE public.funnel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  niche TEXT NOT NULL DEFAULT 'mlm',
  preview_url TEXT,
  quiz_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_cents INT NOT NULL DEFAULT 0,
  downloads INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User's deployed funnels
CREATE TABLE public.user_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.funnel_templates(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  quiz_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  brand_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  submissions_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usage tracking table for metered billing
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  leads_used INT NOT NULL DEFAULT 0,
  workflows_used INT NOT NULL DEFAULT 0,
  funnels_used INT NOT NULL DEFAULT 0,
  sms_used INT NOT NULL DEFAULT 0,
  voice_calls_used INT NOT NULL DEFAULT 0,
  campaigns_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Niche configuration table
CREATE TABLE public.niche_config (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  pipeline_stages TEXT[] NOT NULL DEFAULT '{}',
  quiz_prompt_context TEXT,
  outreach_templates JSONB NOT NULL DEFAULT '{}'::jsonb,
  cta_label TEXT NOT NULL DEFAULT 'Book Your Call',
  stat_labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niche_config ENABLE ROW LEVEL SECURITY;

-- Workflows RLS
CREATE POLICY "Users can view own workflows" ON public.workflows FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own workflows" ON public.workflows FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own workflows" ON public.workflows FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own workflows" ON public.workflows FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admin can manage workflows" ON public.workflows FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Workflow steps RLS (access via workflow ownership)
CREATE POLICY "Users can view own steps" ON public.workflow_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can insert own steps" ON public.workflow_steps FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can update own steps" ON public.workflow_steps FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND w.user_id = auth.uid()));
CREATE POLICY "Admin can manage steps" ON public.workflow_steps FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Funnel templates RLS (public read, admin write)
CREATE POLICY "Anyone can view templates" ON public.funnel_templates FOR SELECT USING (true);
CREATE POLICY "Admin can manage templates" ON public.funnel_templates FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- User funnels RLS
CREATE POLICY "Users can view own funnels" ON public.user_funnels FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own funnels" ON public.user_funnels FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own funnels" ON public.user_funnels FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own funnels" ON public.user_funnels FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admin can manage user funnels" ON public.user_funnels FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Usage tracking RLS
CREATE POLICY "Users can view own usage" ON public.usage_tracking FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin can manage usage" ON public.usage_tracking FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Niche config RLS (public read)
CREATE POLICY "Anyone can view niche config" ON public.niche_config FOR SELECT USING (true);
CREATE POLICY "Admin can manage niche config" ON public.niche_config FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Updated_at triggers
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_funnels_updated_at BEFORE UPDATE ON public.user_funnels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DB function for usage increment
CREATE OR REPLACE FUNCTION public.get_or_create_usage(p_user_id UUID)
RETURNS public.usage_tracking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result usage_tracking;
BEGIN
  INSERT INTO usage_tracking (user_id, period_start)
  VALUES (p_user_id, date_trunc('month', now())::date)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  SELECT * INTO result FROM usage_tracking
  WHERE user_id = p_user_id AND period_start = date_trunc('month', now())::date;
  
  RETURN result;
END;
$$;

-- Indexes
CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_workflows_status ON public.workflows(status);
CREATE INDEX idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);
CREATE INDEX idx_user_funnels_user_id ON public.user_funnels(user_id);
CREATE INDEX idx_user_funnels_slug ON public.user_funnels(slug);
CREATE INDEX idx_usage_tracking_user_period ON public.usage_tracking(user_id, period_start);

-- Seed niche configs
INSERT INTO public.niche_config (id, display_name, pipeline_stages, quiz_prompt_context, outreach_templates, cta_label, stat_labels) VALUES
('mlm', 'MLM / Network Marketing', ARRAY['prospect', 'contacted', 'interested', 'enrolled', 'active_rep'], 'Create a quiz that helps people discover if network marketing is right for their lifestyle and income goals', '{"email": "mlm_opportunity_intro", "sms": "mlm_quick_connect"}'::jsonb, 'Book Your Strategy Call', '{"leads": "Prospects", "booked": "Calls Booked", "converted": "Reps Enrolled"}'::jsonb),
('affiliate', 'Affiliate Marketing', ARRAY['lead', 'clicked', 'signed_up', 'first_sale', 'recurring'], 'Create a quiz that identifies the best affiliate program match based on skills, audience, and income goals', '{"email": "affiliate_opportunity", "sms": "affiliate_quick_pitch"}'::jsonb, 'Start Earning Today', '{"leads": "Leads", "booked": "Demos", "converted": "Sign-ups"}'::jsonb),
('coaching', 'Online Coaching', ARRAY['inquiry', 'discovery_call', 'proposal', 'enrolled', 'active_client'], 'Create a quiz that helps potential clients identify their biggest growth blockers and readiness for coaching', '{"email": "coaching_value_intro", "sms": "coaching_followup"}'::jsonb, 'Book Your Free Discovery Call', '{"leads": "Inquiries", "booked": "Discovery Calls", "converted": "Clients"}'::jsonb),
('home_business', 'Work From Home', ARRAY['interested', 'qualified', 'onboarding', 'launched', 'earning'], 'Create a quiz that matches people with the best work-from-home opportunity based on their skills, time, and goals', '{"email": "wfh_opportunity", "sms": "wfh_quick_connect"}'::jsonb, 'Find Your Perfect Opportunity', '{"leads": "Interested", "booked": "Calls", "converted": "Started"}'::jsonb);

-- Enable realtime for workflows
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_steps;
