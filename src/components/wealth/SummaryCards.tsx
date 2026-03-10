import { useState } from "react";
import { DollarSign, CreditCard, TrendingUp, TrendingDown, Pencil, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserFinances, useUpsertUserFinances } from "@/hooks/useUserFinances";
import { useExpenses } from "@/hooks/useExpenses";
import { useLoans } from "@/hooks/useLoans";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SummaryCards() {
  const { data: finances } = useUserFinances();
  const { data: expenses } = useExpenses();
  const { data: loans } = useLoans();
  const upsertFinances = useUpsertUserFinances();

  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const monthlyIncome = Number(finances?.monthly_income || 0);
  const monthlyExpenses = (expenses || []).filter(e => e.frequency === "monthly").reduce((s, e) => s + Number(e.amount), 0);
  const yearlyAsMonthly = (expenses || []).filter(e => e.frequency === "yearly").reduce((s, e) => s + Number(e.amount) / 12, 0);
  const totalExpenses = monthlyExpenses + yearlyAsMonthly;
  const netMonthly = monthlyIncome - totalExpenses;
  const totalDebt = Number(finances?.total_debt || 0) + (loans || []).reduce((s, l) => s + Number(l.amount), 0);

  const startEdit = (card: string, currentValue: number) => {
    setEditingCard(card);
    setEditValue(String(currentValue));
  };

  const saveEdit = async () => {
    if (editingCard === "income") {
      await upsertFinances.mutateAsync({ monthly_income: parseFloat(editValue) || 0, onboarding_completed: true });
      toast.success("Income updated");
    } else if (editingCard === "debt") {
      await upsertFinances.mutateAsync({ total_debt: parseFloat(editValue) || 0, onboarding_completed: true });
      toast.success("Debt updated");
    }
    setEditingCard(null);
  };

  const toggleExpand = (card: string) => {
    setExpandedCard(expandedCard === card ? null : card);
  };

  const cards = [
    {
      id: "income",
      label: "Monthly Income",
      icon: DollarSign,
      value: monthlyIncome,
      color: "text-success",
      bgColor: "bg-success/5 border-success/20",
      iconBg: "bg-success/10",
      editable: true,
    },
    {
      id: "expenses",
      label: "Monthly Expenses",
      icon: CreditCard,
      value: totalExpenses,
      color: "text-destructive",
      bgColor: "bg-destructive/5 border-destructive/20",
      iconBg: "bg-destructive/10",
      editable: false,
      expandable: true,
    },
    {
      id: "net",
      label: "Net Monthly",
      icon: netMonthly >= 0 ? TrendingUp : TrendingDown,
      value: netMonthly,
      color: netMonthly >= 0 ? "text-primary" : "text-destructive",
      bgColor: netMonthly >= 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20",
      iconBg: netMonthly >= 0 ? "bg-primary/10" : "bg-destructive/10",
      editable: false,
    },
    {
      id: "debt",
      label: "Total Debt",
      icon: TrendingDown,
      value: totalDebt,
      color: "text-warning",
      bgColor: "bg-warning/5 border-warning/20",
      iconBg: "bg-warning/10",
      editable: true,
    },
  ];

  const expensesByCategory = (expenses || []).reduce<Record<string, number>>((acc, e) => {
    const amt = e.frequency === "yearly" ? Number(e.amount) / 12 : Number(e.amount);
    acc[e.category] = (acc[e.category] || 0) + amt;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const isEditing = editingCard === card.id;
          const isExpanded = expandedCard === card.id;

          return (
            <div key={card.id} className="space-y-0">
              <div
                onClick={() => (card as any).expandable ? toggleExpand(card.id) : undefined}
                className={`group w-full rounded-2xl border p-5 transition-all hover:shadow-md ${card.bgColor} ${(card as any).expandable ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${card.iconBg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  {card.editable && !isEditing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(card.id, card.value); }}
                      className="p-1.5 rounded-lg hover:bg-background/50 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{card.label}</p>
                {isEditing ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 text-lg font-bold"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="p-1 rounded hover:bg-success/10 text-success">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingCard(null)} className="p-1 rounded hover:bg-destructive/10 text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className={`text-2xl font-bold ${card.color}`}>
                    {card.value < 0 ? "-" : ""}${Math.abs(card.value).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    {card.id !== "debt" && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expense breakdown when expanded */}
      <AnimatePresence>
        {expandedCard === "expenses" && Object.keys(expensesByCategory).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Expense Breakdown (Monthly)</h3>
              <div className="space-y-2">
                {Object.entries(expensesByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between py-1">
                      <span className="text-sm text-foreground">{category}</span>
                      <span className="text-sm font-medium text-foreground">${amount.toFixed(0)}</span>
                    </div>
                  ))}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-sm font-bold text-destructive">${totalExpenses.toFixed(0)}/mo</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
