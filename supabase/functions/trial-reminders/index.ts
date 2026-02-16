import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data: oneDayUsers } = await serviceClient
      .from("user_preferences")
      .select("user_id, trial_end_date")
      .eq("is_subscribed", false)
      .gte("trial_end_date", now.toISOString())
      .lte("trial_end_date", oneDayFromNow.toISOString());

    const { data: threeDayUsers } = await serviceClient
      .from("user_preferences")
      .select("user_id, trial_end_date")
      .eq("is_subscribed", false)
      .gt("trial_end_date", oneDayFromNow.toISOString())
      .lte("trial_end_date", threeDaysFromNow.toISOString());

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const results: string[] = [];

    const sendReminder = async (userId: string, daysLeft: number) => {
      const { data: { users }, error } = await serviceClient.auth.admin.listUsers();
      const authUser = users?.find((u: any) => u.id === userId);
      if (!authUser?.email) {
        results.push(`No email for user ${userId}`);
        return;
      }

      if (resendKey) {
        const subject = daysLeft === 1
          ? "Your Digital Home trial expires tomorrow!"
          : `Your Digital Home trial expires in ${daysLeft} days`;

        const html = `
          <h2>${subject}</h2>
          <p>Hi there! Your free trial is ending ${daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`}.</p>
          <p>Upgrade to Pro to keep all your projects, tasks, and data:</p>
          <ul>
            <li>Unlimited projects & tasks</li>
            <li>AI Brain Dump & task generation</li>
            <li>Vision Room, Wealth Tracker & more</li>
          </ul>
          <p><strong>Pro: $200/year | Student: $100/year</strong></p>
          <p>Don't lose your progress — upgrade today!</p>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Digital Home <noreply@resend.dev>",
            to: [authUser.email],
            subject,
            html,
          }),
        });
        results.push(`Sent ${daysLeft}-day reminder to ${authUser.email}`);
      } else {
        results.push(`Would send ${daysLeft}-day reminder to ${authUser.email} (RESEND_API_KEY not configured)`);
      }
    };

    for (const u of oneDayUsers || []) {
      await sendReminder(u.user_id, 1);
    }
    for (const u of threeDayUsers || []) {
      await sendReminder(u.user_id, 3);
    }

    console.log("Trial reminders:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Trial reminder error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
