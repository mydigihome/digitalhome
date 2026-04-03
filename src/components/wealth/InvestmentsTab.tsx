import { useState } from "react";
import { Search, Plus, Trash2, Loader2, TrendingUp, AlertCircle, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";
import { usePlan } from "@/hooks/usePlan";
import LockedFeature from "@/components/LockedFeature";

interface InvestmentInfo {
  ticker: string;
  name: string;
  type: string;
  description: string;
  priceRange: string;
  riskLevel: string;
  sector: string;
  error?: string;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  type: string;
  riskLevel: string;
  priceRange: string;
  targetShares: number;
  perPaycheckAmount: number;
  estimatedPrice: number;
}

const RISK_COLORS: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

const TYPE_COLORS: Record<string, string> = {
  Stock: "bg-violet-100 text-violet-700",
  ETF: "bg-blue-100 text-blue-700",
  "Mutual Fund": "bg-emerald-100 text-emerald-700",
};

function loadWatchlist(): WatchlistItem[] {
  return loadStoredJson<WatchlistItem[]>("wealth_watchlist", []);
}
function saveWatchlist(w: WatchlistItem[]) { saveStoredJson("wealth_watchlist", w); }

export default function InvestmentsTab() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<InvestmentInfo | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const persist = (next: WatchlistItem[]) => { setWatchlist(next); saveWatchlist(next); };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("investment-research", {
        body: { query: searchQuery.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setSearching(false); return; }
      setSearchResult(data as InvestmentInfo);
    } catch (e: any) {
      toast.error(e.message || "Search failed");
    }
    setSearching(false);
  };

  const addToWatchlist = () => {
    if (!searchResult || searchResult.error) return;
    // Parse estimated price from price range
    const priceMatch = searchResult.priceRange.match(/\$?([\d,.]+)/);
    const estPrice = priceMatch ? parseFloat(priceMatch[1].replace(",", "")) : 100;

    const item: WatchlistItem = {
      id: crypto.randomUUID(),
      ticker: searchResult.ticker,
      name: searchResult.name,
      type: searchResult.type,
      riskLevel: searchResult.riskLevel,
      priceRange: searchResult.priceRange,
      targetShares: 1,
      perPaycheckAmount: 50,
      estimatedPrice: estPrice,
    };
    persist([...watchlist, item]);
    setSearchResult(null);
    setSearchQuery("");
    toast.success(`${item.ticker} added to watchlist`);
  };

  const handleDelete = (id: string) => { persist(watchlist.filter(w => w.id !== id)); toast.success("Removed from watchlist"); };

  const updateItem = (id: string, updates: Partial<WatchlistItem>) => {
    const next = watchlist.map(w => w.id === id ? { ...w, ...updates } : w);
    persist(next);
  };

  const totalMonthlyCommitment = watchlist.reduce((s, w) => s + (w.perPaycheckAmount * 2), 0); // assuming bi-weekly pay

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search ticker or company name (e.g. AAPL, Tesla, VOO)..."
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={searching} className="gap-2">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </div>

      {/* Search result card */}
      <AnimatePresence>
        {searchResult && !searchResult.error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-foreground">{searchResult.ticker}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[searchResult.type] || "bg-muted text-foreground"}`}>
                    {searchResult.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[searchResult.riskLevel] || "bg-muted text-foreground"}`}>
                    {searchResult.riskLevel} Risk
                  </span>
                </div>
                <h3 className="font-medium text-foreground">{searchResult.name}</h3>
              </div>
              <span className="text-sm font-semibold text-foreground">{searchResult.priceRange}</span>
            </div>
            <p className="text-sm text-muted-foreground">{searchResult.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Sector: {searchResult.sector}</span>
            </div>
            <Button onClick={addToWatchlist} className="gap-2" size="sm">
              <Plus className="h-4 w-4" /> Add to Watchlist
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watchlist */}
      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3"></div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Your watchlist is empty</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Search for stocks, ETFs, or mutual funds to research and add to your investment watchlist.</p>
        </div>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-foreground">My Watchlist ({watchlist.length})</h3>
          <div className="space-y-3">
            {watchlist.map(w => {
              const sharesSaved = w.estimatedPrice > 0 ? (w.perPaycheckAmount * 2) / w.estimatedPrice : 0; // monthly shares
              const monthsToTarget = sharesSaved > 0 ? Math.ceil((w.targetShares - 0) / sharesSaved) : Infinity;
              const progressPct = w.targetShares > 0 ? Math.min(100, (sharesSaved / w.targetShares) * 100) : 0;

              return (
                <motion.div key={w.id} layout className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-foreground">{w.ticker}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[w.type] || "bg-muted text-foreground"}`}>
                        {w.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[w.riskLevel] || "bg-muted text-foreground"}`}>
                        {w.riskLevel}
                      </span>
                    </div>
                    <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{w.name} · {w.priceRange}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Target Shares</label>
                      <Input
                        type="number"
                        value={w.targetShares}
                        onChange={e => updateItem(w.id, { targetShares: Number(e.target.value) || 0 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Per Paycheck ($)</label>
                      <Input
                        type="number"
                        value={w.perPaycheckAmount}
                        onChange={e => updateItem(w.id, { perPaycheckAmount: Number(e.target.value) || 0 })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span>~{sharesSaved.toFixed(2)} shares/month at current rate</span>
                    <span>{monthsToTarget === Infinity ? "—" : `~${monthsToTarget} months to target`}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Total Monthly Investment Commitment</span>
              </div>
              <span className="text-lg font-bold text-foreground">${totalMonthlyCommitment.toFixed(2)}/mo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on bi-weekly paycheck contributions</p>
          </div>
        </>
      )}
    </div>
  );
}
