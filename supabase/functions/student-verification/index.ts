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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { action, email, code } = await req.json();

    if (action === "send") {
      if (!email || typeof email !== "string") throw new Error("Email is required");
      const trimmed = email.trim().toLowerCase();
      if (trimmed.length > 255) throw new Error("Email too long");
      if (!trimmed.endsWith(".edu")) throw new Error("Only .edu email addresses qualify for student discount");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) throw new Error("Invalid email format");

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await serviceClient
        .from("student_verification_codes")
        .delete()
        .eq("user_id", user.id);

      const { error: insertError } = await serviceClient
        .from("student_verification_codes")
        .insert({
          user_id: user.id,
          email: trimmed,
          code: verificationCode,
        });

      if (insertError) throw new Error("Failed to create verification code");

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Digital Home <noreply@resend.dev>",
            to: [trimmed],
            subject: "Your Student Verification Code",
            html: `<h2>Your verification code</h2><p style="font-size:32px;font-weight:bold;letter-spacing:4px">${verificationCode}</p><p>This code expires in 10 minutes.</p>`,
          }),
        });
      }

      console.log(`Verification code for ${trimmed}: ${verificationCode}`);

      return new Response(
        JSON.stringify({ success: true, message: "Verification code sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!code || typeof code !== "string") throw new Error("Code is required");
      const trimmedCode = code.trim();
      if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
        throw new Error("Invalid code format");
      }

      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: record, error: fetchError } = await serviceClient
        .from("student_verification_codes")
        .select("*")
        .eq("user_id", user.id)
        .eq("code", trimmedCode)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (fetchError || !record) {
        throw new Error("Invalid or expired verification code");
      }

      await serviceClient
        .from("student_verification_codes")
        .update({ verified: true })
        .eq("id", record.id);

      await serviceClient
        .from("user_preferences")
        .update({
          student_verified: true,
          student_email: record.email,
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true, message: "Student status verified!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
