import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Factory, Banknote, TrendingUp, Users, MapPin, RotateCcw } from "lucide-react";
import PercentageSlider from "./PercentageSlider";
import FourTierSlider from "./FourTierSlider";
import IntuitiveTierSlider from "./IntuitiveTierSlider";
import ProductCostBreakdown from "./ProductCostBreakdown";

interface DecisionPanelProps {
  game: any;
  team: any;
}

const DecisionPanel = ({ game, team }: DecisionPanelProps) => {
  const [cities, setCities] = useState<any[]>([]);
  const [allTeamsData, setAllTeamsData] = useState<any[]>([]);
  const [decisions, setDecisions] = useState({
    units_produced: 0,
    cost_per_unit: 0,
    luxury_percentage: 25,
    flagship_percentage: 25,
    midtier_percentage: 25,
    lowertier_percentage: 25,
    luxury_price: 120000,
    flagship_price: 65000,
    midtier_price: 25000,
    lowertier_price: 12000,
    marketing_budget: 0,
    rnd_budget: 0,
    employee_budget: 0,
    new_debt: 0,
    debt_repayment: 0,
  });

  const [marketAllocations, setMarketAllocations] = useState<{ [key: string]: number }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCitiesAndDecisions = async () => {
      // Fetch cities
      const { data: citiesData } = await supabase.from("city_data").select("*");
      setCities(citiesData || []);
      
      // Initialize market allocations with even distribution
      const initialAllocations: { [key: string]: number } = {};
      const evenAllocation = citiesData ? Math.floor(100 / citiesData.length) : 0;
      let remainder = citiesData ? 100 - (evenAllocation * citiesData.length) : 0;
      
      citiesData?.forEach((city, index) => {
        initialAllocations[city.city_name] = evenAllocation + (index < remainder ? 1 : 0);
      });

      // Fetch existing decisions for current quarter
      const { data: existingDecision } = await supabase
        .from("team_decisions")
        .select("*")
        .eq("team_id", team.id)
        .eq("quarter", game.current_quarter)
        .single();

      if (existingDecision) {
        // Load existing decisions
        setDecisions({
          units_produced: existingDecision.units_produced,
          cost_per_unit: existingDecision.cost_per_unit,
          luxury_percentage: existingDecision.luxury_percentage,
          flagship_percentage: existingDecision.flagship_percentage,
          midtier_percentage: existingDecision.midtier_percentage,
          lowertier_percentage: existingDecision.lowertier_percentage,
          luxury_price: existingDecision.luxury_price,
          flagship_price: existingDecision.flagship_price,
          midtier_price: existingDecision.midtier_price,
          lowertier_price: existingDecision.lowertier_price,
          marketing_budget: existingDecision.marketing_budget,
          rnd_budget: existingDecision.rnd_budget,
          employee_budget: existingDecision.employee_budget,
          new_debt: existingDecision.new_debt,
          debt_repayment: existingDecision.debt_repayment,
        });

        // Fetch existing market allocations
        const { data: existingAllocations } = await supabase
          .from("market_allocations")
          .select("*")
          .eq("decision_id", existingDecision.id);

        if (existingAllocations) {
          const loadedAllocations: { [key: string]: number } = { ...initialAllocations };
          existingAllocations.forEach((allocation) => {
            loadedAllocations[allocation.city] = allocation.allocation_percentage;
          });
          setMarketAllocations(loadedAllocations);
        }
      } else {
        setMarketAllocations(initialAllocations);
      }
    };

    fetchCitiesAndDecisions();
  }, [team.id, game.current_quarter]);

  useEffect(() => {
    const fetchAllTeamsData = async () => {
      // Fetch all teams and their decisions for current quarter
      const { data: allTeams } = await supabase
        .from("teams")
        .select("*")
        .eq("game_id", game.id);

      const { data: allDecisions } = await supabase
        .from("team_decisions")
        .select("*")
        .eq("quarter", game.current_quarter)
        .in("team_id", (allTeams || []).map(t => t.id));

      setAllTeamsData(allDecisions || []);
    };

    fetchAllTeamsData();
  }, [game.id, game.current_quarter]);

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
        `Total costs (₹${totalCosts.toLocaleString('en-IN')}) exceed available funds (₹${availableFunds.toLocaleString('en-IN')})`
      );
      return;
    }

    // Validate debt ceiling
    const newTotalDebt = team.total_debt + decisions.new_debt - decisions.debt_repayment;

    if (newTotalDebt > team.debt_ceiling) {
      toast.error(
        `New debt (₹${newTotalDebt.toLocaleString('en-IN')}) would exceed debt ceiling (₹${team.debt_ceiling.toLocaleString('en-IN')})`
      );
      return;
    }

    // Validate debt repayment doesn't exceed current debt
    if (decisions.debt_repayment > team.total_debt) {
      toast.error(
        `Debt repayment (₹${decisions.debt_repayment.toLocaleString('en-IN')}) cannot exceed current debt (₹${team.total_debt.toLocaleString('en-IN')})`
      );
      return;
    }

    setSaving(true);

    try {
      // Upsert decision (insert or update if exists) with calculated cost per unit
      const { data: decision, error: decisionError } = await supabase
        .from("team_decisions")
        .upsert({
          team_id: team.id,
          quarter: game.current_quarter,
          ...decisions,
          cost_per_unit: budgetSummary.calculatedCostPerUnit,
        }, {
          onConflict: 'team_id,quarter'
        })
        .select()
        .single();

      if (decisionError) throw decisionError;

      // Delete existing market allocations for this decision
      await supabase
        .from("market_allocations")
        .delete()
        .eq("decision_id", decision.id);

      // Insert new market allocations
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

      toast.success("Decisions updated successfully!");
    } catch (error: any) {
      console.error("Error submitting decisions:", error);
      toast.error("Failed to submit decisions");
    } finally {
      setSaving(false);
    }
  };

  const updateDecision = (field: string, value: number) => {
    setDecisions((prev) => ({ ...prev, [field]: value }));
  };

  const resetToDefaults = () => {
    // Reset decisions to default values
    setDecisions({
      units_produced: 0,
      cost_per_unit: 0,
      luxury_percentage: 25,
      flagship_percentage: 25,
      midtier_percentage: 25,
      lowertier_percentage: 25,
      luxury_price: 120000,
      flagship_price: 65000,
      midtier_price: 25000,
      lowertier_price: 12000,
      marketing_budget: 0,
      rnd_budget: 0,
      employee_budget: 0,
      new_debt: 0,
      debt_repayment: 0,
    });

    // Reset market allocations to even distribution
    const evenAllocation = cities.length > 0 ? Math.floor(100 / cities.length) : 0;
    let remainder = cities.length > 0 ? 100 - (evenAllocation * cities.length) : 0;
    
    const resetAllocations: { [key: string]: number } = {};
    cities.forEach((city, index) => {
      resetAllocations[city.city_name] = evenAllocation + (index < remainder ? 1 : 0);
    });
    setMarketAllocations(resetAllocations);

    toast.success("All values reset to defaults");
  };

  // Calculate device-type based cost per unit with R&D impact
  const calculateCostPerUnit = () => {
    const baseCosts = {
      luxury: 80000,
      flagship: 35000,
      midtier: 15000,
      lowertier: 6000
    };
    
    // R&D reduces costs by up to 30%
    const rndReduction = Math.min(0.3, (decisions.rnd_budget / 5000000) * 0.3);
    
    const weightedCost = 
      (baseCosts.luxury * decisions.luxury_percentage / 100) +
      (baseCosts.flagship * decisions.flagship_percentage / 100) +
      (baseCosts.midtier * decisions.midtier_percentage / 100) +
      (baseCosts.lowertier * decisions.lowertier_percentage / 100);
    
    return Math.round(weightedCost * (1 - rndReduction));
  };

  // Calculate total costs and remaining budget in real-time
  const calculateBudgetSummary = () => {
    const calculatedCostPerUnit = calculateCostPerUnit();
    const productionCost = decisions.units_produced * calculatedCostPerUnit;
    const totalCosts = productionCost + decisions.marketing_budget + decisions.rnd_budget + decisions.employee_budget + decisions.debt_repayment;
    const availableFunds = team.current_capital + decisions.new_debt;
    const remainingBudget = availableFunds - totalCosts;
    
    return {
      productionCost,
      totalCosts,
      availableFunds,
      remainingBudget,
      isOverBudget: totalCosts > availableFunds,
      calculatedCostPerUnit
    };
  };

  const budgetSummary = calculateBudgetSummary();

  // Calculate market averages for comparison
  const calculateMarketAverages = () => {
    if (allTeamsData.length === 0) return null;

    const averages = {
      luxury_price: allTeamsData.reduce((sum, d) => sum + d.luxury_price, 0) / allTeamsData.length,
      flagship_price: allTeamsData.reduce((sum, d) => sum + d.flagship_price, 0) / allTeamsData.length,
      midtier_price: allTeamsData.reduce((sum, d) => sum + d.midtier_price, 0) / allTeamsData.length,
      lowertier_price: allTeamsData.reduce((sum, d) => sum + d.lowertier_price, 0) / allTeamsData.length,
      marketing_budget: allTeamsData.reduce((sum, d) => sum + d.marketing_budget, 0) / allTeamsData.length,
      rnd_budget: allTeamsData.reduce((sum, d) => sum + d.rnd_budget, 0) / allTeamsData.length,
    };

    return averages;
  };

  const marketAverages = calculateMarketAverages();

  const formatIndianNumber = (value: number) => {
    return value.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-4">
      {/* Always Visible Budget Summary */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Production Cost</div>
              <div className="font-bold text-lg">₹{formatIndianNumber(budgetSummary.productionCost)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Available Funds</div>
              <div className="font-bold text-lg">₹{formatIndianNumber(budgetSummary.availableFunds)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total Costs</div>
              <div className="font-bold text-lg">₹{formatIndianNumber(budgetSummary.totalCosts)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Remaining Budget</div>
              <div className={`font-bold text-lg ${budgetSummary.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{formatIndianNumber(budgetSummary.remainingBudget)}
              </div>
            </div>
          </div>
          {budgetSummary.isOverBudget && (
            <div className="mt-2 text-center text-sm text-red-600 font-medium">
              ⚠️ Budget exceeded! Reduce costs or increase debt.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Cost Breakdown */}
      <ProductCostBreakdown 
        rndBudget={decisions.rnd_budget}
        productionMix={{
          luxury_percentage: decisions.luxury_percentage,
          flagship_percentage: decisions.flagship_percentage,
          midtier_percentage: decisions.midtier_percentage,
          lowertier_percentage: decisions.lowertier_percentage
        }}
      />

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
              <div className="space-y-2">
                <Label>Units to Produce</Label>
                <Input
                  type="number"
                  value={decisions.units_produced}
                  onChange={(e) =>
                    updateDecision("units_produced", Number(e.target.value))
                  }
                  min="0"
                  className="max-w-md"
                />
              </div>

              <IntuitiveTierSlider
                label="Phone Tier Allocation (Total must be 100%)"
                segments={[
                  { name: "Luxury", value: decisions.luxury_percentage, color: "#8B5A2B" },
                  { name: "Flagship", value: decisions.flagship_percentage, color: "#1E40AF" },
                  { name: "Mid-tier", value: decisions.midtier_percentage, color: "#059669" },
                  { name: "Lower-tier", value: decisions.lowertier_percentage, color: "#DC2626" },
                ]}
                onChange={(segments) => {
                  setDecisions(prev => ({
                    ...prev,
                    luxury_percentage: segments[0].value,
                    flagship_percentage: segments[1].value,
                    midtier_percentage: segments[2].value,
                    lowertier_percentage: segments[3].value,
                  }));
                }}
              />
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              {marketAverages && (
                <Card className="bg-slate-50 border-slate-300 shadow-sm">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-sm mb-3 text-slate-800">Market Averages (vs Your Prices)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="text-center p-2 rounded-md bg-white border border-slate-200">
                        <div className="text-slate-600 mb-1">Luxury</div>
                        <div className="font-bold text-slate-900">₹{formatIndianNumber(Math.round(marketAverages.luxury_price))}</div>
                        <div className={`font-medium ${decisions.luxury_price > marketAverages.luxury_price ? 'text-orange-600' : 'text-blue-600'}`}>
                          {decisions.luxury_price > marketAverages.luxury_price ? '↑ Above Avg' : '↓ Below Avg'}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-md bg-white border border-slate-200">
                        <div className="text-slate-600 mb-1">Flagship</div>
                        <div className="font-bold text-slate-900">₹{formatIndianNumber(Math.round(marketAverages.flagship_price))}</div>
                        <div className={`font-medium ${decisions.flagship_price > marketAverages.flagship_price ? 'text-orange-600' : 'text-blue-600'}`}>
                          {decisions.flagship_price > marketAverages.flagship_price ? '↑ Above Avg' : '↓ Below Avg'}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-md bg-white border border-slate-200">
                        <div className="text-slate-600 mb-1">Mid-tier</div>
                        <div className="font-bold text-slate-900">₹{formatIndianNumber(Math.round(marketAverages.midtier_price))}</div>
                        <div className={`font-medium ${decisions.midtier_price > marketAverages.midtier_price ? 'text-orange-600' : 'text-blue-600'}`}>
                          {decisions.midtier_price > marketAverages.midtier_price ? '↑ Above Avg' : '↓ Below Avg'}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-md bg-white border border-slate-200">
                        <div className="text-slate-600 mb-1">Lower-tier</div>
                        <div className="font-bold text-slate-900">₹{formatIndianNumber(Math.round(marketAverages.lowertier_price))}</div>
                        <div className={`font-medium ${decisions.lowertier_price > marketAverages.lowertier_price ? 'text-orange-600' : 'text-blue-600'}`}>
                          {decisions.lowertier_price > marketAverages.lowertier_price ? '↑ Above Avg' : '↓ Below Avg'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
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
                    <Banknote className="h-4 w-4" />
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
            </TabsContent>

            <TabsContent value="markets" className="space-y-4 mt-4">
              {cities.length > 0 && (
                <PercentageSlider
                  label="Market Allocation by City (Total must be 100%)"
                  segments={cities.map((city, idx) => ({
                    name: city.city_name,
                    value: marketAllocations[city.city_name] || 0,
                    color: ["#1E40AF", "#059669", "#DC2626", "#F59E0B", "#8B5A2B", "#7C3AED", "#EC4899", "#10B981", "#F97316", "#6366F1", "#EF4444", "#84CC16"][idx % 12],
                  }))}
                  onChange={(segments) => {
                    const newAllocations: { [key: string]: number } = {};
                    segments.forEach((seg) => {
                      newAllocations[seg.name] = seg.value;
                    });
                    setMarketAllocations(newAllocations);
                  }}
                />
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                {cities.map((city) => (
                  <div key={city.id} className="text-sm">
                    <span className="font-medium">{city.city_name}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      Pop: {(city.population / 1000000).toFixed(1)}M
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="flex-1 h-12"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSubmitDecisions}
              disabled={saving}
              className="flex-1 h-12 shadow-glow"
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
