import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks, useUpdateTask } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { format, isToday, isTomorrow, isPast, isBefore, startOfWeek, endOfWeek, isWithinInterval, addDays, formatDistanceToNow } from "date-fns";
import { Plus, FolderOpen, CheckCircle2, ListTodo, Sparkles, Home as HomeIcon, Briefcase, Dumbbell, Plane } from "lucide-react";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, any> = {
  personal: HomeIcon,
  work: Briefcase,
  fitness: Dumbbell,
  travel: Plane,
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

type TaskGroup = { label: string; color: string; tasks: any[] };

function groupTasksByDate(tasks: any[]): TaskGroup[] {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const groups: TaskGroup[] = [
    { label: "Overdue", color: "bg-destructive", tasks: [] },
    { label: "Today", color: "bg-warning", tasks: [] },
    { label: "Tomorrow", color: "bg-primary", tasks: [] },
    { label: "This Week", color: "bg-primary/60", tasks: [] },
    { label: "Later", color: "bg-muted-foreground", tasks: [] },
  ];

  tasks.forEach((t) => {
    if (!t.due_date || t.status === "done") return;
    const d = new Date(t.due_date);
    if (isPast(d) && !isToday(d)) groups[0].tasks.push(t);
    else if (isToday(d)) groups[1].tasks.push(t);
    else if (isTomorrow(d)) groups[2].tasks.push(t);
    else if (isBefore(d, weekEnd)) groups[3].tasks.push(t);
    else groups[4].tasks.push(t);
  });

  return groups.filter((g) => g.tasks.length > 0);
}

const priorityDot: Record<string, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-destructive",
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const updateTask = useUpdateTask();
  const navigate = useNavigate();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);

  const name = profile?.full_name || "there";
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const momentum = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const completedThisWeek = tasks.filter(
    (t) => t.status === "done" && isWithinInterval(new Date(t.updated_at), { start: weekStart, end: weekEnd })
  ).length;

  const agendaGroups = groupTasksByDate(tasks);
  const agendaTaskCount = agendaGroups.reduce((n, g) => n + g.tasks.length, 0);

  const activeProjects = projects.slice(0, 3).map((p) => {
    const projectTasks = tasks.filter((t) => t.project_id === p.id);
    const done = projectTasks.filter((t) => t.status === "done").length;
    const total = projectTasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...p, progress, total, done };
  });

  const projectNameMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const toggleTask = (taskId: string, currentStatus: string) => {
    updateTask.mutate({ id: taskId, status: currentStatus === "done" ? "backlog" : "done" });
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {getGreeting()}, {name}
            </h1>
          </div>
          {/* Momentum Score */}
          <div className="flex flex-col items-center">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <defs>
                  <linearGradient id="momentum-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(225, 76%, 60%)" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" className="stroke-muted" />
                <circle
                  cx="32" cy="32" r="28" fill="none" strokeWidth="4"
                  stroke="url(#momentum-gradient)"
                  strokeDasharray={`${momentum * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-medium">{momentum}%</span>
            </div>
            <span className="mt-1 text-xs text-muted-foreground">Momentum</span>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Upcoming / Agenda */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              {agendaTaskCount === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Sparkles className="mb-2 h-8 w-8 text-primary/40" />
                  <p className="text-sm text-muted-foreground">You're all caught up! 🎉</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agendaGroups.slice(0, 4).map((group) => (
                    <div key={group.label}>
                      <div className="mb-2 flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", group.color)} />
                        <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{group.tasks.length}</span>
                      </div>
                      {group.tasks.slice(0, 3).map((t) => (
                        <div key={t.id} className="flex items-center gap-3 py-1.5">
                          <Checkbox
                            checked={t.status === "done"}
                            onCheckedChange={() => toggleTask(t.id, t.status)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className={cn("truncate text-sm", t.status === "done" && "text-muted-foreground line-through")}>{t.title}</p>
                            <p className="text-xs text-muted-foreground">{projectNameMap[t.project_id] || ""}</p>
                          </div>
                          <div className={cn("h-2 w-2 shrink-0 rounded-full", priorityDot[t.priority])} />
                        </div>
                      ))}
                    </div>
                  ))}
                  {agendaTaskCount > 10 && (
                    <button onClick={() => navigate("/calendar")} className="text-xs font-medium text-primary hover:underline">
                      View all →
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Active Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeProjects.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <FolderOpen className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                </div>
              ) : (
                activeProjects.map((p) => {
                  const TypeIcon = typeIcons[p.type] || FolderOpen;
                  return (
                    <div key={p.id} className="cursor-pointer" onClick={() => navigate(`/project/${p.id}`)}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-primary/60" />
                          <span className="font-medium">{p.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{p.done}/{p.total}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Quick Add */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Quick Add</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={() => setTaskEditorOpen(true)} className="flex-1 bg-primary hover:bg-primary/90">
                <Plus className="mr-1.5 h-4 w-4" /> New Task
              </Button>
              <Button variant="outline" onClick={() => setProjectModalOpen(true)} className="flex-1 border-primary/30 text-primary hover:bg-primary/5">
                <Plus className="mr-1.5 h-4 w-4" /> New Project
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center">
                    <FolderOpen className="mr-1.5 h-4 w-4 text-primary/60" />
                    <p className="text-2xl font-medium">{projects.length}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div>
                  <div className="flex items-center justify-center">
                    <ListTodo className="mr-1.5 h-4 w-4 text-primary/60" />
                    <p className="text-2xl font-medium">{totalTasks}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div>
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="mr-1.5 h-4 w-4 text-success/60" />
                    <p className="text-2xl font-medium">{completedThisWeek}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Done this week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <NewProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
      {taskEditorOpen && (
        <TaskEditor onClose={() => setTaskEditorOpen(false)} />
      )}
    </AppShell>
  );
}
