import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://digitalhome.lovable.app",
  "https://id-preview--896dea26-170e-4d66-9e27-cee018632c91.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

async function getAuthenticatedUser(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return null;
  return data.claims.sub as string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const { action, code, redirect_uri } = await req.json();

    if (action === "get_auth_url") {
      if (!redirect_uri) {
        return new Response(JSON.stringify({ error: "redirect_uri required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/gmail.readonly",
        access_type: "offline",
        prompt: "consent",
      });
      return new Response(JSON.stringify({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_code") {
      const userId = await getAuthenticatedUser(req, SUPABASE_URL, SUPABASE_ANON_KEY);
      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!code || !redirect_uri) {
        return new Response(JSON.stringify({ error: "code and redirect_uri required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri, grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenResp.json();
      if (tokenData.error) {
        return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userInfoResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userInfo = await userInfoResp.json();

      const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      await serviceClient.from("gmail_tokens").delete().eq("user_id", userId);
      const { error: insertError } = await serviceClient.from("gmail_tokens").insert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        email: userInfo.email || null,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to store tokens" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, email: userInfo.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      const userId = await getAuthenticatedUser(req, SUPABASE_URL, SUPABASE_ANON_KEY);
      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      await serviceClient.from("gmail_tokens").delete().eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Gmail auth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
