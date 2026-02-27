
-- Add partner mode columns to user_funnels
ALTER TABLE public.user_funnels
  ADD COLUMN partner_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN affiliate_url text,
  ADD COLUMN completion_action text NOT NULL DEFAULT 'callback';

-- Add affiliate_url to profiles
ALTER TABLE public.profiles
  ADD COLUMN affiliate_url text;
