import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";

const MOCK_MONTHLY = [
  { month: "Apr", deals: 0, adsense: 180, affiliate: 90, membership: 350, merch: 0, coaching: 400, other: 0 },
  { month: "May", deals: 1500, adsense: 210, affiliate: 120, membership: 380, merch: 50, coaching: 400, other: 0 },
  { month: "Jun", deals: 0, adsense: 240, affiliate: 140, membership: 400, merch: 0, coaching: 600, other: 100 },
  { month: "Jul", deals: 2800, adsense: 280, affiliate: 160, membership: 410, merch: 0, coaching: 400, other: 0 },
  { month: "Aug", deals: 0, adsense: 310, affiliate: 150, membership: 420, merch: 80, coaching: 600, other: 0 },
  { month: "Sep", deals: 3500, adsense: 300, affiliate: 180, membership: 430, merch: 0, coaching: 400, other: 0 },
  { month: "Oct", deals: 0, adsense: 330, affiliate: 200, membership: 430, merch: 90, coaching: 600, other: 50 },
  { month: "Nov", deals: 2200, adsense: 350, affiliate: 190, membership: 430, merch: 0, coaching: 400, other: 0 },
  { month: "Dec", deals: 4000, adsense: 380, affiliate: 220, membership: 430, merch: 120, coaching: 600, other: 0 },
  { month: "Jan", deals: 1800, adsense: 320, affiliate: 170, membership: 430, merch: 0, coaching: 400, other: 0 },
  { month: "Feb", deals: 2500, adsense: 360, affiliate: 200, membership: 430, merch: 0, coaching: 600, other: 0 },
  { month: "Mar", deals: 2500, adsense: 340, affiliate: 180, membership: 430, merch: 0, coaching: 600, other: 0 },
];

const SOURCE_COLORS: Record<string, string> = {
  "Brand Deals": "#6366f1", AdSense: "#8b5cf6", Affiliate: "#10b981", Membership: "#06b6d4", Merch: "#f59e0b", Coaching: "#ec4899", Other: "#9ca3af",
};

const sum = (m: typeof MOCK_MONTHLY[0]) => m.deals + m.adsense + m.affiliate + m.membership + m.merch + m.coaching + m.other;
const currentMonth = MOCK_MONTHLY[MOCK_MONTHLY.length - 1];
const thisMonthTotal = sum(currentMonth);
const lastMonthTotal = sum(MOCK_MONTHLY[MOCK_MONTHLY.length - 2]);
const ytdTotal = MOCK_MONTHLY.reduce((s, m) => s + sum(m), 0);
const bestMonth = Math.max(...MOCK_MONTHLY.map(sum));

const BREAKDOWN = [
  { name: "Brand Deals", value: currentMonth.deals },
  { name: "AdSense", value: currentMonth.adsense },
  { name: "Affiliate", value: currentMonth.affiliate },
  { name: "Membership", value: currentMonth.membership },
  { name: "Coaching", value: currentMonth.coaching },
  { name: "Merch", value: currentMonth.merch },
  { name: "Other", value: currentMonth.other },
].filter(b => b.value > 0);

const INITIAL_ENTRIES = [
  { id: "1", source: "Brand Deals", platform: "Instagram", description: "Notion partnership payout", amount: 2500, date: "Mar 15" },
  { id: "2", source: "Coaching", platform: "", description: "3 coaching sessions", amount: 600, date: "Mar 12" },
  { id: "3", source: "AdSense", platform: "YouTube", description: "March ad revenue", amount: 340, date: "Mar 10" },
  { id: "4", source: "Membership", platform: "", description: "Community membership MRR", amount: 430, date: "Mar 1" },
  { id: "5", source: "Affiliate", platform: "YouTube", description: "Skillshare referrals", amount: 180, date: "Mar 8" },
];

const SOURCES = ["Brand Deals", "AdSense", "Affiliate", "Membership", "Merch", "Coaching", "Other"];

export default function StudioRevenueView() {
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ source: "Brand Deals", platform: "", description: "", amount: 0, date: "" });
  const [sourceFilter, setSourceFilter] = useState("All");

  const addEntry = () => {
    if (!newEntry.description.trim() || !newEntry.amount) return;
    setEntries(prev => [{ ...newEntry, id: Date.now().toString(), date: newEntry.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }, ...prev]);
    setNewEntry({ source: "Brand Deals", platform: "", description: "", amount: 0, date: "" });
    setShowAdd(false);
    toast.success("Revenue entry added");
  };

  const filteredEntries = sourceFilter === "All" ? entries : entries.filter(e => e.source === sourceFilter);

  return (
    <div className="space-y-3 max-w-[1200px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {[
          { label: "THIS MONTH", value: `$${thisMonthTotal.toLocaleString()}` },
          { label: "LAST MONTH", value: `$${lastMonthTotal.toLocaleString()}` },
          { label: "YTD", value: `$${ytdTotal.toLocaleString()}` },
          { label: "BEST MONTH", value: `$${bestMonth.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">{s.label}</p>
            <p className="text-[28px] font-medium text-[#111827] dark:text-[#f9fafb] tracking-tight leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
          <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] mb-3">Revenue Breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={BREAKDOWN} innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {BREAKDOWN.map((entry, i) => <Cell key={i} fill={SOURCE_COLORS[entry.name] || "#6b7280"} />)}
              </Pie>
              <Legend verticalAlign="bottom" height={36} formatter={(value: string) => <span className="text-[10px] text-[#6b7280] dark:text-[#9ca3af]">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-[22px] font-medium text-[#111827] dark:text-[#f9fafb] -mt-4" style={{ fontVariantNumeric: "tabular-nums" }}>${thisMonthTotal.toLocaleString()}</p>
          <p className="text-center text-[10px] text-[#9ca3af]">This Month</p>
        </div>
        <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
          <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] mb-3">Monthly Revenue</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_MONTHLY}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "none" }} />
              <Bar dataKey="deals" stackId="a" fill="#6366f1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="adsense" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="affiliate" stackId="a" fill="#10b981" />
              <Bar dataKey="membership" stackId="a" fill="#06b6d4" />
              <Bar dataKey="coaching" stackId="a" fill="#ec4899" />
              <Bar dataKey="merch" stackId="a" fill="#f59e0b" />
              <Bar dataKey="other" stackId="a" fill="#9ca3af" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entries */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">Revenue Entries</p>
          <button onClick={() => setShowAdd(true)} className="text-[11px] font-medium text-[#6366f1]">+ Add Revenue</button>
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto">
          {["All", ...SOURCES].map(s => (
            <button key={s} onClick={() => setSourceFilter(s)} className={`text-[11px] whitespace-nowrap px-2 py-1 rounded-md transition ${sourceFilter === s ? "bg-[#fafafa] dark:bg-[#0d1017] text-[#111827] dark:text-[#f9fafb] font-medium" : "text-[#9ca3af]"}`}>{s}</button>
          ))}
        </div>

        {/* Add Revenue Form */}
        {showAdd && (
          <div className="mb-4 p-3 rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] space-y-2">
            <div className="flex gap-2">
              <select className="text-[13px] border border-[#e5e7eb] dark:border-[#1f2937] bg-transparent dark:text-[#f9fafb] px-2 py-1.5 rounded-md outline-none" value={newEntry.source} onChange={e => setNewEntry(p => ({ ...p, source: e.target.value }))}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
              <input className="flex-1 text-[13px] border border-[#e5e7eb] dark:border-[#1f2937] bg-transparent dark:text-[#f9fafb] px-3 py-1.5 rounded-md outline-none" placeholder="Description" value={newEntry.description} onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))} />
              <input type="number" className="w-24 text-[13px] border border-[#e5e7eb] dark:border-[#1f2937] bg-transparent dark:text-[#f9fafb] px-3 py-1.5 rounded-md outline-none" placeholder="$" value={newEntry.amount || ""} onChange={e => setNewEntry(p => ({ ...p, amount: Number(e.target.value) }))} />
            </div>
            <div className="flex gap-2">
              <button onClick={addEntry} className="text-[12px] font-medium bg-[#111827] dark:bg-[#f9fafb] text-white dark:text-[#111827] px-3 py-1.5 rounded-md">Add</button>
              <button onClick={() => setShowAdd(false)} className="text-[12px] text-[#9ca3af] px-3 py-1.5">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-0">
          {filteredEntries.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-3 py-2.5 -mx-4 px-4" style={{ borderBottom: i < filteredEntries.length - 1 ? "1px solid #f5f5f5" : "none" }}>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-white shrink-0" style={{ backgroundColor: SOURCE_COLORS[entry.source] || "#6b7280" }}>{entry.source}</span>
              {entry.platform && <span className="text-[10px] text-[#9ca3af] shrink-0">{entry.platform}</span>}
              <span className="text-[13px] text-[#374151] dark:text-[#e5e7eb] flex-1 truncate">{entry.description}</span>
              <span className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>${entry.amount.toLocaleString()}</span>
              <span className="text-[10px] text-[#9ca3af] shrink-0">{entry.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
