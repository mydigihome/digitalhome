# Event Detail Screen — Stitch AI Integration Guide

> Comprehensive map of UI interaction points, data flow, and AI hook opportunities for the Event system across **Host View** (`EventDetailView.tsx`), **Public Guest View** (`PublicEventPage.tsx`), and **Creation Flow** (`CreateEventModal.tsx`).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Data Layer — Hooks & Mutations](#data-layer)
4. [Database Schema](#database-schema)
5. [Edge Functions](#edge-functions)
6. [UI Interaction Points — Host View](#host-view-interactions)
7. [UI Interaction Points — Public Guest View](#public-guest-view-interactions)
8. [UI Interaction Points — Creation Flow](#creation-flow-interactions)
9. [Stitch AI Integration Points](#stitch-ai-integration-points)
10. [State Management Patterns](#state-management-patterns)
11. [Quick Reference: File Locations](#file-locations)

---

## 1. Architecture Overview <a id="architecture-overview"></a>

The Event system spans three distinct screens:

| Screen | Component | Route | Auth Required |
|--------|-----------|-------|---------------|
| Host Dashboard | `EventDetailView.tsx` | `/project/:id` (when `project.type === "event"`) | ✅ |
| Public RSVP Page | `PublicEventPage.tsx` | `/events/:token` | ❌ |
| Creation Modal | `CreateEventModal.tsx` | Overlay (triggered from Projects page) | ✅ |

### Data Flow Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  CreateEventModal │────▶│     projects      │◀────│  ProjectDetail   │
│   (3-step wizard) │     │   event_details   │     │  (routing shell) │
│                   │     │   event_guests    │     │        │         │
└──────────────────┘     │   event_rsvp_q's  │     │        ▼         │
                         │   collaborators   │     │ EventDetailView  │
                         └────────┬──────────┘     │  (host dashboard)│
                                  │                └──────────────────┘
                                  │
                         ┌────────▼──────────┐
                         │  event-rsvp        │
                         │  (Edge Function)   │
                         │  GET/POST/PATCH    │
                         └────────┬──────────┘
                                  │
                         ┌────────▼──────────┐
                         │  PublicEventPage   │
                         │  (guest RSVP view) │
                         └──────────────────┘
```

---

## 2. Component Hierarchy <a id="component-hierarchy"></a>

### Host View — `EventDetailView.tsx`

```
EventDetailView
├── Hero Section (cover image + gradient overlay)
│   ├── Event type badge
│   ├── Event title (projectName)
│   ├── Date / Time / Location row
├── Share & Actions Bar
│   ├── Copy Link button
│   ├── Invite Co-Hosts button → CoHostInviteModal
│   ├── Email All Guests button → EmailComposerModal
│   ├── Email Accepted button → EmailComposerModal
│   └── Privacy badge (Public/Private)
├── Co-Hosts Section (if any exist)
│   └── Co-host rows (avatar, email, status, delete)
├── Description Section (About card)
├── Guest Management Dashboard
│   ├── Header (counts: total, accepted, pending, declined, viewed)
│   ├── Add Guests button → AddGuestsModal
│   └── Guest rows (status icon, name/email, viewed_at, delete)
│       └── RSVP deadline footer
├── AddGuestsModal (textarea for bulk emails)
├── EmailComposerModal (template select, body, send via mailto:)
└── CoHostInviteModal (email input, current co-hosts list)
```

### Public Guest View — `PublicEventPage.tsx`

```
PublicEventPage
├── Hero (cover image or gradient)
├── Floating Card
│   ├── Event type badge
│   ├── Title
│   ├── Date / Time / Location
│   ├── Description
│   ├── RSVP Button → Inline RSVP Form
│   │   ├── Name input
│   │   ├── Email input
│   │   ├── Attendance buttons (Yes / No / Maybe)
│   │   ├── Custom RSVP questions (dynamic from DB)
│   │   └── Submit button
│   └── Success state (checkmark + confirmation)
├── Extras Grid (2×2, always visible)
│   ├── Add to Calendar → AddToCalendarButton
│   │   └── Dropdown: Apple, Google, Outlook, .ics download
│   ├── Shared Album (status display)
│   ├── Playlist (link or disabled state)
│   └── External Link (link or disabled state)
└── Footer ("Powered by Digital Home")
```

### Creation Flow — `CreateEventModal.tsx`

```
CreateEventModal (3-step wizard)
├── Step 0: Basic Info
│   ├── Event Name input
│   └── Event Type grid (7 types with emojis)
├── Step 1: Details
│   ├── Date + Time inputs
│   ├── Location type toggle (Physical / Virtual)
│   ├── Location input
│   ├── Description textarea
│   └── Cover Image upload
├── Step 2: Guests & RSVP
│   ├── Guest Emails textarea (bulk)
│   ├── RSVP Deadline date input
│   ├── Privacy toggle (Private / Public)
│   └── Custom RSVP Questions (add/remove)
└── Navigation (Back / Continue / Create Event)
```

---

## 3. Data Layer — Hooks & Mutations <a id="data-layer"></a>

### Primary Hooks (from `src/hooks/useEvents.ts`)

| Hook | Table | Query Key | Purpose |
|------|-------|-----------|---------|
| `useEventDetails(projectId)` | `event_details` | `["event_details", projectId]` | Fetch event config for a project |
| `useEventGuests(eventId)` | `event_guests` | `["event_guests", eventId]` | Fetch all guests for an event |
| `useRsvpQuestions(eventId)` | `event_rsvp_questions` | `["rsvp_questions", eventId]` | Fetch custom RSVP questions |

### Mutations

| Mutation | Table | Invalidates | Used In |
|----------|-------|-------------|---------|
| `useUpsertEventDetails()` | `event_details` | `["event_details", projectId]` | CreateEventModal, (future: inline edit) |
| `useAddEventGuests()` | `event_guests` | `["event_guests"]` | EventDetailView, CreateEventModal |
| `useUpdateEventGuest()` | `event_guests` | `["event_guests"]` | (Available but unused in UI currently) |
| `useDeleteEventGuest()` | `event_guests` | `["event_guests"]` | EventDetailView (delete button per guest) |
| `useCreateRsvpQuestion()` | `event_rsvp_questions` | `["rsvp_questions"]` | CreateEventModal |
| `useDeleteRsvpQuestion()` | `event_rsvp_questions` | `["rsvp_questions"]` | (Available but unused in UI currently) |

### Supporting Hooks

| Hook | Source | Purpose |
|------|--------|---------|
| `useCollaborators()` | `src/hooks/useCollaborators.ts` | Fetch all collaborators, filtered by `project_ids` for co-hosts |
| `useCreateCollaborator()` | `src/hooks/useCollaborators.ts` | Invite co-hosts |
| `useDeleteCollaborator()` | `src/hooks/useCollaborators.ts` | Remove co-hosts |
| `useAuth()` | `src/hooks/useAuth.tsx` | Current user context |
| `useCreateProject()` | `src/hooks/useProjects.ts` | Create parent project (type: "event") |

---

## 4. Database Schema <a id="database-schema"></a>

### `event_details` (one-to-one with `projects`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | Auto-generated |
| `project_id` | uuid FK → projects.id | Unique constraint |
| `event_date` | timestamptz | Nullable |
| `location` | text | Nullable |
| `location_type` | text | "physical" or "virtual" |
| `description` | text | Nullable |
| `rsvp_deadline` | timestamptz | Nullable |
| `privacy` | text | "public" or "private" |
| `share_token` | text | Auto-generated, used in public URL |
| `event_type` | text | "dinner_party", "book_club", "birthday", etc. |
| `shared_album_enabled` | boolean | Default false |
| `playlist_url` | text | Nullable |
| `external_link_url` | text | Nullable |
| `external_link_label` | text | Nullable |
| `background_style` | text | Default value, currently unused in UI |

### `event_guests`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `event_id` | uuid FK → event_details.id | |
| `email` | text | Guest email (lowercase) |
| `name` | text | Nullable, filled on RSVP |
| `status` | text | "pending", "viewed", "accepted", "declined" |
| `viewed_at` | timestamptz | Set when guest opens public page |
| `rsvp_at` | timestamptz | Set when guest submits RSVP |
| `rsvp_answers` | jsonb | Custom question responses |

### `event_rsvp_questions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `event_id` | uuid FK → event_details.id | |
| `question_text` | text | The question |
| `question_type` | text | Default "text" |
| `position` | integer | Display order |

### `collaborators` (co-hosts)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | Event owner |
| `invited_email` | text | Co-host email |
| `invited_user_id` | uuid | Nullable (if registered) |
| `role` | text | "editor" for co-hosts |
| `status` | text | "pending" / "accepted" |
| `project_ids` | uuid[] | Array of project IDs scoped to |

---

## 5. Edge Functions <a id="edge-functions"></a>

### `event-rsvp` (`supabase/functions/event-rsvp/index.ts`)

| Method | Purpose | Input | Output |
|--------|---------|-------|--------|
| `GET ?token=xxx` | Fetch public event data | `token` (share_token) | `{ event, questions }` |
| `POST ?token=xxx` | Submit RSVP | `{ guest_email, status, name?, answers? }` | `{ success: true }` |
| `PATCH ?token=xxx` | Track page view | `{ guest_email }` | `{ success: true }` |

**Key behaviors:**
- Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS for public access)
- Checks RSVP deadline before accepting submissions
- Upserts guest records (updates existing, creates new for public events)
- PATCH sets `viewed_at` timestamp and changes status from "pending" → "viewed"

---

## 6. UI Interaction Points — Host View <a id="host-view-interactions"></a>

### 6.1 Hero Section

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| Cover image | Displays `coverImage` or gradient fallback | 🤖 **Auto-suggest cover images** based on event type (e.g., birthday → cake images) |
| Event type badge | Static display of `event.event_type` | — |
| Date/Time/Location row | Static display | 🤖 **Smart scheduling**: suggest optimal times based on guest timezone analysis |

### 6.2 Share & Actions Bar

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| **Copy Link** | `navigator.clipboard.writeText(shareUrl)` → toast | — |
| **Invite Co-Hosts** | Opens modal → email input → `createCollab.mutateAsync()` | 🤖 **Suggest co-hosts** from user's collaborator history |
| **Email All Guests** | Opens EmailComposerModal with `emailFilter="all"` | 🤖 **AI-generated email body** based on event context, guest status mix, and timing |
| **Email Accepted** | Opens EmailComposerModal with `emailFilter="accepted"` | 🤖 **Smart email timing**: suggest when to send based on event proximity |
| **Privacy badge** | Static display | — |

### 6.3 Co-Hosts Section

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| Co-host rows | Display invited co-hosts with status | 🤖 **Role suggestions**: recommend assigning responsibilities to co-hosts |
| Delete co-host | `deleteCollab.mutate(host.id)` | — |

### 6.4 Guest Management Dashboard

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| **Status counts** | `counts.total / accepted / pending / declined / viewed` | 🤖 **RSVP predictions**: estimate final attendance based on current response patterns |
| **Add Guests** button | Opens AddGuestsModal → textarea → `addGuests.mutateAsync()` | 🤖 **Smart guest suggestions**: recommend people from user's contact history, past events |
| **Guest rows** | Status icon + name/email + viewed_at + delete button | 🤖 **Nudge suggestions**: "3 guests viewed but haven't responded — send a reminder?" |
| **RSVP deadline** | Static display with "Expired" badge if past | 🤖 **Deadline intelligence**: "Extend deadline? 5 guests haven't responded yet" |

### 6.5 Email Composer Modal

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| **Template selector** | 3 hardcoded templates: Reminder, Update, Thank You | 🤖 **AI template generation**: dynamic templates based on event stage (pre-event, day-of, post-event) |
| **Recipient count** | Shows count based on filter | 🤖 **Smart segmentation**: suggest targeting subgroups (e.g., "viewed but not responded") |
| **Email body** | Editable textarea pre-filled from template | 🤖 **AI rewrite**: tone adjustment, personalization, length optimization |
| **Send button** | Opens `mailto:` with all recipients | 🤖 **Send optimization**: suggest best send time |

### 6.6 Add Guests Modal

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| **Email textarea** | Free-text, split by `,`, `;`, `\n` | 🤖 **Contact import**: parse from address books, suggest from past events |
| **Add button** | Validates emails → `addGuests.mutateAsync()` | 🤖 **Duplicate detection**: warn about already-invited guests |

---

## 7. UI Interaction Points — Public Guest View <a id="public-guest-view-interactions"></a>

### 7.1 Event Display

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| Hero image | Cover image or gradient | — |
| Event details | Date, time, location from `event_details` | 🤖 **Contextual info**: weather forecast, travel time estimates for physical events |
| Description | Whitespace-preserved text | — |

### 7.2 RSVP Flow

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| **RSVP Now** button | Toggles inline form visibility | — |
| **Name input** | Free text | — |
| **Email input** | Required, used as guest identifier | — |
| **Attendance buttons** | Yes/No/Maybe → sets `form.status` | — |
| **Custom questions** | Rendered from `questions` array, stored in `form.answers` | 🤖 **Smart RSVP questions**: suggest relevant questions based on event type |
| **Submit** | `POST` to `event-rsvp` edge function | 🤖 **Post-RSVP engagement**: after "Yes" → show contextual info (directions, what to bring) |
| **Success state** | Checkmark + "You're In!" | 🤖 **Personalized confirmation**: include specific info relevant to guest's answers |

### 7.3 Extras Grid (2×2)

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| **Add to Calendar** | `AddToCalendarButton` → Apple, Google, Outlook, .ics | — |
| **Shared Album** | Status display (enabled/disabled) | 🤖 **Photo prompts**: after event date, prompt guests to upload photos |
| **Playlist** | Link to external URL or disabled state | 🤖 **Playlist curation**: suggest songs based on event type/theme |
| **External Link** | Link or disabled state | — |

---

## 8. UI Interaction Points — Creation Flow <a id="creation-flow-interactions"></a>

### Step 0: Basic Info

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| **Event Name** | Text input, required | 🤖 **Name suggestions**: based on event type selection |
| **Event Type grid** | 7 options with emojis | 🤖 **Type recommendation**: based on event name analysis |

### Step 1: Details

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| **Date + Time** | `<input type="date/time">` | 🤖 **Smart scheduling**: check conflicts with user's calendar events |
| **Location toggle** | Physical / Virtual | — |
| **Location input** | Free text | 🤖 **Location autocomplete**: suggest venues, auto-fill addresses |
| **Description** | Textarea | 🤖 **AI description generator**: create engaging description from event name + type + date |
| **Cover Image** | Upload to `user-assets` bucket | 🤖 **AI cover generation**: generate themed cover based on event type |

### Step 2: Guests & RSVP

| Element | Current Behavior | Stitch AI Hook |
|---------|-----------------|----------------|
| **Guest Emails** | Bulk textarea | 🤖 **Contact suggestions**: from past events and collaborators |
| **RSVP Deadline** | Date input | 🤖 **Smart deadline**: suggest based on event date (e.g., 3 days before) |
| **Privacy toggle** | Private / Public | — |
| **RSVP Questions** | Add/remove custom questions | 🤖 **Question suggestions**: based on event type (dietary for dinner, gear for trip) |
| **Create Event** | Multi-step mutation chain | — |

---

## 9. Stitch AI Integration Points <a id="stitch-ai-integration-points"></a>

### Priority 1: High-Value Quick Wins

| Feature | Where to Hook | Input Data | Expected Output | Implementation |
|---------|--------------|------------|-----------------|----------------|
| **AI Email Composer** | `EmailComposerModal` in `EventDetailView.tsx` | `projectName`, `event`, `guests`, `emailFilter`, event stage | Personalized email body | New edge function `stitch-event-email` using Lovable AI |
| **RSVP Nudge Alerts** | Guest Management Dashboard header | `guests[]` with status/viewed_at timestamps | Actionable suggestions ("5 viewed, not responded") | Client-side logic, computed from `guests` array |
| **Smart RSVP Questions** | Step 2 of `CreateEventModal.tsx` | `event_type`, `location_type` | Array of suggested questions | Edge function or client-side mapping |

### Priority 2: Enhancement Opportunities

| Feature | Where to Hook | Input Data | Expected Output | Implementation |
|---------|--------------|------------|-----------------|----------------|
| **AI Event Description** | Step 1 of `CreateEventModal.tsx` | `name`, `event_type`, `event_date`, `location` | Engaging event description | Edge function `stitch-event-description` |
| **Attendance Prediction** | Status counts section in `EventDetailView.tsx` | Historical guest patterns, current RSVP ratios | Predicted final headcount | Edge function with ML model or heuristic |
| **Post-Event Summary** | New section in `EventDetailView.tsx` | `guests[]`, `event_date` (past), RSVP answers | Event recap with stats | Client-side computation + AI narrative |
| **Calendar Conflict Check** | Step 1 of `CreateEventModal.tsx` | `event_date`, user's `calendar_events` | Conflicts list | Client-side query against `calendar_events` table |

### Priority 3: Ambient Intelligence

| Feature | Where to Hook | Input Data | Expected Output | Implementation |
|---------|--------------|------------|-----------------|----------------|
| **Smart Cover Images** | Step 1 of `CreateEventModal.tsx` | `event_type`, `name` | AI-generated or suggested cover | Image generation API |
| **Guest Clustering** | Guest rows in `EventDetailView.tsx` | Guest email domains, past event co-attendance | Group labels (e.g., "Work colleagues", "College friends") | Edge function analysis |
| **Follow-Up Automation** | Post-event state in `EventDetailView.tsx` | Event date (past), guest statuses | Suggested follow-up actions | Scheduled edge function |
| **Weather Integration** | Public event page extras grid | `event_date`, `location` | Weather forecast card | External API in edge function |

---

## 10. State Management Patterns <a id="state-management-patterns"></a>

### TanStack Query Keys

```typescript
["event_details", projectId]     // Event config for a project
["event_guests", eventId]        // Guest list for an event
["rsvp_questions", eventId]      // Custom RSVP questions
["collaborators"]                // All collaborators (filtered client-side)
["projects"]                     // Parent project data
```

### Mutation → Invalidation Flow

```typescript
// Adding guests
addGuests.mutateAsync(guests) → invalidates ["event_guests"]

// Upserting event details
upsertEvent.mutateAsync(details) → invalidates ["event_details", projectId]

// Creating co-host
createCollab.mutateAsync(collab) → invalidates ["collaborators"]

// Deleting guest
deleteGuest.mutate(id) → invalidates ["event_guests"]
```

### Component-Level State

```typescript
// EventDetailView.tsx
showAddGuests: boolean          // Add Guests modal visibility
newEmails: string               // Textarea content for bulk email input
showEmailModal: boolean         // Email composer visibility
emailFilter: "all" | "accepted" // Which guests to email
emailTemplate: number           // Selected template index (0-2)
emailBody: string               // Editable email body
showCoHostInvite: boolean       // Co-host invite modal visibility
coHostEmail: string             // Co-host email input

// PublicEventPage.tsx
event: EventData | null         // Fetched event (non-reactive, useState)
questions: Question[]           // RSVP questions
loading / error / submitted     // UI states
showRsvp: boolean               // RSVP form visibility
form.name / email / status / answers // RSVP form fields

// CreateEventModal.tsx
step: number (0-2)              // Wizard step
form: { name, event_type, event_date, event_time, location,
        location_type, description, cover_image, guest_emails,
        rsvp_deadline, privacy, rsvp_questions }
newQuestion: string             // Temp input for adding RSVP questions
submitting: boolean             // Submit loading state
```

---

## 11. Quick Reference: File Locations <a id="file-locations"></a>

### Pages

| File | Purpose |
|------|---------|
| `src/pages/ProjectDetail.tsx` | Routing shell — renders `EventDetailView` when `project.type === "event"` |
| `src/pages/PublicEventPage.tsx` | Public guest-facing RSVP page |

### Components

| File | Purpose |
|------|---------|
| `src/components/events/EventDetailView.tsx` | Host dashboard (guest mgmt, emails, co-hosts) |
| `src/components/events/CreateEventModal.tsx` | 3-step event creation wizard |
| `src/components/events/AddToCalendarButton.tsx` | Calendar export dropdown (Apple, Google, Outlook, .ics) |
| `src/components/events/QuickEmailComposer.tsx` | Context-aware email button (used in generic project detail) |

### Hooks

| File | Purpose |
|------|---------|
| `src/hooks/useEvents.ts` | All event CRUD hooks (details, guests, RSVP questions) |
| `src/hooks/useCollaborators.ts` | Co-host management |
| `src/hooks/useProjects.ts` | Parent project CRUD |
| `src/hooks/useAuth.tsx` | Authentication context |

### Edge Functions

| File | Purpose |
|------|---------|
| `supabase/functions/event-rsvp/index.ts` | Public RSVP API (GET event, POST RSVP, PATCH view tracking) |

### Proposed New Edge Functions for Stitch AI

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `stitch-event-email` | AI-powered email composition | Event context, guest data, template type | Generated email body |
| `stitch-event-description` | AI event description generator | Event name, type, date, location | Engaging description text |
| `stitch-event-insights` | RSVP analytics & predictions | Guest list with statuses and timestamps | Predictions, nudges, segments |

---

## Appendix: Email Templates (Hardcoded)

Currently defined in `EventDetailView.tsx` as `EMAIL_TEMPLATES`:

| Template | Subject Pattern | Use Case |
|----------|----------------|----------|
| Reminder | `Reminder: {eventName}` | Pre-event nudge |
| Update | `Update: {eventName}` | Mid-planning changes |
| Thank You | `Thank You - {eventName}` | Post-event follow-up |

**Stitch AI Opportunity:** Replace hardcoded templates with dynamically generated content based on:
- Days until event (`event_date - now()`)
- Guest response rates (`counts.pending / counts.total`)
- Event type (dinner party vs. workshop vs. trip)
- Previous email history (avoid duplicate sends)

---

## Appendix: Event Types

Defined in `CreateEventModal.tsx`:

| Value | Label | Emoji |
|-------|-------|-------|
| `dinner_party` | Dinner Party | 🍽️ |
| `book_club` | Book Club | 📚 |
| `sorority_event` | Sorority Event | 💜 |
| `trip` | Trip | ✈️ |
| `workshop` | Workshop | 🎨 |
| `birthday` | Birthday | 🎂 |
| `other` | Other | 🎯 |

These types can be used by Stitch AI to contextualize suggestions (RSVP questions, descriptions, cover images, email tone).
