const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TWELVE_DATA_BASE = "https://api.twelvedata.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TWELVE_DATA_API_KEY");
    const { action, symbol, interval, outputsize } = await req.json();

    if (!symbol) {
      return new Response(JSON.stringify({ error: "Symbol required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let url = "";
    const params = new URLSearchParams();
    params.set("symbol", symbol);

    if (!apiKey) {
      // Return mock data when no API key is configured
      const mockPrice = 150 + Math.random() * 50;
      const mockData = {
        quote: {
          symbol,
          name: symbol,
          price: mockPrice.toFixed(2),
          change: (Math.random() * 10 - 5).toFixed(2),
          percent_change: (Math.random() * 6 - 3).toFixed(2),
          volume: Math.floor(Math.random() * 10000000).toString(),
          previous_close: (mockPrice - Math.random() * 5).toFixed(2),
          open: (mockPrice - Math.random() * 3).toFixed(2),
          high: (mockPrice + Math.random() * 5).toFixed(2),
          low: (mockPrice - Math.random() * 5).toFixed(2),
        },
        timeseries: generateMockTimeseries(symbol, interval || "1day", parseInt(outputsize || "30")),
        mock: true,
      };

      return new Response(JSON.stringify(mockData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    params.set("apikey", apiKey);

    if (action === "quote" || !action) {
      // Get real-time quote
      url = `${TWELVE_DATA_BASE}/quote?${params.toString()}`;
      const resp = await fetch(url);
      const quote = await resp.json();

      // Also get time series
      const tsParams = new URLSearchParams(params);
      tsParams.set("interval", interval || "1day");
      tsParams.set("outputsize", outputsize || "30");
      const tsUrl = `${TWELVE_DATA_BASE}/time_series?${tsParams.toString()}`;
      const tsResp = await fetch(tsUrl);
      const ts = await tsResp.json();

      return new Response(
        JSON.stringify({ quote, timeseries: ts.values || [], mock: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "search") {
      url = `${TWELVE_DATA_BASE}/symbol_search?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
      const resp = await fetch(url);
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "timeseries") {
      params.set("interval", interval || "1day");
      params.set("outputsize", outputsize || "30");
      url = `${TWELVE_DATA_BASE}/time_series?${params.toString()}`;
      const resp = await fetch(url);
      const data = await resp.json();
      return new Response(JSON.stringify({ timeseries: data.values || [], mock: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateMockTimeseries(symbol: string, interval: string, count: number) {
  const values = [];
  let basePrice = 150 + (symbol.charCodeAt(0) % 50);
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (interval.includes("min") || interval === "1h") {
      d.setMinutes(d.getMinutes() - i * (interval === "1h" ? 60 : parseInt(interval)));
    } else if (interval === "1week") {
      d.setDate(d.getDate() - i * 7);
    } else if (interval === "1month") {
      d.setMonth(d.getMonth() - i);
    } else {
      d.setDate(d.getDate() - i);
    }

    const change = (Math.random() - 0.48) * 3;
    basePrice = Math.max(10, basePrice + change);
    const high = basePrice + Math.random() * 2;
    const low = basePrice - Math.random() * 2;
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    values.push({
      datetime: d.toISOString().split("T")[0] + (interval.includes("min") || interval === "1h" ? " " + d.toTimeString().slice(0, 5) : ""),
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: Math.floor(Math.random() * 5000000).toString(),
    });
  }
  return values;
}
