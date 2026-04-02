import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChevronDown, Maximize2, Minimize2, Copy, MoreHorizontal } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { format, startOfWeek, startOfMonth, subMonths, subDays } from "date-fns";

type Period = "week" | "month" | "3months" | "year";
const LABELS: Record<Period, string> = { week: "This Week", month: "This Month", "3months": "Last 3 Months", year: "This Year" };

const SAMPLE_DATA = [
  { name: "Mon", amount: 500 },
  { name: "Tue", amount: 1200 },
  { name: "Wed", amount: 800 },
  { name: "Thu", amount: 2800 },
  { name: "Fri", amount: 1500 },
  { name: "Sat", amount: 2600 },
  { name: "Sun", amount: 3200 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div style={{ background: '#1F2937', color: 'white', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      ● ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </div>
  );
};

export default function TotalEarningsCard() {
  const { data: transactions = [] } = useTransactions();
  const [period, setPeriod] = useState<Period>("week");
  const [expanded, setExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data, total, prevTotal } = useMemo(() => {
    const income = transactions.filter(t => t.amount > 0);
    if (income.length === 0) {
      return { data: SAMPLE_DATA, total: 11242.00, prevTotal: 10618.87 };
    }

    const now = new Date();
    let startDate: Date, prevStart: Date, bucketFn: (d: Date) => string;

    if (period === "week") {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      prevStart = subDays(startDate, 7);
      bucketFn = d => format(d, "EEE");
    } else if (period === "month") {
      startDate = startOfMonth(now);
      prevStart = startOfMonth(subMonths(now, 1));
      bucketFn = d => format(d, "MMM d");
    } else if (period === "3months") {
      startDate = startOfMonth(subMonths(now, 2));
      prevStart = startOfMonth(subMonths(now, 5));
      bucketFn = d => format(d, "MMM");
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      bucketFn = d => format(d, "MMM");
    }

    const current = income.filter(t => new Date(t.date) >= startDate);
    const prev = income.filter(t => { const d = new Date(t.date); return d >= prevStart && d < startDate; });
    const total = current.reduce((s, t) => s + t.amount, 0);
    const prevTotal = prev.reduce((s, t) => s + t.amount, 0);

    const map: Record<string, number> = {};
    current.forEach(t => { const key = bucketFn(new Date(t.date)); map[key] = (map[key] || 0) + t.amount; });

    if (period === "week") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return { data: days.map(d => ({ name: d, amount: map[d] || 0 })), total, prevTotal };
    }
    return { data: Object.entries(map).map(([name, amount]) => ({ name, amount })), total, prevTotal };
  }, [transactions, period]);

  const pctChange = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 5.9;

  return (
    <div className={`bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${expanded ? "fixed inset-4 z-50 overflow-auto" : ""}`} style={{ padding: 24, minHeight: 320 }}>
      {expanded && <div className="fixed inset-0 bg-black/30 -z-10" onClick={() => setExpanded(false)} />}
      <div className="flex items-start justify-between mb-1">
        <h3 style={{ fontSize: 18, fontWeight: 700 }} className="text-foreground">Total Earnings</h3>
        <div className="flex items-center gap-2">
          <Copy size={16} className="text-muted-foreground cursor-pointer hover:text-foreground" />
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? <Minimize2 size={16} className="text-muted-foreground hover:text-foreground" /> : <Maximize2 size={16} className="text-muted-foreground hover:text-foreground" />}
          </button>
          <MoreHorizontal size={16} className="text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      </div>
      <p style={{ fontSize: 13 }} className="text-muted-foreground mb-3">Overview of your monthly earnings at a glance.</p>

      <div className="flex items-end gap-3 mb-1">
        <span style={{ fontSize: 36, fontWeight: 700 }} className="text-foreground">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: pctChange >= 0 ? '#D1FAE5' : '#FEE2E2', color: pctChange >= 0 ? '#10B981' : '#DC2626' }}>
          {pctChange >= 0 ? '▲' : '▼'} {Math.abs(pctChange).toFixed(1)}%
        </span>
        <span style={{ fontSize: 12 }} className="text-muted-foreground">vs. Last week</span>
        <div className="ml-auto relative">
          <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 13, border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '6px 12px' }}>
            {LABELS[period]} <ChevronDown size={12} />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
              {(Object.keys(LABELS) as Period[]).map(p => (
                <button key={p} onClick={() => { setPeriod(p); setShowDropdown(false); }} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${period === p ? "font-bold text-foreground" : "text-muted-foreground"}`}>{LABELS[p]}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: expanded ? 360 : 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7B5EA7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#7B5EA7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} ticks={[0, 1000, 2000, 3000, 4000]} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Area type="monotone" dataKey="amount" stroke="#7B5EA7" strokeWidth={2} fill="url(#earningsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
