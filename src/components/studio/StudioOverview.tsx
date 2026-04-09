import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const PLATFORM_COLORS: Record<string, string> = { Instagram: "#E1306C", YouTube: "#FF0000", TikTok: "#000000" };

const STRATEGY_FIELDS = [
  { key: "primary_goals", label: "PRIMARY GOALS", placeholder: "What do you want to achieve in the next 90 days?" },
  { key: "target_audience", label: "TARGET AUDIENCE", placeholder: "Who are you talking to? Age, interests, pain points." },
  { key: "competitor_analysis", label: "COMPETITOR ANALYSIS", placeholder: "Who are you watching? What are they doing well or missing?" },
  { key: "brand_voice", label: "BRAND VOICE", placeholder: "How do you sound? (e.g. direct, warm, educational, bold)" },
  { key: "content_pillars", label: "CONTENT PILLARS", placeholder: "The 3-5 topics you always come back to." },
];

interface Props {
  onNavigateDeals?: () => void;
}

function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined || val === 0) return "\u2014";
  return val.toLocaleString();
}

export default function StudioOverview({ onNavigateDeals }: Props) {
  const { user } = useAuth();
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [strategy, setStrategy] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  // Fetch studio profile from Supabase
  const { data: profile, isLoading } = useQuery({
    queryKey: ["studio_profile_overview", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("studio_profile")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch brand deals from Supabase
  const { data: deals = [] } = useQuery({
    queryKey: ["brand_deals_overview", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_deals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch recent comments from content_comments
  const { data: recentComments = [] } = useQuery({
    queryKey: ["content_comments_overview", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("content_comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Compute combined stats from profile
  const p = profile || {} as any;
  const combinedFollowers = p.combined_followers || ((p.youtube_subscribers || 0) + (p.instagram_followers || 0) + (p.tiktok_followers || 0) + (p.twitter_followers || 0)) || 0;
  const reach30d = p.reach_30d || 0;
  const interactions30d = p.interactions_30d || 0;
  const avgEngagement = p.avg_engagement || 0;

  // Build brand accounts from profile data
  const brands = [];
  if (p.instagram_handle || p.instagram_followers) {
    brands.push({
      id: "instagram",
      name: p.instagram_handle ? `@${p.instagram_handle.replace(/^@/, '')}` : "@instagram",
      type: "Instagram",
      color: "#E1306C",
      followers: p.instagram_followers || 0,
      growth30d: "\u2014",
      engagement: p.avg_engagement ? `${p.avg_engagement}%` : "\u2014",
    });
  }
  if (p.youtube_handle || p.youtube_subscribers) {
    brands.push({
      id: "youtube",
      name: p.youtube_handle ? `@${p.youtube_handle.replace(/^@/, '')}` : "@youtube",
      type: "YouTube",
      color: "#FF0000",
      followers: p.youtube_subscribers || 0,
      growth30d: "\u2014",
      engagement: "\u2014",
    });
  }
  if (p.tiktok_handle || p.tiktok_followers) {
    brands.push({
      id: "tiktok",
      name: p.tiktok_handle ? `@${p.tiktok_handle.replace(/^@/, '')}` : "@tiktok",
      type: "TikTok",
      color: "#000000",
      followers: p.tiktok_followers || 0,
      growth30d: "\u2014",
      engagement: "\u2014",
    });
  }
  if (p.twitter_handle || p.twitter_followers) {
    brands.push({
      id: "twitter",
      name: p.twitter_handle ? `@${p.twitter_handle.replace(/^@/, '')}` : "@twitter",
      type: "Twitter/X",
      color: "#1DA1F2",
      followers: p.twitter_followers || 0,
      growth30d: "\u2014",
      engagement: "\u2014",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-[1200px] mx-auto">
      {/* Combined Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {[
          { label: "COMBINED FOLLOWERS", value: fmt(combinedFollowers), sub: brands.length > 0 ? `${brands.length} platform${brands.length > 1 ? 's' : ''} connected` : "Connect platforms" },
          { label: "30D REACH", value: fmt(reach30d) },
          { label: "30D INTERACTIONS", value: fmt(interactions30d) },
          { label: "AVG ENGAGEMENT", value: avgEngagement ? `${avgEngagement}%` : "\u2014" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">{s.label}</p>
            <p className="text-[28px] font-medium text-[#111827] dark:text-[#f9fafb] tracking-tight leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
            {s.sub && <p className="text-[10px] text-[#9ca3af] mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Brand Performance — from real profile data */}
      {brands.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {brands.map(brand => (
            <div key={brand.id} className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#e5e7eb] dark:border-[#1f2937]">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold" style={{ backgroundColor: brand.color }}>
                  {brand.name[1]?.toUpperCase()}
                </div>
                <span className="text-[12px] font-semibold text-[#374151] dark:text-[#e5e7eb]">{brand.name}</span>
                <span className="text-[10px] text-[#9ca3af] ml-auto">{brand.type}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Followers", value: fmt(brand.followers) },
                  { label: "30D Growth", value: brand.growth30d },
                  { label: "Engagement", value: brand.engagement },
                ].map(stat => (
                  <div key={stat.label}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-0.5">{stat.label}</p>
                    <p className="text-[20px] font-medium text-[#111827] dark:text-[#f9fafb]" style={{ fontVariantNumeric: "tabular-nums" }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Road to 100K */}
              {brand.followers > 0 && (
                <div className="mt-4 pt-3 border-t border-[#f0f0f0] dark:border-[#1a1d27]">
                  <p className="text-[11px] font-medium text-[#374151] dark:text-[#e5e7eb] mb-2">{brand.name} Road to 100K</p>
                  <div className="w-full h-[3px] bg-[#f0f0f0] dark:bg-[#1f2937] rounded-lg">
                    <div className="h-full bg-[#111827] dark:bg-[#f9fafb] rounded-lg" style={{ width: `${Math.min(100, (brand.followers / 100000) * 100)}%` }} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">{(100000 - brand.followers).toLocaleString()} to go</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state if no brands */}
      {brands.length === 0 && (
        <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-8 text-center">
          <p className="text-[13px] text-[#9ca3af] mb-2">No platforms connected yet</p>
          <p className="text-[11px] text-[#d1d5db]">Edit your Studio to add Instagram, YouTube, TikTok, and more.</p>
        </div>
      )}

      {/* Brand Strategy — Collapsible */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937]">
        <button onClick={() => setStrategyOpen(!strategyOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <ChevronRight className={`w-3.5 h-3.5 text-[#9ca3af] transition-transform duration-200 ${strategyOpen ? "rotate-90" : ""}`} />
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
                    onKeyDown={e => e.key === "Escape" && setEditingField(null)}
                    placeholder={field.placeholder}
                    rows={2}
                  />
                ) : (
                  <p
                    onClick={() => setEditingField(field.key)}
                    className={`text-[13px] leading-relaxed cursor-pointer min-h-[20px] ${strategy[field.key] ? "text-[#374151] dark:text-[#e5e7eb]" : "text-[#d1d5db] dark:text-[#4b5563]"}`}
                  >
                    {strategy[field.key] || field.placeholder}
                  </p>
                )}
              </div>
            ))}
            <button onClick={() => setStrategyOpen(false)} className="text-[11px] text-[#9ca3af]">Collapse</button>
          </div>
        )}
      </div>

      {/* Active Deals — from Supabase */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">Active Deals</p>
          <button onClick={onNavigateDeals} className="text-[11px] text-[#6366f1] font-medium">View all deals</button>
        </div>
        {deals.length === 0 ? (
          <p className="text-[12px] text-[#9ca3af]">No active deals yet. Go to Deals to create one.</p>
        ) : (
          <div className="space-y-2">
            {deals.slice(0, 3).map((d: any) => (
              <div key={d.id} onClick={onNavigateDeals} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#0d1017] -mx-4 px-4 transition" style={{ borderBottom: "1px solid #f5f5f5" }}>
                <span className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] flex-1">{d.brand_name}</span>
                <span className="text-[13px] font-medium text-[#6366f1]" style={{ fontVariantNumeric: "tabular-nums" }}>{d.deal_value ? `$${Number(d.deal_value).toLocaleString()}` : "\u2014"}</span>
                <span className="text-[10px] text-[#9ca3af]">{d.status || "\u2014"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Comments — from Supabase */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] mb-3">Recent Comments</p>
        {recentComments.length === 0 ? (
          <p className="text-[12px] text-[#9ca3af]">No comments yet.</p>
        ) : (
          <div className="space-y-0">
            {recentComments.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5 -mx-4 px-4" style={{ borderBottom: "1px solid #f5f5f5" }}>
                <div className="w-7 h-7 rounded-full bg-[#f3f3f8] dark:bg-[#1f2937] flex items-center justify-center text-[10px] font-semibold text-[#6b7280] shrink-0">
                  {(c.comment || "")[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#6b7280] dark:text-[#9ca3af] truncate">{c.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
