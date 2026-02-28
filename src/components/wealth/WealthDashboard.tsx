import { useState, useMemo, useCallback } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
  DollarSign, CreditCard, TrendingUp, PiggyBank, Quote, RefreshCw,
  Settings2, Eye, EyeOff, GripVertical, RotateCcw, Save, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useExpenses } from "@/hooks/useExpenses";
import { useLoans } from "@/hooks/useLoans";
import { useWealthGoals } from "@/hooks/useWealthGoals";
import { useWealthLayout, useUpsertWealthLayout } from "@/hooks/useWealthLayout";
import { getRandomQuote } from "./quotes";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PIE_COLORS = [
  "hsl(258, 89%, 66%)", "hsl(263, 70%, 50%)", "hsl(206, 52%, 55%)",
  "hsl(168, 80%, 27%)", "hsl(36, 100%, 57%)", "hsl(0, 65%, 55%)", "hsl(320, 60%, 50%)",
];

/* ── Card registry ── */
const CARD_DEFS: { id: string; label: string }[] = [
  { id: "summary", label: "Summary Cards" },
  { id: "credit", label: "Credit Score" },
  { id: "savings", label: "Savings Progress" },
  { id: "spending", label: "Spending Breakdown" },
  { id: "debt-calc", label: "Debt-Free Calculator" },
  { id: "loans", label: "Student Loans" },
];

const DEFAULT_ORDER = CARD_DEFS.map(c => c.id);

export default function WealthDashboard() {
  const { profile } = useAuth();
  const { data: finances } = useUserFinances();
  const { data: expenses } = useExpenses();
  const { data: loans } = useLoans();
  const { data: goals } = useWealthGoals();
  const { data: layout } = useWealthLayout();
  const upsertLayout = useUpsertWealthLayout();

  const [quote, setQuote] = useState(() => getRandomQuote());
  const [extraPayment, setExtraPayment] = useState(0);
  const [customizing, setCustomizing] = useState(false);

  // Layout state (local while customizing)
  const savedOrder = layout?.card_order?.length ? (layout.card_order as string[]) : DEFAULT_ORDER;
  const savedHidden = layout?.hidden_cards?.length ? (layout.hidden_cards as string[]) : [];
  const [localOrder, setLocalOrder] = useState<string[]>(savedOrder);
  const [localHidden, setLocalHidden] = useState<string[]>(savedHidden);

  // Sync when layout loads
  const [synced, setSynced] = useState(false);
  if (layout && !synced) {
    if (layout.card_order?.length) setLocalOrder(layout.card_order as string[]);
    if (layout.hidden_cards) setLocalHidden(layout.hidden_cards as string[]);
    setSynced(true);
  }

  // Ensure all known card IDs are in localOrder (new cards added after save)
  const effectiveOrder = useMemo(() => {
    const existing = new Set(localOrder);
    const full = [...localOrder];
    DEFAULT_ORDER.forEach(id => { if (!existing.has(id)) full.push(id); });
    return full;
  }, [localOrder]);

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

  const toggleHidden = (id: string) => {
    setLocalHidden(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSaveLayout = async () => {
    try {
      await upsertLayout.mutateAsync({ hidden_cards: localHidden, card_order: localOrder });
      toast.success("Layout saved!");
      setCustomizing(false);
    } catch {
      toast.error("Failed to save layout");
    }
  };

  const handleReset = () => {
    setLocalOrder(DEFAULT_ORDER);
    setLocalHidden([]);
  };

  const isVisible = (id: string) => !localHidden.includes(id);

  /* ── Card renderers ── */
  const renderCard = (id: string) => {
    switch (id) {
      case "summary":
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard icon={<TrendingUp className="w-4 h-4" />} label="Monthly Income" value={`$${monthlyIncome.toLocaleString()}`} bgClass="bg-success/10" textClass="text-success" />
            <SummaryCard icon={<DollarSign className="w-4 h-4" />} label="Monthly Expenses" value={`$${totalExpenses.toLocaleString()}`} bgClass="bg-destructive/10" textClass="text-destructive" />
            <SummaryCard icon={<PiggyBank className="w-4 h-4" />} label="Net Monthly" value={`$${netMonthly.toLocaleString()}`} bgClass={netMonthly >= 0 ? "bg-primary/10" : "bg-destructive/10"} textClass={netMonthly >= 0 ? "text-primary" : "text-destructive"} />
            <SummaryCard icon={<CreditCard className="w-4 h-4" />} label="Total Debt" value={`$${combinedDebt.toLocaleString()}`} bgClass="bg-warning/10" textClass="text-warning" />
          </div>
        );
      case "credit":
        return (
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
        );
      case "savings":
        return (
          <div className="bg-card rounded-3xl border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Savings Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">${currentSavings.toLocaleString()} saved</span>
                <span className="font-medium text-foreground">${savingsGoal.toLocaleString()} goal</span>
              </div>
              <Progress value={savingsPercent} className="h-3" />
              <p className="text-sm text-primary font-medium">You're {savingsPercent}% of the way there!</p>
              {savingsGoal > currentSavings && netMonthly > 0 && (
                <p className="text-xs text-muted-foreground">
                  At ${netMonthly.toLocaleString()}/mo surplus, ~{Math.ceil((savingsGoal - currentSavings) / netMonthly)} months to goal.
                </p>
              )}
            </div>
          </div>
        );
      case "spending":
        if (expenseChart.length === 0) return null;
        return (
          <div className="bg-card rounded-3xl border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Spending Breakdown</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {expenseChart.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case "debt-calc":
        if (combinedDebt <= 0) return null;
        return (
          <div className="bg-card rounded-3xl border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Debt-Free Calculator</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Pay extra <span className="font-semibold text-foreground">${extraPayment}/mo</span> beyond ${monthlyDebtPayment.toLocaleString()}/mo → debt-free by:
            </p>
            <p className="text-2xl font-bold text-primary mb-4">{debtFreeDate}</p>
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Extra monthly: ${extraPayment}</span>
              <Slider value={[extraPayment]} onValueChange={v => setExtraPayment(v[0])} min={0} max={2000} step={50} />
            </div>
          </div>
        );
      case "loans":
        if (!(loans || []).length) return null;
        return (
          <div className="bg-card rounded-3xl border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Student Loans</h3>
            <div className="space-y-3">
              {loans!.map(loan => (
                <div key={loan.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{loan.provider_name || "Loan"}</p>
                    <p className="text-xs text-muted-foreground">{loan.interest_rate}% · ${Number(loan.monthly_payment).toLocaleString()}/mo</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">${Number(loan.amount).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/20 rounded-3xl p-6 border border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{firstName}'s Financial Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Your Financial Overview</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setQuote(getRandomQuote())} className="rounded-xl" title="New quote">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant={customizing ? "default" : "ghost"}
              size="icon"
              onClick={() => setCustomizing(c => !c)}
              className="rounded-xl"
              title="Customize layout"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 text-sm">
          <Quote className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="italic text-foreground">"{quote.text}"</span>
            <span className="text-muted-foreground ml-1">— {quote.author}</span>
          </div>
        </div>
      </div>

      {/* ── Customization Panel ── */}
      <AnimatePresence>
        {customizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-3xl border-2 border-primary/30 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Step 3 — Customize Your View</h3>
                  <p className="text-xs text-muted-foreground">Toggle sections on/off and drag to reorder.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCustomizing(false)} className="rounded-xl">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Reorder.Group axis="y" values={localOrder} onReorder={setLocalOrder} className="space-y-2">
                {localOrder.map(id => {
                  const def = CARD_DEFS.find(c => c.id === id);
                  if (!def) return null;
                  return (
                    <Reorder.Item
                      key={id}
                      value={id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground flex-1">{def.label}</span>
                      <Switch
                        checked={isVisible(id)}
                        onCheckedChange={() => toggleHidden(id)}
                      />
                      {isVisible(id) ? (
                        <Eye className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveLayout} disabled={upsertLayout.isPending} className="rounded-xl bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground">
                  <Save className="w-4 h-4 mr-1" /> {upsertLayout.isPending ? "Saving…" : "Save Layout"}
                </Button>
                <Button variant="outline" onClick={handleReset} className="rounded-xl">
                  <RotateCcw className="w-4 h-4 mr-1" /> Reset to Default
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dashboard Cards (ordered & filtered) ── */}
      {effectiveOrder.filter(id => isVisible(id)).map(id => {
        const content = renderCard(id);
        if (!content) return null;
        return (
          <motion.div key={id} layout transition={{ duration: 0.2 }}>
            {content}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ── Summary Card ── */
function SummaryCard({ icon, label, value, bgClass, textClass }: { icon: React.ReactNode; label: string; value: string; bgClass: string; textClass: string }) {
  return (
    <div className="bg-card rounded-3xl border border-border p-4">
      <div className={`inline-flex p-2 rounded-xl ${bgClass} ${textClass} mb-2`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${textClass}`}>{value}</p>
    </div>
  );
}
