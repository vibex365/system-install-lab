
-- ============================================
-- TABLE: leads (CRM storage)
-- ============================================
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL DEFAULT '',
  contact_name text,
  phone text,
  email text,
  website text,
  address text,
  city text,
  category text,
  rating numeric,
  website_quality_score integer,
  audit_summary text,
  pipeline_status text NOT NULL DEFAULT 'scraped',
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads"
  ON public.leads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own leads"
  ON public.leads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own leads"
  ON public.leads FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own leads"
  ON public.leads FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Chief architect can manage leads"
  ON public.leads FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'));

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: booking_settings
-- ============================================
CREATE TABLE public.booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  timezone text NOT NULL DEFAULT 'America/New_York',
  available_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  start_hour integer NOT NULL DEFAULT 9,
  end_hour integer NOT NULL DEFAULT 17,
  slot_duration_minutes integer NOT NULL DEFAULT 30,
  booking_slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own booking settings"
  ON public.booking_settings FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Public can view booking settings by slug"
  ON public.booking_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own booking settings"
  ON public.booking_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- TABLE: bookings
-- ============================================
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host can view own bookings"
  ON public.bookings FOR SELECT
  USING (host_user_id = auth.uid());

CREATE POLICY "Host can update own bookings"
  ON public.bookings FOR UPDATE
  USING (host_user_id = auth.uid());

CREATE POLICY "Anyone can insert bookings"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can view bookings for availability check"
  ON public.bookings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Chief architect can manage bookings"
  ON public.bookings FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'));
