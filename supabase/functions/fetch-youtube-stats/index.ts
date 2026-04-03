const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Aggressively clean handle
    const cleanHandle = handle
      .trim()
      .replace(/^@/, "")
      .replace(/https?:\/\/(www\.)?youtube\.com\/@?/, "")
      .replace(/https?:\/\/(www\.)?youtu\.be\//, "")
      .replace(/\/.*$/, "")
      .replace(/\?.*$/, "")
      .trim();

    // Check if it's already a channel ID
    const channelIdMatch = handle.match(/channel\/(UC[\w-]+)/);
    let channelId: string | null = channelIdMatch ? channelIdMatch[1] : null;
    let channelData: any = null;

    // METHOD 1 — Search API
    if (!channelId) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${apiKey}&maxResults=5`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.items && searchData.items.length > 0) {
          // Try exact match first
          const exactMatch = searchData.items.find(
            (item: any) =>
              item.snippet.channelTitle?.toLowerCase().replace(/\s/g, "") === cleanHandle.toLowerCase().replace(/\s/g, "") ||
              item.snippet.customUrl?.replace("@", "").toLowerCase() === cleanHandle.toLowerCase()
          );

          if (exactMatch) {
            channelId = exactMatch.snippet.channelId;
          } else {
            channelId = searchData.items[0].snippet.channelId;
          }
        }
      } catch {
        // Continue to method 2
      }
    }

    // METHOD 2 — forHandle parameter
    if (!channelId) {
      try {
        const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
        const handleRes = await fetch(handleUrl);
        const handleData = await handleRes.json();
        if (handleData.items && handleData.items.length > 0) {
          channelData = handleData.items[0];
          channelId = channelData.id;
        }
      } catch {
        // Continue to method 3
      }
    }

    // METHOD 3 — forUsername parameter
    if (!channelId) {
      try {
        const userUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics&forUsername=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
        const userRes = await fetch(userUrl);
        const userData = await userRes.json();
        if (userData.items && userData.items.length > 0) {
          channelData = userData.items[0];
          channelId = channelData.id;
        }
      } catch {
        // All methods exhausted
      }
    }

    // If we found a channelId but no channelData yet, fetch it
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
        handle: snippet.customUrl || `@${cleanHandle}`,
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
