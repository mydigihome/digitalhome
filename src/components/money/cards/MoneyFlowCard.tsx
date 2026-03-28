import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";

const waterfall = [
  { name: "Income", value: 4500, fill: "#006c49" },
  { name: "Housing", value: -1200, fill: "#ba1a1a" },
  { name: "Bills", value: -746, fill: "#ba1a1a" },
  { name: "Food", value: -450, fill: "#ba1a1a" },
  { name: "Transport", value: -320, fill: "#ba1a1a" },
  { name: "Other", value: -484, fill: "#ba1a1a" },
  { name: "Remaining", value: 1300, fill: "#6366f1" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(n));

const GlassTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl px-4 py-2 text-xs font-bold" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", color: "#1a1c1f" }}>
      {d.name}: {d.value >= 0 ? "+" : "-"}{fmt(d.value)}
    </div>
  );
};

export function MoneyFlowFront() {
  return (
    <div>
      {/* SECTION A — Savings Snapshot */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-extrabold tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#006c49" }}>29%</span>
          <span className="text-xs" style={{ color: "#767586" }}>saved this month</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-bold flex-wrap">
          <span style={{ color: "#1a1c1f" }}>Income $4,500</span>
          <span style={{ color: "#767586" }}>·</span>
          <span style={{ color: "#ba1a1a" }}>Expenses $3,200</span>
          <span style={{ color: "#767586" }}>·</span>
          <span style={{ color: "#6366f1" }}>Saved $1,300</span>
        </div>
        <div className="relative w-48 hidden lg:block">
          <div className="h-2 rounded-full" style={{ background: "#e8e8ed" }}>
            <div className="h-full rounded-full" style={{ width: "29%", background: "linear-gradient(135deg, #6366f1, #818cf8)" }} />
          </div>
          <div className="absolute" style={{ left: "20%", top: -3, transform: "translateX(-50%)" }}>
            <div className="w-0.5 h-4 rounded" style={{ background: "#767586" }} />
            <span className="text-[8px] block -ml-3" style={{ color: "#767586" }}>Rec. 20%</span>
          </div>
        </div>
      </div>

      {/* SECTION B — Cashflow Waterfall */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="lg:w-[58%]" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfall} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid horizontal vertical={false} stroke="#f3f3f8" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "#1a1c1f" }} width={76} />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {waterfall.map((d, i) => (
                  <Cell key={i} fill={d.fill} opacity={d.value < 0 ? 0.3 + i * 0.1 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:w-[42%] space-y-3">
          <div className="rounded-[16px] p-4" style={{ background: "#f3f3f8" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>MONTHLY INFLOW</p>
            <p className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#006c49" }}>+$4,500</p>
          </div>
          <div className="rounded-[16px] p-4" style={{ background: "#f3f3f8" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>MONTHLY OUTFLOW</p>
            <p className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ba1a1a" }}>-$3,200</p>
          </div>
          <div className="rounded-[16px] p-4" style={{ background: "#f3f3f8" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>NET PROFIT</p>
            <p className="text-lg font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#6366f1" }}>+$1,300</p>
          </div>
        </div>
      </div>

      {/* SECTION C — AI Insight */}
      <div className="rounded-[16px] p-3 mt-3 flex items-start gap-2" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
        <span className="material-symbols-outlined text-sm" style={{ color: "#6366f1" }}>auto_awesome</span>
        <p className="text-xs leading-relaxed font-medium" style={{ color: "#464554" }}>
          At your current savings rate you'll hit $48,900 net worth by year end. Cutting subscriptions by $50/month accelerates this by 3 weeks.
        </p>
      </div>
    </div>
  );
}

export function MoneyFlowBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Money Flow</h3>
      <div className="grid grid-cols-2 gap-2">
        <div><EditLabel>Monthly Income</EditLabel><EditInput value="4500" onChange={() => {}} type="number" /></div>
        <div><EditLabel>Monthly Expenses</EditLabel><EditInput value="3200" onChange={() => {}} type="number" /></div>
      </div>
      {["Housing", "Bills", "Food", "Transport", "Other"].map(c => (
        <div key={c}><EditLabel>{c}</EditLabel><EditInput value="0" onChange={() => {}} type="number" /></div>
      ))}
      <div><EditLabel>Savings % Target</EditLabel><EditInput value="20" onChange={() => {}} type="number" /></div>
      <div><EditLabel>AI Insight (custom)</EditLabel><EditInput value="" onChange={() => {}} placeholder="Override insight text..." /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
