# Market Simulation & Economics Logic

## Market Reaction to Pricing

### Price Elasticity Model
The market reacts to pricing through a sophisticated demand elasticity model:

1. **City-Specific Demographics**: Each of the 12 cities has unique characteristics:
   - Population size
   - Luxury demand percentage (affluent customers)
   - Flagship demand percentage (premium customers)
   - Mid-tier demand percentage (middle-class customers)
   - Lower-tier demand percentage (budget customers)
   - Base distribution cost

2. **Price Sensitivity by Tier**:
   - **Luxury Segment**: Low price elasticity (wealthy customers less sensitive)
   - **Flagship Segment**: Moderate price elasticity
   - **Mid-tier Segment**: High price elasticity (price-conscious middle class)
   - **Lower-tier Segment**: Very high price elasticity (budget-sensitive)

3. **Marketing Impact**: 
   - Marketing budget increases demand by up to 20%
   - Formula: `marketingBoost = 1 + (marketing_budget / 5,000,000) * 0.2`
   - Every ₹50L in marketing = +2% demand boost

### Demand Calculation
For each city and tier:
```
actualDemand = cityPopulation × tierDemandPercentage × marketingBoost × priceElasticity
```

Where priceElasticity adjusts based on your price vs. market average.

## Stock Price Movement

### Multi-Factor Stock Pricing Model

Stock prices are calculated using a comprehensive model that considers:

1. **Profit Impact** (40% weight):
   - `profitFactor = 1 + (quarterlyProfit / 10,000,000)`
   - Positive profits increase stock price, losses decrease it

2. **Customer Satisfaction** (25% weight):
   - Ranges from 0-100%
   - Influenced by R&D investment, marketing, and demand satisfaction
   - `satisfactionMultiplier = customerSatisfaction / 100`

3. **Market Share** (20% weight):
   - Higher market share = premium valuation
   - Calculated as: `(unitsSold / totalMarketUnitsSold) × 100`

4. **ROI Performance** (15% weight):
   - Return on Investment from marketing, R&D, and employee investments
   - `ROI = (profit / totalInvestments) × 100`

### Stock Price Formula
```
newStockPrice = previousPrice × profitFactor × satisfactionMultiplier × (1 + marketShareBonus + roiBonus)
```

Minimum stock price is ₹10 to prevent negative values.

## Economic Realism

### Cost Structure
- **Luxury phones**: ₹80,000 base cost (premium materials, advanced features)
- **Flagship phones**: ₹35,000 base cost (high-end components)
- **Mid-tier phones**: ₹15,000 base cost (balanced features)
- **Lower-tier phones**: ₹6,000 base cost (basic functionality)

### R&D Impact
- Every ₹50L investment reduces costs by 3% (up to 30% maximum)
- Reflects economies of scale and process improvements

### Marketing Economics
- Increases demand through brand awareness and preference
- Diminishing returns: first ₹50L more effective than subsequent investments
- Also improves customer satisfaction (brand loyalty)

### Employee Productivity
- Higher employee budgets improve operational efficiency
- Affects production quality and customer service
- Formula: `productivity = previous + (employeeBudget / 250,000) × 0.5`

### Interest and Debt
- 2% quarterly interest on all debt (8% annual)
- Reflects corporate lending rates
- Debt ceiling prevents excessive leverage

### Inventory Costs
- 5% quarterly holding cost on unsold inventory
- Reflects storage, insurance, and obsolescence costs

## City Market Dynamics

Each city represents different market conditions:
- **Mumbai/Delhi**: High luxury demand, expensive distribution
- **Bangalore/Chennai**: Tech-savvy, flagship preference
- **Kolkata/Hyderabad**: Balanced demand across tiers
- **Pune/Ahmedabad**: Growing mid-tier markets
- **Jaipur/Lucknow**: Price-sensitive, lower-tier focus
- **Kochi/Chandigarh**: Emerging markets with mixed demand

## Competitive Dynamics

### Market Share Calculation
Teams compete for finite demand in each city. If total supply exceeds demand:
- Higher-priced products sell first (premium positioning)
- Marketing investment provides competitive advantage
- Customer satisfaction affects brand preference

### Price Wars
- Aggressive pricing can capture market share but reduces profitability
- Below-cost pricing leads to losses but may drive competitors out
- Market reacts to sustained price differences

## Strategic Implications

1. **Premium Strategy**: High prices, high margins, luxury focus
2. **Volume Strategy**: Competitive prices, market share focus
3. **Balanced Strategy**: Mid-tier focus with reasonable margins
4. **Innovation Strategy**: Heavy R&D investment for cost advantages

The simulation creates realistic trade-offs between profitability, market share, and long-term sustainability, mirroring real smartphone market dynamics.
