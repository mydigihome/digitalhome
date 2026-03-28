import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, TrendingUp, AlertTriangle, Flag, Calendar, CreditCard, Sparkles,
} from "lucide-react";

interface InsightItem {
  type: "urgent" | "warning" | "positive" | "goal" | "bill" | "credit";
  icon: React.ReactNode;
  circleBg: string;
  text: string;
  actionLabel: string;
  route: string;
}

interface AIInsightsWidgetProps {
  goals: Array<{ id: string; name: string; done: number; total: number }>;
  expenses: Array<{ description: string; amount: number; frequency: string }>;
  contacts: Array<{ name: string; last_contacted_date: string | null; contact_frequency_days: number | null }>;
}

export default function AIInsightsWidget({ goals, expenses, contacts }: AIInsightsWidgetProps) {
  const navigate = useNavigate();

  const insights = useMemo<InsightItem[]>(() => {
    const result: InsightItem[] = [];
    const now = Date.now();

    // Overdue contacts
    for (const c of contacts.slice(0, 10)) {
      if (c.last_contacted_date) {
        const daysSince = Math.floor((now - new Date(c.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24));
        const freq = c.contact_frequency_days || 30;
        if (daysSince > freq) {
          result.push({
            type: "urgent",
            icon: <Users className="w-4 h-4" style={{ color: "#f43f5e" }} />,
            circleBg: "#fff1f2",
            text: `You haven't contacted ${c.name} in ${daysSince} days. Consider reaching out soon.`,
            actionLabel: "Contact now →",
            route: "/relationships",
          });
          break;
        }
      }
    }

    // Spending alert (mock)
    const recurringTotal = expenses.filter(e => e.frequency === "monthly").reduce((s, e) => s + e.amount, 0);
    if (recurringTotal > 0) {
      result.push({
        type: "warning",
        icon: <AlertTriangle className="w-4 h-4" style={{ color: "#f59e0b" }} />,
        circleBg: "#fffbeb",
        text: `You have $${recurringTotal.toLocaleString()} in monthly recurring expenses. Review for optimization opportunities.`,
        actionLabel: "View spending →",
        route: "/finance/wealth",
      });
    }

    // Net worth positive (mock)
    result.push({
      type: "positive",
      icon: <TrendingUp className="w-4 h-4" style={{ color: "#22c55e" }} />,
      circleBg: "#f0fdf4",
      text: "Your net worth increased this month. You're building momentum — keep it going.",
      actionLabel: "View details →",
      route: "/finance/wealth",
    });

    // Goal progress
    for (const g of goals.slice(0, 2)) {
      if (g.total > 0) {
        const pct = Math.round((g.done / g.total) * 100);
        result.push({
          type: "goal",
          icon: <Flag className="w-4 h-4" style={{ color: "#6366f1" }} />,
          circleBg: "#eef2ff",
          text: `You're ${pct}% through "${g.name}". ${pct < 50 ? "Pick up the pace to stay on track." : "Great progress — keep it up!"}`,
          actionLabel: "View goal →",
          route: `/project/${g.id}`,
        });
      }
    }

    // Bills
    const topBill = expenses.filter(e => e.frequency === "monthly").sort((a, b) => b.amount - a.amount)[0];
    if (topBill) {
      result.push({
        type: "bill",
        icon: <Calendar className="w-4 h-4" style={{ color: "#f43f5e" }} />,
        circleBg: "#fff1f2",
        text: `${topBill.description} ($${topBill.amount.toLocaleString()}) is due soon. Make sure your account is funded.`,
        actionLabel: "View bills →",
        route: "/finance/wealth",
      });
    }

    // Credit (mock)
    result.push({
      type: "credit",
      icon: <CreditCard className="w-4 h-4" style={{ color: "#a855f7" }} />,
      circleBg: "#fdf4ff",
      text: "Your credit score is strong. Paying down high-interest debt could improve it further.",
      actionLabel: "View credit →",
      route: "/finance/wealth",
    });

    // Sort: urgent first, then warning, then rest
    const order = { urgent: 0, bill: 1, warning: 2, goal: 3, positive: 4, credit: 5 };
    return result.sort((a, b) => order[a.type] - order[b.type]).slice(0, 6);
  }, [goals, expenses, contacts]);

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[24px] p-6"
      style={{
        background: "#ffffff",
        boxShadow: "0 12px 40px rgba(70,69,84,0.06)",
        border: "1px solid #f0f0f5",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-lg" style={{ color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            AI Insights
          </h3>
          <Sparkles className="w-4 h-4" style={{ color: "#6366f1" }} />
        </div>
        <span className="text-[10px]" style={{ color: "#9ca3af" }}>Updated just now</span>
      </div>

      {/* List */}
      <div className="space-y-3 mt-4">
        {insights.map((insight, i) => (
          <button
            key={i}
            onClick={() => navigate(insight.route)}
            className="w-full flex items-start gap-3 p-3 rounded-[16px] text-left transition-colors"
            style={{ background: "#f9fafb", border: "1px solid #f3f4f6" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#f3f4f6")}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: insight.circleBg }}
            >
              {insight.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed" style={{ color: "#111827" }}>
                {insight.text}
              </p>
              <p className="text-xs font-bold mt-1 cursor-pointer" style={{ color: "#6366f1" }}>
                {insight.actionLabel}
              </p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
