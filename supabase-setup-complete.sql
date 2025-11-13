-- Complete Database Setup for Strategic Manufacturing Game
-- This includes table creation with primary keys, foreign keys, and RLS policies
-- Run this in your Supabase SQL Editor

-- ============================================
-- PART 1: CREATE TABLES WITH PRIMARY KEYS
-- ============================================

-- Drop existing tables if they exist (careful - this deletes data!)
-- Comment out these lines if you want to keep existing data
DROP TABLE IF EXISTS market_allocations CASCADE;
DROP TABLE IF EXISTS factory_locations CASCADE;
DROP TABLE IF EXISTS stock_trades CASCADE;
DROP TABLE IF EXISTS team_metrics CASCADE;
DROP TABLE IF EXISTS team_decisions CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS city_data CASCADE;
DROP TABLE IF EXISTS games CASCADE;

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_code TEXT NOT NULL UNIQUE,
    host_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    current_quarter INTEGER NOT NULL DEFAULT 1,
    max_quarters INTEGER NOT NULL DEFAULT 8,
    quarter_duration_seconds INTEGER NOT NULL DEFAULT 600,
    quarter_start_time TIMESTAMPTZ,
    starting_capital BIGINT NOT NULL DEFAULT 10000000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- City data table
CREATE TABLE city_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name TEXT NOT NULL UNIQUE,
    population BIGINT NOT NULL,
    average_purchasing_power NUMERIC NOT NULL,
    base_land_cost NUMERIC NOT NULL,
    base_labor_cost NUMERIC NOT NULL,
    base_distribution_cost NUMERIC NOT NULL,
    luxury_demand_percentage NUMERIC NOT NULL,
    flagship_demand_percentage NUMERIC NOT NULL,
    midtier_demand_percentage NUMERIC NOT NULL,
    lowertier_demand_percentage NUMERIC NOT NULL
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    current_capital BIGINT NOT NULL DEFAULT 10000000,
    total_debt BIGINT NOT NULL DEFAULT 0,
    debt_ceiling BIGINT NOT NULL DEFAULT 50000000,
    total_profit BIGINT NOT NULL DEFAULT 0,
    market_share NUMERIC NOT NULL DEFAULT 0,
    stock_price NUMERIC NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, team_name)
);

-- Team decisions table
CREATE TABLE team_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL,
    units_produced INTEGER NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC NOT NULL DEFAULT 0,
    luxury_percentage NUMERIC NOT NULL DEFAULT 0,
    flagship_percentage NUMERIC NOT NULL DEFAULT 0,
    midtier_percentage NUMERIC NOT NULL DEFAULT 0,
    lowertier_percentage NUMERIC NOT NULL DEFAULT 0,
    luxury_price NUMERIC NOT NULL DEFAULT 0,
    flagship_price NUMERIC NOT NULL DEFAULT 0,
    midtier_price NUMERIC NOT NULL DEFAULT 0,
    lowertier_price NUMERIC NOT NULL DEFAULT 0,
    marketing_budget BIGINT NOT NULL DEFAULT 0,
    rnd_budget BIGINT NOT NULL DEFAULT 0,
    employee_budget BIGINT NOT NULL DEFAULT 0,
    new_debt BIGINT NOT NULL DEFAULT 0,
    debt_repayment BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, quarter)
);

-- Team metrics table
CREATE TABLE team_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL,
    revenue BIGINT NOT NULL DEFAULT 0,
    profit BIGINT NOT NULL DEFAULT 0,
    units_sold INTEGER NOT NULL DEFAULT 0,
    inventory_remaining INTEGER NOT NULL DEFAULT 0,
    inventory_holding_cost BIGINT NOT NULL DEFAULT 0,
    distribution_cost BIGINT NOT NULL DEFAULT 0,
    market_share NUMERIC NOT NULL DEFAULT 0,
    customer_satisfaction NUMERIC NOT NULL DEFAULT 100,
    employee_productivity NUMERIC NOT NULL DEFAULT 100,
    roi NUMERIC NOT NULL DEFAULT 0,
    cash_flow BIGINT NOT NULL DEFAULT 0,
    demand_satisfaction_rate NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, quarter)
);

-- Stock trades table
CREATE TABLE stock_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    target_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL,
    shares_bought INTEGER NOT NULL,
    price_per_share NUMERIC NOT NULL,
    total_cost BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Factory locations table
CREATE TABLE factory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    setup_cost BIGINT NOT NULL,
    land_cost BIGINT NOT NULL,
    labor_cost_per_unit NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, city)
);

-- Market allocations table
CREATE TABLE market_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES team_decisions(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    allocation_percentage NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(decision_id, city)
);

-- Create indexes for better query performance
CREATE INDEX idx_teams_game_id ON teams(game_id);
CREATE INDEX idx_team_decisions_team_id ON team_decisions(team_id);
CREATE INDEX idx_team_decisions_quarter ON team_decisions(quarter);
CREATE INDEX idx_team_metrics_team_id ON team_metrics(team_id);
CREATE INDEX idx_team_metrics_quarter ON team_metrics(quarter);
CREATE INDEX idx_stock_trades_buyer ON stock_trades(buyer_team_id);
CREATE INDEX idx_stock_trades_target ON stock_trades(target_team_id);
CREATE INDEX idx_factory_locations_team_id ON factory_locations(team_id);
CREATE INDEX idx_market_allocations_decision_id ON market_allocations(decision_id);

-- ============================================
-- PART 2: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_allocations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: CREATE RLS POLICIES
-- ============================================

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

-- ============================================
-- PART 4: INSERT INITIAL CITY DATA
-- ============================================

INSERT INTO city_data (city_name, population, average_purchasing_power, base_land_cost, base_labor_cost, base_distribution_cost, luxury_demand_percentage, flagship_demand_percentage, midtier_demand_percentage, lowertier_demand_percentage) VALUES
('Yas Marina', 850000, 180000, 12000, 450, 85, 40, 35, 20, 5),
('Monaco', 750000, 200000, 15000, 500, 90, 45, 30, 18, 7),
('Shanghai International', 2500000, 95000, 6500, 280, 55, 25, 35, 30, 10),
('Singapore', 1800000, 125000, 9000, 380, 70, 30, 38, 25, 7),
('Silverstone', 950000, 105000, 7500, 320, 62, 28, 32, 28, 12),
('Spa', 680000, 88000, 6000, 290, 58, 22, 30, 33, 15),
('Monza', 920000, 92000, 6800, 300, 60, 24, 31, 32, 13),
('Zandvoort', 780000, 98000, 7200, 310, 64, 26, 33, 29, 12),
('Imola', 820000, 86000, 5900, 285, 57, 23, 29, 34, 14),
('Baku', 1200000, 72000, 4500, 220, 48, 18, 28, 38, 16),
('Sochi', 1050000, 68000, 4200, 210, 45, 20, 26, 36, 18),
('Buddh International', 2800000, 45000, 2800, 150, 35, 12, 22, 42, 24);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables were created with primary keys
SELECT 
    tc.table_name, 
    kcu.column_name as primary_key_column,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Verify foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify city data was inserted
SELECT city_name, population, average_purchasing_power 
FROM city_data 
ORDER BY city_name;
