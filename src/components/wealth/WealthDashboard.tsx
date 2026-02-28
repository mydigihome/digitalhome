import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, RefreshCw, X, Settings2, GripVertical, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useExpenses } from "@/hooks/useExpenses";
import { useLoans } from "@/hooks/useLoans";
import { useMarketQuote } from "@/hooks/useMarketData";
import { useWealthLayout, useUpsertWealthLayout } from "@/hooks/useWealthLayout";
import { getRandomQuote } from "./quotes";
import { Button } from "@/components/ui/button";

// ─── NEW: Investment components ───
import PortfolioOverview from "./PortfolioOverview";
import HoldingsSection from "./HoldingsSection";
import WatchlistSection from "./WatchlistSection";
import LiveChart, { TIMEFRAMES } from "./LiveChart";
import TradingPlanModal from "./TradingPlanModal";
import BrokerSection from "./BrokerSection";

// ─── ORIGINAL: Financial components ───
import NetWorthHero from "./NetWorthHero";
import DebtOverview from "./DebtOverview";
import SpendingSection from "./SpendingSection";
import SavingsSection from "./SavingsSection";
import BudgetEnvelopes from "./BudgetEnvelopes";
import BillsCalendar from "./BillsCalendar";
import SubscriptionsSection from "./SubscriptionsSection";

// All dashboard cards with labels for customization
const ALL_CARDS = [
  { id: "investments", label: "Investments" },
  { id: "net-worth", label: "Net Worth" },
  { id: "debt", label: "Debt Overview" },
  { id: "spending", label: "Monthly Spending" },
  { id: "budget", label: "Budget Envelopes" },
  { id: "savings", label: "Savings Goals" },
  { id: "bills", label: "Bills & Due Dates" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "broker", label: "Go to Broker" },
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

  // Ensure all cards are in the order
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
      case "net-worth":
        return <NetWorthHero key={id} />;
      case "debt":
        return <DebtOverview key={id} />;
      case "spending":
        return <SpendingSection key={id} />;
      case "budget":
        return <BudgetEnvelopes key={id} />;
      case "savings":
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
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/20 rounded-2xl p-6 border border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{firstName}'s Wealth Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Income: ${Number(finances?.monthly_income || 0).toLocaleString()}/mo · 
              Savings: ${Number(finances?.current_savings || 0).toLocaleString()} · 
              Goal: ${Number(finances?.savings_goal || 0).toLocaleString()}
            </p>
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
        <div className="mt-3 flex items-start gap-2 text-sm">
          <Quote className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="italic text-foreground">"{quote.text}"</span>
            <span className="text-muted-foreground ml-1">— {quote.author}</span>
          </div>
        </div>
      </div>

      {/* Customization Panel */}
      <AnimatePresence>
        {showCustomize && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Customize Dashboard</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_CARDS.map(card => (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
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
