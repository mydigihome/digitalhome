# Money Tab (Wealth Tracker) — UI Interaction Map & Stitch AI Integration Guide

> Comprehensive reference for every UI interaction point in the Money/Wealth Tracker module, including component hierarchy, data flows, state management, modals, and recommended Stitch AI hook-up points.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [Route Structure](#3-route-structure)
4. [Data Layer — Hooks & State](#4-data-layer--hooks--state)
5. [Database Schema (All Tables)](#5-database-schema-all-tables)
6. [UI Interaction Points — Onboarding Flow](#6-ui-interaction-points--onboarding-flow)
7. [UI Interaction Points — Header / Banner](#7-ui-interaction-points--header--banner)
8. [UI Interaction Points — Credit Score Card](#8-ui-interaction-points--credit-score-card)
9. [UI Interaction Points — Financial Overview (2×2 Stats Grid)](#9-ui-interaction-points--financial-overview-2x2-stats-grid)
10. [UI Interaction Points — Market Intelligence](#10-ui-interaction-points--market-intelligence)
11. [UI Interaction Points — Active Trading Plans](#11-ui-interaction-points--active-trading-plans)
12. [UI Interaction Points — Savings Goal](#12-ui-interaction-points--savings-goal)
13. [UI Interaction Points — Upcoming Bills](#13-ui-interaction-points--upcoming-bills)
14. [UI Interaction Points — Subscriptions](#14-ui-interaction-points--subscriptions)
15. [UI Interaction Points — Mobile FAB](#15-ui-interaction-points--mobile-fab)
16. [Modal Inventory](#16-modal-inventory)
17. [Secondary View: WealthDashboard (Full Dashboard)](#17-secondary-view-wealthdashboard-full-dashboard)
18. [Visual System & Theming](#18-visual-system--theming)
19. [State Management Patterns](#19-state-management-patterns)
20. [Stitch AI Integration Points](#20-stitch-ai-integration-points)
21. [Known Issues & Edge Cases](#21-known-issues--edge-cases)

---

## 1. Architecture Overview

The Money tab is a **dual-view** system:

| View | File | Route | Description |
|------|------|-------|-------------|
| **Primary** (Stitch UI) | `src/pages/WealthTrackerPage.tsx` | `/finance/wealth` | Custom glassmorphism layout with 12-col desktop grid and single-column mobile stack. This is the main view users see. |
| **Secondary** (Full Dashboard) | `src/components/wealth/WealthDashboard.tsx` | Rendered inside WealthTrackerPage in some flows | Modular card-based dashboard with show/hide/reorder capabilities. Currently **NOT** rendered in the primary route — the primary route uses its own inline layout. |

**Critical Note**: `WealthDashboard.tsx` (235 lines) is a separate component with its OWN hero header, card customization panel, and widget renderer. It is imported but **not used** in the current `WealthTrackerPage.tsx`. The primary page has all widgets inline. Any Stitch AI integration must target `WealthTrackerPage.tsx` directly.

### Layout Architecture

```
Desktop (≥768px / md:):
┌─────────────────────────────────────────────────────────┐
│  Customizable Header (faith message + pencil edit)       │
├───────────────────────────────┬──────────────────────────┤
│  LEFT (col-span-8)            │  RIGHT (col-span-4)      │
│  ┌──────────────────────┐     │  ┌───────────────────┐   │
│  │  Credit Score Gauge   │     │  │  2×2 Stats Grid    │   │
│  └──────────────────────┘     │  │  Income | Expenses │   │
│  ┌──────────────────────┐     │  │  Net    | Debt     │   │
│  │  Market Intelligence  │     │  └───────────────────┘   │
│  │  BTC highlight        │     │  ┌───────────────────┐   │
│  │  Asset table (Trade/  │     │  │  Upcoming Bills    │   │
│  │  Plan buttons)        │     │  └───────────────────┘   │
│  └──────────────────────┘     │  ┌───────────────────┐   │
│  ┌──────────────────────┐     │  │  Subscriptions     │   │
│  │  Active Trading Plans │     │  └───────────────────┘   │
│  └──────────────────────┘     │                          │
│  ┌──────────────────────┐     │                          │
│  │  Savings Goal         │     │                          │
│  └──────────────────────┘     │                          │
└───────────────────────────────┴──────────────────────────┘

Mobile (<768px):
┌────────────────────────┐
│  Customizable Header    │
│  Credit Score            │
│  Financial Overview 2×2  │
│  Bills & Due Dates       │
│  Savings Goal            │
│  Market Intelligence     │
│  Active Trading Plans    │
│  Subscriptions           │
│  [FAB: + button]         │
└────────────────────────┘
```

---

## 2. Component Hierarchy

```
WealthTrackerPage (src/pages/WealthTrackerPage.tsx) — 821 lines
├── AppShell (layout wrapper)
├── [Conditional] WealthOnboarding (first-time flow)
│   └── Multi-step wizard (6 steps)
│
├── Header (customizable gradient/photo)
│   └── HeaderCustomizationModal
│
├── Desktop Layout (hidden md:block)
│   ├── LEFT col-span-8
│   │   ├── Credit Score Card (SVG arc gauge)
│   │   ├── Market Intelligence Card
│   │   │   ├── BTC/USD highlight
│   │   │   └── Asset Table (user pairs or default watchlist)
│   │   ├── ActiveTradingPlans (component)
│   │   └── Savings Goal Card
│   │
│   └── RIGHT col-span-4
│       ├── 2×2 Stats Grid (Income, Expenses, Net, Debt)
│       ├── Upcoming Bills
│       └── Subscriptions
│
├── Mobile Layout (md:hidden)
│   ├── Credit Score Card
│   ├── Financial Overview 2×2
│   ├── Bills & Due Dates
│   ├── Savings Goal
│   ├── Market Intelligence (BTC + pairs)
│   ├── ActiveTradingPlans
│   └── Subscriptions
│
├── Mobile FAB (fixed bottom-right)
│
└── Modals (conditional rendering)
    ├── AddPairModal
    ├── CreatePlanModal
    ├── TradeModal
    └── HeaderCustomizationModal
```

---

## 3. Route Structure

```
/finance              → Redirects to /finance/wealth (Navigate replace)
/finance/wealth       → WealthTrackerPage (ProtectedRoute)
/finance/applications → ApplicationsTrackerPage (ProtectedRoute)
```

**Sidebar Navigation**: Money item in AppShell expands to show sub-items:
- Wealth Tracker → `/finance/wealth`
- Applications → `/finance/applications`

---

## 4. Data Layer — Hooks & State

### React Query Hooks (Server State)

| Hook | File | Table | Query Key | Purpose |
|------|------|-------|-----------|---------|
| `useUserFinances()` | `src/hooks/useUserFinances.ts` | `user_finances` | `["user_finances", userId]` | Core financial data (income, debt, credit score, savings) |
| `useUpsertUserFinances()` | `src/hooks/useUserFinances.ts` | `user_finances` | invalidates `["user_finances"]` | Update financial data (onboarding + inline edits) |
| `useExpenses()` | `src/hooks/useExpenses.ts` | `expenses` | `["expenses", userId]` | All expenses (bills, subscriptions, one-time) |
| `useCreateExpense()` | `src/hooks/useExpenses.ts` | `expenses` | invalidates `["expenses"]` | Add new expense |
| `useUpdateExpense()` | `src/hooks/useExpenses.ts` | `expenses` | invalidates `["expenses"]` | Edit expense |
| `useDeleteExpense()` | `src/hooks/useExpenses.ts` | `expenses` | invalidates `["expenses"]` | Remove expense |
| `useLoans()` | `src/hooks/useLoans.ts` | `loans` | `["loans", userId]` | Loan data (amount, rate, provider) |
| `useCreateLoan()` | `src/hooks/useLoans.ts` | `loans` | invalidates `["loans"]` | Add loan |
| `useTradingPairs()` | `src/hooks/useTradingPairs.ts` | `trading_pairs` | `["trading_pairs", userId]` | User's custom trading pairs |
| `useAddTradingPair()` | `src/hooks/useTradingPairs.ts` | `trading_pairs` | invalidates `["trading_pairs"]` | Add new trading pair |
| `useRemoveTradingPair()` | `src/hooks/useTradingPairs.ts` | `trading_pairs` | invalidates `["trading_pairs"]` | Soft-delete (is_active=false) |
| `useTradingPlans()` | `src/hooks/useTradingPlans.ts` | `trading_plans` | `["trading_plans", userId]` | All trading plans |
| `useCreateTradingPlan()` | `src/hooks/useTradingPlans.ts` | `trading_plans` | invalidates `["trading_plans"]` | Create new plan |
| `useUpdateTradingPlan()` | `src/hooks/useTradingPlans.ts` | `trading_plans` | invalidates `["trading_plans"]` | Update plan status |
| `useMarketQuote(symbol)` | `src/hooks/useMarketData.ts` | Edge Function: `market-data` | `["market_quote", symbol]` | Live price data (30s refresh) |
| `useTimeseries(symbol)` | `src/hooks/useMarketData.ts` | Edge Function: `market-data` | `["market_timeseries", ...]` | Historical price data for charts |
| `useUserPreferences()` | `src/hooks/useUserPreferences.ts` | `user_preferences` | `["user_preferences", userId]` | Header customization, banner settings |
| `useUpsertPreferences()` | `src/hooks/useUserPreferences.ts` | `user_preferences` | invalidates `["user_preferences"]` | Save header type/value |
| `useWealthLayout()` | `src/hooks/useWealthLayout.ts` | `wealth_layout` | `["wealth_layout", userId]` | Card visibility & order (WealthDashboard only) |
| `useInvestments()` | `src/hooks/useInvestments.ts` | `investments` | `["investments", userId]` | Investment holdings |
| `useChildInvestments()` | `src/hooks/useChildInvestments.ts` | `child_investments` | `["child_investments", userId]` | Child investment accounts |

### Local State (Component-level)

| State Variable | Type | Default | Purpose |
|----------------|------|---------|---------|
| `justCompleted` | `boolean` | `false` | Skip onboarding after completion |
| `addBillOpen` | `boolean` | `false` | (Declared but unused — reserved) |
| `showAddPair` | `boolean` | `false` | Toggle AddPairModal |
| `showCreatePlan` | `boolean` | `false` | Toggle CreatePlanModal |
| `showTradeModal` | `boolean` | `false` | Toggle TradeModal |
| `selectedPairForPlan` | `TradingPair \| null` | `null` | Which pair the Plan modal targets |
| `selectedPairForTrade` | `TradingPair \| null` | `null` | Which pair the Trade modal targets |
| `isEditingHeader` | `boolean` | `false` | Toggle HeaderCustomizationModal |
| `editingCard` | `string \| null` | `null` | Which stat card is in edit mode (`"income"`, `"credit"`, `"debt"`, `"savings"`) |
| `editValue` | `string` | `""` | Current value in the edit input |

---

## 5. Database Schema (All Tables)

### `user_finances`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `user_id` | uuid | — | FK (auth.users, enforced by RLS) |
| `monthly_income` | numeric | 0 | Editable via stat card |
| `total_debt` | numeric | 0 | Editable via stat card |
| `credit_score` | integer | null | Editable via stat card (0–850) |
| `savings_goal` | numeric | 0 | Set during onboarding |
| `current_savings` | numeric | 0 | Editable via stat card |
| `has_student_loans` | boolean | false | Set during onboarding |
| `invests` | boolean | false | Set during onboarding |
| `investment_types` | text[] | null | Set during onboarding |
| `onboarding_completed` | boolean | false | Gates main view vs onboarding |
| RLS: `auth.uid() = user_id` (ALL) |

### `expenses`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `user_id` | uuid | — | |
| `description` | text | — | Bill/subscription name |
| `category` | text | — | `"Subscriptions"`, `"Entertainment"`, etc. |
| `amount` | numeric | — | Dollar amount |
| `frequency` | text | `"monthly"` | `"monthly"`, `"yearly"`, `"one-time"` |
| `priority` | text | `"medium"` | |
| `expense_date` | date | CURRENT_DATE | |
| RLS: `auth.uid() = user_id` (ALL) |

### `trading_pairs`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `user_id` | uuid | — | |
| `symbol` | text | — | e.g. `"BTC/USD"`, `"AAPL"` |
| `display_name` | text | — | e.g. `"Bitcoin"`, `"Apple Inc."` |
| `category` | text | `"Stocks"` | `"Crypto"`, `"Stocks"`, `"Forex"` |
| `is_active` | boolean | true | Soft-delete flag |
| `sort_order` | integer | 0 | Display order |
| RLS: `auth.uid() = user_id` (ALL) |

### `trading_plans`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `user_id` | uuid | — | |
| `symbol` | text | — | Asset symbol |
| `asset_name` | text | — | Display name |
| `current_price` | numeric | null | Price at plan creation |
| `entry_price` | numeric | null | Planned entry |
| `target_price` | numeric | null | Price target |
| `stop_loss` | numeric | null | Stop loss level |
| `take_profit_1` | numeric | null | First TP level |
| `take_profit_2` | numeric | null | Second TP level |
| `position_size` | numeric | null | |
| `total_investment` | numeric | null | |
| `risk_reward_ratio` | numeric | null | |
| `strategy_notes` | text | null | Free-form notes |
| `time_frame` | text | `"swing"` | `"1_month"`, `"3_months"`, `"6_months"`, `"1_year"` |
| `status` | text | `"active"` | `"active"`, `"completed"`, `"cancelled"` |
| `trading_pair_id` | uuid | null | FK → `trading_pairs.id` |
| `completed_at` | timestamptz | null | |
| RLS: `auth.uid() = user_id` (ALL) |

### `loans`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `user_id` | uuid | — | |
| `loan_type` | text | — | |
| `amount` | numeric | 0 | |
| `interest_rate` | numeric | 0 | |
| `monthly_payment` | numeric | 0 | |
| `provider_name` | text | null | |
| `provider_phone` | text | null | |
| `provider_website` | text | null | |
| `start_date` | date | null | |
| RLS: `auth.uid() = user_id` (ALL) |

### `wealth_layout`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `user_id` | uuid | — | |
| `card_order` | jsonb | — | Array of card IDs |
| `hidden_cards` | jsonb | — | Array of hidden card IDs |
| RLS: `auth.uid() = user_id` (ALL) |
| **Note**: Used only by `WealthDashboard.tsx`, NOT by the primary `WealthTrackerPage.tsx` |

### `user_preferences` (Money-relevant columns only)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `money_header_type` | text | `"color"` | `"color"` or `"photo"` |
| `money_header_value` | text | `"#6366F1"` | Hex color or photo URL |
| `banner_color` | text | `"#6366F1"` | Fallback color |
| `wealth_banner_url` | text | null | (WealthDashboard use) |
| `wealth_banner_text` | text | `"GET RICH OR DIE TRYING"` | (WealthDashboard use) |
| `wealth_banner_text_color` | text | `"#065F46"` | (WealthDashboard use) |

---

## 6. UI Interaction Points — Onboarding Flow

**File**: `src/components/wealth/WealthOnboarding.tsx` (569 lines)
**Trigger**: When `finances?.onboarding_completed === false && !justCompleted`

### Steps (6-step wizard)

| Step | Title | Inputs | Data Written |
|------|-------|--------|--------------|
| 1 | Welcome | None (intro screen) | — |
| 2 | Income & Budget | Monthly income (number), Savings goal (number) | `user_finances.monthly_income`, `user_finances.savings_goal` |
| 3 | Bills & Expenses | Add expenses (description, amount, category, frequency) | `expenses` table (multiple inserts) |
| 4 | Debt | Has student loans (switch), Add loans (type, amount, rate, payment, provider) | `user_finances.has_student_loans`, `loans` table |
| 5 | Investments | Invests (switch), Investment types (checkboxes), Child investments | `user_finances.invests`, `user_finances.investment_types`, `child_investments` table |
| 6 | Summary | Review pie chart + stats | `user_finances.onboarding_completed = true` |

### Stitch AI Integration Points (Onboarding):
- **Step 2**: AI could suggest savings goals based on income ("Based on your income, a common savings target is 20% = $X/mo")
- **Step 3**: AI could auto-categorize expenses from a natural language description
- **Step 5**: AI could suggest investment allocation based on age/risk profile
- **Step 6**: AI could generate a personalized financial summary/insights

---

## 7. UI Interaction Points — Header / Banner

**Location**: Top of page, full-width, rounded bottom corners (40px radius)

### Interactions:

| Action | Trigger | Handler | Result |
|--------|---------|---------|--------|
| View faith message | Page load | Computed from `FAITH_MESSAGES[date % length]` | Displays rotating motivational quote |
| Open header editor | Click anywhere on header | `setIsEditingHeader(true)` | Opens `HeaderCustomizationModal` |
| Reveal edit pencil | Hover over header | CSS `group-hover:opacity-100` | Shows pencil icon (top-right) |

### HeaderCustomizationModal (`src/components/wealth/HeaderCustomizationModal.tsx`, 153 lines)

| Interaction | Handler | Data |
|-------------|---------|------|
| Select color | `setSelectedColor(color)` | From `COLORS` array (8 preset colors) |
| Upload photo | `handlePhotoUpload()` | Uploads to `banners` storage bucket → `user_preferences.money_header_value` |
| Toggle type (color/photo) | `setHeaderType()` | `"color"` or `"photo"` |
| Save | `handleSave()` → `upsertPrefs.mutateAsync()` | Writes `money_header_type` + `money_header_value` to `user_preferences` |

### Stitch AI Integration:
- AI could suggest header colors based on user's theme preferences
- AI could generate motivational messages personalized to financial goals

---

## 8. UI Interaction Points — Credit Score Card

**Location**: Desktop: LEFT col-span-8 (first card) | Mobile: First card in stack

### Visual Elements:
- SVG semi-circle arc with gradient (Red → Yellow → Blue → Green)
- Score number centered below arc (0–850)
- Label badge: "Excellent" (≥750), "Good" (≥700), "Fair" (≥650), "Poor" (<650)
- Rainbow progress bar with white marker
- Range labels: 300–850

### Interactions:

| Action | Trigger | Handler | Result |
|--------|---------|---------|--------|
| Edit credit score | Click pencil (hover-reveal) | `setEditingCard("credit")` | Shows inline input |
| Save edit | Press Enter or click ✓ | `handleCardEdit("credit", value)` | `supabase.from("user_finances").update({ credit_score: num })` |
| Cancel edit | Press Escape | `setEditingCard(null)` | Hides input |
| View full report | Click "Full Report" button | `navigate("/finance/wealth")` | (Currently navigates to self — should link to expanded view) |

### Stitch AI Integration:
- AI could provide credit score improvement tips based on current score
- AI could analyze spending patterns to predict score trajectory

---

## 9. UI Interaction Points — Financial Overview (2×2 Stats Grid)

**Location**: Desktop: RIGHT col-span-4 (top) | Mobile: Second card in stack

### Cards:

| Card Key | Label | Icon | Icon BG | Editable | Data Source |
|----------|-------|------|---------|----------|-------------|
| `income` | Income | DollarSign | `bg-emerald-100 text-emerald-600` | ✅ Yes | `user_finances.monthly_income` |
| `expenses` | Expenses | CreditCard | `bg-red-100 text-red-600` | ❌ No (computed) | `SUM(expenses.amount)` |
| `net` | Net | TrendingUp | `bg-blue-100 text-blue-600` | ❌ No (computed) | `income - expenses` |
| `debt` | Debt | Wallet | `bg-amber-100 text-amber-600` | ✅ Yes | `user_finances.total_debt` |

### Interactions:

| Action | Trigger | Handler | Result |
|--------|---------|---------|--------|
| Reveal edit pencil | Hover over card (desktop) or touch (mobile) | CSS `group-hover:opacity-100` / `active:opacity-100` | Shows colored pencil button |
| Start editing | Click pencil | `setEditingCard(key); setEditValue(String(value))` | Replaces value with Input |
| Save value | Enter key or ✓ button | `handleCardEdit(key, value)` | Direct Supabase update via `supabase.from("user_finances").update()` |
| Cancel edit | Escape key | `setEditingCard(null)` | Hides input |

### `handleCardEdit` Field Mapping:
```typescript
const fieldMap = {
  income: "monthly_income",
  credit: "credit_score",
  debt: "total_debt",
  savings: "current_savings",
};
```

### Stitch AI Integration:
- AI could detect anomalies ("Your expenses increased 30% this month")
- AI could suggest budget adjustments
- AI could forecast net income trends

---

## 10. UI Interaction Points — Market Intelligence

**Location**: Desktop: LEFT col-span-8 (second card) | Mobile: Below savings goal

### Sub-sections:

#### A. BTC/USD Highlight Card
- **Data**: `useMarketQuote("BTC/USD")` — refreshes every 30s
- **Fallback**: `$64,284.50 / +2.4%` when API unavailable
- **Visual**: Mini sparkline SVG (static polyline)
- **Interaction**: Display-only (no click handlers)

#### B. Asset Table

| Column | Content |
|--------|---------|
| Asset | Category badge + Symbol |
| Price | Live price (currently shows "—" for custom pairs) |
| Actions | Trade button + Plan button |

##### When user has custom pairs (`userPairs.length > 0`):
| Action | Trigger | Handler | Result |
|--------|---------|---------|--------|
| Trade | Click "Trade" button | `setSelectedPairForTrade(pair); setShowTradeModal(true)` | Opens TradeModal |
| Plan | Click "Plan" button | `setSelectedPairForPlan(pair); setShowCreatePlan(true)` | Opens CreatePlanModal |

##### When NO custom pairs (default watchlist):
- Shows 3 default entries: EUR/USD (FX), ETH/USD (ETH), AAPL (AAPL)
- **⚠️ BUG**: Trade/Plan buttons on default watchlist rows have NO `onClick` handlers — they are purely visual. Only user-added pairs have functional buttons.

#### C. "+ Add Pair" Button
| Action | Trigger | Handler | Result |
|--------|---------|---------|--------|
| Open pair picker | Click "+ Add Pair" | `setShowAddPair(true)` | Opens AddPairModal |

### Stitch AI Integration:
- AI could analyze portfolio and suggest diversification
- AI could provide market commentary for watched assets
- AI could suggest optimal entry/exit points for trading plans
- AI could auto-populate price data for custom pairs (currently showing "—")

---

## 11. UI Interaction Points — Active Trading Plans

**File**: `src/components/wealth/ActiveTradingPlans.tsx` (77 lines)
**Data**: `useTradingPlans()` → filters `status === "active"`
**Conditional**: Only renders when `activePlans.length > 0`

### Visual Elements (per plan):
- Symbol + timeframe label
- P&L percentage (green/red)
- Entry price, Target price, Stop Loss, Current price
- Progress bar: `((current - entry) / (target - entry)) * 100%`

### Interactions:
- **Display-only** — no edit/delete/complete actions on this component
- No click handlers on individual plan cards

### Stitch AI Integration:
- AI could evaluate plan performance and suggest adjustments
- AI could alert when stop-loss or take-profit levels are approached
- AI could provide risk assessment for active positions

---

## 12. UI Interaction Points — Savings Goal

**Location**: Desktop: LEFT col-span-8 (bottom) | Mobile: Fourth card in stack

### Data Points:
- `currentSavings` → `user_finances.current_savings`
- `savingsGoal` → `user_finances.savings_goal`
- `savingsPct` → `min(100, round((current / goal) * 100))`
- Monthly savings estimate: `income * 0.2` (hardcoded 20%)
- Months remaining: `ceil((goal - current) / max(1, income * 0.2))`

### Visual:
- Progress bar with gradient (`from-indigo-500 to-purple-500`)
- Animated width via framer-motion

### Interactions:
- **Display-only** — no edit buttons on this card
- **Missing**: No way to update `current_savings` from this card (only editable via stat grid if `savings` key were added)

### Stitch AI Integration:
- AI could adjust savings rate recommendations based on spending patterns
- AI could celebrate milestones ("You're halfway to your goal!")
- AI could project savings timeline with different contribution rates

---

## 13. UI Interaction Points — Upcoming Bills

**Location**: Desktop: RIGHT col-span-4 (middle) | Mobile: Third card in stack

### Data Source:
```typescript
const recurringBills = expenses?.filter((e) => e.frequency !== "one-time") || [];
```

### Interactions:

| Action | Trigger | Handler | Result |
|--------|---------|---------|--------|
| Add bill (mobile) | Click + button | `navigate("/finance/wealth")` | Navigates to self (no-op currently) |

### Empty State (Desktop):
Shows 2 sample bills (Electricity $142, Starlink $120) — these are hardcoded placeholders, not real data.

### Empty State (Mobile):
Shows "No upcoming bills" text.

### Stitch AI Integration:
- AI could predict upcoming bill amounts based on history
- AI could flag bills that are unusually high
- AI could suggest bill payment optimization strategies

---

## 14. UI Interaction Points — Subscriptions

**Location**: Desktop: RIGHT col-span-4 (bottom) | Mobile: Last card in stack

### Data Source:
```typescript
const subscriptions = recurringBills.filter(
  (e) => e.category === "Subscriptions" || e.category === "Entertainment"
);
```

### Empty State (Desktop):
Shows 3 sample subscriptions (Creative Cloud $54.99, Netflix $19.99, Google One $99.99) — hardcoded placeholders.

### Empty State (Mobile):
Shows "No subscriptions tracked yet" text.

### Interactions:
- **Display-only** — no CRUD actions on subscription cards

### Stitch AI Integration:
- AI could identify unused subscriptions to cancel
- AI could calculate total annual subscription cost
- AI could find cheaper alternatives

---

## 15. UI Interaction Points — Mobile FAB

**Location**: Fixed, bottom-right (`bottom-24 right-6`), mobile only (`md:hidden`)

| Action | Trigger | Handler | Result |
|--------|---------|---------|--------|
| Click FAB | Tap + button | `navigate("/finance/wealth")` | Navigates to self (no-op currently) |

**⚠️ BUG**: FAB currently navigates to the same page. Should open an "Add" menu (add expense, add bill, add subscription).

---

## 16. Modal Inventory

### A. AddPairModal (`src/components/wealth/AddPairModal.tsx`, 112 lines)

**Trigger**: `showAddPair === true`

| Feature | Detail |
|---------|--------|
| Search | Filters `AVAILABLE_PAIRS` by symbol or name |
| Available pairs | 12 preset pairs (3 Crypto, 6 Stocks, 3 Forex) |
| Excluded | Already-added symbols |
| Action | Click pair → `addPair.mutateAsync()` → inserts into `trading_pairs` |

**Available Pairs List**:
```
BTC/USD, ETH/USD, SOL/USD (Crypto)
AAPL, TSLA, GOOGL, MSFT, NVDA, AMZN (Stocks)
EUR/USD, GBP/USD, USD/JPY (Forex)
```

### B. TradeModal (`src/components/wealth/TradeModal.tsx`, 127 lines)

**Trigger**: `showTradeModal === true && selectedPairForTrade !== null`

| Feature | Detail |
|---------|--------|
| Order type toggle | Market / Limit (pill buttons) |
| Amount input | Number input with label |
| Limit price input | Conditional — only shown when `orderType === "limit"` |
| Buy button | Calls `handleTrade("buy")` — currently **toast-only** (no DB write) |
| Sell button | Calls `handleTrade("sell")` — currently **toast-only** (no DB write) |

**⚠️ LIMITATION**: TradeModal does NOT persist trades to any database table. It shows a success toast only. A `trades` table would need to be created for real trade logging.

### C. CreatePlanModal (`src/components/wealth/CreatePlanModal.tsx`, 172 lines)

**Trigger**: `showCreatePlan === true && selectedPairForPlan !== null`

| Feature | Detail |
|---------|--------|
| Timeframe selector | 4 options: 1 Month, 3 Months, 6 Months, 1 Year (card grid) |
| Entry price | Number input (pre-filled with `currentPrice` if available) |
| Target price | Number input |
| Stop loss | Number input (optional) |
| Strategy notes | Textarea |
| Potential gain | Computed: `((target - entry) / entry) * 100` (shown in real-time) |
| Create | `createPlan.mutateAsync()` → inserts into `trading_plans` |

### D. HeaderCustomizationModal (`src/components/wealth/HeaderCustomizationModal.tsx`, 153 lines)

See [Section 7](#7-ui-interaction-points--header--banner) for details.

---

## 17. Secondary View: WealthDashboard (Full Dashboard)

**File**: `src/components/wealth/WealthDashboard.tsx` (235 lines)
**Status**: **Currently NOT rendered** in the primary route. It exists as a separate component.

### Features:
- Customizable card visibility (show/hide per card)
- Customizable card order (drag-to-reorder)
- 11 modular widget cards
- Trading plan modal integration
- Quote rotation (30s interval)

### Widget Cards (WealthDashboard):

| ID | Widget Component | File |
|----|-----------------|------|
| `investments` | InvestmentHero + PortfolioOverview + HoldingsSection + WatchlistSection | Multiple files in `src/components/wealth/` |
| `summary` | SummaryCards | `SummaryCards.tsx` |
| `credit-score` | CreditScoreWheel | `CreditScoreWheel.tsx` |
| `savings-progress` | SavingsProgress | `SavingsProgress.tsx` |
| `net-worth` | NetWorthHero | `NetWorthHero.tsx` |
| `debt` | DebtOverview | `DebtOverview.tsx` |
| `spending` | SpendingSection | `SpendingSection.tsx` |
| `budget` | BudgetEnvelopes | `BudgetEnvelopes.tsx` |
| `bills` | BillsCalendar | `BillsCalendar.tsx` |
| `subscriptions` | SubscriptionsSection | `SubscriptionsSection.tsx` |
| `savings-goals` | SavingsSection | `SavingsSection.tsx` |

### Stitch AI Integration:
- This component is ideal for AI-driven dashboard customization ("Show me my most important metrics")
- AI could auto-arrange cards based on financial priorities

---

## 18. Visual System & Theming

### Glass Morphism Style (shared constant):
```typescript
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.3)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 24,
};
```

### Color System:
| Element | Color | Usage |
|---------|-------|-------|
| Primary accent | `#6366F1` (Indigo) | Buttons, progress bars, edit pencils |
| Income | `#10B981` (Emerald) | Income icon, positive values |
| Expenses | `#EF4444` (Red) | Expense icon, bill amounts |
| Net | `#3B82F6` (Blue) | Net income icon |
| Debt | `#F59E0B` (Amber) | Debt icon, warning states |
| Credit Excellent | `#10B981` | ≥750 |
| Credit Good | `#3B82F6` | ≥700 |
| Credit Fair | `#F59E0B` | ≥650 |
| Credit Poor | `#EF4444` | <650 |

### Animation:
- All cards use `framer-motion` `initial={{ opacity: 0, y: 16 }}` → `animate={{ opacity: 1, y: 0 }}`
- Staggered delays: 0, 0.05, 0.1, 0.15, 0.2, 0.25
- Savings progress bar animates width over 1s with `easeOut`

### Typography:
- Card labels: `text-xs font-semibold text-slate-500 uppercase tracking-wider`
- Values: `text-lg font-bold text-slate-900` (desktop) / `text-2xl font-bold` (hero)
- Section titles: `text-base font-bold text-slate-900`

---

## 19. State Management Patterns

### 1. Hover-to-Edit Pattern
Used for: Income, Credit Score, Debt cards
```
[Display] → hover → [Pencil appears] → click → [Input mode] → Enter/✓ → [Save to DB] → [Display]
                                                                  Escape → [Cancel] → [Display]
```

### 2. Modal Pattern
Used for: Trading pairs, plans, trades, header customization
```
[Button click] → setState(true) → [Modal renders] → [User fills form] → [Submit] → [DB write] → [Close modal]
```

### 3. Conditional Rendering Pattern
Used for: Onboarding vs Main view, Empty states
```
if (!finances?.onboarding_completed) → WealthOnboarding
else → Main dashboard
```

### 4. Computed Values Pattern
Used for: Net income, Savings %, Credit label
```
expenses (from DB) → reduce to total → compute net = income - total
savings/goal → compute percentage → render progress bar
```

---

## 20. Stitch AI Integration Points

### Priority 1: Financial Insights Engine
**Where**: Below the header or as a collapsible card
**What**: AI-generated insights based on all financial data
**Data needed**: `user_finances`, `expenses`, `loans`, `trading_plans`
**Example outputs**:
- "Your savings rate is 15%. Increasing to 20% would reach your goal 3 months sooner."
- "You have $142 in bills due this week. Your account balance should cover this."
- "Your BTC position is up 12% — consider taking partial profits."

### Priority 2: Smart Expense Categorization
**Where**: Onboarding Step 3, future "Add Expense" flows
**What**: AI auto-categorizes expenses from description
**Example**: User types "Netflix" → AI suggests category "Subscriptions", frequency "monthly"

### Priority 3: Trading Plan AI Advisor
**Where**: CreatePlanModal — new "AI Suggest" button
**What**: AI suggests entry/target/stop-loss based on asset analysis
**Data needed**: Symbol, current price, timeframe, user risk profile
**Example**: "For AAPL with a 3-month horizon, suggested entry: $178, target: $195, stop: $168 (R:R 1:1.7)"

### Priority 4: Bill Prediction & Alerts
**Where**: Upcoming Bills section
**What**: AI predicts next bill amounts and sends reminders
**Data needed**: `expenses` history, `calendar_events`

### Priority 5: Credit Score Coach
**Where**: Credit Score card — expandable AI tips section
**What**: Personalized credit improvement advice
**Data needed**: `credit_score`, `loans`, `expenses`

### Hook-Up Architecture for Stitch AI:
```typescript
// Suggested edge function: wealth-insights
// Input: { user_id, action: "insights" | "categorize" | "trade_advice" | "predict_bills" | "credit_tips" }
// Uses: Lovable AI (google/gemini-2.5-flash) — no API key needed

const { data: insights } = useQuery({
  queryKey: ["wealth-insights", user?.id],
  queryFn: async () => {
    const { data } = await supabase.functions.invoke("wealth-insights", {
      body: {
        action: "insights",
        finances: { monthly_income, total_debt, credit_score, savings_goal, current_savings },
        expenses: expenses?.slice(0, 20),
        activePlans: activePlans?.length,
      },
    });
    return data;
  },
  staleTime: 300000, // 5 min cache
});
```

---

## 21. Known Issues & Edge Cases

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Default watchlist buttons non-functional | 🔴 High | WealthTrackerPage L361-362 | Trade/Plan buttons on default watchlist (when no custom pairs) have no `onClick` — they do nothing |
| Mobile FAB self-navigates | 🟡 Medium | WealthTrackerPage L784 | FAB navigates to `/finance/wealth` (same page) instead of opening an action menu |
| TradeModal no persistence | 🟡 Medium | TradeModal.tsx L19-28 | Trade orders show toast but aren't saved to any database table |
| WealthDashboard orphaned | 🟠 Low | WealthDashboard.tsx | Full dashboard component exists but isn't rendered anywhere in current routing |
| Price data shows "—" | 🟡 Medium | WealthTrackerPage L332 | Custom pairs don't fetch live prices — table shows `—` for all custom pair prices |
| addBillOpen state unused | 🟢 Info | WealthTrackerPage L61 | State variable declared but never used |
| Hardcoded sample data | 🟢 Info | WealthTrackerPage L480-551 | Desktop empty states show hardcoded bills/subscriptions that aren't flagged as samples |
| Savings "monthly" hardcoded | 🟢 Info | WealthTrackerPage L393 | Monthly savings estimate uses hardcoded 20% of income, not user-configurable |
| Credit "Full Report" self-links | 🟢 Info | WealthTrackerPage L226-231 | "Full Report" button navigates to `/finance/wealth` (same page) |

---

## File Index

| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/WealthTrackerPage.tsx` | 821 | Primary Money tab page |
| `src/components/wealth/WealthDashboard.tsx` | 235 | Secondary full dashboard (unused) |
| `src/components/wealth/WealthOnboarding.tsx` | 569 | First-time setup wizard |
| `src/components/wealth/TradeModal.tsx` | 127 | Trade order modal |
| `src/components/wealth/CreatePlanModal.tsx` | 172 | Trading plan creator |
| `src/components/wealth/AddPairModal.tsx` | 112 | Add trading pair picker |
| `src/components/wealth/HeaderCustomizationModal.tsx` | 153 | Header color/photo editor |
| `src/components/wealth/ActiveTradingPlans.tsx` | 77 | Active plans display |
| `src/components/wealth/LiveChart.tsx` | — | TradingView-style chart |
| `src/components/wealth/CreditScoreWheel.tsx` | — | Standalone credit gauge |
| `src/components/wealth/SummaryCards.tsx` | — | Financial summary cards |
| `src/components/wealth/SavingsProgress.tsx` | — | Savings progress widget |
| `src/components/wealth/NetWorthHero.tsx` | — | Net worth display |
| `src/components/wealth/DebtOverview.tsx` | — | Debt breakdown |
| `src/components/wealth/SpendingSection.tsx` | — | Monthly spending |
| `src/components/wealth/BudgetEnvelopes.tsx` | — | Budget envelope system |
| `src/components/wealth/BillsCalendar.tsx` | — | Bills calendar view |
| `src/components/wealth/SubscriptionsSection.tsx` | — | Subscription manager |
| `src/components/wealth/SavingsSection.tsx` | — | Savings goals |
| `src/hooks/useUserFinances.ts` | 50 | Finance data hook |
| `src/hooks/useExpenses.ts` | 74 | Expenses CRUD hook |
| `src/hooks/useLoans.ts` | — | Loans CRUD hook |
| `src/hooks/useTradingPairs.ts` | 60 | Trading pairs hook |
| `src/hooks/useTradingPlans.ts` | 85 | Trading plans hook |
| `src/hooks/useMarketData.ts` | 70 | Market data (edge fn) |
| `src/hooks/useWealthLayout.ts` | — | Dashboard layout hook |
| `src/hooks/useInvestments.ts` | — | Investments hook |
| `src/hooks/useChildInvestments.ts` | — | Child investments hook |
| `supabase/functions/market-data/index.ts` | — | Market data edge function |

---

*Generated for Stitch AI integration. Last updated: 2026-03-11.*
