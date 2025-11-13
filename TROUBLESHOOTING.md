# Troubleshooting Guide - Strategic Manufacturing Game

## Issue: Quarters Not Advancing

### Symptoms
- "Advance Quarter" button doesn't work
- Quarter number stays the same
- No error messages in UI

### Root Causes & Solutions

#### 1. RLS Policies Not Set Correctly
**Check in Supabase SQL Editor:**
```sql
-- Verify all tables have SELECT, INSERT, UPDATE, DELETE policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected Result:** You should see 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

**Fix:** Run `supabase-setup-complete.sql` or `supabase-enable-realtime.sql`

#### 2. Realtime Not Enabled
**Check in Supabase Dashboard:**
1. Go to Database → Replication
2. Check if tables are listed under "supabase_realtime" publication

**Fix:** Run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE team_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE team_decisions;
```

#### 3. Missing Team Decisions
Quarters won't advance if teams haven't submitted decisions.

**Check:**
```sql
SELECT 
  t.team_name,
  d.quarter,
  d.created_at
FROM teams t
LEFT JOIN team_decisions d ON t.id = d.team_id AND d.quarter = 1  -- Change quarter number
WHERE t.game_id = 'YOUR_GAME_ID';
```

**Fix:** Each team must submit decisions before advancing quarter

#### 4. Check Browser Console
Open browser DevTools (F12) and look for:
- ❌ `Error advancing quarter`
- ❌ `Failed to invoke function`
- ❌ `RLS policy violation`
- ✅ `Quarter calculation result (Client-side)`

### Debug Steps

1. **Open Browser Console** (F12 → Console tab)
2. **Click "Advance Quarter"**
3. **Look for logs:**
   - Should see: "Starting quarter X calculations"
   - Should see: "Quarter calculations completed successfully"
   - If you see: "Edge Function failed, using client-side calculation" - that's OK!

4. **Check Network Tab:**
   - Look for failed requests
   - Check response errors

### Manual Quarter Advancement (Emergency)

If all else fails, you can manually advance the quarter:

```sql
-- Advance to next quarter
UPDATE games 
SET 
  current_quarter = current_quarter + 1,
  quarter_start_time = NOW()
WHERE id = 'YOUR_GAME_ID';
```

⚠️ **Warning:** This skips the quarter calculations! Only use for testing.

## Issue: Stock Graph Not Syncing

### Symptoms
- Graph doesn't update when teams change
- Need to refresh page to see changes

### Solutions

1. **Enable Realtime (see above)**

2. **Check Subscription Status:**
   Open console and look for:
   ```
   Stock chart subscription status: SUBSCRIBED
   ```

3. **Verify Browser Tab:**
   - Realtime doesn't work in background tabs
   - Keep tab active and visible

## Issue: UI Readability Problems

### Fixed Elements
- ✅ Dark background with better contrast
- ✅ White text on dark cards
- ✅ Colorful product cost cards
- ✅ High-contrast buttons

### If Still Having Issues
Check your browser zoom level (should be 100%)

## Product Cost Per Unit - Reference

### Base Costs (Before R&D):
- **Luxury:** ₹80,000
- **Flagship:** ₹35,000
- **Mid-tier:** ₹15,000
- **Lower-tier:** ₹6,000

### R&D Impact:
- Every ₹5M in R&D = 30% cost reduction
- Formula: `Actual Cost = Base Cost × (1 - min(0.3, R&D / 5,000,000 × 0.3))`

### Example:
With ₹2.5M R&D budget:
- Reduction: 15%
- Luxury: ₹68,000
- Flagship: ₹29,750
- Mid-tier: ₹12,750
- Lower-tier: ₹5,100

## Testing Checklist

Before starting a game:

- [ ] Run `supabase-setup-complete.sql`
- [ ] Run `supabase-enable-realtime.sql`
- [ ] Verify RLS policies exist (see SQL above)
- [ ] Check Realtime is enabled
- [ ] Open browser console
- [ ] Create a test game
- [ ] Join with 2+ teams
- [ ] Submit decisions for all teams
- [ ] Try advancing quarter
- [ ] Check console for "Quarter calculations completed"

## Getting Help

If issues persist:

1. **Export console logs:**
   - Right-click in console → Save as...

2. **Check Supabase logs:**
   - Dashboard → Logs → All logs

3. **Verify database state:**
```sql
-- Check game status
SELECT * FROM games WHERE id = 'YOUR_GAME_ID';

-- Check teams
SELECT * FROM teams WHERE game_id = 'YOUR_GAME_ID';

-- Check decisions
SELECT 
  t.team_name,
  COUNT(d.id) as decisions_count
FROM teams t
LEFT JOIN team_decisions d ON t.id = d.team_id
WHERE t.game_id = 'YOUR_GAME_ID'
GROUP BY t.team_name;
```
