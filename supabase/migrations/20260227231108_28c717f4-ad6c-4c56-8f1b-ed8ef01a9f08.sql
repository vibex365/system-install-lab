
-- API Keys table for Developer Portal
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  label text NOT NULL DEFAULT 'Default',
  permissions text[] NOT NULL DEFAULT '{all}',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api keys"
  ON public.api_keys FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'chief_architect'));

CREATE POLICY "Users can insert own api keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own api keys"
  ON public.api_keys FOR UPDATE
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'chief_architect'));

CREATE POLICY "Chief architect can manage api keys"
  ON public.api_keys FOR ALL
  USING (public.has_role(auth.uid(), 'chief_architect'));

CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);

-- API Usage Log table
CREATE TABLE public.api_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'POST',
  credits_consumed integer NOT NULL DEFAULT 1,
  status_code integer,
  response_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api usage"
  ON public.api_usage_log FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'chief_architect'));

CREATE POLICY "Chief architect can manage api usage"
  ON public.api_usage_log FOR ALL
  USING (public.has_role(auth.uid(), 'chief_architect'));

CREATE INDEX idx_api_usage_log_user_id ON public.api_usage_log(user_id);
CREATE INDEX idx_api_usage_log_api_key_id ON public.api_usage_log(api_key_id);
CREATE INDEX idx_api_usage_log_created_at ON public.api_usage_log(created_at);
