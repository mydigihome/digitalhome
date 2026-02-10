

# Design Overhaul + New Features — Motion AI Style

This is a large update touching every part of the app. Here's the implementation broken into ordered phases.

---

## Phase 1: Design System Overhaul

Update the color palette, typography, and component styling across the entire app.

**Colors**: Switch from Apple Blue (#007AFF) to Purple (#8B5CF6) as the primary color. Update background to warm off-white (#FAFBFC), adjust all semantic colors (success, warning, error).

**Typography**: Add Inter font via Google Fonts import. Update font-family, line-height, and body size to 14px.

**Component styling**: Update card shadows (subtle `0 1px 3px rgba(0,0,0,0.1)`), increase border-radius, soften hover states. Update the momentum score SVG to use a purple gradient.

**Files changed**: `index.html` (Inter font link), `src/index.css` (CSS variables), `tailwind.config.ts` (theme tokens).

---

## Phase 2: Navigation Update

**Sidebar bubbles**: Add purple glow on hover, purple gradient for active state. Replace Settings bubble with AI Brain Dump (Sparkles icon).

**Settings access**: Move settings to a user avatar dropdown in the top-right corner of the AppShell, with profile info + logout + settings link.

**Files changed**: `src/components/AppShell.tsx`.

---

## Phase 3: Dashboard Redesign

Replace the current 4-widget grid with updated widgets:

1. **Upcoming (Agenda)** — Query all tasks with due dates, group by: Overdue / Today / Tomorrow / This Week / Later. Show priority dot, task title, project name, relative time. Checkbox to complete. Limit 10, "View all" link. Friendly empty state.

2. **Active Projects** — Keep existing but add gradient progress bars (purple-to-blue) and project type icons.

3. **Quick Add** — Prominent "+ New Task" (purple) and "+ New Project" (blue outline) buttons that open respective modals.

4. **Quick Stats** — Keep existing, restyle with the new design tokens.

Remove the "Recent Activity" widget (replaced by Agenda). Remove static "Focus Time" for now (no real data source).

**Files changed**: `src/pages/Dashboard.tsx`.

---

## Phase 4: Calendar Rebuild (4 Views)

Add view switcher tabs: **Month** (default) | **Week** | **Day** | **Agenda**.

- **Month view**: Improve existing grid. Add purple border for today, light purple for selected day, darker weekend cells. Better task dot rendering with priority colors.

- **Week view**: 7-column layout with hourly rows. Tasks rendered as colored time blocks. Click to create task on that day/time.

- **Day view**: Single column hourly breakdown. Full task details visible in time slots.

- **Agenda view**: Scrollable list of upcoming tasks grouped by date (reuses the same grouping logic as the dashboard Agenda widget). Filters for project and priority.

Add "+ New Event" button (purple) in header. Add "Today" quick-nav button.

**Files changed**: `src/pages/CalendarPage.tsx` (major rewrite, may extract sub-components).

---

## Phase 5: Database Changes

Run a migration to add:

```text
1. ALTER TABLE projects ADD COLUMN color TEXT DEFAULT '#8B5CF6'

2. CREATE TABLE documents (file metadata for project uploads)
   - id, project_id, user_id, name, file_url, file_type, file_size, created_at
   - RLS: users manage own documents

3. CREATE TABLE brain_dumps (AI chat/voice/note captures)
   - id, user_id, type (chat|voice|note), content, tags, processed, created_at
   - RLS: users manage own brain dumps

4. Create Supabase Storage bucket "project-documents" (public: false)
   - RLS policies for authenticated users to upload/read/delete own files
```

Note: The "playbooks" table from the request is deferred — the documents tab covers file storage, and a rich-text playbook editor adds significant complexity. Can be added as a follow-up.

---

## Phase 6: Project Detail — Documents Tab

Add a tabbed section below the Kanban/List view with two tabs:

**Tab: Board** (existing Kanban/List — moved into tab)

**Tab: Documents**
- Drag-and-drop file upload area using Supabase Storage
- Grid of uploaded files showing thumbnail/icon, name, date, size
- Download and delete buttons per file
- Supported types: PDF, images, documents, audio, video

**Kanban improvements**: Colored left border on task cards (by priority), subtle lift + shadow on hover, colored column headers.

**Files changed**: `src/pages/ProjectDetail.tsx`, new `src/hooks/useDocuments.ts`, new `src/components/DocumentsTab.tsx`.

---

## Phase 7: AI Brain Dump (Floating Assistant)

**Floating button**: Fixed bottom-right, 60px purple gradient circle with Sparkles icon, subtle pulsing glow animation.

**Modal** (slides up on click): 600px max-width, 70vh height.

**Chat mode** (default):
- Chat interface with user messages (purple bubbles) and AI responses (gray bubbles)
- Uses Lovable AI (google/gemini-3-flash-preview) via a backend function
- System prompt tailored for project management: organizing thoughts into tasks/ideas
- Parse responses for actionable items with quick-create buttons

**Quick Capture mode**:
- Simple textarea with tag support (#task, #idea, #note)
- Save creates appropriate record in brain_dumps table
- Tagged #task items offer one-click task creation

**Voice Memo mode** deferred: Web Speech API transcription is unreliable across browsers. Will be added as a follow-up if needed.

**Files changed**: New `supabase/functions/brain-dump-chat/index.ts` (edge function), new `src/components/BrainDump.tsx`, update `src/App.tsx` to include floating button globally.

---

## Phase 8: Polish

- Skeleton loading screens with purple shimmer
- Warm empty states with lucide icons and encouraging copy
- Toast styling updates (green success, red error)
- Page transition animations (fade + slide, 300ms)
- Task card drag feedback (scale 1.05)
- Mobile bottom nav for small screens

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `src/components/BrainDump.tsx` | Floating AI assistant modal |
| `src/components/DocumentsTab.tsx` | File upload/management for projects |
| `src/hooks/useDocuments.ts` | Document CRUD hooks |
| `src/hooks/useBrainDumps.ts` | Brain dump CRUD hooks |
| `supabase/functions/brain-dump-chat/index.ts` | AI chat edge function |

## Technical Notes

- The "Sync with Motion" concept is removed — this app IS the project management platform, not a wrapper around Motion AI. The design language is inspired by Motion but the app is standalone.
- Voice memo recording is deferred due to browser compatibility concerns with Web Speech API.
- Playbooks (rich-text editor) deferred to a follow-up iteration.
- Timeline calendar view deferred (complex Gantt-style rendering).

