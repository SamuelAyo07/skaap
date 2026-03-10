# SKAAP — Complete Product & Technology Specification

> **Confidential — Internal Use Only**
> Version 2.0 | March 2026
> Authored by: Chief Product & Technology Officer

---

## I. Executive Summary

**SKAAP** is a mobile first progressive web application that transforms any smartphone into an intelligent, self checkout terminal. The core value proposition is threefold: eliminate checkout lines entirely, give consumers real time nutritional intelligence on every product they scan, and provide retailers with a zero hardware path to modernized checkout. The name "SKAAP" (Afrikaans for "sheep") reflects our playful yet purposeful brand identity — smart consumers who navigate the grocery aisle with confidence and clarity.

The platform combines barcode scanning, AI powered product analysis, a proprietary health scoring algorithm (the Skaap Score), and frictionless in app payment into a single, seamless experience. There is no native app download required. SKAAP runs entirely in the browser as a PWA, installable on both iOS and Android home screens with full offline caching support.

---

## II. Brand Identity & Design System

### 2.1 Brand Personality
- **Tone**: Premium, confident, approachable. Never clinical. Never generic.
- **Voice**: Direct, benefit led copy. No dashes or hyphens in marketing or sales copy. Sentence fragments are acceptable when punchy.
- **Mascot/Symbol**: Stylized sheep icon (🐑), used as app icon and watermark.

### 2.2 Color Palette (HSL, strictly enforced via CSS custom properties)

| Token | Value | Usage |
|---|---|---|
| `--primary` | `0 0% 8%` | Primary text, dark UI surfaces |
| `--secondary` | `220 20% 10%` | Navy backgrounds, deep sections |
| `--accent` | `0 72% 51%` | CTA buttons, highlights, the "SKAAP red" |
| `--scanner-accent` | `6 63% 46%` | Scanner UI elements, price tags |
| `--scanner-ink` | `221 47% 20%` | Scanner frame, deep ink text |
| `--success` | `142 71% 45%` | Positive scores, confirmations |
| `--muted` | `220 14% 96%` | Subtle backgrounds, disabled states |
| `--muted-foreground` | `220 10% 46%` | Secondary text, captions |
| Brand Red (marketing) | `#B0202F` | Logo lockups, hero gradients |
| Dark Navy (marketing) | `#0A1220` | Premium dark sections |
| Deep Dark (marketing) | `#070D18` | Full bleed dark backgrounds |

**Rule**: No raw color classes in components. Every color references a semantic token from `index.css` or `tailwind.config.ts`. All values are HSL.

### 2.3 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Hero | Inter | 800–900 (Black) | 36–56px |
| Section Headers | Inter | 700 (Bold) | 24–32px |
| Body | Inter | 400–500 | 14–16px |
| Captions | Inter | 400 | 11–13px |
| Monospace (scores) | Inter | 800 | 13–18px |

Font stack: `'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif`

### 2.4 Spacing & Radius

| Element | Corner Radius | Shadow |
|---|---|---|
| Cards | 16px (`rounded-2xl`) | `0 4px 24px rgba(0,0,0,0.08)` |
| Buttons | 12px (`rounded-xl`) | None or subtle elevation |
| Modals / Sheets | 20px top corners | `--shadow-elevated` |
| Score Badges | Full circle | None |
| Input Fields | 12px | Inset border only |

### 2.5 Motion & Animation (Framer Motion)

| Interaction | Animation | Duration | Easing |
|---|---|---|---|
| Screen transitions | Slide up + fade | 300–500ms | `type: "spring", stiffness: 200, damping: 24` |
| Card enter | Scale from 0.95 + fade | 400ms | Spring |
| Button tap | Scale to 0.97 | Instant | `whileTap` |
| Score ring fill | Animated arc + number count | 800ms | `ease-out` |
| Scanner line | Vertical translate loop | 2s | `ease-in-out infinite` |
| Sheet open | Slide up from bottom | 300ms | Spring |
| Checkmark | Scale bounce (0 → 1.2 → 1) | 600ms | `ease-out`, 300ms delay |
| CTA pulse (mobile) | Box shadow pulse | 2.5s | Infinite |

**Rule**: Every screen change, list population, and interactive element must have intentional motion. No element should "pop" into existence without a transition.

---

## III. Application Architecture

### 3.1 Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| State | React Context (CartContext), localStorage (scan history, basket, cache) |
| Routing | React Router DOM v6 |
| Backend | Lovable Cloud (Supabase under the hood) |
| Database | PostgreSQL via Lovable Cloud |
| Edge Functions | Deno runtime (auto deployed) |
| AI | Lovable AI (Gemini, GPT models — no API key required) |
| PWA | vite-plugin-pwa |
| Maps | Leaflet + React Leaflet + OpenStreetMap |
| Product Data | Open Food Facts API |

### 3.2 File Structure (Key Files)

```
src/
├── pages/
│   ├── Index.tsx              # Marketing landing page
│   ├── AppPage.tsx            # App shell (bottom nav, screen router)
│   ├── SkaapScan.tsx          # Scanner app (home, scan, result, history, basket, AI info)
│   └── NotFound.tsx           # 404
├── components/
│   ├── app/
│   │   ├── HomeScreen.tsx     # App home (store selection, quick actions)
│   │   ├── ScanScreen.tsx     # Camera barcode scanner
│   │   ├── BagScreen.tsx      # Shopping bag with quantities
│   │   ├── PaymentScreen.tsx  # Payment flow
│   │   ├── OrderCompleteScreen.tsx  # Post payment confirmation
│   │   ├── ProfileScreen.tsx  # User profile
│   │   ├── ProductInfoSheet.tsx     # Bottom sheet product details
│   │   └── BottomNav.tsx      # iOS style tab bar
│   ├── website/
│   │   ├── AnimatedCounter.tsx     # Scroll triggered stat counters
│   │   ├── ComparisonTable.tsx     # Feature comparison grid
│   │   └── StoreMap.tsx            # Leaflet store locator
│   └── ui/                    # shadcn/ui component library (50+ components)
├── context/
│   └── CartContext.tsx        # Global cart state
├── data/
│   └── products.ts            # Demo product catalog
├── lib/
│   ├── skaapScore.ts          # Proprietary scoring algorithm
│   ├── productInfoApi.ts      # Open Food Facts integration
│   ├── aiProductInsights.ts   # AI analysis (summary, additives, recommendations)
│   ├── openfoodfacts.ts       # Raw OFF API client
│   ├── nearbyStores.ts        # Geolocation store finder
│   ├── analytics.ts           # Event tracking
│   └── utils.ts               # Tailwind merge utilities
├── assets/                    # Product images, store photos, brand assets
└── integrations/
    └── supabase/              # Auto generated client + types (DO NOT EDIT)
```

### 3.3 Route Map

| Path | Component | Purpose |
|---|---|---|
| `/` | `Index.tsx` | Marketing landing page |
| `/app` | `AppPage.tsx` | Main app shell |
| `/scan` | `SkaapScan.tsx` | Standalone scanner experience |
| `*` | `NotFound.tsx` | 404 fallback |

---

## IV. Feature Specification — Marketing Website (`/`)

### 4.1 Hero Section
- **Layout**: Full viewport height, centered content
- **Headline**: Large display text (font-black, 36–56px) with brand positioning
- **Subheadline**: One liner value prop, muted foreground color
- **CTA**: Primary red button ("Get Started" / "Try the Demo"), links to `/scan`
- **Visual**: Phone mockup showing the scan screen (`hero-phone-mockup.png`)
- **Background**: Clean white or subtle gradient
- **Mobile**: CTA gets pulse animation (`cta-pulse-mobile`)

### 4.2 How It Works (3 Step Flow)
1. **Scan** — Phone camera icon + scan screen preview (`step-scan.webp`)
2. **Pay** — In app payment illustration (`step-pay.webp`)
3. **Go** — Receipt / confirmation (`step-receipt.webp`)
- Each step: numbered badge, bold title, short description
- Animation: Staggered fade in on scroll (Framer Motion `whileInView`)

### 4.3 Smart Info Section
- Showcase of the Skaap Score and AI analysis
- Demo image of product analysis (`smart-info-demo.png`)
- Feature bullets: Score breakdown, additive alerts, dietary classification, healthier alternatives

### 4.4 Store Locator
- Interactive Leaflet map (`StoreMap.tsx`)
- Pins for partner store locations with popup cards
- Store images (`store-*.jpg`)
- Geolocation support for "stores near me"

### 4.5 Animated Statistics
- Scroll triggered counters (`AnimatedCounter.tsx`)
- Metrics: products scanned, stores partnered, average time saved, user satisfaction

### 4.6 Comparison Table
- Feature grid comparing SKAAP vs traditional checkout vs other scan and go solutions
- Checkmarks and X marks for feature presence
- Highlighted "SKAAP" column

### 4.7 Contact / Waitlist
- Email capture form
- Submissions stored in `contact_submissions` table via Lovable Cloud
- Edge function (`contact-notify`) sends notification on new submission

### 4.8 Footer
- Brand logo, navigation links, social links
- Copyright, privacy policy link
- `useskaap.com` domain reference

---

## V. Feature Specification — Scanner App (`/scan`)

This is the core product. A fully self contained, multi screen experience within a single React component (`SkaapScan.tsx`).

### 5.1 Screen State Machine

```
home → scanning → result → (ai-info)
  ↓                  ↓
history           basket
```

**State variable**: `screen: "home" | "scanning" | "result" | "history" | "ai-info" | "basket"`

### 5.2 Home Screen (`screen === "home"`)

**Layout**: Centered, clean, inviting entry point.

**Elements**:
- SKAAP logo + "Scan a product" headline
- Large circular "Scan" button (scanner-accent background, tap animation)
- "Or enter barcode manually" text input with submit
- Quick access icons:
  - 📜 History (with badge count of scanned items)
  - ❤️ Basket (with badge count of saved items)
- Recent scans preview (last 3 items, horizontal scroll)

**Interactions**:
- Tap scan button → transition to `scanning` screen
- Enter barcode + submit → transition to `result` screen with loading
- Tap history icon → transition to `history` screen
- Tap basket icon → transition to `basket` screen

### 5.3 Scanning Screen (`screen === "scanning"`)

**Layout**: Full screen dark overlay simulating camera viewfinder.

**Elements**:
- Scanner frame (rounded rectangle with accent colored corners)
- Animated scan line (vertical traverse, 2s loop)
- "Align barcode within frame" instruction text
- Back button (top left)
- Flash toggle (optional)

**Behavior**:
- In demo mode: auto detects after 2 second animation, uses entered or default barcode
- In production: integrates with device camera via `getUserMedia` API + barcode detection library
- On successful scan → transition to `result` with barcode

### 5.4 Result Screen (`screen === "result"`)

This is the richest, most information dense screen. It is the core differentiator.

**Loading State**:
- Skeleton placeholders for all sections
- Product data fetched from Open Food Facts API
- Results cached in localStorage with 7 day TTL
- Skaap Score calculated client side, cached separately

**Sections (top to bottom)**:

#### 5.4.1 Product Header
- Product image (from OFF API, fallback placeholder)
- Product name (bold, 20px)
- Brand name (muted, 14px)
- Weight / quantity
- Barcode number (monospace, small)

#### 5.4.2 Skaap Score Ring
- Large circular progress indicator (animated fill on mount)
- Score number in center (bold, 24px)
- Color coded: green (75+), yellow/amber (50–74), orange (25–49), red (<25)
- Verdict text below: "Excellent", "Good", "Fair", "Poor"
- Tap to expand breakdown

#### 5.4.3 Score Breakdown (expandable)
Five sub scores, each on a 0–100 scale with weighted contribution:

| Factor | Weight | Source |
|---|---|---|
| Nutri-Score | 35% | OFF API `nutrition_grades` field |
| NOVA Group | 25% | OFF API `nova_group` field (1–4, inverted) |
| Additive Risk | 20% | Count + individual risk classification |
| Eco Score | 10% | OFF API `ecoscore_grade` field |
| Ingredient Quality | 10% | Ingredients list analysis |

Each factor: colored bar, numeric score, label, brief explanation.

#### 5.4.4 Nutri-Score Badge
- Official A–E letter grade in colored pill
- Color mapping: A=#2D7D46, B=#4CAF50, C=#FFC107, D=#FF6D00, E=#B0202F

#### 5.4.5 NOVA Processing Group
- 1–4 scale indicator
- Labels: "Unprocessed", "Processed ingredients", "Processed foods", "Ultra processed"
- Visual: Numbered badges with color coding

#### 5.4.6 Additives Section
- Count badge ("3 additives detected")
- Each additive listed with:
  - E-number (e.g., E322)
  - Common name (e.g., "Lecithin")
  - Risk level: Low (green), Moderate (yellow), High (red)
  - Tap to expand → AI generated plain English explanation
- AI explanation fetched on demand via edge function → Lovable AI

#### 5.4.7 AI Summary
- One paragraph plain English summary of the product
- Generated via edge function using Lovable AI (Gemini/GPT)
- Cached after first generation
- Tone: informative, neutral, consumer friendly

#### 5.4.8 Dietary Classification
- Auto detected labels: Vegan, Vegetarian, Gluten Free, Halal, Kosher, Lactose Free, etc.
- Each as a colored chip/badge
- AI powered classification when OFF data is incomplete

#### 5.4.9 Healthier Alternatives (Yuka Style)
- Section title: "Healthier Alternatives" with Sparkles icon
- Horizontal scrollable card row
- Each card:
  - Product image (rounded, 56x56)
  - Product name (2 lines max)
  - Brand
  - Skaap Score circle (color coded, 14px)
  - "Better" badge if score is higher
  - Nutri-Score pill
- AI powered recommendations via edge function
- Cards are tappable → scans that product

#### 5.4.10 Action Buttons
- **Save to Basket**: Heart icon button, toggles saved/unsaved state
  - Saved state: green background, filled heart, "Saved" text
  - Unsaved state: white/outline, "Save" text
  - Persists to localStorage basket
- **Scan Another**: Returns to home screen
- **Share**: Native share (Web Share API) or clipboard fallback

### 5.5 History Screen (`screen === "history"`)

**Layout**: Vertical scrollable list of all previously scanned products.

**Features**:
- **Search bar**: Filter by product name or brand (real time, debounced)
- **Score filter chips**: "All", "75+" (green), "50–74" (yellow), "<50" (red)
- Each item shows:
  - Product image (thumbnail)
  - Product name + brand
  - Skaap Score badge (color coded)
  - Nutri-Score letter
  - Timestamp ("2 hours ago", "Yesterday")
- Tap item → loads result screen for that barcode
- Data source: `skaap_scan_history` in localStorage (max 200 items)

### 5.6 Basket / Comparison Screen (`screen === "basket"`)

**Layout**: Two section view — comparison grid + saved list.

**Features**:

#### Quick Compare Grid
- Horizontal scrollable row (up to 4 products side by side)
- Per product column:
  - Product image (56x56, rounded)
  - Name (truncated)
  - Skaap Score circle (color coded)
  - Nutri-Score pill
  - Additive count

#### Saved Products List
- Full list below the comparison grid
- Each item: image, name, brand, score, "Re-scan" button, delete (Trash2 icon)
- Swipe to delete (future enhancement)

#### Export Actions
- **Share as Text**: Generates formatted comparison text, uses Web Share API
- **Export as Image**: Canvas rendered branded PNG card featuring:
  - SKAAP logo (top left) + "SKAAP Comparison" header
  - Product columns with images, scores, Nutri-Score pills, additive counts
  - Branded watermark footer: semi transparent logo + "Made with SKAAP" + "useskaap.com"
  - 2x DPR for retina clarity
  - Auto downloads or shares via Web Share API

### 5.7 AI Info Screen (`screen === "ai-info"`)

Deep dive into a specific additive or nutritional aspect.

- Full screen bottom sheet or page
- AI generated explanation (plain English)
- Sources cited when available
- "Back to product" button

---

## VI. Feature Specification — Checkout App (`/app`)

### 6.1 App Shell (`AppPage.tsx`)
- Bottom navigation bar (`BottomNav.tsx`) with 4 tabs:
  - 🏠 Home
  - 📷 Scan
  - 🛒 Bag
  - 👤 Profile
- Screen state managed via local state
- Safe area insets respected (`viewport-fit=cover`, `env(safe-area-inset-bottom)`)

### 6.2 Home Screen (`HomeScreen.tsx`)
- Store selection (nearby stores from database)
- Welcome message
- Quick action cards
- Recent orders preview

### 6.3 Scan Screen (`ScanScreen.tsx`)
- Camera viewfinder with barcode detection
- Product lookup from store inventory (database `products` table)
- Add to bag on successful scan
- Product info sheet (`ProductInfoSheet.tsx`) for nutritional details

### 6.4 Bag Screen (`BagScreen.tsx`)
- Shopping bag with all scanned items
- Quantity adjustment (+ / - buttons with animations)
- Per item: image, name, weight, unit price, info button
- Subtotal + tax (11%) calculation
- "CHECKOUT" button with grand total
- Empty state: bag icon + "Scan items to add them here"

### 6.5 Payment Screen (`PaymentScreen.tsx`)
- Order summary
- Payment method selection
- Simulated payment processing
- Order stored in `orders` table via Lovable Cloud

### 6.6 Order Complete (`OrderCompleteScreen.tsx`)
- Animated checkmark confirmation
- Order ID display
- "Shop again" CTA
- Digital receipt

### 6.7 Profile Screen (`ProfileScreen.tsx`)
- User info from `profiles` table
- Order history
- Settings
- Sign out

---

## VII. Backend Architecture (Lovable Cloud)

### 7.1 Database Tables

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | User profiles (id, name, email, avatar) | Users read/update own row |
| `stores` | Retail store locations (name, address, lat/lng, owner) | Public read, owner write |
| `products` | Store inventory (name, price, barcode, stock, store_id) | Public read, store owner write |
| `orders` | Completed orders (items JSON, total, tax, status) | User reads own, insert authenticated |
| `analytics_events` | Usage tracking (event_type, page, session_id) | Insert only, no read from client |
| `contact_submissions` | Waitlist / contact form entries | Insert only |

### 7.2 Edge Functions

| Function | Trigger | Purpose |
|---|---|---|
| `ai-product-insights` | HTTP POST | Proxies AI requests for product analysis (summary, additives, dietary, recommendations) |
| `contact-notify` | HTTP POST | Sends notification on new contact form submission |

### 7.3 AI Integration Flow

```
Client → Edge Function (ai-product-insights)
  → Lovable AI (Gemini 2.5 Flash / GPT 5 Mini)
  → Structured JSON response
  → Client caches in localStorage (7 day TTL)
```

**Prompt templates** are defined in `src/lib/aiProductInsights.ts`:
- `fetchAISummary`: Product overview in 2–3 sentences
- `fetchAdditiveExplanation`: Plain English additive explanation
- `fetchDietaryClassification`: Array of applicable dietary labels
- `fetchRecommendations`: Array of healthier alternative products

---

## VIII. Skaap Score Algorithm (`skaapScore.ts`)

### Formula
```
SkaapScore = (NutriScore × 0.35) + (NOVAScore × 0.25) + (AdditiveScore × 0.20) + (EcoScore × 0.10) + (IngredientScore × 0.10)
```

### Sub-score Calculations

**NutriScore** (0–100):
- A = 100, B = 75, C = 50, D = 25, E = 0
- Unknown = 50

**NOVA Score** (0–100):
- Group 1 = 100, Group 2 = 75, Group 3 = 40, Group 4 = 10
- Unknown = 50

**Additive Score** (0–100):
- 0 additives = 100
- Each additive reduces score
- High risk additives (E110, E124, E621, etc.) apply 15 point penalty
- Moderate risk additives apply 8 point penalty
- Low risk additives apply 3 point penalty
- Floor at 0

**Eco Score** (0–100):
- A = 100, B = 75, C = 50, D = 25, E = 0
- Unknown = 50

**Ingredient Quality** (0–100):
- Based on ingredients list analysis
- Penalizes: palm oil, high fructose corn syrup, artificial sweeteners
- Rewards: organic indicators, whole grain, natural ingredients

### Color Mapping
- 75–100: `#22C55E` (Green)
- 50–74: `#F59E0B` (Amber)
- 25–49: `#F97316` (Orange)
- 0–24: `#EF4444` (Red)

### Verdict Labels
- 75+: "Excellent"
- 50–74: "Good"
- 25–49: "Fair"
- 0–24: "Poor"

---

## IX. Data Flow & Caching Strategy

### 9.1 Product Lookup
```
User enters barcode
  → Check localStorage cache (key: skaap_cache_{barcode})
    → Hit + fresh (< 7 days): Use cached data
    → Miss or stale: Fetch from Open Food Facts API
      → Cache response in localStorage
      → Calculate Skaap Score
      → Cache score separately (key: skaap_score_{barcode})
```

### 9.2 Scan History
- Stored in localStorage (key: `skaap_scan_history`)
- Max 200 items (FIFO eviction)
- Each entry: barcode, name, brand, image, nutriScore, skaapScore, timestamp

### 9.3 Basket
- Stored in localStorage (key: `skaap_basket`)
- Max 100 items
- Each entry: barcode, name, brand, image, nutriScore, skaapScore, novaGroup, additiveCount, timestamp

---

## X. PWA Configuration

### 10.1 Manifest
- App name: "SKAAP"
- Short name: "SKAAP"
- Theme color: `#b42318`
- Background color: white
- Display: standalone
- Icons: 192x192 and 512x512 PNG (`skaap-icon-192.png`, `skaap-icon-512.png`)

### 10.2 Service Worker
- Generated by `vite-plugin-pwa`
- Precaches all static assets
- Runtime caching for API responses
- Offline fallback to cached shell

### 10.3 iOS Meta Tags
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="SKAAP" />
```

---

## XI. SEO & Social Sharing

### 11.1 Meta Tags
- Title: "SKAAP — Scan. Pay. Go." (< 60 chars)
- Description: "SKAAP turns your smartphone into a virtual checkout. Scan items, pay in app, skip the line." (< 160 chars)
- Open Graph: type, title, description, image
- Twitter Card: summary_large_image

### 11.2 Social Image
- Custom OG image hosted on CDN
- Shows app mockup with brand positioning

### 11.3 Structured Data
- JSON-LD for SoftwareApplication schema (future)

---

## XII. Analytics

### 12.1 Event Tracking (`analytics.ts`)
- Page views
- Scan initiated / completed
- Product viewed
- Add to basket
- Share actions
- Payment initiated / completed

### 12.2 Storage
- Events written to `analytics_events` table
- Fields: event_type, page, session_id, screen_width, user_agent, event_data (JSON)

---

## XIII. Security Considerations

- All database tables have Row Level Security (RLS) enabled
- User data isolated by `user_id` foreign key
- No admin roles stored on profile table (separate `user_roles` table pattern)
- Edge functions validate input before AI proxy calls
- No private API keys in client code
- CORS configured on edge functions
- Content Security Policy headers (future)

---

## XIV. Performance Targets

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3s |
| Cumulative Layout Shift | < 0.1 |
| Lighthouse Performance | > 90 |
| Bundle Size (gzipped) | < 300KB |
| API Response (product lookup) | < 800ms |
| AI Response (insights) | < 3s |

---

## XV. Future Roadmap

### Phase 1 (Current)
✅ Barcode scanning with Open Food Facts
✅ Skaap Score algorithm
✅ AI powered insights (summary, additives, dietary, recommendations)
✅ Scan history with search and filters
✅ Basket for saving and comparing products
✅ Image export with branded watermark
✅ Marketing landing page
✅ PWA installability
✅ Checkout flow (demo)

### Phase 2 (Next Quarter)
- Real camera barcode scanning (QuaggaJS or ZXing integration)
- User authentication (email + social)
- Cloud synced scan history and basket
- Push notifications for product recalls
- Allergen alerts based on user profile
- Price comparison across stores

### Phase 3 (6 Months)
- Retailer dashboard for store owners
- Real payment processing (Stripe integration)
- Receipt generation and email
- Loyalty points system
- Community reviews and ratings
- Multi language support (EN, FR, ES, AF)

### Phase 4 (12 Months)
- Native app wrappers (Capacitor)
- AR product overlay (scan and see nutrition in camera view)
- Meal planning integration
- Grocery list with auto suggestions
- API marketplace for third party integrations
- White label solution for retailers

---

## XVI. Deployment & Infrastructure

| Aspect | Detail |
|---|---|
| Hosting | Lovable (auto deployed) |
| Domain | skaap.lovable.app (published), useskaap.com (custom) |
| CDN | Lovable CDN (static assets) |
| Database | Lovable Cloud (PostgreSQL) |
| Edge Functions | Deno runtime (auto deployed on push) |
| CI/CD | Lovable auto build on save |
| Version Control | Git (Lovable managed) |
| Monitoring | Lovable Cloud analytics |

---

## XVII. Quality Assurance Checklist

### Before Every Release
- [ ] All screens render without console errors
- [ ] Barcode scan flow completes end to end (scan → result → save → basket)
- [ ] AI insights load and display correctly
- [ ] Basket comparison exports as branded PNG
- [ ] History search filters work (name + score range)
- [ ] PWA installs correctly on iOS Safari and Android Chrome
- [ ] All animations are smooth (60fps)
- [ ] Touch targets are minimum 44x44px
- [ ] Text is readable at all viewport sizes (320px to 1440px)
- [ ] No horizontal overflow on any screen
- [ ] localStorage gracefully handles quota exceeded
- [ ] Offline fallback works for cached products

---

*This document is the single source of truth for the SKAAP product. Every design decision, every interaction, every data flow is specified here. When in doubt, reference this document. When building, follow this document to the letter.*

**— CPTO, SKAAP Technologies Inc.**
