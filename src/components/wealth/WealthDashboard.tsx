import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, RefreshCw, Settings2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useLoans } from "@/hooks/useLoans";
import { useWealthLayout, useUpsertWealthLayout } from "@/hooks/useWealthLayout";
import { getRandomQuote } from "./quotes";
import { Button } from "@/components/ui/button";

// ─── Investment components ───
import InvestmentHero from "./InvestmentHero";
import PortfolioOverview from "./PortfolioOverview";
import HoldingsSection from "./HoldingsSection";
import WatchlistSection from "./WatchlistSection";
import TradingPlanModal from "./TradingPlanModal";

// ─── Financial components ───
import SummaryCards from "./SummaryCards";
import CreditScoreWheel from "./CreditScoreWheel";
import SavingsProgress from "./SavingsProgress";
import NetWorthHero from "./NetWorthHero";
import DebtOverview from "./DebtOverview";
import SpendingSection from "./SpendingSection";
import BudgetEnvelopes from "./BudgetEnvelopes";
import BillsCalendar from "./BillsCalendar";
import SubscriptionsSection from "./SubscriptionsSection";
import SavingsSection from "./SavingsSection";

const ALL_CARDS = [
  { id: "investments", label: "💹 Investments" },
  { id: "summary", label: "📊 Summary Cards" },
  { id: "credit-score", label: "🎯 Credit Score" },
  { id: "savings-progress", label: "💰 Savings Goal" },
  { id: "net-worth", label: "🏦 Net Worth" },
  { id: "debt", label: "📉 Debt Overview" },
  { id: "spending", label: "💳 Monthly Spending" },
  { id: "budget", label: "📦 Budget Envelopes" },
  { id: "bills", label: "📅 Bills & Due Dates" },
  { id: "subscriptions", label: "📋 Subscriptions" },
  { id: "savings-goals", label: "🎯 Savings Goals" },
] as const;

export default function WealthDashboard() {
  const { profile } = useAuth();
  const { data: finances } = useUserFinances();
  const { data: loans } = useLoans();
  const { data: layoutData } = useWealthLayout();
  const upsertLayout = useUpsertWealthLayout();

  const [quote, setQuote] = useState(() => getRandomQuote());
  const [showCustomize, setShowCustomize] = useState(false);
  const firstName = profile?.full_name?.split(" ")[0] || "Friend";

  useEffect(() => {
    const interval = setInterval(() => setQuote(getRandomQuote()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Trading plan modal
  const [planTarget, setPlanTarget] = useState<{ symbol: string; name: string; price: number } | null>(null);

  const openTradingPlan = (symbol: string, name: string, price: number) => {
    setPlanTarget({ symbol, name, price });
  };

  // Layout customization
  const hiddenCards: string[] = (layoutData?.hidden_cards as string[]) || [];
  const cardOrder: string[] = (layoutData?.card_order as string[]) || ALL_CARDS.map(c => c.id);

  const orderedCards = [
    ...cardOrder.filter(id => ALL_CARDS.some(c => c.id === id)),
    ...ALL_CARDS.filter(c => !cardOrder.includes(c.id)).map(c => c.id),
  ];

  const isHidden = (id: string) => hiddenCards.includes(id);

  const toggleCard = (id: string) => {
    const next = isHidden(id)
      ? hiddenCards.filter(h => h !== id)
      : [...hiddenCards, id];
    upsertLayout.mutate({ hidden_cards: next, card_order: orderedCards });
  };

  // Computed stats for header
  const monthlyIncome = Number(finances?.monthly_income || 0);
  const currentSavings = Number(finances?.current_savings || 0);
  const savingsGoal = Number(finances?.savings_goal || 0);
  const totalDebt = Number(finances?.total_debt || 0) + (loans || []).reduce((s, l) => s + Number(l.amount), 0);

  const openChart = (symbol: string) => {
    // Chart is now always visible via InvestmentHero — this is kept for HoldingsSection/WatchlistSection compat
  };

  const renderCard = (id: string) => {
    if (isHidden(id)) return null;

    switch (id) {
      case "investments":
        return (
          <div key={id} className="space-y-6">
            <InvestmentHero onOpenTradingPlan={openTradingPlan} />
            <PortfolioOverview />
            <HoldingsSection onViewChart={openChart} onTradingPlan={openTradingPlan} />
            <WatchlistSection onViewChart={openChart} />
          </div>
        );
      case "summary":
        return <SummaryCards key={id} />;
      case "credit-score":
        return <CreditScoreWheel key={id} />;
      case "savings-progress":
        return <SavingsProgress key={id} />;
      case "net-worth":
        return <NetWorthHero key={id} />;
      case "debt":
        return <DebtOverview key={id} />;
      case "spending":
        return <SpendingSection key={id} />;
      case "budget":
        return <BudgetEnvelopes key={id} />;
      case "savings-goals":
        return <SavingsSection key={id} />;
      case "bills":
        return <BillsCalendar key={id} />;
      case "subscriptions":
        return <SubscriptionsSection key={id} />;
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Hero Header with Quote + Snapshot */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-3xl p-6 md:p-8 border border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{firstName}'s Wealth Tracker</h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <div>
                <span className="text-muted-foreground">Income:</span>{" "}
                <span className="font-semibold text-success">${monthlyIncome.toLocaleString()}/mo</span>
              </div>
              <div>
                <span className="text-muted-foreground">Savings:</span>{" "}
                <span className="font-semibold text-foreground">${currentSavings.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Goal:</span>{" "}
                <span className="font-semibold text-foreground">${savingsGoal.toLocaleString()}</span>
              </div>
              {totalDebt > 0 && (
                <div>
                  <span className="text-muted-foreground">Debt:</span>{" "}
                  <span className="font-semibold text-warning">${totalDebt.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowCustomize(!showCustomize)} className="rounded-xl" title="Customize dashboard">
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setQuote(getRandomQuote())} className="rounded-xl" title="New quote">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Rotating Quote */}
        <motion.div
          key={quote.text}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4 flex items-start gap-2 text-sm"
        >
          <Quote className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="italic text-foreground">"{quote.text}"</span>
            <span className="text-muted-foreground ml-1">— {quote.author}</span>
          </div>
        </motion.div>
      </div>

      {/* Customization Panel */}
      <AnimatePresence>
        {showCustomize && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">⚙️ Customize Dashboard</h3>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                  upsertLayout.mutate({ hidden_cards: [], card_order: ALL_CARDS.map(c => c.id) });
                }}>
                  Reset to Default
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {ALL_CARDS.map(card => (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      isHidden(card.id)
                        ? "border-border bg-muted/30 text-muted-foreground"
                        : "border-primary/30 bg-primary/5 text-foreground"
                    }`}
                  >
                    {isHidden(card.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {card.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Dashboard Sections (ordered) */}
      {orderedCards.map(id => renderCard(id))}

      {/* Trading Plan Modal */}
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
