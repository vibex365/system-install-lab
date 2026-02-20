-- Drop and recreate the agents SELECT policy to include admin role
DROP POLICY IF EXISTS "Active members can view active agents" ON public.agents;

CREATE POLICY "Members and admins can view agents"
ON public.agents
FOR SELECT
USING (
  -- Chief architect sees everything
  has_role(auth.uid(), 'chief_architect'::app_role)
  OR
  -- Admin sees everything
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Active members see active agents only
  (
    status = 'active'
    AND (
      SELECT profiles.member_status FROM profiles WHERE profiles.id = auth.uid()
    ) = 'active'::member_status
  )
  OR
  -- Active members also see coming_soon agents (for marketplace teaser awareness)
  (
    status = 'coming_soon'
    AND (
      SELECT profiles.member_status FROM profiles WHERE profiles.id = auth.uid()
    ) = 'active'::member_status
  )
);