import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { RefreshCw, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";

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
    value: Math.random() * (hour >= 7 && hour <= 21 && (day < 5) ? 1 : 0.3),
  }))
).flat();

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MOCK_POSTS = [
  { id: "1", title: "Weekly tips reel", likes: 869, comments: 42, shares: 18, saves: 94, engagement: 4.4 },
  { id: "2", title: "Behind the scenes", likes: 621, comments: 38, shares: 12, saves: 67, engagement: 3.8 },
  { id: "3", title: "Industry insight", likes: 1102, comments: 89, shares: 45, saves: 132, engagement: 5.2 },
];

export default function StudioPlatformsView() {
  const [activePlatform, setActivePlatform] = useState("instagram");
  const platform = PLATFORMS.find(p => p.id === activePlatform) || PLATFORMS[0];
  const roadTo100K = platform.followers < 100000;
  const progress = (platform.followers / 100000) * 100;
  const eta = Math.round((100000 - platform.followers) / (platform.growth30d || 1));

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Platform Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              activePlatform === p.id
                ? "bg-white dark:bg-[#1e2130] shadow-sm border border-[#f0f0f5] dark:border-[#2d3148] text-[#111827] dark:text-[#f9fafb]"
                : "text-[#9ca3af] hover:text-[#374151]"
            }`}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label}
            <span className="text-xs text-[#9ca3af]">{(p.followers / 1000).toFixed(1)}K</span>
          </button>
        ))}
        <button className="px-4 py-2 rounded-full text-sm font-medium text-[#9ca3af] border border-dashed border-[#d1d5db] dark:border-[#2d3148] whitespace-nowrap hover:text-[#374151] transition">
          + Connect
        </button>
      </div>

      {/* Platform Header */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: platform.color }}>
              {platform.label[0]}
            </div>
            <div>
              <p className="font-bold text-sm text-[#111827] dark:text-[#f9fafb]">{platform.username}</p>
              <p className="text-xs text-[#9ca3af]">{platform.label}</p>
            </div>
          </div>
          <button className="flex items-center gap-1 text-xs text-[#9ca3af] hover:text-[#374151] transition">
            <RefreshCw className="w-3 h-3" /> Sync
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Followers", value: platform.followers.toLocaleString(), change: `+${platform.growth30d}` },
            { label: "Following", value: platform.following.toLocaleString() },
            { label: "Posts", value: platform.posts.toLocaleString() },
            { label: "Engagement", value: `${platform.engagement}%`, change: "+0.3%" },
          ].map(s => (
            <div key={s.label}>
              <p className="font-extrabold text-2xl text-[#111827] dark:text-[#f9fafb]">{s.value}</p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-wider text-[#9ca3af]">{s.label}</span>
                {s.change && <span className="text-[10px] font-bold text-[#16a34a]">↑{s.change}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Road to 100K */}
      {roadTo100K && (
        <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
          <p className="font-bold text-sm text-[#111827] dark:text-[#f9fafb] mb-2">Road to 100K</p>
          <div className="w-full h-3 rounded-full bg-[#f3f3f8] dark:bg-[#252836] mb-2">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: platform.color }} />
          </div>
          <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
            <span>{(100000 - platform.followers).toLocaleString()} to go</span>
            <span>+{platform.growth30d}/mo pace</span>
            <span>~{eta} months ETA</span>
          </div>
        </div>
      )}

      {/* Growth Chart */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
        <p className="font-bold text-sm text-[#111827] dark:text-[#f9fafb] mb-3">30-Day Growth</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={GROWTH_DATA}>
            <defs>
              <linearGradient id="platformGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={platform.color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={platform.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={["dataMin - 100", "dataMax + 100"]} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
            <Area type="monotone" dataKey="followers" stroke={platform.color} fill="url(#platformGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Posts */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
        <p className="font-bold text-sm text-[#111827] dark:text-[#f9fafb] mb-3">Recent Posts</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MOCK_POSTS.map(post => (
            <div key={post.id} className="bg-[#f9fafb] dark:bg-[#252836] rounded-[16px] p-4">
              <p className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb] mb-2">{post.title}</p>
              <div className="flex items-center gap-3 text-[#9ca3af] text-[11px]">
                <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{post.likes}</span>
                <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{post.comments}</span>
                <span className="flex items-center gap-0.5"><Share2 className="w-3 h-3" />{post.shares}</span>
                <span className="flex items-center gap-0.5"><Bookmark className="w-3 h-3" />{post.saves}</span>
              </div>
              <span className="text-[10px] font-bold rounded-full px-2 py-0.5 mt-2 inline-block" style={{ color: platform.color, backgroundColor: `${platform.color}15` }}>
                {post.engagement}% eng
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Best Time to Post Heatmap */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
        <div className="mb-3">
          <p className="font-bold text-sm text-[#111827] dark:text-[#f9fafb]">Best Time to Post</p>
          <p className="text-xs text-[#9ca3af]">Best: Tue & Thu at 7pm</p>
        </div>
        <div className="overflow-x-auto">
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `40px repeat(24, 1fr)`, gridTemplateRows: `repeat(7, 20px)` }}>
            {DAYS.map((day, di) => (
              <>
                <div key={`label-${di}`} className="flex items-center text-[10px] text-[#9ca3af] pr-1">{day}</div>
                {Array.from({ length: 24 }, (_, hi) => {
                  const cell = HEATMAP_DATA.find(h => h.day === di && h.hour === hi);
                  const opacity = cell ? cell.value : 0;
                  return (
                    <div
                      key={`${di}-${hi}`}
                      className="rounded-[2px]"
                      style={{ backgroundColor: platform.color, opacity: Math.max(0.05, opacity) }}
                      title={`${day} ${hi}:00 — ${Math.round(opacity * 100)}%`}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-[#f9fafb] dark:bg-[#252836] rounded-[24px] p-5 border border-[#e5e7eb] dark:border-[#2d3148]">
        <p className="text-[10px] uppercase tracking-widest text-[#6366f1] font-bold mb-2">✦ {platform.label} Analysis</p>
        <p className="text-sm text-[#374151] dark:text-[#e5e7eb] leading-relaxed">
          Your {platform.label} engagement rate of {platform.engagement}% is above the industry average of 3.1%.
          Reels and carousel posts consistently outperform single-image posts by 2.3x.
          Consider posting more behind-the-scenes content — your audience responds strongly to authenticity.
          Best posting window: Tuesday and Thursday at 7pm EST.
        </p>
        <button className="text-xs text-[#6366f1] font-semibold mt-3">Refresh Analysis</button>
      </div>
    </div>
  );
}
