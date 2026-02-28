import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveGoal, useGoalHistory, useGoalCheckIns, useCreateGoal, useUpdateGoal, useAddCheckIn } from "@/hooks/useNinetyDayGoals";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, ChevronDown, ChevronUp, History, Sparkles, Target, Settings, Trophy, Flame, Star, Medal, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, differenceInBusinessDays, addDays } from "date-fns";

const PLACEHOLDER_GOALS = [
  "Launch my side business",
  "Lose 15 pounds",
  "Save $5,000",
  "Learn Spanish",
  "Build a consistent workout routine",
];

const QUOTES = [
  "Small daily improvements are the key to staggering long-term results.",
  "Discipline is choosing between what you want now and what you want most.",
  "The secret of getting ahead is getting started.",
  "You don't have to be great to start, but you have to start to be great.",
];

const MICRO_INSIGHTS = [
  (d: number, t: number, left: number) => `90 days = 2,160 hours of opportunity`,
  (d: number, t: number, left: number) => `You're ${Math.round(((t - left) / t) * 100)}% closer than when you started`,
  (d: number, t: number, left: number) => `${Math.ceil(left / 7)} more weekends until completion`,
  (d: number, t: number, left: number) => `Same time as a full TV season`,
  (d: number, t: number, left: number) => `${t - left} days invested - don't waste them!`,
  (d: number, t: number, left: number) => left <= 24 ? `Studies show: 66 days builds habits (you're past that!)` : `${left} more sunrises to your goal`,
  (d: number, t: number, left: number) => `${Math.ceil(left)} more sleeps until finish line`,
];

const VISUAL_THEMES = [
  { id: "purple", label: "Calm Gradient", from: "from-primary/15", via: "via-primary/5", to: "to-primary/10", glow: "shadow-primary/10" },
  { id: "ocean", label: "Ocean Waves", from: "from-blue-500/15", via: "via-cyan-500/5", to: "to-blue-400/10", glow: "shadow-blue-500/10" },
  { id: "sunset", label: "Sunset Fire", from: "from-orange-500/15", via: "via-red-400/5", to: "to-amber-400/10", glow: "shadow-orange-500/10" },
  { id: "forest", label: "Forest Growth", from: "from-emerald-500/15", via: "via-green-400/5", to: "to-teal-400/10", glow: "shadow-emerald-500/10" },
  { id: "mono", label: "Monochrome", from: "from-foreground/5", via: "via-muted/5", to: "to-foreground/3", glow: "shadow-foreground/5" },
];

const BADGES = [
  { id: "week1", emoji: "🏅", label: "Week Warrior", desc: "7 days in", dayReq: 7 },
  { id: "streak10", emoji: "🔥", label: "Hot Streak", desc: "10 check-ins", checkInReq: 10 },
  { id: "halfway", emoji: "💪", label: "Halfway Hero", desc: "45 days", dayReq: 45 },
  { id: "consistent", emoji: "⭐", label: "Consistency King", desc: "30 check-ins", checkInReq: 30 },
  { id: "complete", emoji: "🏆", label: "Goal Crusher", desc: "90 days complete", dayReq: 90 },
];

function getQuarter(date: Date) {
  const m = date.getMonth();
  if (m < 3) return "Q1";
  if (m < 6) return "Q2";
  if (m < 9) return "Q3";
  return "Q4";
}

function getPhase(daysPassed: number, totalDays: number) {
  const pct = daysPassed / totalDays;
  if (pct >= 0.97) return "lastDay"; // last ~3 days
  if (pct >= 0.89) return "last10";
  if (pct >= 0.67) return "final";
  if (pct >= 0.33) return "middle";
  return "early";
}

function getPhaseColors(phase: string) {
  switch (phase) {
    case "early": return { bar: "from-emerald-400 to-cyan-400", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" };
    case "middle": return { bar: "from-primary to-indigo-400", text: "text-primary", bg: "bg-primary/10" };
    case "final": return { bar: "from-amber-400 to-orange-400", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
    case "last10": return { bar: "from-orange-400 to-red-400", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" };
    case "lastDay": return { bar: "from-red-400 to-rose-500", text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
    default: return { bar: "from-primary to-indigo-400", text: "text-primary", bg: "bg-primary/10" };
  }
}

function getPhaseMessage(phase: string, daysLeft: number) {
  switch (phase) {
    case "early": return `Great start! ${daysLeft} days of opportunity ahead`;
    case "middle": return `Halfway there! Keep pushing 💪`;
    case "final": return `Final sprint! ${daysLeft} days left`;
    case "last10": return `${daysLeft} days! You got this! 🔥`;
    case "lastDay": return `Less than ${daysLeft} day${daysLeft !== 1 ? "s" : ""} - finish strong!`;
    default: return "";
  }
}

export default function NinetyDayGoalWidget() {
  const { data: activeGoal, isLoading } = useActiveGoal();
  const { data: history = [] } = useGoalHistory();
  const { data: checkIns = [] } = useGoalCheckIns(activeGoal?.id);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const addCheckIn = useAddCheckIn();

  // Setup state
  const [goalText, setGoalText] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayStyle, setDisplayStyle] = useState("standard");
  const [motivationalStyle, setMotivationalStyle] = useState("standard");
  const [weeklyCheckins, setWeeklyCheckins] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInProgress, setCheckInProgress] = useState(50);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionAchieved, setCompletionAchieved] = useState<string | null>(null);
  const [reflectionNotes, setReflectionNotes] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [visualTheme, setVisualTheme] = useState("purple");
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  // Live ticker for final stretch
  const [liveTime, setLiveTime] = useState(new Date());
  const daysLeft = useMemo(() => {
    if (!activeGoal) return 0;
    return Math.max(0, differenceInDays(new Date(activeGoal.end_date), liveTime));
  }, [activeGoal, liveTime]);

  const totalDays = useMemo(() => {
    if (!activeGoal) return 90;
    return differenceInDays(new Date(activeGoal.end_date), new Date(activeGoal.start_date));
  }, [activeGoal]);

  const daysPassed = totalDays - daysLeft;
  const progressPct = useMemo(() => {
    if (!activeGoal || totalDays === 0) return 0;
    return Math.min(100, Math.round((daysPassed / totalDays) * 100));
  }, [daysPassed, totalDays, activeGoal]);

  const phase = useMemo(() => getPhase(daysPassed, totalDays), [daysPassed, totalDays]);
  const phaseColors = useMemo(() => getPhaseColors(phase), [phase]);

  // Live ticker: update every second in final stretch, every minute otherwise
  useEffect(() => {
    const interval = phase === "last10" || phase === "lastDay"
      ? setInterval(() => setLiveTime(new Date()), 1000)
      : setInterval(() => setLiveTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, [phase]);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_GOALS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  // Check if goal expired
  useEffect(() => {
    if (activeGoal) {
      if (daysLeft <= 0 && !showCompletion) {
        setShowCompletion(true);
      }
    }
  }, [activeGoal, daysLeft]);

  // Computed metrics
  const businessDaysLeft = useMemo(() => {
    if (!activeGoal) return 0;
    return Math.max(0, differenceInBusinessDays(new Date(activeGoal.end_date), new Date()));
  }, [activeGoal]);

  const sleepCycles = daysLeft;
  const pctRemaining = 100 - progressPct;
  const endDateFormatted = activeGoal ? format(new Date(activeGoal.end_date), "MMMM d, yyyy") : "";
  const endDayOfWeek = activeGoal ? format(new Date(activeGoal.end_date), "EEEE") : "";

  // Live countdown breakdown
  const liveCountdown = useMemo(() => {
    if (!activeGoal) return { d: 0, h: 0, m: 0, s: 0 };
    const diff = new Date(activeGoal.end_date).getTime() - liveTime.getTime();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  }, [activeGoal, liveTime]);

  // Streak: consecutive check-ins (weekly)
  const streak = useMemo(() => {
    if (checkIns.length === 0) return 0;
    return checkIns.length; // simplified: count of check-ins as streak
  }, [checkIns]);

  // Next milestone
  const nextMilestone = useMemo(() => {
    const milestones = [30, 60, 90];
    for (const m of milestones) {
      if (daysPassed < m) return { day: m, daysUntil: m - daysPassed };
    }
    return null;
  }, [daysPassed]);

  // Milestone checkpoints
  const checkpoints = useMemo(() => {
    return [30, 60, 90].map(d => ({
      day: d,
      reached: daysPassed >= d,
      daysUntil: Math.max(0, d - daysPassed),
    }));
  }, [daysPassed]);

  // Earned badges
  const earnedBadges = useMemo(() => {
    return BADGES.filter(b => {
      if (b.dayReq && daysPassed >= b.dayReq) return true;
      if (b.checkInReq && checkIns.length >= b.checkInReq) return true;
      return false;
    });
  }, [daysPassed, checkIns]);

  // Daily micro-insight
  const microInsight = useMemo(() => {
    const idx = new Date().getDate() % MICRO_INSIGHTS.length;
    return MICRO_INSIGHTS[idx](daysPassed, totalDays, daysLeft);
  }, [daysPassed, totalDays, daysLeft]);

  // Theme
  const currentTheme = VISUAL_THEMES.find(t => t.id === visualTheme) || VISUAL_THEMES[0];

  const handleCommit = async () => {
    const startDate = new Date();
    const endDate = addDays(startDate, 90);
    await createGoal.mutateAsync({
      goal_text: goalText.trim(),
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      display_style: displayStyle,
      motivational_style: motivationalStyle,
      weekly_checkins: weeklyCheckins,
    });
    setShowCommitModal(false);
    setShowCelebration(true);
    import("canvas-confetti").then(m => {
      m.default({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => m.default({ particleCount: 100, spread: 100, origin: { y: 0.5 } }), 300);
    });
    setTimeout(() => setShowCelebration(false), 3000);
    setGoalText("");
  };

  const handleEditSave = () => {
    if (activeGoal && editText.trim()) {
      updateGoal.mutate({ id: activeGoal.id, goal_text: editText.trim() });
      setEditing(false);
    }
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

  const handleCheckIn = async () => {
    if (!activeGoal) return;
    await addCheckIn.mutateAsync({ goal_id: activeGoal.id, progress_percentage: checkInProgress, notes: checkInNotes });
    setShowCheckIn(false);
    setCheckInNotes("");
    setCheckInProgress(50);
  };

  if (isLoading) return null;

  const currentQuarter = `${getQuarter(new Date())} ${new Date().getFullYear()}`;

  // ─── SETUP VIEW (no active goal) ───
  if (!activeGoal) {
    return (
      <>
        <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 via-card to-primary/10 p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">What's Your Next 90-Day Goal?</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            It takes 90 days to build a habit into a permanent lifestyle. Choose your focus for this quarter.
          </p>

          <input
            type="text"
            value={goalText}
            onChange={e => setGoalText(e.target.value)}
            placeholder={PLACEHOLDER_GOALS[placeholderIdx]}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary transition-colors mb-4"
          />

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Display</label>
              <select value={displayStyle} onChange={e => setDisplayStyle(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none">
                <option value="minimal">Minimal</option>
                <option value="standard">Standard</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Energy</label>
              <select value={motivationalStyle} onChange={e => setMotivationalStyle(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none">
                <option value="minimal">Minimal</option>
                <option value="standard">Standard</option>
                <option value="high">High Energy</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={weeklyCheckins} onChange={e => setWeeklyCheckins(e.target.checked)} className="rounded" />
                Weekly check-ins
              </label>
            </div>
          </div>

          <Button
            onClick={() => setShowCommitModal(true)}
            disabled={!goalText.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" /> Commit to This Goal
          </Button>

          {history.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)} className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <History className="h-3.5 w-3.5" /> View Past Goals ({history.length})
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}

          {showHistory && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {history.map(g => (
                <div key={g.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-foreground">{g.goal_text}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(g.start_date), "MMM d")} – {format(new Date(g.end_date), "MMM d, yyyy")}
                    {g.achieved && <span className="ml-2">· {g.achieved === "yes" ? "✅ Achieved" : g.achieved === "partial" ? "🟡 Partial" : "❌ Not achieved"}</span>}
                  </p>
                  {g.reflection_notes && <p className="text-[11px] text-muted-foreground/70 mt-1 italic">"{g.reflection_notes}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commit Modal */}
        <AnimatePresence>
          {showCommitModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-[10001]"
              style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
              onClick={() => setShowCommitModal(false)}
            >
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="w-[420px] max-w-[90vw] bg-card rounded-2xl p-8 shadow-2xl text-center"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">Make Your Commitment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  I commit to <span className="font-semibold text-foreground">"{goalText}"</span> over the next 90 days.
                </p>
                <div className="rounded-lg bg-primary/5 p-3 mb-5 text-xs text-muted-foreground">
                  📅 {format(new Date(), "MMM d, yyyy")} → {format(addDays(new Date(), 90), "MMM d, yyyy")}
                </div>
                <Button onClick={handleCommit} className="w-full font-semibold py-3" size="lg" disabled={createGoal.isPending}>
                  Yes, I'm Committed 💪
                </Button>
                <button onClick={() => setShowCommitModal(false)} className="mt-3 text-xs text-muted-foreground hover:text-foreground">
                  Not yet
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration toast */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10002] rounded-xl bg-primary px-6 py-3 text-primary-foreground text-sm font-medium shadow-2xl"
            >
              Commitment locked in! You've got this 💪
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─── ACTIVE GOAL VIEW ───
  const style = activeGoal.motivational_style;
  const quote = QUOTES[Math.floor(new Date().getDate() % QUOTES.length)];
  const showLiveTicker = phase === "last10" || phase === "lastDay";

  return (
    <>
      <motion.div
        layout
        className={cn(
          "rounded-xl border border-border shadow-2xs overflow-hidden transition-shadow duration-500",
          `bg-gradient-to-br ${currentTheme.from} ${currentTheme.via} ${currentTheme.to}`,
          phase === "lastDay" && "animate-pulse-slow",
          style === "high" ? "p-6" : style === "minimal" ? "p-4" : "p-5"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className={cn("h-4 w-4", phaseColors.text)} />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              90-Day Goal · {currentQuarter}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Earned badges */}
            {earnedBadges.length > 0 && (
              <div className="flex items-center gap-0.5 mr-1">
                {earnedBadges.map(b => (
                  <div key={b.id} className="relative">
                    <button
                      onMouseEnter={() => setHoveredBadge(b.id)}
                      onMouseLeave={() => setHoveredBadge(null)}
                      className="text-sm hover:scale-110 transition-transform"
                    >
                      {b.emoji}
                    </button>
                    {hoveredBadge === b.id && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-foreground text-background text-[10px] px-2 py-0.5 rounded-md z-10">
                        {b.label}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {activeGoal.weekly_checkins && (
              <button onClick={() => setShowCheckIn(true)} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                Check In
              </button>
            )}
            <button onClick={() => setShowSettings(!showSettings)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
              <History className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Goal text */}
        <div className="flex items-start gap-2 mb-3">
          {editing ? (
            <div className="flex-1 flex gap-2">
              <input type="text" value={editText} onChange={e => setEditText(e.target.value)}
                className="flex-1 rounded-lg border border-primary bg-background px-3 py-1.5 text-sm outline-none" autoFocus />
              <Button size="sm" onClick={handleEditSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <>
              <p className={cn("flex-1 font-semibold text-foreground", style === "high" ? "text-lg" : "text-base")}>
                🎯 {activeGoal.goal_text}
              </p>
              <button onClick={() => { setEditing(true); setEditText(activeGoal.goal_text); }} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Primary Countdown */}
        <div className="mb-3">
          {showLiveTicker ? (
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-bold text-foreground">{liveCountdown.d}d</span>
              <span className="text-lg font-semibold text-foreground/80">{liveCountdown.h}h</span>
              <span className="text-lg font-semibold text-foreground/60">{String(liveCountdown.m).padStart(2, "0")}m</span>
              <span className="text-base font-medium text-foreground/40">{String(liveCountdown.s).padStart(2, "0")}s</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{daysLeft}d</span>
              {(phase === "middle" || phase === "final") && (
                <span className="text-lg font-semibold text-foreground/60">{liveCountdown.h}h</span>
              )}
              <span className="text-sm text-muted-foreground ml-1">remaining</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {(activeGoal.display_style === "standard" || activeGoal.display_style === "full") && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Day {daysPassed}/{totalDays}</span>
              <span className="text-xs font-medium text-foreground">{progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn("h-full rounded-full bg-gradient-to-r", phaseColors.bar)}
              />
            </div>
          </div>
        )}

        {activeGoal.display_style === "minimal" && (
          <p className="text-sm text-muted-foreground mb-3">Day {daysPassed}/{totalDays} · {progressPct}%</p>
        )}

        {/* Milestone checkpoints */}
        {activeGoal.display_style !== "minimal" && (
          <div className="flex items-center gap-1 mb-3">
            {checkpoints.map((cp, i) => (
              <div key={cp.day} className="flex items-center gap-1">
                {i > 0 && <div className={cn("h-px w-4", cp.reached ? "bg-primary" : "bg-border")} />}
                <div className="flex items-center gap-1">
                  <span className={cn("text-xs", cp.reached ? "text-primary" : "text-muted-foreground/50")}>
                    {cp.reached ? "✓" : "◯"}
                  </span>
                  <span className={cn("text-[10px]", cp.reached ? "text-foreground" : "text-muted-foreground/50")}>
                    {cp.day}
                  </span>
                  {!cp.reached && cp.daysUntil > 0 && nextMilestone?.day === cp.day && (
                    <span className="text-[10px] text-muted-foreground">({cp.daysUntil}d)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Streak + next milestone (compact) */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
          {streak > 0 && <span>🔥 {streak} check-in{streak !== 1 ? "s" : ""}</span>}
          {nextMilestone && <span>Next: Day {nextMilestone.day} in {nextMilestone.daysUntil}d</span>}
        </div>

        {/* Phase message */}
        {style !== "minimal" && (
          <div className={cn("rounded-lg px-3 py-1.5 text-xs font-medium", phaseColors.bg, phaseColors.text)}>
            {getPhaseMessage(phase, daysLeft)}
          </div>
        )}

        {/* Sunk cost motivator (>50%) */}
        {progressPct > 50 && style !== "minimal" && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {daysPassed} days invested – finish what you started!
          </p>
        )}

        {/* Micro-insight */}
        {style === "high" && (
          <p className="mt-2 text-[11px] text-muted-foreground/60 italic">{microInsight}</p>
        )}

        {style === "high" && (
          <p className="mt-1 text-xs text-muted-foreground italic">"{quote}"</p>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
        >
          {expanded ? "Less details" : "More details"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Expanded detail panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-background/50 p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Business Days</p>
                    <p className="text-sm font-semibold text-foreground">{businessDaysLeft} work days</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sleep Cycles</p>
                    <p className="text-sm font-semibold text-foreground">{sleepCycles} sleeps left</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">% Remaining</p>
                    <p className="text-sm font-semibold text-foreground">{pctRemaining}% to go</p>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Days Invested</p>
                    <p className="text-sm font-semibold text-foreground">{daysPassed} days</p>
                  </div>
                </div>
                <div className="rounded-lg bg-background/50 p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ends On</p>
                  <p className="text-sm font-semibold text-foreground">{endDayOfWeek}, {endDateFormatted}</p>
                </div>
                <p className="text-[11px] text-muted-foreground/60 italic text-center">{microInsight}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Card Theme</p>
                <div className="flex flex-wrap gap-1.5">
                  {VISUAL_THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setVisualTheme(t.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] border transition-colors",
                        visualTheme === t.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {showHistory && history.length > 0 && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto border-t border-border pt-3">
            {history.map(g => (
              <div key={g.id} className="rounded-lg bg-background p-2.5 text-xs">
                <p className="font-medium text-foreground">{g.goal_text}</p>
                <p className="text-muted-foreground">
                  {format(new Date(g.start_date), "MMM d")} – {format(new Date(g.end_date), "MMM d, yyyy")}
                  {g.achieved && <span className="ml-1">· {g.achieved === "yes" ? "✅" : g.achieved === "partial" ? "🟡" : "❌"}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Check-in modal */}
      <AnimatePresence>
        {showCheckIn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[10001]"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowCheckIn(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-[400px] max-w-[90vw] bg-card rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-md font-semibold text-foreground mb-1">How's your 90-day goal going?</h3>
              <p className="text-sm text-muted-foreground mb-4">"{activeGoal.goal_text}"</p>
              <label className="text-xs text-muted-foreground">Progress: {checkInProgress}%</label>
              <input type="range" min={0} max={100} value={checkInProgress} onChange={e => setCheckInProgress(Number(e.target.value))}
                className="w-full mb-3 accent-[hsl(var(--primary))]" />
              <textarea
                value={checkInNotes}
                onChange={e => setCheckInNotes(e.target.value)}
                placeholder="What did you do this week?"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none h-20 mb-4"
              />
              <Button onClick={handleCheckIn} className="w-full" disabled={addCheckIn.isPending}>Keep Going 💪</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion modal */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[10001]"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-[420px] max-w-[90vw] bg-card rounded-2xl p-8 shadow-2xl text-center"
            >
              <p className="text-3xl mb-2">🎉</p>
              <h3 className="text-lg font-semibold text-foreground mb-1">You did it! 90 days complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">Did you achieve your goal?</p>
              <div className="flex gap-2 justify-center mb-4">
                {["yes", "partial", "no"].map(v => (
                  <button
                    key={v}
                    onClick={() => setCompletionAchieved(v)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm transition-colors border",
                      completionAchieved === v ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none h-20 mb-4"
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
