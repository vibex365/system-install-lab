
-- 2. Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cohort_id uuid,
  ADD COLUMN IF NOT EXISTS attendance_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_missed_sessions int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attended_at timestamptz,
  ADD COLUMN IF NOT EXISTS certified_at timestamptz;

-- 3. Create cohorts table
CREATE TABLE IF NOT EXISTS public.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  day_of_week int NOT NULL,
  time_slot text NOT NULL,
  capacity int NOT NULL DEFAULT 10,
  lead_id uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chief architect can manage cohorts" ON public.cohorts
  FOR ALL USING (public.has_role(auth.uid(), 'chief_architect'));

CREATE POLICY "Active members can view cohorts" ON public.cohorts
  FOR SELECT USING (
    (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
    OR public.has_role(auth.uid(), 'chief_architect')
    OR public.has_role(auth.uid(), 'architect_lead')
  );

-- 4. Create cohort_members table
CREATE TABLE IF NOT EXISTS public.cohort_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id),
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cohort_id, user_id)
);
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chief architect can manage cohort_members" ON public.cohort_members
  FOR ALL USING (public.has_role(auth.uid(), 'chief_architect'));

CREATE POLICY "Leads can view their cohort members" ON public.cohort_members
  FOR SELECT USING (
    cohort_id IN (SELECT id FROM public.cohorts WHERE lead_id = auth.uid())
    OR public.has_role(auth.uid(), 'chief_architect')
  );

CREATE POLICY "Members can view own membership" ON public.cohort_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Active members can insert own membership" ON public.cohort_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
  );

-- 5. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  stripe_session_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chief architect can view all payments" ON public.payments
  FOR SELECT USING (public.has_role(auth.uid(), 'chief_architect'));

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

-- 6. Create prompt_packages table
CREATE TABLE IF NOT EXISTS public.prompt_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view packages" ON public.prompt_packages
  FOR SELECT USING (
    (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
    OR public.has_role(auth.uid(), 'chief_architect')
    OR public.has_role(auth.uid(), 'architect_lead')
  );

CREATE POLICY "Chief architect can manage packages" ON public.prompt_packages
  FOR ALL USING (public.has_role(auth.uid(), 'chief_architect'));

-- Seed prompt packages
INSERT INTO public.prompt_packages (slug, name, description) VALUES
  ('mvp', 'MVP', 'Minimum viable product builds'),
  ('saas', 'SaaS', 'Software-as-a-service applications'),
  ('ecom', 'E-Commerce', 'Online store and commerce platforms'),
  ('agency', 'Agency', 'Agency and service business tools'),
  ('client-web', 'Client Web', 'Client-facing websites and portals'),
  ('internal-tools', 'Internal Tools', 'Internal business tooling and dashboards');

-- 7. Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.prompt_packages(id),
  title text NOT NULL,
  summary text,
  prompt_text text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  complexity text,
  version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'approved',
  created_by uuid,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view approved prompts" ON public.prompts
  FOR SELECT USING (
    (status = 'approved' AND (
      (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
      OR public.has_role(auth.uid(), 'chief_architect')
      OR public.has_role(auth.uid(), 'architect_lead')
    ))
    OR public.has_role(auth.uid(), 'chief_architect')
  );

CREATE POLICY "Chief architect can manage prompts" ON public.prompts
  FOR ALL USING (public.has_role(auth.uid(), 'chief_architect'));

-- 8. Create prompt_versions table
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.prompts(id),
  version int NOT NULL,
  prompt_text text NOT NULL,
  changelog text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view versions" ON public.prompt_versions
  FOR SELECT USING (
    (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
    OR public.has_role(auth.uid(), 'chief_architect')
    OR public.has_role(auth.uid(), 'architect_lead')
  );

CREATE POLICY "Chief architect can manage versions" ON public.prompt_versions
  FOR ALL USING (public.has_role(auth.uid(), 'chief_architect'));

-- 9. Create prompt_submissions table
CREATE TABLE IF NOT EXISTS public.prompt_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES public.prompt_packages(id),
  submitted_by uuid NOT NULL,
  title text NOT NULL,
  target_user text,
  problem text,
  scope text,
  integrations text[] DEFAULT '{}',
  raw_prompt text NOT NULL,
  status text NOT NULL DEFAULT 'pending_review',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can submit" ON public.prompt_submissions
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid()
    AND (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
  );

CREATE POLICY "Users can view own submissions" ON public.prompt_submissions
  FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Chief architect can manage submissions" ON public.prompt_submissions
  FOR ALL USING (public.has_role(auth.uid(), 'chief_architect'));

-- 10. Create prompt_sessions (memory)
CREATE TABLE IF NOT EXISTS public.prompt_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  context_json jsonb NOT NULL DEFAULT '{}',
  last_output text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON public.prompt_sessions
  FOR ALL USING (user_id = auth.uid());

-- 11. Create prompt_generations (usage monitoring)
CREATE TABLE IF NOT EXISTS public.prompt_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.prompt_sessions(id),
  tokens_estimate int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations" ON public.prompt_generations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own generations" ON public.prompt_generations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chief architect can view all generations" ON public.prompt_generations
  FOR SELECT USING (public.has_role(auth.uid(), 'chief_architect'));

-- 12. Add cohort FK to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_cohort_id_fkey') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);
  END IF;
END $$;

-- 13. Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cohorts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cohort_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prompt_sessions;
