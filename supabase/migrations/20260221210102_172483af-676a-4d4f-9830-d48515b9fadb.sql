
-- Create funnel_leads table for leads captured by smart funnels
CREATE TABLE public.funnel_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_owner_id uuid REFERENCES auth.users(id),
  funnel_name text DEFAULT 'intake',
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  score integer,
  tier text,
  answers jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (public funnel)
CREATE POLICY "Anyone can insert funnel leads"
ON public.funnel_leads FOR INSERT
WITH CHECK (true);

-- Owner can view their funnel leads
CREATE POLICY "Owner can view funnel leads"
ON public.funnel_leads FOR SELECT TO authenticated
USING (
  funnel_owner_id = auth.uid()
  OR has_role(auth.uid(), 'chief_architect'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Chief architect can manage
CREATE POLICY "Chief architect can manage funnel leads"
ON public.funnel_leads FOR ALL TO authenticated
USING (has_role(auth.uid(), 'chief_architect'::app_role));
