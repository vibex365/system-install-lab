
-- 1. user_integrations table
CREATE TABLE public.user_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'meta_ads',
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one integration per provider per user
ALTER TABLE public.user_integrations ADD CONSTRAINT user_integrations_user_provider_unique UNIQUE (user_id, provider);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON public.user_integrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own integrations"
  ON public.user_integrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own integrations"
  ON public.user_integrations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own integrations"
  ON public.user_integrations FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Chief architect can manage integrations"
  ON public.user_integrations FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. ad_campaigns table
CREATE TABLE public.ad_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT 'OUTCOME_LEADS',
  daily_budget_cents INTEGER NOT NULL DEFAULT 1000,
  target_audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  ad_copy JSONB NOT NULL DEFAULT '{}'::jsonb,
  creative_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
  meta_campaign_id TEXT,
  meta_adset_id TEXT,
  meta_ad_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  performance JSONB NOT NULL DEFAULT '{"impressions":0,"clicks":0,"spend_cents":0,"leads":0}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON public.ad_campaigns FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own campaigns"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns"
  ON public.ad_campaigns FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own campaigns"
  ON public.ad_campaigns FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Chief architect can manage campaigns"
  ON public.ad_campaigns FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Storage bucket for ad creatives
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-creatives', 'ad-creatives', true);

-- Storage RLS: users upload to their own folder (user_id prefix)
CREATE POLICY "Users can upload own creatives"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ad-creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own creatives"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own creatives"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ad-creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view ad creatives"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-creatives');
