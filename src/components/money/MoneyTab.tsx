import { useState, useCallback } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import MoneyCard from "./MoneyCard";
import { PlaidBannerFront, PlaidBannerBack } from "./cards/PlaidBanner";
import { NetWorthFront, NetWorthBack } from "./cards/NetWorthCard";
import { SpendingFront, SpendingBack } from "./cards/SpendingCard";
import { DebtFront, DebtBack } from "./cards/DebtCard";
import { CreditScoreFront, CreditScoreBack } from "./cards/CreditScoreCard";
import { BillsFront, BillsBack } from "./cards/BillsCard";
import { MoneyFlowFront, MoneyFlowBack } from "./cards/MoneyFlowCard";
import { EmergencyFundFront, EmergencyFundBack } from "./cards/EmergencyFundCard";
import { SalaryFront, SalaryBack } from "./cards/SalaryCard";
import { TradingViewFront, TradingViewBack } from "./cards/TradingViewCard";
import {
  SubscriptionsFront, SubscriptionsBack,
  NetWorthHistoryFront, NetWorthHistoryBack,
  InvestmentPortfolioFront, InvestmentPortfolioBack,
  TaxEstimateFront, TaxEstimateBack,
  MerchantSpendingFront, MerchantSpendingBack,
  CategoryTrendsFront, CategoryTrendsBack,
  CashFlowCalendarFront, CashFlowCalendarBack,
  RefundTrackerFront, RefundTrackerBack,
  LargeTransactionsFront, LargeTransactionsBack,
  SavingsOpportunitiesFront, SavingsOpportunitiesBack,
} from "./cards/NewPlaidCards";
import MoneyTopBar from "./MoneyTopBar";
import TrackFinanceModal from "./TrackFinanceModal";
import LiquidityBannerCard from "./LiquidityBannerCard";
import { useMoneyPreferences } from "@/hooks/useMoneyPreferences";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import "../../styles/money-tab.css";

const FULL_WIDTH = new Set(["plaid", "moneyflow", "tradingview", "liquidity-banner",
  "subscriptions", "net-worth-history", "category-trends", "cashflow-calendar"]);

const GRID_PAIRS: Record<string, string | undefined> = {
  "net-worth": "spending",
  "spending": "net-worth",
  "debt": "credit-score",
  "credit-score": "debt",
  "bills": "emergency",
  "emergency": "bills",
  "salary": "salary",
  "investment-portfolio": "tax-estimate",
  "tax-estimate": "investment-portfolio",
  "merchant-spending": "refund-tracker",
  "refund-tracker": "merchant-spending",
  "large-transactions": "savings-opportunities",
  "savings-opportunities": "large-transactions",
};

const CARD_LABELS: Record<string, string> = {
  plaid: "Plaid Banner",
  "net-worth": "Net Worth",
  spending: "Spending",
  debt: "Debt Tracker",
  "credit-score": "Credit Score",
  bills: "Bills Calendar",
  moneyflow: "Money Flow",
  emergency: "Emergency Fund",
  salary: "Salary",
  tradingview: "Market Terminal",
  "liquidity-banner": "Liquidity Banner",
  subscriptions: "Subscription Tracker",
  "net-worth-history": "Net Worth History",
  "investment-portfolio": "Investment Portfolio",
  "tax-estimate": "Tax Estimate",
  "merchant-spending": "Merchant Spending",
  "category-trends": "Category Trends",
  "cashflow-calendar": "Cash Flow Calendar",
  "refund-tracker": "Refund Tracker",
  "large-transactions": "Large Transaction Alerts",
  "savings-opportunities": "Savings Opportunities",
};

function noop() {}

export default function MoneyTab() {
  const {
    cardOrder,
    hiddenCards,
    updateCardOrder,
    hideCard,
    restoreCard,
    restoreAll,
  } = useMoneyPreferences();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackFinanceOpen, setTrackFinanceOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIdx = cardOrder.indexOf(active.id as string);
      const newIdx = cardOrder.indexOf(over.id as string);
      updateCardOrder(arrayMove(cardOrder, oldIdx, newIdx));
    }
  }, [cardOrder, updateCardOrder]);

  const handleAddCards = useCallback((ids: string[]) => {
    const newOrder = [...cardOrder, ...ids.filter(id => !cardOrder.includes(id))];
    updateCardOrder(newOrder);
  }, [cardOrder, updateCardOrder]);

  const cardMap: Record<string, { front: React.ReactNode; back: React.ReactNode }> = {
    plaid: { front: <PlaidBannerFront />, back: <PlaidBannerBack onCancel={noop} onSave={noop} /> },
    "net-worth": { front: <NetWorthFront />, back: <NetWorthBack onCancel={noop} onSave={noop} /> },
    spending: { front: <SpendingFront />, back: <SpendingBack onCancel={noop} onSave={noop} /> },
    debt: { front: <DebtFront />, back: <DebtBack onCancel={noop} onSave={noop} /> },
    "credit-score": { front: <CreditScoreFront />, back: <CreditScoreBack onCancel={noop} onSave={noop} /> },
    bills: { front: <BillsFront />, back: <BillsBack onCancel={noop} onSave={noop} /> },
    moneyflow: { front: <MoneyFlowFront />, back: <MoneyFlowBack onCancel={noop} onSave={noop} /> },
    emergency: { front: <EmergencyFundFront />, back: <EmergencyFundBack onCancel={noop} onSave={noop} /> },
    salary: { front: <SalaryFront />, back: <SalaryBack onCancel={noop} onSave={noop} /> },
    tradingview: { front: <TradingViewFront />, back: <TradingViewBack onCancel={noop} onSave={noop} /> },
    subscriptions: { front: <SubscriptionsFront />, back: <SubscriptionsBack onCancel={noop} onSave={noop} /> },
    "net-worth-history": { front: <NetWorthHistoryFront />, back: <NetWorthHistoryBack onCancel={noop} onSave={noop} /> },
    "investment-portfolio": { front: <InvestmentPortfolioFront />, back: <InvestmentPortfolioBack onCancel={noop} onSave={noop} /> },
    "tax-estimate": { front: <TaxEstimateFront />, back: <TaxEstimateBack onCancel={noop} onSave={noop} /> },
    "merchant-spending": { front: <MerchantSpendingFront />, back: <MerchantSpendingBack onCancel={noop} onSave={noop} /> },
    "category-trends": { front: <CategoryTrendsFront />, back: <CategoryTrendsBack onCancel={noop} onSave={noop} /> },
    "cashflow-calendar": { front: <CashFlowCalendarFront />, back: <CashFlowCalendarBack onCancel={noop} onSave={noop} /> },
    "refund-tracker": { front: <RefundTrackerFront />, back: <RefundTrackerBack onCancel={noop} onSave={noop} /> },
    "large-transactions": { front: <LargeTransactionsFront />, back: <LargeTransactionsBack onCancel={noop} onSave={noop} /> },
    "savings-opportunities": { front: <SavingsOpportunitiesFront />, back: <SavingsOpportunitiesBack onCancel={noop} onSave={noop} /> },
  };

  const visibleOrder = cardOrder.filter(id => !hiddenCards.includes(id));
  const searchFiltered = searchQuery
    ? visibleOrder.filter(id => (CARD_LABELS[id] || id).toLowerCase().includes(searchQuery.toLowerCase()))
    : visibleOrder;

  // Insert liquidity-banner before emergency if not in order
  const displayOrder = [...searchFiltered];
  if (!cardOrder.includes("liquidity-banner")) {
    const emergencyIdx = displayOrder.indexOf("emergency");
    if (emergencyIdx >= 0) {
      displayOrder.splice(emergencyIdx, 0, "liquidity-banner");
    }
  }

  const rows: string[][] = [];
  const placed = new Set<string>();
  for (const id of displayOrder) {
    if (placed.has(id)) continue;
    if (id === "liquidity-banner") {
      rows.push([id]);
      placed.add(id);
      continue;
    }
    if (FULL_WIDTH.has(id)) {
      rows.push([id]);
      placed.add(id);
    } else {
      const pair = GRID_PAIRS[id];
      if (pair && pair !== id && !placed.has(pair) && displayOrder.includes(pair)) {
        rows.push([id, pair]);
        placed.add(id);
        placed.add(pair);
      } else {
        rows.push([id]);
        placed.add(id);
      }
    }
  }

  return (
    <div className="money-tab-root">
      <div className="money-tab-stack">
        {/* Top bar */}
        <MoneyTopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hiddenCount={hiddenCards.length}
          onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
          onOpenTrackFinance={() => setTrackFinanceOpen(true)}
        />

        {/* Hidden cards restore drawer */}
        {hiddenCards.length > 0 && (
          <div className="money-card" style={{ padding: 0 }}>
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="w-full flex items-center justify-between"
              style={{ padding: "10px 20px" }}
            >
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4" style={{ color: "#767586" }} />
                <span className="text-sm font-bold" style={{ color: "#1a1c1f" }}>{hiddenCards.length} hidden card{hiddenCards.length > 1 ? "s" : ""}</span>
              </div>
              <span className="text-sm font-bold flex items-center gap-1" style={{ color: "#4648d4" }}>
                Manage <ChevronDown className={`w-3.5 h-3.5 transition-transform ${drawerOpen ? "rotate-180" : ""}`} />
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: drawerOpen ? 200 : 0 }}
            >
              <div className="flex flex-wrap gap-2" style={{ padding: "0 20px 12px" }}>
                {hiddenCards.map(id => (
                  <button
                    key={id}
                    onClick={() => restoreCard(id)}
                    className="flex items-center gap-2 rounded-full text-sm font-bold"
                    style={{ background: "#f3f3f8", color: "#1a1c1f", padding: "6px 16px" }}
                  >
                    {CARD_LABELS[id] || id}
                    <Eye className="w-3.5 h-3.5" style={{ color: "#4648d4" }} />
                  </button>
                ))}
                <button onClick={restoreAll} className="text-sm font-bold underline" style={{ color: "#4648d4" }}>
                  Restore All
                </button>
              </div>
            </div>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayOrder.filter(id => id !== "liquidity-banner")} strategy={verticalListSortingStrategy}>
            {rows.map((row, ri) => {
              // Liquidity banner is a special non-sortable row
              if (row.length === 1 && row[0] === "liquidity-banner") {
                return (
                  <div key="liquidity-banner" className="money-tab-row full-width">
                    <LiquidityBannerCard />
                  </div>
                );
              }

              return (
                <div key={ri} className={`money-tab-row${row.length === 1 ? " full-width" : ""}`}>
                  {row.map((id) => {
                    const c = cardMap[id];
                    if (!c) return null;
                    const isSearchDimmed = searchQuery && !(CARD_LABELS[id] || id).toLowerCase().includes(searchQuery.toLowerCase());
                    return (
                      <div key={id} style={{ opacity: isSearchDimmed ? 0.3 : 1, transition: "opacity 200ms" }}>
                        <MoneyCard
                          id={id}
                          front={c.front}
                          back={c.back}
                          fullWidth={FULL_WIDTH.has(id)}
                          onHide={() => hideCard(id)}
                          cardLabel={CARD_LABELS[id] || id}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      {/* Track Finance Modal */}
      <TrackFinanceModal
        open={trackFinanceOpen}
        onClose={() => setTrackFinanceOpen(false)}
        existingCardIds={cardOrder}
        onAddCards={handleAddCards}
        plaidConnected={false}
      />
    </div>
  );
}
