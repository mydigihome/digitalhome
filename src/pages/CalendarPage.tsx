import { useState, useMemo } from "react";
import { useAllTasks, useUpdateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useCalendarEvents, useDeleteCalendarEvent } from "@/hooks/useCalendarEvents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Video, MapPin, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, isToday, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays, isPast, isTomorrow, isBefore,
  formatDistanceToNow,
} from "date-fns";
import { cn } from "@/lib/utils";
import AppShell from "@/components/AppShell";
import TaskEditor from "@/components/TaskEditor";

const priorityColors: Record<string, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-destructive",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: tasks = [] } = useAllTasks();
  const { data: projects = [] } = useProjects();
  const updateTask = useUpdateTask();

  const projectNameMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((t) => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = [];
        map[t.due_date].push(t);
      }
    });
    return map;
  }, [tasks]);

  const goToday = () => setCurrentDate(new Date());
  const navigate = (dir: 1 | -1) => {
    if (view === "month") setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else if (view === "day") setCurrentDate(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  const headerLabel = view === "month" ? format(currentDate, "MMMM yyyy")
    : view === "week" ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`
    : view === "day" ? format(currentDate, "EEEE, MMMM d, yyyy")
    : "Upcoming";

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="w-full max-w-full overflow-hidden"
      >
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-info" />
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Calendar</h1>
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
                <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
                <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
                <TabsTrigger value="agenda" className="text-xs">Agenda</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            {view !== "agenda" && (
              <>
                <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">Today</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[100px] md:min-w-[140px] text-center text-sm font-medium">{headerLabel}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}>
              <Plus className="mr-1 h-4 w-4" /> New Task
            </Button>
          </div>
        </div>

        {/* Calendar Views - wrapped for overflow */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[640px]">
            {view === "month" && <MonthView currentDate={currentDate} tasksByDate={tasksByDate} onSelectDate={setSelectedDate} />}
            {view === "week" && <WeekView currentDate={currentDate} tasksByDate={tasksByDate} onSelectDate={setSelectedDate} />}
          </div>
        </div>

        {/* These don't need horizontal scroll */}
        {view === "day" && <DayView currentDate={currentDate} tasksByDate={tasksByDate} onSelectDate={setSelectedDate} projectNameMap={projectNameMap} />}
        {view === "agenda" && <AgendaView tasks={tasks} projectNameMap={projectNameMap} updateTask={updateTask} />}

        {/* Today's Events */}
        <TodaysEvents />

        {/* Calendar Integration CTA */}
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <CalendarIcon className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">Connect Your Calendars</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Sync with Google Calendar, Apple Calendar, and Outlook to see all your events in one place.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Connect Google Calendar</Button>
                <Button variant="outline" size="sm">Connect Apple Calendar</Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {selectedDate && projects.length > 0 && (
        <TaskEditor
          projectId={projects[0].id}
          defaultStatus="backlog"
          onClose={() => setSelectedDate(null)}
        />
      )}
    </AppShell>
  );
}

function MonthView({ currentDate, tasksByDate, onSelectDate }: any) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <>
      <div className="grid grid-cols-7 gap-px">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="p-1 md:p-2 text-center text-[10px] md:text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate[dateKey] || [];
          const inMonth = isSameMonth(day, currentDate);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                "min-h-[60px] md:min-h-[100px] cursor-pointer p-1 md:p-2 transition-colors hover:bg-primary/5",
                inMonth ? (isWeekend ? "bg-secondary/60" : "bg-card") : "bg-muted/30 opacity-40"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday(day) && "border-2 border-primary font-medium text-primary"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 flex gap-1">
                {dayTasks.slice(0, 3).map((t: any) => (
                  <div key={t.id} className={cn("h-1.5 w-1.5 rounded-full", priorityColors[t.priority])} />
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">+{dayTasks.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function WeekView({ currentDate, tasksByDate, onSelectDate }: any) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayTasks = tasksByDate[dateKey] || [];
        return (
          <div
            key={dateKey}
            onClick={() => onSelectDate(dateKey)}
            className={cn(
              "min-h-[300px] cursor-pointer rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30",
              isToday(day) && "border-primary/40"
            )}
          >
            <div className="mb-3 text-center">
              <div className="text-[10px] font-medium uppercase text-muted-foreground">{format(day, "EEE")}</div>
              <div className={cn("mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                isToday(day) && "bg-primary text-primary-foreground"
              )}>{format(day, "d")}</div>
            </div>
            <div className="space-y-1.5">
              {dayTasks.map((t: any) => (
                <div key={t.id} className={cn("rounded-lg border-l-2 bg-secondary/50 px-2 py-1.5 text-xs", {
                  "border-l-destructive": t.priority === "high",
                  "border-l-warning": t.priority === "medium",
                  "border-l-success": t.priority === "low",
                })}>
                  {t.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ currentDate, tasksByDate, onSelectDate, projectNameMap }: any) {
  const dateKey = format(currentDate, "yyyy-MM-dd");
  const dayTasks = tasksByDate[dateKey] || [];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <span className={cn("text-sm font-medium", isToday(currentDate) && "text-primary")}>
          {isToday(currentDate) ? "Today" : format(currentDate, "EEEE")} — {dayTasks.length} tasks
        </span>
      </div>
      {dayTasks.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No tasks scheduled</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => onSelectDate(dateKey)}>
            <Plus className="mr-1 h-4 w-4" /> Add task
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {dayTasks.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className={cn("h-2.5 w-2.5 rounded-full", priorityColors[t.priority])} />
              <div className="flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{projectNameMap[t.project_id] || ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaView({ tasks, projectNameMap, updateTask }: any) {
  const now = new Date();
  const upcoming = tasks
    .filter((t: any) => t.due_date && t.status !== "done")
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const groups: { label: string; color: string; items: any[] }[] = [];
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const buckets = { Overdue: [] as any[], Today: [] as any[], Tomorrow: [] as any[], "This Week": [] as any[], Later: [] as any[] };
  const colors: Record<string, string> = { Overdue: "bg-destructive", Today: "bg-warning", Tomorrow: "bg-primary", "This Week": "bg-primary/60", Later: "bg-muted-foreground" };

  upcoming.forEach((t: any) => {
    const d = new Date(t.due_date);
    if (isPast(d) && !isToday(d)) buckets.Overdue.push(t);
    else if (isToday(d)) buckets.Today.push(t);
    else if (isTomorrow(d)) buckets.Tomorrow.push(t);
    else if (isBefore(d, weekEnd)) buckets["This Week"].push(t);
    else buckets.Later.push(t);
  });

  Object.entries(buckets).forEach(([label, items]) => {
    if (items.length > 0) groups.push({ label, color: colors[label], items });
  });

  return (
    <div className="space-y-6">
      {groups.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No upcoming tasks 🎉</p>
        </div>
      ) : groups.map((g) => (
        <div key={g.label}>
          <div className="mb-2 flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", g.color)} />
            <span className="text-sm font-medium">{g.label}</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{g.items.length}</span>
          </div>
          <div className="space-y-1">
            {g.items.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => updateTask.mutate({ id: t.id, status: "done" })}
                />
                <div className="flex-1">
                  <p className="text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {projectNameMap[t.project_id] || ""} · {formatDistanceToNow(new Date(t.due_date), { addSuffix: true })}
                  </p>
                </div>
                <div className={cn("h-2 w-2 rounded-full", priorityColors[t.priority])} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TodaysEvents() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const { data: events = [] } = useCalendarEvents({
    start: todayStart.toISOString(),
    end: todayEnd.toISOString(),
  });
  const deleteEvent = useDeleteCalendarEvent();

  if (events.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">Today's Events</h3>
      {events.map((event) => (
        <div key={event.id} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20">
          <div className="rounded-lg p-2 bg-primary">
            <CalendarIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">{event.title}</h4>
              {event.source !== "manual" && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  {event.source === "google_calendar" ? "📅 Google" : event.source}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {event.all_day
                  ? "All day"
                  : `${format(new Date(event.start_time), "h:mm a")}${event.end_time ? ` - ${format(new Date(event.end_time), "h:mm a")}` : ""}`}
              </div>
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => deleteEvent.mutate({ id: event.id, source: event.source })}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 hover:bg-destructive/10"
            title={event.source === "manual" ? "Delete event" : "Hide from view"}
          >
            <X className="h-4 w-4 text-destructive" />
          </button>
        </div>
      ))}
    </div>
  );
}
