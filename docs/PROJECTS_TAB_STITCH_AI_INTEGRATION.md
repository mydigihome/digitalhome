# Projects Tab — UI Interaction Map & Stitch AI Integration Guide

> Comprehensive reference for every UI interaction point in the Projects tab, including component hierarchy, data flows, mutation hooks, and recommended Stitch AI hook-up points.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [Data Layer — Hooks & Mutations](#3-data-layer--hooks--mutations)
4. [Database Schema (Relevant Tables)](#4-database-schema-relevant-tables)
5. [UI Interaction Points — Projects List](#5-ui-interaction-points--projects-list)
6. [UI Interaction Points — Event Creation Flow](#6-ui-interaction-points--event-creation-flow)
7. [UI Interaction Points — Goal Creation Flow](#7-ui-interaction-points--goal-creation-flow)
8. [UI Interaction Points — Event Detail View (Host)](#8-ui-interaction-points--event-detail-view-host)
9. [UI Interaction Points — Goal Detail View](#9-ui-interaction-points--goal-detail-view)
10. [UI Interaction Points — Generic Project Detail (Kanban)](#10-ui-interaction-points--generic-project-detail-kanban)
11. [UI Interaction Points — Public Event Page (Guest RSVP)](#11-ui-interaction-points--public-event-page-guest-rsvp)
12. [Stitch AI Integration Points](#12-stitch-ai-integration-points)
13. [Edge Functions in Use](#13-edge-functions-in-use)
14. [State Management Patterns](#14-state-management-patterns)

---

## 1. Architecture Overview

The Projects system is split into **two project types** with separate creation flows and detail views:

| Type    | Creation Modal          | Detail Component       | Data Hooks                              |
|---------|-------------------------|------------------------|-----------------------------------------|
| Event   | `CreateEventModal`      | `EventDetailView`      | `useEvents.ts` (event_details, guests, RSVP questions) |
| Goal    | `CreateGoalModal`       | `GoalDetailView`       | `useGoals.ts` (goal_stages, goal_tasks) |
| Generic | `NewProjectModal`       | Kanban/List board      | `useTasks.ts` + `useProjects.ts`        |

All project types share the `projects` table as the parent entity. Type-specific data lives in child tables (`event_details`, `goal_stages`, etc.).

**Route structure:**
- `/projects` → `Projects.tsx` (list view)
- `/project/:id` → `ProjectDetail.tsx` (detail, branches by type)
- `/events/:shareToken` → `PublicEventPage.tsx` (public guest RSVP)

---

## 2. Component Hierarchy

```
src/pages/Projects.tsx
├── AppShell (sidebar + layout)
├── Create Event card button → CreateEventModal
├── Create Goal card button → CreateGoalModal
├── Search bar (Input)
├── Archive filter toggle
├── View mode toggle (Card | List)
├── Events section (card grid or list rows)
└── Goals section (card grid or list rows with progress bars)

src/pages/ProjectDetail.tsx
├── AppShell
├── Back navigation ("← Projects")
├── PageHeader (editable title, icon, cover image)
├── [if type === "event"]
│   ├── QuickEmailComposer (📧 icon)
│   └── EventDetailView
│       ├── Hero section (cover + date/time/location overlay)
│       ├── Share & Actions bar (Copy Link, Co-Hosts, Email All, Email Accepted)
│       ├── Co-Hosts section
│       ├── Description card
│       ├── Guest Management Dashboard
│       │   ├── Status counts summary
│       │   ├── Guest rows (status icon, viewed_at, delete)
│       │   └── Add Guests modal
│       ├── Email Composer modal (templates + mailto:)
│       └── Co-Host Invite modal
├── [if type === "goal"]
│   ├── QuickEmailComposer
│   └── GoalDetailView
│       ├── Progress Hero (circular progress + affirmation)
│       ├── Stages accordion
│       │   ├── Stage headers (expand/collapse, progress bar)
│       │   ├── Task checkboxes (toggle complete, confetti)
│       │   ├── Add task inline
│       │   └── Delete stage
│       ├── Add Stage inline
│       └── Resources section (links, add/delete)
├── [else: generic project]
│   ├── Progress bar
│   ├── Tabs: Board | Playbooks
│   ├── View toggle: Kanban | List
│   ├── AI Generate button → AITaskGenerator
│   ├── Kanban board (DnD columns: Backlog, Ready, In Progress, Review, Done)
│   │   └── SortableTaskCard (draggable, click → TaskEditor)
│   ├── List view (checkbox + edit icon on hover)
│   ├── Add task inline per column
│   ├── TaskEditor slide-over
│   ├── DocumentsTab (Playbooks)
│   └── Archive / Delete project actions

src/pages/PublicEventPage.tsx
├── Event hero (name, date, location)
├── RSVP form (name, email, Yes/No/Maybe, custom questions)
├── Add to Calendar buttons (Apple, Google, Outlook, .ics)
└── Message Host button
```

---

## 3. Data Layer — Hooks & Mutations

### `useProjects.ts`
| Hook               | Type     | Action                        | Supabase Table |
|--------------------|----------|-------------------------------|----------------|
| `useProjects()`    | Query    | Fetch all non-archived projects | `projects`     |
| `useCreateProject()` | Mutation | Insert new project           | `projects`     |
| `useUpdateProject()` | Mutation | Update project fields        | `projects`     |
| `useDeleteProject()` | Mutation | Delete project               | `projects`     |

### `useEvents.ts`
| Hook                      | Type     | Action                              | Supabase Table          |
|---------------------------|----------|--------------------------------------|-------------------------|
| `useEventDetails(pid)`    | Query    | Fetch event_details by project_id    | `event_details`         |
| `useUpsertEventDetails()` | Mutation | Upsert event_details                 | `event_details`         |
| `useEventGuests(eid)`     | Query    | Fetch guests by event_id             | `event_guests`          |
| `useAddEventGuests()`     | Mutation | Bulk insert guests                   | `event_guests`          |
| `useUpdateEventGuest()`   | Mutation | Update guest (status, viewed_at)     | `event_guests`          |
| `useDeleteEventGuest()`   | Mutation | Delete a guest                       | `event_guests`          |
| `useRsvpQuestions(eid)`   | Query    | Fetch custom RSVP questions          | `event_rsvp_questions`  |
| `useCreateRsvpQuestion()` | Mutation | Add RSVP question                    | `event_rsvp_questions`  |
| `useDeleteRsvpQuestion()` | Mutation | Delete RSVP question                 | `event_rsvp_questions`  |

### `useGoals.ts`
| Hook                    | Type     | Action                     | Supabase Table   |
|-------------------------|----------|----------------------------|------------------|
| `useGoalStages(pid)`    | Query    | Fetch stages by project_id | `goal_stages`    |
| `useGoalTasks(pid)`     | Query    | Fetch tasks by project_id  | `goal_tasks`     |
| `useCreateGoalStage()`  | Mutation | Insert stage               | `goal_stages`    |
| `useCreateGoalTask()`   | Mutation | Insert task                | `goal_tasks`     |
| `useUpdateGoalTask()`   | Mutation | Toggle completed, etc.     | `goal_tasks`     |
| `useDeleteGoalStage()`  | Mutation | Delete a stage             | `goal_stages`    |
| `useDeleteGoalTask()`   | Mutation | Delete a task              | `goal_tasks`     |

### `useTasks.ts` (generic projects)
| Hook               | Type     | Action                               | Supabase Table |
|--------------------|----------|---------------------------------------|----------------|
| `useTasks(pid)`    | Query    | Fetch tasks for a project             | `tasks`        |
| `useAllTasks()`    | Query    | Fetch all tasks (for progress calcs)  | `tasks`        |
| `useCreateTask()`  | Mutation | Insert task                           | `tasks`        |
| `useUpdateTask()`  | Mutation | Update task (status, position, etc.)  | `tasks`        |
| `useDeleteTask()`  | Mutation | Delete task                           | `tasks`        |

### Additional hooks used in Projects:
- `useCollaborators()` — co-hosts for events
- `useTemplates()` — project templates (NewProjectModal)
- `useAuth()` — current user context

---

## 4. Database Schema (Relevant Tables)

```
projects
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── name, goal, type ("event" | "goal" | other)
├── view_preference ("kanban" | "list")
├── icon, icon_type, cover_image, cover_type
├── start_date, end_date
├── archived (boolean)
└── created_at, updated_at

event_details (1:1 with projects)
├── id (uuid, PK)
├── project_id (uuid, FK → projects, UNIQUE)
├── event_date, location, location_type
├── description, privacy, share_token
├── event_type, rsvp_deadline
├── shared_album_enabled, playlist_url
├── external_link_url, external_link_label
└── background_style

event_guests
├── id, event_id (FK → event_details)
├── email, name, status (accepted|declined|maybe|pending|viewed)
├── viewed_at, rsvp_at, rsvp_answers (JSONB)
└── created_at

event_rsvp_questions
├── id, event_id (FK → event_details)
├── question_text, question_type, position
└── (no user_id — owned via event → project chain)

goal_stages
├── id, project_id (FK → projects)
├── name, description, position
└── created_at

goal_tasks
├── id, stage_id (FK → goal_stages), project_id (FK → projects)
├── title, completed, completed_at, position
└── created_at

tasks (generic project tasks)
├── id, project_id (FK → projects), user_id
├── title, description, status, priority
├── due_date, position, duration, min_chunk
├── assignee, labels[], blocked_by[], auto_scheduled
└── created_at, updated_at

project_resources
├── id, project_id (FK → projects)
├── title, url, file_path, resource_type
└── created_at

collaborators (co-hosts)
├── id, user_id, invited_email, invited_user_id
├── project_ids[] (array of project UUIDs)
├── role, status
└── created_at, updated_at
```

---

## 5. UI Interaction Points — Projects List

**File:** `src/pages/Projects.tsx`

| # | Interaction | Element | Current Behavior | Stitch AI Hook Point |
|---|------------|---------|------------------|---------------------|
| 1 | **Create Event** | Large dashed card button | Opens `CreateEventModal` | Stitch could auto-suggest event details based on user patterns (frequent event types, past locations) |
| 2 | **Create Goal** | Large dashed card button | Opens `CreateGoalModal` | Stitch could recommend goal types based on user activity, existing projects, or seasonal patterns |
| 3 | **Search** | `<Input>` with Search icon | Client-side filter by project name | Stitch could enhance with semantic search ("find my dinner events" → fuzzy match) |
| 4 | **Archive toggle** | Button with Archive icon | Toggles `statusFilter` between "active" and "all" | — |
| 5 | **View mode** | Card/List toggle buttons | Switches `viewMode` state | — |
| 6 | **Click project card** | Card/row element | `navigate(/project/${id})` | Stitch could surface contextual tips ("You have 3 overdue tasks in this project") |
| 7 | **Progress bar** (goals) | Inline bar on card | Shows `done/total` tasks ratio | Stitch could add predictive completion date |

---

## 6. UI Interaction Points — Event Creation Flow

**File:** `src/components/events/CreateEventModal.tsx`
**Steps:** 3-step wizard (Basic Info → Details → Guests & RSVP)

| # | Interaction | Step | Element | Current Behavior | Stitch AI Hook Point |
|---|------------|------|---------|------------------|---------------------|
| 1 | **Event name input** | 0 | `<Input>` | Free text | Stitch could auto-suggest names based on type selection |
| 2 | **Event type selection** | 0 | 2-col button grid | 7 types: Dinner Party, Book Club, Sorority, Trip, Workshop, Birthday, Other | Stitch could reorder by frequency of past selections |
| 3 | **Date picker** | 1 | `<Input type="date">` | Standard date input | Stitch could suggest dates avoiding calendar conflicts |
| 4 | **Time picker** | 1 | `<Input type="time">` | Standard time input | — |
| 5 | **Location type toggle** | 1 | Physical/Virtual buttons | Toggles `location_type` | — |
| 6 | **Location input** | 1 | `<Input>` | Free text (address or link) | Stitch could auto-complete from past locations |
| 7 | **Description** | 1 | `<Textarea>` | Free text | Stitch could auto-generate description based on event type |
| 8 | **Cover image upload** | 1 | File input → Supabase Storage | Uploads to `user-assets` bucket | Stitch could suggest stock images based on event type |
| 9 | **Guest emails** | 2 | `<Textarea>` | Comma/semicolon/newline separated | Stitch could auto-suggest from past guest lists or contacts |
| 10 | **RSVP deadline** | 2 | `<Input type="date">` | Standard date input | Stitch could default to 3 days before event |
| 11 | **Privacy toggle** | 2 | Private/Public buttons | Sets `privacy` field | — |
| 12 | **Custom RSVP questions** | 2 | Input + Add button | Stores array of question strings | Stitch could suggest common questions for the event type |
| 13 | **Create Event submit** | 2 | `<Button>` | Creates project → upserts event_details → adds guests → creates RSVP questions → navigates to detail | Stitch could auto-draft invite email post-creation |

**Data flow on submit:**
```
createProject({ name, type: "event", start_date })
  → upsertEventDetails({ project_id, event_date, location, ... })
  → projects.update({ cover_image, cover_type })  [if cover uploaded]
  → addEventGuests([{ event_id, email }])
  → createRsvpQuestion({ event_id, question_text, position })  [for each question]
  → navigate(`/project/${project.id}`)
```

---

## 7. UI Interaction Points — Goal Creation Flow

**File:** `src/components/goals/CreateGoalModal.tsx`
**Steps:** 2-step wizard (Info → AI Stages)

| # | Interaction | Step | Element | Current Behavior | Stitch AI Hook Point |
|---|------------|------|---------|------------------|---------------------|
| 1 | **Goal name** | 0 | `<Input>` | Free text | Stitch could suggest goal names from common patterns |
| 2 | **Goal type** | 0 | 2-col button grid | 8 types: Buy Home, Music EP, Family Cookout, Start Business, Wedding, Career Change, Fitness, Custom | Stitch could personalize based on user profile |
| 3 | **Target date** | 0 | `<Input type="date">` | Standard date | Stitch could suggest realistic timelines per goal type |
| 4 | **Description** | 0 | `<Textarea>` | Free text | — |
| 5 | **AI Generate Stages** | 1 | `<Button>` | Calls `generate-goal-stages` edge function | **Primary Stitch integration point** — replace or augment with Stitch AI for smarter stage generation |
| 6 | **Stage name edit** | 1 | `<Input>` per stage | Inline editable | Stitch could validate/improve stage names |
| 7 | **Task title edit** | 1 | `<Input>` per task | Inline editable | Stitch could suggest additional tasks per stage |
| 8 | **Add Stage** | 1 | Text button | Adds empty stage | — |
| 9 | **Add Task** | 1 | Text button per stage | Adds empty task to stage | Stitch could auto-fill suggested task |
| 10 | **Remove Stage/Task** | 1 | Trash icons | Removes from local state | — |
| 11 | **Create Goal submit** | 1 | `<Button>` | Creates project → stages → tasks → resources → navigates | Stitch could trigger a "next steps" recommendation |

**Data flow on submit:**
```
createProject({ name, type: "goal", end_date, goal: description })
  → for each stage:
      createGoalStage({ project_id, name, description, position })
        → for each task:
            createGoalTask({ stage_id, project_id, title, position })
  → for each resource:
      insert into project_resources({ project_id, title, url })
  → navigate(`/project/${project.id}`)
```

**Edge Function:** `generate-goal-stages`
- Input: `{ goalName, goalType }`
- Output: `{ stages: [{ name, description, tasks: [{ title }] }], resources: [{ title, url }] }`

---

## 8. UI Interaction Points — Event Detail View (Host)

**File:** `src/components/events/EventDetailView.tsx`

| # | Interaction | Element | Current Behavior | Stitch AI Hook Point |
|---|------------|---------|------------------|---------------------|
| 1 | **Hero section** | Cover image + gradient overlay | Displays event name, date/time, location | — |
| 2 | **Copy Link** | `<Button>` | Copies `${origin}/events/${share_token}` to clipboard | — |
| 3 | **Invite Co-Hosts** | `<Button>` | Opens co-host invite modal (email input) | Stitch could suggest co-hosts from collaborators |
| 4 | **Email All Guests** | `<Button>` | Opens email composer with all guests | — |
| 5 | **Email Accepted** | `<Button>` | Opens email composer with accepted only | — |
| 6 | **Privacy badge** | `<Badge>` | Shows Public/Private with Globe/Lock icon | — |
| 7 | **Co-host rows** | List items | Shows email, status badge, delete button | — |
| 8 | **Guest status summary** | Text spans | "X invited | Y accepted | Z pending | ..." with color coding | Stitch could predict attendance rate |
| 9 | **Add Guests** | `<Button>` → modal | Opens textarea for bulk email entry | Stitch could suggest from past events |
| 10 | **Guest row** | List item | Shows status icon, name/email, viewed_at timestamp, delete | — |
| 11 | **Delete guest** | Trash icon | `deleteGuest.mutate(id)` | — |
| 12 | **Email template selector** | `<select>` in email modal | 3 templates: Reminder, Update, Thank You | Stitch could generate custom email content |
| 13 | **Email body editor** | `<Textarea>` in email modal | Editable pre-filled template | Stitch could enhance/personalize per guest |
| 14 | **Send Email** | `<Button>` in email modal | Opens `mailto:` with recipients + subject + body | — |
| 15 | **RSVP deadline** | Footer text | Shows formatted deadline with "Expired" indicator | — |

**Email template structure:**
```typescript
EMAIL_TEMPLATES = [
  { name: "Reminder", subject: fn(eventName), body: fn(eventName, date) },
  { name: "Update",   subject: fn(eventName), body: fn(eventName, _) },
  { name: "Thank You", subject: fn(eventName), body: fn(eventName, _) },
]
```

---

## 9. UI Interaction Points — Goal Detail View

**File:** `src/components/goals/GoalDetailView.tsx`

| # | Interaction | Element | Current Behavior | Stitch AI Hook Point |
|---|------------|---------|------------------|---------------------|
| 1 | **Circular progress** | SVG circle + percentage | Shows overall % complete | — |
| 2 | **Affirmation message** | Text + emoji | Changes at 0/10/25/50/75/100% milestones | Stitch could personalize affirmations |
| 3 | **Stage accordion** | Clickable header | Expand/collapse with chevron animation | — |
| 4 | **Stage progress bar** | Inline bar in header | Shows `completed/total` per stage | — |
| 5 | **Task checkbox** | Circle/CheckCircle2 icons | Toggles `completed` + triggers confetti at milestones | — |
| 6 | **Confetti triggers** | `canvas-confetti` | 25% → 40 particles, 50% → 60, 75% → 80, 100% → 200 | — |
| 7 | **Add task inline** | `<Input>` + buttons | Creates `goal_task` in specific stage | Stitch could suggest next tasks based on completed ones |
| 8 | **Delete task** | Trash icon (hover reveal) | `deleteTask.mutate(id)` | — |
| 9 | **Add Stage** | `<Button>` | Opens inline input for new stage name | Stitch could suggest logical next stages |
| 10 | **Delete Stage** | "Remove stage" text button | `deleteStage.mutate(id)` | — |
| 11 | **Resources list** | Link cards | Shows title + external link icon | Stitch could auto-discover relevant resources |
| 12 | **Add Resource** | `<Button>` → inline form | Title + URL inputs | Stitch could suggest resources based on goal type |
| 13 | **Delete Resource** | Trash icon | Direct Supabase delete | — |

**Milestone celebration logic:**
```typescript
if (newProgress === 100) → 200 particles confetti + toast "🏆 Goal achieved!"
if (newProgress >= 75)   → 80 particles + toast "🚀 Almost there!"
if (newProgress >= 50)   → 60 particles + toast "🎉 Halfway there!"
if (newProgress >= 25)   → 40 particles + toast "💪 25% done!"
else                     → 15 particles (micro-celebration)
```

---

## 10. UI Interaction Points — Generic Project Detail (Kanban)

**File:** `src/pages/ProjectDetail.tsx`

| # | Interaction | Element | Current Behavior | Stitch AI Hook Point |
|---|------------|---------|------------------|---------------------|
| 1 | **Page header** | `<PageHeader>` | Editable title, icon picker, cover image upload | — |
| 2 | **Progress bar** | Gradient bar | `done/total` tasks percentage | Stitch could predict completion date |
| 3 | **Board/Playbooks tabs** | `<Tabs>` | Switches between task board and documents view | — |
| 4 | **Kanban/List toggle** | `<Tabs>` | Switches board visualization | — |
| 5 | **AI Generate** | `<Button>` | Opens `AITaskGenerator` modal | **Key Stitch point** — generates tasks via AI |
| 6 | **Drag & drop** | `@dnd-kit` | Moves tasks between columns (updates status + position) | — |
| 7 | **Task card click** | `SortableTaskCard` | Opens `TaskEditor` slide-over | — |
| 8 | **Task checkbox** | `<Checkbox>` | Toggles done/backlog status | — |
| 9 | **Hover edit icon** | Pencil on hover | Opens `TaskEditor` | — |
| 10 | **Add task to column** | "+" button per column | Opens inline input in column | Stitch could suggest tasks for the specific column |
| 11 | **Task editor** | `TaskEditor` component | Full edit: title, description, status, priority, due date, labels, assignee, duration | Stitch could auto-categorize or suggest priority |
| 12 | **Documents/Playbooks** | `DocumentsTab` | File upload and management | Stitch could summarize uploaded documents |
| 13 | **Archive project** | Archive button | Sets `archived: true` with confirmation | — |
| 14 | **Delete project** | Delete button | Deletes with confirmation checkbox | — |

**Kanban columns:**
```typescript
columns = [
  { id: "backlog",     label: "Backlog",     color: "bg-muted-foreground" },
  { id: "ready",       label: "Ready",       color: "bg-primary/60" },
  { id: "in_progress", label: "In Progress", color: "bg-primary" },
  { id: "review",      label: "Review",      color: "bg-warning" },
  { id: "done",        label: "Done",        color: "bg-success" },
]
```

**DnD data flow:**
```
onDragEnd → determine targetStatus + targetPosition
  → updateTask.mutate({ id, status: targetStatus, position: targetPosition })
  → TanStack Query invalidates ["tasks"] → re-renders
```

---

## 11. UI Interaction Points — Public Event Page (Guest RSVP)

**File:** `src/pages/PublicEventPage.tsx`

| # | Interaction | Element | Current Behavior | Stitch AI Hook Point |
|---|------------|---------|------------------|---------------------|
| 1 | **Event hero** | Display section | Shows event name, date/time, location | — |
| 2 | **RSVP form: Name** | `<Input>` | Guest name | — |
| 3 | **RSVP form: Email** | `<Input>` | Guest email | — |
| 4 | **RSVP: Yes/No/Maybe** | Button group | 3 options with icons | — |
| 5 | **Custom questions** | Dynamic inputs | Rendered from `event_rsvp_questions` | — |
| 6 | **Submit RSVP** | `<Button>` | Calls `event-rsvp` edge function | — |
| 7 | **Add to Calendar** | `AddToCalendarButton` | Generates .ics file; links for Apple, Google, Outlook | — |
| 8 | **View tracking** | Automatic | Records `viewed_at` on page load via `event-rsvp` edge function | — |

**Edge Function:** `event-rsvp`
- Handles: RSVP submission + view tracking
- Updates `event_guests.status`, `event_guests.viewed_at`, `event_guests.rsvp_at`, `event_guests.rsvp_answers`

---

## 12. Stitch AI Integration Points

### Priority 1: High-Value AI Enhancements

| Feature | Where to Hook | Input Data | Expected Output | Implementation Notes |
|---------|--------------|------------|-----------------|---------------------|
| **Smart Goal Stage Generation** | `CreateGoalModal` step 1 "AI Generate" button | `goalName`, `goalType`, user history | `{ stages[], resources[] }` | Currently uses `generate-goal-stages` edge function. Replace/augment with Stitch AI endpoint |
| **AI Task Generation** | `ProjectDetail` "AI Generate" button | Project context, existing tasks | `{ tasks[] }` with title, priority, status | Currently uses `generate-tasks` edge function |
| **Smart Event Suggestions** | `CreateEventModal` step 0 | User's past events, calendar data | Auto-filled form fields | New integration point — pre-populate based on patterns |
| **Predictive Guest Management** | `EventDetailView` guest dashboard | Past event attendance data | Attendance predictions, follow-up suggestions | New feature — "3 guests haven't viewed — send reminder?" |

### Priority 2: Enhancement Opportunities

| Feature | Where to Hook | Details |
|---------|--------------|---------|
| **Email content generation** | `EventDetailView` email modal | Generate personalized email content based on event context |
| **Task auto-categorization** | `TaskEditor` | Auto-assign priority, labels, estimated duration from title |
| **Resource discovery** | `GoalDetailView` resources section | Auto-find relevant articles/tools for the goal type |
| **Smart search** | `Projects.tsx` search bar | Semantic search across project names, descriptions, tasks |
| **Progress insights** | `GoalDetailView` progress hero | "At this pace, you'll complete by X date" predictions |
| **RSVP question suggestions** | `CreateEventModal` step 2 | Suggest relevant questions based on event type |

### Priority 3: Ambient Intelligence

| Feature | Where to Hook | Details |
|---------|--------------|---------|
| **Project health alerts** | `Projects.tsx` list cards | Surface warnings for stale projects, overdue tasks |
| **Next action suggestions** | `ProjectDetail` header area | "Next step: Complete task X in stage Y" |
| **Cross-project insights** | Dashboard widgets | "Your 'Buy Home' goal is 50% done — consider starting stage 3" |

---

## 13. Edge Functions in Use

| Function | Purpose | Called From | Input | Output |
|----------|---------|------------|-------|--------|
| `generate-goal-stages` | AI stage/task generation for goals | `CreateGoalModal` | `{ goalName, goalType }` | `{ stages: StageData[], resources: Resource[] }` |
| `generate-tasks` | AI task generation for generic projects | `AITaskGenerator` | Project context | `{ tasks: Task[] }` |
| `event-rsvp` | Process guest RSVP + view tracking | `PublicEventPage` | `{ shareToken, action, guestData }` | Updated guest record |
| `fetch-og-tags` | Fetch link previews for resources | Resource links | `{ url }` | `{ title, description, image }` |

---

## 14. State Management Patterns

### TanStack Query Keys
```typescript
["projects", userId]           // All projects for user
["tasks", projectId]           // Tasks for specific project
["tasks", "all"]               // All tasks across projects
["event_details", projectId]   // Event details for project
["event_guests", eventId]      // Guests for event
["rsvp_questions", eventId]    // RSVP questions for event
["goal_stages", projectId]     // Stages for goal
["goal_tasks", projectId]      // Tasks for goal (all stages)
["project_resources", projectId] // Resources for project
["collaborators"]              // All collaborators
```

### Mutation → Invalidation Pattern
All mutations follow this pattern:
```typescript
useMutation({
  mutationFn: async (data) => {
    const { error } = await supabase.from("table").insert/update/delete(data);
    if (error) throw error;
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["relevant_key"] }),
})
```

### Local State (Component-Level)
| Component | State Variables | Purpose |
|-----------|----------------|---------|
| `Projects.tsx` | `viewMode`, `search`, `statusFilter` | List view preferences |
| `CreateEventModal` | `step`, `form` (object), `newQuestion`, `submitting` | Multi-step form wizard |
| `CreateGoalModal` | `step`, `name`, `goalType`, `stages[]`, `generating` | 2-step form + AI gen |
| `ProjectDetail` | `mainTab`, `view`, `editingTask`, `addingToColumn`, `activeTask` | Board interaction state |
| `EventDetailView` | `showAddGuests`, `showEmailModal`, `emailFilter`, `emailTemplate`, `emailBody`, `showCoHostInvite` | Modal states |
| `GoalDetailView` | `expandedStages` (Set), `addingTaskToStage`, `showAddStage`, `addingResource` | Accordion + inline form states |

---

## Quick Reference: File Locations

```
Pages:
  src/pages/Projects.tsx              — Projects list
  src/pages/ProjectDetail.tsx         — Project detail (routes by type)
  src/pages/PublicEventPage.tsx       — Public RSVP page

Components:
  src/components/events/
    ├── CreateEventModal.tsx           — 3-step event creation wizard
    ├── EventDetailView.tsx            — Host event management dashboard
    ├── QuickEmailComposer.tsx         — 📧 icon email shortcut
    └── AddToCalendarButton.tsx        — .ics / Google / Outlook calendar buttons

  src/components/goals/
    ├── CreateGoalModal.tsx            — 2-step goal creation with AI stages
    └── GoalDetailView.tsx             — Goal progress tracker with stages

  src/components/
    ├── NewProjectModal.tsx            — 6-step generic project wizard
    ├── TaskEditor.tsx                 — Task detail slide-over editor
    ├── AITaskGenerator.tsx            — AI task generation modal
    ├── DocumentsTab.tsx               — Playbooks/documents management
    └── PageHeader.tsx                 — Editable project header

Hooks:
  src/hooks/useProjects.ts            — Project CRUD
  src/hooks/useEvents.ts              — Event details, guests, RSVP questions
  src/hooks/useGoals.ts               — Goal stages and tasks
  src/hooks/useTasks.ts               — Generic project tasks
  src/hooks/useCollaborators.ts       — Co-host management

Edge Functions:
  supabase/functions/generate-goal-stages/  — AI goal stage generation
  supabase/functions/generate-tasks/        — AI task generation
  supabase/functions/event-rsvp/            — RSVP processing
```
