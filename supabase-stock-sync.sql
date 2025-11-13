-- Create table for syncing real-time stock fluctuations across all clients
-- This ensures all windows see the same stock movements

CREATE TABLE IF NOT EXISTS stock_fluctuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  fluctuation_value DECIMAL(5, 4) NOT NULL, -- e.g., 0.0234 for +2.34%
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stock_fluctuations_game_team 
ON stock_fluctuations(game_id, team_id, timestamp DESC);

-- Enable RLS
ALTER TABLE stock_fluctuations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow all to select stock_fluctuations" ON stock_fluctuations;
CREATE POLICY "Allow all to select stock_fluctuations"
ON stock_fluctuations FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow all to insert stock_fluctuations" ON stock_fluctuations;
CREATE POLICY "Allow all to insert stock_fluctuations"
ON stock_fluctuations FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all to update stock_fluctuations" ON stock_fluctuations;
CREATE POLICY "Allow all to update stock_fluctuations"
ON stock_fluctuations FOR UPDATE
TO public
USING (true);

DROP POLICY IF EXISTS "Allow all to delete stock_fluctuations" ON stock_fluctuations;
CREATE POLICY "Allow all to delete stock_fluctuations"
ON stock_fluctuations FOR DELETE
TO public
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE stock_fluctuations;

-- Clean up old fluctuations (older than 5 minutes) - run this periodically or use a cron job
-- DELETE FROM stock_fluctuations WHERE timestamp < NOW() - INTERVAL '5 minutes';

-- Verify
SELECT * FROM stock_fluctuations LIMIT 5;
