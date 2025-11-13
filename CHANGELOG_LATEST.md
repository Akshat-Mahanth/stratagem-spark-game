# Latest Changes - Nov 10, 2025

## Issues Fixed

### 1. ✅ Mumbai/Delhi showing instead of F1 racetrack names
**Problem:** Old city names (Mumbai, Delhi, Bangalore) were in `supabase-setup-complete.sql`  
**Solution:** Updated city data to match F1 racetracks (Yas Marina, Monaco, Shanghai International, Singapore, Silverstone, Spa, Monza, Zandvoort, Imola, Baku, Sochi, Buddh International)

**Files Changed:**
- `supabase-setup-complete.sql` - Updated INSERT statements with F1 track names

**Note:** The migration file already had the correct names. If you're seeing old names in your database, you need to either:
1. Run a fresh migration, OR
2. Manually update the city_data table in Supabase

### 2. ✅ Timer auto-forward removed
**Problem:** Timer was automatically advancing quarters, not giving teams control  
**Solution:** Timer is now just a visual indicator - quarters only advance when host manually clicks "Advance Quarter"

**Files Changed:**
- `src/components/game/QuarterTimer.tsx`
  - Removed auto-advance functionality
  - Removed unused imports (supabase, toast)
  - Removed `isProcessing` state
  - Removed `handleAutoAdvance()` function

**Behavior:** Timer counts down to 0:00 and stays there. Host must click button to advance.

### 3. ✅ Stock price now increases with Q1 profit
**Problem:** Starting at 50% satisfaction meant even with profit, stock would drop (e.g., 1.5x profit × 0.5x satisfaction = 0.75x = 25% drop)  
**Solution:** Changed initial satisfaction and productivity from 50% to 100%

**Files Changed:**
- `src/lib/quarterCalculations.ts` - Changed defaults from 50 to 100
- `supabase/functions/calculate-quarter-results/index.ts` - Changed defaults from 50 to 100
- `supabase-setup-complete.sql` - Updated DEFAULT values to 100
- `supabase/migrations/20251106213311_e3f32bd0-11f4-428a-93d6-9f5120d48f5c.sql` - Updated DEFAULT values to 100

**New Behavior:**
- Teams start with 100% customer satisfaction
- Teams start with 100% employee productivity
- Q1 profit now properly increases stock price!
- Example: ₹50L profit at 100% satisfaction = ₹100 × 1.5 × 1.0 = ₹150 (50% increase! 🎉)

**Strategic Impact:**
- Teams must maintain satisfaction through R&D and marketing investment
- No decision penalty increased from -5 to -10 (since starting at 100 instead of 50)

### 4. ✅ Documentation updated
**File:** `STOCK_PRICE_CALCULATION.md`
- Updated examples to show 100% starting satisfaction
- Added clearer scenarios showing why maintaining satisfaction is critical
- Added "Initial Values" section
- Updated strategic implications

## Database Migration Needed

If you have existing data in Supabase, you may need to update it:

```sql
-- Update existing team_metrics to use 100% satisfaction if they have 0 or low values
UPDATE team_metrics 
SET customer_satisfaction = 100, 
    employee_productivity = 100 
WHERE customer_satisfaction < 50;

-- Update city names if needed
-- First, check what's in your database:
SELECT city_name FROM city_data ORDER BY city_name;

-- If you see Mumbai/Delhi instead of F1 tracks, you need to delete and re-insert:
DELETE FROM city_data;
-- Then run the INSERT statements from the migration file or supabase-setup-complete.sql
```

## Testing Checklist

- [ ] Create a new game and verify timer counts down but doesn't auto-advance
- [ ] Verify market allocations show F1 track names (Yas Marina, Monaco, etc.)
- [ ] Play Q1, make profit, verify stock price goes UP not DOWN
- [ ] Check that customer satisfaction starts at 100%
- [ ] Verify host must manually click to advance quarters

## Stock Price Examples

**Before (50% starting satisfaction):**
- Q1: ₹50L profit → ₹100 × 1.5 × 0.5 = ₹75 (25% DROP! 😞)

**After (100% starting satisfaction):**
- Q1: ₹50L profit → ₹100 × 1.5 × 1.0 = ₹150 (50% INCREASE! 🎉)

This makes the game much more intuitive and rewarding for good Q1 performance!
