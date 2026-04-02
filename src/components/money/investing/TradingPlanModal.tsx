import { useState, useEffect } from "react";
import { X, Shield, TrendingUp, Zap, Sparkles, Copy, RefreshCw, Download } from "lucide-react";
import jsPDF from "jspdf";
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

const markdownComponents = {
  h2: ({ children }: any) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent)/0.6))",
      border: "1px solid hsl(var(--border))",
      borderRadius: 12, padding: "14px 18px", marginTop: 8,
    }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--foreground))", letterSpacing: "-0.3px" }}>{children}</span>
    </div>
  ),
  h3: ({ children }: any) => (
    <p style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))", marginTop: 12, marginBottom: 4, borderLeft: "3px solid #10B981", paddingLeft: 10 }}>{children}</p>
  ),
  p: ({ children }: any) => (
    <p style={{ fontSize: 14, lineHeight: 1.7, color: "hsl(var(--muted-foreground))", margin: 0, paddingLeft: 4 }}>{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column" as const, gap: 6 }}>{children}</ul>
  ),
  li: ({ children }: any) => (
    <li style={{
      display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14,
      color: "hsl(var(--foreground))", lineHeight: 1.6,
      background: "hsl(var(--muted)/0.3)", borderRadius: 8, padding: "10px 14px",
      border: "1px solid hsl(var(--border))",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", flexShrink: 0, marginTop: 8 }} />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: any) => (
    <strong style={{ fontWeight: 700, color: "hsl(var(--foreground))" }}>{children}</strong>
  ),
  hr: () => <div style={{ height: 1, background: "hsl(var(--border))", margin: "8px 0" }} />,
};

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
      const [{ data: debtsData }, { data: transData }] = await Promise.all([
        (supabase as any).from("debts").select("balance, interest_rate").eq("user_id", user.id),
        (supabase as any).from("transactions").select("amount").eq("user_id", user.id).order("date", { ascending: false }).limit(20),
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

## MARKET OVERVIEW
Current conditions for this asset class. 2-3 sentences.

## TRADING STRATEGY
Specific strategy name and why it fits.

## POSITION SIZING
- Max risk per trade: $X (X%)
- Ideal position size: $X
- Max positions open: X
- Daily max risk: $X

## ENTRY RULES
3-5 specific, testable criteria with indicators.

## EXIT RULES
- Stop loss method
- Take profit targets (3 levels)
- Risk/Reward ratio
- Trailing stop strategy

## RISK MANAGEMENT
- Daily loss limit: $X
- Weekly loss limit: $X
- Consecutive loss rule
- Given debt of $${totalDebt}: specific advice

## ${timeframe.toUpperCase()} SCHEDULE
Pre-session routine, entry windows, review checklist.

## PSYCHOLOGICAL RULES
3 non-negotiable mental rules.

## QUICK REFERENCE CARD
5-bullet cheat sheet for quick reference while trading.

Format your response in clean markdown only.
Use ## for main section headers.
Use bullet points (-) for lists.
Use **bold** for key terms and numbers.
Do not use emojis anywhere.
Do not use --- dividers between sections.
Keep each section tight and scannable.
Write like a professional investment memo.`;

      const response = await supabase.functions.invoke("generate-trading-plan", {
        body: { prompt },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      const planText = response.data?.plan || "Plan generation failed. Please try again.";
      setGeneratedPlan(planText);

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

  const riskBadgeStyle = riskTolerance === "conservative"
    ? { background: "#F0FDF4", color: "#065F46" }
    : riskTolerance === "moderate"
    ? { background: "#FFFBEB", color: "#92400E" }
    : { background: "#FEF2F2", color: "#991B1B" };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div
        className="bg-card"
        style={{ borderRadius: 20, width: "min(780px, 95vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 80px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* PLAN DISPLAY */}
        {!planLoading && generatedPlan ? (
          <>
            {/* Fixed header */}
            <div className="border-b border-border" style={{ padding: "24px 28px 20px", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h2 className="text-foreground" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: "-0.5px" }}>Your Trading Plan</h2>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ background: "#F5F3FF", color: "#7B5EA7", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, border: "1px solid #DDD6FE" }}>{assetType}</span>
                    <span style={{ background: "#F0FDF4", color: "#065F46", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, border: "1px solid #BBF7D0" }}>{timeframe}</span>
                    <span style={{ ...riskBadgeStyle, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}>{riskTolerance} risk</span>
                    <span className="text-muted-foreground" style={{ fontSize: 12 }}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => { navigator.clipboard.writeText(generatedPlan); toast.success("Copied!"); }} className="border border-border text-foreground hover:bg-muted" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "transparent", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    <Copy size={14} /> Copy
                  </button>
                  <button onClick={() => {
                    const doc = new jsPDF();
                    doc.setFontSize(20);
                    doc.setFont("helvetica", "bold");
                    doc.text("Your Trading Plan", 20, 25);
                    doc.setFontSize(11);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(107, 114, 128);
                    doc.text(`${assetType} · ${timeframe} · ${riskTolerance} risk · ${new Date().toLocaleDateString()}`, 20, 35);
                    doc.setDrawColor(229, 231, 235);
                    doc.line(20, 40, 190, 40);
                    doc.setFontSize(11);
                    doc.setTextColor(55, 65, 81);
                    doc.setFont("helvetica", "normal");
                    const lines = doc.splitTextToSize(generatedPlan.replace(/#{1,3} /g, ""), 170);
                    let y = 50;
                    lines.forEach((line: string) => {
                      if (y > 270) { doc.addPage(); y = 20; }
                      if (line.startsWith("**") || (line.toUpperCase() === line && line.length > 3)) {
                        doc.setFont("helvetica", "bold");
                        doc.setTextColor(76, 29, 149);
                      } else {
                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(55, 65, 81);
                      }
                      doc.text(line, 20, y);
                      y += 7;
                    });
                    doc.setFontSize(9);
                    doc.setTextColor(156, 163, 175);
                    doc.text("Generated by Digital Home · For educational purposes only", 20, 285);
                    doc.save(`trading-plan-${assetType}-${new Date().toISOString().split("T")[0]}.pdf`);
                    toast.success("PDF downloaded!");
                  }} className="border border-border text-foreground hover:bg-muted" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "transparent", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setGeneratedPlan(null)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#7B5EA7", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    <RefreshCw size={14} /> New Plan
                  </button>
                  <button onClick={onClose} className="border border-border hover:bg-muted" style={{ padding: 8, borderRadius: 8, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
              {/* Quick stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { label: "Account Size", value: "$" + (accountSize || "5,000"), color: "hsl(var(--foreground))" },
                  { label: "Max Risk/Trade", value: riskTolerance === "conservative" ? "1-2%" : riskTolerance === "moderate" ? "2-5%" : "5-10%", color: "#DC2626" },
                  { label: "Asset Class", value: assetType, color: "#7B5EA7" },
                  { label: "Generated", value: "Just now", color: "#10B981" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-muted/50 border border-border" style={{ borderRadius: 8, padding: "10px 14px" }}>
                    <div className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
              <ReactMarkdown components={markdownComponents}>{generatedPlan}</ReactMarkdown>
            </div>

            {/* Fixed footer */}
            <div className="border-t border-border bg-muted/30" style={{ padding: "16px 28px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>This plan is for educational purposes only. Not financial advice.</p>
              <button onClick={onClose} style={{ padding: "10px 24px", background: "hsl(var(--foreground))", color: "hsl(var(--background))", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
            </div>
          </>
        ) : planLoading ? (
          /* Loading state */
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
        ) : (
          /* Configuration form */
          <div style={{ padding: 32, overflowY: "auto", maxHeight: "85vh" }}>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" style={{ position: "absolute", right: 16, top: 16, background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} />
            </button>

            <h2 className="text-foreground" style={{ fontSize: 22, fontWeight: 700 }}>Create Your Trading Plan</h2>
            <p className="text-muted-foreground" style={{ fontSize: 14, marginBottom: 28 }}>Built like a wealth manager. Personalized to your account.</p>

            {/* Asset type */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>What are you trading?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
              {ASSET_TYPES.map((a) => (
                <button key={a} onClick={() => setAssetType(a)} className="border" style={{
                  padding: "12px 16px", borderRadius: 10, fontSize: 14, cursor: "pointer",
                  borderColor: assetType === a ? "#7B5EA7" : "hsl(var(--border))",
                  background: assetType === a ? "#F5F3FF" : "transparent",
                  color: assetType === a ? "#7B5EA7" : "hsl(var(--foreground))",
                  fontWeight: assetType === a ? 600 : 400,
                }}>{a}</button>
              ))}
            </div>

            {/* Timeframe */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Timeframe</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {TIMEFRAMES.map((t) => (
                <button key={t} onClick={() => setTimeframe(t)} style={{
                  padding: "8px 16px", borderRadius: 999, fontSize: 13, cursor: "pointer",
                  border: `1.5px solid ${timeframe === t ? "#10B981" : "hsl(var(--border))"}`,
                  background: timeframe === t ? "#10B981" : "transparent",
                  color: timeframe === t ? "white" : "hsl(var(--foreground))",
                  fontWeight: timeframe === t ? 600 : 400,
                }}>{t}</button>
              ))}
            </div>

            {/* Symbol */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Specific symbol (optional)</label>
            <input value={targetSymbol} onChange={(e) => setTargetSymbol(e.target.value)} placeholder="e.g. AAPL, BTC, EUR/USD" className="bg-card text-foreground border border-border" style={{ width: "100%", borderRadius: 8, padding: "10px 14px", fontSize: 14, marginBottom: 4, outline: "none" }} />
            <p className="text-muted-foreground" style={{ fontSize: 12, marginBottom: 20 }}>Leave blank for a general strategy</p>

            {/* Account size */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Account size available to trade</label>
            <div className="border border-border" style={{ display: "flex", alignItems: "center", borderRadius: 8, padding: "10px 14px", marginBottom: 4 }}>
              <span className="text-muted-foreground" style={{ marginRight: 8 }}>$</span>
              <input value={accountSize} onChange={(e) => setAccountSize(e.target.value)} placeholder="e.g. 5000" type="number" className="bg-transparent text-foreground" style={{ border: "none", outline: "none", flex: 1, fontSize: 14 }} />
            </div>
            <p className="text-muted-foreground" style={{ fontSize: 12, marginBottom: 20 }}>Only what you're willing to risk</p>

            {/* Risk tolerance */}
            <label className="text-foreground" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Risk tolerance</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
              {RISK_OPTIONS.map(({ key, label, desc, Icon, color, bg, border }) => (
                <button key={key} onClick={() => setRiskTolerance(key)} style={{
                  borderRadius: 10, padding: 16, cursor: "pointer", textAlign: "left" as const,
                  border: `1.5px solid ${riskTolerance === key ? border : "hsl(var(--border))"}`,
                  background: riskTolerance === key ? bg : "transparent",
                }}>
                  <Icon size={20} style={{ color, marginBottom: 6 }} />
                  <div className="text-foreground" style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                  <div className="text-muted-foreground" style={{ fontSize: 12 }}>{desc}</div>
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button onClick={generatePlan} disabled={planLoading} style={{
              width: "100%", height: 52, background: "linear-gradient(135deg, #7B5EA7, #10B981)",
              color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <Sparkles size={18} /> Generate My Trading Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
