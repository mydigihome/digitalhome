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

const SPENDING = [
  { name: "Housing", color: "#6366f1", amount: 2250 },
  { name: "Food", color: "#22c55e", amount: 680 },
  { name: "Transport", color: "#f59e0b", amount: 420 },
  { name: "Entertainment", color: "#f43f5e", amount: 380 },
  { name: "Other", color: "#e5e7eb", amount: 470 },
];

const MOCK_CONTACTS = [
  { name: "Sarah Johnson", role: "Investment Advisor", type: "professional", overdue: true, days: 14 },
  { name: "Robert Kim", role: "Mortgage Broker", type: "professional", overdue: true, days: 21 },
  { name: "Mom", role: "Family", type: "family", overdue: false, days: 3 },
  { name: "Alex Rivera", role: "Digi Home", type: "friend", overdue: false, days: 5 },
  { name: "David Park", role: "CPA", type: "professional", overdue: false, days: 8 },
];

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

  const netWorth = 45234;
  const savedAmount = 1300;
  const creditScore = 785;
  const totalSpending = SPENDING.reduce((s, c) => s + c.amount, 0);

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

  // Redirect non-premium users to billing
  if (!isPremium) {
    navigate("/settings?tab=billing", { replace: true });
    return null;
  }

  const handleApprove = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const snapshot = {
        netWorth, savedAmount, totalSpending, creditScore,
        goals: activeGoals.map(g => ({ name: g.name, pct: g.pct })),
        overdueContacts: overdueContacts.length,
        healthyContacts: healthyContacts.length,
        spending: SPENDING,
      };
      const aiSummary = `${monthName} was a solid month. Net worth up $2,341, savings rate 29%, credit score up 12 points.`;
      await (supabase as any).from("monthly_reviews").upsert({
        user_id: user.id,
        review_month: reviewMonth,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        net_worth: netWorth,
        top_spending_category: "Housing",
        goals_progress: activeGoals.length > 0 ? Math.round(activeGoals.reduce((s, g) => s + g.pct, 0) / activeGoals.length) : 0,
        contacts_reached: healthyContacts.length,
        bills_paid: expenses.filter(e => e.frequency === "monthly").length,
        credit_score: creditScore,
        ai_summary: aiSummary,
        full_snapshot: snapshot,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,review_month" });

      upsertPrefs.mutate({ last_review_month: reviewMonth } as any);
      setApproved(true);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.8 }, colors: ["#6366f1", "#22c55e", "#f59e0b"] });
      setTimeout(() => navigate("/"), 2000);
    } catch {
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
    { value: `$${netWorth.toLocaleString()}`, label: "NET WORTH", change: "↑ $2,341 this month", pill: { bg: "#f0fdf4", color: "#16a34a" } },
    { value: "29%", label: "SAVINGS RATE", change: "↑ 9% above target", pill: { bg: "#f0fdf4", color: "#16a34a" } },
    { value: `$${totalSpending.toLocaleString()}`, label: "SPENT", change: "⚠ Entertainment over budget", pill: { bg: "#fffbeb", color: "#b45309" } },
    { value: "785", label: "CREDIT SCORE", change: "↑ 12 pts", pill: { bg: "#f0fdf4", color: "#16a34a" } },
  ];

  const wins = [
    "Net worth up $2,341 — your best month this year.",
    "Savings rate at 29%, well above the 20% recommendation.",
    "Credit score up 12 points.",
    "All bills paid on time.",
  ];

  const workOns = [
    "Entertainment at 93% of budget — a $50 reduction goes a long way.",
    "Student loan payoff is 74 months out. An extra $100/month saves $12,400 in interest.",
    "Emergency fund at 59%. At $500/month you're fully funded in 11 months.",
  ];

  return (
    <div style={{ background: "#fafaf8", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Top nav */}
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

        {/* Opening */}
        <div>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "block" }}>{monthName}</span>
          <span style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: "#6366f1", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "block" }}>{year}.</span>
        </div>

        <p style={{ marginTop: 32, fontSize: 17, color: "#374151", lineHeight: 1.8, maxWidth: 560 }}>
          Hey {firstName}, let's talk about your {monthName}.
          <br /><br />
          Overall — solid. Your net worth grew, your savings rate stayed above target, and your credit score ticked up. There are a couple of things that need your attention, but nothing you can't handle. Let's walk through it.
        </p>

        {divider}

        {/* 01 — MONEY */}
        {sectionLabel("01 — MONEY")}

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

        {/* Wins */}
        <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>What went well</p>
        {wins.map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#f0fdf4", border: "1.5px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}></span>
            </div>
            <span style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>{w}</span>
          </div>
        ))}

        {/* Work ons */}
        <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16, marginTop: 32 }}>To work on</p>
        {workOns.map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fffbeb", border: "1.5px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>→</span>
            </div>
            <span style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>{w}</span>
          </div>
        ))}

        {/* CFP Insight */}
        <div style={{ paddingLeft: 20, borderLeft: "2px solid #e0e7ff", marginTop: 32, marginBottom: 8 }}>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.8, fontStyle: "italic" }}>
            You're building real momentum. The habits are there — now it's about optimizing. One move: automate $200 more per month into savings. You'll barely feel it. Your future self absolutely will.
          </p>
        </div>

        {divider}

        {/* 02 — GOALS */}
        {sectionLabel("02 — GOALS")}

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
            <p style={{ fontSize: 13, color: "#9ca3af" }}>${(goal.pct * 100).toLocaleString()} saved of $10,000 · On track for {Math.max(1, Math.round((100 - goal.pct) / 3.5))} months</p>
            <p style={{ fontSize: 14, color: "#374151", fontStyle: "italic", marginTop: 8 }}>
              {goal.pct < 50 ? "You're " + goal.pct + "% there. Stay consistent — this is closer than it feels." : "Great progress — you're on track to complete this goal."}
            </p>
          </div>
        ))}

        {divider}

        {/* 03 — RELATIONSHIPS */}
        {sectionLabel("03 — RELATIONSHIPS")}

        <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, marginBottom: 28 }}>
          Your network is part of your net worth. Here's where your key relationships stand.
        </p>

        {MOCK_CONTACTS.map((c, i) => {
          const colors = avatarColors[c.type] || avatarColors.professional;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.bg, color: colors.text, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {c.name.charAt(0)}
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{c.name}</span>
              <span style={{ fontSize: 13, color: "#9ca3af", marginLeft: 4 }}>{c.role}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: c.overdue ? "#f59e0b" : "#16a34a" }}>
                {c.overdue ? `⚠ ${c.days} days — reach out` : " Active"}
              </span>
            </div>
          );
        })}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 40, marginTop: 28, marginBottom: 28 }}>
          {[
            { num: "18", label: "EMAILS SENT", color: "#111827" },
            { num: "2", label: "OVERDUE", color: "#f43f5e" },
            { num: "5", label: "ACTIVE", color: "#111827" },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: 36, fontWeight: 800, color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.num}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* CFP note */}
        <div style={{ paddingLeft: 20, borderLeft: "2px solid #e0e7ff", marginBottom: 8 }}>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.8, fontStyle: "italic" }}>
            Two of your priority contacts are overdue and directly tied to your investment goal. A 10-minute email this week could meaningfully move the needle. Don't let these relationships go cold.
          </p>
        </div>

        {divider}

        {/* Closing */}
        <p style={{ fontSize: 17, color: "#374151", lineHeight: 1.8, marginBottom: 56, fontStyle: "italic" }}>
          {monthName} was a chapter worth keeping. You're moving in the right direction — the numbers show it. When you're ready, approve this review to save it to your records. Let's make {new Date(now.getFullYear(), now.getMonth() + 1).toLocaleString("default", { month: "long" })} even better.
        </p>

        {/* Approve Button */}
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
