import { useState, useMemo } from "react";
import { X, Download, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateTradingPlan } from "@/hooks/useTradingPlans";
import { toast } from "sonner";

interface TradingPlanModalProps {
  symbol: string;
  assetName: string;
  currentPrice: number;
  onClose: () => void;
}

export default function TradingPlanModal({ symbol, assetName, currentPrice, onClose }: TradingPlanModalProps) {
  const createPlan = useCreateTradingPlan();

  const [entryPrice, setEntryPrice] = useState(currentPrice.toFixed(2));
  const [positionSize, setPositionSize] = useState("10");
  const [stopLoss, setStopLoss] = useState((currentPrice * 0.95).toFixed(2));
  const [tp1, setTp1] = useState((currentPrice * 1.1).toFixed(2));
  const [tp2, setTp2] = useState((currentPrice * 1.2).toFixed(2));
  const [notes, setNotes] = useState("");
  const [timeFrame, setTimeFrame] = useState("swing");

  const entry = parseFloat(entryPrice) || 0;
  const shares = parseFloat(positionSize) || 0;
  const sl = parseFloat(stopLoss) || 0;
  const takeProfit1 = parseFloat(tp1) || 0;

  const totalInvestment = entry * shares;
  const slPercent = entry > 0 ? (((entry - sl) / entry) * 100).toFixed(1) : "0";
  const tp1Percent = entry > 0 ? (((takeProfit1 - entry) / entry) * 100).toFixed(1) : "0";
  const tp2Percent = entry > 0 ? (((parseFloat(tp2) - entry) / entry) * 100).toFixed(1) : "0";
  const riskReward = entry > 0 && sl > 0 && entry !== sl
    ? ((takeProfit1 - entry) / (entry - sl)).toFixed(2)
    : "—";

  const handleSave = async () => {
    try {
      await createPlan.mutateAsync({
        symbol,
        asset_name: assetName,
        current_price: currentPrice,
        entry_price: entry,
        position_size: shares,
        total_investment: totalInvestment,
        stop_loss: sl,
        take_profit_1: takeProfit1,
        take_profit_2: parseFloat(tp2) || null,
        risk_reward_ratio: parseFloat(riskReward) || null,
        strategy_notes: notes || null,
        time_frame: timeFrame,
        status: "active",
        target_price: takeProfit1,
        trading_pair_id: null,
        completed_at: null,
      });
      toast.success("Trading plan saved!");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const handleDownload = () => {
    const content = `
TRADING PLAN: ${symbol} - ${assetName}
${"=".repeat(50)}
Date: ${new Date().toLocaleDateString()}
Current Price: $${currentPrice.toFixed(2)}

ENTRY STRATEGY
  Entry Price Target: $${entryPrice}
  Position Size: ${positionSize} shares
  Total Investment: $${totalInvestment.toFixed(2)}

RISK MANAGEMENT
  Stop Loss: $${stopLoss} (${slPercent}%)
  Take Profit 1: $${tp1} (+${tp1Percent}%)
  Take Profit 2: $${tp2} (+${tp2Percent}%)
  Risk/Reward Ratio: ${riskReward}

TIME FRAME: ${timeFrame.toUpperCase()}

STRATEGY NOTES
${notes || "(none)"}
${"=".repeat(50)}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trading-plan-${symbol}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Trading plan downloaded!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Trading Plan: {symbol}</h2>
            <p className="text-xs text-muted-foreground">{assetName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Current Price */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
            <p className="text-xs text-muted-foreground">Current Price</p>
            <p className="text-2xl font-bold text-foreground">${currentPrice.toFixed(2)}</p>
          </div>

          {/* Entry Strategy */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Entry Strategy</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Entry Price Target</Label>
                <Input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Position Size (shares)</Label>
                <Input type="number" value={positionSize} onChange={(e) => setPositionSize(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Investment: <span className="font-semibold text-foreground">${totalInvestment.toFixed(2)}</span>
            </div>
          </div>

          {/* Risk Management */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Risk Management</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Stop Loss</Label>
                <Input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="h-9" />
                <p className="text-[10px] text-destructive mt-0.5">-{slPercent}%</p>
              </div>
              <div>
                <Label className="text-xs">Take Profit 1</Label>
                <Input type="number" value={tp1} onChange={(e) => setTp1(e.target.value)} className="h-9" />
                <p className="text-[10px] text-success mt-0.5">+{tp1Percent}%</p>
              </div>
              <div>
                <Label className="text-xs">Take Profit 2</Label>
                <Input type="number" value={tp2} onChange={(e) => setTp2(e.target.value)} className="h-9" />
                <p className="text-[10px] text-success mt-0.5">+{tp2Percent}%</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-sm">
              Risk/Reward Ratio: <span className="font-bold text-primary">{riskReward}</span>
            </div>
          </div>

          {/* Strategy Notes */}
          <div>
            <Label className="text-xs">Strategy Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why this trade? What's your thesis..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Time Frame */}
          <div>
            <Label className="text-xs mb-2 block">Time Frame</Label>
            <div className="flex gap-2">
              {["day_trade", "swing", "long_term"].map((tf) => (
                <Button
                  key={tf}
                  variant={timeFrame === tf ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame(tf)}
                  className="text-xs capitalize"
                >
                  {tf.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={createPlan.isPending} className="flex-1 gap-1.5">
              <FileText className="h-3.5 w-3.5" /> {createPlan.isPending ? "Saving..." : "Save Plan"}
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
