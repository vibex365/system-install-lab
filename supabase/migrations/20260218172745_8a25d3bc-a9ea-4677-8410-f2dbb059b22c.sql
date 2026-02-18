
-- Jobs queue for OpenClaw packaging worker
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Job audit trail
CREATE TABLE public.job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  step text NOT NULL,
  input_snippet text,
  output_snippet text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;

-- Only chief_architect can manage jobs
CREATE POLICY "Chief architect can manage jobs"
  ON public.jobs FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

CREATE POLICY "Chief architect can manage job_runs"
  ON public.job_runs FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'::app_role));

-- Trigger to update updated_at on jobs
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add packaged output columns to prompt_submissions
ALTER TABLE public.prompt_submissions
  ADD COLUMN IF NOT EXISTS packaged_prompt text,
  ADD COLUMN IF NOT EXISTS packaged_summary text,
  ADD COLUMN IF NOT EXISTS packaged_tags text[],
  ADD COLUMN IF NOT EXISTS packaged_complexity text;
