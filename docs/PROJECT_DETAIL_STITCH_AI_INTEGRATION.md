# Project Detail Screen — Stitch AI Integration Guide

> Comprehensive technical reference for integrating Stitch AI into the Project Detail screen (`src/pages/ProjectDetail.tsx`) and its three sub-views: **Generic/Kanban**, **Event**, and **Goal**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Routing & View Branching](#2-routing--view-branching)
3. [Generic Project (Kanban) View](#3-generic-project-kanban-view)
4. [Event Detail View](#4-event-detail-view)
5. [Goal Detail View](#5-goal-detail-view)
6. [Shared Components](#6-shared-components)
7. [Data Layer — Hooks & Mutations](#7-data-layer--hooks--mutations)
8. [Edge Functions (AI Endpoints)](#8-edge-functions-ai-endpoints)
9. [Stitch AI Integration Points](#9-stitch-ai-integration-points)
10. [State Management & Query Keys](#10-state-management--query-keys)
11. [Database Schema Reference](#11-database-schema-reference)

---

## 1. Architecture Overview

```
/project/:id  →  ProjectDetail.tsx
                    ├─ project.type === "event"  →  EventDetailView.tsx
                    ├─ project.type === "goal"   →  GoalDetailView.tsx
                    └─ else (generic)            →  Kanban/List Board (inline)
```

**Key principle**: The `ProjectDetail` page is a **routing shell** that loads the correct sub-view based on `project.type`. All three views share:
- `PageHeader` (title, icon, cover image — all editable)
- `QuickEmailComposer` (event & goal views only)
- Delete/Archive confirmation modal

---

## 2. Routing & View Branching

| File | Line | Logic |
|---|---|---|
| `ProjectDetail.tsx` | L137-138 | `isEvent = project?.type === "event"` / `isGoal = project?.type === "goal"` |
| `ProjectDetail.tsx` | L209-402 | Conditional rendering: Event → Goal → Generic |

### Navigation
- **Entry**: `navigate(/project/${id})` from Projects page
- **Back**: `navigate("/projects")` via `<ChevronLeft>` button (L203)
- **Delete/Archive**: Modal at L437-515, routes back to `/projects`

---

## 3. Generic Project (Kanban) View

The default view for non-event/non-goal projects. Contains the richest task management surface.

### 3.1 UI Interaction Points

| # | Interaction | Component/Location | Data Flow |
|---|---|---|---|
| 1 | **Tab: Board / Playbooks** | `<Tabs>` L288-295 | `mainTab` state: `"board"` \| `"documents"` |
| 2 | **View toggle: Kanban / List** | `<Tabs>` L298-303 | `view` state: `"kanban"` \| `"list"` |
| 3 | **AI Generate button** | `<Button>` L304-306 | Opens `AITaskGenerator` modal |
| 4 | **Drag task between columns** | `<DndContext>` L315-341 | `handleDragEnd` → `useUpdateTask().mutate({ status, position })` |
| 5 | **Click task card** | `SortableTaskCard` L330 | Opens `TaskEditor` slide-over panel |
| 6 | **Add task to column** | `DroppableColumn` L328 | Opens `TaskEditor` with `defaultStatus` |
| 7 | **Toggle done (list view)** | `<Checkbox>` L364-368 | `toggleDone()` → `useUpdateTask()` |
| 8 | **Edit task (list hover pencil)** | `<Pencil>` L371-376 | Opens `TaskEditor` |
| 9 | **Documents tab** | `<DocumentsTab>` L400 | Separate file upload/management |
| 10 | **Progress bar** | L271-285 | Computed: `done/total` tasks → percentage |

### 3.2 Kanban Columns

```typescript
const columns = [
  { id: "backlog",     label: "Backlog",     color: "bg-muted-foreground" },
  { id: "ready",       label: "Ready",       color: "bg-primary/60" },
  { id: "in_progress", label: "In Progress", color: "bg-primary" },
  { id: "review",      label: "Review",      color: "bg-warning" },
  { id: "done",        label: "Done",        color: "bg-success" },
];
```

### 3.3 Task Card Data Display

Each `SortableTaskCard` renders:
- **Title** (primary text)
- **Priority** (left border color: `low`=green, `medium`=amber, `high`=red)
- **Due date badge** (`DueBadge` component — Overdue/Today/Tomorrow/This week/in Xd)
- **Labels** (up to 2 shown as accent pills)
- **Assignee** (User icon + name)

### 3.4 DnD System

- Library: `@dnd-kit/core` + `@dnd-kit/sortable`
- Sensors: `PointerSensor` with 5px activation distance
- Collision: `closestCorners`
- On drag end: Updates `status` (column) and `position` (order within column)
- Overlay: `TaskCardOverlay` with slight rotation + scale for visual feedback

---

## 4. Event Detail View

**File**: `src/components/events/EventDetailView.tsx`
**Props**: `{ projectId, projectName, coverImage }`

### 4.1 UI Interaction Points

| # | Interaction | Component/Location | Data Flow |
|---|---|---|---|
| 1 | **Hero section** | L140-173 | Cover image or gradient fallback, event type badge, date/time/location |
| 2 | **Copy share link** | `<Button>` L177 | `navigator.clipboard.writeText(shareUrl)` |
| 3 | **Invite Co-Hosts** | `<Button>` L180 | Opens co-host invite modal → `useCreateCollaborator()` |
| 4 | **Email All Guests** | `<Button>` L183 | Opens email composer modal (filter: "all") |
| 5 | **Email Accepted** | `<Button>` L186 | Opens email composer modal (filter: "accepted") |
| 6 | **Privacy badge** | `<Badge>` L189 | Public/Private indicator |
| 7 | **Co-hosts list** | L196-219 | Shows collaborators filtered by `project_ids` |
| 8 | **Remove co-host** | `<Trash2>` L210 | `deleteCollab.mutate(host.id)` |
| 9 | **Description card** | L222-227 | Read-only event description |
| 10 | **Guest list dashboard** | L230-298 | Status counts + individual guest rows |
| 11 | **Add Guests** | `<Button>` L244 | Opens add guests modal → `useAddEventGuests()` |
| 12 | **Remove guest** | `<Trash2>` L278 | `deleteGuest.mutate(guest.id)` |
| 13 | **RSVP deadline info** | L289-298 | Shows deadline with expired indicator |
| 14 | **Email template selector** | `<select>` L365-377 | Templates: Reminder, Update, Thank You |
| 15 | **Send email** | L385 | Opens native `mailto:` with composed body |

### 4.2 Guest Status Model

```typescript
const STATUS_CONFIG = {
  accepted: { icon: CheckCircle, color: "text-green-500" },
  pending:  { icon: HelpCircle, color: "text-yellow-500" },
  declined: { icon: XCircle,    color: "text-red-500" },
  viewed:   { icon: Eye,        color: "text-blue-500" },
};
```

### 4.3 Email Templates

Three built-in templates with dynamic `eventName` and `date` interpolation:
1. **Reminder** — RSVP prompt
2. **Update** — Event changes
3. **Thank You** — Post-event gratitude

### 4.4 Share URL Pattern

```typescript
const shareUrl = `${window.location.origin}/events/${event.share_token}`;
```

Corresponds to the public event page at `/events/:shareToken` (`PublicEventPage.tsx`).

---

## 5. Goal Detail View

**File**: `src/components/goals/GoalDetailView.tsx`
**Props**: `{ projectId, projectName }`

### 5.1 UI Interaction Points

| # | Interaction | Component/Location | Data Flow |
|---|---|---|---|
| 1 | **Circular progress** | `CircularProgress` L40-67 | SVG ring, animated with CSS transition |
| 2 | **Affirmation messages** | L23-38 | Milestone-based: 0%, 10%, 25%, 50%, 75%, 100% |
| 3 | **Progress bar** | L223-231 | Framer Motion animated width |
| 4 | **Expand/collapse stage** | Stage header L271-292 | `expandedStages` Set toggle |
| 5 | **Toggle task completed** | Circle/CheckCircle L313-318 | `useUpdateGoalTask()` + confetti celebrations |
| 6 | **Add task to stage** | `<Plus>` L354-359 | Inline input → `useCreateGoalTask()` |
| 7 | **Delete task** | `<Trash2>` L323-328 | `useDeleteGoalTask()` |
| 8 | **Add stage** | `<Button>` L238 | Inline input → `useCreateGoalStage()` |
| 9 | **Delete stage** | L363-369 | `useDeleteGoalStage()` |
| 10 | **Resources section** | L403-450 | CRUD for `project_resources` table |
| 11 | **Add resource** | L409 | Inline form (title + optional URL) |
| 12 | **Open resource link** | `<ExternalLink>` L427 | Opens in new tab |
| 13 | **Delete resource** | `<Trash2>` L431 | Direct Supabase delete |

### 5.2 Confetti Celebration System

```typescript
// Milestone thresholds trigger escalating celebrations:
100% → 200 particles, spread 100 + toast "🏆 Goal achieved!"
75%  → 80 particles,  spread 60
50%  → 60 particles,  spread 50
25%  → 40 particles,  spread 40
each → 15 particles,  spread 30 (mini celebration)
```

### 5.3 Stage Progress Calculation

Per-stage progress is computed inline:
```typescript
const stageCompleted = stageTasks.filter(t => t.completed).length;
const stageTotal = stageTasks.length;
const stageProgress = stageTotal > 0 ? Math.round((stageCompleted / stageTotal) * 100) : 0;
```

---

## 6. Shared Components

### 6.1 PageHeader

**File**: `src/components/PageHeader.tsx`

Renders the editable project header with:
- **Title** — Inline editable (`onTitleChange`)
- **Icon** — Emoji or uploaded image (`onIconChange`)
- **Cover image** — Full-width banner (`onCoverChange`)

All changes persist via `useUpdateProject().mutate()`.

### 6.2 TaskEditor

**File**: `src/components/TaskEditor.tsx`

Slide-over panel (right side, 420px max) for creating/editing tasks.

| Field | Type | Notes |
|---|---|---|
| Title | `<Input>` | Required, auto-focus |
| Description | `<Textarea>` | Optional |
| Project | `<Select>` | Only shown for new tasks without `projectId` |
| Status | `<Select>` | backlog, ready, in_progress, review, done |
| Priority | Button group | low (green), medium (amber), high (red) |
| Due Date | `<Input type="date">` | With clear button |
| Duration | `<Input type="number">` | Minutes, with formatted display |
| Min Chunk | `<Input type="number">` | Minimum schedulable block |
| Assignee | `<Input>` | Free-text |
| Labels | Pill buttons | Urgent, Important, Review, Blocked |
| Auto-schedule | `<Checkbox>` | With Sparkles icon |

**Draft saving**: Every 2 seconds via `localStorage`.

### 6.3 AITaskGenerator

**File**: `src/components/AITaskGenerator.tsx`

Modal dialog for AI-powered task generation.

**Flow**:
1. User types natural language prompt
2. Calls `generate-tasks` edge function
3. Returns structured task list with title, priority, description
4. User selects/deselects tasks via checkboxes
5. "Add X Tasks" → `useCreateTask()` for each selected task

### 6.4 QuickEmailComposer

Available on Event and Goal detail views. Provides quick email composition for project-related communication.

### 6.5 DocumentsTab

**File**: `src/components/DocumentsTab.tsx`

File upload and management for project documents. Accessed via "Playbooks" tab in generic view.

---

## 7. Data Layer — Hooks & Mutations

### 7.1 Task Hooks (`src/hooks/useTasks.ts`)

| Hook | Query Key | Purpose |
|---|---|---|
| `useTasks(projectId)` | `["tasks", projectId]` | Fetch tasks for a project |
| `useAllTasks()` | `["tasks", "all"]` | Fetch all user tasks |
| `useCreateTask()` | Invalidates `["tasks"]` | Create task with full field support |
| `useUpdateTask()` | Invalidates `["tasks"]` | Partial update (status, position, priority, etc.) |
| `useDeleteTask()` | Invalidates `["tasks"]` | Delete by ID |

**Task Interface**:
```typescript
interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;          // backlog | ready | in_progress | review | done
  priority: string;        // low | medium | high
  due_date: string | null;
  position: number;
  duration: number | null;  // minutes
  min_chunk: number | null; // minimum schedulable block
  assignee: string | null;
  labels: string[];
  blocked_by: string[];
  auto_scheduled: boolean;
  created_at: string;
  updated_at: string;
}
```

### 7.2 Event Hooks (`src/hooks/useEvents.ts`)

| Hook | Query Key | Purpose |
|---|---|---|
| `useEventDetails(projectId)` | `["event_details", projectId]` | Fetch event details (1:1 with project) |
| `useUpsertEventDetails()` | Invalidates `["event_details", ...]` | Create/update event details |
| `useEventGuests(eventId)` | `["event_guests", eventId]` | Fetch guest list |
| `useAddEventGuests()` | Invalidates `["event_guests"]` | Bulk add guests |
| `useUpdateEventGuest()` | Invalidates `["event_guests"]` | Update guest status |
| `useDeleteEventGuest()` | Invalidates `["event_guests"]` | Remove guest |
| `useRsvpQuestions(eventId)` | `["rsvp_questions", eventId]` | Fetch RSVP questions |
| `useCreateRsvpQuestion()` | Invalidates `["rsvp_questions"]` | Add question |
| `useDeleteRsvpQuestion()` | Invalidates `["rsvp_questions"]` | Remove question |

### 7.3 Goal Hooks (`src/hooks/useGoals.ts`)

| Hook | Query Key | Purpose |
|---|---|---|
| `useGoalStages(projectId)` | `["goal_stages", projectId]` | Fetch stages ordered by position |
| `useGoalTasks(projectId)` | `["goal_tasks", projectId]` | Fetch all tasks across stages |
| `useCreateGoalStage()` | Invalidates `["goal_stages", ...]` | Add stage |
| `useCreateGoalTask()` | Invalidates `["goal_tasks"]` | Add task to stage |
| `useUpdateGoalTask()` | Invalidates `["goal_tasks"]` | Toggle completed, etc. |
| `useDeleteGoalStage()` | Invalidates `["goal_stages"]` | Remove stage + cascading tasks |
| `useDeleteGoalTask()` | Invalidates `["goal_tasks"]` | Remove task |

### 7.4 Project Hooks (`src/hooks/useProjects.ts`)

| Hook | Query Key | Purpose |
|---|---|---|
| `useProjects()` | `["projects", userId]` | All non-archived projects |
| `useUpdateProject()` | Invalidates `["projects"]` | Update name, icon, cover, archived |
| `useDeleteProject()` | Invalidates `["projects"]` | Permanent delete |

### 7.5 Collaborator Hooks (`src/hooks/useCollaborators.ts`)

| Hook | Purpose |
|---|---|
| `useCollaborators()` | All collaborators for user |
| `useCreateCollaborator()` | Invite co-host |
| `useDeleteCollaborator()` | Remove co-host |

---

## 8. Edge Functions (AI Endpoints)

### 8.1 `generate-tasks`

**File**: `supabase/functions/generate-tasks/index.ts`
**Model**: `google/gemini-3-flash-preview` via Lovable AI Gateway
**Auth**: Required (Bearer token validated via `supabase.auth.getClaims`)

**Request**:
```json
{
  "prompt": "Plan a birthday party for 20 people",
  "projectName": "Birthday Bash"
}
```

**Response** (via tool calling):
```json
{
  "tasks": [
    { "title": "Book venue", "priority": "high", "description": "..." },
    { "title": "Send invitations", "priority": "medium", "description": "..." }
  ]
}
```

**Error handling**: 429 (rate limit), 402 (credits exhausted), 400 (validation), 401 (auth).

### 8.2 `generate-goal-stages`

**File**: `supabase/functions/generate-goal-stages/index.ts`
**Model**: `google/gemini-3-flash-preview` via Lovable AI Gateway
**Auth**: Not required (no auth check in current implementation)

**Request**:
```json
{
  "goalName": "Buy first property",
  "goalType": "Finance"
}
```

**Response** (via tool calling):
```json
{
  "stages": [
    {
      "name": "Research & Planning",
      "description": "Understand the market...",
      "tasks": [
        { "title": "Research neighborhoods" },
        { "title": "Get pre-approved for mortgage" }
      ]
    }
  ],
  "resources": [
    { "title": "Zillow Market Reports", "url": "https://zillow.com/..." }
  ]
}
```

---

## 9. Stitch AI Integration Points

### 9.1 HIGH PRIORITY — Generic Project Intelligence

| Hook Point | Current Behavior | Stitch AI Enhancement |
|---|---|---|
| **AI Task Generation** | `AITaskGenerator` calls `generate-tasks` with prompt + project name | Inject full project context: existing tasks, stages, due dates, completion patterns. Stitch should understand what's already done and suggest what's missing. |
| **Smart Task Prioritization** | Manual priority selection (low/medium/high) | Auto-suggest priority based on due dates, blocked_by dependencies, and workload distribution across columns. |
| **Auto-Schedule** | `auto_scheduled` boolean exists but is non-functional | Stitch calculates optimal scheduling using `duration`, `min_chunk`, and calendar integration. Slot tasks into free time blocks. |
| **Blocked-By Resolution** | `blocked_by` field exists but unused in UI | Stitch detects dependency chains and warns when blocking tasks are incomplete. Surface in card UI. |

### 9.2 HIGH PRIORITY — Event Intelligence

| Hook Point | Current Behavior | Stitch AI Enhancement |
|---|---|---|
| **RSVP Predictions** | Simple status counts (accepted/pending/declined/viewed) | Predict attendance rate based on historical patterns, view-to-RSVP conversion, and time-to-event. |
| **Smart Email Composer** | 3 static templates (Reminder, Update, Thank You) | Generate personalized email content based on event type, guest status, and timing. Auto-select optimal template. |
| **Guest Engagement Scoring** | `viewed_at` and `rsvp_at` timestamps exist | Score each guest's engagement level. Flag guests who viewed but didn't RSVP for targeted follow-up. |
| **Co-Host Task Delegation** | Co-hosts listed but no task assignment | Stitch suggests task distribution among co-hosts based on responsibilities. |
| **Optimal Send Times** | Manual email sending | Predict best email send times for maximum RSVP conversion. |

### 9.3 HIGH PRIORITY — Goal Intelligence

| Hook Point | Current Behavior | Stitch AI Enhancement |
|---|---|---|
| **Stage Generation** | `generate-goal-stages` creates stages + tasks from goal name/type | Deep context-aware generation: factor in user's existing goals, past completion patterns, similar goals in the community. |
| **Progress Coaching** | Static affirmation messages at milestones (0/10/25/50/75/100%) | Dynamic coaching based on velocity. If user is ahead of schedule, celebrate. If behind, suggest catch-up strategies. |
| **Resource Recommendations** | AI-generated URLs (may be stale/broken) | Real-time resource recommendations based on current stage progress and task context. Validate URLs. |
| **Stage Rebalancing** | Fixed stages after creation | Detect overloaded stages and suggest rebalancing tasks across stages. |
| **Completion Predictions** | No ETA shown | Based on task completion velocity, predict goal completion date. |

### 9.4 MEDIUM PRIORITY — Cross-Cutting Intelligence

| Hook Point | Current Behavior | Stitch AI Enhancement |
|---|---|---|
| **Task Description Enrichment** | Manual description input | Auto-generate descriptions, acceptance criteria, and sub-steps from task titles. |
| **Label Suggestions** | 4 static labels (Urgent, Important, Review, Blocked) | Suggest labels based on task content, auto-detect blockers. |
| **Due Date Intelligence** | Manual date selection | Suggest due dates based on project timeline, task dependencies, and workload. |
| **Document Context** | Separate "Playbooks" tab | Stitch analyzes uploaded documents and suggests tasks/stages from document content. |
| **Cross-Project Insights** | Projects are isolated | Surface patterns: "Your last 3 events had 60% RSVP rate — this one has 40% so far." |

### 9.5 Implementation Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│                                                         │
│  ProjectDetail.tsx                                      │
│    ├─ AITaskGenerator ──────── invoke("generate-tasks") │
│    ├─ EventDetailView ──────── invoke("stitch-event")   │ ← NEW
│    ├─ GoalDetailView ───────── invoke("stitch-goal")    │ ← NEW
│    └─ TaskEditor ───────────── invoke("stitch-task")    │ ← NEW
│                                                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Edge Functions (Deno)                       │
│                                                         │
│  generate-tasks/         (existing — enhance)           │
│  generate-goal-stages/   (existing — enhance)           │
│  stitch-event/           (NEW — event intelligence)     │
│  stitch-goal/            (NEW — goal coaching)          │
│  stitch-task/            (NEW — task enrichment)        │
│                                                         │
│  All → Lovable AI Gateway (gemini-3-flash-preview)      │
│         https://ai.gateway.lovable.dev/v1/...           │
│         Auth: LOVABLE_API_KEY (auto-provisioned)        │
└─────────────────────────────────────────────────────────┘
```

### 9.6 Suggested New Edge Function: `stitch-event`

**Purpose**: Event intelligence hub

**Input**:
```json
{
  "action": "predict_rsvp" | "compose_email" | "guest_insights" | "suggest_followups",
  "eventId": "uuid",
  "projectName": "Birthday Party",
  "eventDate": "2026-04-15",
  "guests": [...],
  "context": { ... }
}
```

**Output varies by action**:
- `predict_rsvp`: `{ predictedAttendance: 18, confidence: 0.82, factors: [...] }`
- `compose_email`: `{ subject: "...", body: "..." }`
- `guest_insights`: `{ highEngagement: [...], needsFollowUp: [...], ghosted: [...] }`
- `suggest_followups`: `{ actions: [{ type: "email", target: "...", reason: "..." }] }`

### 9.7 Suggested New Edge Function: `stitch-goal`

**Purpose**: Goal coaching engine

**Input**:
```json
{
  "action": "coach" | "rebalance" | "predict_completion" | "suggest_resources",
  "projectId": "uuid",
  "goalName": "Buy first property",
  "stages": [...],
  "tasks": [...],
  "completionHistory": [...]
}
```

### 9.8 Enhancing Existing `generate-tasks`

Add richer context to the prompt:

```typescript
// Current:
content: `Project: ${projectName}\n\nRequest: ${prompt}\n\nGenerate actionable tasks.`

// Enhanced with Stitch:
content: `Project: ${projectName}
Existing tasks: ${existingTasks.map(t => `- [${t.status}] ${t.title}`).join('\n')}
Columns: ${columnSummary}
Due dates context: Project ends ${endDate}
Completed: ${done}/${total} tasks

Request: ${prompt}

Generate tasks that complement existing work. Don't duplicate. Consider dependencies.`
```

---

## 10. State Management & Query Keys

### 10.1 TanStack Query Key Map

| Key Pattern | Data | Invalidation Triggers |
|---|---|---|
| `["projects", userId]` | All active projects | Create, update, delete, archive project |
| `["tasks", projectId]` | Tasks for specific project | Create, update, delete task |
| `["tasks", "all"]` | All user tasks | Any task mutation |
| `["event_details", projectId]` | Event config for project | Upsert event details |
| `["event_guests", eventId]` | Guest list | Add, update, delete guest |
| `["rsvp_questions", eventId]` | RSVP questions | Create, delete question |
| `["goal_stages", projectId]` | Goal stages | Create, delete stage |
| `["goal_tasks", projectId]` | Goal tasks | Create, update, delete goal task |
| `["project_resources", projectId]` | Resource links | Direct Supabase insert/delete |

### 10.2 Local State (Component-Level)

| State Variable | Component | Purpose |
|---|---|---|
| `mainTab` | ProjectDetail | "board" \| "documents" |
| `view` | ProjectDetail | "kanban" \| "list" |
| `editingTask` | ProjectDetail | Task being edited (opens TaskEditor) |
| `addingToColumn` | ProjectDetail | Column ID for new task |
| `activeTask` | ProjectDetail | Currently dragged task (DnD overlay) |
| `aiGeneratorOpen` | ProjectDetail | AI task generator modal |
| `showDeleteModal` / `confirmChecked` | ProjectDetail | Delete confirmation flow |
| `expandedStages` | GoalDetailView | Set of expanded stage IDs |
| `showAddGuests` / `showEmailModal` / `showCoHostInvite` | EventDetailView | Modal visibility states |

---

## 11. Database Schema Reference

### 11.1 Core Tables

| Table | Key Columns | Relationships |
|---|---|---|
| `projects` | id, user_id, name, type, view_preference, archived, icon, cover_image | Parent of all |
| `tasks` | id, project_id, user_id, title, status, priority, position, due_date, duration, assignee, labels, blocked_by | → projects.id |
| `event_details` | id, project_id, event_date, location, privacy, share_token, event_type, playlist_url | → projects.id (1:1) |
| `event_guests` | id, event_id, email, name, status, viewed_at, rsvp_at, rsvp_answers | → event_details.id |
| `event_rsvp_questions` | id, event_id, question_text, question_type, position | → event_details.id |
| `goal_stages` | id, project_id, name, description, position | → projects.id |
| `goal_tasks` | id, stage_id, project_id, title, completed, completed_at, position | → goal_stages.id, projects.id |
| `project_resources` | id, project_id, title, url, resource_type | → projects.id |
| `documents` | id, project_id, user_id, name, file_url, file_type, file_size | → projects.id |
| `collaborators` | id, user_id, invited_email, project_ids, role, status | Filtered by project_ids array |

### 11.2 Key Enums / Values

| Field | Valid Values |
|---|---|
| `projects.type` | `"event"`, `"goal"`, `"generic"` (or any custom string) |
| `tasks.status` | `"backlog"`, `"ready"`, `"in_progress"`, `"review"`, `"done"` |
| `tasks.priority` | `"low"`, `"medium"`, `"high"` |
| `event_guests.status` | `"pending"`, `"accepted"`, `"declined"`, `"viewed"` |
| `event_details.privacy` | `"public"`, `"private"` |
| `event_details.event_type` | `"dinner_party"`, `"book_club"`, `"sorority_event"`, `"trip"`, `"workshop"`, `"birthday"`, `"other"` |

---

## Summary: Top 5 Stitch AI Quick Wins

1. **Enhance `generate-tasks`** — Add existing task context to avoid duplicates and suggest complementary work.
2. **Build `stitch-event` edge function** — RSVP predictions + smart email composition using guest engagement data.
3. **Build `stitch-goal` coaching** — Velocity-based completion predictions + dynamic affirmation messages.
4. **Activate `auto_scheduled` + `blocked_by`** — These fields exist in the schema but are dormant. Stitch can power them.
5. **Cross-project intelligence** — Surface patterns from historical data across all user projects.
