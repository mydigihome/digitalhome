import { useState } from "react";
import { X, Search, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useAddTradingPair } from "@/hooks/useTradingPairs";
import { toast } from "sonner";

const COMPREHENSIVE_ASSETS = [
  // Crypto
  { symbol: "BTC/USD", name: "Bitcoin", category: "Crypto" },
  { symbol: "ETH/USD", name: "Ethereum", category: "Crypto" },
  { symbol: "SOL/USD", name: "Solana", category: "Crypto" },
  { symbol: "ADA/USD", name: "Cardano", category: "Crypto" },
  { symbol: "XRP/USD", name: "Ripple", category: "Crypto" },
  { symbol: "DOT/USD", name: "Polkadot", category: "Crypto" },
  { symbol: "AVAX/USD", name: "Avalanche", category: "Crypto" },
  { symbol: "MATIC/USD", name: "Polygon", category: "Crypto" },
  { symbol: "LINK/USD", name: "Chainlink", category: "Crypto" },
  { symbol: "UNI/USD", name: "Uniswap", category: "Crypto" },
  { symbol: "DOGE/USD", name: "Dogecoin", category: "Crypto" },
  { symbol: "SHIB/USD", name: "Shiba Inu", category: "Crypto" },
  { symbol: "LTC/USD", name: "Litecoin", category: "Crypto" },
  { symbol: "ATOM/USD", name: "Cosmos", category: "Crypto" },
  { symbol: "APT/USD", name: "Aptos", category: "Crypto" },
  { symbol: "ARB/USD", name: "Arbitrum", category: "Crypto" },
  { symbol: "OP/USD", name: "Optimism", category: "Crypto" },
  { symbol: "SUI/USD", name: "Sui", category: "Crypto" },
  { symbol: "FIL/USD", name: "Filecoin", category: "Crypto" },
  { symbol: "NEAR/USD", name: "NEAR Protocol", category: "Crypto" },

  // US Stocks - Tech
  { symbol: "AAPL", name: "Apple Inc.", category: "Stocks" },
  { symbol: "MSFT", name: "Microsoft Corp.", category: "Stocks" },
  { symbol: "GOOGL", name: "Alphabet Inc.", category: "Stocks" },
  { symbol: "AMZN", name: "Amazon.com Inc.", category: "Stocks" },
  { symbol: "TSLA", name: "Tesla Inc.", category: "Stocks" },
  { symbol: "NVDA", name: "NVIDIA Corp.", category: "Stocks" },
  { symbol: "META", name: "Meta Platforms", category: "Stocks" },
  { symbol: "NFLX", name: "Netflix Inc.", category: "Stocks" },
  { symbol: "AMD", name: "Advanced Micro Devices", category: "Stocks" },
  { symbol: "INTC", name: "Intel Corp.", category: "Stocks" },
  { symbol: "CRM", name: "Salesforce Inc.", category: "Stocks" },
  { symbol: "ADBE", name: "Adobe Inc.", category: "Stocks" },
  { symbol: "ORCL", name: "Oracle Corp.", category: "Stocks" },
  { symbol: "CSCO", name: "Cisco Systems", category: "Stocks" },
  { symbol: "AVGO", name: "Broadcom Inc.", category: "Stocks" },
  { symbol: "QCOM", name: "Qualcomm Inc.", category: "Stocks" },
  { symbol: "UBER", name: "Uber Technologies", category: "Stocks" },
  { symbol: "SQ", name: "Block Inc.", category: "Stocks" },
  { symbol: "SHOP", name: "Shopify Inc.", category: "Stocks" },
  { symbol: "SNOW", name: "Snowflake Inc.", category: "Stocks" },
  { symbol: "PLTR", name: "Palantir Technologies", category: "Stocks" },
  { symbol: "NET", name: "Cloudflare Inc.", category: "Stocks" },
  { symbol: "SPOT", name: "Spotify Technology", category: "Stocks" },
  { symbol: "PINS", name: "Pinterest Inc.", category: "Stocks" },
  { symbol: "SNAP", name: "Snap Inc.", category: "Stocks" },

  // US Stocks - Finance & Healthcare
  { symbol: "JPM", name: "JPMorgan Chase", category: "Stocks" },
  { symbol: "BAC", name: "Bank of America", category: "Stocks" },
  { symbol: "WFC", name: "Wells Fargo", category: "Stocks" },
  { symbol: "GS", name: "Goldman Sachs", category: "Stocks" },
  { symbol: "MS", name: "Morgan Stanley", category: "Stocks" },
  { symbol: "V", name: "Visa Inc.", category: "Stocks" },
  { symbol: "MA", name: "Mastercard Inc.", category: "Stocks" },
  { symbol: "PYPL", name: "PayPal Holdings", category: "Stocks" },
  { symbol: "JNJ", name: "Johnson & Johnson", category: "Stocks" },
  { symbol: "UNH", name: "UnitedHealth Group", category: "Stocks" },
  { symbol: "PFE", name: "Pfizer Inc.", category: "Stocks" },
  { symbol: "ABBV", name: "AbbVie Inc.", category: "Stocks" },
  { symbol: "MRK", name: "Merck & Co.", category: "Stocks" },
  { symbol: "LLY", name: "Eli Lilly", category: "Stocks" },
  { symbol: "TMO", name: "Thermo Fisher Scientific", category: "Stocks" },

  // US Stocks - Consumer & Industrial
  { symbol: "WMT", name: "Walmart Inc.", category: "Stocks" },
  { symbol: "HD", name: "Home Depot", category: "Stocks" },
  { symbol: "COST", name: "Costco Wholesale", category: "Stocks" },
  { symbol: "NKE", name: "Nike Inc.", category: "Stocks" },
  { symbol: "SBUX", name: "Starbucks Corp.", category: "Stocks" },
  { symbol: "MCD", name: "McDonald's Corp.", category: "Stocks" },
  { symbol: "DIS", name: "Walt Disney Co.", category: "Stocks" },
  { symbol: "PG", name: "Procter & Gamble", category: "Stocks" },
  { symbol: "KO", name: "Coca-Cola Co.", category: "Stocks" },
  { symbol: "PEP", name: "PepsiCo Inc.", category: "Stocks" },
  { symbol: "BA", name: "Boeing Co.", category: "Stocks" },
  { symbol: "CAT", name: "Caterpillar Inc.", category: "Stocks" },
  { symbol: "GE", name: "General Electric", category: "Stocks" },
  { symbol: "F", name: "Ford Motor Co.", category: "Stocks" },
  { symbol: "GM", name: "General Motors", category: "Stocks" },

  // US Stocks - Energy
  { symbol: "XOM", name: "Exxon Mobil", category: "Stocks" },
  { symbol: "CVX", name: "Chevron Corp.", category: "Stocks" },
  { symbol: "COP", name: "ConocoPhillips", category: "Stocks" },
  { symbol: "SLB", name: "Schlumberger", category: "Stocks" },
  { symbol: "EOG", name: "EOG Resources", category: "Stocks" },

  // Forex
  { symbol: "EUR/USD", name: "Euro / US Dollar", category: "Forex" },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", category: "Forex" },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", category: "Forex" },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", category: "Forex" },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", category: "Forex" },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", category: "Forex" },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", category: "Forex" },
  { symbol: "EUR/GBP", name: "Euro / British Pound", category: "Forex" },
  { symbol: "EUR/JPY", name: "Euro / Japanese Yen", category: "Forex" },
  { symbol: "GBP/JPY", name: "British Pound / Japanese Yen", category: "Forex" },
  { symbol: "EUR/AUD", name: "Euro / Australian Dollar", category: "Forex" },
  { symbol: "USD/MXN", name: "US Dollar / Mexican Peso", category: "Forex" },
  { symbol: "USD/ZAR", name: "US Dollar / South African Rand", category: "Forex" },
  { symbol: "USD/SGD", name: "US Dollar / Singapore Dollar", category: "Forex" },
  { symbol: "USD/HKD", name: "US Dollar / Hong Kong Dollar", category: "Forex" },

  // ETFs
  { symbol: "SPY", name: "SPDR S&P 500 ETF", category: "ETFs" },
  { symbol: "QQQ", name: "Invesco QQQ (NASDAQ 100)", category: "ETFs" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", category: "ETFs" },
  { symbol: "VTI", name: "Vanguard Total Stock Market", category: "ETFs" },
  { symbol: "IWM", name: "iShares Russell 2000", category: "ETFs" },
  { symbol: "DIA", name: "SPDR Dow Jones ETF", category: "ETFs" },
  { symbol: "VEA", name: "Vanguard FTSE Developed Markets", category: "ETFs" },
  { symbol: "VWO", name: "Vanguard FTSE Emerging Markets", category: "ETFs" },
  { symbol: "ARKK", name: "ARK Innovation ETF", category: "ETFs" },
  { symbol: "XLK", name: "Technology Select Sector SPDR", category: "ETFs" },
  { symbol: "XLF", name: "Financial Select Sector SPDR", category: "ETFs" },
  { symbol: "XLE", name: "Energy Select Sector SPDR", category: "ETFs" },
  { symbol: "XLV", name: "Health Care Select Sector SPDR", category: "ETFs" },
  { symbol: "GLD", name: "SPDR Gold Shares", category: "ETFs" },
  { symbol: "SLV", name: "iShares Silver Trust", category: "ETFs" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury", category: "ETFs" },
  { symbol: "BND", name: "Vanguard Total Bond Market", category: "ETFs" },
  { symbol: "SCHD", name: "Schwab US Dividend Equity", category: "ETFs" },
  { symbol: "VIG", name: "Vanguard Dividend Appreciation", category: "ETFs" },
  { symbol: "JEPI", name: "JPMorgan Equity Premium Income", category: "ETFs" },

  // Mutual Funds
  { symbol: "VFIAX", name: "Vanguard 500 Index Fund", category: "Mutual Funds" },
  { symbol: "FXAIX", name: "Fidelity 500 Index Fund", category: "Mutual Funds" },
  { symbol: "VTSAX", name: "Vanguard Total Stock Market Index", category: "Mutual Funds" },
  { symbol: "VBTLX", name: "Vanguard Total Bond Market Index", category: "Mutual Funds" },
  { symbol: "VTIAX", name: "Vanguard Total International Stock", category: "Mutual Funds" },
  { symbol: "SWPPX", name: "Schwab S&P 500 Index Fund", category: "Mutual Funds" },
  { symbol: "SWTSX", name: "Schwab Total Stock Market Index", category: "Mutual Funds" },
  { symbol: "FSKAX", name: "Fidelity Total Market Index", category: "Mutual Funds" },
  { symbol: "VWELX", name: "Vanguard Wellington Fund", category: "Mutual Funds" },
  { symbol: "VWINX", name: "Vanguard Wellesley Income", category: "Mutual Funds" },

  // Futures
  { symbol: "ES", name: "E-mini S&P 500 Futures", category: "Futures" },
  { symbol: "NQ", name: "E-mini NASDAQ 100 Futures", category: "Futures" },
  { symbol: "YM", name: "E-mini Dow Jones Futures", category: "Futures" },
  { symbol: "RTY", name: "E-mini Russell 2000 Futures", category: "Futures" },
  { symbol: "CL", name: "Crude Oil Futures", category: "Futures" },
  { symbol: "GC", name: "Gold Futures", category: "Futures" },
  { symbol: "SI", name: "Silver Futures", category: "Futures" },
  { symbol: "NG", name: "Natural Gas Futures", category: "Futures" },
  { symbol: "ZB", name: "30-Year Treasury Bond Futures", category: "Futures" },
  { symbol: "6E", name: "Euro FX Futures", category: "Futures" },
];

const CATEGORIES = ["All", "Crypto", "Stocks", "Forex", "ETFs", "Mutual Funds", "Futures"];

interface AddPairModalProps {
  onClose: () => void;
  existingSymbols: string[];
}

export default function AddPairModal({ onClose, existingSymbols }: AddPairModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const addPair = useAddTradingPair();

  const filtered = COMPREHENSIVE_ASSETS.filter((a) => {
    const matchesQuery =
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !category || a.category === category;
    const notAdded = !existingSymbols.includes(a.symbol);
    return matchesQuery && matchesCategory && notAdded;
  }).slice(0, 50);

  const handleAdd = async (pair: (typeof COMPREHENSIVE_ASSETS)[0]) => {
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
        className="bg-card rounded-3xl border border-border shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Add Trading Pair</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === "All" ? null : cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  (!category && cat === "All") || category === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {CATEGORIES.filter((c) => c !== "All").map((catName) => {
            const catPairs = filtered.filter((p) => p.category === catName);
            if (catPairs.length === 0) return null;

            return (
              <div key={catName} className="mb-6 last:mb-0">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {catName} ({catPairs.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catPairs.map((pair) => (
                    <button
                      key={pair.symbol}
                      onClick={() => handleAdd(pair)}
                      disabled={addPair.isPending}
                      className="p-3.5 bg-muted/30 rounded-xl hover:bg-muted/60 transition text-left flex items-center justify-between group"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground">{pair.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate">{pair.name}</p>
                      </div>
                      <PlusCircle className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100 transition flex-shrink-0 ml-2" />
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
