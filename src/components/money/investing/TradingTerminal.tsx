import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Monitor, ExternalLink, Maximize2, TrendingUp, ChevronDown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const BROKERS = [
  { name: "Robinhood", url: "https://robinhood.com" },
  { name: "Webull", url: "https://webull.com" },
  { name: "TopStep", url: "https://topstep.com" },
  { name: "IBKR", url: "https://interactivebrokers.com" },
  { name: "E*Trade", url: "https://etrade.com" },
  { name: "Fidelity", url: "https://fidelity.com" },
  { name: "TD Ameritrade", url: "https://tdameritrade.com" },
  { name: "Charles Schwab", url: "https://schwab.com" },
];

function AdvancedChart({ theme, userId = "anonymous", widgetId = "investing-terminal" }: { theme: "dark" | "light"; userId?: string; widgetId?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const savedSymbol = localStorage.getItem(`dh_tv_symbol_${widgetId}`) || "NASDAQ:AAPL";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: savedSymbol,
      interval: "D",
      timezone: "America/New_York",
      theme,
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      hide_side_toolbar: false,
      details: true,
      hotlist: true,
      calendar: true,
      news: ["headlines"],
      withdateranges: true,
      studies: ["STD;MACD", "STD;RSI", "STD;Bollinger_Bands", "STD;Volume"],
      watchlist: [
        "NASDAQ:AAPL", "NASDAQ:TSLA", "NASDAQ:NVDA", "NASDAQ:MSFT",
        "BINANCE:BTCUSDT", "BINANCE:ETHUSDT",
        "FX:EURUSD", "FX:GBPUSD", "FX:USDJPY",
        "COMEX:GC1!", "NYMEX:CL1!", "SP:SPX",
      ],
      show_popup_button: true,
      popup_width: "1200",
      popup_height: "700",
      save_image: true,
      auto_save_delay: 2,
      charts_storage_url: "https://saveload.tradingview.com",
      charts_storage_api_version: "1.1",
      client_id: "digitalhome.app",
      user_id: userId,
      load_last_chart: true,
      enabled_features: [
        "study_templates",
        "save_chart_properties_to_local_storage",
        "use_localstorage_for_settings",
        "save_shortcut",
        "create_volume_indicator_by_default",
      ],
      disabled_features: ["header_saveload"],
    });
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [theme, userId, widgetId]);

  return (
    <div className="tradingview-widget-container w-full h-full">
      <div ref={ref} className="w-full h-full" />
    </div>
  );
}

interface Props {
  onOpenPlanModal: () => void;
}

export default function TradingTerminal({ onOpenPlanModal }: Props) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [connectedBroker, setConnectedBroker] = useState<string | null>(null);
  const [brokerUrl, setBrokerUrl] = useState<string | null>(null);
  const [brokerDropdownOpen, setBrokerDropdownOpen] = useState(false);
  const [terminalFullscreen, setTerminalFullscreen] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Load saved broker
  useEffect(() => {
    if (!user) return;
    (supabase as any).from("user_preferences").select("preferred_broker, broker_url")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => {
        if (data?.preferred_broker) { setConnectedBroker(data.preferred_broker); setBrokerUrl(data.broker_url); }
      });
  }, [user]);

  const saveBroker = async (name: string, url: string) => {
    setConnectedBroker(name);
    setBrokerUrl(url);
    setBrokerDropdownOpen(false);
    if (!user) return;
    const { data: existing } = await (supabase as any).from("user_preferences").select("id").eq("user_id", user.id).maybeSingle();
    if (existing) {
      await (supabase as any).from("user_preferences").update({ preferred_broker: name, broker_url: url }).eq("user_id", user.id);
    } else {
      await (supabase as any).from("user_preferences").insert({ user_id: user.id, preferred_broker: name, broker_url: url });
    }
    toast.success(`${name} connected!`);
  };

  const enterFullscreen = () => { setTerminalFullscreen(true); document.body.style.overflow = "hidden"; };
  const exitFullscreen = () => { setTerminalFullscreen(false); document.body.style.overflow = ""; };

  const theme = isDark ? "dark" as const : "light" as const;

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ marginTop: 24 }}>
        {/* Title bar */}
        <div className="border-b border-border" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Monitor size={18} color="#10B981" />
            <span className="text-foreground" style={{ fontWeight: 700, fontSize: 16 }}>Live Trading Terminal</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, background: "#D1FAE5", color: "#065F46", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
              LIVE
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => connectedBroker && brokerUrl ? window.open(brokerUrl, "_blank", "noopener,noreferrer") : setBrokerDropdownOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1.5px solid #10B981", borderRadius: 8, background: "transparent", color: "#10B981", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <ExternalLink size={13} />Open in {connectedBroker || "Broker"}
            </button>
            <button onClick={enterFullscreen} className="border-border hover:bg-muted" style={{ padding: "7px 10px", border: "1.5px solid hsl(var(--border))", borderRadius: 8, background: "transparent", cursor: "pointer" }}>
              <Maximize2 size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-muted/50 border-b border-border/50" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
          <button onClick={onOpenPlanModal} className="bg-card border border-border text-foreground hover:bg-muted" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <TrendingUp size={15} color="#10B981" />Create Trading Plan
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setBrokerDropdownOpen(!brokerDropdownOpen)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "#7B5EA7", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {connectedBroker ? <><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80" }} />{connectedBroker}</> : "Connect Broker ▾"}
              <ChevronDown size={14} />
            </button>
            {brokerDropdownOpen && (
              <div className="bg-card border border-border" style={{ position: "absolute", top: "110%", right: 0, borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", minWidth: 200, zIndex: 200, overflow: "hidden" }}>
                {BROKERS.map((b) => (
                  <button key={b.name} onClick={() => saveBroker(b.name, b.url)} className="hover:bg-muted" style={{ width: "100%", padding: "13px 20px", textAlign: "left", background: connectedBroker === b.name ? "hsl(var(--accent))" : "transparent", color: connectedBroker === b.name ? "#7B5EA7" : "hsl(var(--foreground))", fontWeight: connectedBroker === b.name ? 600 : 400, fontSize: 14, border: "none", borderBottom: "1px solid hsl(var(--border))", cursor: "pointer" }}>
                    {b.name}{connectedBroker === b.name && <span style={{ float: "right", color: "#10B981" }}>✓</span>}
                  </button>
                ))}
                <div style={{ padding: "12px 16px" }}>
                  <input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="Or paste custom URL..." onKeyDown={(e) => { if (e.key === "Enter" && customUrl) saveBroker("Custom", customUrl); }} className="bg-card text-foreground border-border" style={{ width: "100%", padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13, outline: "none" }} />
                  <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 4 }}>Press Enter to save</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div style={{ width: "100%", height: 600 }}>
          <AdvancedChart theme={theme} userId={user?.id || "anonymous"} widgetId="investing-terminal" />
        </div>
      </div>

      {/* Fullscreen portal */}
      {terminalFullscreen && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999, background: isDark ? "#111112" : "white", display: "flex", flexDirection: "column" }}>
          <div className="bg-muted/50 border-b border-border" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Monitor size={16} color="#10B981" />
              <span className="text-foreground" style={{ fontWeight: 700, fontSize: 15 }}>Live Trading Terminal</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onOpenPlanModal} className="bg-card border border-border text-foreground hover:bg-muted" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <TrendingUp size={14} color="#10B981" />Trading Plan
              </button>
              <button onClick={exitFullscreen} className="bg-card border border-border hover:bg-muted" style={{ padding: "7px 10px", borderRadius: 8, cursor: "pointer" }}>
                <X size={16} className="text-foreground" />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <AdvancedChart theme={theme} userId={user?.id || "anonymous"} widgetId="investing-terminal-fs" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
