
-- Add keyword column for comment CTA strategy
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS keyword text;
