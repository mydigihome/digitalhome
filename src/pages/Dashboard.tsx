import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks, useUpdateTask } from "@/hooks/useTasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  format, isToday, isPast, isBefore, endOfWeek, addDays,
} from "date-fns";
import {
  Plus, FolderOpen, Calendar, Clock, ExternalLink,
  CheckCircle2, Sparkles, Info, Edit2, Check,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";
import { cn } from "@/lib/utils";

interface EverydayLink {
  id: string;
  name: string;
  icon: string;
  url: string;
  completed: boolean;
}

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useState(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  });
  return now;
}

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative">
    <Info className="h-4 w-4 cursor-help text-muted-foreground" />
    <div className="absolute left-0 top-6 z-10 hidden group-hover:block">
      <div className="w-64 rounded-lg bg-foreground p-3 text-xs text-background shadow-lg">
        <p className="mb-1 font-semibold">Best Practice</p>
        <p>{text}</p>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const updateTask = useUpdateTask();
  const navigate = useNavigate();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
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

  // Today's tasks (due today or overdue, not done)
  const todayTodos = tasks.filter((t) => {
    if (t.status === "done") return false;
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return isToday(d) || isPast(d);
  });

  // This week tasks
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const thisWeekTasks = tasks.filter((t) => {
    if (t.status === "done" || !t.due_date) return false;
    const d = new Date(t.due_date);
    return !isToday(d) && !isPast(d) && isBefore(d, addDays(weekEnd, 1));
  });

  // Priority projects
  const projectsWithStats = projects.map((p) => {
    const ptasks = tasks.filter((t) => t.project_id === p.id);
    const done = ptasks.filter((t) => t.status === "done").length;
    const total = ptasks.length;
    const pending = total - done;
    return { ...p, done, total, pending };
  });
  const priorityProjects = [...projectsWithStats]
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 3);

  const projectNameMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const toggleTask = (taskId: string, currentStatus: string) => {
    updateTask.mutate({ id: taskId, status: currentStatus === "done" ? "backlog" : "done" });
  };

  const statusLabel = (p: typeof priorityProjects[0]) => {
    if (p.total === 0) return "No Tasks";
    const pct = Math.round((p.done / p.total) * 100);
    if (pct >= 100) return "Complete";
    if (pct >= 50) return "In Progress";
    return "Planning";
  };

  const projectColor = (p: typeof priorityProjects[0]) => p.color || "hsl(var(--primary))";

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="mb-8 text-4xl font-bold text-foreground">Home Office</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* ===== Main Content (2/3) ===== */}
          <div className="space-y-6 md:col-span-2">
            {/* Today's To-Do */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold text-foreground">Today's To-Do</h2>
                  <InfoTooltip text="Add your most important tasks first. Complete at least 3 before noon for momentum!" />
                </div>
                <div className="flex items-center gap-3">
                  {/* Task/Event Toggle */}
                  <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
                    <button
                      onClick={() => setTaskEventToggle("task")}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        taskEventToggle === "task"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground"
                      )}
                    >
                      Task
                    </button>
                    <button
                      onClick={() => setTaskEventToggle("event")}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        taskEventToggle === "event"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground"
                      )}
                    >
                      Event
                    </button>
                  </div>
                  <button
                    onClick={() => setTaskEditorOpen(true)}
                    className="rounded-lg p-2 transition-colors hover:bg-secondary"
                  >
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              {todayTodos.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Sparkles className="mb-2 h-8 w-8 text-primary/40" />
                  <p className="text-sm text-muted-foreground">You're all caught up! 🎉</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {todayTodos.slice(0, 10).map((todo) => (
                    <div
                      key={todo.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary/50"
                      onClick={() => toggleTask(todo.id, todo.status)}
                    >
                      <Checkbox
                        checked={todo.status === "done"}
                        onCheckedChange={() => toggleTask(todo.id, todo.status)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span
                        className={cn(
                          "flex-1 text-sm",
                          todo.status === "done" ? "text-muted-foreground line-through" : "text-foreground"
                        )}
                      >
                        {todo.title}
                      </span>
                      {projectNameMap[todo.project_id] && (
                        <span className="text-xs text-muted-foreground">{projectNameMap[todo.project_id]}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* This Week */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-foreground">This Week</h2>
                <InfoTooltip text="Plan your week on Sunday evening. Schedule your top 3 priorities first." />
              </div>
              {thisWeekTasks.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nothing else this week</p>
              ) : (
                <div className="space-y-1">
                  {thisWeekTasks.slice(0, 8).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-secondary/50"
                    >
                      <span className="text-sm text-foreground">{task.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {task.due_date ? format(new Date(task.due_date), "EEE, MMM d") : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Everyday Links */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">Everyday Links</h3>
                  <InfoTooltip text="Check these daily! Mark as complete to build consistent habits." />
                </div>
                <div className="flex items-center gap-2">
                  {editingLinks && (
                    <button onClick={addNewLink} className="rounded-lg p-2 transition-colors hover:bg-secondary">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingLinks(!editingLinks)}
                    className="rounded-lg p-2 transition-colors hover:bg-secondary"
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {everydayLinks.map((link) => (
                  <div key={link.id} className="group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary/50">
                    <button
                      onClick={() => toggleLinkCompletion(link.id)}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                        link.completed
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30 hover:border-primary"
                      )}
                    >
                      {link.completed && <Check className="h-4 w-4 text-primary-foreground" />}
                    </button>

                    {editingLinks ? (
                      <>
                        <input
                          type="text"
                          value={link.icon}
                          onChange={(e) => updateLink(link.id, "icon", e.target.value)}
                          className="w-12 rounded border border-border bg-background px-2 py-1 text-center"
                        />
                        <input
                          type="text"
                          value={link.name}
                          onChange={(e) => updateLink(link.id, "name", e.target.value)}
                          className="flex-1 rounded border border-border bg-background px-3 py-1"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => updateLink(link.id, "url", e.target.value)}
                          className="w-40 rounded border border-border bg-background px-3 py-1 text-sm"
                          placeholder="URL"
                        />
                        <button
                          onClick={() => deleteLink(link.id)}
                          className="rounded p-1 text-destructive hover:bg-destructive/10"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">{link.icon}</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("flex-1", link.completed ? "text-muted-foreground line-through" : "text-foreground")}
                        >
                          {link.name}
                        </a>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== Sidebar Cards (1/3) ===== */}
          <div className="space-y-4">
            {/* Date & Time Card */}
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-medium">Today</span>
              </div>
              <p className="mb-4 text-lg font-semibold">
                {format(now, "EEEE, MMMM d, yyyy")}
              </p>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-bold">
                  {format(now, "hh:mm a")}
                </span>
              </div>
            </div>

            {/* Top Priority Projects */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Top Priority Projects</h3>
              {priorityProjects.length === 0 ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <FolderOpen className="mb-2 h-6 w-6 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {priorityProjects.map((project) => (
                    <div
                      key={project.id}
                      className="cursor-pointer border-l-4 py-2 pl-3 transition-colors hover:bg-secondary/30"
                      style={{ borderColor: projectColor(project) }}
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      <p className="font-medium text-foreground">{project.name}</p>
                      {project.end_date && (
                        <p className="text-xs text-muted-foreground">
                          Due: {format(new Date(project.end_date), "MMM d, yyyy")}
                        </p>
                      )}
                      <span className="mt-1 inline-block rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {statusLabel(project)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => setTaskEditorOpen(true)}
                  className="w-full justify-start bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setProjectModalOpen(true)}
                  className="w-full justify-start border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <NewProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
      {taskEditorOpen && <TaskEditor onClose={() => setTaskEditorOpen(false)} />}
    </AppShell>
  );
}
