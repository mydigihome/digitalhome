const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { platform, handle } = await req.json();

    const result: { followers: number; posts: number; likes: number; success: boolean } = {
      followers: 0,
      posts: 0,
      likes: 0,
      success: false,
    };

    if (platform === "instagram") {
      try {
        const url = `https://www.instagram.com/${handle}/`;
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            Accept: "text/html",
          },
        });
        const html = await res.text();

        const followersMatch = html.match(/"edge_followed_by":\{"count":(\d+)\}/);
        if (followersMatch) {
          result.followers = parseInt(followersMatch[1]);
          result.success = true;
        }

        const postsMatch = html.match(/"edge_owner_to_timeline_media":\{"count":(\d+)/);
        if (postsMatch) {
          result.posts = parseInt(postsMatch[1]);
        }
      } catch {
        // Instagram blocks most scraping — return empty
      }
    }

    if (platform === "tiktok") {
      try {
        const url = `https://www.tiktok.com/@${handle}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          },
        });
        const html = await res.text();

        const followersMatch = html.match(/"followerCount":(\d+)/);
        if (followersMatch) {
          result.followers = parseInt(followersMatch[1]);
          result.success = true;
        }

        const likesMatch = html.match(/"heartCount":(\d+)/);
        if (likesMatch) {
          result.likes = parseInt(likesMatch[1]);
        }
      } catch {
        // TikTok blocks most scraping
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        followers: 0,
        posts: 0,
        success: false,
        error: (error as Error).message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
