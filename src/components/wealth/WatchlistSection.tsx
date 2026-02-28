import { useState } from "react";
import { Search, Star, Plus, Trash2, BarChart3, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";
import { useMarketQuote } from "@/hooks/useMarketData";

export interface WatchlistItem {
  symbol: string;
  name: string;
}

function loadWatchlist(): WatchlistItem[] {
  return loadStoredJson<WatchlistItem[]>("wealth_watchlist_v2", []);
}
function saveWatchlist(w: WatchlistItem[]) {
  saveStoredJson("wealth_watchlist_v2", w);
}

interface WatchlistSectionProps {
  onViewChart: (symbol: string) => void;
}

function WatchlistCard({ item, onRemove, onViewChart }: { item: WatchlistItem; onRemove: () => void; onViewChart: () => void }) {
  const { data } = useMarketQuote(item.symbol);
  const quote = data?.quote;
  const change = parseFloat(quote?.change || "0");
  const pctChange = parseFloat(quote?.percent_change || "0");
  const isUp = change >= 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{item.symbol}</span>
          <span className="text-xs text-muted-foreground truncate">{item.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-medium text-foreground">${quote?.price || "—"}</span>
          {quote && (
            <span className={`text-xs font-medium ${isUp ? "text-success" : "text-destructive"}`}>
              {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{pctChange.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onViewChart}>
        <BarChart3 className="h-3 w-3" />
      </Button>
      <button onClick={onRemove} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
        <Star className="h-3.5 w-3.5 fill-current text-warning" />
      </button>
    </div>
  );
}

export default function WatchlistSection({ onViewChart }: WatchlistSectionProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);
  const [addSymbol, setAddSymbol] = useState("");

  const persist = (next: WatchlistItem[]) => {
    setWatchlist(next);
    saveWatchlist(next);
  };

  const handleAdd = () => {
    const sym = addSymbol.trim().toUpperCase();
    if (!sym) return;
    if (watchlist.length >= 15) {
      toast.error("Max 15 watchlist items");
      return;
    }
    if (watchlist.some((w) => w.symbol === sym)) {
      toast.error("Already in watchlist");
      return;
    }
    persist([...watchlist, { symbol: sym, name: sym }]);
    setAddSymbol("");
    toast.success(`${sym} added to watchlist`);
  };

  const handleRemove = (symbol: string) => {
    persist(watchlist.filter((w) => w.symbol !== symbol));
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Watchlist ({watchlist.length}/15)</h2>
      </div>

      {/* Add to watchlist */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={addSymbol}
            onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add ticker (AAPL, BTC-USD, EURUSD...)"
            className="pl-10 h-9 text-sm"
          />
        </div>
        <Button size="sm" onClick={handleAdd} className="gap-1.5 h-9">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Star className="h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold text-foreground mb-1">Watchlist empty</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Add symbols to track prices without holding them.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {watchlist.map((item) => (
            <WatchlistCard
              key={item.symbol}
              item={item}
              onRemove={() => handleRemove(item.symbol)}
              onViewChart={() => onViewChart(item.symbol)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
