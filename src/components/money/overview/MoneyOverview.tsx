import TransactionHistoryPanel from "./TransactionHistoryPanel";
import TotalSpendingsCard from "./TotalSpendingsCard";
import TotalEarningsCard from "./TotalEarningsCard";
import BillsRecurringCard from "./BillsRecurringCard";
import CreditScoreGaugeCard from "./CreditScoreGaugeCard";
import PlaidConnect from "@/components/money/PlaidConnect";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MoneyOverview() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <PlaidConnect />
      {/* Top: Transaction History + Spendings/Earnings */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '380px 1fr',
          gap: isMobile ? '16px' : '24px',
          alignItems: 'start',
          width: '100%',
        }}
      >
        <TransactionHistoryPanel />
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          <TotalSpendingsCard />
          <TotalEarningsCard />
        </div>
      </div>

      {/* Bottom: Bills + Credit Score */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '16px' : '24px',
        }}
      >
        <BillsRecurringCard />
        <CreditScoreGaugeCard />
      </div>
    </div>
  );
}
