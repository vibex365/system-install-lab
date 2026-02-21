
-- Grant admin full access to agents table
DROP POLICY IF EXISTS "Members and admins can view agents" ON public.agents;
CREATE POLICY "Members and admins can view agents" ON public.agents
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'chief_architect'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (status IN ('active', 'coming_soon') AND (SELECT member_status FROM profiles WHERE id = auth.uid()) = 'active'::member_status)
);

-- Allow admin to manage agents (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin can manage agents"
ON public.agents FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Grant admin full access to agent_leases
DROP POLICY IF EXISTS "Users can view own leases" ON public.agent_leases;
CREATE POLICY "Users can view own leases" ON public.agent_leases
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'chief_architect'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can manage leases"
ON public.agent_leases FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Grant admin full access to agent_runs
DROP POLICY IF EXISTS "Users can view own runs" ON public.agent_runs;
CREATE POLICY "Users can view own runs" ON public.agent_runs
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'chief_architect'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can manage runs"
ON public.agent_runs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
