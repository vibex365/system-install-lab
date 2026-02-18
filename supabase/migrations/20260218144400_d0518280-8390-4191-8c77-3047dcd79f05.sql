
-- Add accepted_pending_payment to member_status enum
ALTER TYPE member_status ADD VALUE IF NOT EXISTS 'accepted_pending_payment';

-- Create system_meta table
CREATE TABLE public.system_meta (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL DEFAULT 'v1',
  founding_access_open boolean NOT NULL DEFAULT true,
  base_price integer NOT NULL DEFAULT 500,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on system_meta
ALTER TABLE public.system_meta ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT
CREATE POLICY "Admin can view system_meta"
  ON public.system_meta FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin-only UPDATE
CREATE POLICY "Admin can update system_meta"
  ON public.system_meta FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public read for edge functions (anon needs to read base_price)
CREATE POLICY "Anon can read system_meta"
  ON public.system_meta FOR SELECT
  USING (true);

-- Seed one row
INSERT INTO public.system_meta (version, founding_access_open, base_price) VALUES ('v1', true, 500);

-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS member_tier text,
  ADD COLUMN IF NOT EXISTS invite_reputation_score integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS invite_multiplier double precision NOT NULL DEFAULT 1.0;

-- Update handle_new_user trigger to set accepted_pending_payment instead of active
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _app RECORD;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Assign default 'member' role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');

  -- Check if there's an accepted application matching this email
  SELECT * INTO _app FROM public.applications
  WHERE email = NEW.email AND status = 'accepted'
  LIMIT 1;

  IF FOUND THEN
    -- Set to accepted_pending_payment (not active) so they see the induction page
    UPDATE public.profiles SET member_status = 'accepted_pending_payment' WHERE id = NEW.id;
    -- Link the application
    UPDATE public.applications SET user_id = NEW.id WHERE id = _app.id;
  END IF;

  RETURN NEW;
END;
$function$;
