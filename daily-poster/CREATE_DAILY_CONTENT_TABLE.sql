-- Create daily_content table in Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS daily_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brand_agent(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'x',
    tweet_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'posted',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_content_brand_id ON daily_content(brand_id);
CREATE INDEX IF NOT EXISTS idx_daily_content_created_at ON daily_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_content_status ON daily_content(status);

-- Enable RLS (Row Level Security)
ALTER TABLE daily_content ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own brand's content
CREATE POLICY "Users can view their brand's content"
ON daily_content FOR SELECT
USING (
    brand_id IN (
        SELECT id FROM brand_agent WHERE user_id = auth.uid()
    )
);

-- Allow service role to insert (for the backend)
CREATE POLICY "Service role can insert content"
ON daily_content FOR INSERT
WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_daily_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_content_updated_at
BEFORE UPDATE ON daily_content
FOR EACH ROW
EXECUTE FUNCTION update_daily_content_updated_at();

-- Done!
-- Your daily posts will now be logged to this table

