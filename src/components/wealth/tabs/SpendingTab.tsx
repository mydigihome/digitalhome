import { motion } from "framer-motion";
import SpendingSection from "../SpendingSection";
import BudgetEnvelopes from "../BudgetEnvelopes";
import BillsCalendar from "../BillsCalendar";
import SubscriptionsSection from "../SubscriptionsSection";

export default function SpendingTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <SpendingSection />
      </div>

      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <BudgetEnvelopes />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <BillsCalendar />
        </div>
        <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <SubscriptionsSection />
        </div>
      </div>
    </motion.div>
  );
}
