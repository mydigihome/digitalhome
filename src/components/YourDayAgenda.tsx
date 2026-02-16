import { useState, useEffect, useRef } from "react";
import { useTodayEvents, useDeleteCalendarEvent } from "@/hooks/useCalendarEvents";
import { useAllTasks, useUpdateTask } from "@/hooks/useTasks";
import { useExpenses } from "@/hooks/useExpenses";
import { useWealthGoals } from "@/hooks/useWealthGoals";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar, CheckCircle2, Clock, DollarSign, Target, X, Sun, Plus, Zap, Trash2,
} from "lucide-react";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";

function formatEventTime(dateStr: string) {
  return format(new Date(dateStr), "h:mm a");
}

export default function YourDayAgenda() {
  const { data: events = [] } = useTodayEvents();
  const { data: allTasks = [] } = useAllTasks();
  const { data: expenses = [] } = useExpenses();
  const { data: goals = [] } = useWealthGoals();
  const updateTask = useUpdateTask();
  const deleteEvent = useDeleteCalendarEvent();

  // Last minute tasks - simple local bullet list
  const storageKey = `last-minute-tasks-${format(new Date(), "yyyy-MM-dd")}`;
  const [quickTasks, setQuickTasks] = useState<{ id: string; text: string }[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newQuickTask, setNewQuickTask] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(quickTasks));
  }, [quickTasks, storageKey]);

  const addQuickTask = () => {
    const text = newQuickTask.trim();
    if (!text) return;
    setQuickTasks((prev) => [...prev, { id: crypto.randomUUID(), text }]);
    setNewQuickTask("");
    inputRef.current?.focus();
  };

  const deleteQuickTask = (id: string) => {
    setQuickTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateQuickTask = (id: string, text: string) => {
    setQuickTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Tasks due today or no date (top 5 non-done)
  const todayTasks = allTasks
    .filter((t) => t.status !== "done" && (t.due_date === todayStr || !t.due_date))
    .slice(0, 5);

  // Upcoming expenses in next 3 days
  const threeDays = new Date();
  threeDays.setDate(threeDays.getDate() + 3);
  const upcomingExpenses = expenses.filter((e: any) => {
    const d = new Date(e.expense_date);
    return d >= new Date(todayStr) && d <= threeDays;
  }).slice(0, 3);

  // Active goals (not completed, top 2)
  const activeGoals = goals
    .filter((g: any) => !g.is_completed)
    .slice(0, 2);

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    updateTask.mutate({ id: taskId, status: currentStatus === "done" ? "backlog" : "done" });
  };

  const handleDeleteEvent = (id: string, source: string) => {
    deleteEvent.mutate({ id, source });
  };
  const displayEvents = events.length > 0 ? events : [];
  const displayTasks = todayTasks;
  const displayExpenses = upcomingExpenses;
  const displayGoals = activeGoals;

  const sampleEvents = [
    { id: "s1", title: "Team standup", time: "9:00 AM", color: "hsl(var(--primary))" },
    { id: "s2", title: "Dentist appointment", time: "2:30 PM", color: "#10B981" },
    { id: "s3", title: "French lesson", time: "6:00 PM", color: "#F59E0B" },
  ];

  const sampleTasks = [
    { id: "st1", title: "Review project proposal", priority: "high" },
    { id: "st2", title: "Submit expense report", priority: "medium" },
    { id: "st3", title: "Call back contractor", priority: "low" },
  ];

  const sampleExpenses = [
    { id: "se1", description: "Spotify subscription", amount: 9.99 },
    { id: "se2", description: "Electric bill", amount: 142.50 },
  ];

  const sampleGoals = [
    { id: "sg1", title: "Save $5,000 emergency fund", progress: 68 },
    { id: "sg2", title: "Pay off credit card", progress: 45 },
  ];

  const showRealEvents = displayEvents.length > 0;
  const showRealTasks = displayTasks.length > 0;
  const showRealExpenses = displayExpenses.length > 0;
  const showRealGoals = displayGoals.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Today's Agenda</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Schedule Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your Schedule
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {showRealEvents ? displayEvents.length : sampleEvents.length}
          </Badge>
        </div>

        {showRealEvents ? (
          <div className="space-y-1.5">
            {displayEvents.map((event) => (
              <div
                key={event.id}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
              >
                <span className="text-xs font-medium text-muted-foreground min-w-[65px]">
                  {event.all_day ? "All day" : formatEventTime(event.start_time)}
                </span>
                <div
                  className="h-4 w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.color || "hsl(var(--primary))" }}
                />
                <span className="flex-1 text-sm text-foreground truncate">
                  {event.title}
                </span>
                {event.source !== "manual" && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 opacity-70">
                    {event.source === "google_calendar" ? "📅 Google" : event.source}
                  </Badge>
                )}
                <button
                  onClick={() => handleDeleteEvent(event.id, event.source)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-destructive/10"
                  title={
                    event.source === "manual"
                      ? "Delete event"
                      : "Hide from your view (keeps in original calendar)"
                  }
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 opacity-50">
            {sampleEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <span className="text-xs font-medium text-muted-foreground min-w-[65px]">{e.time}</span>
                <div className="h-4 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                <span className="flex-1 text-sm text-muted-foreground truncate">{e.title}</span>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground italic pl-3">Sample — add events to see yours</p>
          </div>
        )}
      </div>

      <div className="border-t border-border my-4" />

      {/* Tasks Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your Tasks
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {showRealTasks ? displayTasks.length : sampleTasks.length}
          </Badge>
        </div>

        {showRealTasks ? (
          <div className="space-y-1">
            {displayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-secondary cursor-pointer"
                onClick={() => handleToggleTask(task.id, task.status)}
              >
                <Checkbox
                  checked={task.status === "done"}
                  onCheckedChange={() => handleToggleTask(task.id, task.status)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4"
                />
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0", {
                  "bg-destructive": task.priority === "high",
                  "bg-warning": task.priority === "medium",
                  "bg-success": task.priority === "low",
                })} />
                <span className="flex-1 text-sm text-foreground truncate">
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1 opacity-50">
            {sampleTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div className="h-4 w-4 rounded border border-muted-foreground/30" />
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0", {
                  "bg-destructive": t.priority === "high",
                  "bg-warning": t.priority === "medium",
                  "bg-success": t.priority === "low",
                })} />
                <span className="flex-1 text-sm text-muted-foreground truncate">{t.title}</span>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground italic pl-3">Sample — your tasks will appear here</p>
          </div>
        )}
      </div>

      {/* Last Minute Tasks */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Last Minute Tasks
          </span>
        </div>
        <div className="space-y-1">
          {quickTasks.map((qt) => (
            <div key={qt.id} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
              <span className="text-muted-foreground text-xs">•</span>
              <input
                className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                value={qt.text}
                onChange={(e) => updateQuickTask(qt.id, e.target.value)}
              />
              <button
                onClick={() => deleteQuickTask(qt.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
              >
                <X className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 px-3">
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="Add a quick task..."
            value={newQuickTask}
            onChange={(e) => setNewQuickTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuickTask()}
          />
        </div>
      </div>

      <div className="border-t border-border my-4" />

      {/* Money Reminder - always show */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Money Reminder
          </span>
        </div>
        {showRealExpenses ? (
          <div className="space-y-1.5">
            {displayExpenses.map((expense: any) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2"
              >
                <span className="text-sm text-foreground">{expense.description}</span>
                <span className="text-sm font-medium text-destructive">
                  ${Number(expense.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 opacity-50">
            {sampleExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2">
                <span className="text-sm text-muted-foreground">{e.description}</span>
                <span className="text-sm font-medium text-muted-foreground">${e.amount.toFixed(2)}</span>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground italic pl-3">Sample — add expenses to track bills</p>
          </div>
        )}
      </div>

      <div className="border-t border-border my-4" />

      {/* Goals - always show */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Goal Check
          </span>
        </div>
        {showRealGoals ? (
          <div className="space-y-2">
            {displayGoals.map((goal: any) => (
              <div key={goal.id} className="flex items-center gap-2">
                <span className="text-sm text-foreground">{goal.title}</span>
                {goal.progress != null && (
                  <Badge variant="secondary" className="text-[10px]">
                    {goal.progress}%
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 opacity-50">
            {sampleGoals.map((g) => (
              <div key={g.id} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{g.title}</span>
                <Badge variant="secondary" className="text-[10px] opacity-60">{g.progress}%</Badge>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground italic pl-3">Sample — set goals in Wealth Tracker</p>
          </div>
        )}
      </div>
    </div>
  );
}
