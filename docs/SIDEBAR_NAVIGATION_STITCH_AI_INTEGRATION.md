# Sidebar Navigation — UI Interaction Map & Stitch AI Integration Guide

> Comprehensive reference for every UI interaction point in the Sidebar Navigation and Mobile Tab Bar, including component hierarchy, data flows, state management, and recommended Stitch AI hook-up points.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [Data Layer — Hooks & State](#3-data-layer--hooks--state)
4. [Database Schema (Relevant Tables)](#4-database-schema-relevant-tables)
5. [UI Interaction Points — Desktop Sidebar](#5-ui-interaction-points--desktop-sidebar)
6. [UI Interaction Points — Profile Menu](#6-ui-interaction-points--profile-menu)
7. [UI Interaction Points — Navigation Items](#7-ui-interaction-points--navigation-items)
8. [UI Interaction Points — Finance Sub-Menu](#8-ui-interaction-points--finance-sub-menu)
9. [UI Interaction Points — Mobile Tab Bar](#9-ui-interaction-points--mobile-tab-bar)
10. [UI Interaction Points — Mobile "More" Menu](#10-ui-interaction-points--mobile-more-menu)
11. [UI Interaction Points — Mobile Hamburger Drawer](#11-ui-interaction-points--mobile-hamburger-drawer)
12. [UI Interaction Points — Floating Journal Cloud](#12-ui-interaction-points--floating-journal-cloud)
13. [UI Interaction Points — Announcement Banner](#13-ui-interaction-points--announcement-banner)
14. [Visual System & Theming](#14-visual-system--theming)
15. [Stitch AI Integration Points](#15-stitch-ai-integration-points)
16. [State Management Patterns](#16-state-management-patterns)

---

## 1. Architecture Overview

The navigation system is implemented in `src/components/AppShell.tsx` — a layout wrapper used by every authenticated page. It provides:

- **Desktop:** A fixed left sidebar (240px, collapsible to 60px) with profile menu, nav items, and expandable sub-sections.
- **Mobile:** A fixed bottom tab bar (5 tabs) with a "More" overflow menu, plus a hamburger drawer for full navigation access.
- **Global:** A floating journal cloud button (bottom-right) and an announcement banner (top).

| Platform | Component | Breakpoint |
|----------|-----------|------------|
| Desktop Sidebar | `SidebarNav` + sidebar wrapper | `lg:` (≥1024px) |
| Mobile Tab Bar | `MobileTabBar` | `< lg` (hidden on desktop) |
| Mobile Drawer | Hamburger menu overlay | `< lg` (triggered by Menu icon) |
| Floating Journal | `FloatingCloud` | All viewports |
| Announcement | `AnnouncementBanner` | All viewports |

**File:** `src/components/AppShell.tsx` (~555 lines)

---

## 2. Component Hierarchy

```
src/components/AppShell.tsx (default export: AppShell)
├── AnnouncementBanner
│   └── Reads from `announcements` table
├── Desktop Sidebar (hidden on mobile via lg: prefix)
│   ├── Logo Area
│   │   ├── "Digital Home" text (expanded) / collapsed icon
│   │   ├── TrialBadge
│   │   └── Collapse toggle button (ChevronLeft/ChevronRight)
│   ├── SidebarNav
│   │   ├── NavItem: Home → /dashboard
│   │   ├── NavItem: Projects → /projects
│   │   ├── Finance (expandable)
│   │   │   ├── Money (parent) → /finance/wealth
│   │   │   └── Applications (child) → /finance/applications
│   │   ├── NavItem: Mail → /inbox
│   │   ├── NavItem: Content Planner → /vision
│   │   └── NavItem: Admin → /admin (conditional: super_admin only)
│   └── NotionProfileMenu (bottom of sidebar)
│       ├── Avatar + name + email
│       └── Popup menu: Settings, Feedback, Log out
├── Mobile Header Bar (visible on < lg)
│   ├── Hamburger Menu button
│   ├── "Digital Home" title + TrialBadge
│   └── Profile avatar button → same popup
├── Mobile Drawer (AnimatePresence overlay)
│   ├── Close button
│   ├── SidebarNav (reused)
│   └── NotionProfileMenu (reused)
├── MobileTabBar (fixed bottom, < lg)
│   ├── Tab: Home → /dashboard
│   ├── Tab: Projects → /projects
│   ├── Tab: Money → /finance/wealth
│   ├── Tab: Inbox → /inbox
│   └── Tab: More → overflow menu
│       ├── Content Planner → /vision
│       └── Settings → /settings
├── FloatingCloud (bottom-right)
│   └── Opens JournalEntryModal
├── JournalEntryModal
└── ContentWrapper
    └── {children} (page content)
```

---

## 3. Data Layer — Hooks & State

### Read Hooks (queries)

| Hook | File | Returns | Used By |
|------|------|---------|---------|
| `useAuth()` | `src/hooks/useAuth.tsx` | `{ user, profile, signOut }` | Profile menu, admin check |
| `useUserPreferences()` | `src/hooks/useUserPreferences.ts` | `user_preferences` row | Icon colors, profile photo, trial info |
| `useWaitingCount()` | `src/hooks/useGmail.ts` | `number` (unread waiting threads) | Mail badge count |

### Database Queries (inline)

| Query | Table | Purpose | Location |
|-------|-------|---------|----------|
| Admin role check | `user_roles` | Check if user has `super_admin` role | `SidebarNav` useEffect |

### Local State

| State Variable | Type | Initial | Purpose |
|---------------|------|---------|---------|
| `collapsed` | `boolean` | `false` | Desktop sidebar collapse state |
| `mobileOpen` | `boolean` | `false` | Mobile hamburger drawer open/close |
| `journalOpen` | `boolean` | `false` | Journal modal visibility |
| `financeOpen` | `boolean` | Derived from route | Finance sub-menu expanded state |
| `open` (ProfileMenu) | `boolean` | `false` | Profile popup visibility |
| `moreOpen` (MobileTabBar) | `boolean` | `false` | "More" overflow menu visibility |

---

## 4. Database Schema (Relevant Tables)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Matches auth.users.id |
| full_name | TEXT | Displayed in profile menu |
| founding_member | BOOLEAN | Badge indicator |

### `user_preferences`
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | Foreign key |
| profile_photo | TEXT | Avatar URL in sidebar |
| accent_colors | JSONB | Custom icon tint colors `{ icon_colors: { home: "#hex", ... } }` |
| is_subscribed | BOOLEAN | Pro badge |
| trial_start_date | TIMESTAMPTZ | Trial badge logic |
| trial_end_date | TIMESTAMPTZ | Trial badge logic |
| subscription_type | TEXT | "free", "pro", etc. |

### `user_roles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| user_id | UUID | References auth.users |
| role | app_role enum | "student", "main_account", "moderator", "super_admin" |

### `announcements`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| title | TEXT | Banner title |
| message | TEXT | Banner content |
| is_active | BOOLEAN | Controls visibility |
| target_roles | TEXT[] | Role-based targeting |
| expires_at | TIMESTAMPTZ | Auto-expire |

### `tracked_threads` (for mail badge)
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | |
| status | TEXT | "waiting" status drives badge count |

---

## 5. UI Interaction Points — Desktop Sidebar

### Sidebar Container
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Collapse sidebar | ChevronLeft button (top) | `setCollapsed(true)` | Local state → sidebar width transitions from 240px to 60px |
| Expand sidebar | ChevronRight button (top) | `setCollapsed(false)` | Local state → sidebar width transitions from 60px to 240px |

### Layout Behavior
- **Width:** 240px (expanded) / 60px (collapsed) — controlled via Tailwind `lg:w-[240px]` / `lg:w-[60px]`
- **Position:** Fixed left (`lg:fixed lg:inset-y-0`)
- **Content offset:** Main content uses matching `lg:pl-[240px]` / `lg:pl-[60px]`
- **Transition:** `transition-all duration-200`
- **Background:** `bg-card` with `border-r border-border`

### Logo Area
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| — | "Digital Home" text | Read-only | Visible when expanded |
| — | TrialBadge | Read-only | Shows trial/founding status from `useAuth()` + `useUserPreferences()` |

---

## 6. UI Interaction Points — Profile Menu

**Component:** `NotionProfileMenu` (inline in AppShell.tsx)

### Display Elements
| Element | Source | Collapsed Behavior |
|---------|--------|-------------------|
| Avatar (32×32 rounded-md) | `prefs?.profile_photo` or initials fallback | Always visible |
| Full name | `profile?.full_name` or email prefix | Hidden when collapsed |
| Email | `user?.email` | Hidden when collapsed |
| Chevron indicator | — | Hidden when collapsed |

### Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Open menu | Profile row click | `setOpen(!open)` | Local state toggle |
| Close menu | Click outside | `useEffect` mousedown listener | Closes popup |
| Go to Settings | "Settings" button | `navigate("/settings")` | React Router |
| Go to Feedback | "Feedback" button | `navigate("/settings?tab=support")` | React Router with query param |
| Log out | "Log out" button | `signOut()` → `navigate("/login")` | Supabase auth signOut + redirect |

### Popup Animation
```typescript
initial={{ opacity: 0, y: 4, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 4, scale: 0.95 }}
transition={{ duration: 0.15 }}
```

**🤖 Stitch AI Hook Point:** The profile menu popup could include a "Daily Briefing" AI-generated summary card showing today's top priorities, overdue items, and suggested focus areas. Stitch could generate this on popup open.

---

## 7. UI Interaction Points — Navigation Items

**Component:** `SidebarNav` → `NavItem` sub-component

### Route Configuration

| Nav Item | Icon | Route | Color Key | Active Detection |
|----------|------|-------|-----------|-----------------|
| Home | `Home` | `/dashboard` | `home` (#8B5CF6) | `pathname.startsWith("/dashboard")` |
| Projects | `FolderOpen` | `/projects` | `projects` (#F59E0B) | `pathname.startsWith("/projects")` or `/project/` |
| Money | `DollarSign` | `/finance/wealth` | `finance` (#10B981) | `pathname.startsWith("/finance")` |
| Mail | `Mail` | `/inbox` | `inbox` (#7C3AED) | `pathname.startsWith("/inbox")` |
| Content Planner | `Sparkles` | `/vision` | `vision` (#EC4899) | `pathname.startsWith("/vision")` |
| Admin | `Shield` | `/admin` | `home` (fallback) | `pathname === "/admin"` (super_admin only) |

### NavItem Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Navigate | Button click | `go(path)` → `navigate(path)` | React Router navigation |
| — (on mobile) | Button click | `go(path)` → also calls `onNavigate?.()` | Closes mobile drawer after nav |

### NavItem Styling
```
Active:   bg-accent text-accent-foreground shadow-xs
Inactive: text-muted-foreground hover:bg-secondary hover:text-foreground
Font:     text-[13px] font-medium tracking-tight
Spacing:  gap-3 rounded-lg px-3 py-2
```

### IconBubble System
Each nav item icon is wrapped in `IconBubble`:
- **Container:** `rounded-lg`, width/height = iconSize + 8px
- **Background tint:** Icon color at 7% opacity (`${color}12`)
- **Icon:** `strokeWidth: 1.75`, custom color from preferences or defaults
- **Hover:** `group-hover:scale-105` with `transition-all duration-200`

### Custom Icon Colors
Users can override default icon colors via `user_preferences.accent_colors`:
```typescript
const iconColors = (prefs?.accent_colors as any)?.icon_colors || {};
const getIconColor = (key: string) => iconColors[key] || defaultIconColors[key] || "#6B7280";
```

### Mail Badge
| Element | Source | Display Logic |
|---------|--------|--------------|
| Amber badge (pill) | `useWaitingCount()` | Shows only when `waitingCount > 0` |
| Badge style | — | `bg-amber-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5` |

**🤖 Stitch AI Hook Point:** Stitch could add contextual indicators next to nav items — e.g., a small dot on "Projects" when there are overdue tasks, a pulse on "Mail" when priority emails arrive, or a streak flame on "Home" for consecutive productive days.

---

## 8. UI Interaction Points — Finance Sub-Menu

### Expandable Section
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Toggle sub-menu | "Money" button click | `setFinanceOpen(!financeOpen)` | Local state; if not on finance route, also navigates to `/finance/wealth` |
| Navigate to Wealth | "Money" click (when collapsed) | `go("/finance/wealth")` | Direct navigation (no expand) |
| Navigate to Applications | "Applications" sub-item click | `go("/finance/applications")` | React Router navigation |

### Sub-Menu Animation
```typescript
initial={{ height: 0, opacity: 0 }}
animate={{ height: "auto", opacity: 1 }}
exit={{ height: 0, opacity: 0 }}
transition={{ duration: 0.2 }}
```

### Sub-Menu Styling
- Parent chevron rotates 180° when open
- Child items indented with `pl-10`
- Child uses `IconBubble` with `size={16}` (slightly smaller)

**🤖 Stitch AI Hook Point:** Stitch could add smart sub-items dynamically — e.g., if the user has active investments, show an "Investments" sub-item with a gain/loss indicator. AI could surface the most relevant finance sub-sections based on user activity patterns.

---

## 9. UI Interaction Points — Mobile Tab Bar

**Component:** `MobileTabBar` (inline in AppShell.tsx)

### Tab Configuration

| Tab | Icon | Route | Active Detection |
|-----|------|-------|-----------------|
| Home | `Home` | `/dashboard` | `pathname.startsWith("/dashboard")` |
| Projects | `FolderOpen` | `/projects` | `/projects` or `/project/` |
| Money | `DollarSign` | `/finance/wealth` | `/finance` prefix |
| Inbox | `Mail` | `/inbox` | `/inbox` prefix |
| More | `MoreHorizontal` | — (popup) | Any of: `/vision`, `/settings` |

### Tab Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Navigate | Tab button click | `navigate(path)` | React Router |
| Active indicator | Motion div | `layoutId="tab-indicator"` | Spring animation (stiffness: 400, damping: 30) |

### Visual Details
- **Position:** Fixed bottom (`fixed bottom-0 left-0 right-0 z-50`)
- **Hidden on desktop:** `lg:hidden`
- **Safe area:** `paddingBottom: env(safe-area-inset-bottom, 0px)` for iPhone notch
- **Background:** `bg-card/95 backdrop-blur-xl border-t border-border`
- **Active state:** Icon gets custom color + `strokeWidth: 2` (vs 1.5 inactive)
- **Active indicator:** 2px tall, 32px wide primary-colored bar at top of tab

**🤖 Stitch AI Hook Point:** The mobile tab bar could feature a smart badge system where Stitch highlights the tab most relevant to the user's current context — e.g., pulsing "Money" on bill due dates, or showing a task count badge on "Projects" for items due today.

---

## 10. UI Interaction Points — Mobile "More" Menu

### Overflow Items
| Item | Icon | Route |
|------|------|-------|
| Content Planner | `Sparkles` | `/vision` |
| Settings | `Settings` | `/settings` |

### Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Open menu | "More" tab click | `setMoreOpen(!moreOpen)` | Local state toggle |
| Close menu | Click outside | `useEffect` mousedown listener | Closes popup |
| Navigate | Menu item click | `setMoreOpen(false)` → `navigate(path)` | React Router |

### Popup Animation
```typescript
initial={{ opacity: 0, y: 8, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 8, scale: 0.95 }}
transition={{ duration: 0.15 }}
```
- **Position:** Above the tab bar (`absolute bottom-full right-0 mb-2`)
- **Style:** `w-48 rounded-2xl border bg-card p-1.5 shadow-xl`

**🤖 Stitch AI Hook Point:** The "More" menu could include an AI-powered "Quick Actions" section with contextual suggestions based on the current time and user patterns — e.g., "Start evening journal" at night, "Review today's tasks" in the morning.

---

## 11. UI Interaction Points — Mobile Hamburger Drawer

### Trigger
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Open drawer | Menu icon (top-left header) | `setMobileOpen(true)` | Local state |
| Close drawer | X button or backdrop click | `setMobileOpen(false)` | Local state |

### Drawer Content
- Reuses `SidebarNav` component with `onNavigate={() => setMobileOpen(false)}`
- Reuses `NotionProfileMenu` at the bottom
- Full-screen overlay with backdrop blur

### Drawer Animation
```typescript
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 0.3 }}
exit={{ opacity: 0 }}

// Panel
initial={{ x: "-100%" }}
animate={{ x: 0 }}
exit={{ x: "-100%" }}
transition={{ type: "tween", duration: 0.25 }}
```

---

## 12. UI Interaction Points — Floating Journal Cloud

**Component:** `src/components/journal/FloatingCloud.tsx`

| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Open journal | Cloud button click | `setJournalOpen(true)` | Local state in AppShell |
| Close journal | Modal close | `setJournalOpen(false)` | Local state |

### Positioning
- Desktop: `bottom-6 right-6`
- Mobile: `bottom-6 right-4` (above tab bar)

**🤖 Stitch AI Hook Point:** The journal cloud could show a contextual prompt on hover — Stitch could generate a journaling prompt based on the user's day (e.g., "You completed 5 tasks today. How are you feeling about your progress?"). This would use data from `tasks`, `calendar_events`, and `habits` to generate personalized prompts.

---

## 13. UI Interaction Points — Announcement Banner

**Component:** `src/components/AnnouncementBanner.tsx`

| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Dismiss banner | X/close button | Local state or localStorage | Hides banner |
| — | Banner content | Read-only | Reads from `announcements` table |

### Data Query
```typescript
supabase.from("announcements")
  .select("*")
  .eq("is_active", true)
  .order("created_at", { ascending: false })
  .limit(1)
```

**🤖 Stitch AI Hook Point:** Stitch could generate personalized micro-announcements — e.g., "🎉 You've been on a 5-day streak!" or "📊 Your project 'X' is 80% complete — push to finish this week!" These would supplement admin-created announcements with AI-generated motivational nudges.

---

## 14. Visual System & Theming

### Default Icon Color Map
```typescript
const defaultIconColors: Record<string, string> = {
  home: "#8B5CF6",       // Purple
  projects: "#F59E0B",   // Amber
  finance: "#10B981",    // Emerald
  finance_wealth: "#10B981",
  finance_apps: "#3B82F6", // Blue
  calendar: "#3B82F6",
  vision: "#EC4899",     // Pink
  inbox: "#7C3AED",      // Violet
  team: "#6B7280",       // Gray
};
```

### User-Customizable Colors
Users override via `user_preferences.accent_colors.icon_colors`:
```json
{
  "icon_colors": {
    "home": "#FF6B6B",
    "projects": "#4ECDC4",
    "finance": "#45B7D1"
  }
}
```

### Sidebar Design Tokens
| Token | Usage |
|-------|-------|
| `bg-card` | Sidebar background |
| `border-border` | Sidebar right border |
| `bg-accent` / `text-accent-foreground` | Active nav item |
| `bg-secondary` | Hover state |
| `text-muted-foreground` | Inactive text |
| `text-foreground` | Hover/active text |
| `bg-primary` / `text-primary-foreground` | Avatar fallback |
| `text-destructive` / `bg-destructive/10` | Log out button |

### Typography
| Element | Style |
|---------|-------|
| Nav item labels | `text-[13px] font-medium tracking-tight` (Inter) |
| Profile name | `text-sm font-medium` |
| Profile email | `text-xs text-muted-foreground` |
| Mobile tab labels | `text-[10px] font-medium` |
| Logo text | `text-md font-semibold` |

---

## 15. Stitch AI Integration Points

### 15.1 Smart Navigation Badges
**Where:** `NavItem` component, next to label text
**Trigger:** On sidebar render / periodic refresh
**AI Input:** User's tasks, events, habits, mail threads
**AI Output:** Badge indicators (counts, dots, flames)
```
Example: Projects badge showing "3 overdue" | Mail badge showing priority count
```
**Implementation:** Create an edge function `navigation-insights` that returns badge data per nav item. Cache for 5 minutes. Display as small indicators.

### 15.2 Contextual Daily Briefing
**Where:** Profile menu popup (new section above Settings)
**Trigger:** On profile menu open
**AI Input:** Today's calendar, due tasks, habit streaks, recent journal mood
**AI Output:** 2-3 sentence personalized briefing
```
"Good morning! You have 3 meetings today and 5 tasks due. Your coding streak is at 7 days 🔥"
```
**Implementation:** Edge function `daily-briefing` called on popup open. Render as a card at the top of the popup.

### 15.3 Smart "More" Suggestions (Mobile)
**Where:** Mobile "More" overflow menu
**Trigger:** On menu open
**AI Input:** Time of day, recent activity patterns, incomplete items
**AI Output:** 1-2 contextual quick action suggestions
```
Evening: "Start tonight's journal entry"
Morning: "Review today's 4 tasks"
```
**Implementation:** Add a "Suggested" section to the More menu. Call edge function `context-suggestions` on open.

### 15.4 Personalized Journal Prompts
**Where:** Floating cloud button tooltip/hover
**Trigger:** On hover or after 30s idle
**AI Input:** Day's completed tasks, calendar events, mood trends
**AI Output:** One personalized journal prompt
```
"You finished your project milestone today. How does it feel to be ahead of schedule?"
```
**Implementation:** Edge function `journal-prompt` with daily caching. Show as tooltip on cloud hover.

### 15.5 Navigation Pattern Learning
**Where:** Backend analytics
**Trigger:** On each navigation event
**AI Input:** Historical navigation patterns, time-of-day correlations
**AI Output:** Optimized nav item ordering or pinned shortcuts
```
If user always goes to Mail first thing → surface Mail higher on mobile
```
**Implementation:** Track nav events in a `navigation_events` table. Periodic AI analysis to suggest personalized nav ordering.

### 15.6 Smart Announcement Generation
**Where:** `AnnouncementBanner` component
**Trigger:** On app load (if no admin announcement active)
**AI Input:** User progress data, streaks, milestones
**AI Output:** Personalized motivational micro-announcement
```
"🎯 You're 2 tasks away from completing Project Alpha!"
```
**Implementation:** Edge function `smart-announcements` that generates user-specific banners. Separate from admin announcements table.

---

## 16. State Management Patterns

### Navigation State Flow
```
URL Change → useLocation() → Active state computation → NavItem re-render
                                                      → MobileTabBar re-render
```

### Sidebar Collapse State Flow
```
Toggle button → setCollapsed(!collapsed) → Sidebar width class change
                                         → Main content padding change
                                         → NavItem text show/hide
                                         → ProfileMenu text show/hide
```

### Mobile Drawer State Flow
```
Hamburger click → setMobileOpen(true) → Overlay + drawer animate in
Nav item click → onNavigate() → setMobileOpen(false) → Drawer animates out
Backdrop click → setMobileOpen(false) → Drawer animates out
```

### Admin Check Flow
```
useEffect (on user change) → supabase query user_roles
  → filter: user_id = current, role = "super_admin"
  → setIsAdmin(!!data)
  → Conditional render of Admin nav item
```

### Icon Color Resolution
```
User preferences loaded → Extract accent_colors.icon_colors
  → getIconColor(key): user override || defaultIconColors[key] || "#6B7280"
  → IconBubble renders with resolved color
```

### Mail Badge Flow
```
useWaitingCount() → Queries tracked_threads where status = "waiting"
  → Returns count
  → NavItem renders amber badge if count > 0
```

---

## Appendix: File References

| File | Purpose |
|------|---------|
| `src/components/AppShell.tsx` | Main layout wrapper (sidebar, tab bar, drawer, journal cloud) |
| `src/components/AnnouncementBanner.tsx` | Top banner component |
| `src/components/journal/FloatingCloud.tsx` | Floating journal button |
| `src/components/journal/JournalEntryModal.tsx` | Journal modal |
| `src/components/TrialBadge.tsx` | Trial/founding member badge |
| `src/components/NavLink.tsx` | Route-aware link component |
| `src/hooks/useAuth.tsx` | Auth context (user, profile, signOut) |
| `src/hooks/useUserPreferences.ts` | User preferences CRUD |
| `src/hooks/useGmail.ts` | Gmail integration + waiting count |
