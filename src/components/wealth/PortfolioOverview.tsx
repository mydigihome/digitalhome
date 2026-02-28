import { useMemo } from "react";
import { TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";
import { motion } from "framer-motion";

export default function PortfolioOverview() {
  const { data: investments } = useInvestments();

  const stats = useMemo(() => {
    if (!investments?.length) return null;
    let totalValue = 0;
    let totalCost = 0;
    investments.forEach((inv) => {
      const currentPrice = Number(inv.current_price || inv.purchase_price);
      totalValue += currentPrice * Number(inv.quantity);
      totalCost += Number(inv.purchase_price) * Number(inv.quantity);
    });
    const gainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    return { totalValue, totalCost, gainLoss, gainLossPercent };
  }, [investments]);

  if (!stats) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">No holdings yet</p>
        <p className="text-xs text-muted-foreground">Add investments below to see your portfolio overview</p>
      </div>
    );
  }

  const isUp = stats.gainLoss >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-6 ${isUp ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Portfolio Value</p>
          <p className="text-3xl font-bold text-foreground mt-1">${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${isUp ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isUp ? "+" : ""}${stats.gainLoss.toFixed(2)} ({stats.gainLossPercent.toFixed(2)}%)
        </div>
      </div>
      <div className="flex gap-6 mt-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Total Cost Basis</p>
          <p className="font-medium text-foreground">${stats.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Gain/Loss</p>
          <p className={`font-medium ${isUp ? "text-success" : "text-destructive"}`}>
            {isUp ? "+" : ""}${stats.gainLoss.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Holdings</p>
          <p className="font-medium text-foreground">{investments?.length || 0}</p>
        </div>
      </div>
    </motion.div>
  );
}
