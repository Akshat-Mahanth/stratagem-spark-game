import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlayCircle, SkipForward, Trophy, Users } from "lucide-react";
import QuarterTimer from "./QuarterTimer";

interface HostDashboardProps {
  game: any;
}

const HostDashboard = ({ game }: HostDashboardProps) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data } = await supabase
        .from("teams")
        .select("*")
        .eq("game_id", game.id)
        .order("market_share", { ascending: false });

      setTeams(data || []);
    };

    fetchTeams();

    const channel = supabase
      .channel("host-teams-updates")
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game.id]);

  const advanceQuarter = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Calculate current quarter results
      const { error: calcError } = await supabase.functions.invoke(
        "calculate-quarter-results",
        {
          body: { gameId: game.id, quarter: game.current_quarter },
        }
      );

      if (calcError) throw calcError;

      // Advance to next quarter
      const nextQuarter = game.current_quarter + 1;

      if (nextQuarter > game.max_quarters) {
        // Game over
        const { error: updateError } = await supabase
          .from("games")
          .update({ status: "completed" })
          .eq("id", game.id);

        if (updateError) throw updateError;
        toast.success("Game completed!");
      } else {
        // Start next quarter
        const { error: updateError } = await supabase
          .from("games")
          .update({
            current_quarter: nextQuarter,
            quarter_start_time: new Date().toISOString(),
          })
          .eq("id", game.id);

        if (updateError) throw updateError;
        toast.success(`Quarter ${nextQuarter} started!`);
      }
    } catch (error) {
      console.error("Error advancing quarter:", error);
      toast.error("Failed to advance quarter");
    } finally {
      setLoading(false);
    }
  };

  const endGame = async () => {
    if (loading) return;
    
    if (!confirm("Are you sure you want to end the game?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("games")
        .update({ status: "completed" })
        .eq("id", game.id);

      if (error) throw error;
      toast.success("Game ended!");
    } catch (error) {
      console.error("Error ending game:", error);
      toast.error("Failed to end game");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateFinalScore = (team: any) => {
    // Weighted scoring formula
    const profitScore = Math.min(100, (team.total_profit / 50000000) * 100) * 0.25;
    const marketShareScore = team.market_share * 0.25;
    const stockGrowth = ((team.stock_price - 100) / 100) * 100;
    const stockScore = Math.min(100, Math.max(0, stockGrowth)) * 0.10;
    const debtRatio = team.total_debt / (team.current_capital + 1);
    const debtScore = Math.max(0, 100 - debtRatio * 100) * 0.10;
    
    return profitScore + marketShareScore + stockScore + debtScore;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neon-blue">Host Dashboard</h1>
            <p className="text-muted-foreground">
              Quarter {game.current_quarter} of {game.max_quarters} • {teams.length} Teams
            </p>
          </div>
          <QuarterTimer game={game} />
        </div>

        {/* Controls */}
        <Card className="strategic-gradient border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Game Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={advanceQuarter}
              disabled={loading || game.current_quarter >= game.max_quarters}
              className="shadow-glow"
            >
              <SkipForward className="mr-2 h-5 w-5" />
              {game.current_quarter >= game.max_quarters ? "Game Complete" : "Advance Quarter"}
            </Button>
            <Button
              onClick={endGame}
              disabled={loading}
              variant="outline"
            >
              <Trophy className="mr-2 h-5 w-5" />
              End Game Now
            </Button>
          </CardContent>
        </Card>

        {/* Teams Leaderboard */}
        <Card className="strategic-gradient border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teams.map((team, index) => {
                const finalScore = calculateFinalScore(team);
                return (
                  <div
                    key={team.id}
                    className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-neon-cyan w-8">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{team.team_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Score: {finalScore.toFixed(1)} | Market Share: {team.market_share.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-muted-foreground">Capital</div>
                      <div className={`font-bold ${team.current_capital >= 0 ? "text-profit" : "text-loss"}`}>
                        {formatCurrency(team.current_capital)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stock: ₹{team.stock_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {teams.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No teams joined yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostDashboard;
