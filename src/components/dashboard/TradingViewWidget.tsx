import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface TradingViewWidgetProps {
  height?: string;
  widgetId?: string;
}

export default function TradingViewWidget({ height = "500px", widgetId = "dashboard-market-watch" }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  // Watch for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const savedSymbol = localStorage.getItem(`dh_tv_symbol_${widgetId}`) || "NASDAQ:AAPL";
    const userId = user?.id || "anonymous";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: savedSymbol,
      interval: "D",
      timezone: "America/New_York",
      theme: isDark ? "dark" : "light",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      withdateranges: true,
      hide_side_toolbar: false,
      details: true,
      hotlist: true,
      studies: ["STD;MACD", "STD;RSI"],
      watchlist: [
        "NASDAQ:AAPL",
        "NASDAQ:TSLA",
        "NASDAQ:NVDA",
        "NYSE:SPY",
        "BINANCE:BTCUSDT",
        "FX:EURUSD",
        "FX:GBPUSD",
        "COMEX:GC1!",
      ],
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
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

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [isDark, user?.id, widgetId]);

  return (
    <div
      className="tradingview-widget-container w-full"
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
