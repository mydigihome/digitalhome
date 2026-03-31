import { motion } from "framer-motion";
import ActiveTradingPlans from "../ActiveTradingPlans";
import InvestmentHero from "../InvestmentHero";

export default function TradingTab() {
  const openTradingPlan = () => {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Market chart via InvestmentHero (contains TradingView) */}
      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <InvestmentHero onOpenTradingPlan={openTradingPlan} />
      </div>

      {/* Active Trading Plans */}
      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <ActiveTradingPlans />
      </div>
    </motion.div>
  );
}
