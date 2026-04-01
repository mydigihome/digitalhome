import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { TradingPair } from "@/hooks/useTradingPairs";
import { toast } from "sonner";

const BROKERS = [
  { name: "Bull (Futures)", url: "https://www.bullmarkets.com", logo: "🐂" },
  { name: "TopStepX", url: "https://www.topstepx.com", logo: "" },
  { name: "Vanguard", url: "https://www.vanguard.com", logo: "" },
  { name: "Fidelity", url: "https://www.fidelity.com", logo: "" },
  { name: "Charles Schwab", url: "https://www.schwab.com", logo: "" },
  { name: "TD Ameritrade", url: "https://www.tdameritrade.com", logo: "" },
  { name: "Interactive Brokers", url: "https://www.interactivebrokers.com", logo: "🌐" },
  { name: "Robinhood", url: "https://www.robinhood.com", logo: "" },
  { name: "Coinbase (Crypto)", url: "https://www.coinbase.com", logo: "₿" },
  { name: "Binance (Crypto)", url: "https://www.binance.com", logo: "🔶" },
];

interface BrokerSelectionModalProps {
  pair: TradingPair | null;
  onClose: () => void;
}

export default function BrokerSelectionModal({ pair, onClose }: BrokerSelectionModalProps) {
  const [customUrl, setCustomUrl] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleBrokerClick = (broker: (typeof BROKERS)[0]) => {
    window.open(broker.url, "_blank");
    toast.success(`Opening ${broker.name}...`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Select Your Broker</h2>
              {pair && <p className="text-sm text-muted-foreground mt-1">Trade {pair.symbol}</p>}
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {BROKERS.map((broker) => (
              <button
                key={broker.name}
                onClick={() => handleBrokerClick(broker)}
                className="p-4 bg-muted/30 rounded-xl hover:bg-muted/60 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{broker.logo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{broker.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{broker.url.replace("https://www.", "")}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </div>
              </button>
            ))}
          </div>

          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition"
            >
              + Add Custom Broker
            </button>
          ) : (
            <div className="space-y-3">
              <Input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-broker.com"
                autoFocus
              />
              <button
                onClick={() => {
                  if (customUrl) {
                    window.open(customUrl.startsWith("http") ? customUrl : `https://${customUrl}`, "_blank");
                    onClose();
                  }
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold transition"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                Open Broker
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
