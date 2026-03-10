import { useState } from "react";
import { X, Search, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useAddTradingPair } from "@/hooks/useTradingPairs";
import { toast } from "sonner";

const AVAILABLE_PAIRS = [
  { symbol: "BTC/USD", name: "Bitcoin", category: "Crypto" },
  { symbol: "ETH/USD", name: "Ethereum", category: "Crypto" },
  { symbol: "SOL/USD", name: "Solana", category: "Crypto" },
  { symbol: "AAPL", name: "Apple Inc.", category: "Stocks" },
  { symbol: "TSLA", name: "Tesla Inc.", category: "Stocks" },
  { symbol: "GOOGL", name: "Alphabet Inc.", category: "Stocks" },
  { symbol: "MSFT", name: "Microsoft", category: "Stocks" },
  { symbol: "NVDA", name: "NVIDIA", category: "Stocks" },
  { symbol: "AMZN", name: "Amazon", category: "Stocks" },
  { symbol: "EUR/USD", name: "Euro / US Dollar", category: "Forex" },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", category: "Forex" },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", category: "Forex" },
];

interface AddPairModalProps {
  onClose: () => void;
  existingSymbols: string[];
}

export default function AddPairModal({ onClose, existingSymbols }: AddPairModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const addPair = useAddTradingPair();

  const filtered = AVAILABLE_PAIRS.filter(
    (p) =>
      !existingSymbols.includes(p.symbol) &&
      (p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = async (pair: (typeof AVAILABLE_PAIRS)[0]) => {
    try {
      await addPair.mutateAsync({
        symbol: pair.symbol,
        display_name: pair.name,
        category: pair.category,
      });
      toast.success(`${pair.symbol} added!`);
    } catch {
      toast.error("Failed to add pair");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Add Trading Pair</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search pairs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {["Crypto", "Stocks", "Forex"].map((category) => {
            const categoryPairs = filtered.filter((p) => p.category === category);
            if (categoryPairs.length === 0) return null;

            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
                <div className="space-y-2">
                  {categoryPairs.map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => handleAdd(pair)}
                      disabled={addPair.isPending}
                      className="w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/60 transition text-left flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{pair.symbol}</p>
                        <p className="text-sm text-muted-foreground">{pair.name}</p>
                      </div>
                      <PlusCircle className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100 transition" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No matching pairs found</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
