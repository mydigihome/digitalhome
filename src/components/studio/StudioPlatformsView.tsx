import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, Plus, X, TrendingUp, ChevronDown, ChevronUp, Instagram, Youtube, Twitter, Rss, Users, Eye, Zap, RefreshCw, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StudioProfile {
  brand_name?: string | null;
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
  profile_views_30d?: number | null;
  ai_insights?: string | null;
  ai_summary?: string | null;
  platform_urls?: Record<string, string> | null;
}

const PLATFORM_TABS = [
  { id: "overview", label: "Overview", color: "#7B5EA7" },
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "youtube", label: "YouTube", color: "#FF0000" },
  { id: "tiktok", label: "TikTok", color: "#000000" },
  { id: "podcast", label: "Podcast", color: "#9333EA" },
  { id: "substack", label: "Substack", color: "#FF6719" },
];

const formatNum = (n: number | null | undefined): string => {
  if (!n && n !== 0) return "\u2014";
  if (n === 0) return "\u2014";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const connectPlatformOptions = [
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "twitterx", label: "Twitter/X" },
  { id: "substack", label: "Substack" },
];

export default function StudioPlatformsView() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showConnect, setShowConnect] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState("youtube");
  const [connectHandle, setConnectHandle] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [connectingUrl, setConnectingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const loadStudioProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("studio_profile").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(data as StudioProfile | null);
    setLoading(false);
  };

  useEffect(() => { loadStudioProfile(); }, [user]);

  const brandName = profile?.brand_name || "Your Brand";

  const getPlatformData = (platformId: string) => {
    if (!profile) return null;
    switch (platformId) {
      case "instagram":
        return profile.instagram_handle ? {
          handle: `@${profile.instagram_handle}`,
          followers: profile.instagram_followers,
          posts: profile.instagram_post_count,
          connected: true,
        } : null;
      case "youtube":
        return (profile.youtube_handle || profile.youtube_connected) ? {
          handle: `@${profile.youtube_handle || "channel"}`,
          followers: profile.youtube_subscribers,
          posts: profile.youtube_video_count,
          reach: profile.youtube_total_views,
          connected: true,
        } : null;
      case "tiktok":
        return profile.tiktok_handle ? {
          handle: `@${profile.tiktok_handle}`,
          followers: profile.tiktok_followers,
          reach: profile.tiktok_total_likes,
          connected: true,
        } : null;
      case "substack":
        return profile.substack_url ? {
          handle: profile.substack_url.replace("https://", ""),
          followers: profile.substack_subscriber_count,
          connected: true,
        } : null;
      default:
        return null;
    }
  };

  const allPlatforms = useMemo(() => {
    const list: { id: string; name: string; handle: string; followers: number; color: string }[] = [];
    if (profile?.instagram_handle) list.push({ id: "instagram", name: "Instagram", handle: `@${profile.instagram_handle}`, followers: profile.instagram_followers || 0, color: "#E1306C" });
    if (profile?.youtube_handle || profile?.youtube_connected) list.push({ id: "youtube", name: "YouTube", handle: `@${profile.youtube_handle || "channel"}`, followers: profile.youtube_subscribers || 0, color: "#FF0000" });
    if (profile?.tiktok_handle) list.push({ id: "tiktok", name: "TikTok", handle: `@${profile.tiktok_handle}`, followers: profile.tiktok_followers || 0, color: "#000000" });
    if (profile?.twitter_handle) list.push({ id: "twitter", name: "Twitter/X", handle: `@${profile.twitter_handle}`, followers: profile.twitter_followers || 0, color: "#000000" });
    if (profile?.substack_url) list.push({ id: "substack", name: "Substack", handle: profile.substack_url.replace("https://", ""), followers: profile.substack_subscriber_count || 0, color: "#FF6719" });
    return list;
  }, [profile]);

  const totalFollowers = useMemo(() => allPlatforms.reduce((s, p) => s + p.followers, 0), [allPlatforms]);

  // Connection logic
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

  const handleSaveProfileUrl = async () => {
    if (!profileUrl.trim() || !user) return;
    setConnectingUrl(true);
    try {
      const urls = profile?.platform_urls || {};
      (urls as any)[activeTab] = profileUrl.trim();
      await supabase.from("studio_profile").upsert({ user_id: user.id, platform_urls: urls } as any, { onConflict: "user_id" });
      toast.success("Profile URL saved");
      await loadStudioProfile();
    } catch { toast.error("Failed to save URL"); }
    finally { setConnectingUrl(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const activeTabInfo = PLATFORM_TABS.find(t => t.id === activeTab) || PLATFORM_TABS[0];

  const renderStatsGrid = (platformId: string) => {
    const data = platformId === "overview" ? null : getPlatformData(platformId);
    const stats = platformId === "overview" ? [
      { label: allPlatforms[0]?.handle || "Primary", value: formatNum(allPlatforms[0]?.followers) },
      { label: allPlatforms[1]?.handle || "Secondary", value: formatNum(allPlatforms[1]?.followers) },
      { label: "Combined Followers", value: formatNum(totalFollowers || null) },
      { label: "30D Reach", value: formatNum(profile?.reach_30d) },
      { label: "30D Profile Views", value: formatNum(profile?.profile_views_30d) },
      { label: "30D Interactions", value: formatNum(profile?.interactions_30d) },
    ] : [
      { label: data?.handle || "Handle", value: formatNum(data?.followers) },
      { label: "Posts", value: formatNum(data?.posts) },
      { label: "Reach", value: formatNum((data as any)?.reach) },
      { label: "30D Reach", value: formatNum(profile?.reach_30d) },
      { label: "Avg Engagement", value: profile?.avg_engagement ? `${Number(profile.avg_engagement).toFixed(1)}%` : "\u2014" },
      { label: "Interactions", value: formatNum(profile?.interactions_30d) },
    ];

    return (
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16,
          }}>
            <p style={{ fontSize: 11, color: "#6B7280", fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#111827", fontFamily: "Inter, sans-serif", margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderGoalProgress = () => {
    if (allPlatforms.length === 0) return null;
    const goals = allPlatforms.slice(0, 2).map(p => {
      const goalK = p.followers < 1000 ? 1 : p.followers < 10000 ? 10 : p.followers < 100000 ? 100 : 1000;
      const goal = goalK * 1000;
      const toGo = Math.max(0, goal - p.followers);
      const pct = Math.min(100, (p.followers / goal) * 100);
      return { ...p, goal, goalK, toGo, pct };
    });

    return (
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {goals.map(g => (
          <div key={g.id} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 12 }}>
              {g.handle} Road to {g.goalK}K
            </p>
            <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ width: `${g.pct}%`, height: "100%", background: g.color, borderRadius: 4, transition: "width 300ms" }} />
            </div>
            <p style={{ fontSize: 12, color: "#6B7280", fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 4 }}>
              {formatNum(g.toGo)} followers to go
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 11, color: "#6B7280" }}>YTD Growth: {"\u2014"}</span>
              <span style={{ fontSize: 11, color: "#6B7280" }}>Monthly Pace: {"\u2014"}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRecentPosts = (platformId: string) => {
    return (
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 12 }}>
          {platformId === "overview" && allPlatforms[0] ? `${allPlatforms[0].handle} Latest Posts` : "Latest Posts"}
        </h3>
        <div style={{ textAlign: "center", padding: "32px 0", color: "#6B7280" }}>
          <Upload style={{ width: 32, height: 32, margin: "0 auto 12px", color: "#D1D5DB" }} />
          <p style={{ fontSize: 13, fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 8 }}>
            Import your analytics screenshot to populate posts
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "10px 20px", background: "#F3F4F6", border: "1px solid #E5E7EB",
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
              color: "#374151", fontFamily: "Inter, sans-serif", minHeight: 44,
            }}
          >
            Upload Screenshot
          </button>
        </div>
      </div>
    );
  };

  const renderComments = () => (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 12 }}>
        Recent Comments
      </h3>
      <p style={{ fontSize: 13, color: "#6B7280", fontFamily: "Inter, sans-serif", textAlign: "center", padding: "24px 0" }}>
        No comments data available yet. Import analytics to populate.
      </p>
    </div>
  );

  const renderInsightCards = () => (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 24 }}>
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <CheckCircle2 style={{ width: 16, height: 16, color: "#16A34A" }} />
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", fontFamily: "Inter, sans-serif", margin: 0 }}>WHAT'S WORKING</h4>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", fontFamily: "Inter, sans-serif", margin: 0, lineHeight: 1.5 }}>
          {profile?.ai_insights || "Add insights from your analytics"}
        </p>
      </div>
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <AlertCircle style={{ width: 16, height: 16, color: "#DC2626" }} />
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", fontFamily: "Inter, sans-serif", margin: 0 }}>WHAT'S FLOPPING</h4>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", fontFamily: "Inter, sans-serif", margin: 0, lineHeight: 1.5 }}>
          Add insights from your analytics
        </p>
      </div>
    </div>
  );

  const renderAIAnalysis = (platformId: string) => {
    const tabInfo = PLATFORM_TABS.find(t => t.id === platformId) || PLATFORM_TABS[0];
    return (
      <div style={{ background: "#0F172A", borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Zap style={{ width: 16, height: 16, color: tabInfo.color }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "white", fontFamily: "Inter, sans-serif", margin: 0 }}>
            {tabInfo.label} Analysis
          </h3>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {tabInfo.label} AI INSIGHTS · {dateStr} at {timeStr}
        </p>
        {profile?.ai_summary ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter, sans-serif", margin: 0, lineHeight: 1.6 }}>
            {profile.ai_summary}
          </p>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <button style={{
              padding: "10px 24px", background: tabInfo.color, color: "white",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "Inter, sans-serif", minHeight: 44,
            }}>
              Generate Analysis
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderUrlInput = (platformId: string) => {
    const tabInfo = PLATFORM_TABS.find(t => t.id === platformId);
    if (!tabInfo || platformId === "overview") return null;
    const data = getPlatformData(platformId);
    if (data?.connected) return null;

    return (
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", fontFamily: "Inter, sans-serif", margin: "0 0 8px" }}>
          {tabInfo.label} Profile URL
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={profileUrl}
            onChange={e => setProfileUrl(e.target.value)}
            placeholder={`Paste your ${tabInfo.label} profile URL`}
            style={{
              flex: 1, padding: "10px 14px", border: "1px solid #E5E7EB",
              borderRadius: 8, fontSize: 13, color: "#111827", fontFamily: "Inter, sans-serif",
              outline: "none",
            }}
          />
          <button
            onClick={handleSaveProfileUrl}
            disabled={connectingUrl}
            style={{
              padding: "10px 20px", background: tabInfo.color, color: "white",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "Inter, sans-serif", minHeight: 44,
              opacity: connectingUrl ? 0.6 : 1,
            }}
          >
            {connectingUrl ? "..." : "Connect"}
          </button>
        </div>
      </div>
    );
  };

  const renderScreenshotImport = (platformId: string) => {
    const tabInfo = PLATFORM_TABS.find(t => t.id === platformId);
    if (!tabInfo || platformId === "overview") return null;

    return (
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 4 }}>
          Import Analytics Screenshot
        </h3>
        <p style={{ fontSize: 12, color: "#6B7280", fontFamily: "Inter, sans-serif", margin: "0 0 12px" }}>
          Take a screenshot of your {tabInfo.label} analytics dashboard and upload it here. We'll read the numbers automatically.
        </p>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed #E5E7EB", borderRadius: 8, padding: "28px 16px",
            textAlign: "center", cursor: "pointer", transition: "border-color 150ms",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tabInfo.color; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; }}
        >
          {uploadingScreenshot ? (
            <Loader2 style={{ width: 24, height: 24, margin: "0 auto", color: tabInfo.color, animation: "spin 1s linear infinite" }} />
          ) : (
            <>
              <Upload style={{ width: 24, height: 24, margin: "0 auto 8px", color: "#9CA3AF" }} />
              <p style={{ fontSize: 13, color: "#6B7280", fontFamily: "Inter, sans-serif", margin: 0 }}>
                Drop screenshot here or click to upload
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "Inter, sans-serif", margin: "4px 0 0" }}>
                Accepts PNG, JPG
              </p>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={() => {
          toast("Screenshot import is not yet available. Enter data manually via Connect Platform.");
        }} />
      </div>
    );
  };

  const renderPlatformContent = (platformId: string) => {
    const data = platformId !== "overview" ? getPlatformData(platformId) : null;
    const isConnected = platformId === "overview" ? allPlatforms.length > 0 : !!data?.connected;

    if (platformId !== "overview" && !isConnected) {
      return (
        <>
          {renderUrlInput(platformId)}
          {renderScreenshotImport(platformId)}
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Users style={{ width: 40, height: 40, margin: "0 auto 12px", color: "#D1D5DB" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", fontFamily: "Inter, sans-serif", margin: "0 0 4px" }}>
              {PLATFORM_TABS.find(t => t.id === platformId)?.label} not connected
            </p>
            <p style={{ fontSize: 13, color: "#6B7280", fontFamily: "Inter, sans-serif", margin: "0 0 16px" }}>
              Connect via the Connect button above to see your analytics here.
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        {platformId !== "overview" && renderUrlInput(platformId)}
        {platformId !== "overview" && renderScreenshotImport(platformId)}
        {renderStatsGrid(platformId)}
        {renderGoalProgress()}
        {renderRecentPosts(platformId)}
        {renderComments()}
        {renderInsightCards()}
        {renderAIAnalysis(platformId)}
      </>
    );
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      {/* Platform sub-tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, borderBottom: "1px solid #E5E7EB", marginBottom: 24, overflowX: "auto" }}>
        {PLATFORM_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px", border: "none",
                borderBottom: `2px solid ${isActive ? tab.color : "transparent"}`,
                background: "transparent", fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#111827" : "#6B7280",
                cursor: "pointer", fontFamily: "Inter, sans-serif",
                marginBottom: -1, transition: "all 150ms", whiteSpace: "nowrap",
                minHeight: 44,
              }}
            >
              {tab.label}
            </button>
          );
        })}
        <button
          onClick={() => setShowConnect(true)}
          style={{
            padding: "10px 16px", border: "none", borderBottom: "2px solid transparent",
            background: "transparent", fontSize: 13, fontWeight: 400, color: "#6B7280",
            cursor: "pointer", fontFamily: "Inter, sans-serif", marginBottom: -1,
            display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", minHeight: 44,
          }}
        >
          <Plus style={{ width: 14, height: 14 }} /> Add Platform
        </button>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", fontFamily: "Inter, sans-serif", margin: 0 }}>
              {activeTab === "overview" ? `${brandName} Command Center` : `${activeTabInfo.label} Dashboard`}
            </h2>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
              borderRadius: 999, fontSize: 10, fontWeight: 700, background: "#DCFCE7", color: "#16A34A",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} /> LIVE
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#6B7280", fontFamily: "Inter, sans-serif", margin: "4px 0 0" }}>
            {dateStr} at {timeStr}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => loadStudioProfile()}
            style={{
              padding: "8px 16px", background: "#F3F4F6", border: "1px solid #E5E7EB",
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              color: "#374151", fontFamily: "Inter, sans-serif", minHeight: 44,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Connect panel */}
      {showConnect && (
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>Connect a platform</p>
            <button onClick={() => setShowConnect(false)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
              <X style={{ width: 16, height: 16, color: "#6B7280" }} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {connectPlatformOptions.map(cp => (
              <button
                key={cp.id}
                onClick={() => { setConnectPlatform(cp.id); setConnectHandle(""); }}
                style={{
                  padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                  border: `1.5px solid ${connectPlatform === cp.id ? "#7B5EA7" : "#E5E7EB"}`,
                  background: connectPlatform === cp.id ? "rgba(123,94,167,0.1)" : "transparent",
                  color: connectPlatform === cp.id ? "#7B5EA7" : "#6B7280",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}
              >
                {cp.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={connectHandle}
              onChange={e => setConnectHandle(e.target.value)}
              placeholder={getPlaceholder()}
              onKeyDown={e => { if (e.key === "Enter") handleConnect(); }}
              style={{
                flex: 1, padding: "10px 14px", border: "1px solid #E5E7EB",
                borderRadius: 8, fontSize: 13, color: "#111827", fontFamily: "Inter, sans-serif",
                outline: "none",
              }}
            />
            <button
              onClick={handleConnect}
              disabled={!connectHandle.trim() || isConnecting}
              style={{
                padding: "10px 20px", background: "#7B5EA7", color: "white",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "Inter, sans-serif", minHeight: 44,
                opacity: (!connectHandle.trim() || isConnecting) ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {isConnecting && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
              {isConnecting ? "Connecting..." : "Connect"}
            </button>
          </div>
          {connectPlatform === "youtube" && (
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 0" }}>Try: @YourChannel or paste your full YouTube channel URL</p>
          )}
        </div>
      )}

      {/* Platform content */}
      {renderPlatformContent(activeTab)}
    </div>
  );
}
