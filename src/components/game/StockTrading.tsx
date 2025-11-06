import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, DollarSign } from "lucide-react";

interface StockTradingProps {
  game: any;
  team: any;
  allTeams: any[];
}

const StockTrading = ({ game, team, allTeams }: StockTradingProps) => {
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [shares, setShares] = useState<number>(0);
  const [trading, setTrading] = useState(false);

  const otherTeams = allTeams.filter((t) => t.id !== team.id);

  const handleBuyShares = async () => {
    if (!selectedTeam) {
      toast.error("Please select a team");
      return;
    }

    if (shares <= 0) {
      toast.error("Please enter a valid number of shares");
      return;
    }

    const targetTeam = otherTeams.find((t) => t.id === selectedTeam);
    if (!targetTeam) return;

    const totalCost = shares * targetTeam.stock_price;

    if (totalCost > team.current_capital) {
      toast.error("Insufficient capital for this purchase");
      return;
    }

    setTrading(true);

    try {
      // Record the trade
      const { error: tradeError } = await supabase.from("stock_trades").insert({
        buyer_team_id: team.id,
        target_team_id: selectedTeam,
        shares_bought: shares,
        price_per_share: targetTeam.stock_price,
        total_cost: totalCost,
        quarter: game.current_quarter,
      });

      if (tradeError) throw tradeError;

      // Update buyer's capital
      const { error: buyerError } = await supabase
        .from("teams")
        .update({
          current_capital: team.current_capital - totalCost,
        })
        .eq("id", team.id);

      if (buyerError) throw buyerError;

      toast.success(
        `Successfully bought ${shares} shares of ${targetTeam.team_name} for ${totalCost.toLocaleString()} ₹`
      );
      setShares(0);
      setSelectedTeam("");
    } catch (error) {
      console.error("Error buying shares:", error);
      toast.error("Failed to complete trade");
    } finally {
      setTrading(false);
    }
  };

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
            <TrendingUp className="h-5 w-5 text-primary" />
            Stock Market
          </CardTitle>
          <CardDescription>
            Invest in other teams' stocks to diversify your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">
                Your Available Capital
              </p>
              <p className="text-2xl font-bold text-neon-cyan">
                {formatCurrency(team.current_capital)}
              </p>
            </div>

            <div className="space-y-4">
              <Label>Select Team to Invest In</Label>
              <div className="grid gap-2">
                {otherTeams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeam(t.id)}
                    className={`p-4 rounded-lg border text-left transition-smooth ${
                      selectedTeam === t.id
                        ? "border-primary bg-primary/20"
                        : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{t.team_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Market Share: {t.market_share.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-neon-gold">
                          ₹{t.stock_price.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          per share
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedTeam && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Number of Shares</Label>
                  <Input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(Number(e.target.value))}
                    min="1"
                    placeholder="Enter number of shares"
                  />
                </div>

                {shares > 0 && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Total Cost
                      </span>
                      <span className="font-bold text-lg">
                        {formatCurrency(
                          shares *
                            (otherTeams.find((t) => t.id === selectedTeam)
                              ?.stock_price || 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBuyShares}
                  disabled={trading || shares <= 0}
                  className="w-full h-12 shadow-glow"
                >
                  <DollarSign className="mr-2 h-5 w-5" />
                  {trading ? "Processing..." : "Buy Shares"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {otherTeams.length === 0 && (
        <Card className="strategic-gradient border-primary/20">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No other teams available for trading yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockTrading;
