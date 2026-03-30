import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LINKEDIN_CLIENT_ID = Deno.env.get("LINKEDIN_CLIENT_ID");
  const LINKEDIN_CLIENT_SECRET = Deno.env.get("LINKEDIN_CLIENT_SECRET");

  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: "LinkedIn not configured" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code, redirect_uri } = await req.json();
    if (!code || !redirect_uri) {
      return new Response(JSON.stringify({ error: "code and redirect_uri required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange code for token
    const tokenResp = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });
    const tokenData = await tokenResp.json();
    if (tokenData.error) {
      return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Save token
    await serviceClient.from("linkedin_tokens").upsert({
      user_id: user.id,
      access_token: tokenData.access_token,
      expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString(),
    }, { onConflict: "user_id" });

    // Fetch the authenticated user's own LinkedIn profile using the userinfo endpoint
    const profileResp = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    let imported = 0;

    if (profileResp.ok) {
      const profile = await profileResp.json();
      // profile contains: sub, name, given_name, family_name, picture, email, email_verified
      const contactName = profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim();
      const contactEmail = profile.email || null;
      const photoUrl = profile.picture || null;

      if (contactName) {
        // Upsert: if a contact with same email exists for this user, update; otherwise insert
        if (contactEmail) {
          const { data: existing } = await serviceClient
            .from("contacts")
            .select("id")
            .eq("user_id", user.id)
            .eq("email", contactEmail)
            .maybeSingle();

          if (existing) {
            await serviceClient.from("contacts").update({
              name: contactName,
              photo_url: photoUrl,
              imported_from: "linkedin",
              linkedin_url: profile.sub ? `https://www.linkedin.com/in/${profile.sub}` : null,
            }).eq("id", existing.id);
          } else {
            await serviceClient.from("contacts").insert({
              user_id: user.id,
              name: contactName,
              email: contactEmail,
              photo_url: photoUrl,
              imported_from: "linkedin",
              relationship_type: "Professional",
              linkedin_url: profile.sub ? `https://www.linkedin.com/in/${profile.sub}` : null,
            });
          }
          imported = 1;
        } else {
          // No email — just insert (can't deduplicate)
          await serviceClient.from("contacts").insert({
            user_id: user.id,
            name: contactName,
            photo_url: photoUrl,
            imported_from: "linkedin",
            relationship_type: "Professional",
          });
          imported = 1;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      imported,
      message: imported > 0
        ? `LinkedIn profile imported as contact.`
        : "LinkedIn connected but no profile data was available to import.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("linkedin-import error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
