import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";

const data = [
  { year: "2021", salary: 52000, yoy: "" },
  { year: "2022", salary: 60000, yoy: "+15%" },
  { year: "2023", salary: 71000, yoy: "+18%" },
  { year: "2024", salary: 82000, yoy: "+15.3%" },
];

const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;

const GlassTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-2 text-xs font-bold" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(24px)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", color: "#1a1c1f" }}>
      {payload[0].payload.year}: ${payload[0].value.toLocaleString()}
    </div>
  );
};

const YoYLabel = (props: any) => {
  const { x, y, width, value } = props;
  const item = data.find((d) => d.salary === value);
  if (!item?.yoy) return null;
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: "#006c49" }}>
      {item.yoy}
    </text>
  );
};

export function SalaryFront() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Salary Progression (YoY)</h3>
        <span className="text-xs font-bold rounded-full px-3 py-1" style={{ background: "rgba(108,248,187,0.3)", color: "#006c49" }}>↑ 15.3% vs last year</span>
      </div>
      <div className="money-chart-area tall">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#e1e0ff" />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={true} vertical={false} stroke="#f3f3f8" />
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#767586" }} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={fmt} tick={{ fontSize: 10, fill: "#767586" }} />
            <Tooltip content={<GlassTooltip />} />
            <Bar dataKey="salary" fill="url(#salaryGrad)" radius={[8, 8, 0, 0]}>
              <LabelList content={<YoYLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SalaryBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Salary</h3>
      {data.map((d) => (
        <div key={d.year} className="grid grid-cols-2 gap-2">
          <div><EditLabel>Year</EditLabel><EditInput value={d.year} onChange={() => {}} /></div>
          <div><EditLabel>Salary</EditLabel><EditInput value={String(d.salary)} onChange={() => {}} type="number" /></div>
        </div>
      ))}
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
