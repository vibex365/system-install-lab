
-- Add email and phone to dream_100
ALTER TABLE public.dream_100 ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.dream_100 ADD COLUMN IF NOT EXISTS phone text;

-- Create affiliate_program table
CREATE TABLE public.affiliate_program (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text UNIQUE NOT NULL,
  commission_percent numeric NOT NULL DEFAULT 20,
  status text NOT NULL DEFAULT 'invited',
  invited_by uuid NOT NULL,
  invited_email text NOT NULL,
  total_earned numeric NOT NULL DEFAULT 0,
  total_referrals integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_program ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chief architect can manage affiliates"
ON public.affiliate_program FOR ALL
USING (has_role(auth.uid(), 'chief_architect'::app_role));

CREATE POLICY "Users can view own affiliate"
ON public.affiliate_program FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own affiliate"
ON public.affiliate_program FOR UPDATE
USING (user_id = auth.uid());

-- Create affiliate_referrals table
CREATE TABLE public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_program(id) ON DELETE CASCADE,
  referred_user_id uuid,
  referred_email text NOT NULL,
  payment_id uuid REFERENCES public.payments(id),
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chief architect can manage referrals"
ON public.affiliate_referrals FOR ALL
USING (has_role(auth.uid(), 'chief_architect'::app_role));

CREATE POLICY "Affiliates can view own referrals"
ON public.affiliate_referrals FOR SELECT
USING (affiliate_id IN (
  SELECT id FROM public.affiliate_program WHERE user_id = auth.uid()
));
