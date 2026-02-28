
-- Table to log social media posts
CREATE TABLE public.social_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  media_urls text[] NOT NULL DEFAULT '{}',
  scheduled_for timestamp with time zone,
  late_post_id text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chief architect can manage social posts"
  ON public.social_posts FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));
