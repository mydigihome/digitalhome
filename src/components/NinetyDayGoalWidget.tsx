import { useState, useEffect, useMemo } from "react";
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
  "Learn Spanish",
  "Read 12 books",
];

// ─── CLOCK THEMES ───
interface ClockTheme {
  id: string;
  name: string;
  fontFamily: string;
  textColor: string;
  bgStyle: React.CSSProperties;
  countdownClass: string;
  goalTextClass: string;
  progressBarColor: string;
  progressTrackColor: string;
  dateColor: string;
  format: DisplayFormat;
}

const CLOCK_THEMES: ClockTheme[] = [
  {
    id: "minimal",
    name: "Minimal",
    fontFamily: "'Inter', sans-serif",
    textColor: "#FFFFFF",
    bgStyle: { background: "rgba(0,0,0,0.55)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" },
    countdownClass: "text-4xl sm:text-5xl font-light tracking-tight",
    goalTextClass: "text-sm font-medium",
    progressBarColor: "bg-white/30",
    progressTrackColor: "bg-white/10",
    dateColor: "text-white/20",
    format: { showWeeks: false, showDays: true, showHours: true, showMinutes: true, showSeconds: false },
  },
  {
    id: "bold",
    name: "Bold",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    textColor: "#FFFFFF",
    bgStyle: { background: "linear-gradient(135deg, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.7) 100%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.15)" },
    countdownClass: "text-5xl sm:text-6xl font-black tracking-tighter",
    goalTextClass: "text-sm font-semibold uppercase tracking-widest",
    progressBarColor: "bg-white/50",
    progressTrackColor: "bg-white/15",
    dateColor: "text-white/30",
    format: { showWeeks: false, showDays: true, showHours: true, showMinutes: true, showSeconds: false },
  },
  {
    id: "ocean",
    name: "Ocean",
    fontFamily: "system-ui, sans-serif",
    textColor: "#E0F2FE",
    bgStyle: { background: "linear-gradient(180deg, rgba(14,116,144,0.6) 0%, rgba(21,94,117,0.7) 100%)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(165,243,252,0.1)" },
    countdownClass: "text-4xl sm:text-5xl font-semibold tracking-tight",
    goalTextClass: "text-sm font-medium",
    progressBarColor: "bg-cyan-300/40",
    progressTrackColor: "bg-cyan-900/30",
    dateColor: "text-cyan-200/30",
    format: { showWeeks: true, showDays: true, showHours: true, showMinutes: false, showSeconds: false },
  },
  {
    id: "sunset",
    name: "Sunset",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    textColor: "#FFF7ED",
    bgStyle: { background: "linear-gradient(135deg, rgba(234,88,12,0.6) 0%, rgba(190,18,60,0.5) 100%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(251,146,60,0.15)" },
    countdownClass: "text-4xl sm:text-5xl font-bold tracking-tight",
    goalTextClass: "text-sm font-medium",
    progressBarColor: "bg-orange-200/40",
    progressTrackColor: "bg-orange-900/20",
    dateColor: "text-orange-200/30",
    format: { showWeeks: false, showDays: true, showHours: true, showMinutes: true, showSeconds: true },
  },
  {
    id: "mono",
    name: "Mono",
    fontFamily: "'Roboto Mono', 'SF Mono', 'Fira Code', monospace",
    textColor: "#E4E4E7",
    bgStyle: { background: "rgba(24,24,27,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)" },
    countdownClass: "text-3xl sm:text-4xl font-normal tracking-widest",
    goalTextClass: "text-xs font-normal uppercase tracking-[0.2em]",
    progressBarColor: "bg-zinc-400/30",
    progressTrackColor: "bg-zinc-700/40",
    dateColor: "text-zinc-500",
    format: { showWeeks: false, showDays: true, showHours: true, showMinutes: true, showSeconds: true },
  },
  {
    id: "forest",
    name: "Forest",
    fontFamily: "'Inter', sans-serif",
    textColor: "#ECFDF5",
    bgStyle: { background: "linear-gradient(160deg, rgba(20,83,45,0.65) 0%, rgba(22,101,52,0.6) 100%)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(74,222,128,0.1)" },
    countdownClass: "text-4xl sm:text-5xl font-semibold tracking-tight",
    goalTextClass: "text-sm font-medium",
    progressBarColor: "bg-emerald-300/35",
    progressTrackColor: "bg-emerald-900/25",
    dateColor: "text-emerald-300/25",
    format: { showWeeks: false, showDays: true, showHours: true, showMinutes: true, showSeconds: false },
  },
];

function buildCountdownString(endDate: Date, now: Date, fmt: DisplayFormat): string {
  let diff = Math.max(0, endDate.getTime() - now.getTime());
  if (diff === 0) return "0d";

  const totalSecs = Math.floor(diff / 1000);
  const totalMins = Math.floor(totalSecs / 60);
  const totalHours = Math.floor(totalMins / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalWeeks = Math.floor(totalDays / 7);

  const parts: string[] = [];

  if (fmt.showWeeks) {
    const w = totalWeeks;
    const d = totalDays - w * 7;
    parts.push(`${w}w`);
    if (fmt.showDays) parts.push(`${d}d`);
  } else if (fmt.showDays) {
    parts.push(`${totalDays}d`);
  }

  if (fmt.showHours) {
    const h = totalHours % 24;
    parts.push(`${h}h`);
  }
  if (fmt.showMinutes) {
    const m = totalMins % 60;
    parts.push(`${String(m).padStart(2, "0")}m`);
  }
  if (fmt.showSeconds) {
    const s = totalSecs % 60;
    parts.push(`${String(s).padStart(2, "0")}s`);
  }

  return parts.join(" ");
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

  // Live time
  const [now, setNow] = useState(new Date());

  const activeTheme = useMemo(() => {
    if (!activeGoal) return CLOCK_THEMES[selectedThemeIdx];
    const found = CLOCK_THEMES.find(t => t.id === (activeGoal.display_style || "minimal"));
    return found || CLOCK_THEMES[0];
  }, [activeGoal, selectedThemeIdx]);

  const activeFormat = useMemo<DisplayFormat>(() => {
    if (activeGoal?.display_format) return activeGoal.display_format;
    return activeTheme.format;
  }, [activeGoal, activeTheme]);

  useEffect(() => {
    const ms = activeFormat.showSeconds ? 1000 : 60_000;
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [activeFormat.showSeconds]);

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
    const theme = CLOCK_THEMES[selectedThemeIdx];
    await createGoal.mutateAsync({
      goal_text: goalText.trim(),
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      display_style: theme.id,
      motivational_style: "standard",
      weekly_checkins: false,
      display_format: theme.format,
      font_style: theme.name,
      text_color: theme.textColor,
      transparency_level: 0,
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

  const previewCountdown = buildCountdownString(endDate, new Date(), CLOCK_THEMES[selectedThemeIdx].format);

  // ─── SETUP VIEW ───
  if (!activeGoal) {
    return (
      <>
        <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[0, 1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-border"
                )} />
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

            {/* Screen 3: Choose Clock Theme */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold text-foreground mb-1">Choose your countdown clock</h3>
                <p className="text-sm text-muted-foreground mb-5">Swipe through themes. Each shows a live preview.</p>

                {/* Theme carousel */}
                <div className="relative mb-5">
                  {/* Navigation arrows */}
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
                    onClick={() => setSelectedThemeIdx(i => Math.min(CLOCK_THEMES.length - 1, i + 1))}
                    disabled={selectedThemeIdx === CLOCK_THEMES.length - 1}
                    className={cn(
                      "absolute -right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                      selectedThemeIdx === CLOCK_THEMES.length - 1 ? "text-muted-foreground/20" : "bg-card border border-border shadow-sm text-foreground hover:bg-muted"
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Live preview card */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={CLOCK_THEMES[selectedThemeIdx].id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl overflow-hidden mx-4"
                      style={CLOCK_THEMES[selectedThemeIdx].bgStyle}
                    >
                      <div className="p-6 text-center">
                        <p
                          className={CLOCK_THEMES[selectedThemeIdx].goalTextClass}
                          style={{ fontFamily: CLOCK_THEMES[selectedThemeIdx].fontFamily, color: CLOCK_THEMES[selectedThemeIdx].textColor, opacity: 0.7 }}
                        >
                          {goalText}
                        </p>
                        <p
                          className={cn(CLOCK_THEMES[selectedThemeIdx].countdownClass, "mt-2 leading-none")}
                          style={{
                            fontFamily: CLOCK_THEMES[selectedThemeIdx].fontFamily,
                            color: CLOCK_THEMES[selectedThemeIdx].textColor,
                            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                          }}
                        >
                          {previewCountdown}
                        </p>
                        {/* Mini progress bar preview */}
                        <div className="mt-4 mx-auto max-w-[200px]">
                          <div className={cn("h-1 w-full rounded-full overflow-hidden", CLOCK_THEMES[selectedThemeIdx].progressTrackColor)}>
                            <div className={cn("h-full rounded-full w-[15%]", CLOCK_THEMES[selectedThemeIdx].progressBarColor)} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Theme name */}
                  <p className="text-center text-sm font-medium text-foreground mt-3">
                    {CLOCK_THEMES[selectedThemeIdx].name}
                  </p>

                  {/* Dot indicators */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {CLOCK_THEMES.map((_, i) => (
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

                {/* Format toggles (shows what this theme includes) */}
                <div className="mb-5 rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">This theme shows</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["showWeeks", "showDays", "showHours", "showMinutes", "showSeconds"] as const).map(key => {
                      const labels = { showWeeks: "Weeks", showDays: "Days", showHours: "Hours", showMinutes: "Minutes", showSeconds: "Seconds" };
                      const active = CLOCK_THEMES[selectedThemeIdx].format[key];
                      return (
                        <span
                          key={key}
                          className={cn(
                            "px-2 py-1 rounded text-[11px]",
                            active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground/40"
                          )}
                        >
                          {labels[key]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                  <Button
                    onClick={handleLockIn}
                    disabled={createGoal.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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

  // ─── ACTIVE GOAL COUNTDOWN ───
  const goalEndDate = new Date(activeGoal.end_date);
  const countdownStr = buildCountdownString(goalEndDate, now, activeFormat);
  const totalDays = differenceInDays(goalEndDate, new Date(activeGoal.start_date));
  const daysLeft = Math.max(0, differenceInDays(goalEndDate, now));
  const progressPct = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 0;

  return (
    <>
      <div
        className="rounded-xl overflow-hidden relative"
        style={activeTheme.bgStyle}
      >
        <div className="p-5 relative z-10">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white outline-none"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleEditSave()}
                  />
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white" onClick={handleEditSave}>Save</Button>
                  <Button size="sm" variant="ghost" className="text-white/40" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p
                    className={activeTheme.goalTextClass}
                    style={{ fontFamily: activeTheme.fontFamily, color: activeTheme.textColor, opacity: 0.7 }}
                  >
                    {activeGoal.goal_text}
                  </p>
                  <button
                    onClick={() => { setEditing(true); setEditText(activeGoal.goal_text); }}
                    className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Menu */}
            <div className="relative ml-2">
              <button onClick={() => setShowMenu(!showMenu)} className="text-white/30 hover:text-white/60 transition-colors">
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

          {/* BIG COUNTDOWN */}
          <div className="text-center my-4">
            <p
              className={cn(activeTheme.countdownClass, "leading-none")}
              style={{
                fontFamily: activeTheme.fontFamily,
                color: activeTheme.textColor,
                textShadow: "0 2px 20px rgba(0,0,0,0.4)",
              }}
            >
              {countdownStr}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className={cn("text-[10px]", activeTheme.dateColor)}>Day {totalDays - daysLeft}/{totalDays}</span>
              <span className={cn("text-[10px]", activeTheme.dateColor)}>{progressPct}%</span>
            </div>
            <div className={cn("h-1 w-full rounded-full overflow-hidden", activeTheme.progressTrackColor)}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn("h-full rounded-full", activeTheme.progressBarColor)}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="flex justify-between mt-2">
            <span className={cn("text-[10px]", activeTheme.dateColor)}>
              {format(new Date(activeGoal.start_date), "MMM d")}
            </span>
            <span className={cn("text-[10px]", activeTheme.dateColor)}>
              {format(goalEndDate, "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* History panel */}
        {showHistory && history.length > 0 && (
          <div className="px-5 pb-4 space-y-2 border-t border-white/5 pt-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Past Goals</p>
            {history.map(g => (
              <div key={g.id} className="rounded-lg bg-white/5 p-2.5">
                <p className="text-xs font-medium text-white/80">{g.goal_text}</p>
                <p className="text-[10px] text-white/40">
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
