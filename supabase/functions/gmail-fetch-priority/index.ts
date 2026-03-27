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
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  try {
    // Auth
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

    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get tokens
    const { data: tokenRow } = await serviceClient.from("gmail_tokens").select("*").eq("user_id", user.id).single();
    if (!tokenRow) {
      return new Response(JSON.stringify({ error: "Gmail not connected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenRow.access_token;

    // Refresh if expired
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      if (!tokenRow.refresh_token) {
        return new Response(JSON.stringify({ error: "Token expired, no refresh token" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const refreshResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: tokenRow.refresh_token,
          grant_type: "refresh_token",
        }),
      });
      const refreshData = await refreshResp.json();
      if (refreshData.error) {
        return new Response(JSON.stringify({ error: "Token refresh failed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      accessToken = refreshData.access_token;
      await serviceClient.from("gmail_tokens").update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      }).eq("user_id", user.id);
    }

    // Get priority contact emails
    const { data: priorityContacts } = await serviceClient
      .from("priority_contacts")
      .select("contact_id")
      .eq("user_id", user.id);

    if (!priorityContacts?.length) {
      return new Response(JSON.stringify({ synced: 0, message: "No priority contacts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contactIds = priorityContacts.map(pc => pc.contact_id);
    const { data: contacts } = await serviceClient
      .from("contacts")
      .select("id, email")
      .in("id", contactIds);

    const emailToContact: Record<string, string> = {};
    for (const c of contacts || []) {
      if (c.email) emailToContact[c.email.toLowerCase()] = c.id;
    }

    if (Object.keys(emailToContact).length === 0) {
      return new Response(JSON.stringify({ synced: 0, message: "No priority contacts with emails" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch messages
    const query = Object.keys(emailToContact).map(e => `from:${e}`).join(" OR ");
    const listResp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const listData = await listResp.json();

    let synced = 0;
    for (const msg of listData.messages || []) {
      const detailResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const detail = await detailResp.json();

      const headers = detail.payload?.headers || [];
      const from = headers.find((h: any) => h.name === "From")?.value || "";
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
      const date = headers.find((h: any) => h.name === "Date")?.value || "";

      const emailMatch = from.match(/<([^>]+)>/) || [null, from];
      const fromEmail = (emailMatch[1] || "").toLowerCase();
      const contactId = emailToContact[fromEmail];
      if (!contactId) continue;

      const { error: upsertErr } = await serviceClient.from("priority_emails").upsert({
        user_id: user.id,
        contact_id: contactId,
        gmail_message_id: msg.id,
        thread_id: detail.threadId,
        subject,
        snippet: detail.snippet || "",
        from_email: fromEmail,
        received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
      }, { onConflict: "gmail_message_id" });

      if (!upsertErr) synced++;
    }

    return new Response(JSON.stringify({ synced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("gmail-fetch-priority error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
