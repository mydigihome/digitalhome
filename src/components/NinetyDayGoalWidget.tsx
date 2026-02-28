import { useState, useEffect, useMemo } from "react";
import { useActiveGoal, useGoalHistory, useGoalCheckIns, useCreateGoal, useUpdateGoal, useAddCheckIn } from "@/hooks/useNinetyDayGoals";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, ChevronDown, ChevronUp, History, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addDays } from "date-fns";

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

function getQuarter(date: Date) {
  const m = date.getMonth();
  if (m < 3) return "Q1";
  if (m < 6) return "Q2";
  if (m < 9) return "Q3";
  return "Q4";
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

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_GOALS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  // Check if goal expired
  useEffect(() => {
    if (activeGoal) {
      const daysLeft = differenceInDays(new Date(activeGoal.end_date), new Date());
      if (daysLeft <= 0 && !showCompletion) {
        setShowCompletion(true);
      }
    }
  }, [activeGoal]);

  const daysLeft = useMemo(() => {
    if (!activeGoal) return 0;
    return Math.max(0, differenceInDays(new Date(activeGoal.end_date), new Date()));
  }, [activeGoal]);

  const totalDays = useMemo(() => {
    if (!activeGoal) return 90;
    return differenceInDays(new Date(activeGoal.end_date), new Date(activeGoal.start_date));
  }, [activeGoal]);

  const progressPct = useMemo(() => {
    if (!activeGoal || totalDays === 0) return 0;
    return Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));
  }, [daysLeft, totalDays, activeGoal]);

  const milestone = useMemo(() => {
    const daysPassed = totalDays - daysLeft;
    if (daysPassed >= 90) return { emoji: "🏆", text: "GOAL COMPLETE! You did it!" };
    if (daysPassed >= 60) return { emoji: "🔥", text: "60 days! You're in the home stretch!" };
    if (daysPassed >= 30) return { emoji: "🎊", text: "1 month down! You're 33% there!" };
    return null;
  }, [totalDays, daysLeft]);

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

  return (
    <>
      <div className={cn(
        "rounded-xl border border-border shadow-2xs overflow-hidden",
        style === "high" ? "bg-gradient-to-br from-primary/15 via-primary/5 to-primary/10 p-6" :
        style === "minimal" ? "bg-card p-4" : "bg-gradient-to-br from-primary/5 to-card p-5"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">90-Day Goal · {currentQuarter}</span>
          </div>
          <div className="flex items-center gap-1">
            {activeGoal.weekly_checkins && (
              <button onClick={() => setShowCheckIn(true)} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                Check In
              </button>
            )}
            <button onClick={() => setShowHistory(!showHistory)} className="text-muted-foreground hover:text-foreground transition-colors">
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
                {activeGoal.goal_text}
              </p>
              <button onClick={() => { setEditing(true); setEditText(activeGoal.goal_text); }} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Countdown display */}
        {(activeGoal.display_style === "standard" || activeGoal.display_style === "full") && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">{daysLeft} days remaining</span>
              <span className="text-sm font-medium text-foreground">{progressPct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--primary)) 0%, #6366F1 100%)" }}
              />
            </div>
          </div>
        )}

        {activeGoal.display_style === "minimal" && (
          <p className="text-sm text-muted-foreground mb-3">{daysLeft} days remaining · {progressPct}% complete</p>
        )}

        {/* Check-ins count */}
        {checkIns.length > 0 && (
          <p className="text-[11px] text-muted-foreground">{checkIns.length} week{checkIns.length !== 1 ? "s" : ""} checked in ✓</p>
        )}

        {/* Milestone + motivational */}
        {style !== "minimal" && milestone && (
          <div className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary font-medium">
            {milestone.emoji} {milestone.text}
          </div>
        )}

        {style === "high" && (
          <p className="mt-2 text-xs text-muted-foreground italic">"{quote}"</p>
        )}

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
      </div>

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
