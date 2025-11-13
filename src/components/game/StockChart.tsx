import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Clock, Eye } from "lucide-react";

interface StockChartProps {
  gameId: string;
  teamId?: string; // If provided, highlights this team's stock
  height?: number;
  gameStatus?: string; // Game status to control dynamic effects
}

const StockChart = ({ gameId, teamId, height = 300, gameStatus = 'active' }: StockChartProps) => {
  const [stockData, setStockData] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [liveFluctuations, setLiveFluctuations] = useState<{[teamId: string]: number}>({});
  const [viewMode, setViewMode] = useState<'all' | 'last5' | 'realtime'>('all');
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        // Fetch teams
        const { data: teamsData } = await supabase
          .from("teams")
          .select("*")
          .eq("game_id", gameId);

        if (!teamsData) return;
        setTeams(teamsData);

        // Fetch team metrics for all quarters to build stock history
        const { data: metricsData } = await supabase
          .from("team_metrics")
          .select("*")
          .in("team_id", teamsData.map(t => t.id))
          .order("quarter", { ascending: true });

        // Build real-time stock data with second-level granularity
        const now = Date.now();
        const chartData: any[] = [];
        
        // Create data points for every second in the last 60 seconds
        for (let i = 60; i >= 0; i--) {
          const timestamp = now - (i * 1000);
          const dataPoint: any = {
            timestamp,
            timeLabel: new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })
          };
          
          teamsData?.forEach(team => {
            // Get base stock price from team
            const basePrice = team.stock_price || 100;
            // Add current fluctuation if exists
            const fluctuation = liveFluctuations[team.id] || 0;
            dataPoint[team.team_name] = basePrice * (1 + fluctuation);
          });
          
          chartData.push(dataPoint);
        }

        setStockData(chartData);

      } catch (error) {
        console.error("Error fetching stock data:", error);
      }
    };

    fetchStockData();

    // Set up real-time subscription for updates
    const channel = supabase
      .channel(`stock-updates-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_metrics",
        },
        (payload) => {
          console.log("Stock chart: Team metrics updated", payload);
          fetchStockData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "teams",
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log("Stock chart: Team updated", payload);
          fetchStockData();
        }
      )
      .subscribe((status) => {
        console.log("Stock chart subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  // Elect a leader client to generate fluctuations (first client that connects)
  useEffect(() => {
    if (teams.length === 0 || gameStatus === 'completed') return;

    const checkLeadership = async () => {
      // Check if there are any recent fluctuations (within last 5 seconds)
      const { data: recentFluctuations } = await supabase
        .from('stock_fluctuations' as any)
        .select('*')
        .eq('game_id', gameId)
        .gte('timestamp', new Date(Date.now() - 5000).toISOString())
        .limit(1);

      // If no recent fluctuations, this client becomes the leader
      if (!recentFluctuations || recentFluctuations.length === 0) {
        setIsLeader(true);
      }
    };

    checkLeadership();
  }, [gameId, teams.length, gameStatus]);

  // Leader generates and publishes fluctuations
  useEffect(() => {
    if (!isLeader || teams.length === 0 || gameStatus === 'completed') return;

    const fluctuationInterval = setInterval(async () => {
      const newFluctuations: {[teamId: string]: number} = {};
      
      for (const team of teams) {
        // Random fluctuation between -2% to +2%
        const fluctuation = (Math.random() - 0.5) * 0.04;
        newFluctuations[team.id] = fluctuation;

        // Publish to Supabase for sync
        await supabase.from('stock_fluctuations' as any).insert({
          game_id: gameId,
          team_id: team.id,
          fluctuation_value: fluctuation,
          timestamp: new Date().toISOString()
        });
      }
      
      setLiveFluctuations(newFluctuations);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(fluctuationInterval);
  }, [isLeader, teams, gameId, gameStatus]);

  // All clients subscribe to fluctuation updates
  useEffect(() => {
    if (teams.length === 0) return;

    const channel = supabase
      .channel(`stock-fluctuations-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_fluctuations',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          const newFluctuation = payload.new as any;
          setLiveFluctuations(prev => ({
            ...prev,
            [newFluctuation.team_id]: newFluctuation.fluctuation_value
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, teams.length]);

  // Update stock data every second for smooth animation
  useEffect(() => {
    if (teams.length === 0 || gameStatus === 'completed') return;

    const updateInterval = setInterval(() => {
      const now = Date.now();
      setStockData(prevData => {
        // Keep last 60 seconds of data
        const newData = prevData.slice(-60);
        
        // Add new data point
        const dataPoint: any = {
          timestamp: now,
          timeLabel: new Date(now).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })
        };
        
        teams.forEach(team => {
          const basePrice = team.stock_price || 100;
          const fluctuation = liveFluctuations[team.id] || 0;
          dataPoint[team.team_name] = basePrice * (1 + fluctuation);
        });
        
        return [...newData, dataPoint];
      });
    }, 1000); // Update every second

    return () => clearInterval(updateInterval);
  }, [teams, liveFluctuations, gameStatus]);

  // Filter data based on view mode
  const getFilteredData = () => {
    if (viewMode === 'realtime') {
      // Show last 10 seconds
      return stockData.slice(-10);
    } else if (viewMode === 'last5') {
      // Show last 30 seconds
      return stockData.slice(-30);
    }
    return stockData; // Show all (60 seconds)
  };

  const filteredData = getFilteredData();
  const colors = ["#1E40AF", "#059669", "#DC2626", "#F59E0B", "#8B5A2B", "#7C3AED"];

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-blue-900 border-blue-500/30 shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Stock Price Movement
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('all')}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              All
            </Button>
            <Button
              variant={viewMode === 'last5' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('last5')}
              className="text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              30s
            </Button>
            <Button
              variant={viewMode === 'realtime' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('realtime')}
              className="text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Live
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="timeLabel" 
              stroke="#E5E7EB"
              tick={{ fontSize: 10, fill: '#E5E7EB' }}
              interval="preserveStartEnd"
              tickFormatter={(value) => {
                // Show only seconds for better readability
                const time = new Date(value);
                return time.getSeconds() + 's';
              }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              label={{ value: 'Stock Price (₹)', angle: -90, position: 'insideLeft' }}
              domain={['dataMin - 20', 'dataMax + 20']}
              scale="linear"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any, name: string) => [`₹${value}`, name]}
              labelFormatter={(quarter) => `Quarter ${quarter}`}
            />
            <Legend />
            {teams.map((team, index) => (
              <Line
                key={team.id}
                type="monotone"
                dataKey={team.team_name}
                stroke={colors[index % colors.length]}
                strokeWidth={teamId === team.id ? 3 : 2}
                dot={{ r: teamId === team.id ? 6 : 4 }}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Current stock prices with live fluctuations */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {teams.map((team, index) => {
            const basePrice = stockData[stockData.length - 1]?.[team.team_name] || 100;
            const fluctuation = liveFluctuations[team.team_name] || 0;
            const currentPrice = basePrice * (1 + fluctuation);
            const previousPrice = stockData[stockData.length - 2]?.[team.team_name] || 100;
            const change = currentPrice - previousPrice;
            const changePercent = ((change / previousPrice) * 100).toFixed(2);
            
            return (
              <div 
                key={team.id} 
                className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                  teamId === team.id ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-gray-300 bg-white'
                } ${fluctuation > 0 && teamId !== team.id ? 'border-green-500 bg-green-50' : fluctuation < 0 && teamId !== team.id ? 'border-red-500 bg-red-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">{team.team_name}</div>
                  {teamId === team.id && <div className="text-xs font-bold text-blue-600">YOU</div>}
                </div>
                <div className="text-2xl font-bold text-gray-950">₹{currentPrice.toFixed(2)}</div>
                <div className={`text-sm font-semibold ${change >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {change >= 0 ? '+' : ''}₹{change.toFixed(2)} ({changePercent}%)
                </div>
                {Math.abs(fluctuation) > 0.005 && (
                  <div className={`text-xs font-bold ${fluctuation > 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {fluctuation > 0 ? '↗' : '↘'} Live
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;
