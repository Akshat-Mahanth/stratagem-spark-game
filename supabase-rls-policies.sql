-- Complete RLS Policy Setup for Strategic Manufacturing Game
-- Run this in your Supabase SQL Editor

-- First, enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_allocations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations on games" ON games;
DROP POLICY IF EXISTS "Allow all operations on teams" ON teams;
DROP POLICY IF EXISTS "Allow all operations on team_decisions" ON team_decisions;
DROP POLICY IF EXISTS "Allow all operations on team_metrics" ON team_metrics;
DROP POLICY IF EXISTS "Allow all operations on stock_trades" ON stock_trades;
DROP POLICY IF EXISTS "Allow all operations on city_data" ON city_data;
DROP POLICY IF EXISTS "Allow all operations on factory_locations" ON factory_locations;
DROP POLICY IF EXISTS "Allow all operations on market_allocations" ON market_allocations;

-- Create comprehensive policies for all operations (SELECT, INSERT, UPDATE, DELETE)
-- These are permissive policies for development - adjust for production

-- Games table policies
CREATE POLICY "Enable read access for all users" ON games
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON games
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON games
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON games
    FOR DELETE USING (true);

-- Teams table policies
CREATE POLICY "Enable read access for all users" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON teams
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON teams
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON teams
    FOR DELETE USING (true);

-- Team decisions table policies
CREATE POLICY "Enable read access for all users" ON team_decisions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON team_decisions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON team_decisions
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON team_decisions
    FOR DELETE USING (true);

-- Team metrics table policies
CREATE POLICY "Enable read access for all users" ON team_metrics
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON team_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON team_metrics
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON team_metrics
    FOR DELETE USING (true);

-- Stock trades table policies
CREATE POLICY "Enable read access for all users" ON stock_trades
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON stock_trades
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON stock_trades
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON stock_trades
    FOR DELETE USING (true);

-- City data table policies
CREATE POLICY "Enable read access for all users" ON city_data
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON city_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON city_data
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON city_data
    FOR DELETE USING (true);

-- Factory locations table policies
CREATE POLICY "Enable read access for all users" ON factory_locations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON factory_locations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON factory_locations
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON factory_locations
    FOR DELETE USING (true);

-- Market allocations table policies
CREATE POLICY "Enable read access for all users" ON market_allocations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON market_allocations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON market_allocations
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON market_allocations
    FOR DELETE USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
