import { useTodayEvents, useDeleteCalendarEvent } from "@/hooks/useCalendarEvents";
import { useAllTasks, useUpdateTask } from "@/hooks/useTasks";
import { useExpenses } from "@/hooks/useExpenses";
import { useWealthGoals } from "@/hooks/useWealthGoals";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, CheckCircle2, Clock, DollarSign, Target, X, Sun,
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

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Sun className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold text-foreground">Your Day</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Schedule Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your Schedule
          </span>
          {events.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {events.length}
            </Badge>
          )}
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground italic pl-5">
            No events scheduled today
          </p>
        ) : (
          <div className="space-y-1.5">
            {events.map((event) => (
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
          {todayTasks.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {todayTasks.length}
            </Badge>
          )}
        </div>

        {todayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic pl-5">
            No tasks for today
          </p>
        ) : (
          <div className="space-y-1">
            {todayTasks.map((task) => (
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
        )}
      </div>

      {/* Expenses Reminder */}
      {upcomingExpenses.length > 0 && (
        <>
          <div className="border-t border-border my-4" />
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Money Reminder
              </span>
            </div>
            <div className="space-y-1.5">
              {upcomingExpenses.map((expense: any) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2"
                >
                  <span className="text-sm text-foreground">
                    {expense.description}
                  </span>
                  <span className="text-sm font-medium text-destructive">
                    ${Number(expense.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Goals */}
      {activeGoals.length > 0 && (
        <>
          <div className="border-t border-border my-4" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Goal Check
              </span>
            </div>
            <div className="space-y-2">
              {activeGoals.map((goal: any) => (
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
          </div>
        </>
      )}
    </div>
  );
}
