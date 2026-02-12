-- =====================================================
-- REPLIC: AGENT RUNS + POSTGRES RATE LIMITING
-- =====================================================
-- Apply this AFTER your base schema exists.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).

-- =====================================================
-- 1) Agent runs (for LangGraph orchestration visibility)
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brand_agent(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_events (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own agent runs" ON agent_runs;
CREATE POLICY "Users can view own agent runs"
ON agent_runs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own agent runs" ON agent_runs;
CREATE POLICY "Users can insert own agent runs"
ON agent_runs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agent runs" ON agent_runs;
CREATE POLICY "Users can update own agent runs"
ON agent_runs FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own agent events" ON agent_events;
CREATE POLICY "Users can view own agent events"
ON agent_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agent_runs r
    WHERE r.id = agent_events.run_id
      AND r.user_id = auth.uid()
  )
);

-- =====================================================
-- 2) Rate limiting (Postgres-backed)
-- =====================================================
-- A simple fixed-window counter per (brand, bucket).
-- Services should call replic_check_rate_limit() before hitting external APIs.

CREATE TABLE IF NOT EXISTS replic_rate_limits (
  brand_id UUID NOT NULL REFERENCES brand_agent(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (brand_id, bucket)
);

ALTER TABLE replic_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rate limits" ON replic_rate_limits;
CREATE POLICY "Users can view own rate limits"
ON replic_rate_limits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = replic_rate_limits.brand_id
      AND brand_agent.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.replic_check_rate_limit(
  p_brand_id UUID,
  p_bucket TEXT,
  p_limit INTEGER,
  p_window_sec INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO replic_rate_limits AS rl (brand_id, bucket, window_start, count)
  VALUES (p_brand_id, p_bucket, now(), 1)
  ON CONFLICT (brand_id, bucket) DO UPDATE
    SET window_start =
      CASE
        WHEN rl.window_start <= now() - (p_window_sec || ' seconds')::interval THEN now()
        ELSE rl.window_start
      END,
        count =
      CASE
        WHEN rl.window_start <= now() - (p_window_sec || ' seconds')::interval THEN 1
        ELSE rl.count + 1
      END
  RETURNING rl.count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.replic_check_rate_limit(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replic_check_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

