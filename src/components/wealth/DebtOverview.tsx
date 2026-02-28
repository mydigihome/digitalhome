import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useLoans } from "@/hooks/useLoans";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

export default function DebtOverview() {
  const { data: finances } = useUserFinances();
  const { data: loans } = useLoans();
  const [expanded, setExpanded] = useState(false);
  const [extraPayment, setExtraPayment] = useState(0);

  const totalDebt = Number(finances?.total_debt || 0);
  const totalLoanDebt = useMemo(() => (loans || []).reduce((s, l) => s + Number(l.amount), 0), [loans]);
  const combinedDebt = totalDebt + totalLoanDebt;
  const monthlyDebtPayment = useMemo(() => (loans || []).reduce((s, l) => s + Number(l.monthly_payment), 0), [loans]);
  const effectivePayment = monthlyDebtPayment + extraPayment;
  const monthsToDebtFree = effectivePayment > 0 ? Math.ceil(combinedDebt / effectivePayment) : Infinity;
  const creditScore = finances?.credit_score;

  const debtFreeDate = useMemo(() => {
    if (monthsToDebtFree === Infinity) return "Never";
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToDebtFree);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [monthsToDebtFree]);

  const creditColor = !creditScore ? "text-muted-foreground" : creditScore >= 670 ? "text-success" : creditScore >= 580 ? "text-warning" : "text-destructive";

  if (combinedDebt <= 0 && !creditScore) return null;

  return (
    <section>
      {/* Clickable Summary */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full rounded-xl border border-border bg-card p-5 flex items-center justify-between hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-warning/10">
            <CreditCard className="h-5 w-5 text-warning" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Total Debt</p>
            <p className="text-xs text-muted-foreground">{loans?.length || 0} loans · Click to expand</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-foreground">${combinedDebt.toLocaleString()}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-3">
              {/* Credit Score */}
              {creditScore && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Credit Score</h3>
                  <div className="flex items-center gap-4">
                    <span className={`text-3xl font-bold ${creditColor}`}>{creditScore}</span>
                    <span className={`text-sm font-medium ${creditColor}`}>
                      {creditScore >= 670 ? "Good" : creditScore >= 580 ? "Fair" : "Poor"}
                    </span>
                  </div>
                </div>
              )}

              {/* Loans */}
              {(loans || []).length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Loans</h3>
                  {loans!.map((loan) => (
                    <div key={loan.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{loan.provider_name || loan.loan_type}</p>
                        <p className="text-xs text-muted-foreground">{Number(loan.interest_rate)}% · ${Number(loan.monthly_payment).toLocaleString()}/mo</p>
                      </div>
                      <p className="text-sm font-bold text-foreground">${Number(loan.amount).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Debt-Free Calculator */}
              {combinedDebt > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Debt-Free Calculator</h3>
                  <p className="text-sm text-muted-foreground">
                    Pay extra <span className="font-semibold text-foreground">${extraPayment}/mo</span> → debt-free by:
                  </p>
                  <p className="text-2xl font-bold text-primary">{debtFreeDate}</p>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Extra monthly: ${extraPayment}</span>
                    <Slider value={[extraPayment]} onValueChange={(v) => setExtraPayment(v[0])} min={0} max={2000} step={50} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
