-- =====================================================
-- REPLIC DATABASE ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- This script enables RLS on all tables and creates policies
-- to ensure users can only access their own data
-- Based on actual Supabase schema
-- =====================================================

-- Note: user_profiles is a VIEW, not a table, so it's excluded from RLS
-- Views inherit security from their underlying tables

-- =====================================================
-- 1. APP_USER TABLE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON app_user;
DROP POLICY IF EXISTS "Users can update own profile" ON app_user;
DROP POLICY IF EXISTS "Users can insert own profile" ON app_user;
DROP POLICY IF EXISTS "Users can delete own profile" ON app_user;

-- Enable RLS
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
ON app_user FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON app_user FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON app_user FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON app_user FOR DELETE
USING (auth.uid() = id);

-- =====================================================
-- 2. BRAND_AGENT TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brands" ON brand_agent;
DROP POLICY IF EXISTS "Users can create own brands" ON brand_agent;
DROP POLICY IF EXISTS "Users can update own brands" ON brand_agent;
DROP POLICY IF EXISTS "Users can delete own brands" ON brand_agent;

ALTER TABLE brand_agent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brands"
ON brand_agent FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brands"
ON brand_agent FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands"
ON brand_agent FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brands"
ON brand_agent FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 3. BRAND_EMBEDDINGS TABLE
-- Note: Uses brand_agent_id, not brand_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand embeddings" ON brand_embeddings;
DROP POLICY IF EXISTS "Users can create own brand embeddings" ON brand_embeddings;
DROP POLICY IF EXISTS "Users can update own brand embeddings" ON brand_embeddings;
DROP POLICY IF EXISTS "Users can delete own brand embeddings" ON brand_embeddings;

ALTER TABLE brand_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand embeddings"
ON brand_embeddings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = brand_embeddings.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own brand embeddings"
ON brand_embeddings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = brand_embeddings.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand embeddings"
ON brand_embeddings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = brand_embeddings.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand embeddings"
ON brand_embeddings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = brand_embeddings.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 4. BRAND_QA_RESPONSES TABLE
-- Note: Uses brand_agent_id, not brand_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand qa responses" ON brand_qa_responses;
DROP POLICY IF EXISTS "Users can create own brand qa responses" ON brand_qa_responses;
DROP POLICY IF EXISTS "Users can update own brand qa responses" ON brand_qa_responses;
DROP POLICY IF EXISTS "Users can delete own brand qa responses" ON brand_qa_responses;

ALTER TABLE brand_qa_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand qa responses"
ON brand_qa_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = brand_qa_responses.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own brand qa responses"
ON brand_qa_responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = brand_qa_responses.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand qa responses"
ON brand_qa_responses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = brand_qa_responses.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand qa responses"
ON brand_qa_responses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = brand_qa_responses.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 5. CONTENT_ACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand actions" ON content_actions;
DROP POLICY IF EXISTS "Users can create actions for own brands" ON content_actions;
DROP POLICY IF EXISTS "Users can update own brand actions" ON content_actions;
DROP POLICY IF EXISTS "Users can delete own brand actions" ON content_actions;

ALTER TABLE content_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand actions"
ON content_actions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = content_actions.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create actions for own brands"
ON content_actions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = content_actions.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand actions"
ON content_actions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = content_actions.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand actions"
ON content_actions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = content_actions.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 6. DAILY_CONTENT TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand content" ON daily_content;
DROP POLICY IF EXISTS "Users can create content for own brands" ON daily_content;
DROP POLICY IF EXISTS "Users can update own brand content" ON daily_content;
DROP POLICY IF EXISTS "Users can delete own brand content" ON daily_content;

ALTER TABLE daily_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand content"
ON daily_content FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = daily_content.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create content for own brands"
ON daily_content FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = daily_content.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand content"
ON daily_content FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = daily_content.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand content"
ON daily_content FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = daily_content.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 7. MONITORED_TWEETS TABLE
-- =====================================================

-- Drop old service role policies if they exist
DROP POLICY IF EXISTS "Service role full access on monitored_tweets" ON monitored_tweets;
DROP POLICY IF EXISTS "Users can view their brand's monitored tweets" ON monitored_tweets;

DROP POLICY IF EXISTS "Users can view own brand monitored tweets" ON monitored_tweets;
DROP POLICY IF EXISTS "Users can create monitored tweets for own brands" ON monitored_tweets;
DROP POLICY IF EXISTS "Users can update own brand monitored tweets" ON monitored_tweets;
DROP POLICY IF EXISTS "Users can delete own brand monitored tweets" ON monitored_tweets;

ALTER TABLE monitored_tweets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand monitored tweets"
ON monitored_tweets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = monitored_tweets.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create monitored tweets for own brands"
ON monitored_tweets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = monitored_tweets.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand monitored tweets"
ON monitored_tweets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = monitored_tweets.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand monitored tweets"
ON monitored_tweets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = monitored_tweets.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 8. OAUTH_CREDENTIAL TABLE
-- Note: Uses agent_id, not user_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own oauth credentials" ON oauth_credential;
DROP POLICY IF EXISTS "Users can create own oauth credentials" ON oauth_credential;
DROP POLICY IF EXISTS "Users can update own oauth credentials" ON oauth_credential;
DROP POLICY IF EXISTS "Users can delete own oauth credentials" ON oauth_credential;

ALTER TABLE oauth_credential ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own oauth credentials"
ON oauth_credential FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = oauth_credential.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own oauth credentials"
ON oauth_credential FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = oauth_credential.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own oauth credentials"
ON oauth_credential FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = oauth_credential.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own oauth credentials"
ON oauth_credential FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = oauth_credential.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 9. POSTED_REPLIES TABLE
-- =====================================================

-- Drop old service role policies if they exist
DROP POLICY IF EXISTS "Service role full access on posted_replies" ON posted_replies;
DROP POLICY IF EXISTS "Users can view their brand's posted replies" ON posted_replies;

DROP POLICY IF EXISTS "Users can view own brand posted replies" ON posted_replies;
DROP POLICY IF EXISTS "Users can create posted replies for own brands" ON posted_replies;
DROP POLICY IF EXISTS "Users can update own brand posted replies" ON posted_replies;
DROP POLICY IF EXISTS "Users can delete own brand posted replies" ON posted_replies;

ALTER TABLE posted_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand posted replies"
ON posted_replies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = posted_replies.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create posted replies for own brands"
ON posted_replies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = posted_replies.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand posted replies"
ON posted_replies FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = posted_replies.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand posted replies"
ON posted_replies FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = posted_replies.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 10. REPLY_QUEUE TABLE
-- =====================================================

-- Drop old service role policies if they exist
DROP POLICY IF EXISTS "Service role full access on reply_queue" ON reply_queue;
DROP POLICY IF EXISTS "Users can view their brand's reply queue" ON reply_queue;

DROP POLICY IF EXISTS "Users can view own brand reply queue" ON reply_queue;
DROP POLICY IF EXISTS "Users can create reply queue for own brands" ON reply_queue;
DROP POLICY IF EXISTS "Users can update own brand reply queue" ON reply_queue;
DROP POLICY IF EXISTS "Users can delete own brand reply queue" ON reply_queue;

ALTER TABLE reply_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand reply queue"
ON reply_queue FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = reply_queue.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create reply queue for own brands"
ON reply_queue FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = reply_queue.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand reply queue"
ON reply_queue FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = reply_queue.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand reply queue"
ON reply_queue FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = reply_queue.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 11. TWEET_GENERATION_LOGS TABLE
-- Note: Uses brand_agent_id, not brand_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand tweet logs" ON tweet_generation_logs;
DROP POLICY IF EXISTS "Users can create tweet logs for own brands" ON tweet_generation_logs;
DROP POLICY IF EXISTS "Users can update own brand tweet logs" ON tweet_generation_logs;
DROP POLICY IF EXISTS "Users can delete own brand tweet logs" ON tweet_generation_logs;

ALTER TABLE tweet_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand tweet logs"
ON tweet_generation_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = tweet_generation_logs.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tweet logs for own brands"
ON tweet_generation_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = tweet_generation_logs.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand tweet logs"
ON tweet_generation_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = tweet_generation_logs.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand tweet logs"
ON tweet_generation_logs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = tweet_generation_logs.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 12. USER_INTERACTION_HISTORY TABLE
-- =====================================================

-- Drop old service role policies if they exist
DROP POLICY IF EXISTS "Service role full access on user_interaction_history" ON user_interaction_history;

DROP POLICY IF EXISTS "Users can view own interaction history" ON user_interaction_history;
DROP POLICY IF EXISTS "Users can create own interaction history" ON user_interaction_history;
DROP POLICY IF EXISTS "Users can update own interaction history" ON user_interaction_history;
DROP POLICY IF EXISTS "Users can delete own interaction history" ON user_interaction_history;

ALTER TABLE user_interaction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interaction history"
ON user_interaction_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = user_interaction_history.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own interaction history"
ON user_interaction_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = user_interaction_history.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own interaction history"
ON user_interaction_history FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = user_interaction_history.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own interaction history"
ON user_interaction_history FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = user_interaction_history.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 13. CANDIDATE_EVENT TABLE
-- Note: Uses agent_id, not brand_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand candidate events" ON candidate_event;
DROP POLICY IF EXISTS "Users can create candidate events for own brands" ON candidate_event;
DROP POLICY IF EXISTS "Users can update own brand candidate events" ON candidate_event;
DROP POLICY IF EXISTS "Users can delete own brand candidate events" ON candidate_event;

ALTER TABLE candidate_event ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand candidate events"
ON candidate_event FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = candidate_event.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create candidate events for own brands"
ON candidate_event FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = candidate_event.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand candidate events"
ON candidate_event FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = candidate_event.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand candidate events"
ON candidate_event FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = candidate_event.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 14. REPLY_RATE_LIMITS TABLE
-- =====================================================

-- Drop old service role policies if they exist
DROP POLICY IF EXISTS "Service role full access on reply_rate_limits" ON reply_rate_limits;

DROP POLICY IF EXISTS "Users can view own brand rate limits" ON reply_rate_limits;
DROP POLICY IF EXISTS "Users can create rate limits for own brands" ON reply_rate_limits;
DROP POLICY IF EXISTS "Users can update own brand rate limits" ON reply_rate_limits;
DROP POLICY IF EXISTS "Users can delete own brand rate limits" ON reply_rate_limits;

ALTER TABLE reply_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand rate limits"
ON reply_rate_limits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = reply_rate_limits.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create rate limits for own brands"
ON reply_rate_limits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = reply_rate_limits.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand rate limits"
ON reply_rate_limits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = reply_rate_limits.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand rate limits"
ON reply_rate_limits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = reply_rate_limits.brand_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 15. PROJECT_UPDATES TABLE
-- Note: Uses brand_agent_id, not brand_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand project updates" ON project_updates;
DROP POLICY IF EXISTS "Users can create project updates for own brands" ON project_updates;
DROP POLICY IF EXISTS "Users can update own brand project updates" ON project_updates;
DROP POLICY IF EXISTS "Users can delete own brand project updates" ON project_updates;

ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand project updates"
ON project_updates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = project_updates.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create project updates for own brands"
ON project_updates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = project_updates.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand project updates"
ON project_updates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = project_updates.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand project updates"
ON project_updates FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = project_updates.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 16. ACTIVITY TABLE
-- Note: Uses brand_agent_id, not brand_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand activity" ON activity;
DROP POLICY IF EXISTS "Users can create activity for own brands" ON activity;
DROP POLICY IF EXISTS "Users can update own brand activity" ON activity;
DROP POLICY IF EXISTS "Users can delete own brand activity" ON activity;

ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand activity"
ON activity FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = activity.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create activity for own brands"
ON activity FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = activity.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand activity"
ON activity FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = activity.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand activity"
ON activity FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = activity.brand_agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 17. ACTIVITY_LOG TABLE
-- Note: Uses agent_id, not brand_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand activity log" ON activity_log;
DROP POLICY IF EXISTS "Users can create activity log for own brands" ON activity_log;
DROP POLICY IF EXISTS "Users can update own brand activity log" ON activity_log;
DROP POLICY IF EXISTS "Users can delete own brand activity log" ON activity_log;

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand activity log"
ON activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = activity_log.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create activity log for own brands"
ON activity_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = activity_log.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand activity log"
ON activity_log FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = activity_log.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand activity log"
ON activity_log FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = activity_log.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 18. ANALYTICS_DAILY TABLE
-- Note: Uses agent_id, not brand_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand analytics" ON analytics_daily;
DROP POLICY IF EXISTS "Users can create analytics for own brands" ON analytics_daily;
DROP POLICY IF EXISTS "Users can update own brand analytics" ON analytics_daily;
DROP POLICY IF EXISTS "Users can delete own brand analytics" ON analytics_daily;

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand analytics"
ON analytics_daily FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = analytics_daily.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create analytics for own brands"
ON analytics_daily FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = analytics_daily.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand analytics"
ON analytics_daily FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = analytics_daily.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand analytics"
ON analytics_daily FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = analytics_daily.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- 19. RATE_LIMIT_USAGE TABLE
-- Note: Uses agent_id, not brand_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view own brand rate limit usage" ON rate_limit_usage;
DROP POLICY IF EXISTS "Users can create rate limit usage for own brands" ON rate_limit_usage;
DROP POLICY IF EXISTS "Users can update own brand rate limit usage" ON rate_limit_usage;
DROP POLICY IF EXISTS "Users can delete own brand rate limit usage" ON rate_limit_usage;

ALTER TABLE rate_limit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand rate limit usage"
ON rate_limit_usage FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = rate_limit_usage.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create rate limit usage for own brands"
ON rate_limit_usage FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = rate_limit_usage.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own brand rate limit usage"
ON rate_limit_usage FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = rate_limit_usage.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own brand rate limit usage"
ON rate_limit_usage FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM brand_agent
    WHERE brand_agent.id = rate_limit_usage.agent_id
    AND brand_agent.user_id = auth.uid()
  )
);

-- =====================================================
-- SCRIPT COMPLETE
-- =====================================================

-- Summary:
-- ✅ 19 tables protected with RLS (user_profiles is a view, excluded)
-- ✅ 76 security policies created
-- ✅ Users can only access their own data
-- ✅ Brand-based access control implemented
-- ✅ All CRUD operations (SELECT, INSERT, UPDATE, DELETE) secured

-- Column mappings corrected:
-- - brand_embeddings: uses brand_agent_id
-- - brand_qa_responses: uses brand_agent_id
-- - oauth_credential: uses agent_id
-- - tweet_generation_logs: uses brand_agent_id
-- - candidate_event: uses agent_id
-- - project_updates: uses brand_agent_id
-- - activity: uses brand_agent_id
-- - activity_log: uses agent_id
-- - analytics_daily: uses agent_id
-- - rate_limit_usage: uses agent_id

-- Next steps:
-- 1. Test authentication flow
-- 2. Verify users cannot access other users' data
-- 3. Check that brand ownership is properly enforced
