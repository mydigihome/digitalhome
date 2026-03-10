import { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateTradingPlan } from "@/hooks/useTradingPlans";
import { TradingPair } from "@/hooks/useTradingPairs";
import { toast } from "sonner";

interface CreatePlanModalProps {
  pair: TradingPair;
  currentPrice?: number;
  onClose: () => void;
}

const TIMEFRAMES = [
  { value: "1_month", label: "1 Month", desc: "Short-term trade" },
  { value: "3_months", label: "3 Months", desc: "Medium-term position" },
  { value: "6_months", label: "6 Months", desc: "Long-term hold" },
  { value: "1_year", label: "1 Year", desc: "Investment position" },
];

export default function CreatePlanModal({ pair, currentPrice, onClose }: CreatePlanModalProps) {
  const [timeframe, setTimeframe] = useState("3_months");
  const [entryPrice, setEntryPrice] = useState(currentPrice?.toString() || "");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [notes, setNotes] = useState("");
  const createPlan = useCreateTradingPlan();

  const entry = parseFloat(entryPrice) || 0;
  const target = parseFloat(targetPrice) || 0;
  const potentialGain = entry > 0 && target > 0 ? (((target - entry) / entry) * 100).toFixed(2) : null;

  const handleCreate = async () => {
    if (!entryPrice || !targetPrice) {
      toast.error("Please fill in entry and target prices");
      return;
    }
    try {
      await createPlan.mutateAsync({
        symbol: pair.symbol,
        asset_name: pair.display_name,
        current_price: currentPrice || null,
        entry_price: entry,
        target_price: target,
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        position_size: null,
        total_investment: null,
        take_profit_1: target,
        take_profit_2: null,
        risk_reward_ratio: null,
        strategy_notes: notes || null,
        time_frame: timeframe,
        status: "active",
        trading_pair_id: pair.id,
        completed_at: null,
      });
      toast.success("Trading plan created!");
      onClose();
    } catch {
      toast.error("Failed to create plan");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-foreground">Create Trading Plan</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">Plan your trade for {pair.symbol}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Timeframe */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Timeframe</Label>
            <div className="grid grid-cols-2 gap-3">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    timeframe === tf.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <p className="font-semibold text-sm text-foreground">{tf.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tf.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Entry Price */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Entry Price</Label>
            <Input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Target Price */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Target Price</Label>
            <Input
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="0.00"
            />
            {potentialGain && (
              <p className="text-xs mt-2 font-semibold" style={{ color: parseFloat(potentialGain) >= 0 ? "#10B981" : "#EF4444" }}>
                Potential {parseFloat(potentialGain) >= 0 ? "gain" : "loss"}: {potentialGain}%
              </p>
            )}
          </div>

          {/* Stop Loss */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Stop Loss (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Strategy, reasoning, reminders..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createPlan.isPending} className="flex-1">
            {createPlan.isPending ? "Creating..." : "Create Plan"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
