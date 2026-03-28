import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useContacts } from "@/hooks/useContacts";
import { useExpenses } from "@/hooks/useExpenses";
import { useUpsertPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";

const SPENDING_CATEGORIES = [
  { name: "Housing", color: "#6366f1", amount: 2250 },
  { name: "Food", color: "#22c55e", amount: 680 },
  { name: "Transport", color: "#f59e0b", amount: 420 },
  { name: "Entertainment", color: "#f43f5e", amount: 380 },
  { name: "Other", color: "#e5e7eb", amount: 470 },
];

export default function MonthlyReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get("id");
  const isReadMode = searchParams.get("mode") === "read";
  const { user, profile } = useAuth();
  const { data: finances } = useUserFinances();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: contacts = [] } = useContacts();
  const { data: expenses = [] } = useExpenses();
  const upsertPrefs = useUpsertPreferences();
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(false);

  const { data: savedReview } = useQuery({
    queryKey: ["monthly_review", reviewId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("monthly_reviews").select("*").eq("id", reviewId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!reviewId,
  });

  const isReadOnly = !!reviewId && isReadMode && !!savedReview;

  // Use previous month for the review
  const now = new Date();
  const reviewDate = subMonths(now, 1);
  const monthName = isReadOnly ? savedReview?.review_month?.split(" ")[0] : format(reviewDate, "MMMM");
  const year = isReadOnly ? savedReview?.review_month?.split(" ")[1] : format(reviewDate, "yyyy");
  const reviewMonth = `${monthName} ${year}`;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const netWorth = isReadOnly ? Number(savedReview?.net_worth || 45234) : Number(finances?.current_savings || 45234);
  const creditScore = isReadOnly ? (savedReview?.credit_score || 785) : 785;
  const totalSpending = SPENDING_CATEGORIES.reduce((s, c) => s + c.amount, 0);

  const activeGoals = useMemo(() =>
    projects.filter(p => !p.archived && p.type === "goal").map(p => {
      const pt = tasks.filter(t => t.project_id === p.id);
      const done = pt.filter(t => t.status === "done").length;
      const total = pt.length;
      return { ...p, pct: total > 0 ? Math.round((done / total) * 100) : 0, done, total };
    }), [projects, tasks]);

  const overdueContacts = useMemo(() => {
    const nowMs = Date.now();
    return contacts.filter(c => {
      if (!c.last_contacted_date) return true;
      const daysSince = Math.floor((nowMs - new Date(c.last_contacted_date).getTime()) / 86400000);
      return daysSince > (c.contact_frequency_days || 30);
    });
  }, [contacts]);

  const healthyContacts = useMemo(() => {
    const nowMs = Date.now();
    return contacts.filter(c => {
      if (!c.last_contacted_date) return false;
      const daysSince = Math.floor((nowMs - new Date(c.last_contacted_date).getTime()) / 86400000);
      return daysSince <= (c.contact_frequency_days || 30);
    });
  }, [contacts]);

  const handleApprove = useCallback(async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const snapshot = {
        netWorth, savedAmount: 1300, spentAmount: totalSpending, creditScore,
        goals: activeGoals.map(g => ({ name: g.name, pct: g.pct })),
        overdueContacts: overdueContacts.length,
        healthyContacts: healthyContacts.length,
        spending: SPENDING_CATEGORIES,
      };
      const aiSummary = `${monthName} was a chapter worth keeping. Net worth at $${netWorth.toLocaleString()}, savings rate above target, credit score at ${creditScore}. ${overdueContacts.length} contacts need attention.`;

      await (supabase as any).from("monthly_reviews").upsert({
        user_id: user.id,
        review_month: reviewMonth,
        net_worth: netWorth,
        top_spending_category: SPENDING_CATEGORIES.sort((a, b) => b.amount - a.amount)[0]?.name,
        goals_progress: activeGoals.length > 0 ? Math.round(activeGoals.reduce((s, g) => s + g.pct, 0) / activeGoals.length) : 0,
        contacts_reached: healthyContacts.length,
        bills_paid: expenses.filter(e => e.frequency === "monthly").length,
        credit_score: creditScore,
        ai_summary: aiSummary,
        full_snapshot: snapshot,
      }, { onConflict: "user_id,review_month" });

      upsertPrefs.mutate({ last_review_month: reviewMonth } as any);
      setApproved(true);

      // Confetti
      try {
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#6366f1", "#22c55e", "#f59e0b"],
        });
      } catch {}

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch {
      toast.error("Failed to save review");
    }
    setSaving(false);
  }, [user, saving, netWorth, creditScore, totalSpending, activeGoals, overdueContacts, healthyContacts, expenses, monthName, reviewMonth, upsertPrefs, navigate]);

  const wins = [
    `Net worth up $2,341 — your best month this year.`,
    `Savings rate at 29% — well above the 20% recommendation.`,
    `Credit score improved 12 points.`,
    `All bills paid on time.`,
  ];

  const improvements = [
    `Entertainment at 93% of budget — consider a $50 reduction.`,
    `Student loan payoff is 74 months out — an extra $100/mo saves $12k.`,
    `Emergency fund at 59% — $500/mo gets you there in 11 months.`,
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fafaf8" }}>
      {/* APPROVED watermark for read-only */}
      {isReadOnly && (
        <div
          className="fixed pointer-events-none select-none z-0"
          style={{
            bottom: -20, right: -20,
            fontSize: "8rem", fontWeight: 800,
            color: "#f0f0f0",
            transform: "rotate(-15deg)",
          }}
        >
          APPROVED
        </div>
      )}

      {/* Top nav */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 mb-12" style={{ backgroundColor: "#fafaf8" }}>
        <button
          onClick={() => navigate(isReadOnly ? "/settings?tab=archived" : "/dashboard")}
          className="text-sm font-medium cursor-pointer"
          style={{ color: "#9ca3af" }}
        >
          ← {isReadOnly ? "Back to Archive" : "Dashboard"}
        </button>
        <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#374151" }}>
          {isReadOnly && <Check className="w-4 h-4 inline mr-1" style={{ color: "#22c55e" }} />}
          {reviewMonth}{isReadOnly ? " — Approved ✓" : ""}
        </span>
        <div className="w-20" />
      </div>

      <div className="max-w-[720px] mx-auto px-6 pb-24 relative z-10">
        {/* THE LETTER — Opening */}
        <div>
          <h1
            className="font-extrabold leading-none tracking-tighter"
            style={{ fontSize: "3.5rem", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {monthName}
          </h1>
          <h1
            className="font-extrabold leading-none tracking-tighter"
            style={{ fontSize: "3.5rem", color: "#6366f1", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {year}.
          </h1>
          <p className="mt-6 text-base leading-[1.8] max-w-[560px]" style={{ color: "#374151" }}>
            Hey {firstName}, here's your {monthName} at a glance.
            Overall, it was a solid month — your net worth grew,
            your savings rate stayed above target, and your credit
            score ticked up. A few things need your attention.
            Let's walk through it.
          </p>
        </div>

        <div className="h-px my-10" style={{ backgroundColor: "#e5e7eb" }} />

        {/* SECTION 1 — MONEY */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6" style={{ color: "#9ca3af" }}>
            01 — MONEY
          </p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
            {[
              { value: `$${netWorth.toLocaleString()}`, label: "NET WORTH", change: "↑ $2,341", positive: true },
              { value: "29%", label: "SAVINGS RATE", change: "↑ 9% above target", positive: true },
              { value: `$${totalSpending.toLocaleString()}`, label: "SPENT", change: "⚠ Entertainment over budget", positive: false },
              { value: String(creditScore), label: "CREDIT SCORE", change: "↑ 12 pts", positive: true },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <p className="font-extrabold tracking-tighter" style={{ fontSize: "2.5rem", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {s.value}
                </p>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "#9ca3af" }}>{s.label}</p>
                <span
                  className="inline-flex text-xs font-semibold rounded-full px-2 py-0.5 mt-2"
                  style={{
                    backgroundColor: s.positive ? "#f0fdf4" : "#fff1f2",
                    color: s.positive ? "#16a34a" : "#be123c",
                  }}
                >
                  {s.change}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Wins + Needs Attention */}
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: "#111827" }}>What went well</p>
              {wins.map((w, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <Check className="w-3 h-3" style={{ color: "#16a34a" }} />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{w}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: "#111827" }}>To work on</p>
              {improvements.map((w, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fff8f0", border: "1px solid #fed7aa" }}>
                    <span className="text-xs" style={{ color: "#f59e0b" }}>→</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{w}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CFP Insight */}
          <div className="mt-8 pl-5" style={{ borderLeft: "2px solid rgba(99,102,241,0.3)" }}>
            <p className="text-sm leading-relaxed font-medium italic" style={{ color: "#6b7280" }}>
              "You're building real momentum. The habits are forming — now it's about
              optimizing. One small shift: automate $200 more per month into savings
              and you'll barely notice it, but your future self absolutely will."
            </p>
          </div>
        </div>

        <div className="h-px my-10" style={{ backgroundColor: "#e5e7eb" }} />

        {/* SECTION 2 — GOALS */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6" style={{ color: "#9ca3af" }}>
            02 — GOALS
          </p>
          <div className="space-y-6">
            {activeGoals.length === 0 ? (
              <p className="text-sm" style={{ color: "#9ca3af" }}>No active goals this month.</p>
            ) : activeGoals.map(goal => (
              <div key={goal.id}>
                <p className="font-bold text-lg" style={{ color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {goal.name}
                </p>
                <div className="h-2 rounded-full mt-2 mb-2 overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
                  <div className="h-full rounded-full" style={{ backgroundColor: "#6366f1", width: `${goal.pct}%` }} />
                </div>
                <p className="text-xs" style={{ color: "#9ca3af" }}>
                  {goal.done} of {goal.total} tasks · {goal.pct}% complete
                </p>
                <p className="text-sm italic mt-2" style={{ color: "#374151" }}>
                  {goal.pct < 50
                    ? "You're " + goal.pct + "% there. Stay consistent — this is closer than it feels."
                    : "Great progress — you're past the halfway mark. Keep pushing."}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px my-10" style={{ backgroundColor: "#e5e7eb" }} />

        {/* SECTION 3 — RELATIONSHIPS */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6" style={{ color: "#9ca3af" }}>
            03 — RELATIONSHIPS
          </p>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "#374151" }}>
            Your network is part of your net worth. Here's where your key relationships stand.
          </p>

          <div className="space-y-3 mb-6">
            {contacts.slice(0, 6).map(c => {
              const isOverdue = overdueContacts.some(o => o.id === c.id);
              const daysSince = c.last_contacted_date
                ? Math.floor((Date.now() - new Date(c.last_contacted_date).getTime()) / 86400000)
                : null;
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: isOverdue ? "#f43f5e" : "#22c55e" }}>
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm" style={{ color: "#111827" }}>{c.name}</span>
                    {c.job_title && <span className="text-xs ml-2" style={{ color: "#9ca3af" }}>{c.job_title}</span>}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: isOverdue ? "#f59e0b" : "#16a34a" }}>
                    {isOverdue ? `⚠ ${daysSince || "?"}d — reach out` : "✓ Active"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-8 mt-6">
            {[
              { num: contacts.length, label: "emails sent" },
              { num: overdueContacts.length, label: "overdue", color: "#f43f5e" },
              { num: healthyContacts.length, label: "active relationships", color: "#22c55e" },
            ].map(s => (
              <div key={s.label}>
                <p className="font-extrabold text-2xl" style={{ color: s.color || "#111827" }}>{s.num}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: "#9ca3af" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {overdueContacts.length > 0 && (
            <div className="mt-6 pl-5" style={{ borderLeft: "2px solid rgba(99,102,241,0.3)" }}>
              <p className="text-sm leading-relaxed font-medium italic" style={{ color: "#6b7280" }}>
                "Two of your priority contacts are overdue and directly tied to your
                investment goal. A 10-minute email this week could meaningfully move
                the needle. Don't let these relationships go cold."
              </p>
            </div>
          )}
        </div>

        <div className="h-px my-10" style={{ backgroundColor: "#e5e7eb" }} />

        {/* CLOSING + APPROVE */}
        <div className="mt-12 mb-12">
          <p className="text-base leading-[1.8] italic" style={{ color: "#374151" }}>
            {monthName} was a chapter worth keeping. You're moving in the right direction —
            the numbers show it. Approve this review to save it to your records,
            and let's make {format(new Date(), "MMMM")} even better.
          </p>
        </div>

        {isReadOnly ? (
          <div className="text-center pb-12">
            <p className="text-sm font-semibold" style={{ color: "#16a34a" }}>
              ✓ Approved on {savedReview?.review_date ? format(new Date(savedReview.review_date), "MMMM d, yyyy") : "—"}
            </p>
            <button
              onClick={() => navigate("/settings?tab=archived")}
              className="text-sm mt-3 cursor-pointer"
              style={{ color: "#6366f1" }}
            >
              ← Back to Archive
            </button>
          </div>
        ) : (
          <div className="text-center pb-12">
            <button
              onClick={handleApprove}
              disabled={saving || approved}
              className="w-full max-w-[400px] mx-auto block py-5 px-8 font-semibold text-base rounded-[16px] text-white transition-all cursor-pointer"
              style={{
                backgroundColor: approved ? "#16a34a" : "#111827",
                letterSpacing: "-0.01em",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                if (!approved) {
                  e.currentTarget.style.backgroundColor = "#1f2937";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (!approved) {
                  e.currentTarget.style.backgroundColor = "#111827";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {approved ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> {monthName} Approved
                </span>
              ) : saving ? (
                "Saving..."
              ) : (
                <>
                  Approve {monthName} Review
                  <div className="w-[60%] h-px mx-auto mt-2" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
                </>
              )}
            </button>
            <p className="text-xs mt-3" style={{ color: "#9ca3af" }}>
              This saves your review to your personal archive.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
