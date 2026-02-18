-- Fix the applications SELECT policy that references auth.users (causing permission denied)
DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;

CREATE POLICY "Users can view own applications"
ON public.applications
FOR SELECT
USING (user_id = auth.uid());

-- Also add chief_architect to the admin policies so they work with that role too
DROP POLICY IF EXISTS "Admin can view all applications" ON public.applications;
CREATE POLICY "Admin can view all applications"
ON public.applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'chief_architect'::app_role));

DROP POLICY IF EXISTS "Admin can update applications" ON public.applications;
CREATE POLICY "Admin can update applications"
ON public.applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'chief_architect'::app_role));