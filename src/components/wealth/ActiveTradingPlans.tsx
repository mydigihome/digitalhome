import { motion } from "framer-motion";
import { useTradingPlans } from "@/hooks/useTradingPlans";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.3)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 24,
};

export default function ActiveTradingPlans() {
  const { data: plans } = useTradingPlans();
  const activePlans = plans?.filter((p) => p.status === "active") || [];

  if (activePlans.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={glass}
      className="p-5"
    >
      <h3 className="text-base font-bold text-slate-900 mb-4">Active Trading Plans</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activePlans.map((plan) => {
          const entry = Number(plan.entry_price) || 0;
          const target = Number(plan.take_profit_1) || Number((plan as any).target_price) || 0;
          const current = Number(plan.current_price) || entry;
          const progress = target !== entry ? ((current - entry) / (target - entry)) * 100 : 0;
          const isProfit = current >= entry;
          const pctChange = entry > 0 ? (((current - entry) / entry) * 100).toFixed(2) : "0";

          return (
            <div key={plan.id} className="p-4 bg-white rounded-xl border border-slate-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">{plan.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.time_frame.replace(/_/g, " ")}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${isProfit ? "text-emerald-500" : "text-red-500"}`}>
                  {isProfit ? "+" : ""}{pctChange}%
                </span>
              </div>

              <div className="space-y-1.5 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry</span>
                  <span className="font-semibold text-slate-900">${entry.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current</span>
                  <span className="font-semibold text-slate-900">${current.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-semibold text-slate-900">${target.toLocaleString()}</span>
                </div>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isProfit ? "bg-emerald-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
