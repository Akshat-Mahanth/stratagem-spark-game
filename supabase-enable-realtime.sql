-- Enable Realtime for all game tables
-- Run this in your Supabase SQL Editor

-- Enable realtime on all tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE team_decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE team_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE city_data;
ALTER PUBLICATION supabase_realtime ADD TABLE factory_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE market_allocations;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
