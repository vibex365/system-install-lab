
-- Video content projects for short-form video generation
CREATE TABLE public.video_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  topic text NOT NULL,
  tone text NOT NULL DEFAULT 'educational',
  format text NOT NULL DEFAULT 'solo',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Individual scenes/segments within a video project
CREATE TABLE public.video_scenes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.video_projects(id) ON DELETE CASCADE,
  scene_order integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  narration text NOT NULL,
  visual_prompt text,
  caption_text text,
  image_url text,
  video_url text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_scenes ENABLE ROW LEVEL SECURITY;

-- RLS: chief_architect only (admin tool)
CREATE POLICY "Chief architect can manage video projects"
  ON public.video_projects FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

CREATE POLICY "Chief architect can manage video scenes"
  ON public.video_scenes FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_video_projects_updated_at
  BEFORE UPDATE ON public.video_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for quick lookups
CREATE INDEX idx_video_scenes_project ON public.video_scenes(project_id);
