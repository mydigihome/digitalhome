

# Digital Home — SaaS Project Management Platform

## Phase 1: Foundation & Authentication

### Supabase Setup
- Connect Lovable Cloud (Supabase) to the project
- Create database schema: `profiles`, `projects`, `tasks` tables with proper types and constraints
- Enable Row Level Security on all tables — users can only access their own data
- Create trigger to auto-create a profile on signup

### Authentication Pages
- **Login page** (`/login`): Email/password form with validation, link to signup and password reset
- **Signup page** (`/signup`): Email, full name, password form with confirmation
- **Password reset** (`/reset-password`): Email input to trigger reset flow
- Protected route wrapper — redirects unauthenticated users to `/login`

---

## Phase 2: Core Layout & Navigation

### App Shell
- Fixed left sidebar with 4 floating glass-morphism bubbles (Home, Calendar, Projects, Settings)
- Bubble hover animations (scale 1.05) and active state styling
- Main content area (max-width 1200px, centered)
- Mobile: hamburger menu replacing sidebar

### Welcome Screen (`/welcome`)
- Shown on first login only
- Fade-in animation with greeting and "Enter Home" glass button
- Navigates to dashboard

---

## Phase 3: Dashboard (`/dashboard`)

### Header
- Dynamic date display and time-based greeting ("Good morning/afternoon/evening, [Name]")
- Momentum Score — circular progress showing task completion percentage

### Widget Grid (2 columns desktop, 1 mobile)
1. **Today Focus** — Top 3 high-priority tasks, due-today count, task checkboxes
2. **Active Projects** — Up to 3 projects with progress bars and status indicators
3. **Quick Stats** — Total projects, total tasks, completed this week
4. **Recent Activity** — Last 5 created/updated tasks with relative timestamps

---

## Phase 4: Projects

### Projects List Page (`/projects`)
- Grid of project cards (3 col desktop, 2 tablet, 1 mobile)
- Each card: name, type badge, task count, progress bar, last updated
- "+ New Project" button

### New Project Modal (3-step wizard)
- **Step 1**: Project name + goal
- **Step 2**: Type selection (Personal/Work/Fitness/Travel) + dates
- **Step 3**: View preference (Kanban/List/Timeline coming soon)
- Animated step transitions, step indicator dots

---

## Phase 5: Project Detail (`/project/:id`)

### Kanban Board (default view)
- 5 columns: Backlog → Ready → In Progress → Review → Done
- Drag-and-drop task cards between columns using @dnd-kit
- Task cards show title, priority dot, due date
- "+ Add task" button per column

### List View
- Tasks grouped by status in collapsible sections
- Checkboxes for completion, inline due dates

### Task Editor (slide-out panel)
- Right panel (400px) with title, description, status dropdown, priority selector, due date picker
- Auto-save drafts to localStorage
- Delete with confirmation dialog
- Save updates to Supabase and refetch

---

## Phase 6: Calendar (`/calendar`)

- Monthly calendar grid view
- Tasks displayed on their due dates, color-coded by priority
- Click a date to create a new task with that due date pre-filled

---

## Phase 7: Settings (`/settings`)

- Edit full name
- Display email (read-only)
- Change password button
- Default view preference selector
- Theme toggle (prepared for dark mode)
- Logout button

---

## Design & UX

- **Color palette**: Apple-inspired — #007AFF primary, clean whites, subtle grays
- **Typography**: System font stack, weights 400–600, no bold decorative fonts
- **Animations**: Framer Motion for page transitions, modal steps, panel slides — all 200–300ms ease-in-out
- **Loading states**: Skeleton screens for all async data
- **Error handling**: Toast notifications via sonner, empty states with CTAs
- **Performance**: React Query for caching, optimistic updates for task status changes

