import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  // Webhooks are POST only
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.text();

    let event: Stripe.Event;

    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) throw new Error("Missing stripe-signature header");
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Dev mode: parse without verification
      event = JSON.parse(body);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const templateIds: string[] = JSON.parse(metadata.template_ids || "[]");
      const isBundle = metadata.is_bundle === "true";
      const userId = metadata.user_id || null;
      const buyerEmail = session.customer_details?.email || session.customer_email || "";

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Insert purchase records for each template
      const purchases = templateIds.map((tid: string) => ({
        template_id: tid,
        user_id: userId || null,
        buyer_email: buyerEmail,
        stripe_payment_id: session.payment_intent as string,
        stripe_session_id: session.id,
        amount_paid: isBundle ? Math.round(500 / templateIds.length) : (session.amount_total || 100) / templateIds.length,
        is_bundle: isBundle,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("template_purchases")
        .insert(purchases);

      if (insertError) {
        console.error("Failed to insert purchases:", insertError);
      }

      // Increment download counts
      for (const tid of templateIds) {
        await supabaseAdmin.rpc("increment_download_count_if_exists", { tid });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
