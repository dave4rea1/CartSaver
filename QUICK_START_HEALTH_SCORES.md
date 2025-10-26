# Quick Start: Testing Health Scores

## TL;DR - Fix Applied ✅

The "undefined%" error has been fixed! Run these commands to see it in action:

```bash
# 1. Reseed database (if not done already)
cd backend
npm run seed

# 2. Start backend
npm run dev

# 3. In another terminal, start frontend
cd frontend
npm start

# 4. Open browser to http://localhost:3000/dashboard
# You should see health scores like "83%", "69%", "32%" etc.
```

## What to Expect on Dashboard

### Summary Counters (Top Right)
```
3 Good    (green)
5 Moderate (orange)
9 Bad     (red)
```

### Example Store Cards

**Checkers Durbanville (Good - Green)**
```
Health Score: 83%
Active Rate: 89%
Badge: "Good" (green)
Recommendations: None or minimal
```

**Shoprite Durbanville (Moderate - Orange)**
```
Health Score: 69%
Active Rate: 81%
Badge: "Moderate" (orange)
Recommendations: 1-2 medium priority actions
```

**Shoprite Kraaifontein (Bad - Red)**
```
Health Score: 0%
Active Rate: 35%
Badge: "Bad" (red)
Below Threshold: Yes
Recommendations: Multiple critical/high priority actions
```

## Verify the Fix

### Backend Test
```bash
cd backend
node test-api-response.js
```

**Expected Output:**
```
✅ ALL HEALTH SCORES ARE VALID NUMBERS
```

### Frontend Checklist
- [ ] Health scores show percentages (e.g., "83%") not "undefined%"
- [ ] Status badges are color-coded (Green/Orange/Red)
- [ ] Summary counters show "3 Good, 5 Moderate, 9 Bad"
- [ ] Stores are sorted worst-first
- [ ] Recommendations appear for Bad/Moderate stores
- [ ] "Below Threshold" badge appears when applicable

## Store Health Distribution

### Good Stores (3) - Scores 70-100%
1. **Checkers Durbanville** - 83%
   - 90% active trolleys
   - Minimal maintenance (8%)
   - Low stolen rate (2%)

2. **Shoprite Sandton** - ~78%
   - 85% active trolleys
   - Moderate maintenance (10%)

3. **Checkers Rosebank** - ~72%
   - 80% active trolleys
   - Some maintenance (14%)

### Moderate Stores (5) - Scores 40-69%
4. **Shoprite Durbanville** - 69%
5. **Checkers Fourways** - ~65%
6. **Shoprite Pietermaritzburg** - ~62%
7. **Checkers Sea Point** - ~55%
8. **Shoprite Cape Town CBD** - 52%

### Bad Stores (9) - Scores 0-39%
9. **Shoprite Potchefstroom** - ~35%
10. **Checkers Sea Point** - 32%
11. **Shoprite Soweto** - ~30%
12. **Shoprite Kraaifontein** - 0%
13-17. (Plus 5 more stores scoring below 40%)

## Understanding the 0% Score

**Why does Shoprite Kraaifontein have 0%?**

```
Base Score: 35% (active trolleys)
- Below threshold: -15 → 20%
- Alerts (12+ stolen): -20 → 0%
- High maintenance (45%): -10 → 0% (floor)
= Final Score: 0%
```

This is **correct behavior** - the store has critical issues:
- Only 35% trolleys active
- 45% in maintenance
- 10% stolen
- Below configured threshold
- Multiple critical alerts

## Troubleshooting

### If you still see "undefined%"

1. **Check database was reseeded:**
   ```bash
   cd backend
   npm run seed
   ```

2. **Verify backend is running:**
   ```bash
   npm run dev
   ```

3. **Test API directly:**
   ```bash
   node test-api-response.js
   ```

4. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

5. **Check browser console:**
   - Open DevTools (F12)
   - Look for API errors
   - Verify API returns `healthScore` as number

### If numbers seem wrong

The health score is **not just active percentage**. It's calculated with penalties:

```javascript
Score = Active% - Penalties

Penalties:
- Below threshold: -15
- Each alert: -3 (max -20)
- High maintenance (>30%): -10
- Moderate maintenance (>20%): -5
- High theft (>10%): -10
- Moderate theft (>5%): -5
```

So a store with 80% active might score 65% if it has alerts and issues.

## API Response Structure

The dashboard API returns:
```json
{
  "stores": [
    {
      "id": 4,
      "name": "Checkers Durbanville",
      "active": 128,
      "total": 142,
      "healthScore": 83,        ← Number (0-100)
      "healthStatus": "good",    ← String ('good'|'moderate'|'bad')
      "activePercentage": 89,
      "recommendations": []
    }
  ]
}
```

## Next Steps

1. **Start your servers** and open the dashboard
2. **Verify health scores** display correctly
3. **Test store filtering** by selecting different stores
4. **Review recommendations** for Bad/Moderate stores
5. **Check sorting** (worst stores appear first)

## Success Criteria

✅ No "undefined%" in health scores
✅ Percentages display correctly (e.g., "83%")
✅ Badges are color-coded properly
✅ Summary counters show: 3 Good, 5 Moderate, 9 Bad
✅ Recommendations appear for problematic stores
✅ Stores sorted by health score (worst first)

---

**The fix is complete!** Enjoy your working health score dashboard! 🎉
