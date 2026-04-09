import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
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
import confetti from "canvas-confetti";
import { usePremiumStatus } from "@/components/PremiumGate";

function fmtMoney(val: number | null | undefined): string {
  if (val === null || val === undefined) return "$0";
  return `$${val.toLocaleString()}`;
}

export default function MonthlyReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get("id");
  const readMode = searchParams.get("mode") === "read";
  const { user, profile } = useAuth();
  const { isPremium } = usePremiumStatus();
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

  const isReadOnly = !!reviewId || readMode;
  const now = new Date();
  const monthName = format(now, "MMMM");
  const year = format(now, "yyyy");
  const reviewMonth = `${monthName} ${year}`;
  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  // Real values from user_finances
  const fin = finances as any;
  const netWorth = fin?.net_worth ?? 0;
  const creditScore = fin?.credit_score ?? 0;
  const savingsRate = fin?.savings_rate ?? 0;

  // Group expenses by category for current month
  const spendingBreakdown = useMemo(() => {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.expense_date);
      return d >= firstDay && d <= lastDay;
    });
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach(e => {
      const cat = e.category || "Other";
      byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount);
    });
    const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#f43f5e", "#e5e7eb", "#3b82f6", "#8b5cf6"];
    return Object.entries(byCategory)
      .map(([name, amount], i) => ({ name, amount, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, now]);

  const totalSpending = spendingBreakdown.reduce((s, c) => s + c.amount, 0);

  const activeGoals = projects.filter(p => !p.archived && p.type === "goal").map(p => {
    const pt = tasks.filter(t => t.project_id === p.id);
    const done = pt.filter(t => t.status === "done").length;
    const total = pt.length;
    return { ...p, pct: total > 0 ? Math.round((done / total) * 100) : 0, done, total };
  });

  const overdueContacts = useMemo(() => {
    const nowMs = Date.now();
    return contacts.filter(c => {
      if (!c.last_contacted_date) return true;
      const d = Math.floor((nowMs - new Date(c.last_contacted_date).getTime()) / 86400000);
      return d > (c.contact_frequency_days || 30);
    });
  }, [contacts]);

  const healthyContacts = useMemo(() => {
    const nowMs = Date.now();
    return contacts.filter(c => {
      if (!c.last_contacted_date) return false;
      const d = Math.floor((nowMs - new Date(c.last_contacted_date).getTime()) / 86400000);
      return d <= (c.contact_frequency_days || 30);
    });
  }, [contacts]);

  if (!isPremium) {
    navigate("/settings?tab=billing", { replace: true });
    return null;
  }

  const topSpendingCategory = spendingBreakdown.length > 0 ? spendingBreakdown[0].name : "None";

  const handleApprove = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const snapshot = {
        netWorth, totalSpending, creditScore, savingsRate,
        goals: activeGoals.map(g => ({ name: g.name, pct: g.pct })),
        overdueContacts: overdueContacts.length,
        healthyContacts: healthyContacts.length,
        spending: spendingBreakdown,
      };
      const aiSummary = netWorth > 0
        ? `${monthName} review: Net worth ${fmtMoney(netWorth)}, spent ${fmtMoney(totalSpending)}, credit score ${creditScore || 'N/A'}.`
        : `${monthName} review: ${totalSpending > 0 ? `Spent ${fmtMoney(totalSpending)}` : 'No financial data recorded yet'}.`;

      const { error } = await (supabase as any).from("monthly_reviews").upsert({
        user_id: user.id,
        review_month: reviewMonth,
        month: currentMonth,
        year: currentYear,
        net_worth: netWorth,
        top_spending_category: topSpendingCategory,
        goals_progress: activeGoals.length > 0 ? Math.round(activeGoals.reduce((s, g) => s + g.pct, 0) / activeGoals.length) : 0,
        contacts_reached: healthyContacts.length,
        bills_paid: expenses.filter(e => e.frequency === "monthly").length,
        credit_score: creditScore || null,
        ai_summary: aiSummary,
        full_snapshot: snapshot,
        review_data: snapshot,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,month,year" });

      if (error) {
        console.error("Save error:", error);
        toast.error("Failed to save review: " + error.message);
        setSaving(false);
        return;
      }

      upsertPrefs.mutate({ last_review_month: reviewMonth } as any);
      setApproved(true);
      toast.success("Review saved");
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.8 }, colors: ["#6366f1", "#22c55e", "#f59e0b"] });
      setTimeout(() => navigate("/settings?tab=archive"), 2000);
    } catch (err: any) {
      console.error("Approve error:", err);
      toast.error("Failed to save review");
    }
    setSaving(false);
  };

  const avatarColors: Record<string, { bg: string; text: string }> = {
    professional: { bg: "#e1e0ff", text: "#4f46e5" },
    family: { bg: "#ffe4e6", text: "#be123c" },
    friend: { bg: "#dcfce7", text: "#16a34a" },
  };

  const sectionLabel = (text: string) => (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#9ca3af", textTransform: "uppercase" as const, marginBottom: 32 }}>{text}</p>
  );

  const divider = <div style={{ height: 1, background: "linear-gradient(to right, transparent, #e5e7eb, transparent)", margin: "56px 0" }} />;

  const stats = [
    { value: fmtMoney(netWorth), label: "NET WORTH", change: netWorth > 0 ? "From your finances" : "Not yet recorded", pill: { bg: netWorth > 0 ? "#f0fdf4" : "#f3f4f6", color: netWorth > 0 ? "#16a34a" : "#6b7280" } },
    { value: savingsRate ? `${savingsRate}%` : "\u2014", label: "SAVINGS RATE", change: savingsRate > 0 ? "From your finances" : "Not yet recorded", pill: { bg: savingsRate > 0 ? "#f0fdf4" : "#f3f4f6", color: savingsRate > 0 ? "#16a34a" : "#6b7280" } },
    { value: fmtMoney(totalSpending), label: "SPENT", change: totalSpending > 0 ? `${spendingBreakdown.length} categories` : "No expenses this month", pill: { bg: totalSpending > 0 ? "#fffbeb" : "#f3f4f6", color: totalSpending > 0 ? "#b45309" : "#6b7280" } },
    { value: creditScore ? String(creditScore) : "\u2014", label: "CREDIT SCORE", change: creditScore > 0 ? "From your finances" : "Not yet recorded", pill: { bg: creditScore > 0 ? "#f0fdf4" : "#f3f4f6", color: creditScore > 0 ? "#16a34a" : "#6b7280" } },
  ];

  return (
    <div style={{ background: "#fafaf8", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 64 }}>
          <button onClick={() => navigate("/")} style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
            ← Back
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
            {monthName} {year}
          </span>
          <span style={{ width: 40 }} />
        </div>

        <div>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "block" }}>{monthName}</span>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: "#6366f1", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "block" }}>{year}.</span>
        </div>

        <p style={{ marginTop: 32, fontSize: 17, color: "#374151", lineHeight: 1.8, maxWidth: 560 }}>
          Hey {firstName}, let's talk about your {monthName}.
          {netWorth > 0 || totalSpending > 0 ? (
            <><br /><br />Here's a snapshot of your real financial data this month.</>
          ) : (
            <><br /><br />Start tracking your finances and expenses to see real data here.</>
          )}
        </p>

        {divider}

        {sectionLabel("01 \u2014 MONEY")}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 48 }}>
          {stats.map(s => (
            <div key={s.label}>
              <p style={{ fontSize: 48, fontWeight: 800, color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#9ca3af", textTransform: "uppercase" as const, marginTop: 8 }}>{s.label}</p>
              <span style={{ display: "inline-flex", alignItems: "center", marginTop: 8, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.pill.bg, color: s.pill.color }}>
                {s.change}
              </span>
            </div>
          ))}
        </div>

        {/* Spending breakdown */}
        {spendingBreakdown.length > 0 && (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Spending breakdown</p>
            {spendingBreakdown.map((cat, i) => (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "#374151", flex: 1 }}>{cat.name}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{fmtMoney(cat.amount)}</span>
              </div>
            ))}
          </>
        )}

        {divider}

        {sectionLabel("02 \u2014 GOALS")}

        {activeGoals.length === 0 ? (
          <p style={{ fontSize: 15, color: "#9ca3af" }}>No active goals this month.</p>
        ) : activeGoals.map(goal => (
          <div key={goal.id} style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{goal.name}</p>
            <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, margin: "12px 0", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.pct}%` }}
                transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                style={{ height: "100%", background: "#6366f1", borderRadius: 99 }}
              />
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>{goal.done}/{goal.total} tasks completed ({goal.pct}%)</p>
          </div>
        ))}

        {divider}

        {sectionLabel("03 \u2014 RELATIONSHIPS")}

        <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, marginBottom: 28 }}>
          Your network is part of your net worth. Here's where your key relationships stand.
        </p>

        {contacts.slice(0, 5).map((c, i) => {
          const type = c.relationship_type || "professional";
          const colors = avatarColors[type] || avatarColors.professional;
          const daysSince = c.last_contacted_date
            ? Math.floor((Date.now() - new Date(c.last_contacted_date).getTime()) / 86400000)
            : 999;
          const isOverdue = daysSince > (c.contact_frequency_days || 30);
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.bg, color: colors.text, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {c.name.charAt(0)}
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{c.name}</span>
              <span style={{ fontSize: 13, color: "#9ca3af", marginLeft: 4 }}>{c.title || c.company || type}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: isOverdue ? "#f59e0b" : "#16a34a" }}>
                {isOverdue ? `${daysSince}d ago` : "Active"}
              </span>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 40, marginTop: 28, marginBottom: 28 }}>
          {[
            { num: String(healthyContacts.length), label: "ACTIVE", color: "#111827" },
            { num: String(overdueContacts.length), label: "OVERDUE", color: overdueContacts.length > 0 ? "#f43f5e" : "#111827" },
            { num: String(contacts.length), label: "TOTAL", color: "#111827" },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: 36, fontWeight: 800, color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.num}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {divider}

        <p style={{ fontSize: 17, color: "#374151", lineHeight: 1.8, marginBottom: 56, fontStyle: "italic" }}>
          {monthName} is in the books. When you're ready, approve this review to save it to your records.
        </p>

        {!isReadOnly && (
          <div style={{ paddingBottom: 120 }}>
            <button
              onClick={handleApprove}
              disabled={saving || approved}
              style={{
                display: "block",
                width: "100%",
                maxWidth: 400,
                margin: "0 auto",
                background: approved ? "#16a34a" : "#111827",
                color: "white",
                border: "none",
                borderRadius: 16,
                padding: "20px 32px",
                cursor: saving ? "wait" : "pointer",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                transition: "all 200ms ease",
                textAlign: "center" as const,
                position: "relative" as const,
              }}
              onMouseEnter={e => { if (!approved) (e.currentTarget.style.background = "#1f2937"); (e.currentTarget.style.transform = "translateY(-2px)"); (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"); }}
              onMouseLeave={e => { if (!approved) (e.currentTarget.style.background = "#111827"); (e.currentTarget.style.transform = "translateY(0)"); (e.currentTarget.style.boxShadow = "none"); }}
            >
              {saving ? "Saving..." : approved ? ` ${monthName} Approved` : `Approve ${monthName} Review`}
              <div style={{ width: "40%", height: 1, background: "rgba(255,255,255,0.25)", margin: "10px auto 0" }} />
            </button>
            <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>
              This saves your review to your personal archive.
            </p>
          </div>
        )}

        {isReadOnly && (
          <div style={{ paddingBottom: 120, textAlign: "center" }}>
            <button
              onClick={() => navigate("/")}
              style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
