import { motion } from "framer-motion";
import ActiveTradingPlans from "../ActiveTradingPlans";
import { TradingViewFront } from "../cards/TradingViewCard";
import MoneyCard from "../MoneyCard";

function noop() {}

export default function TradingTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* TradingView Market Terminal */}
      <MoneyCard id="tradingview" front={<TradingViewFront />} back={null} fullWidth onHide={noop} cardLabel="Market Terminal" />

      {/* Active Trading Plans */}
      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <ActiveTradingPlans />
      </div>
    </motion.div>
  );
}
