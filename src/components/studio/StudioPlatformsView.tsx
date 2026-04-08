import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Loader2, Plus, X, TrendingUp, Heart, MessageCircle, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PlatformTab {
  id: string;
  name: string;
  icon: string;
  color: string;
  followers: number;
}

const defaultPlatforms: PlatformTab[] = [
  { id: "instagram", name: "Instagram", icon: "IG", color: "#E1306C", followers: 0 },
  { id: "youtube", name: "YouTube", icon: "YT", color: "#FF0000", followers: 0 },
  { id: "tiktok", name: "TikTok", icon: "TK", color: "#000000", followers: 0 },
  { id: "twitter", name: "Twitter/X", icon: "X", color: "#1DA1F2", followers: 0 },
];

const mockGrowthData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  followers: Math.floor(1000 + Math.random() * 200 + i * 15),
}));

const mockRecentPosts = [
  { type: "Reel", date: "Mar 28", title: "Morning routine vlog", likes: 1240, comments: 89, engagement: 4.2 },
  { type: "Photo", date: "Mar 26", title: "New collection preview", likes: 980, comments: 54, engagement: 3.1 },
  { type: "Story", date: "Mar 25", title: "Q&A session highlights", likes: 720, comments: 112, engagement: 5.7 },
  { type: "Video", date: "Mar 23", title: "Behind the scenes", likes: 1560, comments: 67, engagement: 3.8 },
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hoursOfDay = ["6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"];

const heatmapData = daysOfWeek.map(() =>
  hoursOfDay.map(() => Math.random())
);

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

  const [activePlatform, setActivePlatform] = useState("instagram");
  const [platforms, setPlatforms] = useState<PlatformTab[]>(defaultPlatforms);
  const [showConnect, setShowConnect] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState("youtube");
  const [connectHandle, setConnectHandle] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [analysisText, setAnalysisText] = useState("Connect your platforms and click Refresh Analysis to get AI-powered insights about your content performance, audience growth, and optimal posting strategy.");
  const [refreshingAnalysis, setRefreshingAnalysis] = useState(false);

  const loadStudioProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("studio_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      const d = data as any;
      setPlatforms((prev) =>
        prev.map((p) => {
          if (p.id === "youtube") return { ...p, followers: d.youtube_subscribers || 0 };
          if (p.id === "instagram") return { ...p, followers: d.instagram_followers || 0 };
          if (p.id === "tiktok") return { ...p, followers: d.tiktok_followers || 0 };
          if (p.id === "twitter") return { ...p, followers: d.twitter_followers || 0 };
          return p;
        })
      );
    }
  };

  useEffect(() => {
    loadStudioProfile();
  }, [user]);

  const activeData = useMemo(() => {
    const p = platforms.find((pl) => pl.id === activePlatform);
    return {
      followers: p?.followers || 0,
      following: 0,
      posts: 0,
      engagement: 0,
    };
  }, [activePlatform, platforms]);

  const handleConnect = async () => {
    if (!connectHandle.trim() || !user) return;
    setIsConnecting(true);

    try {
      if (connectPlatform === "youtube") {
        const input = connectHandle.trim();
        const channelIdMatch = input.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
        const isDirectId = input.startsWith("UC") && input.length === 24;

        const body = channelIdMatch
          ? { channel_id: channelIdMatch[1] }
          : isDirectId
          ? { channel_id: input }
          : { handle: input };

        const { data, error } = await supabase.functions.invoke("fetch-youtube-stats", { body });

        if (error || !data?.channel) {
          toast.error(data?.error || "Channel not found. Try your exact channel URL: youtube.com/@YourHandle");
          return;
        }

        const ch = data.channel;
        await supabase.from("studio_profile").upsert({
          user_id: user.id,
          youtube_handle: ch.handle || input,
          youtube_channel_id: ch.channel_id,
          youtube_subscribers: ch.subscribers,
          youtube_total_views: ch.total_views,
          youtube_video_count: ch.video_count,
          youtube_recent_videos: ch.recent_videos,
          youtube_connected: true,
          youtube_synced_at: new Date().toISOString(),
        } as any, { onConflict: "user_id" });

        toast.success(`YouTube connected! ${ch.subscribers.toLocaleString()} subscribers`);
      } else {
        const field = connectPlatform === "twitterx" ? "twitter" : connectPlatform;
        const cleanHandle = connectHandle.trim().replace(/^@/, "");

        const updateObj: any = {
          user_id: user.id,
          [`${field}_handle`]: cleanHandle,
          [`${field}_connected`]: true,
        };
        if (field !== "substack") {
          updateObj[`${field}_synced_at`] = new Date().toISOString();
        }
        if (field === "substack") {
          updateObj.substack_url = connectHandle.includes("http") ? connectHandle : `https://${connectHandle}`;
          delete updateObj.substack_handle;
          delete updateObj.substack_connected;
        }

        await supabase.from("studio_profile").upsert(updateObj as any, { onConflict: "user_id" });
        toast.success(`${connectPlatform === "twitterx" ? "Twitter/X" : connectPlatform.charAt(0).toUpperCase() + connectPlatform.slice(1)} saved`);
      }

      setConnectHandle("");
      setShowConnect(false);
      await loadStudioProfile();
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const refreshAnalysis = async () => {
    setRefreshingAnalysis(true);
    await new Promise((r) => setTimeout(r, 1500));
    setAnalysisText(
      "Your Instagram engagement rate of 4.2% is above the industry average of 3.1%. Best performing content type: Reels (5.7% avg engagement). Optimal posting times: Tue/Thu 10am-12pm and Sat 6-8pm. Consider increasing Reel frequency by 2x for maximum reach growth."
    );
    setRefreshingAnalysis(false);
    toast.success("Analysis refreshed");
  };

  const getHeatColor = (value: number) => {
    if (value > 0.8) return "bg-primary/80";
    if (value > 0.6) return "bg-primary/50";
    if (value > 0.4) return "bg-primary/30";
    if (value > 0.2) return "bg-primary/15";
    return "bg-muted";
  };

  const getPlaceholder = () => {
    if (connectPlatform === "youtube") return "@yourchannel or channel URL";
    if (connectPlatform === "substack") return "yourname.substack.com";
    return "@yourhandle";
  };

  return (
    <div className="space-y-5 max-w-[900px] mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Platform Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              activePlatform === p.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            <span className="text-xs font-bold">{p.icon}</span>
            {p.name}
            {p.followers > 0 && (
              <span className="text-xs opacity-75">{p.followers >= 1000 ? `${(p.followers / 1000).toFixed(1)}K` : p.followers}</span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowConnect(!showConnect)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
            showConnect
              ? "border-primary text-primary bg-primary/10"
              : "border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
          }`}
        >
          {showConnect ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          Connect
        </button>
      </div>

      {/* Inline Connect Panel */}
      {showConnect && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3" style={{ WebkitBackfaceVisibility: "hidden", WebkitTransform: "translateZ(0)" }}>
          <p className="text-xs font-semibold text-foreground">Connect a platform</p>

          <div className="flex items-center gap-1.5 flex-wrap">
            {connectPlatformOptions.map((cp) => (
              <button
                key={cp.id}
                onClick={() => { setConnectPlatform(cp.id); setConnectHandle(""); }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  connectPlatform === cp.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {cp.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={connectHandle}
              onChange={(e) => setConnectHandle(e.target.value)}
              placeholder={getPlaceholder()}
              onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleConnect}
              disabled={!connectHandle.trim() || isConnecting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            >
              {isConnecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isConnecting ? "Connecting..." : "Connect"}
            </button>
          </div>

          {connectPlatform === "youtube" && (
            <p className="text-[11px] text-muted-foreground">
              Try: @YourChannel or paste your full YouTube channel URL
            </p>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Followers", value: activeData.followers, icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Following", value: activeData.following, icon: <Heart className="w-4 h-4" /> },
          { label: "Posts", value: activeData.posts, icon: <BarChart3 className="w-4 h-4" /> },
          { label: "Engagement", value: `${activeData.engagement}%`, icon: <MessageCircle className="w-4 h-4" /> },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-muted-foreground/50">{s.icon}</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* 30-Day Growth Chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">30-Day Growth</h3>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockGrowthData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="followers" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Posts</h3>
        <div className="space-y-2">
          {mockRecentPosts.map((post, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{post.type}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes.toLocaleString()}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments}</span>
                <span className="font-medium text-primary">{post.engagement}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Time to Post Heatmap */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Best Time to Post
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            <div className="flex ml-10 mb-1">
              {hoursOfDay.map((h) => (
                <span key={h} className="flex-1 text-center text-[10px] text-muted-foreground">{h}</span>
              ))}
            </div>
            {daysOfWeek.map((day, di) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <span className="w-9 text-xs text-muted-foreground text-right pr-1">{day}</span>
                <div className="flex flex-1 gap-1">
                  {heatmapData[di].map((val, hi) => (
                    <div key={hi} className={`flex-1 h-5 rounded-sm ${getHeatColor(val)}`} title={`${day} ${hoursOfDay[hi]}: ${Math.round(val * 100)}%`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-muted-foreground">Low</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
              <div key={v} className={`w-4 h-3 rounded-sm ${getHeatColor(v)}`} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">High</span>
        </div>
      </div>

      {/* Platform Analysis */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Platform Analysis</h3>
          <button
            onClick={refreshAnalysis}
            disabled={refreshingAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {refreshingAnalysis ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh Analysis
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{analysisText}</p>
      </div>
    </div>
  );
}
