
-- Add new columns to applications table
ALTER TABLE public.applications
  ADD COLUMN phone_number TEXT,
  ADD COLUMN stripe_session_id TEXT,
  ADD COLUMN payment_status TEXT DEFAULT 'pending',
  ADD COLUMN monthly_revenue TEXT,
  ADD COLUMN hours_per_week TEXT,
  ADD COLUMN team_status TEXT,
  ADD COLUMN failed_projects TEXT,
  ADD COLUMN failure_reason TEXT,
  ADD COLUMN peak_productivity TEXT,
  ADD COLUMN momentum_loss TEXT,
  ADD COLUMN disruptive_emotion TEXT,
  ADD COLUMN avoiding TEXT,
  ADD COLUMN consequence TEXT,
  ADD COLUMN willing_structure BOOLEAN,
  ADD COLUMN willing_reviews BOOLEAN,
  ADD COLUMN psychological_score INTEGER;
