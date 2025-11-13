import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp, Banknote, BarChart3 } from "lucide-react";
import QuarterTimer from "./QuarterTimer";
import DecisionPanel from "./DecisionPanel";
import CompetitorPanel from "./CompetitorPanel";
import MetricsPanel from "./MetricsPanel";
import StockTrading from "./StockTrading";
import StockChart from "./StockChart";
import DynamicMetricsPanel from "./DynamicMetricsPanel";

interface GameDashboardProps {
  game: any;
  team: any;
}

const GameDashboard = ({ game, team }: GameDashboardProps) => {
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);

  useEffect(() => {
    if (!team) return;

    const fetchMetrics = async () => {
      const { data } = await supabase
        .from("team_metrics")
        .select("*")
        .eq("team_id", team.id)
        .eq("quarter", game.current_quarter)
        .single();

      setCurrentMetrics(data);
    };

    const fetchTeams = async () => {
      const { data } = await supabase
        .from("teams")
        .select("*")
        .eq("game_id", game.id);

      setAllTeams(data || []);
    };

    fetchMetrics();
    fetchTeams();

    const metricsChannel = supabase
      .channel("metrics-updates")
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

    const teamsChannel = supabase
      .channel("teams-updates-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `game_id=eq.${game.id}`,
        },
        () => {
          fetchTeams();
        }
      )
      .subscribe();

    const gameChannel = supabase
      .channel("game-updates-dashboard")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        () => {
          // Trigger a page refresh or re-fetch when game updates
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(gameChannel);
    };
  }, [team, game.current_quarter, game.id]);

  if (!team) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Host View</h2>
          <p className="text-muted-foreground">Monitor all teams from here</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="flex gap-4 p-4">
        {/* Fixed Left Sidebar - Dynamic Metrics */}
        <div className="w-80 flex-shrink-0 sticky top-4 h-screen">
          <DynamicMetricsPanel team={team} game={game} />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neon-blue">{team.team_name}</h1>
            <p className="text-muted-foreground">
              Quarter {game.current_quarter} of {game.max_quarters}
            </p>
          </div>
          <QuarterTimer game={game} />
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="metric-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4 text-neon-cyan" />
                Capital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(team.current_capital)}</div>
            </CardContent>
          </Card>

          <Card className="metric-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-profit" />
                Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${team.total_profit >= 0 ? "text-profit" : "text-loss"}`}>
                {formatCurrency(team.total_profit)}
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-neon-gold" />
                Market Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-gold">
                {team.market_share.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Stock Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{team.stock_price.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Chart */}
        <StockChart gameId={game.id} teamId={team.id} height={250} gameStatus={game.status} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="decisions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            <TabsTrigger value="metrics">Performance</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="trading">Stock Trading</TabsTrigger>
          </TabsList>

          <TabsContent value="decisions" className="space-y-4">
            <DecisionPanel game={game} team={team} />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <MetricsPanel team={team} currentQuarter={game.current_quarter} />
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4">
            <CompetitorPanel gameId={game.id} currentTeamId={team.id} allTeams={allTeams} />
          </TabsContent>

          <TabsContent value="trading" className="space-y-4">
            <StockTrading game={game} team={team} allTeams={allTeams} />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GameDashboard;
