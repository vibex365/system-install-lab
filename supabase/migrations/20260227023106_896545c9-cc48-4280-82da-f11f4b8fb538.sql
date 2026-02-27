
-- Add niche and target_location to profiles so agents know user context
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS niche text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS target_location text DEFAULT NULL;
