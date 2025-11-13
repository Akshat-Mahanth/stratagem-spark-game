import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Banknote, BarChart3, Activity } from "lucide-react";

interface CompetitorPanelProps {
  gameId: string;
  currentTeamId: string;
  allTeams: any[];
}

const CompetitorPanel = ({ gameId, currentTeamId, allTeams }: CompetitorPanelProps) => {
  const [competitorMetrics, setCompetitorMetrics] = useState<any[]>([]);

  useEffect(() => {
    const fetchCompetitorMetrics = async () => {
      const { data } = await supabase
        .from("team_metrics")
        .select("*, teams(*)")
        .in(
          "team_id",
          allTeams.filter((t) => t.id !== currentTeamId).map((t) => t.id)
        )
        .order("quarter", { ascending: false });

      setCompetitorMetrics(data || []);
    };

    fetchCompetitorMetrics();
  }, [allTeams, currentTeamId]);

  const competitors = allTeams.filter((t) => t.id !== currentTeamId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <Card className="strategic-gradient border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {competitors.map((competitor) => {
              const latestMetrics = competitorMetrics.find(
                (m) => m.team_id === competitor.id
              );

              return (
                <div
                  key={competitor.id}
                  className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <h3 className="font-bold text-lg mb-3 text-neon-cyan">
                    {competitor.team_name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Banknote className="h-3 w-3" />
                        Stock Price
                      </div>
                      <div className="text-lg font-semibold">
                        ₹{competitor.stock_price.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <BarChart3 className="h-3 w-3" />
                        Market Share
                      </div>
                      <div className="text-lg font-semibold text-neon-gold">
                        {competitor.market_share.toFixed(2)}%
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <TrendingUp className="h-3 w-3" />
                        Total Profit
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          competitor.total_profit >= 0
                            ? "text-profit"
                            : "text-loss"
                        }`}
                      >
                        {formatCurrency(competitor.total_profit)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Customer Satisfaction
                      </div>
                      <div className="text-lg font-semibold">
                        {latestMetrics?.customer_satisfaction?.toFixed(1) || "N/A"}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {competitors.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No other teams in the game yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitorPanel;
