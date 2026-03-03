# Dashboard (Home Screen) — UI Interaction Map & Stitch AI Integration Guide

> Comprehensive reference for every UI interaction point on the Dashboard/Home screen, including component hierarchy, data flows, mutation hooks, and recommended Stitch AI hook-up points.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [Data Layer — Hooks & Mutations](#3-data-layer--hooks--mutations)
4. [Database Schema (Relevant Tables)](#4-database-schema-relevant-tables)
5. [UI Interaction Points — Header & Quick Actions](#5-ui-interaction-points--header--quick-actions)
6. [UI Interaction Points — 90-Day Goal Widget](#6-ui-interaction-points--90-day-goal-widget)
7. [UI Interaction Points — Quick Stats Row](#7-ui-interaction-points--quick-stats-row)
8. [UI Interaction Points — Today's Agenda](#8-ui-interaction-points--todays-agenda)
9. [UI Interaction Points — Active Projects Card](#9-ui-interaction-points--active-projects-card)
10. [UI Interaction Points — Quick To-Dos](#10-ui-interaction-points--quick-to-dos)
11. [UI Interaction Points — Habit Tracker](#11-ui-interaction-points--habit-tracker)
12. [UI Interaction Points — Everyday Links](#12-ui-interaction-points--everyday-links)
13. [UI Interaction Points — Notes & Brain Dumps](#13-ui-interaction-points--notes--brain-dumps)
14. [UI Interaction Points — Journal Entries](#14-ui-interaction-points--journal-entries)
15. [UI Interaction Points — Tutorial / Welcome Video](#15-ui-interaction-points--tutorial--welcome-video)
16. [UI Interaction Points — Modals](#16-ui-interaction-points--modals)
17. [Stitch AI Integration Points](#17-stitch-ai-integration-points)
18. [State Management Patterns](#18-state-management-patterns)

---

## 1. Architecture Overview

The Dashboard is the authenticated user's home screen (`/dashboard`). It aggregates data from multiple domains (projects, tasks, calendar, habits, notes, journal, finances) into a single scrollable view of widgets.

| Section | Component | Primary Data Source |
|---------|-----------|-------------------|
| Page Header | `PageHeader` | `user_preferences` (icon, cover) |
| Welcome Bar | Inline in `Dashboard` | `profiles` (full_name) |
| 90-Day Goal | `NinetyDayGoalWidget` | `ninety_day_goals`, `goal_check_ins` |
| Quick Stats | Inline in `Dashboard` | `projects`, `tasks` (computed) |
| Today's Agenda | `YourDayAgenda` | `calendar_events`, `tasks`, `expenses`, `wealth_goals` |
| Active Projects | Inline in `Dashboard` | `projects`, `tasks` (computed) |
| Quick To-Dos | `QuickTodosWidget` | `quick_todos` |
| Habit Tracker | `HabitTrackerWidget` | `habits`, `habit_logs` |
| Everyday Links | Inline in `Dashboard` | Local state (not persisted) |
| Notes & Brain Dumps | `NotesWidget` | `notes`, `brain_dumps` |
| Journal | `JournalEntriesList` | `journal_entries` |
| Tutorial Modal | Inline in `Dashboard` | `user_preferences` (welcome_video_watched) |

**Route:** `/dashboard` → `src/pages/Dashboard.tsx`

---

## 2. Component Hierarchy

```
src/pages/Dashboard.tsx
├── AppShell (sidebar + layout wrapper)
├── PageHeader (editable icon + cover image)
├── Welcome Bar
│   ├── Greeting text (time-of-day + profile name)
│   ├── Current date & time (live clock, updates every 60s)
│   └── Quick Add Buttons: [Note] [Task] [Project]
├── NinetyDayGoalWidget (full-width)
├── Quick Stats Row (4-column grid)
│   ├── Momentum % card
│   ├── Completed tasks card
│   ├── In Progress tasks card
│   └── Active Projects card
├── Main Widget Grid (3-column on lg)
│   ├── Left (col-span-2)
│   │   └── YourDayAgenda
│   │       ├── Calendar events (today)
│   │       ├── Due tasks (today, top 5)
│   │       ├── Money reminders (bills < $100)
│   │       ├── Goal deadlines
│   │       └── Last-minute quick tasks (localStorage)
│   ├── Right (col-span-1)
│   │   ├── Active Projects card
│   │   │   └── Project rows with progress bars
│   │   ├── QuickTodosWidget
│   │   │   └── Supabase-backed todo list with drag reorder
│   │   └── HabitTrackerWidget
│   │       └── Pie chart + habit log editing
│   ├── Full-width (col-span-3)
│   │   ├── Everyday Links (editable link grid)
│   │   ├── BrainDumpWidget (no-op, unified into NotesWidget)
│   │   ├── JournalEntriesList
│   │   └── NotesWidget (unified notes + brain dumps)
├── NewProjectModal
├── NoteEditor modal
├── TaskEditor modal
├── Tutorial prompt modal
└── Video player modal
```

---

## 3. Data Layer — Hooks & Mutations

### Read Hooks (queries)

| Hook | File | Returns | Used By |
|------|------|---------|---------|
| `useAuth()` | `src/hooks/useAuth.tsx` | `{ profile, user, session }` | Greeting, user context |
| `useProjects()` | `src/hooks/useProjects.ts` | `projects[]` | Active Projects card, stats |
| `useAllTasks()` | `src/hooks/useTasks.ts` | `tasks[]` (all user tasks) | Stats, Agenda |
| `useUserPreferences()` | `src/hooks/useUserPreferences.ts` | `user_preferences` row | PageHeader, theme, tutorial |
| `useActiveGoal()` | `src/hooks/useNinetyDayGoals.ts` | Active 90-day goal | NinetyDayGoalWidget |
| `useGoalHistory()` | `src/hooks/useNinetyDayGoals.ts` | Past goals | NinetyDayGoalWidget |
| `useTodayEvents()` | `src/hooks/useCalendarEvents.ts` | Today's calendar events | YourDayAgenda |
| `useExpenses()` | `src/hooks/useExpenses.ts` | All expenses | YourDayAgenda (money reminders) |
| `useWealthGoals()` | `src/hooks/useWealthGoals.ts` | Wealth goals | YourDayAgenda (deadlines) |
| `useQuickTodos()` | `src/hooks/useQuickTodos.ts` | `quick_todos[]` | QuickTodosWidget |
| `useHabits()` | `src/hooks/useHabits.ts` | `habits[]` | HabitTrackerWidget |
| `useHabitLogs()` | `src/hooks/useHabits.ts` | Current week logs | HabitTrackerWidget |
| `useAllHabitLogs()` | `src/hooks/useHabits.ts` | All habit logs | HabitTrackerWidget |
| `useNotes()` | `src/hooks/useNotes.ts` | `notes[]` | NotesWidget |
| `useBrainDumps()` | `src/hooks/useBrainDumps.ts` | `brain_dumps[]` | NotesWidget |

### Mutation Hooks (writes)

| Hook | File | Action | Used By |
|------|------|--------|---------|
| `useUpsertPreferences()` | `src/hooks/useUserPreferences.ts` | Upsert user_preferences | PageHeader, tutorial dismiss |
| `useCreateGoal()` | `src/hooks/useNinetyDayGoals.ts` | Create 90-day goal | NinetyDayGoalWidget |
| `useUpdateGoal()` | `src/hooks/useNinetyDayGoals.ts` | Update goal text/style | NinetyDayGoalWidget |
| `useUpdateTask()` | `src/hooks/useTasks.ts` | Toggle task status | YourDayAgenda |
| `useDeleteCalendarEvent()` | `src/hooks/useCalendarEvents.ts` | Delete calendar event | YourDayAgenda |
| `useAddQuickTodo()` | `src/hooks/useQuickTodos.ts` | Add quick todo | QuickTodosWidget |
| `useUpdateQuickTodo()` | `src/hooks/useQuickTodos.ts` | Toggle/edit quick todo | QuickTodosWidget |
| `useDeleteQuickTodo()` | `src/hooks/useQuickTodos.ts` | Delete quick todo | QuickTodosWidget |
| `useCreateHabit()` | `src/hooks/useHabits.ts` | Add custom habit | HabitTrackerWidget |
| `useUpdateHabit()` | `src/hooks/useHabits.ts` | Rename habit | HabitTrackerWidget |
| `useDeleteHabit()` | `src/hooks/useHabits.ts` | Remove habit | HabitTrackerWidget |
| `useLogHabitHours()` | `src/hooks/useHabits.ts` | Log hours for habit | HabitTrackerWidget |
| `useUpdateHabitLog()` | `src/hooks/useHabits.ts` | Edit logged hours | HabitTrackerWidget |
| `useDeleteHabitLog()` | `src/hooks/useHabits.ts` | Remove logged hours | HabitTrackerWidget |
| `useDeleteNote()` | `src/hooks/useNotes.ts` | Delete note | NotesWidget |
| `useReorderNotes()` | `src/hooks/useNotes.ts` | Drag-reorder notes | NotesWidget |

---

## 4. Database Schema (Relevant Tables)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Matches auth.users.id |
| full_name | TEXT | Displayed in greeting |
| founding_member | BOOLEAN | Badge indicator |
| user_number | INTEGER | Sequential user number |
| last_login | TIMESTAMPTZ | Tracked on sign-in |

### `user_preferences`
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | Foreign key |
| dashboard_icon | TEXT | Emoji or image URL |
| dashboard_icon_type | TEXT | "emoji" or "image" |
| dashboard_cover | TEXT | Cover image URL |
| dashboard_cover_type | TEXT | "none", "color", "image" |
| home_name | TEXT | Custom home name |
| home_style | TEXT | Home door style |
| welcome_video_url | TEXT | Tutorial video URL |
| welcome_video_watched | BOOLEAN | Controls tutorial prompt |
| is_subscribed | BOOLEAN | Pro status |
| subscription_type | TEXT | "free", "pro", etc. |
| theme_color | TEXT | Accent color hex |
| onboarding_completed | BOOLEAN | Onboarding flag |

### `quick_todos`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| user_id | UUID | |
| text | TEXT | Todo content |
| completed | BOOLEAN | Completion status |
| order | INTEGER | Sort position |

### `habits` + `habit_logs`
| Table | Key Columns |
|-------|-------------|
| `habits` | id, user_id, name, is_custom |
| `habit_logs` | id, habit_id, user_id, hours, week_start_date |

### `ninety_day_goals` + `goal_check_ins`
| Table | Key Columns |
|-------|-------------|
| `ninety_day_goals` | id, user_id, goal_text, start_date, end_date, status, display_style, font_style, text_color, motivational_style, display_format, weekly_checkins |
| `goal_check_ins` | id, goal_id, user_id, progress_percentage, notes, check_in_date |

### `calendar_events`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| user_id | UUID | |
| title | TEXT | Event name |
| start_time | TIMESTAMPTZ | Event start |
| end_time | TIMESTAMPTZ | Event end |
| all_day | BOOLEAN | All-day flag |
| source | TEXT | "local" or "google" |
| color | TEXT | Visual color |

### `notes` + `brain_dumps`
See types.ts for full schema. Both are merged into `NotesWidget` as `UnifiedItem[]`.

### `journal_entries`
See types.ts. Displayed via `JournalEntriesList` component.

---

## 5. UI Interaction Points — Header & Quick Actions

### PageHeader
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Change dashboard icon | Icon overlay click | `onIconChange(icon, type)` | `upsertPrefs.mutate({ dashboard_icon, dashboard_icon_type })` |
| Change cover image | Cover hover → upload | `onCoverChange(cover, type)` | `upsertPrefs.mutate({ dashboard_cover, dashboard_cover_type })` |

### Greeting Bar
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| — | Greeting text | Read-only | `profile.full_name` + time-of-day logic |
| — | Date/time display | Read-only | `useCurrentTime()` hook, updates every 60s |

### Quick Add Buttons
| Button | Icon | Click Handler | Opens |
|--------|------|--------------|-------|
| "Note" | StickyNote | `setNoteEditorOpen(true)` | `NoteEditor` modal |
| "Task" | Plus | `setTaskEditorOpen(true)` | `TaskEditor` modal (uses first project) |
| "Project" | Plus | `setProjectModalOpen(true)` | `NewProjectModal` |

**🤖 Stitch AI Hook Point:** The "Task" button could trigger an AI-suggested task flow. Stitch could analyze the user's current projects, upcoming deadlines, and habits to suggest prioritized tasks.

---

## 6. UI Interaction Points — 90-Day Goal Widget

**Component:** `src/components/NinetyDayGoalWidget.tsx` (979 lines)

### Core Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Create new goal | Goal input + submit | `createGoal.mutate(...)` | Inserts into `ninety_day_goals` |
| Edit goal text | Pencil icon → inline edit | `updateGoal.mutate(...)` | Updates `ninety_day_goals.goal_text` |
| Change display style | Style picker | `updateGoal.mutate({ display_style })` | Updates countdown theme |
| Change font style | Font selector | `updateGoal.mutate({ font_style })` | Changes font rendering |
| Change text color | Color picker | `updateGoal.mutate({ text_color })` | Changes text color |
| Change motivational style | Style selector | `updateGoal.mutate({ motivational_style })` | Changes quote genre |
| Toggle weekly check-ins | Toggle switch | `updateGoal.mutate({ weekly_checkins })` | Enables/disables check-in reminders |
| View goal history | History icon | Opens history panel | Reads `useGoalHistory()` |
| Expand/collapse | ChevronUp/Down | Local state toggle | — |

### Countdown Themes
The widget supports multiple countdown display themes: `minimal`, `bold`, `flip`, `radial`, `progress`, `emoji`, `calendar`.

**🤖 Stitch AI Hook Point:** When creating a new 90-day goal, Stitch could suggest specific, measurable milestones and auto-generate weekly check-in prompts based on the goal category.

---

## 7. UI Interaction Points — Quick Stats Row

**Location:** Inline in `Dashboard.tsx` (lines 190–230)

| Card | Value | Computation |
|------|-------|-------------|
| Momentum | `{momentumPct}%` | `Math.round((totalDone / totalTasks) * 100)` |
| Completed | `{totalDone}` | `tasks.filter(t => t.status === "done").length` |
| In Progress | `{totalInProgress}` | `tasks.filter(t => t.status === "in_progress").length` |
| Projects | `{activeProjectCount}` | `projects.filter(p => !p.archived).length` |

All cards are **read-only** — no click handlers.

**🤖 Stitch AI Hook Point:** Stitch could add a trend indicator (↑/↓) comparing this week vs. last week's momentum, and surface a motivational nudge when momentum drops below a threshold.

---

## 8. UI Interaction Points — Today's Agenda

**Component:** `src/components/YourDayAgenda.tsx` (361 lines)

### Data Sources
| Section | Hook | Filter Logic |
|---------|------|-------------|
| Calendar events | `useTodayEvents()` | Events where `start_time` is today |
| Due tasks | `useAllTasks()` | Tasks due today or no due date, status ≠ "done", top 5 |
| Money reminders | `useExpenses()` | Recurring expenses (bills, subscriptions) < $100 |
| Goal deadlines | `useWealthGoals()` | Wealth goals with upcoming `due_date` |
| Last-minute tasks | localStorage | Daily ephemeral bullet list |

### Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Toggle task complete | Checkbox | `updateTask.mutate({ id, status: "done" })` | Updates `tasks.status` |
| Delete calendar event | Trash icon | `deleteEvent.mutate(eventId)` | Deletes from `calendar_events` |
| Add last-minute task | Input + Plus | `setQuickTasks([...prev, newTask])` | localStorage (daily key) |
| Delete last-minute task | X icon | `deleteQuickTask(id)` | localStorage |
| Edit last-minute task | Inline input | `updateQuickTask(id, text)` | localStorage |

**🤖 Stitch AI Hook Point:** Stitch could generate a "Smart Day Plan" that sequences today's tasks, events, and goals into an optimal order based on priority, duration estimates, and energy levels. It could also suggest time blocks for deep work.

---

## 9. UI Interaction Points — Active Projects Card

**Location:** Inline in `Dashboard.tsx` (lines 242–300)

### Data
```typescript
const projectsWithStats = projects.map((p) => {
  const ptasks = tasks.filter((t) => t.project_id === p.id);
  const done = ptasks.filter((t) => t.status === "done").length;
  const total = ptasks.length;
  return { ...p, done, total, pending: total - done };
});
const priorityProjects = [...projectsWithStats]
  .sort((a, b) => b.pending - a.pending)
  .slice(0, 4);
```

### Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Navigate to project | Card row click | `navigate(\`/project/${project.id}\`)` | React Router navigation |
| View all projects | "View all" link | `navigate("/projects")` | React Router navigation |
| Create project (empty state) | "Create one" button | `setProjectModalOpen(true)` | Opens NewProjectModal |

### Visual Details
- Each project row shows: color dot, name, percentage, gradient progress bar, task counts
- Progress bar gradient: `project.color → #6366F1`
- Sorted by most pending tasks first, limited to top 4

**🤖 Stitch AI Hook Point:** Stitch could highlight "at-risk" projects (those with upcoming deadlines but low completion rates) and suggest next actions to get back on track.

---

## 10. UI Interaction Points — Quick To-Dos

**Component:** `src/components/QuickTodosWidget.tsx` (137 lines)

### Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Add todo | Input + Enter/Plus | `addTodo.mutate({ text, order })` | Inserts into `quick_todos` |
| Toggle complete | Circle checkbox | `updateTodo.mutate({ id, completed: !completed })` | Updates `quick_todos.completed` |
| Edit text | Inline input (on focus) | `updateTodo.mutate({ id, text })` | Updates `quick_todos.text` |
| Delete todo | Trash icon | `deleteTodo.mutate(id)` | Deletes from `quick_todos` |
| Reorder | Drag handle (GripVertical) | HTML5 drag-and-drop | Updates `quick_todos.order` |

### Display Logic
- Shows uncompleted items first (max 10)
- Completed items shown below with strikethrough
- Drag-and-drop reordering via native HTML5 API

**🤖 Stitch AI Hook Point:** Stitch could offer a "brain dump → structured todos" feature where users type freeform text and AI parses it into discrete, actionable todo items with suggested priority ordering.

---

## 11. UI Interaction Points — Habit Tracker

**Component:** `src/components/HabitTrackerWidget.tsx` (287 lines)

### Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Log hours | Hour input per habit | `logHabitHours.mutate({ habitId, hours, weekStart })` | Inserts into `habit_logs` |
| Edit logged hours | Click on existing log | `updateHabitLog.mutate({ id, hours })` | Updates `habit_logs.hours` |
| Delete log | X on log entry | `deleteHabitLog.mutate(id)` | Deletes from `habit_logs` |
| Add custom habit | "Add Habit" + input | `createHabit.mutate({ name })` | Inserts into `habits` |
| Rename habit | Pencil icon → inline edit | `updateHabit.mutate({ id, name })` | Updates `habits.name` |
| Delete habit | Trash icon | `deleteHabit.mutate(id)` | Deletes from `habits` |
| Toggle edit mode | Pencil icon (header) | Local state toggle | — |

### Visual Details
- Pie chart (recharts) showing hour distribution across habits
- Colors generated from user's theme color via `generateHabitColors()`
- Default habits auto-ensured via `useEnsureDefaultHabits()`
- Week-based tracking (current week start calculated by `getCurrentWeekStart()`)

**🤖 Stitch AI Hook Point:** Stitch could analyze habit patterns over time and provide insights like "You've been consistent with Exercise for 3 weeks — keep it up!" or "Your Reading habit dropped this week. Want to set a reminder?"

---

## 12. UI Interaction Points — Everyday Links

**Location:** Inline in `Dashboard.tsx` (lines 310–405)

### State (Local Only — Not Persisted to DB)
```typescript
const [everydayLinks, setEverydayLinks] = useState<EverydayLink[]>([
  { id: "1", name: "Check your email", icon: "📧", url: "mailto:", completed: false },
  { id: "2", name: "Review Shopify Sales", icon: "🛍️", url: "https://shopify.com", completed: false },
  { id: "3", name: "Check Application Status", icon: "📝", url: "#applications", completed: false },
]);
```

### Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Toggle completion | Circle checkbox | `toggleLinkCompletion(id)` | Local state |
| Click link | Link text / row | `<a href={url} target="_blank">` | Opens external URL |
| Enter edit mode | Edit2 icon (header) | `setEditingLinks(!editingLinks)` | Local state |
| Edit link name | Inline input (edit mode) | `updateLink(id, "name", value)` | Local state |
| Edit link URL | Inline input (edit mode) | `updateLink(id, "url", value)` | Local state |
| Upload link image | File input (edit mode) | `updateLink(id, "image", dataURL)` | Local state (FileReader) |
| Add new link | Plus icon (edit mode) | `addNewLink()` | Local state |
| Delete link | ✕ button (edit mode) | `deleteLink(id)` | Local state |

### Visual Details
- Favicons auto-fetched via `getFaviconUrl()` → Google Favicon Service (sz=64)
- Falls back to emoji icon if favicon unavailable
- Completed links show strikethrough
- 3-column grid on xl, 2-column on sm, 1-column on mobile

**⚠️ Important Note:** Everyday Links are **not persisted** — they reset on page reload. This is a strong candidate for migration to Supabase.

**🤖 Stitch AI Hook Point:** Stitch could suggest personalized daily links based on the user's active projects, connected services, and recent activity patterns. It could also detect when a link hasn't been visited in a while and suggest removing it.

---

## 13. UI Interaction Points — Notes & Brain Dumps

**Component:** `src/components/NotesWidget.tsx` (247 lines)

### Data Unification
Notes and Brain Dumps are merged into a single `UnifiedItem[]` list:
```typescript
interface UnifiedItem {
  id: string;
  type: "note" | "brain_dump";
  title: string;
  preview: string;
  color: string;
  updated_at: string;
  taskCount?: number;
  ideaCount?: number;
  reminderCount?: number;
  original: Note | BrainDump;
}
```

### Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Open note editor | Card click | Opens `NoteEditor` with note data | — |
| Add new note | "+" button / `onAddNote` prop | `setNoteEditorOpen(true)` (from Dashboard) | — |
| Delete note | Trash icon | `deleteNote.mutate(id)` | Deletes from `notes` |
| Reorder notes | Drag handle (DnD Kit) | `reorderNotes.mutate(...)` | Updates `notes.position` |

### Visual Details
- Cards show colored backgrounds via `hexToRgba(card_color, card_opacity)`
- Brain dump cards show task/idea/reminder counts from `structured_data`
- DnD Kit used for drag-and-drop reordering (PointerSensor)
- Time stamps shown as relative ("2 hours ago")

**🤖 Stitch AI Hook Point:** Stitch could offer "Smart Summarize" on notes, auto-tag brain dumps with categories, or suggest converting brain dump items into project tasks.

---

## 14. UI Interaction Points — Journal Entries

**Component:** `src/components/journal/JournalEntriesList.tsx`

### Interactions
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| View entry | Card click | Opens `JournalEntryModal` | Reads `journal_entries` |
| Create entry | "+" button | Opens new entry modal | Inserts into `journal_entries` |
| Filter by mood | Mood emoji filter | Local state | — |

**🤖 Stitch AI Hook Point:** Stitch could analyze journal mood patterns over time, suggest journaling prompts based on the user's current emotional state, or highlight correlations between habits and mood.

---

## 15. UI Interaction Points — Tutorial / Welcome Video

### Tutorial Prompt Modal
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Watch guide | "Watch the guide" button | `setShowVideoPlayer(true)` | — |
| Dismiss | "Maybe later" link | `setShowTutorial(false)` + `upsertPrefs.mutateAsync({ welcome_video_watched: true })` | Updates `user_preferences` |

### Video Player Modal
| Interaction | Element | Handler | Data Flow |
|------------|---------|---------|-----------|
| Close video | X button | `setShowVideoPlayer(false)` + `setShowTutorial(false)` + `upsertPrefs.mutateAsync({ welcome_video_watched: true })` | Updates `user_preferences` |

### Trigger Logic
- Shown 5 seconds after mount if `prefs.welcome_video_watched === false`
- Video URL from `prefs.welcome_video_url` (defaults to Loom placeholder)
- Both dismiss paths mark `welcome_video_watched: true`

---

## 16. UI Interaction Points — Modals

### NewProjectModal
- **Trigger:** "Project" quick add button
- **Component:** `src/components/NewProjectModal.tsx`
- **Controlled by:** `projectModalOpen` state

### NoteEditor
- **Trigger:** "Note" quick add button, or NotesWidget card click
- **Component:** `src/components/NoteEditor.tsx`
- **Controlled by:** `noteEditorOpen` state

### TaskEditor
- **Trigger:** "Task" quick add button
- **Component:** `src/components/TaskEditor.tsx`
- **Requires:** At least one project (`projects.length > 0`)
- **Default project:** First project in list (`projects[0].id`)
- **Default status:** `"backlog"`

---

## 17. Stitch AI Integration Points

### Priority 1 — Smart Daily Briefing
**Where:** New widget or enhancement to YourDayAgenda
**What:** AI-generated morning briefing combining:
- Today's calendar events
- Priority tasks (sorted by urgency × importance)
- Habit streak status
- 90-day goal progress check
- Weather/motivation quote

**Data inputs:** `calendar_events`, `tasks`, `habits`, `habit_logs`, `ninety_day_goals`, `goal_check_ins`
**Trigger:** Dashboard load or manual "Generate briefing" button
**Edge function:** `generate-daily-briefing`

### Priority 2 — AI Task Suggestions
**Where:** TaskEditor modal or dedicated "AI Suggest" button
**What:** Based on current projects, goals, and recent activity, suggest 3-5 actionable tasks
**Data inputs:** `projects`, `tasks`, `ninety_day_goals`, `brain_dumps`
**Edge function:** `generate-tasks` (already exists)

### Priority 3 — Habit Insights
**Where:** HabitTrackerWidget expansion panel
**What:** Weekly AI analysis of habit patterns with actionable advice
**Data inputs:** `habits`, `habit_logs` (all history)
**Edge function:** New `analyze-habits`

### Priority 4 — Brain Dump Processing
**Where:** NotesWidget → Brain Dump card action
**What:** Convert freeform brain dump text into:
- Structured tasks (assigned to projects)
- Calendar events
- Quick todos
- Notes with tags
**Edge function:** `organize-brain-dump` (already exists)

### Priority 5 — Smart Everyday Links
**Where:** Everyday Links section
**What:** AI-curated daily link suggestions based on:
- Active project types (e.g., if user has a "Job Hunt" project → suggest LinkedIn, Indeed)
- Time of day patterns
- Connected service activity
**Data inputs:** `projects`, `applications`, user browsing patterns

### Priority 6 — Journal Mood Analytics
**Where:** JournalEntriesList expansion
**What:** Trend analysis of mood emojis with correlations to habits and productivity
**Data inputs:** `journal_entries.mood_emoji`, `habit_logs`, `tasks` (completion rates)
**Edge function:** New `journal-insights`

---

## 18. State Management Patterns

### Server State (TanStack Query)
All Supabase data uses TanStack Query with automatic cache invalidation:
```typescript
// Pattern: Queries
const { data, isLoading, error } = useProjects();

// Pattern: Mutations with optimistic updates
const updateTask = useUpdateTask();
updateTask.mutate({ id, status: "done" }, {
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] })
});
```

### Local State (React useState)
Used for UI-only state:
- `editingLinks` — Edit mode toggle for Everyday Links
- `showTutorial` / `showVideoPlayer` — Tutorial modal visibility
- Modal open states (`projectModalOpen`, `taskEditorOpen`, `noteEditorOpen`)

### localStorage
Used for ephemeral daily data:
- Last-minute tasks in YourDayAgenda (`last-minute-tasks-{date}`)
- Everyday Links (currently local state only, resets on reload)

### Computed Values (derived in render)
```typescript
const momentumPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
const activeProjectCount = projects.filter(p => !p.archived).length;
const priorityProjects = [...projectsWithStats].sort((a, b) => b.pending - a.pending).slice(0, 4);
```

---

## Appendix: Payment Success Flow

When user returns from Stripe checkout with `?payment=success`:
1. Updates `user_preferences.is_subscribed = true` and `subscription_type = "pro"`
2. Fires confetti animation (150 particles + 100 particles with 300ms delay)
3. Shows toast: "You're all set — Pro features unlocked 🎉"
4. Clears URL search params

---

## Appendix: Key File Paths

| Purpose | Path |
|---------|------|
| Dashboard page | `src/pages/Dashboard.tsx` |
| Today's Agenda widget | `src/components/YourDayAgenda.tsx` |
| 90-Day Goal widget | `src/components/NinetyDayGoalWidget.tsx` |
| Quick Todos widget | `src/components/QuickTodosWidget.tsx` |
| Habit Tracker widget | `src/components/HabitTrackerWidget.tsx` |
| Notes widget (unified) | `src/components/NotesWidget.tsx` |
| Brain Dump widget (no-op) | `src/components/BrainDumpWidget.tsx` |
| Journal entries list | `src/components/journal/JournalEntriesList.tsx` |
| Note editor modal | `src/components/NoteEditor.tsx` |
| Task editor modal | `src/components/TaskEditor.tsx` |
| New project modal | `src/components/NewProjectModal.tsx` |
| Page header | `src/components/PageHeader.tsx` |
| App shell (sidebar) | `src/components/AppShell.tsx` |
| Auth hook | `src/hooks/useAuth.tsx` |
| Projects hook | `src/hooks/useProjects.ts` |
| Tasks hook | `src/hooks/useTasks.ts` |
| Calendar events hook | `src/hooks/useCalendarEvents.ts` |
| Habits hook | `src/hooks/useHabits.ts` |
| Quick todos hook | `src/hooks/useQuickTodos.ts` |
| Notes hook | `src/hooks/useNotes.ts` |
| Brain dumps hook | `src/hooks/useBrainDumps.ts` |
| 90-day goals hook | `src/hooks/useNinetyDayGoals.ts` |
| User preferences hook | `src/hooks/useUserPreferences.ts` |
| Expenses hook | `src/hooks/useExpenses.ts` |
| Wealth goals hook | `src/hooks/useWealthGoals.ts` |
