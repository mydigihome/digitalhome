import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Plus, Search } from "lucide-react";

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
  "Brand Deals": "#6366f1",
  AdSense: "#8b5cf6",
  Affiliate: "#10b981",
  Membership: "#06b6d4",
  Merch: "#f59e0b",
  Coaching: "#ec4899",
  Other: "#9ca3af",
};

const currentMonth = MOCK_MONTHLY[MOCK_MONTHLY.length - 1];
const thisMonthTotal = currentMonth.deals + currentMonth.adsense + currentMonth.affiliate + currentMonth.membership + currentMonth.merch + currentMonth.coaching + currentMonth.other;
const lastMonth = MOCK_MONTHLY[MOCK_MONTHLY.length - 2];
const lastMonthTotal = lastMonth.deals + lastMonth.adsense + lastMonth.affiliate + lastMonth.membership + lastMonth.merch + lastMonth.coaching + lastMonth.other;
const ytdTotal = MOCK_MONTHLY.reduce((s, m) => s + m.deals + m.adsense + m.affiliate + m.membership + m.merch + m.coaching + m.other, 0);
const bestMonth = Math.max(...MOCK_MONTHLY.map(m => m.deals + m.adsense + m.affiliate + m.membership + m.merch + m.coaching + m.other));

const BREAKDOWN = [
  { name: "Brand Deals", value: currentMonth.deals },
  { name: "AdSense", value: currentMonth.adsense },
  { name: "Affiliate", value: currentMonth.affiliate },
  { name: "Membership", value: currentMonth.membership },
  { name: "Coaching", value: currentMonth.coaching },
  { name: "Merch", value: currentMonth.merch },
  { name: "Other", value: currentMonth.other },
].filter(b => b.value > 0);

const MOCK_ENTRIES = [
  { source: "Brand Deals", platform: "Instagram", description: "Notion partnership payout", amount: 2500, date: "Mar 15" },
  { source: "Coaching", platform: "", description: "3 coaching sessions", amount: 600, date: "Mar 12" },
  { source: "AdSense", platform: "YouTube", description: "March ad revenue", amount: 340, date: "Mar 10" },
  { source: "Membership", platform: "", description: "Community membership MRR", amount: 430, date: "Mar 1" },
  { source: "Affiliate", platform: "YouTube", description: "Skillshare referrals", amount: 180, date: "Mar 8" },
];

export default function StudioRevenueView() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "THIS MONTH", value: `$${thisMonthTotal.toLocaleString()}` },
          { label: "LAST MONTH", value: `$${lastMonthTotal.toLocaleString()}` },
          { label: "YTD", value: `$${ytdTotal.toLocaleString()}` },
          { label: "BEST MONTH", value: `$${bestMonth.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
            <p className="text-[2rem] font-extrabold tracking-tighter text-[#111827] dark:text-[#f9fafb]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {s.value}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[#9ca3af] dark:text-[#6b7280]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
          <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] mb-3">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={BREAKDOWN} innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                {BREAKDOWN.map((entry, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[entry.name] || "#6b7280"} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => <span className="text-xs text-[#6b7280] dark:text-[#9ca3af]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-2xl font-extrabold text-[#111827] dark:text-[#f9fafb] -mt-4">${thisMonthTotal.toLocaleString()}</p>
          <p className="text-center text-[10px] uppercase text-[#9ca3af]">This Month</p>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
          <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] mb-3">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MOCK_MONTHLY}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Bar dataKey="deals" stackId="a" fill="#6366f1" />
              <Bar dataKey="adsense" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="affiliate" stackId="a" fill="#10b981" />
              <Bar dataKey="membership" stackId="a" fill="#06b6d4" />
              <Bar dataKey="coaching" stackId="a" fill="#ec4899" />
              <Bar dataKey="merch" stackId="a" fill="#f59e0b" />
              <Bar dataKey="other" stackId="a" fill="#9ca3af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entries */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
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
              {entry.platform && <span className="text-xs text-[#6b7280] dark:text-[#9ca3af] shrink-0">{entry.platform}</span>}
              <span className="text-sm text-[#374151] dark:text-[#e5e7eb] flex-1 truncate">{entry.description}</span>
              <span className="text-sm font-bold text-[#6366f1] shrink-0">${entry.amount.toLocaleString()}</span>
              <span className="text-xs text-[#9ca3af] shrink-0">{entry.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
