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

const ASSET_TYPES = [
  { value: "forex", label: "Forex", icon: "💱", unit: "lots" },
  { value: "stocks", label: "Stocks", icon: "", unit: "shares" },
  { value: "futures", label: "Futures", icon: "🔮", unit: "contracts" },
  { value: "crypto", label: "Crypto", icon: "₿", unit: "units" },
];

const TRADER_TYPES = [
  { value: "scalper", label: "Scalper" },
  { value: "day_trader", label: "Day Trader" },
  { value: "swing_trader", label: "Swing Trader" },
  { value: "position_trader", label: "Position Trader" },
];

export default function CreatePlanModal({ pair, currentPrice, onClose }: CreatePlanModalProps) {
  // Account
  const [accountBalance, setAccountBalance] = useState("10000");
  const [maxRiskPercent, setMaxRiskPercent] = useState("2");
  // Trader profile
  const [traderType, setTraderType] = useState("day_trader");
  const [maxTradesPerDay, setMaxTradesPerDay] = useState("3");
  const [tradingDays, setTradingDays] = useState("30");
  // Asset
  const [assetType, setAssetType] = useState("stocks");
  // Prices
  const [entryPrice, setEntryPrice] = useState(currentPrice?.toString() || "");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [positionSize, setPositionSize] = useState("");
  // Advanced
  const [winRate, setWinRate] = useState("55");
  const [notes, setNotes] = useState("");

  const createPlan = useCreateTradingPlan();

  const positionUnit = ASSET_TYPES.find((a) => a.value === assetType)?.unit || "units";

  const calc = useMemo(() => {
    const balance = parseFloat(accountBalance);
    const entry = parseFloat(entryPrice);
    const target = parseFloat(targetPrice);
    const stop = parseFloat(stopLoss);
    const size = parseFloat(positionSize);
    const riskPct = parseFloat(maxRiskPercent);
    const days = parseFloat(tradingDays);
    const tradesPerDay = parseFloat(maxTradesPerDay);
    const winPct = parseFloat(winRate);

    if (!balance || !entry || !target || !stop || !size || !riskPct) return null;

    const pointRisk = Math.abs(entry - stop);
    const pointReward = Math.abs(target - entry);

    let riskAmount: number, rewardAmount: number;
    if (assetType === "forex") {
      const pips = pointRisk * 10000;
      riskAmount = pips * 10 * size;
      const rewardPips = pointReward * 10000;
      rewardAmount = rewardPips * 10 * size;
    } else {
      riskAmount = pointRisk * size;
      rewardAmount = pointReward * size;
    }

    const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;
    const maxAllowedRisk = balance * (riskPct / 100);
    const isOverLeveraged = riskAmount > maxAllowedRisk;
    const suggestedSize = pointRisk > 0 ? Math.floor(maxAllowedRisk / pointRisk) : 0;

    const totalTrades = (days || 1) * (tradesPerDay || 1);
    const wins = totalTrades * ((winPct || 50) / 100);
    const losses = totalTrades - wins;
    const expectedProfit = wins * rewardAmount - losses * riskAmount;
    const dailyProfit = expectedProfit / (days || 1);
    const maxConsecutiveLosses = Math.ceil(totalTrades * 0.3);
    const maxDrawdown = balance > 0 ? (maxConsecutiveLosses * riskAmount / balance) * 100 : 0;

    return {
      riskAmount, rewardAmount, riskRewardRatio,
      isOverLeveraged, suggestedSize,
      totalTrades, wins: Math.floor(wins), losses: Math.floor(losses),
      expectedProfit, dailyProfit, maxDrawdown,
    };
  }, [accountBalance, entryPrice, targetPrice, stopLoss, positionSize, maxRiskPercent, tradingDays, maxTradesPerDay, winRate, assetType]);

  const handleCreate = async () => {
    if (!entryPrice || !targetPrice || !stopLoss || !positionSize) {
      toast.error("Fill in all price and position fields");
      return;
    }
    if (calc?.isOverLeveraged) {
      toast.error(` Over-leveraged! Max ${calc.suggestedSize} ${positionUnit}`);
      return;
    }

    try {
      await createPlan.mutateAsync({
        symbol: pair.symbol,
        asset_name: pair.display_name,
        current_price: currentPrice || null,
        entry_price: parseFloat(entryPrice),
        target_price: parseFloat(targetPrice),
        stop_loss: parseFloat(stopLoss),
        position_size: parseFloat(positionSize),
        total_investment: parseFloat(accountBalance) || null,
        take_profit_1: parseFloat(targetPrice),
        take_profit_2: null,
        risk_reward_ratio: calc?.riskRewardRatio || null,
        strategy_notes: notes || null,
        time_frame: traderType,
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
        className="bg-card rounded-3xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-foreground">Create Trading Plan</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{pair.symbol} — {pair.display_name}</p>
        </div>

        {/* Scrollable body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* Account Setup */}
          <section>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
               Account Setup
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Account Balance</Label>
                <Input type="number" value={accountBalance} onChange={(e) => setAccountBalance(e.target.value)} placeholder="10000" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Max Risk/Trade (%)</Label>
                <Input type="number" value={maxRiskPercent} onChange={(e) => setMaxRiskPercent(e.target.value)} placeholder="2" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Recommended: 1-2%</p>
              </div>
            </div>
          </section>

          {/* Trader Profile */}
          <section>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
               Trader Profile
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Trader Type</Label>
                <select
                  value={traderType}
                  onChange={(e) => setTraderType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {TRADER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Trades/Day</Label>
                <Input type="number" value={maxTradesPerDay} onChange={(e) => setMaxTradesPerDay(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Duration (Days)</Label>
                <Input type="number" value={tradingDays} onChange={(e) => setTradingDays(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Asset Type */}
          <section>
            <Label className="text-xs font-bold mb-2 block">Asset Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {ASSET_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setAssetType(t.value)}
                  className={`p-3 rounded-xl border-2 text-center transition ${
                    assetType === t.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <p className="text-[11px] font-semibold text-foreground mt-1">{t.label}</p>
                  <p className="text-[9px] text-muted-foreground">{t.unit}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Entry Strategy */}
          <section>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
               Entry Strategy
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Entry Price</Label>
                <Input type="number" step="0.01" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Target Price</Label>
                <Input type="number" step="0.01" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Stop Loss</Label>
                <Input type="number" step="0.01" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Position ({positionUnit})</Label>
                <Input type="number" value={positionSize} onChange={(e) => setPositionSize(e.target.value)} placeholder={assetType === "forex" ? "0.1" : "100"} />
              </div>
            </div>
          </section>

          {/* Win Rate */}
          <section>
            <Label className="text-xs font-bold mb-1 block">Expected Win Rate (%)</Label>
            <Input type="number" value={winRate} onChange={(e) => setWinRate(e.target.value)} placeholder="55" />
            <p className="text-[10px] text-muted-foreground mt-0.5">Used for profit projections</p>
          </section>

          {/* Risk Analysis */}
          {calc && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border-2 ${
                calc.isOverLeveraged
                  ? "bg-destructive/5 border-destructive"
                  : "bg-emerald-50 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-600"
              }`}
            >
              <p className={`font-bold text-sm mb-3 ${calc.isOverLeveraged ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                {calc.isOverLeveraged ? " OVER-LEVERAGED" : " Plan Analysis"}
              </p>

              {/* Risk per trade */}
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <p className="text-muted-foreground text-[10px]">Risk/Trade</p>
                  <p className="font-bold text-foreground">${calc.riskAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">Reward/Trade</p>
                  <p className="font-bold text-foreground">${calc.rewardAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">R:R Ratio</p>
                  <p className="font-bold text-foreground">1:{calc.riskRewardRatio.toFixed(2)}</p>
                </div>
              </div>

              {/* Projections */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <p className="text-muted-foreground text-[10px]">Total Trades ({tradingDays}d)</p>
                  <p className="font-bold text-foreground">{calc.totalTrades}</p>
                  <p className="text-[10px] text-muted-foreground">{calc.wins}W / {calc.losses}L at {winRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">Expected Profit</p>
                  <p className={`font-bold ${calc.expectedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    ${calc.expectedProfit.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">${calc.dailyProfit.toFixed(2)}/day</p>
                </div>
              </div>

              {/* Drawdown */}
              <div className="text-sm">
                <p className="text-muted-foreground text-[10px]">Max Drawdown (Worst Case)</p>
                <p className="font-bold text-foreground">{calc.maxDrawdown.toFixed(1)}%</p>
              </div>

              {calc.isOverLeveraged && (
                <p className="mt-2 text-xs text-destructive font-semibold">
                  Reduce position to max {calc.suggestedSize} {positionUnit}
                </p>
              )}
            </motion.div>
          )}

          {/* Notes */}
          <section>
            <Label className="text-xs font-bold mb-1 block">Strategy Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Entry rules, exit strategy, market conditions..." />
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleCreate} disabled={createPlan.isPending || calc?.isOverLeveraged} className="flex-1">
            {createPlan.isPending ? "Creating..." : calc?.isOverLeveraged ? "Fix Over-Leverage" : "Create Plan"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
