import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { credit_score } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const scoreRange = credit_score >= 750 ? "excellent (750-850)" :
      credit_score >= 670 ? "good (670-749)" :
      credit_score >= 580 ? "fair (580-669)" : "poor (300-579)";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a personal finance advisor. Give one specific, actionable credit score improvement tip. The user's credit score is in the ${scoreRange} range (score: ${credit_score}). Respond with valid JSON only: {"tip": "one sentence tip", "impact": "+X to +Y pts", "category": "one of: Utilization, Payment History, Credit Mix, Hard Inquiries, Account Age"}`,
          },
          {
            role: "user",
            content: `Give me one specific credit tip for my ${scoreRange} credit score of ${credit_score}. Be specific and actionable.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "credit_tip",
              description: "Return a credit score improvement tip",
              parameters: {
                type: "object",
                properties: {
                  tip: { type: "string", description: "One specific actionable tip" },
                  impact: { type: "string", description: "Estimated point impact like +5 to +20 pts" },
                  category: { type: "string", enum: ["Utilization", "Payment History", "Credit Mix", "Hard Inquiries", "Account Age"] },
                },
                required: ["tip", "impact", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "credit_tip" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback parse from content
      const content = data.choices?.[0]?.message?.content || "";
      try {
        result = JSON.parse(content);
      } catch {
        result = { tip: "Keep your credit utilization below 30% of your total available credit.", impact: "+10 to +30 pts", category: "Utilization" };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("credit-tip error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
