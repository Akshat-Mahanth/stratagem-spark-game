-- Create games table
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code text UNIQUE NOT NULL,
  host_name text NOT NULL,
  status text NOT NULL DEFAULT 'waiting', -- waiting, active, completed
  current_quarter integer NOT NULL DEFAULT 0,
  max_quarters integer NOT NULL DEFAULT 8,
  quarter_duration_seconds integer NOT NULL DEFAULT 600, -- 10 minutes per quarter
  quarter_start_time timestamptz,
  starting_capital numeric NOT NULL DEFAULT 10000000, -- ₹1 crore starting capital
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  team_name text NOT NULL,
  current_capital numeric NOT NULL DEFAULT 10000000,
  total_profit numeric NOT NULL DEFAULT 0,
  total_debt numeric NOT NULL DEFAULT 0,
  debt_ceiling numeric NOT NULL DEFAULT 5000000, -- ₹50 lakh debt ceiling
  stock_price numeric NOT NULL DEFAULT 100, -- Starting stock price
  market_share numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(game_id, team_name)
);

-- Create factory locations table
CREATE TABLE public.factory_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  city text NOT NULL,
  setup_cost numeric NOT NULL,
  labor_cost_per_unit numeric NOT NULL,
  land_cost numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create team decisions table (stores decisions for each quarter)
CREATE TABLE public.team_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  quarter integer NOT NULL,
  
  -- Production decisions
  units_produced integer NOT NULL DEFAULT 0,
  cost_per_unit numeric NOT NULL DEFAULT 0,
  
  -- Phone tier allocation (percentages, must sum to 100)
  luxury_percentage integer NOT NULL DEFAULT 0,
  flagship_percentage integer NOT NULL DEFAULT 0,
  midtier_percentage integer NOT NULL DEFAULT 0,
  lowertier_percentage integer NOT NULL DEFAULT 0,
  
  -- Pricing by tier
  luxury_price numeric NOT NULL DEFAULT 120000,
  flagship_price numeric NOT NULL DEFAULT 65000,
  midtier_price numeric NOT NULL DEFAULT 25000,
  lowertier_price numeric NOT NULL DEFAULT 10000,
  
  -- Budget allocations
  marketing_budget numeric NOT NULL DEFAULT 0,
  rnd_budget numeric NOT NULL DEFAULT 0,
  employee_budget numeric NOT NULL DEFAULT 0,
  
  -- Debt management
  new_debt numeric NOT NULL DEFAULT 0,
  debt_repayment numeric NOT NULL DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, quarter)
);

-- Create market allocations table (city-wise distribution)
CREATE TABLE public.market_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid REFERENCES public.team_decisions(id) ON DELETE CASCADE NOT NULL,
  city text NOT NULL,
  allocation_percentage integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create team metrics table (calculated metrics per quarter)
CREATE TABLE public.team_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  quarter integer NOT NULL,
  
  -- Financial metrics
  revenue numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  cash_flow numeric NOT NULL DEFAULT 0,
  roi numeric NOT NULL DEFAULT 0,
  
  -- Performance metrics
  demand_satisfaction_rate numeric NOT NULL DEFAULT 0,
  customer_satisfaction numeric NOT NULL DEFAULT 0,
  employee_productivity numeric NOT NULL DEFAULT 0,
  market_share numeric NOT NULL DEFAULT 0,
  
  -- Operational metrics
  units_sold integer NOT NULL DEFAULT 0,
  inventory_remaining integer NOT NULL DEFAULT 0,
  distribution_cost numeric NOT NULL DEFAULT 0,
  inventory_holding_cost numeric NOT NULL DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, quarter)
);

-- Create stock trades table
CREATE TABLE public.stock_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  target_team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  shares_bought integer NOT NULL,
  price_per_share numeric NOT NULL,
  total_cost numeric NOT NULL,
  quarter integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create city data table (stores city characteristics)
CREATE TABLE public.city_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text UNIQUE NOT NULL,
  population integer NOT NULL,
  luxury_demand_percentage numeric NOT NULL,
  flagship_demand_percentage numeric NOT NULL,
  midtier_demand_percentage numeric NOT NULL,
  lowertier_demand_percentage numeric NOT NULL,
  average_purchasing_power numeric NOT NULL,
  base_labor_cost numeric NOT NULL,
  base_land_cost numeric NOT NULL,
  base_distribution_cost numeric NOT NULL
);

-- Insert city data
INSERT INTO public.city_data (city_name, population, luxury_demand_percentage, flagship_demand_percentage, midtier_demand_percentage, lowertier_demand_percentage, average_purchasing_power, base_labor_cost, base_land_cost, base_distribution_cost) VALUES
('Yas Marina', 850000, 40, 35, 20, 5, 180000, 450, 12000, 85),
('Monaco', 750000, 45, 30, 18, 7, 200000, 500, 15000, 90),
('Shanghai International', 2500000, 25, 35, 30, 10, 95000, 280, 6500, 55),
('Singapore', 1800000, 30, 38, 25, 7, 125000, 380, 9000, 70),
('Silverstone', 950000, 28, 32, 28, 12, 105000, 320, 7500, 62),
('Spa', 680000, 22, 30, 33, 15, 88000, 290, 6000, 58),
('Monza', 920000, 24, 31, 32, 13, 92000, 300, 6800, 60),
('Zandvoort', 780000, 26, 33, 29, 12, 98000, 310, 7200, 64),
('Imola', 820000, 23, 29, 34, 14, 86000, 285, 5900, 57),
('Baku', 1200000, 18, 28, 38, 16, 72000, 220, 4500, 48),
('Sochi', 1050000, 20, 26, 36, 18, 68000, 210, 4200, 45),
('Buddh International', 2800000, 12, 22, 42, 24, 45000, 150, 2800, 35);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow public access for this game simulation)
CREATE POLICY "Allow all operations on games" ON public.games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on factory_locations" ON public.factory_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on team_decisions" ON public.team_decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on market_allocations" ON public.market_allocations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on team_metrics" ON public.team_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_trades" ON public.stock_trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read on city_data" ON public.city_data FOR SELECT USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_trades;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for games table
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();