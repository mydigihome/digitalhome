import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { RefreshCw } from "lucide-react";

const PLATFORM_NAMES: Record<string, string> = {
  instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok",
  twitter: "Twitter/X", facebook: "Facebook", pinterest: "Pinterest", linkedin: "LinkedIn",
};

const MOCK_DATA = {
  followers: 12400, following: 892, posts: 347, growth: "+194",
  reach30d: 89421, interactions30d: 9832, engagementRate: "5.1%",
  bestTime: "Tue & Thu at 7pm",
};

const reachData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  reach: 2000 + Math.floor(Math.random() * 3000) + (i > 20 ? 1500 : 0),
}));

const ageData = [
  { name: "18-24", value: 35 }, { name: "25-34", value: 40 },
  { name: "35-44", value: 15 }, { name: "45+", value: 10 },
];
const genderData = [
  { name: "Female", value: 62 }, { name: "Male", value: 35 }, { name: "Other", value: 3 },
];
const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

const heatmapData: number[][] = Array.from({ length: 7 }, () =>
  Array.from({ length: 6 }, () => Math.floor(Math.random() * 100))
);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = ["6am", "9am", "12pm", "3pm", "6pm", "9pm"];

export default function StudioPlatformView({ platform, color }: { platform: string; color: string }) {
  const name = PLATFORM_NAMES[platform] || platform;

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Platform Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: color }}>
            {name[0]}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#111827] dark:text-[#f9fafb]">{name}</h2>
            <p className="text-xs text-[#9ca3af]">@yourhandle · Last synced just now</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-sm text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] transition">
          <RefreshCw className="w-4 h-4" /> Sync
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "FOLLOWERS", value: MOCK_DATA.followers.toLocaleString(), change: MOCK_DATA.growth, up: true },
          { label: "30D REACH", value: MOCK_DATA.reach30d.toLocaleString(), change: "+18%", up: true },
          { label: "30D INTERACTIONS", value: MOCK_DATA.interactions30d.toLocaleString(), change: "+12%", up: true },
          { label: "ENGAGEMENT RATE", value: MOCK_DATA.engagementRate, change: "+0.4%", up: true },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-extrabold text-[#111827] dark:text-[#f9fafb]">{s.value}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              s.up ? "bg-[#f0fdf4] text-[#16a34a] dark:bg-[#1a2e1e] dark:text-[#86efac]" : "bg-[#fff1f2] text-[#be123c]"
            }`}>↑ {s.change}</span>
          </div>
        ))}
      </div>

      {/* Reach Chart */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
        <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] mb-4">Reach (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={reachData}>
            <defs>
              <linearGradient id={`grad-${platform}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="reach" stroke={color} fill={`url(#grad-${platform})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Best Time to Post + Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Time Heatmap */}
        <div className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
          <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] mb-1">Best Time to Post</h3>
          <p className="text-xs text-[#6366f1] font-semibold mb-3">Best: {MOCK_DATA.bestTime}</p>
          <div className="space-y-1">
            <div className="flex gap-1 ml-10">
              {HOURS.map(h => (
                <span key={h} className="flex-1 text-[9px] text-center text-[#9ca3af]">{h}</span>
              ))}
            </div>
            {DAYS.map((day, di) => (
              <div key={day} className="flex items-center gap-1">
                <span className="w-8 text-[10px] text-[#9ca3af] text-right">{day}</span>
                {heatmapData[di].map((val, hi) => (
                  <div
                    key={hi}
                    className="flex-1 h-5 rounded-sm"
                    style={{ backgroundColor: color, opacity: 0.1 + (val / 100) * 0.7 }}
                    title={`${day} ${HOURS[hi]}: ${val}% engagement`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
          <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] mb-3">Audience Demographics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase text-[#9ca3af] mb-1 text-center">Age</p>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={ageData} innerRadius={25} outerRadius={45} dataKey="value" stroke="none">
                    {ageData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {ageData.map((d, i) => (
                  <span key={d.name} className="text-[9px] text-[#6b7280] dark:text-[#9ca3af] flex items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />{d.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-[#9ca3af] mb-1 text-center">Gender</p>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={genderData} innerRadius={25} outerRadius={45} dataKey="value" stroke="none">
                    {genderData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {genderData.map((d, i) => (
                  <span key={d.name} className="text-[9px] text-[#6b7280] dark:text-[#9ca3af] flex items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />{d.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
