import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, TrendingUp, DollarSign, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WinScreenProps {
  game: any;
  team?: any;
}

const WinScreen = ({ game, team }: WinScreenProps) => {
  const [rankings, setRankings] = useState<any[]>([]);
  const [winner, setWinner] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFinalRankings = async () => {
      const { data: teams } = await supabase
        .from("teams")
        .select("*")
        .eq("game_id", game.id)
        .order("market_share", { ascending: false });

      if (teams && teams.length > 0) {
        setRankings(teams);
        setWinner(teams[0]);
      }
    };

    fetchFinalRankings();
  }, [game.id, team]);

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 0:
        return { icon: Trophy, color: "text-yellow-400", bgColor: "bg-yellow-500/20", borderColor: "border-yellow-500" };
      case 1:
        return { icon: Medal, color: "text-gray-400", bgColor: "bg-gray-500/20", borderColor: "border-gray-500" };
      case 2:
        return { icon: Medal, color: "text-amber-700", bgColor: "bg-amber-700/20", borderColor: "border-amber-700" };
      default:
        return { icon: Users, color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500" };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Winner Announcement */}
        {winner && (
          <Card className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 border-yellow-400 shadow-2xl">
            <CardContent className="pt-8 pb-8 text-center">
              <Trophy className="h-24 w-24 mx-auto mb-4 text-yellow-100 animate-bounce" />
              <h1 className="text-5xl font-bold text-white mb-2">
                🎉 {winner.team_name} Wins! 🎉
              </h1>
              <p className="text-2xl text-yellow-100">
                Market Share: {winner.market_share.toFixed(2)}%
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
                <div className="bg-white/20 rounded-lg p-4">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-white" />
                  <div className="text-sm text-yellow-100">Total Profit</div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(winner.total_profit)}
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-white" />
                  <div className="text-sm text-yellow-100">Stock Price</div>
                  <div className="text-xl font-bold text-white">
                    ₹{winner.stock_price.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <Star className="h-6 w-6 mx-auto mb-2 text-white" />
                  <div className="text-sm text-yellow-100">Final Capital</div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(winner.current_capital)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Rankings */}
        <Card className="bg-slate-900/90 border-slate-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-white">
              Final Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings.map((rankTeam, index) => {
                const { icon: Icon, color, bgColor, borderColor } = getRankMedal(index);
                const isCurrentTeam = team && team.id === rankTeam.id;

                return (
                  <div
                    key={rankTeam.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      isCurrentTeam 
                        ? 'bg-blue-600/30 border-blue-400 shadow-lg scale-105' 
                        : `${bgColor} ${borderColor}`
                    }`}
                  >
                    {/* Rank Number */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${bgColor} border-2 ${borderColor} flex items-center justify-center`}>
                      <span className={`text-2xl font-bold ${color}`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Medal Icon */}
                    <Icon className={`h-8 w-8 ${color} flex-shrink-0`} />

                    {/* Team Name */}
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold ${isCurrentTeam ? 'text-blue-200' : 'text-white'}`}>
                        {rankTeam.team_name}
                        {isCurrentTeam && <span className="ml-2 text-sm bg-blue-500 px-2 py-1 rounded">YOU</span>}
                      </h3>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 flex-shrink-0">
                      <div className="text-center bg-white/10 rounded p-2">
                        <div className="text-xs text-gray-300">Market Share</div>
                        <div className="text-lg font-bold text-white">
                          {rankTeam.market_share.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-center bg-white/10 rounded p-2">
                        <div className="text-xs text-gray-300">Profit</div>
                        <div className={`text-lg font-bold ${rankTeam.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(rankTeam.total_profit)}
                        </div>
                      </div>
                      <div className="text-center bg-white/10 rounded p-2">
                        <div className="text-xs text-gray-300">Stock</div>
                        <div className="text-lg font-bold text-green-400">
                          ₹{rankTeam.stock_price.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center bg-white/10 rounded p-2">
                        <div className="text-xs text-gray-300">Capital</div>
                        <div className="text-lg font-bold text-white">
                          {formatCurrency(rankTeam.current_capital)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/")}
            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
          >
            Return to Home
          </Button>
          <Button
            size="lg"
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            View Game Stats
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WinScreen;
