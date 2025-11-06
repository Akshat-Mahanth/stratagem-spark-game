import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, Package, Users, TrendingDown } from "lucide-react";

interface MetricsPanelProps {
  team: any;
  currentQuarter: number;
}

const MetricsPanel = ({ team, currentQuarter }: MetricsPanelProps) => {
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data } = await supabase
        .from("team_metrics")
        .select("*")
        .eq("team_id", team.id)
        .order("quarter", { ascending: true });

      setMetrics(data || []);
    };

    fetchMetrics();

    const channel = supabase
      .channel("metrics-panel-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_metrics",
          filter: `team_id=eq.${team.id}`,
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [team.id]);

  const latestMetrics = metrics[metrics.length - 1];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {latestMetrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="metric-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-profit" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-profit">
                  {formatCurrency(latestMetrics.revenue)}
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    latestMetrics.profit >= 0 ? "text-profit" : "text-loss"
                  }`}
                >
                  {formatCurrency(latestMetrics.profit)}
                </div>
              </CardContent>
            </Card>

            <Card className="metric-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-neon-cyan" />
                  Cash Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    latestMetrics.cash_flow >= 0 ? "text-profit" : "text-loss"
                  }`}
                >
                  {formatCurrency(latestMetrics.cash_flow)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="strategic-gradient border-primary/20">
              <CardHeader>
                <CardTitle>Operational Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Units Sold</span>
                  <span className="font-semibold">
                    {latestMetrics.units_sold.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Inventory Remaining
                  </span>
                  <span className="font-semibold">
                    {latestMetrics.inventory_remaining.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Distribution Cost
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(latestMetrics.distribution_cost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Inventory Holding Cost
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(latestMetrics.inventory_holding_cost)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="strategic-gradient border-primary/20">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Demand Satisfaction
                  </span>
                  <span className="font-semibold text-neon-cyan">
                    {latestMetrics.demand_satisfaction_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Customer Satisfaction
                  </span>
                  <span className="font-semibold text-neon-gold">
                    {latestMetrics.customer_satisfaction.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Employee Productivity
                  </span>
                  <span className="font-semibold">
                    {latestMetrics.employee_productivity.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ROI</span>
                  <span
                    className={`font-semibold ${
                      latestMetrics.roi >= 0 ? "text-profit" : "text-loss"
                    }`}
                  >
                    {latestMetrics.roi.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {metrics.length > 1 && (
            <Card className="strategic-gradient border-primary/20">
              <CardHeader>
                <CardTitle>Historical Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.map((m) => (
                    <div
                      key={m.id}
                      className="flex justify-between items-center p-3 rounded bg-primary/5 border border-primary/10"
                    >
                      <span className="font-semibold">Quarter {m.quarter}</span>
                      <div className="flex gap-6 text-sm">
                        <span>Revenue: {formatCurrency(m.revenue)}</span>
                        <span
                          className={m.profit >= 0 ? "text-profit" : "text-loss"}
                        >
                          Profit: {formatCurrency(m.profit)}
                        </span>
                        <span className="text-neon-gold">
                          Market Share: {m.market_share.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="strategic-gradient border-primary/20">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No metrics available yet. Submit your decisions to see performance data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetricsPanel;
