import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#E1306C", username: "@yourhandle", followers: 12400, following: 820, posts: 347, engagement: 4.2, growth30d: 194 },
  { id: "youtube", label: "YouTube", color: "#FF0000", username: "@yourchannel", followers: 5400, following: 0, posts: 89, engagement: 6.1, growth30d: 34 },
  { id: "tiktok", label: "TikTok", color: "#000000", username: "@yourhandle", followers: 8200, following: 312, posts: 156, engagement: 5.8, growth30d: 65 },
  { id: "twitter", label: "Twitter/X", color: "#1DA1F2", username: "@yourhandle", followers: 3200, following: 450, posts: 1240, engagement: 2.1, growth30d: 28 },
];

const GROWTH_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  followers: Math.round(12000 + i * 15 + Math.random() * 40),
}));

const HEATMAP_DATA = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hour) => ({
    day, hour,
    value: Math.random() * (hour >= 7 && hour <= 21 && day < 5 ? 1 : 0.3),
  }))
).flat();

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MOCK_POSTS = [
  { id: "1", title: "Weekly tips reel", type: "Reel", typeBg: "#fee2e2", typeColor: "#991b1b", likes: 869, comments: 42, shares: 18, saves: 94, engagement: "4.4%", date: "Mar 25" },
  { id: "2", title: "Behind the scenes", type: "Post", typeBg: "#dbeafe", typeColor: "#1e40af", likes: 621, comments: 38, shares: 12, saves: 67, engagement: "3.8%", date: "Mar 24" },
  { id: "3", title: "Industry insight", type: "Carousel", typeBg: "#fef3c7", typeColor: "#92400e", likes: 1102, comments: 89, shares: 45, saves: 132, engagement: "5.2%", date: "Mar 23" },
];

export default function StudioPlatformsView() {
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [syncing, setSyncing] = useState(false);
  const platform = PLATFORMS.find(p => p.id === activePlatform) || PLATFORMS[0];
  const progress = (platform.followers / 100000) * 100;

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); toast.success(`${platform.label} synced`); }, 1500);
  };

  const handleConnect = () => {
    toast.info(`Add ${activePlatform.toUpperCase()}_CLIENT_ID to environment variables to enable`);
  };

  return (
    <div className="space-y-3 max-w-[1200px] mx-auto">
      {/* Platform Selector */}
      <div className="flex items-center gap-0 overflow-x-auto border-b border-[#e5e7eb] dark:border-[#1f2937]">
        {PLATFORMS.map(p => (
          <button key={p.id} onClick={() => setActivePlatform(p.id)} className={`flex items-center gap-2 px-4 py-2.5 text-[13px] whitespace-nowrap transition border-b-2 ${activePlatform === p.id ? "border-[#6366f1] text-[#111827] dark:text-[#f9fafb] font-medium" : "border-transparent text-[#9ca3af] hover:text-[#374151]"}`}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label}
            <span className="text-[10px] text-[#9ca3af]">{(p.followers / 1000).toFixed(1)}K</span>
          </button>
        ))}
        <button onClick={handleConnect} className="px-4 py-2.5 text-[13px] text-[#9ca3af] whitespace-nowrap hover:text-[#374151] transition border-b-2 border-transparent">+ Connect</button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {[
          { label: "FOLLOWERS", value: platform.followers.toLocaleString(), change: `+${platform.growth30d}` },
          { label: "FOLLOWING", value: platform.following.toLocaleString() },
          { label: "POSTS", value: platform.posts.toLocaleString() },
          { label: "ENGAGEMENT", value: `${platform.engagement}%`, change: "+0.3%" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">{s.label}</p>
            <p className="text-[28px] font-medium text-[#111827] dark:text-[#f9fafb] tracking-tight leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
            {s.change && <span className="text-[11px] text-[#16a34a] font-medium">{s.change}</span>}
          </div>
        ))}
      </div>

      {/* Road to 100K */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <p className="text-[11px] font-medium text-[#374151] dark:text-[#e5e7eb] mb-2">{platform.username} Road to 100K</p>
        <div className="w-full h-[3px] bg-[#f0f0f0] dark:bg-[#1f2937] rounded-lg">
          <div className="h-full bg-[#111827] dark:bg-[#f9fafb] rounded-lg" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2 flex-wrap text-[11px]">
          <span className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">{(100000 - platform.followers).toLocaleString()} to go</span>
          <span className="text-[10px] text-[#9ca3af]">YTD GROWTH: <span className="font-medium text-[#111827] dark:text-[#f9fafb]">+{platform.growth30d * 3}</span></span>
          <span className="text-[10px] text-[#9ca3af]">MONTHLY PACE: <span className="font-medium text-[#111827] dark:text-[#f9fafb]">+{platform.growth30d}/mo</span></span>
          <span className="text-[10px] text-[#9ca3af]">ETA: <span className="font-medium text-[#111827] dark:text-[#f9fafb]">{Math.ceil((100000 - platform.followers) / (platform.growth30d || 1) / 12)} years</span></span>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">30-Day Growth</p>
          <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1 text-[11px] text-[#9ca3af] hover:text-[#374151] transition disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={GROWTH_DATA}>
            <defs><linearGradient id="platformGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={platform.color} stopOpacity={0.1} /><stop offset="100%" stopColor={platform.color} stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={["dataMin - 100", "dataMax + 100"]} />
            <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "none" }} />
            <Area type="monotone" dataKey="followers" stroke={platform.color} fill="url(#platformGrad)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Posts */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] mb-3">Recent Posts</p>
        {MOCK_POSTS.map((post, i) => (
          <div key={post.id} className="flex gap-3 py-3 cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#0d1017] -mx-4 px-4 transition" style={{ borderBottom: i < MOCK_POSTS.length - 1 ? "1px solid #f5f5f5" : "none" }}>
            <div className="w-12 h-12 rounded bg-[#f3f3f8] dark:bg-[#1f2937] shrink-0 flex items-center justify-center text-[#9ca3af] text-[10px]">IMG</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: post.typeBg, color: post.typeColor }}>{post.type}</span>
                <span className="text-[10px] text-[#9ca3af]">{post.date}</span>
              </div>
              <p className="text-[12px] text-[#374151] dark:text-[#e5e7eb] mb-0.5">{post.title}</p>
              <p className="text-[11px] text-[#9ca3af]">{post.likes} likes · {post.comments} comments · {post.engagement}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Best Time to Post Heatmap */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] mb-1">Best Time to Post</p>
        <p className="text-[11px] text-[#9ca3af] mb-3">Best: Tue & Thu at 7pm</p>
        <div className="overflow-x-auto">
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `40px repeat(24, 1fr)`, gridTemplateRows: `repeat(7, 16px)` }}>
            {DAYS.map((day, di) => (
              <div key={`row-${di}`} className="contents">
                <div className="flex items-center text-[10px] text-[#9ca3af] pr-1">{day}</div>
                {Array.from({ length: 24 }, (_, hi) => {
                  const cell = HEATMAP_DATA.find(h => h.day === di && h.hour === hi);
                  return <div key={`${di}-${hi}`} className="rounded-sm" style={{ backgroundColor: platform.color, opacity: Math.max(0.05, cell?.value || 0) }} title={`${day} ${hi}:00`} />;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#6366f1] mb-2">{platform.label} Analysis</p>
        <p className="text-[13px] text-[#374151] dark:text-[#e5e7eb] leading-relaxed">
          Your {platform.label} engagement rate of {platform.engagement}% is above the industry average of 3.1%.
          Reels and carousel posts consistently outperform single-image posts by 2.3x.
          Consider posting more behind-the-scenes content — your audience responds strongly to authenticity.
          Best posting window: Tuesday and Thursday at 7pm EST.
        </p>
        <button onClick={() => toast.success("Analysis refreshed")} className="text-[11px] text-[#6366f1] font-medium mt-3">Refresh Analysis</button>
      </div>
    </div>
  );
}
