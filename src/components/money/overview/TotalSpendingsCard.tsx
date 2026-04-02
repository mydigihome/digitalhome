import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { format, subDays, startOfWeek, startOfMonth, subMonths, startOfDay } from "date-fns";

type Period = "week" | "month" | "3months" | "year";

const LABELS: Record<Period, string> = { week: "This Week", month: "This Month", "3months": "Last 3 Months", year: "This Year" };

export default function TotalSpendingsCard() {
  const { data: transactions = [] } = useTransactions();
  const [period, setPeriod] = useState<Period>("week");
  const [expanded, setExpanded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data, total, prevTotal } = useMemo(() => {
    const now = new Date();
    const expenses = transactions.filter(t => t.amount < 0);

    let startDate: Date;
    let prevStart: Date;
    let bucketFn: (d: Date) => string;

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

    const current = expenses.filter(t => new Date(t.date) >= startDate);
    const prev = expenses.filter(t => { const d = new Date(t.date); return d >= prevStart && d < startDate; });
    const total = current.reduce((s, t) => s + Math.abs(t.amount), 0);
    const prevTotal = prev.reduce((s, t) => s + Math.abs(t.amount), 0);

    const map: Record<string, number> = {};
    current.forEach(t => {
      const key = bucketFn(new Date(t.date));
      map[key] = (map[key] || 0) + Math.abs(t.amount);
    });

    // For week view, ensure all days
    if (period === "week") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const data = days.map(d => ({ name: d, amount: map[d] || 0 }));
      return { data, total, prevTotal };
    }

    const data = Object.entries(map).map(([name, amount]) => ({ name, amount }));
    return { data, total, prevTotal };
  }, [transactions, period]);

  const pctChange = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  return (
    <div className={`bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 ${expanded ? "fixed inset-4 z-50 overflow-auto" : ""}`}>
      {expanded && <div className="fixed inset-0 bg-black/30 -z-10" onClick={() => setExpanded(false)} />}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-lg font-bold text-foreground">Total Spendings</h3>
          <p className="text-[13px] text-muted-foreground">Overview of your monthly expenses at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground border border-border rounded-lg px-2.5 py-1.5">
              {LABELS[period]} <ChevronDown className="w-3 h-3" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                {(Object.keys(LABELS) as Period[]).map(p => (
                  <button key={p} onClick={() => { setPeriod(p); setShowDropdown(false); }} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${period === p ? "font-bold text-foreground" : "text-muted-foreground"}`}>{LABELS[p]}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setExpanded(!expanded)} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-4 mt-2">
        <span className="text-4xl font-bold text-foreground">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${pctChange > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
          {pctChange > 0 ? "▲" : "▼"} {Math.abs(pctChange).toFixed(1)}% vs. Last {period === "week" ? "week" : "period"}
        </span>
      </div>

      <div style={{ height: expanded ? 360 : 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.3)" }}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Spent"]}
            />
            <Bar dataKey="amount" fill="#7B5EA7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
