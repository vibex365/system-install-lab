
-- Create otp_codes table for phone verification
CREATE TABLE public.otp_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  code text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access, no public access needed
CREATE POLICY "Service role manages OTP codes"
  ON public.otp_codes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_otp_codes_phone_expires ON public.otp_codes (phone, expires_at DESC);
