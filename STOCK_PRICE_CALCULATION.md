# Stock Price Calculation Documentation

## Overview
Stock prices in Strategic Manufacturing are dynamically calculated at the end of each quarter based on team performance metrics. The calculation reflects both profitability and customer satisfaction.

## Formula

```
New Stock Price = Previous Stock Price × Profit Factor × Customer Satisfaction Factor
```

With a minimum floor of ₹10 per share to prevent negative or zero stock prices.

## Components

### 1. Profit Factor
```
Profit Factor = 1 + (Profit / ₹1,00,00,000)
```

**Explanation:**
- **Profit** is the team's profit for the current quarter (in rupees)
- The profit is scaled by dividing by ₹1 crore (10 million rupees)
- This scaling means:
  - A profit of ₹1 crore increases stock price by 100% (factor of 2.0)
  - A profit of ₹50 lakhs increases stock price by 50% (factor of 1.5)
  - A profit of ₹0 keeps the stock price unchanged (factor of 1.0)
  - A loss of ₹50 lakhs decreases stock price by 50% (factor of 0.5)

**Example:**
- If profit = ₹30,00,000 (₹30 lakhs)
- Profit Factor = 1 + (30,00,000 / 1,00,00,000) = 1 + 0.3 = 1.3

### 2. Customer Satisfaction Factor
```
Customer Satisfaction Factor = Customer Satisfaction / 100
```

**Explanation:**
- **Customer Satisfaction** is a percentage value (0-100)
- This is divided by 100 to convert to a decimal multiplier
- Teams start at 100% satisfaction and must maintain it through good decisions
- Examples:
  - 100% satisfaction = factor of 1.0 (no penalty)
  - 80% satisfaction = factor of 0.8 (20% reduction)
  - 50% satisfaction = factor of 0.5 (50% reduction)

### 3. Minimum Stock Price
```
Final Stock Price = max(₹10, Calculated Stock Price)
```

The stock price is never allowed to fall below ₹10 to maintain market liquidity.

## Complete Calculation Example

### Initial Conditions (Quarter 1)
- **Previous Stock Price:** ₹100
- **Quarter Profit:** ₹50,00,000 (₹50 lakhs)
- **Customer Satisfaction:** 100% (starting value)

### Step-by-Step Calculation

1. **Calculate Profit Factor:**
   ```
   Profit Factor = 1 + (50,00,000 / 1,00,00,000)
                 = 1 + 0.5
                 = 1.5
   ```

2. **Calculate Customer Satisfaction Factor:**
   ```
   Customer Satisfaction Factor = 100 / 100
                                = 1.0
   ```

3. **Calculate New Stock Price:**
   ```
   New Stock Price = 100 × 1.5 × 1.0
                   = 100 × 1.5
                   = ₹150.00
   ```

4. **Apply Minimum Floor:**
   ```
   Final Stock Price = max(₹10, ₹150.00)
                     = ₹150.00
   ```

**Result:** With ₹50 lakhs profit and perfect satisfaction, stock price increases by 50% to ₹150!

## Key Insights

### Positive Impact Scenarios
1. **High Profit + Perfect Satisfaction:** Maximum stock price growth
   - Example: ₹1 crore profit + 100% satisfaction = 2.0 × 1.0 = 2.0× multiplier (stock doubles!)

2. **Moderate Profit + High Satisfaction:** Good growth
   - Example: ₹50 lakhs profit + 90% satisfaction = 1.5 × 0.9 = 1.35× multiplier

3. **Small Profit + Perfect Satisfaction:** Modest growth
   - Example: ₹20 lakhs profit + 100% satisfaction = 1.2 × 1.0 = 1.2× multiplier

### Negative Impact Scenarios
1. **Loss + Low Satisfaction:** Severe stock price drop
   - Example: -₹30 lakhs loss + 40% satisfaction = 0.7 × 0.4 = 0.28× multiplier (72% drop!)

2. **Profit + Poor Satisfaction:** Satisfaction drags down gains
   - Example: ₹50 lakhs profit + 50% satisfaction = 1.5 × 0.5 = 0.75× multiplier (25% drop despite profit!)

3. **Break-even + Low Satisfaction:** Stock decline
   - Example: ₹0 profit + 70% satisfaction = 1.0 × 0.7 = 0.7× multiplier (30% drop)

## Implementation Location

### Client-Side (Browser)
- **File:** `src/lib/quarterCalculations.ts`
- **Lines:** 241-243

```typescript
const profitFactor = 1 + (profit / 10000000);
const stockPrice = team.stock_price * profitFactor * (customerSatisfaction / 100);
```

### Server-Side (Edge Function)
- **File:** `supabase/functions/calculate-quarter-results/index.ts`
- **Lines:** 269-270

```typescript
const profitFactor = 1 + (profit / 10000000) // Profit in crores
const stockPrice = team.stock_price * profitFactor * (customerSatisfaction / 100)
```

Both implementations use identical logic to ensure consistency.

## Strategic Implications

1. **Balanced Growth Required:** Teams need both profitability AND customer satisfaction for optimal stock performance
2. **Customer Satisfaction is Critical:** Even profitable teams will see stock decline if satisfaction drops below ~67%
3. **Starting Advantage:** Teams begin at 100% satisfaction - maintain it through R&D, marketing, and meeting demand
4. **Loss Protection:** The ₹10 minimum prevents complete stock value collapse
5. **Exponential Growth Potential:** Consistent high performance leads to compounding stock price increases
6. **Break-Even is Not Safe:** Zero profit at 100% satisfaction maintains stock, but any satisfaction loss causes decline

## Initial Values

- **Starting Stock Price:** ₹100
- **Starting Customer Satisfaction:** 100%
- **Starting Employee Productivity:** 100%
- Teams must invest in R&D, marketing, and employee welfare to maintain these levels

## Related Metrics

The stock price calculation depends on:
- **Profit:** Calculated from revenue minus all costs (production, marketing, R&D, employee, distribution, inventory holding)
- **Customer Satisfaction:** Influenced by R&D investment, marketing spend, and demand satisfaction rate
