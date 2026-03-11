import { useState, useMemo } from "react";
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
  const [totalInvestment, setTotalInvestment] = useState("");
  const [riskPercent, setRiskPercent] = useState("2");
  const createPlan = useCreateTradingPlan();

  const risk = useMemo(() => {
    const investment = parseFloat(totalInvestment);
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);
    const target = parseFloat(targetPrice);
    const riskPct = parseFloat(riskPercent);

    if (!investment || !entry || !stop || !target || !riskPct) return null;

    const riskAmount = investment * (riskPct / 100);
    const potentialLoss = Math.abs((entry - stop) / entry) * 100;
    const potentialGain = Math.abs((target - entry) / entry) * 100;
    const riskRewardRatio = potentialLoss > 0 ? potentialGain / potentialLoss : 0;
    const maxShares = Math.abs(entry - stop) > 0 ? Math.floor(riskAmount / Math.abs(entry - stop)) : 0;
    const isOverLeveraged = potentialLoss > riskPct * 5;

    return { riskAmount, potentialLoss, potentialGain, riskRewardRatio, maxShares, isOverLeveraged };
  }, [totalInvestment, riskPercent, entryPrice, stopLoss, targetPrice]);

  const handleCreate = async () => {
    if (!entryPrice || !targetPrice) {
      toast.error("Please fill in entry and target prices");
      return;
    }
    if (risk?.isOverLeveraged) {
      toast.error("⚠️ Over-leveraged! Reduce position size or widen stop loss.");
      return;
    }

    const entry = parseFloat(entryPrice);
    const target = parseFloat(targetPrice);

    try {
      await createPlan.mutateAsync({
        symbol: pair.symbol,
        asset_name: pair.display_name,
        current_price: currentPrice || null,
        entry_price: entry,
        target_price: target,
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        position_size: risk?.maxShares || null,
        total_investment: totalInvestment ? parseFloat(totalInvestment) : null,
        take_profit_1: target,
        take_profit_2: null,
        risk_reward_ratio: risk?.riskRewardRatio || null,
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

          {/* Investment & Risk */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Total Investment</Label>
              <Input
                type="number"
                value={totalInvestment}
                onChange={(e) => setTotalInvestment(e.target.value)}
                placeholder="$10,000"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Risk % per Trade</Label>
              <Input
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                placeholder="2"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Recommended: 1-2%</p>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Entry Price</Label>
              <Input type="number" step="0.01" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Target Price</Label>
              <Input type="number" step="0.01" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Stop Loss</Label>
              <Input type="number" step="0.01" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* Risk Analysis Panel */}
          {risk && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border-2 ${
                risk.isOverLeveraged
                  ? "bg-destructive/5 border-destructive"
                  : "bg-emerald-50 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <p className={`font-bold text-sm ${risk.isOverLeveraged ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {risk.isOverLeveraged ? "⚠️ OVER-LEVERAGED" : "✅ Risk Acceptable"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Risk Amount</p>
                  <p className="font-bold text-foreground">${risk.riskAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Max Shares/Units</p>
                  <p className="font-bold text-foreground">{risk.maxShares}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Potential Loss</p>
                  <p className="font-bold text-destructive">{risk.potentialLoss.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Potential Gain</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{risk.potentialGain.toFixed(2)}%</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Risk/Reward Ratio</p>
                  <p className="font-bold text-foreground">1:{risk.riskRewardRatio.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notes */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Strategy Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Strategy, reasoning, reminders..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleCreate} disabled={createPlan.isPending || risk?.isOverLeveraged} className="flex-1">
            {createPlan.isPending ? "Creating..." : "Create Plan"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
