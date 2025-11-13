import { supabase } from "@/integrations/supabase/client";

interface CityData {
  city_name: string;
  population: number;
  luxury_demand_percentage: number;
  flagship_demand_percentage: number;
  midtier_demand_percentage: number;
  lowertier_demand_percentage: number;
  average_purchasing_power: number;
  base_distribution_cost: number;
  base_labor_cost: number;
  base_land_cost: number;
}

/**
 * Client-side quarter calculation fallback
 * This runs in the browser when Edge Functions are not available
 */
export async function calculateQuarterResults(gameId: string, quarter: number) {
  try {
    console.log(`Starting quarter ${quarter} calculations for game ${gameId}`);

    // Fetch all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('game_id', gameId);

    if (teamsError) throw teamsError;
    if (!teams || teams.length === 0) {
      throw new Error('No teams found for this game');
    }

    console.log(`Processing ${teams.length} teams`);

    // Fetch all city data
    const { data: cities, error: citiesError } = await supabase
      .from('city_data')
      .select('*');

    if (citiesError) throw citiesError;

    // Fetch all team decisions for this quarter
    const { data: decisions, error: decisionsError } = await supabase
      .from('team_decisions')
      .select('*')
      .eq('quarter', quarter)
      .in('team_id', teams.map(t => t.id));

    if (decisionsError) throw decisionsError;

    console.log(`Found ${decisions?.length || 0} decisions for quarter ${quarter}`);

    // Fetch market allocations
    const decisionIds = (decisions || []).map(d => d.id);
    let allocations: any[] = [];
    
    if (decisionIds.length > 0) {
      const { data: allocData, error: allocError } = await supabase
        .from('market_allocations')
        .select('*')
        .in('decision_id', decisionIds);

      if (allocError) throw allocError;
      allocations = allocData || [];
    }

    console.log(`Found ${allocations.length} market allocations`);

    // Calculate results for each team
    const metricsToInsert = [];
    const teamUpdates = [];

    let totalUnitsSold = 0;

    for (const team of teams) {
      const decision = decisions?.find(d => d.team_id === team.id);
      
      // Fetch previous quarter metrics
      const { data: prevMetrics } = await supabase
        .from('team_metrics')
        .select('customer_satisfaction, employee_productivity')
        .eq('team_id', team.id)
        .eq('quarter', quarter - 1)
        .maybeSingle();
      
      const previousSatisfaction = prevMetrics?.customer_satisfaction || 100;
      const previousProductivity = prevMetrics?.employee_productivity || 100;
      
      if (!decision) {
        // If no decision submitted, carry forward previous state with penalties
        metricsToInsert.push({
          team_id: team.id,
          quarter,
          revenue: 0,
          profit: 0,
          cash_flow: -team.total_debt * 0.02, // Interest payment
          roi: 0,
          customer_satisfaction: Math.max(0, previousSatisfaction - 10),
          employee_productivity: Math.max(0, previousProductivity - 10),
          market_share: team.market_share,
          units_sold: 0,
          inventory_remaining: 0,
          distribution_cost: 0,
          inventory_holding_cost: 0,
          demand_satisfaction_rate: 0
        });
        
        teamUpdates.push({
          id: team.id,
          current_capital: team.current_capital - (team.total_debt * 0.02),
          total_debt: team.total_debt,
          total_profit: team.total_profit,
          stock_price: Math.max(10, team.stock_price * 0.95),
          market_share: team.market_share
        });
        
        continue;
      }

      const teamAllocations = allocations.filter(a => 
        decisions?.find(d => d.id === a.decision_id && d.team_id === team.id)
      );

      // Calculate production breakdown
      const luxuryUnits = Math.floor(decision.units_produced * decision.luxury_percentage / 100);
      const flagshipUnits = Math.floor(decision.units_produced * decision.flagship_percentage / 100);
      const midtierUnits = Math.floor(decision.units_produced * decision.midtier_percentage / 100);
      const lowertierUnits = Math.floor(decision.units_produced * decision.lowertier_percentage / 100);

      // Calculate revenue and costs
      let totalRevenue = 0;
      let totalUnitsSoldTeam = 0;
      let totalDistributionCost = 0;
      let demandSatisfactionSum = 0;
      let demandCount = 0;

      for (const allocation of teamAllocations) {
        const city = cities?.find(c => c.city_name === allocation.city);
        if (!city) continue;

        const allocPercentage = allocation.allocation_percentage / 100;
        const cityPopulation = city.population;
        const marketingBoost = 1 + (decision.marketing_budget / 5000000) * 0.2;
        
        // Calculate demand and sales for each segment
        const segments = [
          { demand: city.luxury_demand_percentage, supply: luxuryUnits, price: decision.luxury_price },
          { demand: city.flagship_demand_percentage, supply: flagshipUnits, price: decision.flagship_price },
          { demand: city.midtier_demand_percentage, supply: midtierUnits, price: decision.midtier_price },
          { demand: city.lowertier_demand_percentage, supply: lowertierUnits, price: decision.lowertier_price }
        ];

        let cityUnitsSold = 0;
        let cityUnitsSupplied = 0;
        let cityDemand = 0;

        for (const segment of segments) {
          const segmentDemand = cityPopulation * (segment.demand / 100) * marketingBoost;
          const segmentSupply = segment.supply * allocPercentage;
          const segmentSold = Math.min(segmentDemand, segmentSupply);
          
          totalRevenue += segmentSold * segment.price;
          cityUnitsSold += segmentSold;
          cityUnitsSupplied += segmentSupply;
          cityDemand += segmentDemand;
        }

        totalUnitsSoldTeam += cityUnitsSold;
        totalDistributionCost += city.base_distribution_cost * cityUnitsSupplied;

        if (cityDemand > 0) {
          demandSatisfactionSum += (cityUnitsSold / cityDemand) * 100;
          demandCount++;
        }
      }

      const demandSatisfactionRate = demandCount > 0 ? demandSatisfactionSum / demandCount : 0;

      // Calculate costs
      const productionCost = decision.units_produced * decision.cost_per_unit;
      const totalCosts = productionCost + decision.marketing_budget + decision.rnd_budget + 
                        decision.employee_budget + totalDistributionCost;

      const inventoryRemaining = decision.units_produced - totalUnitsSoldTeam;
      const inventoryHoldingCost = inventoryRemaining * decision.cost_per_unit * 0.05;

      // Calculate profit
      const profit = totalRevenue - totalCosts - inventoryHoldingCost;

      // Calculate customer satisfaction
      const rndImpact = Math.min(20, (decision.rnd_budget / 250000));
      const marketingImpact = Math.min(15, (decision.marketing_budget / 500000));
      const demandSatisfactionImpact = (demandSatisfactionRate - 50) * 0.2;
      
      const customerSatisfaction = Math.min(100, Math.max(0, 
        previousSatisfaction + 
        rndImpact * 0.5 + 
        marketingImpact * 0.7 + 
        demandSatisfactionImpact - 
        2
      ));

      // Calculate employee productivity
      const employeeImpact = Math.min(20, (decision.employee_budget / 250000));
      const employeeProductivity = Math.min(100, Math.max(0, previousProductivity + employeeImpact * 0.5 - 1));

      // Calculate cash flow
      const interestPayment = (team.total_debt + decision.new_debt) * 0.02;
      const cashFlow = profit + decision.new_debt - decision.debt_repayment - interestPayment;

      // Calculate ROI
      const totalInvestment = decision.marketing_budget + decision.rnd_budget + decision.employee_budget;
      const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

      totalUnitsSold += totalUnitsSoldTeam;

      metricsToInsert.push({
        team_id: team.id,
        quarter,
        revenue: Math.round(totalRevenue),
        profit: Math.round(profit),
        cash_flow: Math.round(cashFlow),
        roi: Math.round(roi * 100) / 100,
        customer_satisfaction: Math.round(customerSatisfaction * 100) / 100,
        employee_productivity: Math.round(employeeProductivity * 100) / 100,
        market_share: 0, // Will calculate after all teams
        units_sold: Math.round(totalUnitsSoldTeam),
        inventory_remaining: inventoryRemaining,
        distribution_cost: Math.round(totalDistributionCost),
        inventory_holding_cost: Math.round(inventoryHoldingCost),
        demand_satisfaction_rate: Math.round(demandSatisfactionRate * 100) / 100
      });

      // Calculate new capital and debt
      const newCapital = team.current_capital + cashFlow;
      const newDebt = Math.max(0, team.total_debt + decision.new_debt - decision.debt_repayment);
      const newTotalProfit = team.total_profit + profit;

      // Calculate stock price
      const profitFactor = 1 + (profit / 10000000);
      const stockPrice = team.stock_price * profitFactor * (customerSatisfaction / 100);

      teamUpdates.push({
        id: team.id,
        current_capital: Math.round(newCapital),
        total_debt: Math.round(newDebt),
        total_profit: Math.round(newTotalProfit),
        stock_price: Math.max(10, Math.round(stockPrice * 100) / 100),
        market_share: 0 // Will be calculated below
      });
    }

    // Calculate market share for each team
    for (const metric of metricsToInsert) {
      metric.market_share = totalUnitsSold > 0 
        ? Math.round((metric.units_sold / totalUnitsSold) * 10000) / 100 
        : 0;
    }

    // Update market share in team updates
    for (const update of teamUpdates) {
      const metric = metricsToInsert.find(m => m.team_id === update.id);
      update.market_share = metric?.market_share || 0;
    }

    console.log('Inserting metrics:', metricsToInsert.length);

    // Insert metrics
    const { error: metricsError } = await supabase
      .from('team_metrics')
      .insert(metricsToInsert);

    if (metricsError) {
      console.error('Error inserting metrics:', metricsError);
      throw new Error(`Failed to insert metrics: ${metricsError.message}`);
    }

    console.log('Updating teams:', teamUpdates.length);

    // Update teams
    for (const update of teamUpdates) {
      const { error: updateError } = await supabase
        .from('teams')
        .update(update)
        .eq('id', update.id);

      if (updateError) {
        console.error('Error updating team:', updateError);
        throw new Error(`Failed to update team: ${updateError.message}`);
      }
    }

    console.log('Quarter calculations completed successfully');

    return { success: true, teamsProcessed: teams.length };
  } catch (error) {
    console.error('Error in calculateQuarterResults:', error);
    throw error;
  }
}
