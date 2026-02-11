import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks, useUpdateTask } from "@/hooks/useTasks";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  format, isToday, isPast, isBefore, endOfWeek, addDays, isTomorrow,
} from "date-fns";
import {
  Plus, FolderOpen, Calendar, Clock, ExternalLink,
  CheckCircle2, Sparkles, Edit2, Check, Search, ImageIcon, StickyNote,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";
import PageHeader from "@/components/PageHeader";

import NotesWidget from "@/components/NotesWidget";
import NoteEditor from "@/components/NoteEditor";
import BrainDumpWidget from "@/components/BrainDumpWidget";
import { cn } from "@/lib/utils";

interface EverydayLink {
  id: string;
  name: string;
  icon: string;
  url: string;
  completed: boolean;
  image?: string;
}

function getFaviconUrl(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (parsed.protocol === "mailto:") return null;
    if (parsed.hostname === "" || parsed.hash) return null;
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return null;
  }
}

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useState(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  });
  return now;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const updateTask = useUpdateTask();
  const navigate = useNavigate();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [taskEventToggle, setTaskEventToggle] = useState<"task" | "event">("task");
  const [editingLinks, setEditingLinks] = useState(false);
  const now = useCurrentTime();

  const [everydayLinks, setEverydayLinks] = useState<EverydayLink[]>([
    { id: "1", name: "Check your email", icon: "📧", url: "mailto:", completed: false },
    { id: "2", name: "Review Shopify Sales", icon: "🛍️", url: "https://shopify.com", completed: false },
    { id: "3", name: "Check Application Status", icon: "📝", url: "#applications", completed: false },
  ]);

  const toggleLinkCompletion = (id: string) => {
    setEverydayLinks(everydayLinks.map(link =>
      link.id === id ? { ...link, completed: !link.completed } : link
    ));
  };

  const addNewLink = () => {
    setEverydayLinks([...everydayLinks, {
      id: Date.now().toString(), name: "New Link", icon: "🔗", url: "#", completed: false,
    }]);
  };

  const updateLink = (id: string, field: string, value: string) => {
    setEverydayLinks(everydayLinks.map(link =>
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const deleteLink = (id: string) => {
    setEverydayLinks(everydayLinks.filter(link => link.id !== id));
  };

  // Group tasks for agenda
  const activeTasks = tasks.filter(t => t.status !== "done" && t.due_date);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const overdue = activeTasks.filter(t => isPast(new Date(t.due_date!)) && !isToday(new Date(t.due_date!)));
  const todayTasks = activeTasks.filter(t => isToday(new Date(t.due_date!)));
  const tomorrowTasks = activeTasks.filter(t => isTomorrow(new Date(t.due_date!)));
  const thisWeekTasks = activeTasks.filter(t => {
    const d = new Date(t.due_date!);
    return !isToday(d) && !isPast(d) && !isTomorrow(d) && isBefore(d, addDays(weekEnd, 1));
  });

  const agendaGroups = [
    { label: "Overdue", dotColor: "bg-destructive", items: overdue },
    { label: "Today", dotColor: "bg-warning", items: todayTasks },
    { label: "Tomorrow", dotColor: "bg-info", items: tomorrowTasks },
    { label: "This week", dotColor: "bg-muted-foreground", items: thisWeekTasks },
  ].filter(g => g.items.length > 0);

  const projectNameMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const toggleTask = (taskId: string, currentStatus: string) => {
    updateTask.mutate({ id: taskId, status: currentStatus === "done" ? "backlog" : "done" });
  };

  const allAgendaItems = agendaGroups.flatMap(g => g.items).slice(0, 8);
  const totalDone = tasks.filter(t => t.status === "done").length;
  const momentumPct = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  const projectsWithStats = projects.map((p) => {
    const ptasks = tasks.filter((t) => t.project_id === p.id);
    const done = ptasks.filter((t) => t.status === "done").length;
    const total = ptasks.length;
    return { ...p, done, total, pending: total - done };
  });
  const priorityProjects = [...projectsWithStats]
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 3);

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {/* Page Header */}
        <PageHeader
          title=""
          icon={prefs?.dashboard_icon || "🏠"}
          iconType={prefs?.dashboard_icon_type || "emoji"}
          coverImage={prefs?.dashboard_cover}
          coverType={prefs?.dashboard_cover_type || "none"}
          onIconChange={(icon, type) => upsertPrefs.mutate({ dashboard_icon: icon, dashboard_icon_type: type })}
          onCoverChange={(cover, type) => upsertPrefs.mutate({ dashboard_cover: cover, dashboard_cover_type: type })}
          editable
        />

        {/* Welcome Section */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {profile?.full_name
                    ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${profile.full_name.split(" ")[0]}`
                    : "Digital Home"}
                </h2>
                <p className="text-sm text-muted-foreground" style={{ letterSpacing: "0.3px" }}>
                  Your life in one place
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setNoteEditorOpen(true)}>
                <StickyNote className="mr-1.5 h-4 w-4" /> Add Note
              </Button>
              <Button onClick={() => setTaskEditorOpen(true)} size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> New Task
              </Button>
              <Button variant="outline" size="sm" onClick={() => setProjectModalOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> New Project
              </Button>
            </div>
          </div>

          {/* Momentum bar */}
          <div className="mt-5 max-w-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-2xl font-medium text-foreground">{momentumPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-1000 ease-out"
                style={{ width: `${momentumPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Momentum score · {totalDone} of {tasks.length} tasks complete</p>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Agenda Widget */}
          <div className="xl:col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Agenda</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 rounded-sm bg-secondary p-0.5">
                  <button
                    onClick={() => setTaskEventToggle("task")}
                    className={cn(
                      "rounded-xs px-2.5 py-1 text-xs font-medium transition-all duration-150",
                      taskEventToggle === "task"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground"
                    )}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setTaskEventToggle("event")}
                    className={cn(
                      "rounded-xs px-2.5 py-1 text-xs font-medium transition-all duration-150",
                      taskEventToggle === "event"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground"
                    )}
                  >
                    Events
                  </button>
                </div>
                <button
                  onClick={() => setTaskEditorOpen(true)}
                  className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {agendaGroups.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-lg font-medium text-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">Take a break or plan ahead</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agendaGroups.map((group) => (
                  <div key={group.label}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", group.dotColor)} />
                      <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                      <span className="text-xs text-muted-foreground">({group.items.length})</span>
                    </div>
                    <div className="space-y-0.5">
                      {group.items.slice(0, 4).map((task) => (
                        <div
                          key={task.id}
                          className="flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5 transition-all duration-100 hover:bg-secondary"
                          onClick={() => toggleTask(task.id, task.status)}
                        >
                          <Checkbox
                            checked={task.status === "done"}
                            onCheckedChange={() => toggleTask(task.id, task.status)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded"
                          />
                          <div className={cn("h-2 w-2 rounded-full", {
                            "bg-destructive": task.priority === "high",
                            "bg-warning": task.priority === "medium",
                            "bg-success": task.priority === "low",
                          })} />
                          <span className={cn("flex-1 text-sm", task.status === "done" ? "text-muted-foreground line-through" : "text-foreground hover:underline")}>
                            {task.title}
                          </span>
                          {projectNameMap[task.project_id] && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                              {projectNameMap[task.project_id]}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(task.due_date), "h:mm a")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column widgets */}
          <div className="space-y-5">
            {/* Date & Time */}
            <div className="rounded-lg bg-gradient-primary p-5 text-primary-foreground shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium opacity-80">Today</span>
              </div>
              <p className="text-md font-semibold">
                {format(now, "EEEE, MMMM d, yyyy")}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Clock className="h-4 w-4" />
                <span className="text-2xl font-semibold">
                  {format(now, "hh:mm a")}
                </span>
              </div>
            </div>

            {/* Top Priority Projects */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-warning" />
                  <h3 className="text-lg font-semibold text-foreground">Priority Projects</h3>
                </div>
                <button
                  onClick={() => navigate("/projects")}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View all
                </button>
              </div>
              {priorityProjects.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <FolderOpen className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {priorityProjects.map((project) => {
                    const pct = project.total > 0 ? Math.round((project.done / project.total) * 100) : 0;
                    return (
                      <div
                        key={project.id}
                        className="cursor-pointer rounded-sm p-3 transition-all duration-150 hover:bg-secondary"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">{project.name}</p>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: project.color || undefined }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => setTaskEditorOpen(true)}
                  className="w-full justify-start"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setProjectModalOpen(true)}
                  className="w-full justify-start"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              </div>
            </div>
          </div>

          {/* Everyday Links */}
          <div className="xl:col-span-3 md:col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Everyday Links</h3>
              <div className="flex items-center gap-1">
                {editingLinks && (
                  <button onClick={addNewLink} className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setEditingLinks(!editingLinks)}
                  className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {everydayLinks.map((link) => (
                <div key={link.id} className="group flex items-center gap-3 rounded-sm p-3 transition-all duration-100 hover:bg-secondary">
                  <button
                    onClick={() => toggleLinkCompletion(link.id)}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      link.completed
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30 hover:border-primary"
                    )}
                  >
                    {link.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                  </button>

                  {/* Link thumbnail */}
                  {(() => {
                    const imgSrc = link.image || getFaviconUrl(link.url);
                    return (
                      <div className="relative h-8 w-8 flex-shrink-0 rounded-md bg-secondary overflow-hidden flex items-center justify-center">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-sm">{link.icon}</span>
                        )}
                        {editingLinks && (
                          <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-foreground/40 opacity-0 transition-opacity hover:opacity-100">
                            <ImageIcon className="h-3.5 w-3.5 text-primary-foreground" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => updateLink(link.id, "image", ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })()}

                  {editingLinks ? (
                    <>
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => updateLink(link.id, "name", e.target.value)}
                        className="flex-1 rounded-sm border border-border bg-background px-2.5 py-1 text-sm"
                      />
                      <button onClick={() => deleteLink(link.id)} className="text-xs text-destructive hover:text-destructive/80">✕</button>
                    </>
                  ) : (
                    <>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("flex-1 text-sm", link.completed ? "text-muted-foreground line-through" : "text-foreground")}
                      >
                        {link.name}
                      </a>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Brain Dump Widget */}
          <div className="xl:col-span-3 md:col-span-2">
            <BrainDumpWidget />
          </div>

          {/* Notes Widget */}
          <div className="xl:col-span-3 md:col-span-2">
            <NotesWidget onAddNote={() => setNoteEditorOpen(true)} />
          </div>
        </div>
      </motion.div>

      <NewProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
      <NoteEditor open={noteEditorOpen} onClose={() => setNoteEditorOpen(false)} />
      {taskEditorOpen && projects.length > 0 && (
        <TaskEditor
          projectId={projects[0].id}
          defaultStatus="backlog"
          onClose={() => setTaskEditorOpen(false)}
        />
      )}
    </AppShell>
  );
}
