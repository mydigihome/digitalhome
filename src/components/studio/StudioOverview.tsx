import { AreaChart, Area, ResponsiveContainer, LineChart, Line } from "recharts";
import { RefreshCw, Sparkles } from "lucide-react";

const MOCK_STATS = [
  { label: "COMBINED FOLLOWERS", value: "20,600", change: "+259", up: true },
  { label: "30D REACH", value: "163,243", change: "+12.4%", up: true },
  { label: "30D INTERACTIONS", value: "17,463", change: "+8.2%", up: true },
  { label: "AVG ENGAGEMENT", value: "4.7%", change: "-0.3%", up: false },
];

const MOCK_PLATFORMS = [
  {
    id: "instagram", name: "Instagram", username: "@yourhandle", color: "#E1306C",
    followers: 12400, following: 892, posts: 347, growth: "+194",
    chartData: Array.from({ length: 30 }, (_, i) => ({ d: i, v: 12200 + Math.floor(Math.random() * 200) + i * 6 })),
  },
  {
    id: "youtube", name: "YouTube", username: "@yourchannel", color: "#FF0000",
    followers: 8200, following: 45, posts: 89, growth: "+65",
    chartData: Array.from({ length: 30 }, (_, i) => ({ d: i, v: 8100 + Math.floor(Math.random() * 100) + i * 2 })),
  },
];

const MOCK_REACH = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  reach: 3000 + Math.floor(Math.random() * 4000) + (i > 15 ? 2000 : 0),
}));

const MOCK_POSTS = [
  { platform: "Instagram", type: "Reel", caption: "5 productivity tips for creators ✨", likes: 1243, comments: 89, shares: 45, saves: 234, engagement: "6.2%", daysAgo: 2, color: "#E1306C" },
  { platform: "YouTube", type: "Video", caption: "How I Built My Content Empire", likes: 892, comments: 156, shares: 78, saves: 0, engagement: "4.8%", daysAgo: 5, color: "#FF0000" },
  { platform: "Instagram", type: "Post", caption: "Behind the scenes of today's shoot 📸", likes: 678, comments: 34, shares: 12, saves: 89, engagement: "3.1%", daysAgo: 7, color: "#E1306C" },
];

export default function StudioOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Combined Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MOCK_STATS.map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] font-semibold mb-1">{s.label}</p>
            <p className="text-3xl font-extrabold text-[#111827] dark:text-[#f9fafb]">{s.value}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              s.up ? "bg-[#f0fdf4] text-[#16a34a] dark:bg-[#1a2e1e] dark:text-[#86efac]" : "bg-[#fff1f2] text-[#be123c] dark:bg-[#2d1b1e] dark:text-[#fca5a5]"
            }`}>
              {s.up ? "↑" : "↓"} {s.change}
            </span>
          </div>
        ))}
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_PLATFORMS.map(p => (
          <div key={p.id} className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.color }}>
                  {p.name[0]}
                </div>
                <div>
                  <span className="font-bold text-sm text-[#111827] dark:text-[#f9fafb]">{p.username}</span>
                  <span className="ml-2 text-xs text-[#16a34a] dark:text-[#86efac] font-semibold">{p.growth} this month</span>
                </div>
              </div>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f3f3f8] dark:hover:bg-[#252836] transition">
                <RefreshCw className="w-4 h-4 text-[#9ca3af]" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: "FOLLOWERS", val: p.followers.toLocaleString() },
                { label: "FOLLOWING", val: p.following.toLocaleString() },
                { label: "POSTS", val: p.posts.toLocaleString() },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-xl font-extrabold text-[#111827] dark:text-[#f9fafb]">{s.val}</p>
                  <p className="text-[10px] uppercase text-[#9ca3af] dark:text-[#6b7280]">{s.label}</p>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={p.chartData}>
                <Line type="monotone" dataKey="v" stroke={p.color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            {p.followers < 100000 && (
              <div className="mt-3 pt-3 border-t border-[#f0f0f5] dark:border-[#2d3148]">
                <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-1">Road to 100K</p>
                <div className="w-full h-2 bg-[#f3f3f8] dark:bg-[#252836] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(p.followers / 100000) * 100}%`, backgroundColor: p.color }} />
                </div>
                <p className="text-[11px] text-[#9ca3af] mt-1">{(100000 - p.followers).toLocaleString()} followers to go</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Daily Reach Chart */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
        <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] mb-4">Daily Reach (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={MOCK_REACH}>
            <defs>
              <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="reach" stroke="#6366f1" fill="url(#reachGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Posts */}
      <div>
        <h3 className="text-sm font-bold text-[#111827] dark:text-[#f9fafb] mb-4">Recent Posts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_POSTS.map((post, i) => (
            <div key={i} className="bg-white dark:bg-[#1e2130] rounded-[20px] overflow-hidden border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
              <div className="bg-[#f9fafb] dark:bg-[#252836] p-4 relative">
                <span className="absolute top-2 left-2 text-[9px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: post.color }}>
                  {post.platform}
                </span>
                <p className="text-sm text-[#374151] dark:text-[#e5e7eb] mt-4">{post.caption}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 text-xs text-[#6b7280] dark:text-[#9ca3af]">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span>↗ {post.shares}</span>
                  {post.saves > 0 && <span>🔖 {post.saves}</span>}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold text-[#6366f1] bg-[#6366f1]/10 px-2 py-0.5 rounded-full">{post.engagement} engagement</span>
                  <span className="text-xs text-[#9ca3af]">{post.daysAgo}d ago</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-[#f9fafb] dark:bg-[#252836] border border-[#e5e7eb] dark:border-[#2d3148] rounded-[20px] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase text-[#6366f1] font-bold tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Strategy Analysis
          </span>
          <button className="text-[#6366f1] text-xs font-semibold hover:underline">Refresh Analysis</button>
        </div>
        <p className="text-sm text-[#374151] dark:text-[#e5e7eb] leading-relaxed">
          Your Instagram Reels are outperforming static posts by 3.2x in engagement. YouTube tutorials with "How I..." titles get 40% more watch time.
          Consider posting Reels on Tuesday and Thursday at 7pm for maximum reach. Your audience is most active between 6-9pm EST.
          Top-performing hashtags: #CreatorEconomy #ContentTips #DigitalCreator. Try incorporating more behind-the-scenes content — it drove 2x saves this month.
        </p>
      </div>
    </div>
  );
}
