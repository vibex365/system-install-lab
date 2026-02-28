
-- Add calendar and approval fields to social_posts
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'brand',
  ADD COLUMN IF NOT EXISTS image_variant text NOT NULL DEFAULT 'bottleneck_dark',
  ADD COLUMN IF NOT EXISTS include_quiz_url boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS subtext text,
  ADD COLUMN IF NOT EXISTS cta_text text;

-- Update existing rows status
UPDATE public.social_posts SET approval_status = 'approved' WHERE status = 'published';
