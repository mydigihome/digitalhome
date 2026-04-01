import { ReactNode } from "react";
import { Lock } from "lucide-react";

/* Shared lock overlay for Plaid-required cards */
function PlaidLock() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <Lock className="w-10 h-10" style={{ color: "#e8e8ed" }} />
      <p style={{ fontSize: "14px", color: "#767586" }}>Connect Plaid to unlock</p>
      <button style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "white", borderRadius: "9999px", padding: "6px 16px", fontSize: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}>
        Connect Bank
      </button>
    </div>
  );
}

function CardHeader({ title }: { icon?: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span style={{ fontWeight: 700, fontSize: "16px", color: "#1a1c1f" }}>{title}</span>
    </div>
  );
}

// ── Subscription Tracker ──
export function SubscriptionsFront() {
  return (<div><CardHeader title="Subscription Tracker" />
    <div style={{ fontSize: "32px", fontWeight: 800, color: "#1a1c1f" }}>$187<span style={{ fontSize: "16px", color: "#767586" }}>/mo</span></div>
    {[["Netflix", "$15.49"], ["Spotify", "$9.99"], ["iCloud", "$2.99"], ["Hulu", "$17.99"]].map(([n, p]) => (
      <div key={n} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid #f3f3f8" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1c1f" }}>{n}</span>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "13px", color: "#767586" }}>{p}</span>
          <button style={{ fontSize: "11px", fontWeight: 700, color: "#ba1a1a", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    ))}
  </div>);
}
export function SubscriptionsBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Configure subscription alerts and thresholds.</p></div>;
}

// ── Net Worth History ──
export function NetWorthHistoryFront() {
  return (<div><CardHeader title="Net Worth History" />
    <div className="flex items-end gap-1" style={{ height: "120px", padding: "8px 0" }}>
      {[30, 35, 33, 40, 42, 38, 45, 48, 50, 55, 52, 58].map((v, i) => (
        <div key={i} style={{ flex: 1, height: `${v * 1.8}%`, background: "linear-gradient(180deg, #6366f1, #818cf8)", borderRadius: "4px 4px 0 0", opacity: 0.6 + i * 0.03 }} />
      ))}
    </div>
    <div className="flex justify-between" style={{ fontSize: "10px", color: "#767586" }}><span>Jan</span><span>Jun</span><span>Dec</span></div>
  </div>);
}
export function NetWorthHistoryBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Net worth history settings.</p></div>;
}

// ── Investment Portfolio ──
export function InvestmentPortfolioFront() {
  return (<div><CardHeader title="Investment Portfolio" />
    <div style={{ fontSize: "32px", fontWeight: 800, color: "#006c49" }}>$12,450</div>
    {[["AAPL", "10 shares", "$1,850", "+1.2%"], ["NVDA", "5 shares", "$5,400", "+3.1%"], ["SPY", "3 shares", "$1,680", "-0.4%"]].map(([n, s, v, c]) => (
      <div key={n} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid #f3f3f8" }}>
        <div><div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1c1f" }}>{n}</div><div style={{ fontSize: "11px", color: "#767586" }}>{s}</div></div>
        <div className="text-right"><div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1c1f" }}>{v}</div><div style={{ fontSize: "11px", color: c.startsWith("+") ? "#22c55e" : "#ef4444" }}>{c}</div></div>
      </div>
    ))}
  </div>);
}
export function InvestmentPortfolioBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Portfolio settings.</p></div>;
}

// ── Tax Estimate ──
export function TaxEstimateFront() {
  return (<div><CardHeader title="Tax Estimate" />
    <div style={{ fontSize: "32px", fontWeight: 800, color: "#1a1c1f" }}>$1,840</div>
    <span style={{ backgroundColor: "#fffbeb", color: "#92400e", fontSize: "11px", fontWeight: 700, borderRadius: "8px", padding: "2px 8px" }}>Due Jun 15</span>
    <div className="mt-3 space-y-1">
      <div className="flex justify-between" style={{ fontSize: "13px" }}><span style={{ color: "#767586" }}>Federal</span><span style={{ fontWeight: 600, color: "#1a1c1f" }}>$1,200</span></div>
      <div className="flex justify-between" style={{ fontSize: "13px" }}><span style={{ color: "#767586" }}>State</span><span style={{ fontWeight: 600, color: "#1a1c1f" }}>$640</span></div>
    </div>
  </div>);
}
export function TaxEstimateBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Tax estimate settings.</p></div>;
}

// ── Merchant Spending ──
export function MerchantSpendingFront() {
  const data = [["Amazon", 340], ["Whole Foods", 210], ["Shell", 180], ["Uber", 145], ["Netflix", 15]] as const;
  const max = 340;
  return (<div><CardHeader title="Merchant Spending" />
    <div className="space-y-2 mt-2">
      {data.map(([name, val]) => (
        <div key={name}>
          <div className="flex justify-between" style={{ fontSize: "12px", marginBottom: "2px" }}><span style={{ fontWeight: 600, color: "#1a1c1f" }}>{name}</span><span style={{ color: "#767586" }}>${val}</span></div>
          <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "#f3f3f8" }}><div style={{ height: "100%", width: `${(val / max) * 100}%`, background: "linear-gradient(90deg, #6366f1, #818cf8)", borderRadius: "3px" }} /></div>
        </div>
      ))}
    </div>
  </div>);
}
export function MerchantSpendingBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Merchant spending settings.</p></div>;
}

// ── Category Trends ──
export function CategoryTrendsFront() {
  return (<div><CardHeader title="Category Trends" />
    <div className="flex items-end gap-2" style={{ height: "100px" }}>
      {[["Food", [60, 55, 70]], ["Transport", [30, 35, 25]], ["Shopping", [45, 50, 40]]].map(([cat, vals]) => (
        <div key={cat as string} className="flex-1">
          <div className="flex items-end gap-0.5" style={{ height: "80px" }}>
            {(vals as number[]).map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${v}%`, backgroundColor: i === 2 ? "#6366f1" : i === 1 ? "#8b8ce6" : "#c0c1ff", borderRadius: "3px 3px 0 0" }} />
            ))}
          </div>
          <div style={{ fontSize: "9px", color: "#767586", textAlign: "center", marginTop: "4px" }}>{cat as string}</div>
        </div>
      ))}
    </div>
  </div>);
}
export function CategoryTrendsBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Category trends settings.</p></div>;
}

// ── Cash Flow Calendar ──
export function CashFlowCalendarFront() {
  const days = Array.from({ length: 28 }, (_, i) => ({ day: i + 1, type: i % 7 === 0 ? "income" : i % 3 === 0 ? "expense" : "none" }));
  return (<div><CardHeader title="Cash Flow Calendar" />
    <div className="grid grid-cols-7 gap-1">
      {days.map(d => (
        <div key={d.day} className="flex items-center justify-center" style={{ width: "100%", aspectRatio: "1", borderRadius: "6px", backgroundColor: d.type === "income" ? "#dcfce7" : d.type === "expense" ? "#ffe4e6" : "#f9f9fb", fontSize: "10px", fontWeight: 600, color: "#767586" }}>
          {d.day}
        </div>
      ))}
    </div>
  </div>);
}
export function CashFlowCalendarBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Cash flow calendar settings.</p></div>;
}

// ── Refund Tracker ──
export function RefundTrackerFront() {
  return (<div><CardHeader title="Refund Tracker" />
    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1c1f", marginBottom: "8px" }}>2 pending refunds · $127 total</div>
    {[["Amazon", "$89"], ["Apple", "$38"]].map(([n, v]) => (
      <div key={n} className="flex justify-between py-2" style={{ borderBottom: "1px solid #f3f3f8", fontSize: "13px" }}>
        <span style={{ fontWeight: 600, color: "#1a1c1f" }}>{n}</span>
        <span style={{ color: "#767586" }}>{v}</span>
      </div>
    ))}
  </div>);
}
export function RefundTrackerBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Refund tracker settings.</p></div>;
}

// ── Large Transaction Alerts ──
export function LargeTransactionsFront() {
  return (<div><CardHeader title="Large Transaction Alerts" />
    <div style={{ fontSize: "12px", color: "#767586", marginBottom: "8px" }}>Threshold: <strong style={{ color: "#1a1c1f" }}>$500</strong></div>
    {[["Rent", "$2,250"], ["Car Payment", "$485"]].map(([n, v]) => (
      <div key={n} className="flex justify-between py-2" style={{ borderBottom: "1px solid #f3f3f8", fontSize: "13px" }}>
        <span style={{ fontWeight: 600, color: "#1a1c1f" }}>{n}</span>
        <span style={{ color: "#ef4444", fontWeight: 600 }}>{v}</span>
      </div>
    ))}
  </div>);
}
export function LargeTransactionsBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Set your alert threshold.</p></div>;
}

// ── Savings Opportunities ──
export function SavingsOpportunitiesFront() {
  return (<div><CardHeader title="Savings Opportunities" />
    <div className="flex items-center gap-2 mb-3">
      <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1c1f" }}>AI found $94/mo in potential savings</span>
    </div>
    {[["Hulu (unused)", "$17.99"], ["Adobe (low use)", "$54.99"], ["Gym", "$29.99"]].map(([n, v]) => (
      <div key={n} className="flex justify-between py-2" style={{ borderBottom: "1px solid #f3f3f8", fontSize: "13px" }}>
        <span style={{ fontWeight: 600, color: "#1a1c1f" }}>{n}</span>
        <span style={{ color: "#f59e0b", fontWeight: 600 }}>{v}</span>
      </div>
    ))}
  </div>);
}
export function SavingsOpportunitiesBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return <div><p style={{ fontSize: "13px", color: "#767586" }}>Savings analysis settings.</p></div>;
}
