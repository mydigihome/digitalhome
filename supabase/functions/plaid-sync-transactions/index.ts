import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's plaid items
    const { data: items } = await supabase
      .from("plaid_items")
      .select("*")
      .eq("user_id", user_id);

    if (!items?.length) {
      return new Response(
        JSON.stringify({ error: "No linked bank accounts" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = PLAID_ENV === "production"
      ? "https://production.plaid.com"
      : PLAID_ENV === "development"
        ? "https://development.plaid.com"
        : "https://sandbox.plaid.com";

    // TODO: Sync transactions for each plaid item
    // For each item:
    // 1. Call /transactions/sync with cursor
    // 2. Upsert new transactions into plaid_transactions
    // 3. Update accounts balances
    // 4. Auto-detect recurring bills

    return new Response(
      JSON.stringify({ success: true, synced_items: items.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
