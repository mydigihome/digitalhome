import { useState, useMemo, useEffect } from "react";
import { useAllTasks, useUpdateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useCalendarEvents, useDeleteCalendarEvent, useCreateCalendarEvent } from "@/hooks/useCalendarEvents";
import {
  useGoogleCalendarConnection,
  useConnectGoogleCalendar,
  useHandleGoogleCallback,
  useSyncGoogleCalendar,
  useDisconnectGoogleCalendar,
} from "@/hooks/useGoogleCalendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, X, RefreshCw, Link2, Unlink } from "lucide-react";
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
import { useSearchParams } from "react-router-dom";

const priorityColors: Record<string, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-destructive",
};

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: tasks = [] } = useAllTasks();
  const { data: projects = [] } = useProjects();
  const updateTask = useUpdateTask();
  const [searchParams] = useSearchParams();

  // Google Calendar
  const { data: gcalConnection, isLoading: gcalLoading } = useGoogleCalendarConnection();
  const { startConnect, connecting } = useConnectGoogleCalendar();
  const { exchangeCode } = useHandleGoogleCallback();
  const syncGoogle = useSyncGoogleCalendar();
  const disconnectGoogle = useDisconnectGoogleCalendar();

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      exchangeCode(code);
    }
  }, [searchParams, exchangeCode]);

  // Compute date range for events query
  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return { start: calStart.toISOString(), end: calEnd.toISOString() };
  }, [currentDate]);

  const { data: calendarEvents = [] } = useCalendarEvents(dateRange);

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

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof calendarEvents> = {};
    calendarEvents.forEach((e) => {
      const dateKey = format(new Date(e.start_time), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(e);
    });
    return map;
  }, [calendarEvents]);

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

  const views = ["month", "week", "day", "agenda"] as const;

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="w-full max-w-full overflow-hidden"
      >
        {/* ── Google Calendar-style Header ── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: title + nav */}
          <div className="flex items-center gap-2">
            {/* Today button */}
            {view !== "agenda" && (
              <button
                onClick={goToday}
                className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-secondary"
              >
                Today
              </button>
            )}

            {/* Prev / Next arrows */}
            {view !== "agenda" && (
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <ChevronLeft className="h-[18px] w-[18px]" />
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <ChevronRight className="h-[18px] w-[18px]" />
                </button>
              </div>
            )}

            {/* Month / Year label */}
            <h1 className="text-lg font-semibold tracking-[-0.3px] text-foreground md:text-xl">
              {headerLabel}
            </h1>
          </div>

          {/* Right: view switcher + new */}
          <div className="flex items-center gap-2">
            {/* View switcher — pill style */}
            <div className="flex rounded-lg border border-border bg-card p-0.5 shadow-sm">
              {views.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    view === v
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              className="rounded-lg shadow-sm"
              onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
            >
              <Plus className="mr-1 h-4 w-4" /> Event
            </Button>
          </div>
        </div>

        {/* Google Calendar Connection Bar */}
        <GoogleCalendarBar
          connection={gcalConnection}
          loading={gcalLoading}
          connecting={connecting}
          syncing={syncGoogle.isPending}
          onConnect={startConnect}
          onSync={() => syncGoogle.mutate()}
          onDisconnect={() => disconnectGoogle.mutate()}
        />

        {/* Calendar Views */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[640px]">
            {view === "month" && <MonthView currentDate={currentDate} tasksByDate={tasksByDate} eventsByDate={eventsByDate} onSelectDate={setSelectedDate} />}
            {view === "week" && <WeekView currentDate={currentDate} tasksByDate={tasksByDate} eventsByDate={eventsByDate} onSelectDate={setSelectedDate} />}
          </div>
        </div>

        {view === "day" && <DayView currentDate={currentDate} tasksByDate={tasksByDate} eventsByDate={eventsByDate} onSelectDate={setSelectedDate} projectNameMap={projectNameMap} />}
        {view === "agenda" && <AgendaView tasks={tasks} projectNameMap={projectNameMap} updateTask={updateTask} />}

        {/* Today's Events */}
        <TodaysEvents />

        {/* Legend */}
        <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#4285F4]" />
            Google Calendar
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            Digital Home
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
            High priority
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-warning" />
            Medium
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-success" />
            Low
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

/* ─── Google Calendar Connection Bar ─── */
function GoogleCalendarBar({ connection, loading, connecting, syncing, onConnect, onSync, onDisconnect }: {
  connection: any;
  loading: boolean;
  connecting: boolean;
  syncing: boolean;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  if (loading) return null;

  if (!connection) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <CalendarIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Connect Google Calendar</p>
          <p className="text-xs text-muted-foreground">Import your events automatically. Changes here won't affect Google.</p>
        </div>
        <Button size="sm" onClick={onConnect} disabled={connecting}>
          <Link2 className="mr-1.5 h-4 w-4" />
          {connecting ? "Connecting..." : "Connect"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
        <span className="text-lg">✅</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">Google Calendar Connected</p>
        <p className="text-xs text-muted-foreground">
          {connection.calendar_email || "Synced"} · Last synced {connection.updated_at ? format(new Date(connection.updated_at), "MMM d, h:mm a") : "recently"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onSync} disabled={syncing}>
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", syncing && "animate-spin")} />
          {syncing ? "Syncing" : "Sync"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDisconnect} className="text-destructive hover:text-destructive">
          <Unlink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Month View — Google Calendar grid style ─── */
function MonthView({ currentDate, tasksByDate, eventsByDate, onSelectDate }: any) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate[dateKey] || [];
          const dayEvents = eventsByDate[dateKey] || [];
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const totalItems = dayEvents.length + dayTasks.length;
          const maxVisible = 3;

          return (
            <div
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                "group relative min-h-[72px] cursor-pointer border-b border-r border-border/50 px-1.5 py-1.5 transition-colors md:min-h-[110px] md:px-2 md:py-2",
                inMonth
                  ? "bg-card hover:bg-secondary/30"
                  : "bg-muted/20",
                // Remove right border on last column
                (index + 1) % 7 === 0 && "border-r-0"
              )}
            >
              {/* Day number */}
              <div className="mb-1 flex justify-start">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium md:h-7 md:w-7 md:text-sm",
                    today
                      ? "bg-primary text-primary-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Event pills + task dots */}
              {inMonth && (
                <div className="space-y-0.5">
                  {dayEvents.slice(0, maxVisible).map((e: any) => (
                    <div
                      key={e.id}
                      className="truncate rounded px-1.5 py-[2px] text-[9px] font-medium leading-tight md:text-[11px]"
                      style={{
                        backgroundColor: e.source === "google_calendar" ? "rgba(66,133,244,0.15)" : "hsl(var(--primary) / 0.12)",
                        color: e.source === "google_calendar" ? "#4285F4" : "hsl(var(--primary))",
                      }}
                    >
                      {!e.all_day && (
                        <span className="mr-0.5 opacity-70">
                          {format(new Date(e.start_time), "h:mma").toLowerCase()}
                        </span>
                      )}
                      {e.title}
                    </div>
                  ))}
                  {dayTasks.slice(0, maxVisible - Math.min(dayEvents.length, maxVisible)).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-1 px-0.5">
                      <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", priorityColors[t.priority])} />
                      <span className="truncate text-[9px] text-muted-foreground md:text-[11px]">{t.title}</span>
                    </div>
                  ))}
                  {totalItems > maxVisible && (
                    <button className="px-1 text-[9px] font-medium text-muted-foreground transition-colors hover:text-foreground md:text-[11px]">
                      +{totalItems - maxVisible} more
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Week View ─── */
function WeekView({ currentDate, tasksByDate, eventsByDate, onSelectDate }: any) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayTasks = tasksByDate[dateKey] || [];
        const dayEvents = eventsByDate[dateKey] || [];
        const today = isToday(day);

        return (
          <div
            key={dateKey}
            onClick={() => onSelectDate(dateKey)}
            className={cn(
              "min-h-[300px] cursor-pointer rounded-xl border border-border bg-card p-3 transition-all hover:shadow-md",
              today && "border-primary/40 ring-1 ring-primary/10"
            )}
          >
            <div className="mb-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{format(day, "EEE")}</div>
              <div className={cn("mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                today ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>{format(day, "d")}</div>
            </div>
            <div className="space-y-1.5">
              {dayEvents.map((e: any) => (
                <div key={e.id} className="rounded-lg px-2 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: e.source === "google_calendar" ? "rgba(66,133,244,0.12)" : "hsl(var(--primary) / 0.12)",
                    color: e.source === "google_calendar" ? "#4285F4" : "hsl(var(--primary))",
                  }}
                >
                  <div className="truncate">{e.title}</div>
                  {!e.all_day && (
                    <div className="text-[10px] opacity-70 mt-0.5">
                      {format(new Date(e.start_time), "h:mm a")}
                    </div>
                  )}
                </div>
              ))}
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

/* ─── Day View ─── */
function DayView({ currentDate, tasksByDate, eventsByDate, onSelectDate, projectNameMap }: any) {
  const dateKey = format(currentDate, "yyyy-MM-dd");
  const dayTasks = tasksByDate[dateKey] || [];
  const dayEvents = eventsByDate[dateKey] || [];
  const deleteEvent = useDeleteCalendarEvent();

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-3.5">
        <span className={cn("text-sm font-semibold", isToday(currentDate) && "text-primary")}>
          {isToday(currentDate) ? "Today" : format(currentDate, "EEEE")} — {dayTasks.length} tasks, {dayEvents.length} events
        </span>
      </div>
      {dayEvents.length === 0 && dayTasks.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarIcon className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nothing scheduled</p>
          <Button variant="outline" size="sm" className="mt-3 rounded-lg" onClick={() => onSelectDate(dateKey)}>
            <Plus className="mr-1 h-4 w-4" /> Add task
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {dayEvents.map((e: any) => (
            <div key={e.id} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/30">
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.source === "google_calendar" ? "#4285F4" : "hsl(var(--primary))" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  {e.source === "google_calendar" && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 flex-shrink-0">Google</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {e.all_day ? "All day" : `${format(new Date(e.start_time), "h:mm a")}${e.end_time ? ` – ${format(new Date(e.end_time), "h:mm a")}` : ""}`}
                  {e.location && ` · ${e.location}`}
                </p>
              </div>
              <button
                onClick={() => deleteEvent.mutate({ id: e.id, source: e.source })}
                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-destructive/10"
              >
                <X className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
          {dayTasks.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
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

/* ─── Agenda View ─── */
function AgendaView({ tasks, projectNameMap, updateTask }: any) {
  const now = new Date();
  const upcoming = tasks
    .filter((t: any) => t.due_date && t.status !== "done")
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const buckets = { Overdue: [] as any[], Today: [] as any[], Tomorrow: [] as any[], "This Week": [] as any[], Later: [] as any[] };
  const colors: Record<string, string> = { Overdue: "bg-destructive", Today: "bg-warning", Tomorrow: "bg-primary", "This Week": "bg-primary/60", Later: "bg-muted-foreground" };
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  upcoming.forEach((t: any) => {
    const d = new Date(t.due_date);
    if (isPast(d) && !isToday(d)) buckets.Overdue.push(t);
    else if (isToday(d)) buckets.Today.push(t);
    else if (isTomorrow(d)) buckets.Tomorrow.push(t);
    else if (isBefore(d, weekEnd)) buckets["This Week"].push(t);
    else buckets.Later.push(t);
  });

  const groups = Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, color: colors[label], items }));

  return (
    <div className="space-y-6">
      {groups.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarIcon className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No upcoming tasks</p>
        </div>
      ) : groups.map((g) => (
        <div key={g.label}>
          <div className="mb-2 flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", g.color)} />
            <span className="text-sm font-semibold">{g.label}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{g.items.length}</span>
          </div>
          <div className="space-y-1">
            {g.items.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/30">
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

/* ─── Today's Events ─── */
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
        <div key={event.id} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
          <div className="rounded-lg p-2" style={{ backgroundColor: event.source === "google_calendar" ? "rgba(66,133,244,0.15)" : "hsl(var(--primary) / 0.15)" }}>
            <CalendarIcon className="h-5 w-5" style={{ color: event.source === "google_calendar" ? "#4285F4" : "hsl(var(--primary))" }} />
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
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1.5 hover:bg-destructive/10"
            title={event.source === "manual" ? "Delete event" : "Hide from view"}
          >
            <X className="h-4 w-4 text-destructive" />
          </button>
        </div>
      ))}
    </div>
  );
}
