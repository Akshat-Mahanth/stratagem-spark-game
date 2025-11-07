import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Factory, DollarSign, TrendingUp, Users, MapPin } from "lucide-react";

interface DecisionPanelProps {
  game: any;
  team: any;
}

const DecisionPanel = ({ game, team }: DecisionPanelProps) => {
  const [cities, setCities] = useState<any[]>([]);
  const [decisions, setDecisions] = useState({
    units_produced: 0,
    cost_per_unit: 0,
    luxury_percentage: 0,
    flagship_percentage: 0,
    midtier_percentage: 0,
    lowertier_percentage: 0,
    luxury_price: 120000,
    flagship_price: 65000,
    midtier_price: 25000,
    lowertier_price: 10000,
    marketing_budget: 0,
    rnd_budget: 0,
    employee_budget: 0,
    new_debt: 0,
    debt_repayment: 0,
  });

  const [marketAllocations, setMarketAllocations] = useState<{ [key: string]: number }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      const { data } = await supabase.from("city_data").select("*");
      setCities(data || []);
      
      // Initialize market allocations
      const initialAllocations: { [key: string]: number } = {};
      data?.forEach((city) => {
        initialAllocations[city.city_name] = 0;
      });
      setMarketAllocations(initialAllocations);
    };

    fetchCities();
  }, []);

  const handleSubmitDecisions = async () => {
    // Validate tier percentages
    const totalTierPercentage =
      decisions.luxury_percentage +
      decisions.flagship_percentage +
      decisions.midtier_percentage +
      decisions.lowertier_percentage;

    if (totalTierPercentage !== 100) {
      toast.error("Phone tier percentages must sum to 100%");
      return;
    }

    // Validate market allocations
    const totalMarketAllocation = Object.values(marketAllocations).reduce(
      (sum, val) => sum + val,
      0
    );

    if (totalMarketAllocation !== 100) {
      toast.error("Market allocations must sum to 100%");
      return;
    }

    // Validate capital constraints
    const productionCost = decisions.units_produced * decisions.cost_per_unit;
    const totalCosts =
      productionCost +
      decisions.marketing_budget +
      decisions.rnd_budget +
      decisions.employee_budget +
      decisions.debt_repayment;

    const availableFunds = team.current_capital + decisions.new_debt;

    if (totalCosts > availableFunds) {
      toast.error(
        `Total costs (₹${totalCosts.toLocaleString()}) exceed available funds (₹${availableFunds.toLocaleString()})`
      );
      return;
    }

    // Validate debt ceiling
    const newTotalDebt = team.total_debt + decisions.new_debt - decisions.debt_repayment;

    if (newTotalDebt > team.debt_ceiling) {
      toast.error(
        `New debt (₹${newTotalDebt.toLocaleString()}) would exceed debt ceiling (₹${team.debt_ceiling.toLocaleString()})`
      );
      return;
    }

    // Validate debt repayment doesn't exceed current debt
    if (decisions.debt_repayment > team.total_debt) {
      toast.error(
        `Debt repayment (₹${decisions.debt_repayment.toLocaleString()}) cannot exceed current debt (₹${team.total_debt.toLocaleString()})`
      );
      return;
    }

    setSaving(true);

    try {
      // Insert decision
      const { data: decision, error: decisionError } = await supabase
        .from("team_decisions")
        .insert({
          team_id: team.id,
          quarter: game.current_quarter,
          ...decisions,
        })
        .select()
        .single();

      if (decisionError) throw decisionError;

      // Insert market allocations
      const allocationsData = Object.entries(marketAllocations).map(
        ([city, percentage]) => ({
          decision_id: decision.id,
          city,
          allocation_percentage: percentage,
        })
      );

      const { error: allocationsError } = await supabase
        .from("market_allocations")
        .insert(allocationsData);

      if (allocationsError) throw allocationsError;

      toast.success("Decisions submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting decisions:", error);
      if (error.code === "23505") {
        toast.error("Decisions already submitted for this quarter");
      } else {
        toast.error("Failed to submit decisions");
      }
    } finally {
      setSaving(false);
    }
  };

  const updateDecision = (field: string, value: number) => {
    setDecisions((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <Card className="strategic-gradient border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            Strategic Decisions - Quarter {game.current_quarter}
          </CardTitle>
          <CardDescription>
            Make your strategic choices for this quarter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="production" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
            </TabsList>

            <TabsContent value="production" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Units to Produce</Label>
                  <Input
                    type="number"
                    value={decisions.units_produced}
                    onChange={(e) =>
                      updateDecision("units_produced", Number(e.target.value))
                    }
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost Per Unit (₹)</Label>
                  <Input
                    type="number"
                    value={decisions.cost_per_unit}
                    onChange={(e) =>
                      updateDecision("cost_per_unit", Number(e.target.value))
                    }
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Phone Tier Allocation (Total must be 100%)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-neon-gold">
                      Luxury (₹120k+)
                    </Label>
                    <Input
                      type="number"
                      value={decisions.luxury_percentage}
                      onChange={(e) =>
                        updateDecision("luxury_percentage", Number(e.target.value))
                      }
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-primary">
                      Flagship (₹65k-120k)
                    </Label>
                    <Input
                      type="number"
                      value={decisions.flagship_percentage}
                      onChange={(e) =>
                        updateDecision("flagship_percentage", Number(e.target.value))
                      }
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-neon-cyan">
                      Mid-tier (₹25k-65k)
                    </Label>
                    <Input
                      type="number"
                      value={decisions.midtier_percentage}
                      onChange={(e) =>
                        updateDecision("midtier_percentage", Number(e.target.value))
                      }
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Lower-tier (₹0-25k)
                    </Label>
                    <Input
                      type="number"
                      value={decisions.lowertier_percentage}
                      onChange={(e) =>
                        updateDecision("lowertier_percentage", Number(e.target.value))
                      }
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total:{" "}
                  {decisions.luxury_percentage +
                    decisions.flagship_percentage +
                    decisions.midtier_percentage +
                    decisions.lowertier_percentage}
                  %
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Luxury Price (₹)</Label>
                  <Input
                    type="number"
                    value={decisions.luxury_price}
                    onChange={(e) =>
                      updateDecision("luxury_price", Number(e.target.value))
                    }
                    min="120000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Flagship Price (₹)</Label>
                  <Input
                    type="number"
                    value={decisions.flagship_price}
                    onChange={(e) =>
                      updateDecision("flagship_price", Number(e.target.value))
                    }
                    min="65000"
                    max="120000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mid-tier Price (₹)</Label>
                  <Input
                    type="number"
                    value={decisions.midtier_price}
                    onChange={(e) =>
                      updateDecision("midtier_price", Number(e.target.value))
                    }
                    min="25000"
                    max="65000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lower-tier Price (₹)</Label>
                  <Input
                    type="number"
                    value={decisions.lowertier_price}
                    onChange={(e) =>
                      updateDecision("lowertier_price", Number(e.target.value))
                    }
                    min="0"
                    max="25000"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budgets" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Marketing Budget (₹)
                  </Label>
                  <Input
                    type="number"
                    value={decisions.marketing_budget}
                    onChange={(e) =>
                      updateDecision("marketing_budget", Number(e.target.value))
                    }
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    R&D Budget (₹)
                  </Label>
                  <Input
                    type="number"
                    value={decisions.rnd_budget}
                    onChange={(e) =>
                      updateDecision("rnd_budget", Number(e.target.value))
                    }
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Employee Budget (₹)
                  </Label>
                  <Input
                    type="number"
                    value={decisions.employee_budget}
                    onChange={(e) =>
                      updateDecision("employee_budget", Number(e.target.value))
                    }
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    New Debt (₹)
                  </Label>
                  <Input
                    type="number"
                    value={decisions.new_debt}
                    onChange={(e) =>
                      updateDecision("new_debt", Number(e.target.value))
                    }
                    min="0"
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Current Debt: ₹{team.total_debt.toLocaleString()} | Debt
                  Ceiling: ₹{team.debt_ceiling.toLocaleString()}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="markets" className="space-y-4 mt-4">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Market Allocation by City (Total must be 100%)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {cities.map((city) => (
                  <div key={city.id} className="space-y-2">
                    <Label className="text-xs">{city.city_name}</Label>
                    <Input
                      type="number"
                      value={marketAllocations[city.city_name] || 0}
                      onChange={(e) =>
                        setMarketAllocations((prev) => ({
                          ...prev,
                          [city.city_name]: Number(e.target.value),
                        }))
                      }
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pop: {(city.population / 1000).toFixed(0)}k
                    </p>
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Total:{" "}
                {Object.values(marketAllocations).reduce(
                  (sum, val) => sum + val,
                  0
                )}
                %
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button
              onClick={handleSubmitDecisions}
              disabled={saving}
              className="w-full h-12 shadow-glow"
            >
              {saving ? "Submitting..." : "Submit Decisions"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DecisionPanel;
