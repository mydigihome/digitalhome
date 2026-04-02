import { useEffect, useRef, useState } from "react";

export default function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
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

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "NASDAQ:AAPL",
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
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [isDark]);

  return (
    <div
      className="tradingview-widget-container w-full h-full"
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
