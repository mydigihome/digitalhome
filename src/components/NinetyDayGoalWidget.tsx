import { useState, useEffect, useMemo } from "react";
import { useActiveGoal, useGoalHistory, useCreateGoal, useUpdateGoal, type DisplayFormat } from "@/hooks/useNinetyDayGoals";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, MoreHorizontal, History, ChevronUp, ChevronDown, Target, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

const PLACEHOLDER_GOALS = [
  "Launch my business",
  "Get in shape",
  "Save $5,000",
  "Learn Spanish",
  "Read 12 books",
];

const FONTS = [
  { value: "SF Pro", label: "SF Pro", css: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" },
  { value: "Helvetica Neue", label: "Helvetica Neue", css: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { value: "Roboto", label: "Roboto", css: "'Roboto', sans-serif" },
  { value: "Inter", label: "Inter", css: "'Inter', sans-serif" },
  { value: "System", label: "System Font", css: "system-ui, sans-serif" },
];

const DEFAULT_FORMAT: DisplayFormat = {
  showWeeks: false,
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: false,
};

function buildCountdownString(
  endDate: Date,
  now: Date,
  fmt: DisplayFormat
): string {
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

  // Setup state (3 screens)
  const [step, setStep] = useState(0);
  const [goalText, setGoalText] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>(DEFAULT_FORMAT);
  const [fontStyle, setFontStyle] = useState("Inter");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [transparency, setTransparency] = useState(20);
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

  const activeFormat = useMemo<DisplayFormat>(() => {
    if (activeGoal?.display_format) return activeGoal.display_format;
    return DEFAULT_FORMAT;
  }, [activeGoal]);

  const needsSeconds = activeFormat.showSeconds;

  useEffect(() => {
    const ms = needsSeconds ? 1000 : 60_000;
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [needsSeconds]);

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
    await createGoal.mutateAsync({
      goal_text: goalText.trim(),
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      display_style: "standard",
      motivational_style: "standard",
      weekly_checkins: false,
      display_format: displayFormat,
      font_style: fontStyle,
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

  const handleUpdateDisplay = (updates: Partial<{ display_format: DisplayFormat; font_style: string; text_color: string; transparency_level: number }>) => {
    if (!activeGoal) return;
    updateGoal.mutate({ id: activeGoal.id, ...updates });
  };

  if (isLoading) return null;

  // Get font CSS
  const getFontCSS = (name: string) => FONTS.find(f => f.value === name)?.css || "'Inter', sans-serif";

  // Preview countdown for setup
  const previewCountdown = buildCountdownString(endDate, new Date(), displayFormat);

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

                <Button
                  onClick={() => setStep(1)}
                  disabled={!goalText.trim()}
                  className="w-full py-3"
                  size="lg"
                >
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

            {/* Screen 3: Customize Display */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-semibold text-foreground mb-1">Customize your countdown</h3>
                <p className="text-sm text-muted-foreground mb-5">Choose what to show and how it looks.</p>

                {/* Live preview */}
                <div
                  className="rounded-xl p-6 mb-5 text-center relative overflow-hidden"
                  style={{
                    background: `rgba(0,0,0,0.6)`,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                >
                  <p
                    className="text-sm mb-2 truncate"
                    style={{
                      fontFamily: getFontCSS(fontStyle),
                      color: textColor,
                      opacity: 1 - transparency / 100,
                    }}
                  >
                    {goalText}
                  </p>
                  <p
                    className="text-3xl font-bold tracking-tight"
                    style={{
                      fontFamily: getFontCSS(fontStyle),
                      color: textColor,
                      opacity: 1 - transparency / 100,
                      textShadow: "0 2px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    {previewCountdown}
                  </p>
                </div>

                {/* Format toggles */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Show</p>
                  <div className="flex flex-wrap gap-2">
                    {(["showWeeks", "showDays", "showHours", "showMinutes", "showSeconds"] as const).map(key => {
                      const labels = { showWeeks: "Weeks", showDays: "Days", showHours: "Hours", showMinutes: "Minutes", showSeconds: "Seconds" };
                      return (
                        <button
                          key={key}
                          onClick={() => setDisplayFormat(f => ({ ...f, [key]: !f[key] }))}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                            displayFormat[key]
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {labels[key]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Font</p>
                  <select
                    value={fontStyle}
                    onChange={e => setFontStyle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  >
                    {FONTS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Color</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={textColor}
                      onChange={e => setTextColor(e.target.value)}
                      className="h-9 w-9 rounded-lg border border-border cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{textColor}</span>
                  </div>
                </div>

                {/* Transparency */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                    Transparency: {transparency}%
                  </p>
                  <Slider
                    value={[transparency]}
                    onValueChange={v => setTransparency(v[0])}
                    min={0}
                    max={80}
                    step={5}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                  <Button
                    onClick={handleLockIn}
                    disabled={createGoal.isPending || !Object.values(displayFormat).some(Boolean)}
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
  const goalFont = getFontCSS(activeGoal.font_style || "Inter");
  const goalColor = activeGoal.text_color || "#FFFFFF";
  const goalTransparency = activeGoal.transparency_level ?? 20;
  const countdownStr = buildCountdownString(goalEndDate, now, activeFormat);
  const totalDays = differenceInDays(goalEndDate, new Date(activeGoal.start_date));
  const daysLeft = Math.max(0, differenceInDays(goalEndDate, now));
  const progressPct = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 0;

  return (
    <>
      <div
        className="rounded-xl overflow-hidden relative"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
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
                    className="text-sm font-medium truncate"
                    style={{
                      fontFamily: goalFont,
                      color: goalColor,
                      opacity: 1 - goalTransparency / 100,
                    }}
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
              className="text-4xl sm:text-5xl font-bold tracking-tight leading-none"
              style={{
                fontFamily: goalFont,
                color: goalColor,
                opacity: 1 - goalTransparency / 100,
                textShadow: "0 2px 20px rgba(0,0,0,0.4)",
              }}
            >
              {countdownStr}
            </p>
          </div>

          {/* Subtle progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/30">Day {totalDays - daysLeft}/{totalDays}</span>
              <span className="text-[10px] text-white/30">{progressPct}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-white/30"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-white/20">
              {format(new Date(activeGoal.start_date), "MMM d")}
            </span>
            <span className="text-[10px] text-white/20">
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
