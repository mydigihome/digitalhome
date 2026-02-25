import { useState } from "react";
import { Search, Plus, Trash2, Loader2, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

interface InvestmentInfo {
  ticker: string; name: string; type: string; description: string;
  priceRange: string; riskLevel: string; sector: string; error?: string;
}

interface WatchlistItem {
  id: string; ticker: string; name: string; type: string; riskLevel: string;
  priceRange: string; targetShares: number; perPaycheckAmount: number; estimatedPrice: number;
}

const RISK_COLORS: Record<string, string> = { Low: "bg-emerald-100 text-emerald-700", Medium: "bg-amber-100 text-amber-700", High: "bg-red-100 text-red-700" };
const TYPE_COLORS: Record<string, string> = { Stock: "bg-violet-100 text-violet-700", ETF: "bg-blue-100 text-blue-700", "Mutual Fund": "bg-emerald-100 text-emerald-700" };

function loadWatchlist(): WatchlistItem[] { return loadStoredJson<WatchlistItem[]>("wealth_watchlist", []); }
function saveWatchlist(w: WatchlistItem[]) { saveStoredJson("wealth_watchlist", w); }

export default function InvestmentsSection() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<InvestmentInfo | null>(null);

  const persist = (next: WatchlistItem[]) => { setWatchlist(next); saveWatchlist(next); };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true); setSearchResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("investment-research", { body: { query: searchQuery.trim() } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setSearching(false); return; }
      setSearchResult(data as InvestmentInfo);
    } catch (e: any) { toast.error(e.message || "Search failed"); }
    setSearching(false);
  };

  const addToWatchlist = () => {
    if (!searchResult || searchResult.error) return;
    const priceMatch = searchResult.priceRange.match(/\$?([\d,.]+)/);
    const estPrice = priceMatch ? parseFloat(priceMatch[1].replace(",", "")) : 100;
    persist([...watchlist, { id: crypto.randomUUID(), ticker: searchResult.ticker, name: searchResult.name, type: searchResult.type, riskLevel: searchResult.riskLevel, priceRange: searchResult.priceRange, targetShares: 1, perPaycheckAmount: 50, estimatedPrice: estPrice }]);
    setSearchResult(null); setSearchQuery("");
    toast.success(`${searchResult.ticker} added`);
  };

  const handleDelete = (id: string) => { persist(watchlist.filter(w => w.id !== id)); };
  const updateItem = (id: string, updates: Partial<WatchlistItem>) => persist(watchlist.map(w => w.id === id ? { ...w, ...updates } : w));
  const totalMonthly = watchlist.reduce((s, w) => s + (w.perPaycheckAmount * 2), 0);

  return (
    <section id="investments">
      <h2 className="text-lg font-semibold text-foreground mb-4">Investment Watchlist</h2>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="Search ticker or company (AAPL, Tesla, VOO)..." className="pl-10 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={handleSearch} disabled={searching} className="gap-1.5 h-9">
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Search
        </Button>
      </div>

      <AnimatePresence>
        {searchResult && !searchResult.error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-xl border border-border bg-card p-5 space-y-3 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-foreground">{searchResult.ticker}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[searchResult.type] || "bg-muted text-foreground"}`}>{searchResult.type}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${RISK_COLORS[searchResult.riskLevel] || "bg-muted text-foreground"}`}>{searchResult.riskLevel} Risk</span>
                </div>
                <h3 className="text-sm font-medium text-foreground">{searchResult.name}</h3>
              </div>
              <span className="text-sm font-semibold text-foreground">{searchResult.priceRange}</span>
            </div>
            <p className="text-xs text-muted-foreground">{searchResult.description}</p>
            <p className="text-[11px] text-muted-foreground">Sector: {searchResult.sector}</p>
            <Button size="sm" onClick={addToWatchlist} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add to Watchlist</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="text-4xl mb-3">📈</div>
          <h3 className="text-base font-semibold text-foreground mb-1">Your watchlist is empty</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Search for stocks, ETFs, or mutual funds to plan your investments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map(w => {
            const sharesMo = w.estimatedPrice > 0 ? (w.perPaycheckAmount * 2) / w.estimatedPrice : 0;
            const monthsToTarget = sharesMo > 0 ? Math.ceil(w.targetShares / sharesMo) : Infinity;
            return (
              <div key={w.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{w.ticker}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[w.type] || "bg-muted text-foreground"}`}>{w.type}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${RISK_COLORS[w.riskLevel] || "bg-muted text-foreground"}`}>{w.riskLevel}</span>
                  </div>
                  <button onClick={() => handleDelete(w.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
                <p className="text-xs text-muted-foreground">{w.name} · {w.priceRange}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[11px] text-muted-foreground block mb-0.5">Target Shares</label><Input type="number" value={w.targetShares} onChange={e => updateItem(w.id, { targetShares: Number(e.target.value) || 0 })} className="h-7 text-xs" /></div>
                  <div><label className="text-[11px] text-muted-foreground block mb-0.5">Per Paycheck ($)</label><Input type="number" value={w.perPaycheckAmount} onChange={e => updateItem(w.id, { perPaycheckAmount: Number(e.target.value) || 0 })} className="h-7 text-xs" /></div>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                  <span>~{sharesMo.toFixed(2)} shares/mo</span>
                  <span>{monthsToTarget === Infinity ? "—" : `~${monthsToTarget}mo to target`}</span>
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-sm font-semibold text-foreground">Total Monthly Investment</span></div>
            <span className="text-base font-bold text-foreground">${totalMonthly.toFixed(2)}/mo</span>
          </div>
        </div>
      )}
    </section>
  );
}
