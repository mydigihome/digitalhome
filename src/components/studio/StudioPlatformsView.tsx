import { useState, useEffect } from "react";
import { RefreshCw, Loader2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  placeholder: string;
  stats: string[];
}

const platformConfigs: PlatformConfig[] = [
  { id: "youtube", name: "YouTube", icon: "Y", color: "#DC2626", bg: "#FEF2F2", placeholder: "@yourchannel or channel URL", stats: ["subscribers", "views", "videos"] },
  { id: "instagram", name: "Instagram", icon: "IG", color: "#BE185D", bg: "#FDF2F8", placeholder: "@yourhandle", stats: ["followers", "posts"] },
  { id: "tiktok", name: "TikTok", icon: "TK", color: "#065F46", bg: "#F0FDF4", placeholder: "@yourhandle", stats: ["followers", "likes"] },
  { id: "twitter", name: "Twitter / X", icon: "X", color: "#374151", bg: "#F9FAFB", placeholder: "@yourhandle", stats: ["followers"] },
  { id: "substack", name: "Substack", icon: "SS", color: "#FF6719", bg: "#FFF7ED", placeholder: "yourname.substack.com", stats: ["url"] },
];

export default function StudioPlatformsView() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [platformData, setPlatformData] = useState<any>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showInput, setShowInput] = useState<string | null>(null);
  const [handles, setHandles] = useState<any>({
    youtube: "", instagram: "", tiktok: "", twitter: "", substack: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("studio_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const d = data as any;
        setHandles({
          youtube: d.youtube_handle || "",
          instagram: d.instagram_handle || "",
          tiktok: d.tiktok_handle || "",
          twitter: d.twitter_handle || "",
          substack: d.substack_url || "",
        });
        setPlatformData({
          youtube: { connected: d.youtube_connected, subscribers: d.youtube_subscribers, views: d.youtube_total_views, videos: d.youtube_video_count, synced: d.youtube_synced_at },
          instagram: { connected: d.instagram_connected, followers: d.instagram_followers, posts: d.instagram_post_count, synced: d.instagram_synced_at },
          tiktok: { connected: d.tiktok_connected, followers: d.tiktok_followers, likes: d.tiktok_total_likes, synced: d.tiktok_synced_at },
          twitter: { connected: d.twitter_connected, followers: d.twitter_followers, synced: d.twitter_synced_at },
          substack: { connected: !!d.substack_url, url: d.substack_url },
        });
      }
    })();
  }, [user]);

  const updateCombinedFollowers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("studio_profile")
      .select("youtube_subscribers, instagram_followers, tiktok_followers, twitter_followers")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) return;
    const d = data as any;
    const combined = (d.youtube_subscribers || 0) + (d.instagram_followers || 0) + (d.tiktok_followers || 0) + (d.twitter_followers || 0);
    await supabase.from("studio_profile").upsert({ user_id: user.id, combined_followers: combined } as any, { onConflict: "user_id" });
  };

  const fetchYouTube = async (handle: string, isSync = false) => {
    if (!handle.trim() || !user) return;
    setConnecting("youtube");
    try {
      const { data, error } = await supabase.functions.invoke("fetch-youtube-stats", { body: { handle } });
      if (error || !data?.channel) {
        toast.error(data?.error || "Channel not found. Check your handle.");
        return;
      }
      const ch = data.channel;
      await supabase.from("studio_profile").upsert({
        user_id: user.id, youtube_handle: ch.handle || handle, youtube_channel_id: ch.channel_id,
        youtube_subscribers: ch.subscribers, youtube_total_views: ch.total_views,
        youtube_video_count: ch.video_count, youtube_recent_videos: ch.recent_videos,
        youtube_connected: true, youtube_synced_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
      setPlatformData((prev: any) => ({ ...prev, youtube: { connected: true, subscribers: ch.subscribers, views: ch.total_views, videos: ch.video_count, synced: new Date().toISOString() } }));
      setShowInput(null);
      await updateCombinedFollowers();
      toast.success(isSync ? "YouTube synced! ✓" : `YouTube connected! ${ch.subscribers.toLocaleString()} subscribers`);
    } catch {
      toast.error("Connection failed");
    } finally {
      setConnecting(null);
    }
  };

  const fetchInstagram = async (handle: string, isSync = false) => {
    if (!handle.trim() || !user) return;
    setConnecting("instagram");
    try {
      const cleanHandle = handle.replace(/^@/, "").replace(/https?:\/\/(www\.)?instagram\.com\//, "").split("/")[0].split("?")[0];
      const { data } = await supabase.functions.invoke("fetch-social-stats", { body: { platform: "instagram", handle: cleanHandle } });
      const followers = data?.followers || 0;
      const posts = data?.posts || 0;
      await supabase.from("studio_profile").upsert({
        user_id: user.id, instagram_handle: cleanHandle, instagram_followers: followers,
        instagram_post_count: posts, instagram_connected: true, instagram_synced_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
      setPlatformData((prev: any) => ({ ...prev, instagram: { connected: true, followers, posts, synced: new Date().toISOString() } }));
      setShowInput(null);
      await updateCombinedFollowers();
      toast.success(isSync ? "Instagram synced! ✓" : followers > 0 ? `Instagram connected! ${followers.toLocaleString()} followers` : "Instagram handle saved — update followers manually if needed");
    } catch {
      await supabase.from("studio_profile").upsert({ user_id: user!.id, instagram_handle: handle.replace(/^@/, ""), instagram_connected: true } as any, { onConflict: "user_id" });
      setPlatformData((prev: any) => ({ ...prev, instagram: { connected: true } }));
      setShowInput(null);
      toast.success("Instagram handle saved");
    } finally {
      setConnecting(null);
    }
  };

  const fetchTikTok = async (handle: string, isSync = false) => {
    if (!handle.trim() || !user) return;
    setConnecting("tiktok");
    try {
      const cleanHandle = handle.replace(/^@/, "").replace(/https?:\/\/(www\.)?tiktok\.com\/@?/, "").split("/")[0].split("?")[0];
      const { data } = await supabase.functions.invoke("fetch-social-stats", { body: { platform: "tiktok", handle: cleanHandle } });
      const followers = data?.followers || 0;
      const likes = data?.likes || 0;
      await supabase.from("studio_profile").upsert({
        user_id: user.id, tiktok_handle: cleanHandle, tiktok_followers: followers,
        tiktok_total_likes: likes, tiktok_connected: true, tiktok_synced_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
      setPlatformData((prev: any) => ({ ...prev, tiktok: { connected: true, followers, likes, synced: new Date().toISOString() } }));
      setShowInput(null);
      await updateCombinedFollowers();
      toast.success(isSync ? "TikTok synced! ✓" : "TikTok connected! ✓");
    } catch {
      await supabase.from("studio_profile").upsert({ user_id: user!.id, tiktok_handle: handle.replace(/^@/, ""), tiktok_connected: true } as any, { onConflict: "user_id" });
      setPlatformData((prev: any) => ({ ...prev, tiktok: { connected: true } }));
      setShowInput(null);
      toast.success("TikTok handle saved");
    } finally {
      setConnecting(null);
    }
  };

  const fetchTwitter = async (handle: string) => {
    if (!handle.trim() || !user) return;
    setConnecting("twitter");
    const cleanHandle = handle.replace(/^@/, "");
    await supabase.from("studio_profile").upsert({
      user_id: user.id, twitter_handle: cleanHandle, twitter_connected: true, twitter_synced_at: new Date().toISOString(),
    } as any, { onConflict: "user_id" });
    setPlatformData((prev: any) => ({ ...prev, twitter: { connected: true } }));
    setShowInput(null);
    toast.success("Twitter / X connected — update followers manually (X API requires paid access)");
    setConnecting(null);
  };

  const fetchSubstack = async (url: string) => {
    if (!url.trim() || !user) return;
    setConnecting("substack");
    const cleanUrl = url.includes("http") ? url : `https://${url}`;
    await supabase.from("studio_profile").upsert({ user_id: user.id, substack_url: cleanUrl } as any, { onConflict: "user_id" });
    setPlatformData((prev: any) => ({ ...prev, substack: { connected: true, url: cleanUrl } }));
    setShowInput(null);
    toast.success("Substack connected! ✓");
    setConnecting(null);
  };

  const getFetchFn = (id: string) => {
    switch (id) {
      case "youtube": return fetchYouTube;
      case "instagram": return fetchInstagram;
      case "tiktok": return fetchTikTok;
      case "twitter": return fetchTwitter;
      case "substack": return fetchSubstack;
      default: return () => {};
    }
  };

  const getStatLine = (id: string) => {
    const d = platformData[id];
    if (!d?.connected) return null;
    switch (id) {
      case "youtube": return `${(d.subscribers || 0).toLocaleString()} subscribers · ${d.videos || 0} videos`;
      case "instagram": return `${(d.followers || 0).toLocaleString()} followers${d.posts ? ` · ${d.posts} posts` : ""}`;
      case "tiktok": return `${(d.followers || 0).toLocaleString()} followers${d.likes ? ` · ${d.likes.toLocaleString()} likes` : ""}`;
      case "twitter": return `${(d.followers || 0).toLocaleString()} followers`;
      case "substack": return d.url || "Connected";
      default: return "Connected";
    }
  };

  return (
    <div className="space-y-4 max-w-[900px] mx-auto">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
          Connect Your Platforms
        </h2>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
          Link your social accounts to pull in analytics, followers, and engagement data.
        </p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)" }}>
        {platformConfigs.map((p) => {
          const connected = platformData[p.id]?.connected;
          const fetchFn = getFetchFn(p.id);
          const statLine = getStatLine(p.id);

          return (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all" style={{ fontFamily: "Inter, sans-serif" }}>
              {/* Top row */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: p.bg, color: p.color }}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  {connected && statLine ? (
                    <p className="text-xs text-muted-foreground truncate">{statLine}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {connected && (
                    <button
                      onClick={() => (fetchFn as any)(handles[p.id], true)}
                      disabled={connecting === p.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {connecting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Sync
                    </button>
                  )}
                  <button
                    onClick={() => setShowInput(showInput === p.id ? null : p.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: connected ? "transparent" : p.color,
                      border: `1px solid ${connected ? "hsl(var(--border))" : p.color}`,
                      color: connected ? "hsl(var(--foreground))" : "white",
                    }}
                  >
                    {connected ? "Edit" : "Connect"}
                    {!connected && <ExternalLink className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Input row */}
              {showInput === p.id && (
                <div className="px-4 pb-3 flex gap-2">
                  <input
                    type="text"
                    placeholder={p.placeholder}
                    value={handles[p.id] || ""}
                    onChange={e => setHandles((prev: any) => ({ ...prev, [p.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") (fetchFn as any)(handles[p.id]); }}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  <button
                    onClick={() => (fetchFn as any)(handles[p.id])}
                    disabled={!handles[p.id]?.trim() || connecting === p.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: p.color, fontFamily: "Inter, sans-serif" }}
                  >
                    {connecting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {connecting === p.id ? "Fetching..." : "Fetch"}
                  </button>
                </div>
              )}

              {/* Connected badge + synced time */}
              {connected && platformData[p.id]?.synced && (
                <div className="px-4 pb-3 flex items-center justify-between border-t border-border pt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    Synced {new Date(platformData[p.id].synced).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
