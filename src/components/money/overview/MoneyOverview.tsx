import TransactionHistoryPanel from "./TransactionHistoryPanel";
import TotalSpendingsCard from "./TotalSpendingsCard";
import TotalEarningsCard from "./TotalEarningsCard";
import BillsRecurringCard from "./BillsRecurringCard";
import CreditScoreGaugeCard from "./CreditScoreGaugeCard";

export default function MoneyOverview() {
  return (
    <div className="space-y-6">
      {/* Top section: 3-column grid */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: Transaction History */}
        <div className="w-full xl:w-[380px] xl:flex-shrink-0">
          <TransactionHistoryPanel />
        </div>
        {/* Right: Spendings + Earnings stacked */}
        <div className="flex-1 flex flex-col gap-6">
          <TotalSpendingsCard />
          <TotalEarningsCard />
        </div>
      </div>

      {/* Bottom row: Bills + Credit Score side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BillsRecurringCard />
        <CreditScoreGaugeCard />
      </div>
    </div>
  );
}
