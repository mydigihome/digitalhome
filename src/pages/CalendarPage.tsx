import { useState } from "react";
import { useAllTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import AppShell from "@/components/AppShell";
import TaskEditor from "@/components/TaskEditor";

const priorityColors: Record<string, string> = {
  low: "bg-muted-foreground",
  medium: "bg-warning",
  high: "bg-destructive",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: tasks = [] } = useAllTasks();
  const { data: projects = [] } = useProjects();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const tasksByDate = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
    if (t.due_date) {
      const key = t.due_date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
    }
    return acc;
  }, {});

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[32px] font-semibold tracking-tight">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px rounded-xl border border-border bg-border">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate[dateKey] || [];
            const inMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={cn(
                  "min-h-[100px] cursor-pointer bg-background p-2 transition-colors hover:bg-secondary/50",
                  !inMonth && "opacity-40"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday(day) && "bg-primary text-primary-foreground font-medium"
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-center gap-1">
                      <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", priorityColors[t.priority])} />
                      <span className="truncate text-[10px]">{t.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedDate && projects.length > 0 && (
          <TaskEditor
            projectId={projects[0].id}
            defaultStatus="backlog"
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
