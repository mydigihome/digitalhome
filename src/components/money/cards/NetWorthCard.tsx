import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";

const defaultData = [
  { month: "Jan", value: 38200 }, { month: "Feb", value: 39100 }, { month: "Mar", value: 40500 },
  { month: "Apr", value: 41200 }, { month: "May", value: 43100 }, { month: "Jun", value: 45234 },
];

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-2 text-xs font-bold" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", color: "#1a1c1f" }}>
      {label}: {fmt(payload[0].value)}
    </div>
  );
};

export function NetWorthFront() {
  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Total Net Worth</h3>
          <p className="text-sm" style={{ color: "#767586" }}>Aggregated across all assets</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-extrabold tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>$45,234</p>
          <span className="inline-block text-xs font-bold rounded-full px-3 py-1 mt-1" style={{ background: "rgba(108,248,187,0.3)", color: "#006c49" }}>↑ $2,341 this month</span>
        </div>
      </div>
      <div className="money-chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={defaultData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(99,102,241,0.15)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={true} vertical={false} stroke="#f3f3f8" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#767586" }} />
            <YAxis domain={['dataMin - 2000', 'dataMax + 1000']} hide />
            <Tooltip content={<GlassTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#nwGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="rounded-xl p-3" style={{ background: "#f3f3f8" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>Assets</p>
          <p className="text-lg font-bold" style={{ color: "#006c49" }}>$48,434</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "#f3f3f8" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>Liabilities</p>
          <p className="text-lg font-bold" style={{ color: "#ba1a1a" }}>-$3,200</p>
        </div>
      </div>
    </div>
  );
}

export function NetWorthBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [assets, setAssets] = useState("48434");
  const [liabilities, setLiabilities] = useState("3200");
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Net Worth</h3>
      <div><EditLabel>Total Assets</EditLabel><EditInput value={assets} onChange={setAssets} type="number" /></div>
      <div><EditLabel>Total Liabilities</EditLabel><EditInput value={liabilities} onChange={setLiabilities} type="number" /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
