
-- Partner program applications table
CREATE TABLE public.partner_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  business_name text,
  social_url text,
  audience_size text,
  niche text,
  why_partner text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application
CREATE POLICY "Anyone can submit partner applications"
  ON public.partner_applications FOR INSERT
  WITH CHECK (true);

-- Chief architect can manage all partner applications
CREATE POLICY "Chief architect can manage partner applications"
  ON public.partner_applications FOR ALL
  USING (public.has_role(auth.uid(), 'chief_architect'::app_role));

-- Admin can manage partner applications
CREATE POLICY "Admin can manage partner applications"
  ON public.partner_applications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));
