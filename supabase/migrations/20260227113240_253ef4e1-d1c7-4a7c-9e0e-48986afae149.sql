-- Track purchased credit packs
CREATE TABLE public.credit_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_type TEXT NOT NULL, -- 'leads', 'sms', 'voice_calls', 'workflows'
  credits_total INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  stripe_session_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE -- null = never expires
);

-- Enable RLS
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own credit purchases"
  ON public.credit_purchases FOR SELECT
  USING (user_id = auth.uid());

-- Service role inserts (from edge function after payment verification)
CREATE POLICY "Service role can insert credit purchases"
  ON public.credit_purchases FOR INSERT
  WITH CHECK (true);

-- Users can update their own (for decrementing credits_remaining)
CREATE POLICY "Users can update own credit purchases"
  ON public.credit_purchases FOR UPDATE
  USING (user_id = auth.uid());

-- Admin/chief architect full access
CREATE POLICY "Admin can manage credit purchases"
  ON public.credit_purchases FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Index for fast lookups
CREATE INDEX idx_credit_purchases_user_resource 
  ON public.credit_purchases (user_id, resource_type)
  WHERE credits_remaining > 0;