
-- Table to log incoming social media comments from Late.dev webhooks
CREATE TABLE public.social_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  late_comment_id text,
  late_post_id text,
  social_post_id uuid REFERENCES public.social_posts(id) ON DELETE SET NULL,
  platform text,
  commenter_name text,
  comment_text text NOT NULL,
  comment_url text,
  matched_keywords text[] DEFAULT '{}',
  sms_sent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chief architect can manage social comments"
  ON public.social_comments FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

CREATE POLICY "Service role can insert social comments"
  ON public.social_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can select social comments"
  ON public.social_comments FOR SELECT
  USING (true);
