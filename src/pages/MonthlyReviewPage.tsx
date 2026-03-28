import { useState, useEffect, useRef, useMemo } from "react";
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
import { format } from "date-fns";
import AppShell from "@/components/AppShell";

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
  const forceReview = searchParams.get("review") === "1";
  const { user, profile } = useAuth();
  const { data: finances } = useUserFinances();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: contacts = [] } = useContacts();
  const { data: expenses = [] } = useExpenses();
  const upsertPrefs = useUpsertPreferences();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  // Fetch saved review if viewing read-only
  const { data: savedReview } = useQuery({
    queryKey: ["monthly_review", reviewId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("monthly_reviews")
        .select("*")
        .eq("id", reviewId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!reviewId,
  });

  const isReadOnly = !!reviewId && !!savedReview;

  // Scroll tracking
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollProgress(Math.min(100, Math.max(0, pct * 100)));
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const now = new Date();
  const monthName = format(now, "MMMM");
  const year = format(now, "yyyy");
  const reviewMonth = `${monthName} ${year}`;

  // Stats
  const netWorth = Number(finances?.current_savings || 45234);
  const savedAmount = 1300;
  const spentAmount = SPENDING_CATEGORIES.reduce((s, c) => s + c.amount, 0);
  const creditScore = 785;
  const totalSpending = SPENDING_CATEGORIES.reduce((s, c) => s + c.amount, 0);

  const activeGoals = projects.filter(p => !p.archived && p.type === "goal").map(p => {
    const pt = tasks.filter(t => t.project_id === p.id);
    const done = pt.filter(t => t.status === "done").length;
    const total = pt.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...p, pct, done, total };
  });

  const overdueContacts = useMemo(() => {
    const nowMs = Date.now();
    return contacts.filter(c => {
      if (!c.last_contacted_date) return true;
      const daysSince = Math.floor((nowMs - new Date(c.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > (c.contact_frequency_days || 30);
    });
  }, [contacts]);

  const healthyContacts = useMemo(() => {
    const nowMs = Date.now();
    return contacts.filter(c => {
      if (!c.last_contacted_date) return false;
      const daysSince = Math.floor((nowMs - new Date(c.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince <= (c.contact_frequency_days || 30);
    });
  }, [contacts]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const snapshot = {
        netWorth, savedAmount, spentAmount, creditScore,
        goals: activeGoals.map(g => ({ name: g.name, pct: g.pct })),
        overdueContacts: overdueContacts.length,
        healthyContacts: healthyContacts.length,
        spending: SPENDING_CATEGORIES,
      };
      const aiSummary = `${monthName} was a strong month financially. Your net worth is $${netWorth.toLocaleString()}, with consistent savings of $${savedAmount.toLocaleString()}. You have ${overdueContacts.length} overdue follow-ups and ${activeGoals.length} active goals.`;

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
      toast.success(`${monthName} review saved`);
      navigate("/dashboard");
    } catch {
      toast.error("Failed to save review");
    }
    setSaving(false);
  };

  return (
    <AppShell>
      <div ref={scrollRef} className="min-h-screen overflow-auto" style={{ background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)" }}>
        {/* Sticky Progress Bar */}
        <div className="sticky top-0 z-50 px-6 py-3 flex items-center gap-4" style={{ background: "white", borderBottom: "1px solid #f3f4f6" }}>
          <button onClick={() => navigate(isReadOnly ? "/settings?tab=archived" : "/dashboard")} className="text-sm font-semibold flex items-center gap-1" style={{ color: "#6366f1" }}>
            <ArrowLeft className="w-4 h-4" />
            {isReadOnly ? "Back to Archive" : "Back to Dashboard"}
          </button>
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "#f3f4f6" }}>
            <div className="h-full rounded-full transition-all" style={{ background: "#6366f1", width: `${scrollProgress}%` }} />
          </div>
          <span className="text-sm font-bold whitespace-nowrap" style={{ color: "#111827" }}>
            {isReadOnly && <Check className="w-4 h-4 inline mr-1" style={{ color: "#22c55e" }} />}
            {reviewMonth} Review{isReadOnly ? " — Saved" : ""}
          </span>
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm font-semibold rounded-[10px] text-white"
              style={{ background: "#6366f1" }}
            >
              {saving ? "Saving..." : "Save Review"}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-w-[860px] mx-auto px-6 py-8">
          {/* Section 1: Finances */}
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="font-extrabold text-5xl tracking-tighter" style={{ color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{monthName}</h1>
              <h1 className="font-extrabold text-5xl tracking-tighter" style={{ color: "#6366f1", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{year}</h1>
            </div>
            <p className="text-lg mt-2" style={{ color: "#6b7280" }}>Your monthly financial snapshot.</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: "NET WORTH", value: `$${netWorth.toLocaleString()}`, change: "↑ $2,341", changeColor: "#22c55e" },
                { label: "SAVED", value: `$${savedAmount.toLocaleString()}`, change: "↑ 9% above target", changeColor: "#22c55e" },
                { label: "SPENT", value: `$${spentAmount.toLocaleString()}`, change: "⚠ Entertainment over", changeColor: "#f59e0b" },
                { label: "CREDIT", value: String(creditScore), change: "↑ 12 pts", changeColor: "#22c55e" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-[20px] p-5 shadow-sm"
                  style={{ background: "white", border: "1px solid #f0f0f5" }}
                >
                  <p className="font-extrabold text-3xl tracking-tighter" style={{ color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{stat.value}</p>
                  <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "#9ca3af" }}>{stat.label}</p>
                  <p className="text-xs font-medium mt-2" style={{ color: stat.changeColor }}>{stat.change}</p>
                </motion.div>
              ))}
            </div>

            {/* Spending Bar */}
            <div className="mt-6">
              <div className="w-full h-4 rounded-full overflow-hidden flex" style={{ background: "#f3f4f6" }}>
                {SPENDING_CATEGORIES.map(cat => (
                  <div key={cat.name} style={{ width: `${(cat.amount / totalSpending) * 100}%`, background: cat.color }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {SPENDING_CATEGORIES.map(cat => (
                  <div key={cat.name} className="flex items-center gap-1.5 text-xs" style={{ color: "#6b7280" }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                    {cat.name} · ${cat.amount}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            <div className="mt-6 rounded-[20px] p-5" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#6366f1" }}>✦ AI Summary</p>
              <p className="text-sm leading-relaxed mt-2" style={{ color: "#374151" }}>
                {monthName} was a strong month financially. Your net worth grew by $2,341,
                driven by consistent savings of ${savedAmount.toLocaleString()}. Entertainment spending needs
                attention — you hit 93% of budget. Your credit score improved 12 points.
                Keep this trajectory and you'll reach your goals ahead of schedule.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="my-10 h-px" style={{ background: "linear-gradient(to right, transparent, #e5e7eb, transparent)" }} />

          {/* Section 2: Goals */}
          <div>
            <h2 className="font-extrabold text-3xl" style={{ color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Goals</h2>
            <div className="space-y-4 mt-4">
              {activeGoals.length === 0 ? (
                <p className="text-sm" style={{ color: "#9ca3af" }}>No active goals this month.</p>
              ) : activeGoals.map(goal => (
                <div key={goal.id} className="rounded-[20px] p-5 shadow-sm" style={{ background: "white", border: "1px solid #f0f0f5" }}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg" style={{ color: "#111827" }}>{goal.name}</h3>
                    <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: "#eef2ff", color: "#6366f1" }}>{goal.pct}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full mt-3 overflow-hidden" style={{ background: "#f3f4f6" }}>
                    <div className="h-full rounded-full transition-all" style={{ background: goal.pct >= 70 ? "#22c55e" : goal.pct >= 40 ? "#f59e0b" : "#6366f1", width: `${goal.pct}%` }} />
                  </div>
                  <p className="text-xs mt-2" style={{ color: "#6b7280" }}>{goal.done} of {goal.total} tasks completed</p>
                  <p className="text-xs font-medium mt-2 italic" style={{ color: "#6366f1" }}>
                    {goal.pct < 50 ? "Consider breaking remaining tasks into smaller steps to build momentum." : "Great progress — you're on track to complete this goal."}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="my-10 h-px" style={{ background: "linear-gradient(to right, transparent, #e5e7eb, transparent)" }} />

          {/* Section 3: Relationships */}
          <div>
            <h2 className="font-extrabold text-3xl" style={{ color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Relationships</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Priority contacts */}
              <div className="space-y-2">
                {contacts.slice(0, 6).map(c => {
                  const isOverdue = overdueContacts.some(o => o.id === c.id);
                  const daysSince = c.last_contacted_date
                    ? Math.floor((Date.now() - new Date(c.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-[12px] px-3 py-2"
                      style={{ background: isOverdue ? "#fff1f2" : "#f0fdf4" }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: isOverdue ? "#f43f5e" : "#22c55e" }}>
                        {c.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium flex-1" style={{ color: "#111827" }}>{c.name}</span>
                      {daysSince !== null && (
                        <span className="text-xs" style={{ color: isOverdue ? "#f43f5e" : "#22c55e" }}>{daysSince}d ago</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick stats */}
              <div className="rounded-[20px] p-5 shadow-sm" style={{ background: "white", border: "1px solid #f0f0f5" }}>
                <p className="font-extrabold text-3xl" style={{ color: "#6366f1" }}>{contacts.length}</p>
                <p className="text-sm" style={{ color: "#6b7280" }}>total contacts</p>
                <p className="font-extrabold text-3xl mt-3" style={{ color: "#f43f5e" }}>{overdueContacts.length}</p>
                <p className="text-sm" style={{ color: "#6b7280" }}>overdue follow-ups</p>
                <p className="font-extrabold text-3xl mt-3" style={{ color: "#22c55e" }}>{healthyContacts.length}</p>
                <p className="text-sm" style={{ color: "#6b7280" }}>active relationships</p>
              </div>
            </div>

            {/* AI insight */}
            {overdueContacts.length > 0 && (
              <div className="mt-4 rounded-[20px] p-5" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#6366f1" }}>✦ AI Insight</p>
                <p className="text-sm leading-relaxed mt-2" style={{ color: "#374151" }}>
                  {overdueContacts.slice(0, 2).map(c => c.name).join(" and ")} {overdueContacts.length > 1 ? "are" : "is"} overdue for follow-up.
                  Reaching out this week could strengthen these relationships and support your active goals.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          {!isReadOnly && (
            <div className="mt-10 flex gap-3 justify-center pb-12">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 font-semibold rounded-[14px] text-white"
                style={{ background: "#6366f1" }}
              >
                {saving ? "Saving..." : "Save This Review"}
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-3 font-semibold rounded-[14px]"
                style={{ background: "white", border: "1px solid #e5e7eb", color: "#374151" }}
              >
                Remind Me Later
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
