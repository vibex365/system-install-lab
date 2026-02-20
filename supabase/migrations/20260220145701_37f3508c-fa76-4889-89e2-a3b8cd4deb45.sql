-- Add schedule column to agent_leases
ALTER TABLE public.agent_leases
  ADD COLUMN IF NOT EXISTS schedule text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS next_run_at timestamp with time zone DEFAULT NULL;

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'agent_run',
  title text NOT NULL,
  body text,
  agent_run_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.user_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.user_notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime on user_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;