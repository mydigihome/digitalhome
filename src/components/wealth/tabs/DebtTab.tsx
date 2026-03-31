import { motion } from "framer-motion";
import DebtOverview from "../DebtOverview";
import CreditScoreWheel from "../CreditScoreWheel";
import { StudentLoanCard } from "../StudentLoanCard";

export default function DebtTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <DebtOverview />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <CreditScoreWheel />
        </div>
        <div className="rounded-3xl bg-card border border-border shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <StudentLoanCard />
        </div>
      </div>
    </motion.div>
  );
}
