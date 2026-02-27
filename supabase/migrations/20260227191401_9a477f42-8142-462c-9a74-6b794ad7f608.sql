
-- Dream 100 table for tracking influencer/partner targets
CREATE TABLE public.dream_100 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  url text,
  niche text,
  followers_estimate integer,
  status text NOT NULL DEFAULT 'suggested',
  outreach_status text NOT NULL DEFAULT 'not_started',
  notes text,
  ai_suggested boolean NOT NULL DEFAULT false,
  last_checked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dream_100 ENABLE ROW LEVEL SECURITY;

-- Users manage their own Dream 100 list
CREATE POLICY "Users can view own dream 100"
  ON public.dream_100 FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own dream 100"
  ON public.dream_100 FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own dream 100"
  ON public.dream_100 FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own dream 100"
  ON public.dream_100 FOR DELETE
  USING (user_id = auth.uid());

-- Admin/chief architect full access
CREATE POLICY "Admin can manage dream 100"
  ON public.dream_100 FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_dream_100_updated_at
  BEFORE UPDATE ON public.dream_100
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Voice memo log table
CREATE TABLE public.voice_memos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id),
  call_log_id uuid REFERENCES public.call_logs(id),
  phone_number text NOT NULL,
  script text NOT NULL,
  twilio_call_sid text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice memos"
  ON public.voice_memos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin can manage voice memos"
  ON public.voice_memos FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));
