import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  return await resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const serviceClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get stored tokens
    const { data: tokenRow, error: tokenError } = await serviceClient
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenRow) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenRow.access_token;

    // Check if token expired, refresh if needed
    if (tokenRow.token_expires_at && new Date(tokenRow.token_expires_at) < new Date()) {
      if (!tokenRow.refresh_token) {
        return new Response(JSON.stringify({ error: "Token expired and no refresh token. Please reconnect." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const refreshed = await refreshAccessToken(tokenRow.refresh_token, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
      if (refreshed.error) {
        // Token revoked, clean up
        await serviceClient.from("google_calendar_tokens").delete().eq("user_id", userId);
        return new Response(JSON.stringify({ error: "Google token expired. Please reconnect." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await serviceClient.from("google_calendar_tokens").update({
        access_token: accessToken,
        token_expires_at: newExpiry,
      }).eq("user_id", userId);
    }

    // Fetch events from Google Calendar (next 3 months + past 1 month)
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const threeMonthsFromNow = new Date(now);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const calParams = new URLSearchParams({
      timeMin: oneMonthAgo.toISOString(),
      timeMax: threeMonthsFromNow.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "500",
    });

    const calResp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calParams.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!calResp.ok) {
      const errText = await calResp.text();
      console.error("Google Calendar API error:", errText);
      return new Response(JSON.stringify({ error: "Failed to fetch Google Calendar events" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const calData = await calResp.json();
    let importedCount = 0;

    for (const event of calData.items || []) {
      if (event.status === "cancelled") continue;

      const isAllDay = !!event.start?.date;
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;

      if (!startTime) continue;

      // Check if event already exists
      const { data: existing } = await serviceClient
        .from("calendar_events")
        .select("id, edited_locally")
        .eq("google_event_id", event.id)
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Don't overwrite locally edited events
        if (!existing.edited_locally) {
          await serviceClient.from("calendar_events").update({
            title: event.summary || "Untitled Event",
            description: event.description || null,
            start_time: startTime,
            end_time: endTime || null,
            all_day: isAllDay,
            location: event.location || null,
            attendees: event.attendees || [],
            synced_at: new Date().toISOString(),
          }).eq("id", existing.id);
        }
      } else {
        await serviceClient.from("calendar_events").insert({
          user_id: userId,
          title: event.summary || "Untitled Event",
          description: event.description || null,
          start_time: startTime,
          end_time: endTime || null,
          all_day: isAllDay,
          color: "#4285F4",
          location: event.location || null,
          source: "google_calendar",
          google_event_id: event.id,
          google_calendar_id: "primary",
          attendees: event.attendees || [],
          synced_at: new Date().toISOString(),
        });
      }
      importedCount++;
    }

    // Update sync time on token record
    await serviceClient.from("google_calendar_tokens").update({
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return new Response(
      JSON.stringify({ success: true, imported: importedCount, total: calData.items?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
