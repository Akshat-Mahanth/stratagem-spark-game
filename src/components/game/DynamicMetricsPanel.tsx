import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, Package, Target, Users, Zap } from "lucide-react";

interface DynamicMetricsPanelProps {
  team: any;
  game: any;
}

const DynamicMetricsPanel = ({ team, game }: DynamicMetricsPanelProps) => {
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      // Fetch latest metrics for this team
      const { data: metrics } = await supabase
        .from('team_metrics')
        .select('*')
        .eq('team_id', team.id)
        .order('quarter', { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrentMetrics(metrics);

      // Fetch latest decision for inventory breakdown
      const { data: decision } = await supabase
        .from('team_decisions')
        .select('*')
        .eq('team_id', team.id)
        .eq('quarter', game.current_quarter)
        .maybeSingle();

      if (decision && metrics) {
        const luxuryInventory = Math.floor((decision.units_produced * decision.luxury_percentage / 100) - (metrics.units_sold * decision.luxury_percentage / 100));
        const flagshipInventory = Math.floor((decision.units_produced * decision.flagship_percentage / 100) - (metrics.units_sold * decision.flagship_percentage / 100));
        const midtierInventory = Math.floor((decision.units_produced * decision.midtier_percentage / 100) - (metrics.units_sold * decision.midtier_percentage / 100));
        const lowertierInventory = Math.floor((decision.units_produced * decision.lowertier_percentage / 100) - (metrics.units_sold * decision.lowertier_percentage / 100));

        setInventory({
          luxury: Math.max(0, luxuryInventory),
          flagship: Math.max(0, flagshipInventory),
          midtier: Math.max(0, midtierInventory),
          lowertier: Math.max(0, lowertierInventory),
          total: metrics.inventory_remaining
        });
      }
    };

    fetchMetrics();

    // Subscribe to metrics updates
    const channel = supabase
      .channel(`metrics-${team.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_metrics',
          filter: `team_id=eq.${team.id}`
        },
        () => {
          fetchMetrics();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${team.id}`
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [team.id, game.current_quarter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-4 h-screen overflow-y-auto pb-20">
      {/* Team Info */}
      <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team.team_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Current Capital</div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(team.current_capital)}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Market Share</div>
            <div className="text-2xl font-bold text-white">
              {team.market_share.toFixed(2)}%
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200">Stock Price</div>
            <div className="text-2xl font-bold text-green-300">
              ₹{team.stock_price.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Inventory Breakdown */}
      {inventory && (
        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-white/10 rounded p-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-200">Luxury</span>
                <span className="font-bold text-white">{inventory.luxury} units</span>
              </div>
            </div>
            <div className="bg-white/10 rounded p-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-200">Flagship</span>
                <span className="font-bold text-white">{inventory.flagship} units</span>
              </div>
            </div>
            <div className="bg-white/10 rounded p-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-200">Mid-tier</span>
                <span className="font-bold text-white">{inventory.midtier} units</span>
              </div>
            </div>
            <div className="bg-white/10 rounded p-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-200">Lower-tier</span>
                <span className="font-bold text-white">{inventory.lowertier} units</span>
              </div>
            </div>
            <div className="bg-purple-800/50 rounded p-2 border border-purple-600 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="font-bold text-xl text-white">{inventory.total} units</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {currentMetrics && (
        <>
          <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-700 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs text-green-200">Revenue</div>
                <div className="text-lg font-bold text-white">
                  {formatCurrency(currentMetrics.revenue)}
                </div>
              </div>
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs text-green-200">Profit</div>
                <div className={`text-lg font-bold ${currentMetrics.profit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {formatCurrency(currentMetrics.profit)}
                </div>
              </div>
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs text-green-200">ROI</div>
                <div className={`text-lg font-bold ${currentMetrics.roi >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {currentMetrics.roi.toFixed(2)}%
                </div>
              </div>
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs text-green-200">Cash Flow</div>
                <div className={`text-lg font-bold ${currentMetrics.cash_flow >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {formatCurrency(currentMetrics.cash_flow)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-950 to-orange-900 border-orange-700 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Sales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs text-orange-200">Units Sold</div>
                <div className="text-lg font-bold text-white">
                  {currentMetrics.units_sold.toLocaleString()}
                </div>
              </div>
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs text-orange-200">Demand Satisfaction</div>
                <div className="text-lg font-bold text-white">
                  {currentMetrics.demand_satisfaction_rate.toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-950 to-cyan-900 border-cyan-700 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs text-cyan-200">Customer Satisfaction</div>
                <div className="text-lg font-bold text-white">
                  {currentMetrics.customer_satisfaction.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/10 rounded p-2">
                <div className="text-xs text-cyan-200">Employee Productivity</div>
                <div className="text-lg font-bold text-white">
                  {currentMetrics.employee_productivity.toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Debt Info */}
      <Card className="bg-gradient-to-br from-red-950 to-red-900 border-red-700 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Debt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="bg-white/10 rounded p-2">
            <div className="text-xs text-red-200">Total Debt</div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(team.total_debt)}
            </div>
          </div>
          <div className="bg-white/10 rounded p-2">
            <div className="text-xs text-red-200">Debt Ceiling</div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(team.debt_ceiling)}
            </div>
          </div>
          <div className="bg-white/10 rounded p-2">
            <div className="text-xs text-red-200">Available Credit</div>
            <div className="text-lg font-bold text-green-300">
              {formatCurrency(team.debt_ceiling - team.total_debt)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicMetricsPanel;
