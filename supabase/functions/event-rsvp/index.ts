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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const method = req.method;

    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (method === "GET") {
      // Fetch event details by share token (public)
      const { data: event, error: eventError } = await supabase
        .from("event_details")
        .select("*, projects!inner(name, cover_image, cover_type)")
        .eq("share_token", token)
        .single();

      if (eventError || !event) {
        return new Response(JSON.stringify({ error: "Event not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch RSVP questions
      const { data: questions } = await supabase
        .from("event_rsvp_questions")
        .select("*")
        .eq("event_id", event.id)
        .order("position", { ascending: true });

      return new Response(JSON.stringify({ event, questions: questions || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      // Submit RSVP
      const body = await req.json();
      const { guest_email, status, name, answers } = body;

      if (!guest_email || !status) {
        return new Response(JSON.stringify({ error: "Email and status required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find event
      const { data: event } = await supabase
        .from("event_details")
        .select("id, rsvp_deadline")
        .eq("share_token", token)
        .single();

      if (!event) {
        return new Response(JSON.stringify({ error: "Event not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check deadline
      if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
        return new Response(JSON.stringify({ error: "RSVP deadline has passed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if guest exists
      const { data: existingGuest } = await supabase
        .from("event_guests")
        .select("id")
        .eq("event_id", event.id)
        .eq("email", guest_email.toLowerCase())
        .maybeSingle();

      if (existingGuest) {
        // Update existing guest
        await supabase
          .from("event_guests")
          .update({
            status,
            name: name || null,
            rsvp_at: new Date().toISOString(),
            rsvp_answers: answers || {},
          })
          .eq("id", existingGuest.id);
      } else {
        // Create new guest entry (for public events)
        await supabase
          .from("event_guests")
          .insert({
            event_id: event.id,
            email: guest_email.toLowerCase(),
            name: name || null,
            status,
            rsvp_at: new Date().toISOString(),
            rsvp_answers: answers || {},
          });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track view
    if (method === "PATCH") {
      const body = await req.json();
      const { guest_email } = body;

      if (!guest_email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: event } = await supabase
        .from("event_details")
        .select("id")
        .eq("share_token", token)
        .single();

      if (event) {
        await supabase
          .from("event_guests")
          .update({ viewed_at: new Date().toISOString(), status: "viewed" })
          .eq("event_id", event.id)
          .eq("email", guest_email.toLowerCase())
          .eq("status", "pending");
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
