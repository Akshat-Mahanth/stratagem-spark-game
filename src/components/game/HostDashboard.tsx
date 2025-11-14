import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlayCircle, SkipForward, Trophy, Users, PieChart, BarChart3 } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import QuarterTimer from "./QuarterTimer";
import StockChart from "./StockChart";
import SpeedometerChart from "@/components/ui/SpeedometerChart";
import { calculateQuarterResults } from "@/lib/quarterCalculations";

interface HostDashboardProps {
  game: any;
}

const HostDashboard = ({ game }: HostDashboardProps) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

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

    // Periodic refresh every 30 seconds as backup
    const refreshInterval = setInterval(() => {
      fetchTeams();
    }, 30000);

    const channel = supabase
      .channel(`host-teams-updates-${game.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          console.log("Host: Team update received:", payload);
          fetchTeams();
          fetchAnalytics();
        }
      )
      .subscribe((status) => {
        console.log("Host: Teams subscription status:", status);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error("Host: Teams subscription failed, retrying...");
          setTimeout(() => {
            fetchTeams();
          }, 2000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      clearInterval(refreshInterval);
    };
  }, [game.id]);

  // Fetch analytics when teams are loaded or game quarter changes
  useEffect(() => {
    if (teams.length > 0) {
      fetchAnalytics();
    }
  }, [teams, game.current_quarter]);

  const fetchAnalytics = async () => {
    try {
      // Fetch team metrics for current quarter
      const { data: metrics } = await supabase
        .from("team_metrics")
        .select("*")
        .eq("quarter", game.current_quarter)
        .in("team_id", teams.map(t => t.id));

      // Fetch team decisions for current quarter
      const { data: decisions } = await supabase
        .from("team_decisions")
        .select("*")
        .eq("quarter", game.current_quarter)
        .in("team_id", teams.map(t => t.id));

      if (teams.length > 0) {
        // Calculate market share data
        const marketShareData = teams.map((team, index) => ({
          name: team.team_name,
          value: team.market_share,
          color: ["#00D9FF", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6"][index % 5]
        }));

        // Calculate capital distribution
        const capitalData = teams.map((team, index) => ({
          name: team.team_name,
          value: Math.max(0, team.current_capital),
          color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"][index % 5]
        }));

        // Calculate production allocation if decisions exist
        let productionData: any[] = [];
        if (decisions && decisions.length > 0) {
          const totalProduction = decisions.reduce((sum, d) => sum + d.units_produced, 0);
          productionData = decisions.map((decision, index) => {
            const team = teams.find(t => t.id === decision.team_id);
            return {
              name: team?.team_name || `Team ${index + 1}`,
              value: decision.units_produced,
              color: ["#FF9F43", "#10AC84", "#EE5A24", "#0984E3", "#A29BFE"][index % 5]
            };
          }).filter(d => d.value > 0);
        }

        // Calculate additional analytics for speedometers
        const avgCustomerSatisfaction = metrics && metrics.length > 0 
          ? metrics.reduce((sum, m) => sum + (m.customer_satisfaction || 50), 0) / metrics.length 
          : 50;
        
        const avgEmployeeProductivity = metrics && metrics.length > 0
          ? metrics.reduce((sum, m) => sum + (m.employee_productivity || 50), 0) / metrics.length
          : 50;
        
        const totalRevenue = metrics && metrics.length > 0
          ? metrics.reduce((sum, m) => sum + (m.revenue || 0), 0)
          : 0;
        
        const avgROI = metrics && metrics.length > 0
          ? metrics.reduce((sum, m) => sum + (m.roi || 0), 0) / metrics.length
          : 0;

        const marketCompetitiveness = teams.length > 1 
          ? (1 - (Math.max(...teams.map(t => t.market_share)) / 100)) * 100
          : 50;

        setAnalytics({
          marketShare: marketShareData.filter(d => d.value > 0),
          capital: capitalData.filter(d => d.value > 0),
          production: productionData,
          speedometers: {
            customerSatisfaction: avgCustomerSatisfaction,
            employeeProductivity: avgEmployeeProductivity,
            totalRevenue: totalRevenue / 10000000, // Convert to crores
            avgROI: Math.max(0, avgROI),
            marketCompetitiveness: marketCompetitiveness,
            gameProgress: (game.current_quarter / game.max_quarters) * 100
          }
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const advanceQuarter = async () => {
    if (loading) return;
    
    setLoading(true);
    const toastId = toast.loading("Processing quarter results...");
    
    try {
      // Try Edge Function first, fallback to client-side calculation
      let calcResult;
      try {
        const { data, error: calcError } = await supabase.functions.invoke(
          "calculate-quarter-results",
          {
            body: { gameId: game.id, quarter: game.current_quarter },
          }
        );

        if (calcError) throw calcError;
        calcResult = data;
        console.log("Quarter calculation result (Edge Function):", calcResult);
      } catch (edgeFunctionError) {
        console.warn("Edge Function failed, using client-side calculation:", edgeFunctionError);
        // Fallback to client-side calculation
        calcResult = await calculateQuarterResults(game.id, game.current_quarter);
        console.log("Quarter calculation result (Client-side):", calcResult);
      }

      // Advance to next quarter
      const nextQuarter = game.current_quarter + 1;

      if (nextQuarter > game.max_quarters) {
        // Game over
        const { error: updateError } = await supabase
          .from("games")
          .update({ status: "completed" })
          .eq("id", game.id);

        if (updateError) {
          console.error("Game completion error:", updateError);
          toast.dismiss(toastId);
          toast.error(`Failed to complete game: ${updateError.message}`);
          setLoading(false);
          return;
        }
        toast.dismiss(toastId);
        toast.success("Game completed! 🎉");
      } else {
        // Start next quarter
        const { error: updateError } = await supabase
          .from("games")
          .update({
            current_quarter: nextQuarter,
            quarter_start_time: new Date().toISOString(),
          })
          .eq("id", game.id);

        if (updateError) {
          console.error("Quarter update error:", updateError);
          toast.dismiss(toastId);
          toast.error(`Failed to update quarter: ${updateError.message}`);
          setLoading(false);
          return;
        }
        toast.dismiss(toastId);
        toast.success(`Quarter ${nextQuarter} started!`);
      }
    } catch (error: any) {
      console.error("Error advancing quarter:", error);
      toast.dismiss(toastId);
      toast.error(`Failed to advance quarter: ${error.message || 'Unknown error'}`);
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

  // Game End Results Screen
  if (game.status === 'completed') {
    const sortedTeams = [...teams].sort((a, b) => calculateFinalScore(b) - calculateFinalScore(a));
    
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Game End Header */}
          <Card className="strategic-gradient border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Trophy className="h-8 w-8 text-yellow-500" />
                Game Completed!
              </CardTitle>
              <p className="text-muted-foreground">
                Final Results - {game.max_quarters} Quarters Completed
              </p>
            </CardHeader>
          </Card>

          {/* Winner Podium */}
          <Card className="strategic-gradient border-yellow-500 border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-center">🏆 Champion 🏆</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedTeams.length > 0 && (
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-yellow-500">
                    {sortedTeams[0].team_name}
                  </div>
                  <div className="text-2xl text-muted-foreground">
                    Final Score: {calculateFinalScore(sortedTeams[0]).toFixed(2)}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Market Share</div>
                      <div className="text-xl font-bold">{sortedTeams[0].market_share.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Stock Price</div>
                      <div className="text-xl font-bold">₹{sortedTeams[0].stock_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Capital</div>
                      <div className="text-xl font-bold">{formatCurrency(sortedTeams[0].current_capital)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Final Rankings */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-500/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Final Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedTeams.map((team, index) => (
                  <div 
                    key={team.id} 
                    className={`p-4 rounded-lg border-2 ${
                      index === 0 ? 'border-yellow-500 bg-gradient-to-r from-yellow-600/30 to-yellow-500/20' :
                      index === 1 ? 'border-gray-400 bg-gradient-to-r from-gray-600/30 to-gray-500/20' :
                      index === 2 ? 'border-orange-500 bg-gradient-to-r from-orange-600/30 to-orange-500/20' :
                      'border-slate-600 bg-gradient-to-r from-slate-700/50 to-slate-600/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                        <div>
                          <div className={`text-xl font-bold ${
                            index === 0 ? 'text-yellow-300' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-300' :
                            'text-white'
                          }`}>{team.team_name}</div>
                          <div className="text-sm text-gray-300">
                            Score: {calculateFinalScore(team).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="bg-white/10 rounded p-2">
                          <div className="text-xs text-gray-300">Market Share</div>
                          <div className="font-bold text-white">{team.market_share.toFixed(1)}%</div>
                        </div>
                        <div className="bg-white/10 rounded p-2">
                          <div className="text-xs text-gray-300">Stock Price</div>
                          <div className="font-bold text-green-400">₹{team.stock_price.toFixed(2)}</div>
                        </div>
                        <div className="bg-white/10 rounded p-2">
                          <div className="text-xs text-gray-300">Capital</div>
                          <div className={`font-bold ${team.current_capital >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(team.current_capital)}
                          </div>
                        </div>
                        <div className="bg-white/10 rounded p-2">
                          <div className="text-xs text-gray-300">Debt</div>
                          <div className="font-bold text-red-400">{formatCurrency(team.total_debt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stock Chart - No fluctuations */}
          <StockChart gameId={game.id} height={350} gameStatus={game.status} />

          {/* Final Analytics */}
          {analytics?.speedometers && (
            <Card className="strategic-gradient border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Final Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <SpeedometerChart
                    value={analytics.speedometers.customerSatisfaction}
                    maxValue={100}
                    title="Avg Customer Satisfaction"
                    unit="%"
                    size={100}
                  />
                  <SpeedometerChart
                    value={analytics.speedometers.employeeProductivity}
                    maxValue={100}
                    title="Avg Employee Productivity"
                    unit="%"
                    size={100}
                  />
                  <SpeedometerChart
                    value={analytics.speedometers.totalRevenue}
                    maxValue={50}
                    title="Total Revenue"
                    unit="₹Cr"
                    size={100}
                  />
                  <SpeedometerChart
                    value={analytics.speedometers.avgROI}
                    maxValue={200}
                    title="Average ROI"
                    unit="%"
                    size={100}
                  />
                  <SpeedometerChart
                    value={analytics.speedometers.marketCompetitiveness}
                    maxValue={100}
                    title="Market Competition"
                    unit="%"
                    size={100}
                  />
                  <SpeedometerChart
                    value={100}
                    maxValue={100}
                    title="Game Progress"
                    unit="%"
                    color="#059669"
                    size={100}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

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
          {game.status === 'active' && <QuarterTimer game={game} />}
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

        {/* Stock Chart */}
        <StockChart gameId={game.id} height={350} gameStatus={game.status} />

        {/* Analytics Dashboard */}
        {analytics && (
          <>
            {/* Key Performance Indicators */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="strategic-gradient border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Market Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neon-cyan">
                    ₹{analytics.capital.reduce((sum: number, item: any) => sum + item.value, 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="strategic-gradient border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Production</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neon-gold">
                    {analytics.production.reduce((sum: number, item: any) => sum + item.value, 0).toLocaleString()} units
                  </div>
                </CardContent>
              </Card>
              
              <Card className="strategic-gradient border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {teams.length}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="strategic-gradient border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Market Leader</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-neon-blue">
                    {teams.length > 0 ? teams[0].team_name : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {teams.length > 0 ? `${teams[0].market_share.toFixed(1)}% share` : ''}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Speedometer Analytics */}
            {analytics?.speedometers && (
              <Card className="strategic-gradient border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <SpeedometerChart
                      value={analytics.speedometers.customerSatisfaction}
                      maxValue={100}
                      title="Customer Satisfaction"
                      unit="%"
                      size={100}
                    />
                    <SpeedometerChart
                      value={analytics.speedometers.employeeProductivity}
                      maxValue={100}
                      title="Employee Productivity"
                      unit="%"
                      size={100}
                    />
                    <SpeedometerChart
                      value={analytics.speedometers.totalRevenue}
                      maxValue={50}
                      title="Total Revenue"
                      unit="₹Cr"
                      size={100}
                    />
                    <SpeedometerChart
                      value={analytics.speedometers.avgROI}
                      maxValue={200}
                      title="Average ROI"
                      unit="%"
                      size={100}
                    />
                    <SpeedometerChart
                      value={analytics.speedometers.marketCompetitiveness}
                      maxValue={100}
                      title="Market Competition"
                      unit="%"
                      size={100}
                    />
                    <SpeedometerChart
                      value={analytics.speedometers.gameProgress}
                      maxValue={100}
                      title="Game Progress"
                      unit="%"
                      color="#FF1E00"
                      size={100}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-6">
            {/* Market Share Chart */}
            <Card className="strategic-gradient border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Market Share
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.marketShare}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {analytics.marketShare.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value.toFixed(2)}%`, 'Market Share']} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Capital Distribution Chart */}
            <Card className="strategic-gradient border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Capital Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.capital}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {analytics.capital.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Capital']} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Production Distribution Chart */}
            <Card className="strategic-gradient border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Production Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.production}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      {analytics.production.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value.toLocaleString()} units`, 'Production']} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          </>
        )}

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
