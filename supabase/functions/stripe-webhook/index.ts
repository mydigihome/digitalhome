import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const PAYMENT_LINK_MAP: Record<string, any> = {
  "https://buy.stripe.com/aFa3cvf0eagu0CM55Eak001": { tier: "founding", cycle: "monthly" },
  "https://buy.stripe.com/fZueVd4lA60e1GQdCaak000": { tier: "founding", cycle: "annual" },
  "https://buy.stripe.com/00w5kDdWa74i71a55Eak002": { tier: "standard", cycle: "monthly" },
  "https://buy.stripe.com/9B6aEXdWa60ecludCaak003": { tier: "standard", cycle: "annual" },
  "https://buy.stripe.com/7sY7sL9FUagu4T2fKiak004": { studio: true },
  "https://buy.stripe.com/6oUfZhdWa88m71a1Tsak005": { templates: true },
  "https://buy.stripe.com/cNiaEXcS6dsG5X6bu2ak006": { templates: true },
};

serve(async (req) => {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    if (event.type !== "checkout.session.completed") {
      return new Response("ok", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const session = event.data.object;
    const customerEmail = session.customer_details?.email;
    const paymentLink = session.payment_link;

    if (!customerEmail) {
      console.log("No customer email found");
      return new Response("ok", { status: 200 });
    }

    // Find user by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const matchedUser = users?.users?.find((u: any) => u.email === customerEmail);

    if (!matchedUser) {
      console.log("User not found:", customerEmail);
      return new Response("ok", { status: 200 });
    }

    const userId = matchedUser.id;
    const purchase = paymentLink ? PAYMENT_LINK_MAP[paymentLink] : null;

    if (!purchase) {
      console.log("Unknown payment link:", paymentLink);
      return new Response("ok", { status: 200 });
    }

    const update: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (purchase.tier) {
      update.plan_tier = purchase.tier;
      update.billing_cycle = purchase.cycle;
      update.is_subscribed = true;
      if (purchase.tier === "founding") {
        update.is_founding_member = true;
      }
      if (purchase.cycle === "annual") {
        update.annual_start_date = new Date().toISOString();
        const renewalDate = new Date();
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        update.renewal_date = renewalDate.toISOString();
      }
    }

    if (purchase.studio) {
      update.studio_unlocked = true;
    }

    if (purchase.templates) {
      update.templates_unlocked = true;
    }

    await supabase.from("user_preferences").upsert(update);

    // Send notification
    let title = "";
    let message = "";
    if (purchase.tier) {
      title = `${purchase.tier.charAt(0).toUpperCase() + purchase.tier.slice(1)} Plan Active!`;
      message = `Welcome to Digital Home ${purchase.tier}. You have full access.`;
    } else if (purchase.studio) {
      title = "Studio Unlocked!";
      message = "Studio is now unlocked. Start building your creator HQ.";
    } else if (purchase.templates) {
      title = "Templates Unlocked!";
      message = "Templates are now available in Applications.";
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "system",
      title,
      message,
      read: false,
      created_at: new Date().toISOString(),
    });

    console.log("Updated user:", userId, "Purchase:", JSON.stringify(purchase));
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("ok", { status: 200 });
  }
});
