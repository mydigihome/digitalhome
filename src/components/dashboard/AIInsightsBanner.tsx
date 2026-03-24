import { useMemo } from "react";
import { motion } from "framer-motion";
import { Lightbulb, TrendingDown, Calendar, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Insight {
  type: "warning" | "info" | "action";
  message: string;
  route?: string;
  icon: React.ReactNode;
}

interface AIInsightsBannerProps {
  goals: Array<{ id: string; name: string; done: number; total: number }>;
  expenses: Array<{ description: string; amount: number; frequency: string }>;
  contacts: Array<{ name: string; last_contacted_date: string | null; contact_frequency_days: number }>;
}

export default function AIInsightsBanner({ goals, expenses, contacts }: AIInsightsBannerProps) {
  const navigate = useNavigate();

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    // Check goal progress
    for (const goal of goals.slice(0, 3)) {
      if (goal.total > 0) {
        const progress = Math.round((goal.done / goal.total) * 100);
        if (progress < 50) {
          result.push({
            type: "warning",
            message: `You're ${100 - progress}% away from completing "${goal.name}"`,
            route: `/project/${goal.id}`,
            icon: <TrendingDown className="w-3.5 h-3.5" />,
          });
        }
      }
    }

    // Check upcoming bills (recurring expenses)
    const recurringBills = expenses.filter(e => e.frequency === "monthly" || e.frequency === "weekly");
    if (recurringBills.length > 0) {
      const topBill = recurringBills.sort((a, b) => b.amount - a.amount)[0];
      result.push({
        type: "info",
        message: `${topBill.description} ($${topBill.amount.toFixed(0)}) is due this month`,
        route: "/finance/wealth",
        icon: <Calendar className="w-3.5 h-3.5" />,
      });
    }

    // Check overdue contacts
    const now = Date.now();
    for (const contact of contacts.slice(0, 5)) {
      if (contact.last_contacted_date) {
        const daysSince = Math.floor((now - new Date(contact.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > contact.contact_frequency_days) {
          result.push({
            type: "action",
            message: `Reach out to ${contact.name} — no contact in ${daysSince} days`,
            route: "/relationships",
            icon: <Users className="w-3.5 h-3.5" />,
          });
          break; // Only show one contact reminder
        }
      }
    }

    return result.slice(0, 3);
  }, [goals, expenses, contacts]);

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-warning/30 bg-warning/5 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-warning/15 flex items-center justify-center">
          <Lightbulb className="w-3.5 h-3.5 text-warning" />
        </div>
        <h3 className="text-sm font-bold text-foreground">AI Insights</h3>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <button
            key={i}
            onClick={() => insight.route && navigate(insight.route)}
            className="w-full flex items-center gap-3 text-left group py-1.5"
          >
            <span className="text-warning/70">{insight.icon}</span>
            <span className="text-sm text-foreground/80 flex-1">{insight.message}</span>
            {insight.route && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
