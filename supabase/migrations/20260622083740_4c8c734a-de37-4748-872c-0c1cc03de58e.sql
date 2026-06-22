
CREATE TABLE public.investigations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  indicator TEXT NOT NULL,
  kind TEXT NOT NULL,
  verdict TEXT,
  severity TEXT,
  confidence NUMERIC,
  executive_summary TEXT,
  findings JSONB NOT NULL DEFAULT '{}'::jsonb,
  agent_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investigations TO authenticated;
GRANT ALL ON public.investigations TO service_role;

ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own investigations"
  ON public.investigations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investigations"
  ON public.investigations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investigations"
  ON public.investigations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX investigations_user_created_idx
  ON public.investigations (user_id, created_at DESC);
