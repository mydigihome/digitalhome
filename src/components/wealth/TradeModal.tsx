import { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TradingPair } from "@/hooks/useTradingPairs";
import { toast } from "sonner";

interface TradeModalProps {
  pair: TradingPair;
  onClose: () => void;
}

export default function TradeModal({ pair, onClose }: TradeModalProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  const handleTrade = (side: "buy" | "sell") => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    toast.success(
      `${side === "buy" ? "Buy" : "Sell"} order for ${amount} ${pair.symbol} placed!`
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-3xl p-6 w-full max-w-md mx-4 shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Trade {pair.symbol}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Order Type */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <div className="flex gap-3">
              <button
                onClick={() => setOrderType("market")}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                  orderType === "market"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType("limit")}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                  orderType === "limit"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>

          {/* Limit Price */}
          {orderType === "limit" && (
            <div className="space-y-2">
              <Label>Limit Price</Label>
              <Input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Buy / Sell */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleTrade("buy")}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors"
              style={{ backgroundColor: "#10B981", color: "#fff" }}
            >
              Buy
            </button>
            <button
              onClick={() => handleTrade("sell")}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors"
              style={{ backgroundColor: "#EF4444", color: "#fff" }}
            >
              Sell
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
