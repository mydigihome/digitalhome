import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Pencil, X, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import {
  useHabits, useHabitLogs, useAllHabitLogs, useEnsureDefaultHabits,
  useCreateHabit, useUpdateHabit, useDeleteHabit,
  useLogHabitHours, useUpdateHabitLog, useDeleteHabitLog,
  getCurrentWeekStart,
} from "@/hooks/useHabits";
import { format } from "date-fns";

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(2.55 * percent)));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

function generateHabitColors(baseColor: string, count: number): string[] {
  const colors = [
    baseColor,
    adjustBrightness(baseColor, 25),
    adjustBrightness(baseColor, -25),
    adjustBrightness(baseColor, 50),
    adjustBrightness(baseColor, -50),
    adjustBrightness(baseColor, 15),
    adjustBrightness(baseColor, -15),
  ];
  return colors.slice(0, Math.max(count, 1));
}

export default function HabitTrackerWidget() {
  const { data: prefs } = useUserPreferences();
  const themeColor = prefs?.theme_color || "#8B5CF6";
  const weekStart = getCurrentWeekStart();

  const { data: habits = [] } = useHabits();
  const { data: weekLogs = [] } = useHabitLogs(weekStart);
  const { data: allLogs = [] } = useAllHabitLogs();
  const ensureDefaults = useEnsureDefaultHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const logHours = useLogHabitHours();
  const updateLog = useUpdateHabitLog();
  const deleteLog = useDeleteHabitLog();

  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [logHoursValue, setLogHoursValue] = useState("");
  const [customHabitName, setCustomHabitName] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  useEffect(() => {
    if (habits.length === 0) ensureDefaults.mutate();
  }, [habits.length]);

  const colors = useMemo(() => generateHabitColors(themeColor, habits.length), [themeColor, habits.length]);

  const chartData = useMemo(() => {
    return habits.map((h, i) => {
      const hrs = weekLogs.filter((l) => l.habit_id === h.id).reduce((s, l) => s + Number(l.hours), 0);
      return { name: h.name, hours: hrs, color: colors[i] || themeColor, habitId: h.id };
    }).filter((d) => d.hours > 0);
  }, [habits, weekLogs, colors, themeColor]);

  const totalHours = chartData.reduce((s, d) => s + d.hours, 0);
  const emptyChart = chartData.length === 0;

  const handleLogSave = () => {
    if (!selectedHabitId || !logHoursValue) return;
    const hrs = parseFloat(logHoursValue);
    if (isNaN(hrs) || hrs <= 0) { toast.error("Enter valid hours"); return; }
    logHours.mutate({ habit_id: selectedHabitId, hours: hrs, week_start_date: weekStart }, {
      onSuccess: () => { toast.success(`Logged ${hrs} hours ✓`); setShowLogModal(false); setLogHoursValue(""); setSelectedHabitId(null); setAddingCustom(false); },
    });
  };

  const handleAddCustomHabit = () => {
    if (!customHabitName.trim()) return;
    createHabit.mutate(customHabitName.trim(), {
      onSuccess: () => { setCustomHabitName(""); setAddingCustom(false); toast.success("Habit added"); },
    });
  };

  const allTimeTotal = allLogs.reduce((s, l) => s + Number(l.hours), 0);
  const allTimeByHabit = habits.map((h, i) => ({
    name: h.name,
    hours: allLogs.filter((l) => l.habit_id === h.id).reduce((s, l) => s + Number(l.hours), 0),
    color: colors[i] || themeColor,
  }));

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md" style={{ minHeight: 320 }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <h3 className="text-[17px] font-semibold text-foreground">Habit Tracker</h3>
          <button onClick={() => setShowEditModal(true)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {/* Donut Chart */}
        <div className="flex justify-center cursor-pointer" onClick={() => setShowStatsModal(true)}>
          <div className="relative" style={{ width: 180, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emptyChart ? [{ name: "Empty", hours: 1 }] : chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="hours"
                  stroke="none"
                >
                  {emptyChart ? (
                    <Cell fill="hsl(var(--secondary))" />
                  ) : (
                    chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-foreground">{totalHours}</span>
              <span className="text-xs text-muted-foreground">hours this week</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {chartData.map((d) => (
            <div key={d.habitId} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[13px] text-muted-foreground">{d.name}: {d.hours}hrs</span>
            </div>
          ))}
          {emptyChart && <span className="text-[13px] text-muted-foreground">No hours logged this week</span>}
        </div>

        {/* Log Hours Button */}
        <button
          onClick={() => { setShowLogModal(true); setSelectedHabitId(habits[0]?.id || null); }}
          className="w-full mt-4 h-10 rounded-[10px] text-sm font-medium transition-all"
          style={{
            backgroundColor: `${themeColor}1A`,
            border: `1px solid ${themeColor}4D`,
            color: themeColor,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${themeColor}26`)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${themeColor}1A`)}
        >
          + Log Hours
        </button>
      </div>

      {/* Log Hours Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowLogModal(false)}>
          <div className="w-[360px] rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <h3 className="text-lg font-semibold text-foreground">Log Habit Hours</h3>
              <button onClick={() => setShowLogModal(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                {habits.map((h) => (
                  <label key={h.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="habit" checked={selectedHabitId === h.id && !addingCustom} onChange={() => { setSelectedHabitId(h.id); setAddingCustom(false); }} className="accent-primary" />
                    <span className="text-sm text-foreground">{h.name}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="habit" checked={addingCustom} onChange={() => setAddingCustom(true)} className="accent-primary" />
                  <span className="text-sm text-foreground">+ Add Custom Habit</span>
                </label>
                {addingCustom && (
                  <div className="flex gap-2 ml-6">
                    <Input value={customHabitName} onChange={(e) => setCustomHabitName(e.target.value)} placeholder="Habit name" className="h-9 text-sm" onBlur={handleAddCustomHabit} onKeyDown={(e) => e.key === "Enter" && handleAddCustomHabit()} />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[13px] text-muted-foreground">Hours this week</Label>
                <Input type="number" value={logHoursValue} onChange={(e) => setLogHoursValue(e.target.value)} placeholder="0" step={0.5} min={0} max={168} className="h-11" />
              </div>

              <div className="flex gap-2 mt-5">
                <Button variant="ghost" onClick={() => setShowLogModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleLogSave} className="flex-1" style={{ backgroundColor: themeColor }}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="w-[420px] max-h-[80vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <h3 className="text-lg font-semibold text-foreground">Edit Habits</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 mb-6">
              <Label className="text-xs text-muted-foreground">Habits</Label>
              {habits.map((h) => (
                <div key={h.id} className="flex items-center gap-2">
                  <Input defaultValue={h.name} onBlur={(e) => { if (e.target.value !== h.name) updateHabit.mutate({ id: h.id, name: e.target.value }); }} className="flex-1 h-9 text-sm" />
                  <button onClick={() => { if (confirm(`Delete "${h.name}"?`)) deleteHabit.mutate(h.id); }} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => { const name = prompt("New habit name:"); if (name) createHabit.mutate(name); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Habit
              </Button>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Recent Logs</Label>
              {allLogs.slice(0, 20).map((log) => {
                const habit = habits.find((h) => h.id === log.habit_id);
                return (
                  <div key={log.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-20">{format(new Date(log.week_start_date), "MM/dd")}</span>
                    <span className="flex-1 text-foreground">{habit?.name || "?"}</span>
                    <Input type="number" defaultValue={log.hours} className="w-20 h-8 text-sm" step={0.5} onBlur={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v !== Number(log.hours)) updateLog.mutate({ id: log.id, hours: v });
                    }} />
                    <button onClick={() => deleteLog.mutate(log.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
              {allLogs.length === 0 && <p className="text-sm text-muted-foreground">No logs yet</p>}
            </div>

            <Button onClick={() => setShowEditModal(false)} className="w-full mt-6">Done</Button>
          </div>
        </div>
      )}

      {/* All-Time Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-foreground/50 backdrop-blur-sm" onClick={() => setShowStatsModal(false)}>
          <div className="w-[400px] rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <h3 className="text-lg font-semibold text-foreground">All-Time Stats</h3>
              <button onClick={() => setShowStatsModal(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-foreground">{allTimeTotal}</span>
              <p className="text-sm text-muted-foreground mt-1">total hours logged</p>
            </div>
            <div className="space-y-3">
              {allTimeByHabit.filter(h => h.hours > 0).map((h) => (
                <div key={h.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: h.color }} />
                  <span className="flex-1 text-sm text-foreground">{h.name}</span>
                  <span className="text-sm font-medium text-foreground">{h.hours} hrs</span>
                </div>
              ))}
              {allTimeByHabit.every(h => h.hours === 0) && <p className="text-sm text-muted-foreground text-center">No hours logged yet</p>}
            </div>
            <Button variant="outline" onClick={() => setShowStatsModal(false)} className="w-full mt-6">Close</Button>
          </div>
        </div>
      )}
    </>
  );
}
