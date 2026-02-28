import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, RefreshCw, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMarketQuote } from "@/hooks/useMarketData";
import { getRandomQuote } from "./quotes";
import { Button } from "@/components/ui/button";
import PortfolioOverview from "./PortfolioOverview";
import HoldingsSection from "./HoldingsSection";
import WatchlistSection from "./WatchlistSection";
import LiveChart, { TIMEFRAMES } from "./LiveChart";
import TradingPlanModal from "./TradingPlanModal";
import BrokerSection from "./BrokerSection";
import DebtOverview from "./DebtOverview";

export default function WealthDashboard() {
  const { profile } = useAuth();
  const [quote, setQuote] = useState(() => getRandomQuote());
  const firstName = profile?.full_name?.split(" ")[0] || "Friend";

  // Chart state
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);
  const [chartInterval, setChartInterval] = useState("1day");
  const [chartOutputsize, setChartOutputsize] = useState("30");
  const { data: chartData } = useMarketQuote(chartSymbol);

  // Trading plan modal
  const [planTarget, setPlanTarget] = useState<{ symbol: string; name: string; price: number } | null>(null);

  const openChart = (symbol: string) => {
    setChartSymbol(symbol);
    setChartInterval("1day");
    setChartOutputsize("30");
  };

  const openTradingPlan = (symbol: string, name: string, price: number) => {
    setPlanTarget({ symbol, name, price });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/20 rounded-2xl p-6 border border-border">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{firstName}'s Wealth Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">Investments · Trading · Debt Management</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setQuote(getRandomQuote())} className="rounded-xl" title="New quote">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-3 flex items-start gap-2 text-sm">
          <Quote className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="italic text-foreground">"{quote.text}"</span>
            <span className="text-muted-foreground ml-1">— {quote.author}</span>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 1: INVESTMENTS ═══ */}
      <div className="space-y-6">
        {/* Portfolio Overview */}
        <PortfolioOverview />

        {/* Live Chart (when a symbol is selected) */}
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

                {/* Timeframe buttons */}
                <div className="flex gap-1 mb-3">
                  {TIMEFRAMES.map((tf) => (
                    <Button
                      key={tf.label}
                      variant={chartInterval === tf.interval && chartOutputsize === tf.outputsize ? "default" : "ghost"}
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => {
                        setChartInterval(tf.interval);
                        setChartOutputsize(tf.outputsize);
                      }}
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

        {/* My Holdings */}
        <HoldingsSection onViewChart={openChart} onTradingPlan={openTradingPlan} />

        {/* Watchlist */}
        <WatchlistSection onViewChart={openChart} />

        {/* Go to Broker */}
        <BrokerSection />
      </div>

      {/* ═══ SECTION 2: DEBT OVERVIEW ═══ */}
      <DebtOverview />

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
