import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { templateIds, isBundle, successUrl, cancelUrl, buyerEmail } = await req.json();

    // Validate inputs
    if (!successUrl || !cancelUrl) throw new Error("Missing redirect URLs");
    if (!templateIds && !isBundle) throw new Error("Missing templateIds or isBundle flag");

    let templates: any[] = [];

    if (isBundle) {
      // Fetch all bundle templates
      const { data, error } = await supabaseAdmin
        .from("shop_templates")
        .select("*")
        .eq("is_in_bundle", true)
        .eq("is_active", true);
      if (error) throw error;
      templates = data || [];
    } else {
      // Fetch specific templates
      if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new Error("templateIds must be a non-empty array");
      }
      const { data, error } = await supabaseAdmin
        .from("shop_templates")
        .select("*")
        .in("id", templateIds)
        .eq("is_active", true);
      if (error) throw error;
      templates = data || [];
    }

    if (templates.length === 0) throw new Error("No valid templates found");

    // Check if all requested are free
    const totalCents = isBundle ? 500 : templates.reduce((sum: number, t: any) => sum + (t.price_cents || 0), 0);
    if (totalCents === 0) {
      throw new Error("These templates are free - no payment required");
    }

    // Create or find Stripe product for each template (or bundle)
    let lineItems: any[];

    if (isBundle) {
      lineItems = [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Complete Career Kit (All Templates)",
            description: `${templates.length} professional templates - resumes, portfolios & emails`,
          },
          unit_amount: 500,
        },
        quantity: 1,
      }];
    } else {
      lineItems = templates.filter((t: any) => t.price_cents > 0).map((t: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: t.title,
            description: t.description || undefined,
          },
          unit_amount: t.price_cents,
        },
        quantity: 1,
      }));
    }

    // Optional: try to get auth user
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) userId = user.id;
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: buyerEmail || undefined,
      metadata: {
        template_ids: JSON.stringify(templates.map((t: any) => t.id)),
        is_bundle: isBundle ? "true" : "false",
        user_id: userId || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
