import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Plus } from "lucide-react";

const MOCK_MONTHLY = [
  { month: "Jul", adsense: 280, sponsorship: 0, affiliate: 120, merch: 0 },
  { month: "Aug", adsense: 310, sponsorship: 1500, affiliate: 95, merch: 50 },
  { month: "Sep", adsense: 340, sponsorship: 0, affiliate: 200, merch: 0 },
  { month: "Oct", adsense: 290, sponsorship: 2500, affiliate: 180, merch: 80 },
  { month: "Nov", adsense: 380, sponsorship: 0, affiliate: 150, merch: 0 },
  { month: "Dec", adsense: 420, sponsorship: 3000, affiliate: 250, merch: 120 },
  { month: "Jan", adsense: 350, sponsorship: 1800, affiliate: 190, merch: 0 },
  { month: "Feb", adsense: 400, sponsorship: 2200, affiliate: 210, merch: 0 },
  { month: "Mar", adsense: 340, sponsorship: 2500, affiliate: 180, merch: 0 },
];

const BREAKDOWN = [
  { name: "Ad Revenue", value: 340, color: "#6366f1" },
  { name: "Sponsorships", value: 2500, color: "#8b5cf6" },
  { name: "Affiliate", value: 180, color: "#10b981" },
  { name: "Merchandise", value: 0, color: "#f59e0b" },
  { name: "Other", value: 0, color: "#ec4899" },
];

const MOCK_ENTRIES = [
  { source: "AdSense", platform: "YouTube", description: "March ad revenue", amount: 340, date: "Mar 15" },
  { source: "Sponsorship", platform: "Instagram", description: "Notion partnership", amount: 2500, date: "Mar 10" },
  { source: "Affiliate", platform: "YouTube", description: "Skillshare referrals", amount: 180, date: "Mar 8" },
];

const SOURCE_COLORS: Record<string, string> = {
  AdSense: "#6366f1", Sponsorship: "#8b5cf6", Affiliate: "#10b981", Merchandise: "#f59e0b", Other: "#ec4899",
};

export default function StudioRevenueView() {
  const thisMonth = MOCK_ENTRIES.reduce((s, e) => s + e.amount, 0);
  const lastMonth = 2810;
  const ytd = MOCK_MONTHLY.reduce((s, m) => s + m.adsense + m.sponsorship + m.affiliate + m.merch, 0);
  const avgMonth = Math.round(ytd / MOCK_MONTHLY.length);

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "THIS MONTH", value: `$${thisMonth.toLocaleString()}` },
          { label: "LAST MONTH", value: `$${lastMonth.toLocaleString()}` },
          { label: "YTD", value: `$${ytd.toLocaleString()}` },
          { label: "AVG / MONTH", value: `$${avgMonth.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-extrabold text-[#111827] dark:text-[#f9fafb]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut Breakdown */}
        <div className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
          <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] mb-3">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={BREAKDOWN.filter(b => b.value > 0)} innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {BREAKDOWN.filter(b => b.value > 0).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Bar Chart */}
        <div className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
          <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] mb-3">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_MONTHLY}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Bar dataKey="adsense" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="sponsorship" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="affiliate" stackId="a" fill="#10b981" />
              <Bar dataKey="merch" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Entries */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb]">Revenue Entries</h3>
          <button className="flex items-center gap-1.5 bg-[#6366f1] text-white rounded-[12px] px-3 py-2 text-xs font-semibold hover:opacity-90 transition">
            <Plus className="w-3 h-3" /> Add Revenue
          </button>
        </div>

        <div className="space-y-2">
          {MOCK_ENTRIES.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#f9fafb] dark:bg-[#252836]">
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                style={{ backgroundColor: SOURCE_COLORS[entry.source] || "#6b7280" }}
              >
                {entry.source}
              </span>
              <span className="text-xs text-[#6b7280] dark:text-[#9ca3af] shrink-0">{entry.platform}</span>
              <span className="text-sm text-[#374151] dark:text-[#e5e7eb] flex-1 truncate">{entry.description}</span>
              <span className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] shrink-0">${entry.amount.toLocaleString()}</span>
              <span className="text-xs text-[#9ca3af] shrink-0">{entry.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
