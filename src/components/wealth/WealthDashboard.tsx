import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, RefreshCw, X, Settings2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useExpenses } from "@/hooks/useExpenses";
import { useLoans } from "@/hooks/useLoans";
import { useMarketQuote } from "@/hooks/useMarketData";
import { useWealthLayout, useUpsertWealthLayout } from "@/hooks/useWealthLayout";
import { getRandomQuote } from "./quotes";
import { Button } from "@/components/ui/button";

// ─── Investment components ───
import PortfolioOverview from "./PortfolioOverview";
import HoldingsSection from "./HoldingsSection";
import WatchlistSection from "./WatchlistSection";
import LiveChart, { TIMEFRAMES } from "./LiveChart";
import TradingPlanModal from "./TradingPlanModal";
import BrokerSection from "./BrokerSection";

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
  { id: "broker", label: "🏛️ Go to Broker" },
] as const;

export default function WealthDashboard() {
  const { profile } = useAuth();
  const { data: finances } = useUserFinances();
  const { data: expenses } = useExpenses();
  const { data: loans } = useLoans();
  const { data: layoutData } = useWealthLayout();
  const upsertLayout = useUpsertWealthLayout();

  const [quote, setQuote] = useState(() => getRandomQuote());
  const [showCustomize, setShowCustomize] = useState(false);
  const firstName = profile?.full_name?.split(" ")[0] || "Friend";

  // Auto-rotate quotes every 30s
  useEffect(() => {
    const interval = setInterval(() => setQuote(getRandomQuote()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Chart state
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);
  const [chartInterval, setChartInterval] = useState("1day");
  const [chartOutputsize, setChartOutputsize] = useState("30");
  const { data: chartData } = useMarketQuote(chartSymbol);

  // Trading plan modal
  const [planTarget, setPlanTarget] = useState<{ symbol: string; name: string; price: number } | null>(null);

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

  const openChart = (symbol: string) => {
    setChartSymbol(symbol);
    setChartInterval("1day");
    setChartOutputsize("30");
  };

  const openTradingPlan = (symbol: string, name: string, price: number) => {
    setPlanTarget({ symbol, name, price });
  };

  // Computed stats for header
  const monthlyIncome = Number(finances?.monthly_income || 0);
  const currentSavings = Number(finances?.current_savings || 0);
  const savingsGoal = Number(finances?.savings_goal || 0);
  const totalDebt = Number(finances?.total_debt || 0) + (loans || []).reduce((s, l) => s + Number(l.amount), 0);
  const debtPaidPct = totalDebt > 0 ? Math.min(100, ((totalDebt - Number(finances?.total_debt || 0)) / totalDebt) * 100) : 0;

  const renderCard = (id: string) => {
    if (isHidden(id)) return null;

    switch (id) {
      case "investments":
        return (
          <div key={id} className="space-y-6">
            <PortfolioOverview />

            {/* Live Chart */}
            <AnimatePresence>
              {chartSymbol && chartData && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{chartSymbol}</h3>
                        <p className="text-xs text-muted-foreground">
                          ${chartData.quote?.price || "—"}
                          {chartData.quote && (
                            <span className={`ml-1 ${parseFloat(chartData.quote.change) >= 0 ? "text-success" : "text-destructive"}`}>
                              {parseFloat(chartData.quote.change) >= 0 ? "+" : ""}{chartData.quote.change} ({chartData.quote.percent_change}%)
                            </span>
                          )}
                          {chartData.mock && <span className="ml-2 text-warning text-[10px]">(mock data — add API key for live)</span>}
                        </p>
                      </div>
                      <button onClick={() => setChartSymbol(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {TIMEFRAMES.map((tf) => (
                        <Button
                          key={tf.label}
                          variant={chartInterval === tf.interval && chartOutputsize === tf.outputsize ? "default" : "ghost"}
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => { setChartInterval(tf.interval); setChartOutputsize(tf.outputsize); }}
                        >
                          {tf.label}
                        </Button>
                      ))}
                    </div>
                    {chartData.timeseries?.length > 0 && (
                      <LiveChart data={chartData.timeseries} symbol={chartSymbol} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
      case "broker":
        return <BrokerSection key={id} />;
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
