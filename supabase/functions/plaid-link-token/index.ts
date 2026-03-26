import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // TODO: Wire Plaid credentials when available
    const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
    const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
    const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      return new Response(
        JSON.stringify({ error: "Plaid credentials not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id } = await req.json();

    const baseUrl = PLAID_ENV === "production"
      ? "https://production.plaid.com"
      : PLAID_ENV === "development"
        ? "https://development.plaid.com"
        : "https://sandbox.plaid.com";

    const response = await fetch(`${baseUrl}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        user: { client_user_id: user_id },
        client_name: "Digital Home",
        products: ["transactions", "liabilities"],
        country_codes: ["US"],
        language: "en",
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
