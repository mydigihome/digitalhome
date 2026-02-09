import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateTask } from "@/hooks/useTasks";
import { motion } from "framer-motion";
import { format, isToday, formatDistanceToNow, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import AppShell from "@/components/AppShell";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const updateTask = useUpdateTask();

  const name = profile?.full_name || "there";
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const momentum = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const highPriorityTasks = tasks.filter((t) => t.priority === "high" && t.status !== "done").slice(0, 3);
  const dueTodayCount = tasks.filter((t) => t.due_date && isToday(new Date(t.due_date)) && t.status !== "done").length;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const completedThisWeek = tasks.filter(
    (t) => t.status === "done" && isWithinInterval(new Date(t.updated_at), { start: weekStart, end: weekEnd })
  ).length;

  const recentTasks = tasks.slice(0, 5);

  const activeProjects = projects.slice(0, 3).map((p) => {
    const projectTasks = tasks.filter((t) => t.project_id === p.id);
    const done = projectTasks.filter((t) => t.status === "done").length;
    const total = projectTasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...p, progress, total, done };
  });

  const toggleTask = (taskId: string, currentStatus: string) => {
    updateTask.mutate({ id: taskId, status: currentStatus === "done" ? "backlog" : "done" });
  };

  const projectNameMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            <h1 className="mt-1 text-[32px] font-semibold tracking-tight">
              {getGreeting()}, {name}
            </h1>
          </div>
          {/* Momentum Score */}
          <div className="flex flex-col items-center">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" className="stroke-muted" />
                <circle
                  cx="32" cy="32" r="28" fill="none" strokeWidth="4"
                  className="stroke-primary"
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
        <div className="grid gap-6 md:grid-cols-2">
          {/* Today Focus */}
          <Card className="rounded-2xl border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Today Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {highPriorityTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No high-priority tasks</p>
              ) : (
                highPriorityTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={t.status === "done"}
                      onCheckedChange={() => toggleTask(t.id, t.status)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{projectNameMap[t.project_id] || ""}</p>
                    </div>
                  </div>
                ))
              )}
              <div className="mt-3 flex gap-6 border-t border-border pt-3 text-sm">
                <div>
                  <span className="text-lg font-medium">{dueTodayCount}</span>
                  <span className="ml-1 text-muted-foreground">due today</span>
                </div>
                <div>
                  <span className="text-lg font-medium">0</span>
                  <span className="ml-1 text-muted-foreground">focus hrs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="rounded-2xl border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Active Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet</p>
              ) : (
                activeProjects.map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p.name}</span>
                      <span className={`text-xs ${p.progress >= 50 ? "text-success" : "text-warning"}`}>
                        {p.progress >= 50 ? "On track" : "At risk"}
                      </span>
                    </div>
                    <Progress value={p.progress} className="mt-1.5 h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{p.done}/{p.total} tasks done</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="rounded-2xl border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[32px] font-medium">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div>
                  <p className="text-[32px] font-medium">{totalTasks}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div>
                  <p className="text-[32px] font-medium">{completedThisWeek}</p>
                  <p className="text-xs text-muted-foreground">Done this week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="rounded-2xl border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                recentTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{projectNameMap[t.project_id] || ""}</p>
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AppShell>
  );
}
