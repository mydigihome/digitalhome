import TransactionHistoryPanel from "./TransactionHistoryPanel";
import TotalSpendingsCard from "./TotalSpendingsCard";
import TotalEarningsCard from "./TotalEarningsCard";
import BillsRecurringCard from "./BillsRecurringCard";
import CreditScoreGaugeCard from "./CreditScoreGaugeCard";

export default function MoneyOverview() {
  return (
    <div className="space-y-6">
      {/* Top: Transaction History (left 380px) + Spendings/Earnings (right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
          gap: '24px',
          alignItems: 'start',
          width: '100%',
        }}
      >
        <TransactionHistoryPanel />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <TotalSpendingsCard />
          <TotalEarningsCard />
        </div>
      </div>

      {/* Bottom: Bills + Credit Score side by side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        <BillsRecurringCard />
        <CreditScoreGaugeCard />
      </div>
    </div>
  );
}
