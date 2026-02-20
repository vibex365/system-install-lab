-- Tighten the INSERT policy: only service role (bypasses RLS) writes notifications
-- Drop the overly permissive INSERT policy and rely on service role bypass instead
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.user_notifications;