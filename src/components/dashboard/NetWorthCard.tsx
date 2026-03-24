import { motion } from "framer-motion";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useLoans } from "@/hooks/useLoans";

export default function NetWorthCard() {
  const navigate = useNavigate();
  const { data: finances } = useUserFinances();
  const { data: loans } = useLoans();

  const savings = Number(finances?.current_savings || 0);
  const totalDebt = Number(finances?.total_debt || 0) + (loans || []).reduce((s, l) => s + Number(l.amount), 0);
  const netWorth = savings - totalDebt;
  const income = Number(finances?.monthly_income || 0);

  // Don't render if user has no financial data
  if (!finances) return null;

  const fmt = (n: number) => {
    const abs = Math.abs(n);
    const prefix = n < 0 ? "-" : "";
    if (abs >= 1000) {
      return `${prefix}$${(abs / 1000).toFixed(1)}K`;
    }
    return `${prefix}$${abs.toLocaleString()}`;
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      onClick={() => navigate("/finance/wealth")}
      className="w-full p-5 rounded-2xl border border-border bg-card/70 dark:bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Net Worth</h3>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className={`text-3xl font-bold tracking-tight ${netWorth >= 0 ? "text-success" : "text-destructive"}`}>
        {fmt(netWorth)}
      </p>
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span>Income: <span className="font-semibold text-success">${income.toLocaleString()}/mo</span></span>
        {totalDebt > 0 && (
          <span>Debt: <span className="font-semibold text-destructive">{fmt(totalDebt)}</span></span>
        )}
      </div>
    </motion.button>
  );
}
