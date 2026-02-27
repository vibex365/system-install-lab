-- Fix the overly permissive insert policy on credit_purchases
DROP POLICY "Service role can insert credit purchases" ON public.credit_purchases;

-- Only allow inserts where user_id matches the authenticated user
CREATE POLICY "Users can insert own credit purchases"
  ON public.credit_purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());