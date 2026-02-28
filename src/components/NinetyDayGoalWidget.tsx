import { useState, useEffect, useMemo, useRef } from "react";
import { useActiveGoal, useGoalHistory, useCreateGoal, useUpdateGoal, type DisplayFormat } from "@/hooks/useNinetyDayGoals";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, MoreHorizontal, History, ChevronUp, ChevronDown, Target, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PLACEHOLDER_GOALS = [
  "Launch my business",
  "Get in shape",
  "Save $5,000",
  "Write a book",
];

// ─── THEME DEFINITIONS (exact spec) ───
interface CountdownTheme {
  id: string;
  name: string;
  units: { key: string; label: string }[];
  fontWeight: string;
  showSeparators: boolean;
}

const COUNTDOWN_THEMES: CountdownTheme[] = [
  {
    id: "minimal",
    name: "Minimal",
    units: [
      { key: "days", label: "DAYS" },
      { key: "hours", label: "HRS" },
      { key: "minutes", label: "MINS" },
      { key: "seconds", label: "SECS" },
    ],
    fontWeight: "font-light",
    showSeparators: true,
  },
  {
    id: "bold",
    name: "Bold",
    units: [
      { key: "days", label: "DAYS" },
      { key: "hours", label: "HRS" },
      { key: "minutes", label: "MINS" },
    ],
    fontWeight: "font-black",
    showSeparators: false,
  },
  {
    id: "weeks",
    name: "Weeks Focus",
    units: [
      { key: "weeks", label: "WEEKS" },
      { key: "remainderDays", label: "DAYS" },
      { key: "hours", label: "HRS" },
    ],
    fontWeight: "font-semibold",
    showSeparators: false,
  },
  {
    id: "precise",
    name: "Ultra Precise",
    units: [
      { key: "days", label: "DAYS" },
      { key: "hours", label: "HRS" },
      { key: "minutes", label: "MINS" },
      { key: "seconds", label: "SECS" },
      { key: "ms", label: "MS" },
    ],
    fontWeight: "font-normal",
    showSeparators: true,
  },
  {
    id: "clean",
    name: "Clean Minimal",
    units: [
      { key: "days", label: "DAYS" },
      { key: "hours", label: "HRS" },
    ],
    fontWeight: "font-light",
    showSeparators: false,
  },
  {
    id: "full",
    name: "Full Breakdown",
    units: [
      { key: "weeks", label: "WKS" },
      { key: "remainderDays", label: "DAYS" },
      { key: "hours", label: "HRS" },
      { key: "minutes", label: "MINS" },
      { key: "seconds", label: "SECS" },
    ],
    fontWeight: "font-semibold",
    showSeparators: true,
  },
];

const FONT_OPTIONS = [
  { label: "SF Pro Display", value: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" },
  { label: "SF Mono", value: "'SF Mono', 'Fira Code', 'Roboto Mono', monospace" },
  { label: "Helvetica Neue", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Roboto Mono", value: "'Roboto Mono', monospace" },
  { label: "New York (Serif)", value: "'New York', 'Georgia', serif" },
];

const PRESET_COLORS = [
  { label: "White", value: "#FFFFFF" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Pink", value: "#ec4899" },
  { label: "Green", value: "#22c55e" },
  { label: "Orange", value: "#f97316" },
];

function getCountdownValues(endDate: Date, now: Date) {
  const diff = Math.max(0, endDate.getTime() - now.getTime());
  const totalMs = diff;
  const totalSecs = Math.floor(diff / 1000);
  const totalMins = Math.floor(totalSecs / 60);
  const totalHours = Math.floor(totalMins / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalWeeks = Math.floor(totalDays / 7);

  return {
    weeks: totalWeeks,
    remainderDays: totalDays - totalWeeks * 7,
    days: totalDays,
    hours: totalHours % 24,
    minutes: totalMins % 60,
    seconds: totalSecs % 60,
    ms: Math.floor((totalMs % 1000)),
  };
}

function themeToDisplayFormat(theme: CountdownTheme): DisplayFormat {
  const keys = theme.units.map(u => u.key);
  return {
    showWeeks: keys.includes("weeks"),
    showDays: keys.includes("days") || keys.includes("remainderDays"),
    showHours: keys.includes("hours"),
    showMinutes: keys.includes("minutes"),
    showSeconds: keys.includes("seconds"),
  };
}

// ─── LIVE COUNTDOWN RENDERER ───
function LiveCountdown({
  endDate,
  theme,
  fontFamily,
  textColor,
  transparency,
  showBgBlur,
  fontSize = "text-4xl sm:text-5xl",
}: {
  endDate: Date;
  theme: CountdownTheme;
  fontFamily: string;
  textColor: string;
  transparency: number;
  showBgBlur: boolean;
  fontSize?: string;
}) {
  const [now, setNow] = useState(new Date());
  const hasMs = theme.units.some(u => u.key === "ms");
  const hasSecs = theme.units.some(u => u.key === "seconds");

  useEffect(() => {
    const ms = hasMs ? 47 : hasSecs ? 1000 : 60_000;
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [hasMs, hasSecs]);

  const vals = getCountdownValues(endDate, now);
  const opacity = 1 - transparency / 100;

  return (
    <div
      className={cn("rounded-xl px-6 py-5 text-center transition-all", showBgBlur && "backdrop-blur-2xl")}
      style={{
        background: showBgBlur ? "rgba(0,0,0,0.25)" : "transparent",
      }}
    >
      <div className="flex items-baseline justify-center gap-1" style={{ fontFamily, color: textColor, opacity }}>
        {theme.units.map((unit, i) => {
          const raw = vals[unit.key as keyof typeof vals];
          const display = unit.key === "ms" ? String(raw).padStart(3, "0") : String(raw).padStart(2, "0");
          return (
            <div key={unit.key} className="flex items-baseline">
              {i > 0 && theme.showSeparators && (
                <span className={cn(fontSize, theme.fontWeight, "mx-1 opacity-30")} style={{ fontFamily }}>:</span>
              )}
              <div className={cn("flex flex-col items-center", !theme.showSeparators && i > 0 && "ml-4 sm:ml-6")}>
                <span className={cn(fontSize, theme.fontWeight, "leading-none tabular-nums")} style={{ fontFamily }}>
                  {display}
                </span>
                <span className="text-[9px] uppercase tracking-widest mt-1.5 opacity-50" style={{ fontFamily }}>{unit.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function NinetyDayGoalWidget() {
  const { data: activeGoal, isLoading } = useActiveGoal();
  const { data: history = [] } = useGoalHistory();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  // Setup state
  const [step, setStep] = useState(0);
  const [goalText, setGoalText] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [selectedThemeIdx, setSelectedThemeIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Customization state
  const [fontIdx, setFontIdx] = useState(0);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [transparency, setTransparency] = useState(0);
  const [showBgBlur, setShowBgBlur] = useState(true);

  // Active goal state
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showEmergencyEdit, setShowEmergencyEdit] = useState(false);
  const [emergencyConfirm, setEmergencyConfirm] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionAchieved, setCompletionAchieved] = useState<string | null>(null);
  const [reflectionNotes, setReflectionNotes] = useState("");

  // Rotate placeholders
  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_GOALS.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Check goal expired
  useEffect(() => {
    if (activeGoal) {
      const left = differenceInDays(new Date(activeGoal.end_date), new Date());
      if (left <= 0 && !showCompletion) setShowCompletion(true);
    }
  }, [activeGoal]);

  const endDate = useMemo(() => addDays(startDate, 90), [startDate]);

  const handleLockIn = async () => {
    const theme = COUNTDOWN_THEMES[selectedThemeIdx];
    await createGoal.mutateAsync({
      goal_text: goalText.trim(),
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      display_style: theme.id,
      motivational_style: "standard",
      weekly_checkins: false,
      display_format: themeToDisplayFormat(theme),
      font_style: FONT_OPTIONS[fontIdx].value,
      text_color: textColor,
      transparency_level: transparency,
    });
    setShowCelebration(true);
    import("canvas-confetti").then(m => {
      m.default({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    });
    setTimeout(() => setShowCelebration(false), 3000);
    setStep(0);
    setGoalText("");
  };

  const handleEditSave = () => {
    if (activeGoal && editText.trim()) {
      updateGoal.mutate({ id: activeGoal.id, goal_text: editText.trim() });
      setEditing(false);
    }
  };

  const handleEmergencyEdit = () => {
    if (!activeGoal) return;
    const newStart = new Date();
    const newEnd = addDays(newStart, 90);
    updateGoal.mutate({
      id: activeGoal.id,
      goal_text: editText.trim() || activeGoal.goal_text,
      start_date: format(newStart, "yyyy-MM-dd"),
      end_date: format(newEnd, "yyyy-MM-dd"),
    });
    setShowEmergencyEdit(false);
    setEmergencyConfirm("");
    setShowMenu(false);
  };

  const handleComplete = async (achieved: string) => {
    if (!activeGoal) return;
    await updateGoal.mutateAsync({
      id: activeGoal.id,
      status: "completed",
      achieved,
      reflection_notes: reflectionNotes,
    });
    setShowCompletion(false);
    setCompletionAchieved(null);
    setReflectionNotes("");
    import("canvas-confetti").then(m => m.default({ particleCount: 200, spread: 100 }));
  };

  if (isLoading) return null;

  // ─── SETUP VIEW ───
  if (!activeGoal) {
    return (
      <>
        <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[0, 1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full transition-colors", s <= step ? "bg-primary" : "bg-border")} />
                {s < 2 && <div className={cn("h-px w-6", s < step ? "bg-primary" : "bg-border")} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Screen 1: Set Goal */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">What's your 90-day goal?</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-5">One goal. 90 days. Full commitment.</p>

                <input
                  type="text"
                  value={goalText}
                  onChange={e => setGoalText(e.target.value)}
                  placeholder={PLACEHOLDER_GOALS[placeholderIdx]}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-base outline-none focus:border-primary transition-colors mb-4"
                  onKeyDown={e => e.key === "Enter" && goalText.trim() && setStep(1)}
                />

                <Button onClick={() => setStep(1)} disabled={!goalText.trim()} className="w-full py-3" size="lg">
                  Next →
                </Button>
              </motion.div>
            )}

            {/* Screen 2: Choose Start Date */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold text-foreground mb-1">When does this begin?</h3>
                <p className="text-sm text-muted-foreground mb-4">Defaults to today. Pick any start date.</p>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal mb-3">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "MMMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={d => d && setStartDate(d)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <div className="rounded-xl bg-muted/50 p-4 mb-5 text-center">
                  <p className="text-sm text-muted-foreground">Your goal ends on</p>
                  <p className="text-lg font-semibold text-foreground">{format(endDate, "MMMM d, yyyy")}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(0)} className="flex-1">← Back</Button>
                  <Button onClick={() => setStep(2)} className="flex-1">Next →</Button>
                </div>
              </motion.div>
            )}

            {/* Screen 3: Customize Countdown Clock */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold text-foreground mb-1">Customize Your Countdown Clock</h3>
                <p className="text-sm text-muted-foreground mb-5">Choose a clock face, then fine-tune the look.</p>

                {/* Theme carousel */}
                <div className="relative mb-5">
                  <button
                    onClick={() => setSelectedThemeIdx(i => Math.max(0, i - 1))}
                    disabled={selectedThemeIdx === 0}
                    className={cn(
                      "absolute -left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                      selectedThemeIdx === 0 ? "text-muted-foreground/20" : "bg-card border border-border shadow-sm text-foreground hover:bg-muted"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedThemeIdx(i => Math.min(COUNTDOWN_THEMES.length - 1, i + 1))}
                    disabled={selectedThemeIdx === COUNTDOWN_THEMES.length - 1}
                    className={cn(
                      "absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                      selectedThemeIdx === COUNTDOWN_THEMES.length - 1 ? "text-muted-foreground/20" : "bg-card border border-border shadow-sm text-foreground hover:bg-muted"
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Live preview */}
                  <div className="mx-4 rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                    <LiveCountdown
                      endDate={endDate}
                      theme={COUNTDOWN_THEMES[selectedThemeIdx]}
                      fontFamily={FONT_OPTIONS[fontIdx].value}
                      textColor={textColor}
                      transparency={transparency}
                      showBgBlur={showBgBlur}
                    />
                  </div>

                  <p className="text-center text-sm font-medium text-foreground mt-3">
                    {COUNTDOWN_THEMES[selectedThemeIdx].name}
                  </p>

                  {/* Dot indicators */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {COUNTDOWN_THEMES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedThemeIdx(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === selectedThemeIdx ? "w-4 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Customization Panel */}
                <div className="space-y-4 rounded-xl bg-muted/40 p-4 mb-5">
                  {/* Font Style */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Font Style</label>
                    <select
                      value={fontIdx}
                      onChange={e => setFontIdx(Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      {FONT_OPTIONS.map((f, i) => (
                        <option key={f.label} value={i}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Color</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setTextColor(c.value)}
                          className={cn(
                            "h-7 w-7 rounded-full border-2 transition-all",
                            textColor === c.value ? "border-primary scale-110" : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                      <div className="flex items-center gap-1.5 ml-1">
                        <input
                          type="color"
                          value={textColor}
                          onChange={e => setTextColor(e.target.value)}
                          className="h-7 w-7 rounded-full border-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={e => setTextColor(e.target.value)}
                          className="w-20 rounded-md border border-border bg-background px-2 py-1 text-xs font-mono"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transparency */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Transparency: {transparency}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      value={transparency}
                      onChange={e => setTransparency(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Solid</span>
                      <span>Very transparent</span>
                    </div>
                  </div>

                  {/* Background Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBgBlur}
                      onChange={e => setShowBgBlur(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span className="text-sm text-foreground">Show subtle background blur</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                  <Button
                    onClick={handleLockIn}
                    disabled={createGoal.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    size="lg"
                  >
                    Lock in My Goal 🔒
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Past goals */}
          {history.length > 0 && (
            <>
              <button onClick={() => setShowHistory(!showHistory)} className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <History className="h-3.5 w-3.5" /> Past Goals ({history.length})
                {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showHistory && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {history.map(g => (
                    <div key={g.id} className="rounded-lg border border-border bg-background p-3">
                      <p className="text-sm font-medium text-foreground">{g.goal_text}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(g.start_date), "MMM d")} – {format(new Date(g.end_date), "MMM d, yyyy")}
                        {g.achieved && <span className="ml-2">· {g.achieved === "yes" ? "✅" : g.achieved === "partial" ? "🟡" : "❌"}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Celebration toast */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10002] rounded-xl bg-primary px-6 py-3 text-primary-foreground text-sm font-medium shadow-2xl"
            >
              Goal locked in! You've got this 💪
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── ACTIVE GOAL: BORDERLESS COUNTDOWN ───
  const goalEndDate = new Date(activeGoal.end_date);
  const activeThemeId = activeGoal.display_style || "minimal";
  const activeTheme = COUNTDOWN_THEMES.find(t => t.id === activeThemeId) || COUNTDOWN_THEMES[0];
  const savedFont = activeGoal.font_style || FONT_OPTIONS[0].value;
  const savedColor = activeGoal.text_color || "#FFFFFF";
  const savedTransparency = activeGoal.transparency_level || 0;
  // Determine if blur was saved (transparency_level > 0 means they customized; we check font_style presence as proxy for blur)
  const savedShowBlur = (activeGoal.transparency_level ?? 0) >= 0; // default to true

  const totalDaysCount = differenceInDays(goalEndDate, new Date(activeGoal.start_date));
  const daysLeft = Math.max(0, differenceInDays(goalEndDate, new Date()));
  const progressPct = totalDaysCount > 0 ? Math.min(100, Math.round(((totalDaysCount - daysLeft) / totalDaysCount) * 100)) : 0;

  return (
    <>
      {/* Borderless floating countdown */}
      <div className="relative">
        {/* Goal text + menu */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {editing ? (
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleEditSave()}
                />
                <Button size="sm" variant="outline" onClick={handleEditSave}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground truncate">{activeGoal.goal_text}</p>
                <button
                  onClick={() => { setEditing(true); setEditText(activeGoal.goal_text); }}
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </>
            )}
          </div>

          <div className="relative ml-2">
            <button onClick={() => setShowMenu(!showMenu)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 bg-card rounded-lg shadow-xl border border-border p-1 z-20 min-w-[160px]">
                <button
                  onClick={() => { setShowEmergencyEdit(true); setShowMenu(false); setEditText(activeGoal.goal_text); }}
                  className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  Edit Goal (restarts 90 days)
                </button>
                <button
                  onClick={() => { setShowHistory(!showHistory); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  View Past Goals
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COUNTDOWN — no box, no border */}
        <LiveCountdown
          endDate={goalEndDate}
          theme={activeTheme}
          fontFamily={savedFont}
          textColor={savedColor}
          transparency={savedTransparency}
          showBgBlur={false}
          fontSize="text-5xl sm:text-6xl"
        />

        {/* Subtle progress */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground/40">Day {totalDaysCount - daysLeft}/{totalDaysCount}</span>
            <span className="text-[10px] text-muted-foreground/40">{progressPct}%</span>
          </div>
          <div className="h-0.5 w-full rounded-full bg-border/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-primary/30"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground/30">
              {format(new Date(activeGoal.start_date), "MMM d")}
            </span>
            <span className="text-[10px] text-muted-foreground/30">
              {format(goalEndDate, "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* History panel */}
        {showHistory && history.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">Past Goals</p>
            {history.map(g => (
              <div key={g.id} className="rounded-lg border border-border bg-card p-2.5">
                <p className="text-xs font-medium text-foreground">{g.goal_text}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(g.start_date), "MMM d")} – {format(new Date(g.end_date), "MMM d, yyyy")}
                  {g.achieved && <span className="ml-1">· {g.achieved === "yes" ? "✅" : g.achieved === "partial" ? "🟡" : "❌"}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency edit modal */}
      <AnimatePresence>
        {showEmergencyEdit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[10001]"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowEmergencyEdit(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-[420px] max-w-[90vw] bg-card rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-base font-semibold text-foreground mb-1">⚠️ Edit Goal</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Changing your goal restarts your commitment. This should only be used in emergencies.
              </p>

              <input
                type="text"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary mb-3"
              />

              <p className="text-xs text-muted-foreground mb-2">
                Type <span className="font-mono text-foreground">"I need to change my goal"</span> to confirm:
              </p>
              <input
                type="text"
                value={emergencyConfirm}
                onChange={e => setEmergencyConfirm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-destructive mb-4"
                placeholder="I need to change my goal"
              />

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowEmergencyEdit(false)} className="flex-1">Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={handleEmergencyEdit}
                  disabled={emergencyConfirm !== "I need to change my goal"}
                  className="flex-1"
                >
                  Restart Goal
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion modal */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[10001]"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-[420px] max-w-[90vw] bg-card rounded-2xl p-8 shadow-2xl text-center"
            >
              <p className="text-3xl mb-2">🎉</p>
              <h3 className="text-lg font-semibold text-foreground mb-1">90 days complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">Did you achieve your goal?</p>
              <div className="flex gap-2 justify-center mb-4">
                {["yes", "partial", "no"].map(v => (
                  <button
                    key={v}
                    onClick={() => setCompletionAchieved(v)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm transition-colors border",
                      completionAchieved === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                    )}
                  >
                    {v === "yes" ? "Yes ✅" : v === "partial" ? "Partially 🟡" : "No ❌"}
                  </button>
                ))}
              </div>
              <textarea
                value={reflectionNotes}
                onChange={e => setReflectionNotes(e.target.value)}
                placeholder="What did you learn?"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none resize-none h-20 mb-4"
              />
              <Button
                onClick={() => completionAchieved && handleComplete(completionAchieved)}
                className="w-full"
                disabled={!completionAchieved || updateGoal.isPending}
              >
                Save & Set Next Goal
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
