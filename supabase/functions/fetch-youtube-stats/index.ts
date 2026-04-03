import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { handle } = await req.json();
    if (!handle || typeof handle !== "string") {
      return new Response(JSON.stringify({ error: "handle is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "YouTube API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize: extract handle from URL or clean up input
    let cleanHandle = handle.trim();
    // Handle URLs like youtube.com/@handle or youtube.com/channel/ID
    const handleMatch = cleanHandle.match(/@([\w.-]+)/);
    const channelIdMatch = cleanHandle.match(/channel\/(UC[\w-]+)/);

    let channelId: string | null = null;
    let channelData: any = null;

    if (channelIdMatch) {
      channelId = channelIdMatch[1];
    } else {
      // Search by handle
      const searchHandle = handleMatch ? handleMatch[1] : cleanHandle.replace(/^@/, "");
      const searchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${searchHandle}&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.items && searchData.items.length > 0) {
        channelData = searchData.items[0];
        channelId = channelData.id;
      } else {
        // Try as username
        const userUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forUsername=${searchHandle}&key=${apiKey}`;
        const userRes = await fetch(userUrl);
        const userData = await userRes.json();
        if (userData.items && userData.items.length > 0) {
          channelData = userData.items[0];
          channelId = channelData.id;
        }
      }
    }

    if (!channelData && channelId) {
      const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
      const chRes = await fetch(chUrl);
      const chData = await chRes.json();
      if (chData.items && chData.items.length > 0) {
        channelData = chData.items[0];
      }
    }

    if (!channelData) {
      return new Response(JSON.stringify({ error: "Channel not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recent videos
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=5&type=video&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();

    const recentVideos = (videosData.items || []).map((v: any) => ({
      video_id: v.id?.videoId,
      title: v.snippet?.title,
      thumbnail: v.snippet?.thumbnails?.medium?.url,
      published_at: v.snippet?.publishedAt,
    }));

    const stats = channelData.statistics || {};
    const snippet = channelData.snippet || {};

    return new Response(JSON.stringify({
      channel: {
        channel_id: channelId,
        handle: snippet.customUrl || `@${handle.replace(/^@/, "")}`,
        title: snippet.title,
        thumbnail: snippet.thumbnails?.default?.url,
        subscribers: parseInt(stats.subscriberCount || "0", 10),
        total_views: parseInt(stats.viewCount || "0", 10),
        video_count: parseInt(stats.videoCount || "0", 10),
        recent_videos: recentVideos,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
