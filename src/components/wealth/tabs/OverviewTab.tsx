import { motion } from "framer-motion";
import SummaryCards from "../SummaryCards";
import NetWorthHero from "../NetWorthHero";
import SavingsProgress from "../SavingsProgress";
import CreditScoreWheel from "../CreditScoreWheel";
import { PlaidBannerFront } from "../cards/PlaidBanner";
import MoneyCard from "../MoneyCard";

function noop() {}

export default function OverviewTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Plaid Connection Banner */}
      <MoneyCard id="plaid" front={<PlaidBannerFront />} back={null} fullWidth onHide={noop} cardLabel="Bank Connection" />

      {/* Summary row */}
      <SummaryCards />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <NetWorthHero />
        </div>
        <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <SavingsProgress />
        </div>
      </div>

      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <CreditScoreWheel />
      </div>
    </motion.div>
  );
}
