import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Heart, MessageCircle, Share2 } from "lucide-react";

const BRANDS = [
  { id: "all", name: "All Brands", color: "#6366f1" },
  { id: "personal", name: "@yourhandle", type: "Personal", color: "#6366f1", followers: 17800, reach30d: 112400, interactions30d: 12300, engagement: 4.2 },
  { id: "business", name: "@yourbrand", type: "Business", color: "#06b6d4", followers: 8200, reach30d: 50843, interactions30d: 5163, engagement: 3.8 },
];

const COMBINED = { followers: 26000, reach: 163243, interactions: 17463, engagement: 4.0 };

const REACH_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  reach: Math.round(3000 + Math.random() * 4000 + (i > 20 ? 1500 : 0)),
}));

const MOCK_POSTS = [
  { id: "1", title: "Weekly tips reel", platform: "Instagram", brand: "personal", likes: 869, comments: 42, shares: 18, engagement: 4.4, color: "#E1306C" },
  { id: "2", title: "Industry hot take", platform: "Instagram", brand: "business", likes: 550, comments: 28, shares: 12, engagement: 2.9, color: "#E1306C" },
  { id: "3", title: "Tutorial video", platform: "YouTube", brand: "personal", likes: 1240, comments: 87, shares: 34, engagement: 8.2, color: "#FF0000" },
];

const MOCK_COMMENTS = [
  { username: "@createyourpresence", text: "Still in awe of this SO GOOD 🙌🙌🙌", platform: "Instagram", time: "2h ago", read: false, avatar: "C" },
  { username: "@jaclynsbladen", text: "So good", platform: "Instagram", time: "3h ago", read: false, avatar: "J" },
  { username: "@rachuelhenry", text: "Great energy on the productivity hacks", platform: "YouTube", time: "5h ago", read: true, avatar: "R" },
  { username: "@thebrandcaptain", text: "honestly needed to hear this today", platform: "Instagram", time: "8h ago", read: true, avatar: "T" },
  { username: "@maddiemarks", text: "Obsessed with this", platform: "TikTok", time: "12h ago", read: true, avatar: "M" },
];

const MOCK_HEADLINES = [
  { title: "Creator economy reaches $250B valuation", source: "AdWeek", time: "2h ago", category: "Industry" },
  { title: "Instagram announces new monetization tools for creators", source: "Social Media Today", time: "4h ago", category: "Platform" },
  { title: "Brand deal rates up 23% for micro-influencers", source: "Digiday", time: "6h ago", category: "Deals" },
];

const CATEGORY_COLORS: Record<string, string> = { Industry: "#6366f1", Platform: "#06b6d4", Deals: "#10b981" };
const PLATFORM_COLORS: Record<string, string> = { Instagram: "#E1306C", YouTube: "#FF0000", TikTok: "#000000" };

export default function StudioOverview() {
  const unreadCount = MOCK_COMMENTS.filter(c => !c.read).length;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Brand Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {BRANDS.map(b => (
          <button key={b.id} className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${b.id === "all" ? "bg-[#6366f1] text-white" : "bg-white dark:bg-[#1e2130] border border-[#e5e7eb] dark:border-[#2d3148] text-[#374151] dark:text-[#e5e7eb]"}`}>
            {b.name}
          </button>
        ))}
        <button className="px-4 py-1.5 rounded-full text-sm font-medium text-[#9ca3af] border border-dashed border-[#d1d5db] dark:border-[#2d3148] whitespace-nowrap hover:text-[#374151] transition">+ Add Brand</button>
      </div>

      {/* Combined Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "COMBINED FOLLOWERS", value: COMBINED.followers.toLocaleString(), change: "+2.4%" },
          { label: "30D REACH", value: COMBINED.reach.toLocaleString(), change: "+8.1%" },
          { label: "30D INTERACTIONS", value: COMBINED.interactions.toLocaleString(), change: "+5.6%" },
          { label: "AVG ENGAGEMENT", value: `${COMBINED.engagement}%`, change: "+0.3%" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
            <p className="text-[2.5rem] font-extrabold tracking-tighter text-[#111827] dark:text-[#f9fafb]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] uppercase tracking-widest text-[#9ca3af] dark:text-[#6b7280]">{s.label}</span>
              <span className="text-xs font-bold text-[#16a34a] bg-[#f0fdf4] dark:bg-[#1a2e1e] rounded-full px-2 py-0.5">↑ {s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Brand Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BRANDS.filter(b => b.id !== "all").map(brand => (
          <div key={brand.id} className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: brand.color }}>{brand.name[1]?.toUpperCase()}</div>
              <div>
                <p className="font-bold text-sm text-[#111827] dark:text-[#f9fafb]">{brand.name}</p>
                <span className="text-[10px] uppercase tracking-wider text-[#9ca3af]">{brand.type}</span>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              {["#E1306C", "#FF0000", "#000000"].map((c, i) => <div key={i} className="w-3 h-3 rounded-full border border-white dark:border-[#1e2130]" style={{ backgroundColor: c }} />)}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><p className="font-extrabold text-xl text-[#111827] dark:text-[#f9fafb]">{(brand.followers || 0).toLocaleString()}</p><p className="text-[10px] uppercase text-[#9ca3af]">Followers</p></div>
              <div><p className="font-extrabold text-xl text-[#111827] dark:text-[#f9fafb]">+{brand.id === "personal" ? 194 : 65}</p><p className="text-[10px] uppercase text-[#9ca3af]">30D Growth</p></div>
              <div><p className="font-extrabold text-xl text-[#111827] dark:text-[#f9fafb]">{brand.engagement}%</p><p className="text-[10px] uppercase text-[#9ca3af]">Engagement</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Reach */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-6 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
        <p className="font-bold text-base text-[#111827] dark:text-[#f9fafb] mb-4">Daily Reach</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={REACH_DATA}>
            <defs><linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
            <Area type="monotone" dataKey="reach" stroke="#6366f1" fill="url(#reachGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-base text-[#111827] dark:text-[#f9fafb]">Recent Posts</p>
          <button className="text-xs text-[#6366f1] font-semibold">View All →</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {MOCK_POSTS.map(post => (
            <div key={post.id} className="w-[200px] flex-shrink-0 bg-white dark:bg-[#1e2130] rounded-[20px] overflow-hidden border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
              <div className="h-[120px] bg-[#f3f3f8] dark:bg-[#252836] flex items-center justify-center relative">
                <span className="text-3xl">🎬</span>
                <span className="absolute top-2 left-2 text-[9px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: post.color }}>{post.platform}</span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb] truncate">{post.title}</p>
                <div className="flex items-center gap-3 mt-2 text-[#9ca3af]">
                  <span className="flex items-center gap-0.5 text-[11px]"><Heart className="w-3 h-3" />{post.likes}</span>
                  <span className="flex items-center gap-0.5 text-[11px]"><MessageCircle className="w-3 h-3" />{post.comments}</span>
                  <span className="flex items-center gap-0.5 text-[11px]"><Share2 className="w-3 h-3" />{post.shares}</span>
                </div>
                <span className="text-[10px] font-bold text-[#6366f1] bg-[#6366f1]/10 dark:bg-[#2d2b4e] rounded-full px-2 py-0.5 mt-2 inline-block">{post.engagement}% eng</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Headlines */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
        <div className="mb-3">
          <p className="font-bold text-base text-[#111827] dark:text-[#f9fafb]">Industry Headlines</p>
          <p className="text-xs text-[#9ca3af]">Creator Economy · Brand Deals · Platform Updates</p>
        </div>
        <div className="space-y-2">
          {MOCK_HEADLINES.map((h, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#f9fafb] dark:bg-[#252836] hover:bg-[#f3f3f8] dark:hover:bg-[#2d3148] transition cursor-pointer">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: CATEGORY_COLORS[h.category] }}>{h.category}</span>
              <span className="text-sm font-medium text-[#111827] dark:text-[#f9fafb] flex-1 truncate">{h.title}</span>
              <span className="text-[11px] text-[#9ca3af] shrink-0">{h.source}</span>
              <span className="text-[11px] text-[#9ca3af] shrink-0">{h.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Inbox */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-base text-[#111827] dark:text-[#f9fafb]">Recent Comments</p>
          {unreadCount > 0 && <span className="bg-[#6366f1] text-white text-xs font-bold rounded-full px-2 py-0.5">{unreadCount}</span>}
        </div>
        <p className="text-xs text-[#9ca3af] mb-3">Across all platforms</p>
        <div className="space-y-2">
          {MOCK_COMMENTS.map((c, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition cursor-pointer ${c.read ? "bg-white dark:bg-[#1e2130]" : "bg-[#fafafa] dark:bg-[#252836] border-l-[3px] border-[#6366f1]"}`}>
              <div className="w-8 h-8 rounded-full bg-[#e1e0ff] dark:bg-[#2d2b4e] flex items-center justify-center text-[#4648d4] dark:text-[#a5b4fc] text-xs font-bold shrink-0">{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-[#111827] dark:text-[#f9fafb]">{c.username}</span>
                <p className="text-sm text-[#374151] dark:text-[#e5e7eb] truncate">{c.text}</p>
              </div>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[c.platform] || "#6b7280" }} title={c.platform} />
              <span className="text-[11px] text-[#9ca3af] shrink-0">{c.time}</span>
            </div>
          ))}
        </div>
        <button className="text-xs text-[#6366f1] font-semibold mt-3">View All Comments →</button>
      </div>

      {/* Why We Do This */}
      <div>
        <p className="font-bold text-base italic text-[#111827] dark:text-[#f9fafb] mb-3">Why We Do This</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_COMMENTS.filter(c => c.text.length > 15).slice(0, 3).map((c, i) => (
            <div key={i} className="bg-[#f9fafb] dark:bg-[#252836] rounded-[20px] p-4 border border-[#f0f0f5] dark:border-[#2d3148]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#e1e0ff] dark:bg-[#2d2b4e] flex items-center justify-center text-[#4648d4] dark:text-[#a5b4fc] text-[10px] font-bold">{c.avatar}</div>
                <span className="text-xs font-bold text-[#374151] dark:text-[#e5e7eb]">{c.username}</span>
                <div className="w-2.5 h-2.5 rounded-full ml-auto" style={{ backgroundColor: PLATFORM_COLORS[c.platform] || "#6b7280" }} />
              </div>
              <p className="text-sm italic text-[#374151] dark:text-[#e5e7eb] leading-relaxed">"{c.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
