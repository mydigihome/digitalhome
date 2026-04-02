
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const generated: string[] = [];

    const isDuplicate = async (message: string) => {
      const { data } = await supabase.from("notifications").select("id").eq("user_id", user_id).eq("message", message).gte("created_at", new Date(Date.now() - 86400000).toISOString()).limit(1);
      return data && data.length > 0;
    };

    // 1. Upcoming bills (within 7 days)
    const sevenDays = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
    const { data: bills } = await supabase.from("bills").select("*").eq("user_id", user_id).gte("due_date", todayStr).lte("due_date", sevenDays);
    for (const bill of bills || []) {
      const daysUntil = Math.ceil((new Date(bill.due_date).getTime() - now.getTime()) / 86400000);
      const msg = `$${bill.amount} due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;
      if (await isDuplicate(msg)) continue;
      await supabase.from("notifications").insert({ user_id, type: "bill", title: bill.merchant, message: msg, category: "Money", action_url: "/finance/wealth" });
      generated.push(msg);
    }

    // 2. Overdue contact follow-ups
    const { data: contacts } = await supabase.from("contacts").select("*").eq("user_id", user_id).not("followup_cadence", "is", null);
    for (const c of contacts || []) {
      if (!c.last_contacted_date) continue;
      const lastContact = new Date(c.last_contacted_date);
      const overdueDays = Math.floor((now.getTime() - lastContact.getTime()) / 86400000) - (c.followup_cadence || 30);
      if (overdueDays <= 0) continue;
      const msg = `Follow-up is overdue by ${overdueDays} days`;
      if (await isDuplicate(msg)) continue;
      await supabase.from("notifications").insert({ user_id, type: "contact", title: c.name, message: msg, category: "Contacts", action_url: "/relationships" });
      generated.push(msg);
    }

    // 3. Tasks due within 3 days
    const threeDays = new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0];
    const { data: tasks } = await supabase.from("tasks").select("*").eq("user_id", user_id).gte("due_date", todayStr).lte("due_date", threeDays).neq("status", "done");
    for (const t of tasks || []) {
      const msg = `Due ${new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      if (await isDuplicate(msg)) continue;
      await supabase.from("notifications").insert({ user_id, type: "project", title: t.title, message: msg, category: "Projects", action_url: "/projects" });
      generated.push(msg);
    }

    // 4. Content due within 2 days
    const twoDays = new Date(now.getTime() + 2 * 86400000).toISOString().split("T")[0];
    const { data: content } = await supabase.from("content_items").select("*").eq("user_id", user_id).gte("due_date", todayStr).lte("due_date", twoDays).neq("stage", "posted");
    for (const item of content || []) {
      const msg = `Content due ${new Date(item.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      if (await isDuplicate(msg)) continue;
      await supabase.from("notifications").insert({ user_id, type: "studio", title: item.title, message: msg, category: "Studio", action_url: "/studio" });
      generated.push(msg);
    }

    return new Response(JSON.stringify({ generated: generated.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
