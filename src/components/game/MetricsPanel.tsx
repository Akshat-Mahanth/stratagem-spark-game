import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Banknote, Package, Users, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
      .channel(`metrics-panel-updates-${team.id}-${Date.now()}`)
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
                  <Banknote className="h-4 w-4 text-primary" />
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
            <>
              <Card className="strategic-gradient border-primary/20">
                <CardHeader>
                  <CardTitle>Revenue & Profit Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                      <XAxis 
                        dataKey="quarter" 
                        label={{ value: 'Quarter', position: 'insideBottom', offset: -5 }}
                        stroke="hsl(var(--foreground))"
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))"
                        tickFormatter={(value) => `₹${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--primary) / 0.3)',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--profit))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--profit))' }}
                        name="Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="strategic-gradient border-primary/20">
                <CardHeader>
                  <CardTitle>Market Share & Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.2)" />
                      <XAxis 
                        dataKey="quarter" 
                        label={{ value: 'Quarter', position: 'insideBottom', offset: -5 }}
                        stroke="hsl(var(--foreground))"
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))"
                        tickFormatter={(value) => `${value.toFixed(0)}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--primary) / 0.3)',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => `${value.toFixed(2)}%`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="market_share" 
                        stroke="hsl(var(--neon-gold))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--neon-gold))' }}
                        name="Market Share"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="customer_satisfaction" 
                        stroke="hsl(var(--neon-cyan))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--neon-cyan))' }}
                        name="Customer Satisfaction"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
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
