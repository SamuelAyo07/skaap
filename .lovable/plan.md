## Goal

Transform SKAAP from a scanner that shows *info* into one that gives *decisions*: "What should I buy instead, given who I am?" All new intelligence is **Plus-only**. Free users get a one-time peek so they feel the magic, then hit the paywall.

Keeping it simple — we're layering 4 features on top of the existing scan flow, not rebuilding the app.

---

## Scope (MVP — what we actually ship now)

### 1. Health Profile (one-time setup, Plus-only)
A new `/profile/health` sheet with 4 quick taps:
- **Primary goal**: Weight loss · Muscle gain · Diabetes · Heart · Gut · Pregnancy · Parent (kids) · General wellness
- **Dietary**: vegan / vegetarian / gluten-free / dairy-free / nut-free (reuse existing dietary tags)
- **Avoid**: pull from existing 12-preset alerts
- **Budget sensitivity**: low / medium / high

Stored in new `user_health_profile` table (RLS: own row only). Drives every Plus feature below.

### 2. AI Decision Card (replaces "info dump" on scan result)
After the existing Skaap Score, add a **single Plus-gated card**:

```
For your goal (Weight loss):
  Verdict: Skip it
  Why: 18g added sugar, low fiber — likely to spike then crash
  Do this instead: [Better Alternative card →]
```

One Gemini call via existing `ai-product-insights` edge function (new `type: "decision"`). Cached 7 days per (barcode + goal). Free users see a blurred preview with "Unlock for your goal →".

### 3. Better Alternatives v2 (upgrade existing)
Existing `offRecommendations.ts` already returns healthier swaps. Enhance the card to show 3 tabs:
- **Healthier** (current logic)
- **Similar taste** (same category, nearest Nutri-Score upgrade)
- **Budget** (same category, lower typical price tier — use OFF `quantity` / brand heuristic)

Each card: thumbnail · name · Skaap score · "Why better" one-liner · price-delta chip.

### 4. Habit Impact (for repeat scans, Plus-only)
When `user_scans` shows ≥3 scans of same barcode in 30 days, show:
> "You've scanned Coca-Cola 4× this month. At 1/day: ~14k g sugar, ~51k kcal per year."

Pure client-side calc from existing scan history + OFF nutrition. No new API.

### 5. One-time free peek
First scan after install: full Plus experience unlocked. Second scan onwards: paywall. Tracked in `localStorage` (`skaap_free_peek_used`).

---

## Out of scope (next iterations, not now)

- Conversational AI nutrition assistant (chat UI is bigger lift — ship after we validate decision cards)
- Recipe inspiration (engagement feature, lower priority than core decisions)
- Pricing change to $4.99/$39 — keeping current $1.99/PWYW until we have data
- Massive product DB expansion (4M / 14M numbers) — OFF already covers ~4M food + OBF cosmetics. USDA already integrated. No new providers needed for MVP; can add Nutritionix later if gaps appear.

---

## Technical bits

**New table** (migration):
```sql
CREATE TABLE public.user_health_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal text NOT NULL,
  dietary text[] DEFAULT '{}',
  budget_sensitivity text DEFAULT 'medium',
  updated_at timestamptz DEFAULT now()
);
-- + GRANTs + RLS (own row select/insert/update)
```

**Edge function**: extend `ai-product-insights` with `type: "decision"` — takes product + user profile, returns `{verdict, why, action}` via Gemini 2.5 Flash.

**Frontend**:
- `src/components/scan/AIDecisionCard.tsx` (new) — sits below score in result sheet
- `src/components/scan/HealthProfileSheet.tsx` (new) — 4-step setup
- `src/components/scan/HabitImpactCard.tsx` (new) — repeat-scan insight
- Upgrade existing `RecsScreen` / alternatives card with 3 tabs
- Free-peek logic in `SkaapScan.tsx`

**Gating**: use existing `useSubscription()` + `openUpgrade()`.

---

## Visual preview before build

I'll generate **2–3 design directions** (Liquid Glass, kept simple, mobile-first 390px) for the new **AI Decision Card** — the highest-visibility new surface — so you can pick the style before I implement. Health profile setup and alternatives tabs follow the chosen direction.

---

## Confirm before I start

1. **OK to ship just these 5 things now** (decision card, profile, alternatives v2, habit impact, free peek) and defer chat assistant + recipes?
2. **Pricing**: keep current $1.99/mo or change to $4.99/mo as you wrote?
3. Go ahead and **generate the 2 design directions for the AI Decision Card** first?