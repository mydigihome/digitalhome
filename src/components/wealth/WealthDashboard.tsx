import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, CreditCard, TrendingUp, PiggyBank, Quote, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useExpenses } from "@/hooks/useExpenses";
import { useLoans } from "@/hooks/useLoans";
import { useWealthGoals } from "@/hooks/useWealthGoals";
import { getRandomQuote } from "./quotes";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const PIE_COLORS = [
  "hsl(258, 89%, 66%)", "hsl(263, 70%, 50%)", "hsl(206, 52%, 55%)",
  "hsl(168, 80%, 27%)", "hsl(36, 100%, 57%)", "hsl(0, 65%, 55%)", "hsl(320, 60%, 50%)",
];

export default function WealthDashboard() {
  const { profile } = useAuth();
  const { data: finances } = useUserFinances();
  const { data: expenses } = useExpenses();
  const { data: loans } = useLoans();
  const { data: goals } = useWealthGoals();

  const [quote, setQuote] = useState(() => getRandomQuote());
  const [extraPayment, setExtraPayment] = useState(0);

  const firstName = profile?.full_name?.split(" ")[0] || "Friend";

  const totalExpenses = useMemo(() => (expenses || []).reduce((s, e) => s + Number(e.amount), 0), [expenses]);
  const monthlyIncome = finances?.monthly_income || 0;
  const netMonthly = monthlyIncome - totalExpenses;
  const totalDebt = finances?.total_debt || 0;
  const creditScore = finances?.credit_score;
  const savingsGoal = finances?.savings_goal || 0;
  const currentSavings = finances?.current_savings || 0;
  const savingsPercent = savingsGoal > 0 ? Math.min(100, Math.round((currentSavings / savingsGoal) * 100)) : 0;

  const expenseChart = useMemo(() => {
    const byCategory: Record<string, number> = {};
    (expenses || []).forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Debt-free calculator
  const monthlyDebtPayment = useMemo(() => (loans || []).reduce((s, l) => s + Number(l.monthly_payment), 0), [loans]);
  const totalLoanDebt = useMemo(() => (loans || []).reduce((s, l) => s + Number(l.amount), 0), [loans]);
  const combinedDebt = totalDebt + totalLoanDebt;
  const effectivePayment = monthlyDebtPayment + extraPayment;
  const monthsToDebtFree = effectivePayment > 0 ? Math.ceil(combinedDebt / effectivePayment) : Infinity;
  const debtFreeDate = useMemo(() => {
    if (monthsToDebtFree === Infinity) return "Never";
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToDebtFree);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [monthsToDebtFree]);

  const creditColor = !creditScore ? "hsl(var(--muted-foreground))" : creditScore >= 670 ? "hsl(var(--success))" : creditScore >= 580 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const creditLabel = !creditScore ? "N/A" : creditScore >= 670 ? "Good" : creditScore >= 580 ? "Fair" : "Poor";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header with Quote */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/20 rounded-3xl p-6 border border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{firstName}'s Financial Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Step 2 of 3 — Your Financial Overview</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setQuote(getRandomQuote())} className="rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-4 flex items-start gap-2 text-sm">
          <Quote className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="italic text-foreground">"{quote.text}"</span>
            <span className="text-muted-foreground ml-1">— {quote.author}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<TrendingUp className="w-4 h-4" />} label="Monthly Income" value={`$${monthlyIncome.toLocaleString()}`} bgClass="bg-success/10" textClass="text-success" />
        <SummaryCard icon={<DollarSign className="w-4 h-4" />} label="Monthly Expenses" value={`$${totalExpenses.toLocaleString()}`} bgClass="bg-destructive/10" textClass="text-destructive" />
        <SummaryCard icon={<PiggyBank className="w-4 h-4" />} label="Net Monthly" value={`$${netMonthly.toLocaleString()}`} bgClass={netMonthly >= 0 ? "bg-primary/10" : "bg-destructive/10"} textClass={netMonthly >= 0 ? "text-primary" : "text-destructive"} />
        <SummaryCard icon={<CreditCard className="w-4 h-4" />} label="Total Debt" value={`$${combinedDebt.toLocaleString()}`} bgClass="bg-warning/10" textClass="text-warning" />
      </div>

      {/* Credit Score + Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Credit Score */}
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Credit Score</h3>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 200 120" className="w-48">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
              {creditScore && (
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={creditColor} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${(((creditScore - 300) / 550) * 251.3)} 251.3`}
                  style={{ transition: "stroke-dasharray 0.8s ease" }} />
              )}
              <text x="100" y="85" textAnchor="middle" className="fill-foreground" fontSize="28" fontWeight="700">{creditScore || "—"}</text>
              <text x="100" y="105" textAnchor="middle" fontSize="12" fill={creditColor} fontWeight="600">{creditLabel}</text>
            </svg>
          </div>
        </div>

        {/* Savings Progress */}
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Savings Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">${currentSavings.toLocaleString()} saved</span>
              <span className="font-medium text-foreground">${savingsGoal.toLocaleString()} goal</span>
            </div>
            <Progress value={savingsPercent} className="h-3" />
            <p className="text-sm text-primary font-medium">You're {savingsPercent}% of the way there!</p>
            {savingsGoal > currentSavings && monthlyIncome > totalExpenses && (
              <p className="text-xs text-muted-foreground">
                At your current surplus of ${netMonthly.toLocaleString()}/mo, you could reach your goal in ~{Math.ceil((savingsGoal - currentSavings) / Math.max(1, netMonthly))} months.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Spending Breakdown */}
      {expenseChart.length > 0 && (
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Spending Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {expenseChart.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Debt-Free Calculator */}
      {combinedDebt > 0 && (
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Debt-Free Calculator</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you pay an extra <span className="font-semibold text-foreground">${extraPayment}/mo</span> beyond your current ${monthlyDebtPayment.toLocaleString()}/mo, you'll be debt-free by:
          </p>
          <p className="text-2xl font-bold text-primary mb-4">{debtFreeDate}</p>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Extra monthly payment: ${extraPayment}</Label>
            <Slider
              value={[extraPayment]}
              onValueChange={v => setExtraPayment(v[0])}
              min={0}
              max={2000}
              step={50}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Student Loans Detail */}
      {(loans || []).length > 0 && (
        <div className="bg-card rounded-3xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Student Loans</h3>
          <div className="space-y-3">
            {loans!.map(loan => (
              <div key={loan.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{loan.provider_name || "Loan"}</p>
                  <p className="text-xs text-muted-foreground">{loan.interest_rate}% interest · ${Number(loan.monthly_payment).toLocaleString()}/mo</p>
                </div>
                <p className="text-sm font-bold text-foreground">${Number(loan.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SummaryCard({ icon, label, value, bgClass, textClass }: { icon: React.ReactNode; label: string; value: string; bgClass: string; textClass: string }) {
  return (
    <div className="bg-card rounded-3xl border border-border p-4">
      <div className={`inline-flex p-2 rounded-xl ${bgClass} ${textClass} mb-2`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${textClass}`}>{value}</p>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
