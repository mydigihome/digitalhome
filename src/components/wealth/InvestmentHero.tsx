import { useState, useEffect, useRef } from "react";
import { Search, Star, TrendingUp, TrendingDown, ExternalLink, FileText, ChevronDown, X, Settings, Check, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketQuote, useSymbolSearch } from "@/hooks/useMarketData";
import { useInvestments } from "@/hooks/useInvestments";
import LiveChart, { TIMEFRAMES } from "./LiveChart";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";
import { toast } from "sonner";
import type { WatchlistItem } from "./WatchlistSection";

// ── Broker helpers ──
const BROKERS = [
  { name: "Webull", url: "https://www.webull.com" },
  { name: "Robinhood", url: "https://robinhood.com" },
  { name: "Fidelity", url: "https://www.fidelity.com" },
  { name: "Schwab", url: "https://www.schwab.com" },
  { name: "TD Ameritrade", url: "https://www.tdameritrade.com" },
  { name: "Interactive Brokers", url: "https://www.interactivebrokers.com" },
  { name: "E*TRADE", url: "https://us.etrade.com" },
];

interface BrokerConfig { name: string; url: string; }
function loadBroker(): BrokerConfig {
  return loadStoredJson<BrokerConfig>("wealth_broker", BROKERS[0]);
}

// ── Watchlist helpers ──
function loadWatchlist(): WatchlistItem[] {
  return loadStoredJson<WatchlistItem[]>("wealth_watchlist_v2", []);
}
function saveWatchlist(w: WatchlistItem[]) {
  saveStoredJson("wealth_watchlist_v2", w);
}

interface InvestmentHeroProps {
  onOpenTradingPlan: (symbol: string, name: string, price: number) => void;
}

export default function InvestmentHero({ onOpenTradingPlan }: InvestmentHeroProps) {
  const { data: investments } = useInvestments();

  // Default symbol: largest holding or AAPL
  const defaultSymbol = investments?.length
    ? investments.reduce((best, inv) => {
        const val = Number(inv.current_price || inv.purchase_price) * Number(inv.quantity);
        const bestVal = Number(best.current_price || best.purchase_price) * Number(best.quantity);
        return val > bestVal ? inv : best;
      }).ticker_symbol || "AAPL"
    : "AAPL";

  const [activeSymbol, setActiveSymbol] = useState(defaultSymbol);
  const [chartInterval, setChartInterval] = useState("1day");
  const [chartOutputsize, setChartOutputsize] = useState("30");
  const { data: marketData } = useMarketQuote(activeSymbol);

  // Search dropdown
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults } = useSymbolSearch(searchQuery);
  const searchRef = useRef<HTMLDivElement>(null);

  // Broker
  const [broker, setBroker] = useState<BrokerConfig>(loadBroker);
  const [brokerOpen, setBrokerOpen] = useState(false);

  // Watchlist state (for starring)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isInWatchlist = (sym: string) => watchlist.some(w => w.symbol === sym);

  const toggleWatchlist = (sym: string, name: string) => {
    let next: WatchlistItem[];
    if (isInWatchlist(sym)) {
      next = watchlist.filter(w => w.symbol !== sym);
      toast.success(`${sym} removed from watchlist`);
    } else {
      if (watchlist.length >= 15) { toast.error("Max 15 watchlist items"); return; }
      next = [...watchlist, { symbol: sym, name }];
      toast.success(`${sym} added to watchlist `);
    }
    setWatchlist(next);
    saveWatchlist(next);
  };

  const selectSymbol = (sym: string) => {
    setActiveSymbol(sym);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const selectBroker = (b: BrokerConfig) => {
    setBroker(b);
    saveStoredJson("wealth_broker", b);
    setBrokerOpen(false);
  };

  const quote = marketData?.quote;
  const change = parseFloat(quote?.change || "0");
  const isUp = change >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* ── Top bar: search + broker + trading plan ── */}
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border bg-muted/30">
        {/* Symbol search dropdown */}
        <div ref={searchRef} className="relative flex-1 min-w-[200px]">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-foreground">{activeSymbol}</span>
              {quote && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ${quote.price}
                  <span className={`ml-1 font-medium ${isUp ? "text-success" : "text-destructive"}`}>
                    {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{quote.percent_change}%
                  </span>
                </span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${searchOpen ? "rotate-180" : ""}`} />
          </div>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
              >
                <div className="p-2 border-b border-border">
                  <Input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value.toUpperCase())}
                    placeholder="Search stocks, crypto, forex..."
                    className="h-8 text-sm"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {/* User's holdings first */}
                  {investments?.length && !searchQuery && (
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Your Holdings</p>
                      {investments.map(inv => {
                        const sym = inv.ticker_symbol || inv.asset_name;
                        return (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer group"
                          >
                            <div className="flex-1 min-w-0" onClick={() => selectSymbol(sym)}>
                              <span className="text-sm font-semibold text-foreground">{sym}</span>
                              <span className="text-xs text-muted-foreground ml-2 truncate">{inv.asset_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); onOpenTradingPlan(sym, inv.asset_name, Number(inv.current_price || inv.purchase_price)); }}
                                className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Create Trading Plan"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleWatchlist(sym, inv.asset_name); }}
                                className="p-1 rounded hover:bg-warning/10"
                                title={isInWatchlist(sym) ? "Remove from watchlist" : "Add to watchlist"}
                              >
                                <Star className={`h-3.5 w-3.5 ${isInWatchlist(sym) ? "fill-warning text-warning" : "text-muted-foreground hover:text-warning"}`} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Watchlist items */}
                  {watchlist.length > 0 && !searchQuery && (
                    <div className="p-2 border-t border-border">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1"> Watchlist</p>
                      {watchlist.map(w => (
                        <div
                          key={w.symbol}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0" onClick={() => selectSymbol(w.symbol)}>
                            <span className="text-sm font-semibold text-foreground">{w.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-2">{w.name}</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleWatchlist(w.symbol, w.name); }}
                            className="p-1 rounded hover:bg-warning/10"
                          >
                            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search results */}
                  {searchQuery && searchResults?.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Results</p>
                      {searchResults.slice(0, 10).map((r: any) => (
                        <div
                          key={r.symbol}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer group"
                        >
                          <div className="flex-1 min-w-0" onClick={() => selectSymbol(r.symbol)}>
                            <span className="text-sm font-semibold text-foreground">{r.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-2 truncate">{r.instrument_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); onOpenTradingPlan(r.symbol, r.instrument_name, 0); }}
                              className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Create Trading Plan"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleWatchlist(r.symbol, r.instrument_name); }}
                              className="p-1 rounded hover:bg-warning/10"
                            >
                              <Star className={`h-3.5 w-3.5 ${isInWatchlist(r.symbol) ? "fill-warning text-warning" : "text-muted-foreground hover:text-warning"}`} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery && (!searchResults || searchResults.length === 0) && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {searchQuery.length < 1 ? "Type to search..." : "No results found"}
                    </div>
                  )}

                  {!searchQuery && !investments?.length && !watchlist.length && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Type a symbol to search (AAPL, BTC-USD, EURUSD...)
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trading Plan button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-9 shrink-0"
          onClick={() => {
            const price = parseFloat(quote?.price || "0");
            onOpenTradingPlan(activeSymbol, quote?.name || activeSymbol, price);
          }}
        >
          <FileText className="h-3.5 w-3.5" /> Trading Plan
        </Button>

        {/* Star for watchlist */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => toggleWatchlist(activeSymbol, quote?.name || activeSymbol)}
          title={isInWatchlist(activeSymbol) ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Star className={`h-4 w-4 ${isInWatchlist(activeSymbol) ? "fill-warning text-warning" : "text-muted-foreground"}`} />
        </Button>

        {/* Broker button */}
        <div className="relative">
          <Button
            size="sm"
            className="gap-1.5 h-9 shrink-0"
            onClick={() => window.open(broker.url, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5" /> {broker.name}
          </Button>
          <button
            onClick={() => setBrokerOpen(!brokerOpen)}
            className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-muted border border-border hover:bg-accent"
            title="Change broker"
          >
            <Settings className="h-2.5 w-2.5 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {brokerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 top-full mt-2 right-0 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
              >
                {BROKERS.map(b => (
                  <button
                    key={b.name}
                    onClick={() => selectBroker(b)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted/50 ${broker.name === b.name ? "text-primary font-medium" : "text-foreground"}`}
                  >
                    {b.name}
                    {broker.name === b.name && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Chart area (always visible) ── */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">{activeSymbol}</h3>
            {quote && (
              <p className="text-sm">
                <span className="font-semibold text-foreground">${quote.price}</span>
                <span className={`ml-2 font-medium ${isUp ? "text-success" : "text-destructive"}`}>
                  {isUp ? <TrendingUp className="inline h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="inline h-3.5 w-3.5 mr-0.5" />}
                  {isUp ? "+" : ""}{quote.change} ({quote.percent_change}%)
                </span>
                {marketData?.mock && <span className="ml-2 text-warning text-[10px]">(mock — add API key for live)</span>}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {TIMEFRAMES.map(tf => (
              <Button
                key={tf.label}
                variant={chartInterval === tf.interval && chartOutputsize === tf.outputsize ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={() => { setChartInterval(tf.interval); setChartOutputsize(tf.outputsize); }}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>

        {marketData?.timeseries?.length ? (
          <LiveChart data={marketData.timeseries} symbol={activeSymbol} />
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Loading chart data...</p>
              <p className="text-xs mt-1">Make sure your API key is configured in Settings</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
