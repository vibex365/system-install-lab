
-- Add columns to call_logs for quiz/voice call data
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS quiz_score integer,
  ADD COLUMN IF NOT EXISTS quiz_result_label text,
  ADD COLUMN IF NOT EXISTS quiz_answers jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS quiz_id uuid,
  ADD COLUMN IF NOT EXISTS submission_id text,
  ADD COLUMN IF NOT EXISTS lead_id uuid,
  ADD COLUMN IF NOT EXISTS call_summary text,
  ADD COLUMN IF NOT EXISTS call_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS call_recording_url text,
  ADD COLUMN IF NOT EXISTS appointment_id uuid,
  ADD COLUMN IF NOT EXISTS booking_made boolean DEFAULT false;

-- Add sms_opt_out to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS sms_opt_out boolean DEFAULT false;

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id),
  title text NOT NULL,
  description text,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own appointments" ON public.appointments FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Chief architect can manage appointments" ON public.appointments FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));
CREATE POLICY "Admin can manage appointments" ON public.appointments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role inserts (edge functions use service role)
CREATE POLICY "Service role inserts appointments" ON public.appointments FOR INSERT WITH CHECK (true);

-- Create availability_slots table
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own slots" ON public.availability_slots FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own slots" ON public.availability_slots FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own slots" ON public.availability_slots FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own slots" ON public.availability_slots FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Chief architect can manage slots" ON public.availability_slots FOR ALL USING (has_role(auth.uid(), 'chief_architect'::app_role));
CREATE POLICY "Public can view slots for booking" ON public.availability_slots FOR SELECT USING (true);

-- Add FK from call_logs.lead_id to leads
ALTER TABLE public.call_logs ADD CONSTRAINT call_logs_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);
ALTER TABLE public.call_logs ADD CONSTRAINT call_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);
