import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";

const data = [
  { name: "Income", value: 4500, fill: "#006c49" },
  { name: "Housing", value: -1200, fill: "#ba1a1a" },
  { name: "Bills", value: -746, fill: "#ba1a1a" },
  { name: "Food", value: -450, fill: "#ba1a1a" },
  { name: "Transport", value: -320, fill: "#ba1a1a" },
  { name: "Other", value: -484, fill: "#ba1a1a" },
  { name: "Remaining", value: 1300, fill: "#6366f1" },
];

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(n));

const GlassTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl px-4 py-2 text-xs font-bold" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", color: "#1a1c1f" }}>
      {d.name}: {d.value >= 0 ? "+" : "-"}{fmt(d.value)}
    </div>
  );
};

export function CashflowFront() {
  return (
    <div style={{ minHeight: 320 }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Monthly Cashflow</h3>
        <button onClick={(e) => e.stopPropagation()} className="text-lg" style={{ color: "#767586" }}>···</button>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-[60%] h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid horizontal={true} vertical={false} stroke="#f3f3f8" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "#1a1c1f" }} width={80} />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.fill} opacity={d.value < 0 ? 0.3 + (i * 0.12) : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:w-[40%] space-y-4">
          <div className="rounded-[20px] p-5" style={{ background: "#f3f3f8" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>MONTHLY INFLOW</p>
            <p className="text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#006c49" }}>+$4,500</p>
          </div>
          <div className="rounded-[20px] p-5" style={{ background: "#f3f3f8" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>MONTHLY OUTFLOW</p>
            <p className="text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ba1a1a" }}>-$3,200</p>
          </div>
          <div className="rounded-[20px] p-5" style={{ background: "#f3f3f8" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>NET MONTHLY PROFIT</p>
            <p className="text-xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#6366f1" }}>+$1,300</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-6">
        {[
          { label: "Savings $500" },
          { label: "Investments $300" },
          { label: "Goals $500" },
        ].map((p) => (
          <span key={p.label} className="rounded-full px-4 py-2 text-xs font-bold" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CashflowBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Cashflow</h3>
      <div><EditLabel>Monthly Income</EditLabel><EditInput value="4500" onChange={() => {}} type="number" /></div>
      {["Housing", "Bills", "Food", "Transport", "Other"].map((c) => (
        <div key={c}><EditLabel>{c}</EditLabel><EditInput value="0" onChange={() => {}} type="number" /></div>
      ))}
      <div className="grid grid-cols-3 gap-2">
        <div><EditLabel>Savings</EditLabel><EditInput value="500" onChange={() => {}} type="number" /></div>
        <div><EditLabel>Investments</EditLabel><EditInput value="300" onChange={() => {}} type="number" /></div>
        <div><EditLabel>Goals</EditLabel><EditInput value="500" onChange={() => {}} type="number" /></div>
      </div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
