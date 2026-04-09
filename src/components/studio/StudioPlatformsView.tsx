import { useState, useEffect, useMemo } from "react";
import { Loader2, Plus, X, TrendingUp, ChevronDown, ChevronUp, Instagram, Youtube, Twitter, Rss, BarChart3, Users, Eye, Zap } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface StudioProfile {
  instagram_handle: string | null;
  instagram_followers: number | null;
  instagram_post_count: number | null;
  instagram_connected: boolean | null;
  instagram_synced_at: string | null;
  youtube_handle: string | null;
  youtube_subscribers: number | null;
  youtube_video_count: number | null;
  youtube_total_views: number | null;
  youtube_connected: boolean | null;
  youtube_synced_at: string | null;
  tiktok_handle: string | null;
  tiktok_followers: number | null;
  tiktok_total_likes: number | null;
  tiktok_connected: boolean | null;
  tiktok_synced_at: string | null;
  twitter_handle: string | null;
  twitter_followers: number | null;
  twitter_connected: boolean | null;
  twitter_synced_at: string | null;
  substack_url: string | null;
  substack_subscriber_count: number | null;
  combined_followers: number | null;
  reach_30d: number | null;
  interactions_30d: number | null;
  avg_engagement: number | null;
}

interface ConnectedPlatform {
  id: string;
  name: string;
  handle: string;
  followers: number;
  color: string;
  category: string;
  icon: React.ReactNode;
  posts: number | null;
  engagement: number | null;
  reach: number | null;
}

const connectPlatformOptions = [
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "twitterx", label: "Twitter/X" },
  { id: "substack", label: "Substack" },
];

const formatNum = (n: number | null | undefined): string => {
  if (!n) return "\u2014";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

export default function StudioPlatformsView() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState("youtube");
  const [connectHandle, setConnectHandle] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const loadStudioProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("studio_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile(data as StudioProfile | null);
    setLoading(false);
  };

  useEffect(() => {
    loadStudioProfile();
  }, [user]);

  const connectedPlatforms = useMemo((): ConnectedPlatform[] => {
    if (!profile) return [];
    const list: ConnectedPlatform[] = [];

    if (profile.instagram_handle) {
      list.push({
        id: "instagram", name: "Instagram", handle: `@${profile.instagram_handle}`,
        followers: profile.instagram_followers || 0, color: "#E1306C", category: "Social",
        icon: <Instagram className="w-5 h-5" />,
        posts: profile.instagram_post_count, engagement: null, reach: null,
      });
    }
    if (profile.youtube_handle || profile.youtube_connected) {
      list.push({
        id: "youtube", name: "YouTube", handle: `@${profile.youtube_handle || "channel"}`,
        followers: profile.youtube_subscribers || 0, color: "#FF0000", category: "Video",
        icon: <Youtube className="w-5 h-5" />,
        posts: profile.youtube_video_count, engagement: null, reach: profile.youtube_total_views ? Number(profile.youtube_total_views) : null,
      });
    }
    if (profile.tiktok_handle) {
      list.push({
        id: "tiktok", name: "TikTok", handle: `@${profile.tiktok_handle}`,
        followers: profile.tiktok_followers || 0, color: "#000000", category: "Social",
        icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/></svg>,
        posts: null, engagement: null, reach: profile.tiktok_total_likes ? Number(profile.tiktok_total_likes) : null,
      });
    }
    if (profile.twitter_handle) {
      list.push({
        id: "twitter", name: "Twitter/X", handle: `@${profile.twitter_handle}`,
        followers: profile.twitter_followers || 0, color: "#000000", category: "Social",
        icon: <Twitter className="w-5 h-5" />,
        posts: null, engagement: null, reach: null,
      });
    }
    if (profile.substack_url) {
      list.push({
        id: "substack", name: "Substack", handle: profile.substack_url.replace("https://", ""),
        followers: profile.substack_subscriber_count || 0, color: "#FF6719", category: "Newsletter",
        icon: <Rss className="w-5 h-5" />,
        posts: null, engagement: null, reach: null,
      });
    }

    return list;
  }, [profile]);

  const totalFollowers = useMemo(() =>
    connectedPlatforms.reduce((sum, p) => sum + p.followers, 0),
    [connectedPlatforms]
  );

  const barChartData = useMemo(() =>
    connectedPlatforms.map(p => ({ name: p.name, followers: p.followers, color: p.color })),
    [connectedPlatforms]
  );

  // Connection logic (preserved from original)
  const handleConnect = async () => {
    if (!connectHandle.trim() || !user) return;
    setIsConnecting(true);
    try {
      if (connectPlatform === "youtube") {
        const input = connectHandle.trim();
        const channelIdMatch = input.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
        const isDirectId = input.startsWith("UC") && input.length === 24;
        const body = channelIdMatch ? { channel_id: channelIdMatch[1] } : isDirectId ? { channel_id: input } : { handle: input };
        const { data, error } = await supabase.functions.invoke("fetch-youtube-stats", { body });
        if (error || !data?.channel) { toast.error(data?.error || "Channel not found."); return; }
        const ch = data.channel;
        await supabase.from("studio_profile").upsert({
          user_id: user.id, youtube_handle: ch.handle || input, youtube_channel_id: ch.channel_id,
          youtube_subscribers: ch.subscribers, youtube_total_views: ch.total_views,
          youtube_video_count: ch.video_count, youtube_recent_videos: ch.recent_videos,
          youtube_connected: true, youtube_synced_at: new Date().toISOString(),
        } as any, { onConflict: "user_id" });
        toast.success(`YouTube connected! ${ch.subscribers.toLocaleString()} subscribers`);
      } else {
        const field = connectPlatform === "twitterx" ? "twitter" : connectPlatform;
        const cleanHandle = connectHandle.trim().replace(/^@/, "");
        const updateObj: any = { user_id: user.id, [`${field}_handle`]: cleanHandle, [`${field}_connected`]: true };
        if (field !== "substack") updateObj[`${field}_synced_at`] = new Date().toISOString();
        if (field === "substack") {
          updateObj.substack_url = connectHandle.includes("http") ? connectHandle : `https://${connectHandle}`;
          delete updateObj.substack_handle; delete updateObj.substack_connected;
        }
        await supabase.from("studio_profile").upsert(updateObj as any, { onConflict: "user_id" });
        toast.success(`${connectPlatform === "twitterx" ? "Twitter/X" : connectPlatform.charAt(0).toUpperCase() + connectPlatform.slice(1)} saved`);
      }
      setConnectHandle(""); setShowConnect(false);
      await loadStudioProfile();
    } catch (err: any) { toast.error(err.message || "Connection failed"); }
    finally { setIsConnecting(false); }
  };

  const getPlaceholder = () => {
    if (connectPlatform === "youtube") return "@yourchannel or channel URL";
    if (connectPlatform === "substack") return "yourname.substack.com";
    return "@yourhandle";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state
  if (connectedPlatforms.length === 0) {
    return (
      <div className="max-w-[900px] mx-auto space-y-5" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
          <Users className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No platforms connected</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Connect your platforms in Edit Studio to see your analytics here.
          </p>
          <button
            onClick={() => setShowConnect(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ minHeight: 44 }}
          >
            <Plus className="w-4 h-4" /> Connect Platform
          </button>
        </div>
        {showConnect && <ConnectPanel {...{ showConnect, setShowConnect, connectPlatform, setConnectPlatform, connectHandle, setConnectHandle, handleConnect, isConnecting, getPlaceholder }} />}
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto space-y-5" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Connect button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowConnect(!showConnect)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
            showConnect ? "border-primary text-primary bg-primary/10" : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
          }`}
        >
          {showConnect ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          Connect
        </button>
      </div>

      {showConnect && <ConnectPanel {...{ showConnect, setShowConnect, connectPlatform, setConnectPlatform, connectHandle, setConnectHandle, handleConnect, isConnecting, getPlaceholder }} />}

      {/* Follower distribution bar */}
      {totalFollowers > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Follower Distribution</p>
          <div className="flex rounded-full overflow-hidden h-3">
            {connectedPlatforms.filter(p => p.followers > 0).map(p => (
              <div
                key={p.id}
                style={{ width: `${(p.followers / totalFollowers) * 100}%`, backgroundColor: p.color }}
                className="h-full transition-all"
                title={`${p.name}: ${p.followers.toLocaleString()}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {connectedPlatforms.filter(p => p.followers > 0).map(p => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
                <span className="font-semibold text-foreground">{formatNum(p.followers)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className={`grid gap-5 ${isMobile ? "grid-cols-1" : "grid-cols-[1fr_1fr]"}`}>
        {/* LEFT: Platform list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Platforms</h3>
          </div>
          <div className="divide-y divide-border">
            {connectedPlatforms.map(p => {
              const isExpanded = expandedPlatform === p.id;
              return (
                <div key={p.id}>
                  <button
                    onClick={() => setExpandedPlatform(isExpanded ? null : p.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.color}15`, color: p.color }}>
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{p.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.handle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{formatNum(p.followers)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-1.5 bg-muted/20">
                      <StatRow label="Posts" value={formatNum(p.posts)} />
                      <StatRow label="Avg Engagement" value={profile?.avg_engagement ? `${Number(profile.avg_engagement).toFixed(1)}%` : "\u2014"} />
                      <StatRow label="30D Reach" value={formatNum(p.reach)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Charts */}
        <div className="space-y-5">
          {/* Combined Reach */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Combined Reach</h3>
                <p className="text-xs text-muted-foreground">Total followers across platforms</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalFollowers > 0 ? formatNum(totalFollowers) : "\u2014"}</p>
            {barChartData.length > 0 ? (
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: number) => [value.toLocaleString(), "Followers"]}
                    />
                    <Bar dataKey="followers" fill="#7B5EA7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">No data yet</div>
            )}
          </div>

          {/* Total Engagement */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Total Engagement</h3>
              <p className="text-xs text-muted-foreground">Overview of your monthly engagement</p>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-bold text-foreground">
                {profile?.interactions_30d ? formatNum(profile.interactions_30d) : "\u2014"}
              </p>
              {profile?.avg_engagement ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">
                  {Number(profile.avg_engagement).toFixed(1)}% avg
                </span>
              ) : null}
            </div>
            <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">
              <div className="text-center space-y-1">
                <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p>Historical data will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function ConnectPanel({ showConnect, setShowConnect, connectPlatform, setConnectPlatform, connectHandle, setConnectHandle, handleConnect, isConnecting, getPlaceholder }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-foreground">Connect a platform</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {connectPlatformOptions.map((cp) => (
          <button
            key={cp.id}
            onClick={() => { setConnectPlatform(cp.id); setConnectHandle(""); }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              connectPlatform === cp.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {cp.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text" value={connectHandle} onChange={(e) => setConnectHandle(e.target.value)}
          placeholder={getPlaceholder()}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleConnect(); }}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          style={{ WebkitAppearance: "none", minWidth: 0 }}
        />
        <button
          onClick={handleConnect} disabled={!connectHandle.trim() || isConnecting}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          style={{ minHeight: 44 }}
        >
          {isConnecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
      </div>
      {connectPlatform === "youtube" && (
        <p className="text-[11px] text-muted-foreground">Try: @YourChannel or paste your full YouTube channel URL</p>
      )}
    </div>
  );
}
