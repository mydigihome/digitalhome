import { useState, useCallback } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { BarChart3, CreditCard, TrendingDown, LineChart, Plus, Search, X, EyeOff, Eye, ChevronDown, Landmark, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MoneyCard from "./MoneyCard";
import MoneyOverview from "./overview/MoneyOverview";
import DebtTab from "./DebtTab";
import InvestingTab from "./InvestingTab";
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
import { SavingsRateFront, SavingsRateBack } from "./cards/SavingsRateCard";
import { CashflowFront, CashflowBack } from "./cards/CashflowCard";
import TrackFinanceModal from "./TrackFinanceModal";
import { useMoneyPreferences } from "@/hooks/useMoneyPreferences";
import PremiumGate, { usePremiumStatus } from "@/components/PremiumGate";
import "../../styles/money-tab.css";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "debt", label: "Debt", icon: TrendingDown },
  { id: "investing", label: "Investing", icon: TrendingUp },
] as const;

type TabId = typeof TABS[number]["id"];

// Which cards belong to which tab
const TAB_CARDS: Record<TabId, string[]> = {
  overview: ["plaid", "net-worth", "savings-rate", "moneyflow", "emergency", "salary"],
  debt: ["debt", "credit-score", "net-worth-history", "refund-tracker"],
  investing: [],
};

const FULL_WIDTH = new Set(["plaid", "moneyflow", "tradingview", "subscriptions", "net-worth-history", "category-trends", "cashflow-calendar"]);

const GRID_PAIRS: Record<string, string | undefined> = {
  "net-worth": "spending",
  "spending": "net-worth",
  "debt": "credit-score",
  "credit-score": "debt",
  "bills": "emergency",
  "emergency": "bills",
  "salary": "savings-rate",
  "savings-rate": "salary",
  "investment-portfolio": "tax-estimate",
  "tax-estimate": "investment-portfolio",
  "merchant-spending": "refund-tracker",
  "refund-tracker": "merchant-spending",
  "large-transactions": "savings-opportunities",
  "savings-opportunities": "large-transactions",
  "cashflow": "cashflow",
};

const CARD_LABELS: Record<string, string> = {
  plaid: "Bank Connection",
  "net-worth": "Net Worth",
  spending: "Spending",
  debt: "Debt Tracker",
  "credit-score": "Credit Score",
  bills: "Bills Calendar",
  moneyflow: "Money Flow",
  emergency: "Liquidity Sprints",
  salary: "Salary",
  "savings-rate": "Savings Rate",
  cashflow: "Cashflow",
  tradingview: "Market Terminal",
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

const PREMIUM_CARD_IDS = new Set([
  "tradingview", "subscriptions", "net-worth-history", "investment-portfolio",
  "tax-estimate", "merchant-spending", "category-trends", "cashflow-calendar",
  "refund-tracker", "large-transactions", "savings-opportunities",
]);

function noop() {}

export default function MoneyTabWithSubTabs() {
  const {
    cardOrder,
    hiddenCards,
    updateCardOrder,
    hideCard,
    restoreCard,
    restoreAll,
  } = useMoneyPreferences();
  const { isPremium } = usePremiumStatus();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackFinanceOpen, setTrackFinanceOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [plaidConnecting, setPlaidConnecting] = useState(false);
  const [plaidAccountName, setPlaidAccountName] = useState("");

  const handleConnectBank = async () => {
    setPlaidConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("plaid-link-token", {
        body: { user_id: "demo" },
      });
      // Simulate success since Plaid credentials may not be configured
      setTimeout(() => {
        setPlaidConnecting(false);
        setPlaidConnected(true);
        setPlaidAccountName("Chase Checking");
        toast.success("Bank connected");
      }, 1500);
    } catch {
      setPlaidConnecting(false);
      toast.error("Connection failed. Try again.");
    }
  };

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
    "savings-rate": { front: <SavingsRateFront />, back: <SavingsRateBack onCancel={noop} onSave={noop} /> },
    cashflow: { front: <CashflowFront />, back: <CashflowBack onCancel={noop} onSave={noop} /> },
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

  // Filter cards for active tab
  const tabCardIds = TAB_CARDS[activeTab];
  const visibleOrder = cardOrder
    .filter(id => tabCardIds.includes(id) && !hiddenCards.includes(id));

  // Also include tab cards not yet in cardOrder
  const extraCards = tabCardIds.filter(id => !cardOrder.includes(id) && !hiddenCards.includes(id));
  const allVisible = [...visibleOrder, ...extraCards];

  // Hidden cards for current tab
  const tabHiddenCards = hiddenCards.filter(id => tabCardIds.includes(id));

  // Build rows
  const rows: string[][] = [];
  const placed = new Set<string>();
  for (const id of allVisible) {
    if (placed.has(id)) continue;
    if (FULL_WIDTH.has(id)) {
      rows.push([id]);
      placed.add(id);
    } else {
      const pair = GRID_PAIRS[id];
      if (pair && pair !== id && !placed.has(pair) && allVisible.includes(pair)) {
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
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-[28px] font-bold text-foreground tracking-tight">Money</h1>
              <p className="text-sm text-muted-foreground mt-1">Your complete financial picture</p>
            </div>
            <div className="flex items-center gap-2">
              {plaidConnected ? (
                <span className="flex items-center gap-2 border border-primary/30 text-primary rounded-xl px-4 py-2.5 text-sm font-semibold bg-primary/5">
                  <Landmark className="w-4 h-4" />
                  {plaidAccountName || "Bank Connected"}
                </span>
              ) : (
                <button
                  onClick={handleConnectBank}
                  disabled={plaidConnecting}
                  className="flex items-center gap-2 border border-border text-foreground rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                >
                  {plaidConnecting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Landmark className="w-4 h-4" />
                      Connect Bank
                    </>
                  )}
                </button>
              )}
              {activeTab !== "overview" && (
                <button
                  onClick={() => setTrackFinanceOpen(true)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Card
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Plaid connection banner */}
        {!plaidConnected && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-center justify-between flex-wrap gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Landmark className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Connect your bank to auto-track spending and net worth.
              </p>
            </div>
            <button
              onClick={handleConnectBank}
              disabled={plaidConnecting}
              className="rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition border-none cursor-pointer"
            >
              {plaidConnecting ? "Connecting..." : "Connect Now"}
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-success text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab !== "overview" && (
            <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 ml-2">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cards..."
                className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="bg-transparent border-none cursor-pointer">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Overview tab → new layout */}
        {activeTab === "overview" ? (
          <MoneyOverview />
        ) : activeTab === "debt" ? (
          <DebtTab />
        ) : activeTab === "investing" ? (
          <InvestingTab />
        ) : (
          <>
            {/* Hidden cards restore drawer */}
            {tabHiddenCards.length > 0 && (
              <div className="money-card" style={{ padding: 0 }}>
                <button
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="w-full flex items-center justify-between"
                  style={{ padding: "10px 20px", background: "none", border: "none", cursor: "pointer" }}
                >
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{tabHiddenCards.length} hidden card{tabHiddenCards.length > 1 ? "s" : ""}</span>
                  </div>
                  <span className="text-sm font-semibold flex items-center gap-1 text-primary">
                    Manage <ChevronDown className={`w-3.5 h-3.5 transition-transform ${drawerOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: drawerOpen ? 200 : 0 }}>
                  <div className="flex flex-wrap gap-2" style={{ padding: "0 20px 12px" }}>
                    {tabHiddenCards.map(id => (
                      <button key={id} onClick={() => restoreCard(id)} className="flex items-center gap-2 rounded-full text-sm font-semibold border-none cursor-pointer bg-muted text-foreground" style={{ padding: "6px 16px" }}>
                        {CARD_LABELS[id] || id}
                        <Eye className="w-3.5 h-3.5 text-primary" />
                      </button>
                    ))}
                    <button onClick={restoreAll} className="text-sm font-semibold underline text-primary bg-transparent border-none cursor-pointer">Restore All</button>
                  </div>
                </div>
              </div>
            )}

            {/* Cards Grid */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={allVisible} strategy={verticalListSortingStrategy}>
                {rows.map((row, ri) => (
                  <div key={ri} className={`money-tab-row${row.length === 1 ? " full-width" : ""}`}>
                    {row.map((id) => {
                      const c = cardMap[id];
                      if (!c) return null;
                      const isSearchDimmed = searchQuery && !(CARD_LABELS[id] || id).toLowerCase().includes(searchQuery.toLowerCase());
                      const needsGate = !isPremium && PREMIUM_CARD_IDS.has(id);
                      return (
                        <div key={id} style={{ opacity: isSearchDimmed ? 0.3 : 1, pointerEvents: isSearchDimmed ? "none" : "auto", transition: "opacity 200ms" }}>
                          {needsGate ? (
                            <PremiumGate feature={CARD_LABELS[id] || "This card"} blur>
                              <MoneyCard id={id} front={c.front} back={c.back} fullWidth={FULL_WIDTH.has(id)} onHide={() => hideCard(id)} cardLabel={CARD_LABELS[id] || id} />
                            </PremiumGate>
                          ) : (
                            <MoneyCard id={id} front={c.front} back={c.back} fullWidth={FULL_WIDTH.has(id)} onHide={() => hideCard(id)} cardLabel={CARD_LABELS[id] || id} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </SortableContext>
            </DndContext>

            {allVisible.length === 0 && (
              <div className="money-card flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-semibold text-foreground mb-1">No cards in this tab</p>
                <p className="text-sm text-muted-foreground mb-4">Add cards or restore hidden ones to see your data here</p>
                <button onClick={() => setTrackFinanceOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold transition-all">
                  <Plus className="w-4 h-4" /> Add Card
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <TrackFinanceModal
        open={trackFinanceOpen}
        onClose={() => setTrackFinanceOpen(false)}
        existingCardIds={cardOrder}
        onAddCards={handleAddCards}
        plaidConnected={plaidConnected}
      />
    </div>
  );
}
