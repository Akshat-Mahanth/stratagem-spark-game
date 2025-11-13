import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CityData {
  city_name: string
  population: number
  luxury_demand_percentage: number
  flagship_demand_percentage: number
  midtier_demand_percentage: number
  lowertier_demand_percentage: number
  average_purchasing_power: number
  base_distribution_cost: number
  base_labor_cost: number
  base_land_cost: number
}

interface TeamDecision {
  team_id: string
  units_produced: number
  cost_per_unit: number
  luxury_percentage: number
  flagship_percentage: number
  midtier_percentage: number
  lowertier_percentage: number
  luxury_price: number
  flagship_price: number
  midtier_price: number
  lowertier_price: number
  marketing_budget: number
  rnd_budget: number
  employee_budget: number
  new_debt: number
  debt_repayment: number
}

interface MarketAllocation {
  city: string
  allocation_percentage: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gameId, quarter } = await req.json()

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all teams
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .eq('game_id', gameId)

    if (!teams || teams.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No teams found for this game' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Processing quarter ${quarter} for ${teams.length} teams`)

    // Fetch all city data
    const { data: cities } = await supabase
      .from('city_data')
      .select('*')

    // Fetch all team decisions for this quarter
    const { data: decisions } = await supabase
      .from('team_decisions')
      .select('*')
      .eq('quarter', quarter)
      .in('team_id', teams.map(t => t.id))

    console.log(`Found ${decisions?.length || 0} decisions for quarter ${quarter}`)

    // Fetch market allocations
    const { data: allocations } = await supabase
      .from('market_allocations')
      .select('*')
      .in('decision_id', (decisions || []).map(d => d.id))

    console.log(`Found ${allocations?.length || 0} market allocations`)

    // Calculate results for each team
    const metricsToInsert = []
    const teamUpdates = []

    let totalMarketDemand = 0
    let totalUnitsSold = 0

    for (const team of teams) {
      const decision = decisions?.find(d => d.team_id === team.id)
      
      // Fetch previous quarter metrics for satisfaction and productivity
      const { data: prevMetrics } = await supabase
        .from('team_metrics')
        .select('customer_satisfaction, employee_productivity')
        .eq('team_id', team.id)
        .eq('quarter', quarter - 1)
        .maybeSingle()
      
      const previousSatisfaction = prevMetrics?.customer_satisfaction || 100
      const previousProductivity = prevMetrics?.employee_productivity || 100
      
      if (!decision) {
        // If no decision submitted, carry forward previous state
        metricsToInsert.push({
          team_id: team.id,
          quarter,
          revenue: 0,
          profit: 0,
          cash_flow: -team.total_debt * 0.02, // Interest payment
          roi: 0,
          customer_satisfaction: Math.max(0, previousSatisfaction - 10), // Decay
          employee_productivity: Math.max(0, previousProductivity - 10), // Decay
          market_share: team.market_share,
          units_sold: 0,
          inventory_remaining: 0,
          distribution_cost: 0,
          inventory_holding_cost: 0,
          demand_satisfaction_rate: 0
        })
        continue
      }

      const teamAllocations = allocations?.filter(a => 
        decisions?.find(d => d.id === a.decision_id && d.team_id === team.id)
      ) || []

      // Calculate production breakdown
      const luxuryUnits = Math.floor(decision.units_produced * decision.luxury_percentage / 100)
      const flagshipUnits = Math.floor(decision.units_produced * decision.flagship_percentage / 100)
      const midtierUnits = Math.floor(decision.units_produced * decision.midtier_percentage / 100)
      const lowertierUnits = Math.floor(decision.units_produced * decision.lowertier_percentage / 100)

      // Calculate potential revenue by segment and city
      let totalRevenue = 0
      let totalUnitsSoldTeam = 0
      let totalDistributionCost = 0
      let demandSatisfactionSum = 0
      let demandCount = 0

      for (const allocation of teamAllocations) {
        const city = cities?.find(c => c.city_name === allocation.city)
        if (!city) continue

        const allocPercentage = allocation.allocation_percentage / 100
        
        // Calculate demand for each segment in this city
        const cityPopulation = city.population
        const marketingBoost = 1 + (decision.marketing_budget / 5000000) * 0.2 // Up to 20% boost
        
        // Luxury segment
        const luxuryDemand = cityPopulation * (city.luxury_demand_percentage / 100) * marketingBoost
        const luxurySupply = luxuryUnits * allocPercentage
        const luxurySold = Math.min(luxuryDemand, luxurySupply)
        const luxuryRevenue = luxurySold * decision.luxury_price
        
        // Flagship segment
        const flagshipDemand = cityPopulation * (city.flagship_demand_percentage / 100) * marketingBoost
        const flagshipSupply = flagshipUnits * allocPercentage
        const flagshipSold = Math.min(flagshipDemand, flagshipSupply)
        const flagshipRevenue = flagshipSold * decision.flagship_price
        
        // Mid-tier segment
        const midtierDemand = cityPopulation * (city.midtier_demand_percentage / 100) * marketingBoost
        const midtierSupply = midtierUnits * allocPercentage
        const midtierSold = Math.min(midtierDemand, midtierSupply)
        const midtierRevenue = midtierSold * decision.midtier_price
        
        // Lower-tier segment
        const lowertierDemand = cityPopulation * (city.lowertier_demand_percentage / 100) * marketingBoost
        const lowertierSupply = lowertierUnits * allocPercentage
        const lowertierSold = Math.min(lowertierDemand, lowertierSupply)
        const lowertierRevenue = lowertierSold * decision.lowertier_price

        const cityUnitsSold = luxurySold + flagshipSold + midtierSold + lowertierSold
        const cityUnitsSupplied = luxurySupply + flagshipSupply + midtierSupply + lowertierSupply
        const cityDemand = luxuryDemand + flagshipDemand + midtierDemand + lowertierDemand
        
        totalRevenue += luxuryRevenue + flagshipRevenue + midtierRevenue + lowertierRevenue
        totalUnitsSoldTeam += cityUnitsSold
        
        // Distribution cost
        const distCost = city.base_distribution_cost * cityUnitsSupplied
        totalDistributionCost += distCost

        // Demand satisfaction for this city
        if (cityDemand > 0) {
          demandSatisfactionSum += (cityUnitsSold / cityDemand) * 100
          demandCount++
        }
      }

      const demandSatisfactionRate = demandCount > 0 ? demandSatisfactionSum / demandCount : 0

      // Calculate costs
      const productionCost = decision.units_produced * decision.cost_per_unit
      const totalCosts = productionCost + decision.marketing_budget + decision.rnd_budget + 
                        decision.employee_budget + totalDistributionCost

      const inventoryRemaining = decision.units_produced - totalUnitsSoldTeam
      const inventoryHoldingCost = inventoryRemaining * decision.cost_per_unit * 0.05 // 5% holding cost

      // Calculate profit
      const profit = totalRevenue - totalCosts - inventoryHoldingCost

      // Calculate customer satisfaction (influenced by R&D and Marketing)
      const rndImpact = Math.min(20, (decision.rnd_budget / 250000)) // Every 250k gives 1 point, max 20
      const marketingImpact = Math.min(15, (decision.marketing_budget / 500000)) // Every 500k gives 1 point, max 15
      const demandSatisfactionImpact = (demandSatisfactionRate - 50) * 0.2 // Demand satisfaction affects customer satisfaction
      
      const customerSatisfaction = Math.min(100, Math.max(0, 
        previousSatisfaction + 
        rndImpact * 0.5 + 
        marketingImpact * 0.7 + 
        demandSatisfactionImpact - 
        2 // Natural decay
      ))

      // Calculate employee productivity (influenced by employee budget)
      const employeeImpact = Math.min(20, (decision.employee_budget / 250000))
      const employeeProductivity = Math.min(100, previousProductivity + employeeImpact * 0.5)

      // Calculate cash flow
      const interestPayment = (team.total_debt + decision.new_debt) * 0.02 // 2% interest per quarter
      const cashFlow = profit + decision.new_debt - decision.debt_repayment - interestPayment

      // Calculate ROI
      const totalInvestment = decision.marketing_budget + decision.rnd_budget + decision.employee_budget
      const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0

      totalMarketDemand += totalUnitsSoldTeam
      totalUnitsSold += totalUnitsSoldTeam

      metricsToInsert.push({
        team_id: team.id,
        quarter,
        revenue: totalRevenue,
        profit,
        cash_flow: cashFlow,
        roi,
        customer_satisfaction: customerSatisfaction,
        employee_productivity: employeeProductivity,
        market_share: 0, // Will calculate after all teams
        units_sold: totalUnitsSoldTeam,
        inventory_remaining: inventoryRemaining,
        distribution_cost: totalDistributionCost,
        inventory_holding_cost: inventoryHoldingCost,
        demand_satisfaction_rate: demandSatisfactionRate
      })

      // Calculate new capital and debt
      const newCapital = team.current_capital + cashFlow
      const newDebt = Math.max(0, team.total_debt + decision.new_debt - decision.debt_repayment)
      const newTotalProfit = team.total_profit + profit

      // Calculate stock price (influenced by profit and market share)
      const profitFactor = 1 + (profit / 10000000) // Profit in crores
      const stockPrice = team.stock_price * profitFactor * (customerSatisfaction / 100)

      teamUpdates.push({
        id: team.id,
        current_capital: newCapital,
        total_debt: newDebt,
        total_profit: newTotalProfit,
        stock_price: Math.max(10, stockPrice),
        market_share: 0 // Will be calculated below
      })
    }

    // Calculate market share for each team
    for (const metric of metricsToInsert) {
      metric.market_share = totalUnitsSold > 0 ? (metric.units_sold / totalUnitsSold) * 100 : 0
    }

    // Update market share in team updates
    for (const update of teamUpdates) {
      const metric = metricsToInsert.find(m => m.team_id === update.id)
      update.market_share = metric?.market_share || 0
    }

    // Insert metrics
    const { error: metricsError } = await supabase.from('team_metrics').insert(metricsToInsert)
    if (metricsError) {
      console.error('Error inserting metrics:', metricsError)
      throw new Error(`Failed to insert metrics: ${metricsError.message}`)
    }

    // Update teams
    for (const update of teamUpdates) {
      const { error: updateError } = await supabase.from('teams').update(update).eq('id', update.id)
      if (updateError) {
        console.error('Error updating team:', updateError)
        throw new Error(`Failed to update team: ${updateError.message}`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, teamsProcessed: teams.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
