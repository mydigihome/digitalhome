import { useState } from "react";
import { motion } from "framer-motion";
import InvestmentHero from "../InvestmentHero";
import PortfolioOverview from "../PortfolioOverview";
import HoldingsSection from "../HoldingsSection";
import WatchlistSection from "../WatchlistSection";
import SavingsSection from "../SavingsSection";
import TradingPlanModal from "../TradingPlanModal";

export default function InvestingTab() {
  const [planTarget, setPlanTarget] = useState<{ symbol: string; name: string; price: number } | null>(null);

  const openTradingPlan = (symbol: string, name: string, price: number) => {
    setPlanTarget({ symbol, name, price });
  };

  const openChart = () => {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <InvestmentHero onOpenTradingPlan={openTradingPlan} />
      </div>

      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <PortfolioOverview />
      </div>

      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <HoldingsSection onViewChart={openChart} onTradingPlan={openTradingPlan} />
      </div>

      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <WatchlistSection onViewChart={openChart} />
      </div>

      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <SavingsSection />
      </div>

      {planTarget && (
        <TradingPlanModal
          symbol={planTarget.symbol}
          assetName={planTarget.name}
          currentPrice={planTarget.price}
          onClose={() => setPlanTarget(null)}
        />
      )}
    </motion.div>
  );
}
