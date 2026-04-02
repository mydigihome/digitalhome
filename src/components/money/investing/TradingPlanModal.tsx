import { useState, useEffect } from "react";
import { X, Shield, TrendingUp, Zap, Sparkles, Copy, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ASSET_TYPES = ["Stocks", "Crypto", "Forex / Currency Pairs", "Futures & Commodities", "Options", "ETFs & Index Funds"];
const TIMEFRAMES = ["1 Day", "1 Week", "1 Month", "3 Months", "1 Year"];
const RISK_OPTIONS = [
  { key: "conservative", label: "Conservative", desc: "1-2% risk per trade", Icon: Shield, color: "#10B981", bg: "#F0FDF4", border: "#10B981" },
  { key: "moderate", label: "Moderate", desc: "2-5% risk per trade", Icon: TrendingUp, color: "#F59E0B", bg: "#FFFBEB", border: "#F59E0B" },
  { key: "aggressive", label: "Aggressive", desc: "5-10% risk per trade", Icon: Zap, color: "#DC2626", bg: "#FEF2F2", border: "#DC2626" },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TradingPlanModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [assetType, setAssetType] = useState("Stocks");
  const [timeframe, setTimeframe] = useState("1 Week");
  const [riskTolerance, setRiskTolerance] = useState("moderate");
  const [targetSymbol, setTargetSymbol] = useState("");
  const [accountSize, setAccountSize] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [planStep, setPlanStep] = useState(0);

  useEffect(() => {
    if (!planLoading) return;
    const interval = setInterval(() => setPlanStep((p) => (p + 1) % 5), 1800);
    return () => clearInterval(interval);
  }, [planLoading]);

  // Reset on close
  useEffect(() => {
    if (!open) { setGeneratedPlan(null); setPlanLoading(false); setPlanStep(0); }
  }, [open]);

  if (!open) return null;

  const riskMap: Record<string, string> = { conservative: "1-2% of account per trade", moderate: "2-5% of account per trade", aggressive: "5-10% of account per trade" };

  const generatePlan = async () => {
    if (!user) return;
    setPlanLoading(true);
    setPlanStep(0);

    try {
      const [{ data: debtsData }, { data: transData }, { data: investData }] = await Promise.all([
        (supabase as any).from("debts").select("balance, interest_rate").eq("user_id", user.id),
        (supabase as any).from("transactions").select("amount").eq("user_id", user.id).order("date", { ascending: false }).limit(20),
        (supabase as any).from("investments").select("*").eq("user_id", user.id),
      ]);

      const totalDebt = debtsData?.reduce((s: number, d: any) => s + (d.balance || 0), 0) || 0;
      const monthlyIncome = transData?.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0) || 0;
      const acctSize = accountSize || "5000";

      const prompt = `You are a professional wealth manager and quantitative trading analyst with 20+ years of experience.

Create a detailed, actionable trading plan. Be specific, data-driven, and professional.

CLIENT PROFILE:
- Account size: $${acctSize}
- Total debt: $${totalDebt.toLocaleString()}
- Est. monthly income: $${monthlyIncome.toLocaleString()}
- Risk tolerance: ${riskTolerance} (${riskMap[riskTolerance]})

PARAMETERS:
- Asset class: ${assetType}
- Timeframe: ${timeframe}
- Target symbol: ${targetSymbol || "General strategy for " + assetType}
- Date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Create a plan with these EXACT sections:

## 📊 MARKET OVERVIEW
Current conditions for this asset class. 2-3 sentences.

## 🎯 TRADING STRATEGY
Specific strategy name and why it fits.

## 💰 POSITION SIZING
- Max risk per trade: $X (X%)
- Ideal position size: $X
- Max positions open: X
- Daily max risk: $X

## 📈 ENTRY RULES
3-5 specific, testable criteria with indicators.

## 📉 EXIT RULES
- Stop loss method
- Take profit targets (3 levels)
- Risk/Reward ratio
- Trailing stop strategy

## ⚠️ RISK MANAGEMENT RULES
- Daily loss limit: $X
- Weekly loss limit: $X
- Consecutive loss rule
- Given debt of $${totalDebt}: specific advice

## 📅 ${timeframe.toUpperCase()} SCHEDULE
Pre-session routine, entry windows, review checklist.

## 🧠 PSYCHOLOGICAL RULES
3 non-negotiable mental rules.

## 📋 QUICK REFERENCE CARD
5-bullet cheat sheet for quick reference while trading.

Be specific with numbers. No fluff.`;

      const response = await supabase.functions.invoke("brain-dump-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash",
        },
      });

      const planText = response.data?.reply || response.data?.content?.[0]?.text || "Plan generation failed. Please try again.";
      setGeneratedPlan(planText);

      // Save to DB
      await (supabase as any).from("trading_plans").insert({
        user_id: user.id,
        symbol: targetSymbol || assetType,
        asset_name: assetType,
        plan_content: planText,
        risk_tolerance: riskTolerance,
        account_size: parseFloat(acctSize) || null,
        time_frame: timeframe,
        status: "active",
      });
    } catch (err) {
      console.error(err);
      toast.error("Plan generation failed. Please try again.");
    } finally {
      setPlanLoading(false);
    }
  };

  const loadingSteps = [
    "Analyzing market conditions...",
    "Calculating position sizes...",
    "Building risk management rules...",
    "Writing your entry/exit strategy...",
    "Finalizing your plan...",
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div className="bg-card" style={{ borderRadius: 20, maxWidth: 680, width: "90vw", maxHeight: "85vh", overflowY: "auto", padding: 32 }} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" style={{ position: "absolute", right: 16, top: 16, background: "none", border: "none", cursor: "pointer" }}>
          <X size={20} />
        </button>

        {/* Loading state */}
        {planLoading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <TrendingUp size={28} color="#7B5EA7" className="animate-pulse" />
            </div>
            <h3 className="text-foreground" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Building your trading plan...</h3>
            <p className="text-muted-foreground" style={{ fontSize: 14, maxWidth: 300, margin: "0 auto" }}>Analyzing your account, market conditions, and risk profile.</p>
            <div style={{ marginTop: 20 }}>
              {loadingSteps.map((step, i) => (
                <div key={i} className="text-muted-foreground" style={{ marginTop: 8, fontSize: 12, opacity: planStep === i ? 1 : 0.3, transition: "opacity 500ms" }}>{step}</div>
              ))}
            </div>
          </div>
        )}

        {/* Generated plan display */}
        {!planLoading && generatedPlan && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 className="text-foreground" style={{ fontSize: 20, fontWeight: 700 }}>Your Trading Plan</h2>
                <p className="text-muted-foreground" style={{ fontSize: 13 }}>{assetType} · {timeframe} · {riskTolerance} risk</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { navigator.clipboard.writeText(generatedPlan); toast.success("Copied to clipboard!"); }} className="border border-border text-foreground hover:bg-muted" style={{ padding: "8px 14px", borderRadius: 8, background: "transparent", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Copy size={14} />Copy
                </button>
                <button onClick={() => setGeneratedPlan(null)} style={{ padding: "8px 14px", background: "#7B5EA7", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <RefreshCw size={14} />New Plan
                </button>
              </div>
            </div>
            <div className="bg-muted/50 text-foreground prose prose-sm max-w-none" style={{ borderRadius: 12, padding: 24, fontSize: 14, lineHeight: 1.7 }}>
              <ReactMarkdown>{generatedPlan}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Configuration form */}
        {!planLoading && !generatedPlan && (
          <div>
            <h2 className="text-foreground" style={{ fontSize: 22, fontWeight: 700 }}>Create Your Trading Plan</h2>
            <p className="text-muted-foreground" style={{ fontSize: 14, marginBottom: 28 }}>Built like a wealth manager. Personalized to your account.</p>

            {/* Asset type */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>What are you trading?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {ASSET_TYPES.map((t) => (
                <button key={t} onClick={() => setAssetType(t)} className={assetType === t ? "" : "text-foreground"} style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${assetType === t ? "#7B5EA7" : "hsl(var(--border))"}`, background: assetType === t ? "#F5F3FF" : "transparent", color: assetType === t ? "#7B5EA7" : undefined, fontWeight: assetType === t ? 600 : 400, fontSize: 14, cursor: "pointer", textAlign: "left" }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Timeframe */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Timeframe</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {TIMEFRAMES.map((t) => (
                <button key={t} onClick={() => setTimeframe(t)} style={{ padding: "6px 14px", borderRadius: 999, border: `1.5px solid ${timeframe === t ? "#10B981" : "hsl(var(--border))"}`, background: timeframe === t ? "#10B981" : "transparent", color: timeframe === t ? "white" : "hsl(var(--foreground))", fontSize: 13, fontWeight: timeframe === t ? 600 : 400, cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Symbol */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Specific symbol (optional)</label>
            <input value={targetSymbol} onChange={(e) => setTargetSymbol(e.target.value)} placeholder="e.g. AAPL, BTC, EUR/USD" className="bg-card text-foreground border-border placeholder:text-muted-foreground" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid hsl(var(--border))", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 4 }} />
            <p className="text-muted-foreground" style={{ fontSize: 11, marginBottom: 20 }}>Leave blank for a general strategy</p>

            {/* Account size */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Account size available to trade</label>
            <div className="border-border" style={{ display: "flex", alignItems: "center", border: "1.5px solid hsl(var(--border))", borderRadius: 8, padding: "10px 14px", marginBottom: 4 }}>
              <span className="text-muted-foreground" style={{ marginRight: 8 }}>$</span>
              <input type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} placeholder="e.g. 5000" className="text-foreground placeholder:text-muted-foreground" style={{ border: "none", outline: "none", flex: 1, fontSize: 14, fontWeight: 500, background: "transparent" }} />
            </div>
            <p className="text-muted-foreground" style={{ fontSize: 11, marginBottom: 20 }}>Only what you're willing to risk</p>

            {/* Risk tolerance */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Risk tolerance</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
              {RISK_OPTIONS.map((r) => (
                <button key={r.key} onClick={() => setRiskTolerance(r.key)} style={{ padding: 16, borderRadius: 10, border: `1.5px solid ${riskTolerance === r.key ? r.border : "hsl(var(--border))"}`, background: riskTolerance === r.key ? r.bg : "transparent", cursor: "pointer", textAlign: "center" }}>
                  <r.Icon size={20} color={r.color} style={{ margin: "0 auto 8px" }} />
                  <div className="text-foreground" style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</div>
                  <div className="text-muted-foreground" style={{ fontSize: 12, marginTop: 2 }}>{r.desc}</div>
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button onClick={generatePlan} style={{ width: "100%", height: 52, background: "linear-gradient(135deg, #7B5EA7, #10B981)", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Sparkles size={18} />Generate My Trading Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
