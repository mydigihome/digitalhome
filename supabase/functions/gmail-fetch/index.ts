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

async function refreshTokenIfNeeded(tokens: any, serviceClient: any) {
  if (!tokens.expires_at) return tokens.access_token;
  const expiresAt = new Date(tokens.expires_at).getTime();
  if (Date.now() < expiresAt - 60000) return tokens.access_token;

  if (!tokens.refresh_token) throw new Error("Token expired and no refresh token");

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error_description || data.error);

  await serviceClient.from("gmail_tokens").update({
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }).eq("user_id", tokens.user_id);

  return data.access_token;
}

function extractHeader(headers: any[], name: string) {
  const h = headers?.find((h: any) => h.name?.toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

function decodeBody(payload: any): string {
  if (payload?.body?.data) {
    try {
      const decoded = atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      return decoded;
    } catch { return ""; }
  }
  if (payload?.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        try {
          return atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
        } catch { continue; }
      }
    }
    for (const part of payload.parts) {
      const nested = decodeBody(part);
      if (nested) return nested;
    }
  }
  return "";
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { action, thread_id } = await req.json();
    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: tokens, error: tokenError } = await serviceClient
      .from("gmail_tokens").select("*").eq("user_id", userId).single();
    if (tokenError || !tokens) {
      return new Response(JSON.stringify({ error: "Gmail not connected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await refreshTokenIfNeeded(tokens, serviceClient);

    if (action === "fetch_messages") {
      const listResp = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const listData = await listResp.json();
      if (!listResp.ok) {
        return new Response(JSON.stringify({ error: listData.error?.message || "Gmail API error" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const messages = listData.messages || [];
      const emails = [];

      // Fetch first 50 message details (batch of parallel requests, 10 at a time)
      for (let i = 0; i < messages.length; i += 10) {
        const batch = messages.slice(i, i + 10);
        const details = await Promise.all(
          batch.map(async (m: any) => {
            const resp = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            return resp.json();
          })
        );
        for (const msg of details) {
          const headers = msg.payload?.headers || [];
          const from = extractHeader(headers, "From");
          const subject = extractHeader(headers, "Subject");
          const date = extractHeader(headers, "Date");
          const body = decodeBody(msg.payload);
          const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/);
          emails.push({
            id: msg.id,
            threadId: msg.threadId,
            senderName: senderMatch ? senderMatch[1].replace(/"/g, "").trim() : from,
            senderEmail: senderMatch ? senderMatch[2] : from,
            subject: subject || "(No Subject)",
            preview: body.replace(/\s+/g, " ").trim().slice(0, 100),
            timestamp: date,
            labelIds: msg.labelIds || [],
          });
        }
      }

      return new Response(JSON.stringify({ emails, userEmail: tokens.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "fetch_thread") {
      if (!thread_id) {
        return new Response(JSON.stringify({ error: "thread_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const resp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread_id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const threadData = await resp.json();
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: threadData.error?.message || "Failed to fetch thread" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const threadMessages = (threadData.messages || []).map((msg: any) => {
        const headers = msg.payload?.headers || [];
        const from = extractHeader(headers, "From");
        const senderMatch = from.match(/^(.+?)\s*<(.+?)>$/);
        return {
          id: msg.id,
          senderName: senderMatch ? senderMatch[1].replace(/"/g, "").trim() : from,
          senderEmail: senderMatch ? senderMatch[2] : from,
          subject: extractHeader(headers, "Subject"),
          body: decodeBody(msg.payload),
          timestamp: extractHeader(headers, "Date"),
        };
      });

      // Determine status based on last message sender
      const lastMsg = threadMessages[threadMessages.length - 1];
      const userEmail = tokens.email?.toLowerCase() || "";
      const lastSenderEmail = lastMsg?.senderEmail?.toLowerCase() || "";
      let status = "Up to Date";
      if (lastSenderEmail === userEmail) {
        status = "Waiting for Reply";
      } else if (lastSenderEmail !== userEmail && threadMessages.length > 1) {
        status = "New Response";
      }

      return new Response(JSON.stringify({ messages: threadMessages, status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Gmail fetch error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
