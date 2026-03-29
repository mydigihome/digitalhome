import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Heart, MessageCircle, Share2, ChevronRight } from "lucide-react";

const COMBINED = { followers: 26000, reach: 163243, interactions: 17463, engagement: 4.0 };

const BRANDS = [
  { id: "personal", name: "@yourhandle", type: "Personal", color: "#6366f1", followers: 17800, growth30d: "+194", engagement: "4.2%" },
  { id: "business", name: "@yourbrand", type: "Business", color: "#06b6d4", followers: 8200, growth30d: "+65", engagement: "3.8%" },
];

const REACH_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  reach: Math.round(3000 + Math.random() * 4000 + (i > 20 ? 1500 : 0)),
}));

const MOCK_POSTS = [
  { id: "1", title: "Weekly tips reel", platform: "Instagram", brand: "@yourhandle", type: "Reel", typeBg: "#fee2e2", typeColor: "#991b1b", likes: 869, comments: 42, engagement: "4.4%", date: "Mar 25, 7:02 PM", caption: "5 morning habits that changed my entire workflow this year...", recentComment: { user: "@createyourpresence", text: "Still in awe of this SO GOOD" } },
  { id: "2", title: "Industry hot take", platform: "Instagram", brand: "@yourbrand", type: "Carousel", typeBg: "#dbeafe", typeColor: "#1e40af", likes: 550, comments: 28, engagement: "2.9%", date: "Mar 24, 12:15 PM", caption: "The real reason most brands fail at content marketing...", recentComment: { user: "@thebrandcaptain", text: "honestly needed to hear this today" } },
  { id: "3", title: "Tutorial video", platform: "YouTube", brand: "@yourhandle", type: "Video", typeBg: "#fef3c7", typeColor: "#92400e", likes: 1240, comments: 87, engagement: "8.2%", date: "Mar 23, 3:00 PM", caption: "Complete guide to setting up your home studio under $500...", recentComment: { user: "@rachuelhenry", text: "Great energy on the productivity hacks" } },
];

const MOCK_COMMENTS = [
  { username: "@createyourpresence", text: "Still in awe of this SO GOOD", platform: "Instagram", time: "2h ago", read: false, avatar: "C" },
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

const PLATFORM_COLORS: Record<string, string> = { Instagram: "#E1306C", YouTube: "#FF0000", TikTok: "#000000" };

const STRATEGY_FIELDS = [
  { key: "primary_goals", label: "PRIMARY GOALS", placeholder: "What do you want to achieve in the next 90 days?" },
  { key: "target_audience", label: "TARGET AUDIENCE", placeholder: "Who are you talking to? Age, interests, pain points." },
  { key: "competitor_analysis", label: "COMPETITOR ANALYSIS", placeholder: "Who are you watching? What are they doing well or missing?" },
  { key: "brand_voice", label: "BRAND VOICE", placeholder: "How do you sound? (e.g. direct, warm, educational, bold)" },
  { key: "content_pillars", label: "CONTENT PILLARS", placeholder: "The 3-5 topics you always come back to." },
];

export default function StudioOverview() {
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [strategy, setStrategy] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const unreadCount = MOCK_COMMENTS.filter(c => !c.read).length;

  const hasStrategy = Object.values(strategy).some(v => v && v.trim());

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      {/* Combined Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ border: "1px solid #e5e7eb" }}>
        {[
          { label: "COMBINED FOLLOWERS", value: COMBINED.followers.toLocaleString(), sub: "Both accounts combined", change: "+297 YTD" },
          { label: "30D REACH", value: COMBINED.reach.toLocaleString(), change: "+8.1%" },
          { label: "30D INTERACTIONS", value: COMBINED.interactions.toLocaleString(), change: "+5.6%" },
          { label: "AVG ENGAGEMENT", value: `${COMBINED.engagement}%`, change: "+0.3%" },
        ].map((s, i) => (
          <div key={s.label} className="bg-white dark:bg-[#1e2130] p-4" style={{ borderRight: i < 3 ? "1px solid #e5e7eb" : "none" }}>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">{s.label}</p>
            <p className="text-[28px] font-medium text-[#111827] dark:text-[#f9fafb] tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
            {s.sub && <p className="text-[10px] text-[#9ca3af]">{s.sub}</p>}
            <span className="text-[11px] text-[#16a34a] font-medium">{s.change}</span>
          </div>
        ))}
      </div>

      {/* Brand Performance — Two Column */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ border: "1px solid #e5e7eb" }}>
        {BRANDS.map((brand, i) => (
          <div key={brand.id} className="bg-white dark:bg-[#1e2130] p-4" style={{ borderRight: i === 0 ? "1px solid #e5e7eb" : "none" }}>
            <div className="flex items-center gap-2 pb-3 mb-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold" style={{ backgroundColor: brand.color }}>
                {brand.name[1]?.toUpperCase()}
              </div>
              <span className="text-[12px] font-semibold text-[#374151] dark:text-[#e5e7eb]">{brand.name}</span>
              <span className="text-[10px] text-[#9ca3af] ml-auto">{brand.type}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-0.5">Followers</p>
                <p className="text-[20px] font-medium text-[#111827] dark:text-[#f9fafb]" style={{ fontVariantNumeric: "tabular-nums" }}>{brand.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-0.5">30D Growth</p>
                <p className="text-[20px] font-medium text-[#16a34a]" style={{ fontVariantNumeric: "tabular-nums" }}>{brand.growth30d}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-0.5">Engagement</p>
                <p className="text-[20px] font-medium text-[#111827] dark:text-[#f9fafb]" style={{ fontVariantNumeric: "tabular-nums" }}>{brand.engagement}</p>
              </div>
            </div>

            {/* Road to 100K */}
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid #f0f0f0" }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Road to 100K</p>
              <div className="w-full h-1 bg-[#f0f0f0] dark:bg-[#252836]">
                <div className="h-full bg-[#111827] dark:bg-[#f9fafb]" style={{ width: `${(brand.followers / 100000) * 100}%` }} />
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-[#9ca3af]">
                <span className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">{(100000 - brand.followers).toLocaleString()} to go</span>
              </div>
            </div>

            {/* Latest Posts */}
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid #f0f0f0" }}>
              <p className="text-[11px] font-semibold text-[#374151] dark:text-[#e5e7eb] mb-2">{brand.name} Latest Posts</p>
              <div className="space-y-3">
                {MOCK_POSTS.filter(p => p.brand === brand.name).slice(0, 2).map(post => (
                  <div key={post.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded bg-[#f3f3f8] dark:bg-[#252836] shrink-0 flex items-center justify-center text-[#9ca3af] text-[10px]">IMG</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: post.typeBg, color: post.typeColor }}>{post.type}</span>
                        <span className="text-[10px] text-[#9ca3af]">{post.date}</span>
                      </div>
                      <p className="text-[12px] text-[#374151] dark:text-[#e5e7eb] line-clamp-2">{post.caption}</p>
                      <p className="text-[11px] text-[#9ca3af] mt-0.5">{post.likes} likes · {post.comments} comments · {post.engagement}</p>
                      {post.recentComment && (
                        <div className="mt-1 pl-2 text-[11px] text-[#6b7280]" style={{ borderLeft: "2px solid #f0f0f0" }}>
                          <span className="font-medium">{post.recentComment.user}</span> {post.recentComment.text}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Reach */}
      <div className="bg-white dark:bg-[#1e2130] p-4" style={{ border: "1px solid #e5e7eb" }}>
        <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] mb-3">Daily Reach</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={REACH_DATA}>
            <defs><linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.1} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "none" }} />
            <Area type="monotone" dataKey="reach" stroke="#6366f1" fill="url(#reachGrad)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Brand Strategy — Collapsible */}
      <div className="bg-white dark:bg-[#1e2130]" style={{ border: "1px solid #e5e7eb" }}>
        <button
          onClick={() => setStrategyOpen(!strategyOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <ChevronRight className={`w-3.5 h-3.5 text-[#9ca3af] transition-transform ${strategyOpen ? "rotate-90" : ""}`} />
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af]">Brand Strategy</span>
          </div>
          <span className="text-[11px] text-[#6366f1]">Edit</span>
        </button>
        {strategyOpen && (
          <div className="px-4 pb-4 space-y-4">
            {STRATEGY_FIELDS.map(field => (
              <div key={field.key}>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">{field.label}</p>
                {editingField === field.key ? (
                  <textarea
                    autoFocus
                    className="w-full text-[13px] text-[#374151] dark:text-[#e5e7eb] bg-transparent border-0 border-b border-[#6366f1] outline-none resize-none leading-relaxed pb-1"
                    value={strategy[field.key] || ""}
                    onChange={e => setStrategy(prev => ({ ...prev, [field.key]: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    placeholder={field.placeholder}
                    rows={2}
                  />
                ) : (
                  <p
                    onClick={() => setEditingField(field.key)}
                    className="text-[13px] leading-relaxed cursor-pointer min-h-[20px]"
                    style={{ color: strategy[field.key] ? "#374151" : "#d1d5db" }}
                  >
                    {strategy[field.key] || field.placeholder}
                  </p>
                )}
              </div>
            ))}
            <button onClick={() => setStrategyOpen(false)} className="text-[11px] text-[#9ca3af]">
              Collapse
            </button>
          </div>
        )}
      </div>

      {/* Headlines */}
      <div className="bg-white dark:bg-[#1e2130] p-4" style={{ border: "1px solid #e5e7eb" }}>
        <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] mb-1">Industry Headlines</p>
        <p className="text-[10px] text-[#9ca3af] mb-3">Creator Economy · Brand Deals · Platform Updates</p>
        <div className="space-y-0">
          {MOCK_HEADLINES.map((h, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#252836] transition -mx-4 px-4" style={{ borderBottom: i < MOCK_HEADLINES.length - 1 ? "1px solid #f5f5f5" : "none" }}>
              <span className="text-[10px] font-semibold text-[#9ca3af] shrink-0 w-14">{h.category}</span>
              <span className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] flex-1 truncate">{h.title}</span>
              <span className="text-[11px] text-[#9ca3af] shrink-0">{h.source}</span>
              <span className="text-[11px] text-[#9ca3af] shrink-0">{h.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Inbox */}
      <div className="bg-white dark:bg-[#1e2130] p-4" style={{ border: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">Recent Comments</p>
          {unreadCount > 0 && <span className="bg-[#111827] dark:bg-[#f9fafb] text-white dark:text-[#111827] text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unreadCount}</span>}
        </div>
        <p className="text-[10px] text-[#9ca3af] mb-3">Across all platforms</p>
        <div className="space-y-0">
          {MOCK_COMMENTS.map((c, i) => (
            <div key={i} className={`flex items-center gap-3 py-2.5 -mx-4 px-4 cursor-pointer ${!c.read ? "border-l-[3px] border-l-[#111827] dark:border-l-[#f9fafb] bg-[#fafafa] dark:bg-[#252836]" : ""}`} style={{ borderBottom: "1px solid #f5f5f5" }}>
              <div className="w-7 h-7 rounded-full bg-[#f3f3f8] dark:bg-[#252836] flex items-center justify-center text-[10px] font-semibold text-[#6b7280] shrink-0">{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-semibold text-[#111827] dark:text-[#f9fafb]">{c.username}</span>
                <p className="text-[12px] text-[#6b7280] truncate">{c.text}</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[c.platform] || "#6b7280" }} />
              <span className="text-[10px] text-[#9ca3af] shrink-0">{c.time}</span>
            </div>
          ))}
        </div>
        <button className="text-[11px] text-[#6366f1] font-medium mt-3">View All Comments</button>
      </div>

      {/* Why We Do This */}
      <div className="bg-white dark:bg-[#1e2130] p-4" style={{ border: "1px solid #e5e7eb" }}>
        <p className="text-[13px] font-medium italic text-[#111827] dark:text-[#f9fafb] mb-3">Why We Do This</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ border: "1px solid #e5e7eb" }}>
          {MOCK_COMMENTS.filter(c => c.text.length > 15).slice(0, 3).map((c, i) => (
            <div key={i} className="p-4" style={{ borderRight: i < 2 ? "1px solid #e5e7eb" : "none" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-[#f3f3f8] dark:bg-[#252836] flex items-center justify-center text-[9px] font-semibold text-[#6b7280]">{c.avatar}</div>
                <span className="text-[11px] font-semibold text-[#374151] dark:text-[#e5e7eb]">{c.username}</span>
                <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: PLATFORM_COLORS[c.platform] || "#6b7280" }} />
              </div>
              <p className="text-[13px] italic text-[#374151] dark:text-[#e5e7eb] leading-relaxed">"{c.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
