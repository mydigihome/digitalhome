import { useState, useEffect, useRef, useCallback } from "react";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";
import { X, Maximize2, Star, Search, Plus, ChevronDown, ChevronRight } from "lucide-react";

declare global {
  interface Window { TradingView: any; }
}

interface WatchlistItem {
  symbol: string;
  display: string;
  group: string;
  favorited: boolean;
}

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  // Crypto
  { symbol: "BINANCE:BTCUSDT", display: "BTC/USD", group: "CRYPTO", favorited: false },
  { symbol: "BINANCE:ETHUSDT", display: "ETH/USD", group: "CRYPTO", favorited: false },
  { symbol: "BINANCE:SOLUSDT", display: "SOL/USD", group: "CRYPTO", favorited: false },
  { symbol: "BINANCE:BNBUSDT", display: "BNB/USD", group: "CRYPTO", favorited: false },
  { symbol: "COINBASE:XRPUSD", display: "XRP/USD", group: "CRYPTO", favorited: false },
  // Stocks
  { symbol: "NASDAQ:AAPL", display: "Apple", group: "STOCKS", favorited: false },
  { symbol: "NASDAQ:NVDA", display: "NVIDIA", group: "STOCKS", favorited: false },
  { symbol: "NASDAQ:TSLA", display: "Tesla", group: "STOCKS", favorited: false },
  { symbol: "NASDAQ:MSFT", display: "Microsoft", group: "STOCKS", favorited: false },
  { symbol: "NASDAQ:AMZN", display: "Amazon", group: "STOCKS", favorited: false },
  { symbol: "NYSE:JPM", display: "JPMorgan", group: "STOCKS", favorited: false },
  // Indices
  { symbol: "FOREXCOM:SPXUSD", display: "S&P 500", group: "INDICES", favorited: false },
  { symbol: "NASDAQ:QQQ", display: "NASDAQ 100", group: "INDICES", favorited: false },
  { symbol: "DJ:DJI", display: "Dow Jones", group: "INDICES", favorited: false },
  // Forex
  { symbol: "FX:EURUSD", display: "EUR/USD", group: "FOREX", favorited: false },
  { symbol: "FX:GBPUSD", display: "GBP/USD", group: "FOREX", favorited: false },
  { symbol: "FX:USDJPY", display: "USD/JPY", group: "FOREX", favorited: false },
  // Commodities
  { symbol: "COMEX:GC1!", display: "Gold", group: "COMMODITIES", favorited: false },
  { symbol: "NYMEX:CL1!", display: "Crude Oil", group: "COMMODITIES", favorited: false },
  { symbol: "COMEX:SI1!", display: "Silver", group: "COMMODITIES", favorited: false },
  // Futures
  { symbol: "CME_MINI:ES1!", display: "S&P Futures", group: "FUTURES", favorited: false },
  { symbol: "CME_MINI:NQ1!", display: "NASDAQ Futures", group: "FUTURES", favorited: false },
];

const ticker = [
  { symbol: "BTC/USD", price: "64,231.50", change: "+2.4%", up: true },
  { symbol: "ETH/USD", price: "3,421.12", change: "+1.1%", up: true },
  { symbol: "TSLA", price: "174.50", change: "-0.8%", up: false },
  { symbol: "AAPL", price: "192.25", change: "+0.4%", up: true },
  { symbol: "NVDA", price: "882.30", change: "+4.2%", up: true },
  { symbol: "S&P 500", price: "5,284.34", change: "+0.3%", up: true },
];

const GROUPS = ["CRYPTO", "STOCKS", "INDICES", "FOREX", "COMMODITIES", "FUTURES"];

function TradingViewWidget({ symbol, containerId, height }: { symbol: string; containerId: string; height: string }) {
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const loadWidget = () => {
      if (!window.TradingView) return;
      try {
        widgetRef.current = new window.TradingView.widget({
          container_id: containerId,
          autosize: true,
          symbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#f3f3f8",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies", "Volume@tv-basicstudies"],
          drawings_access: { type: "all", tools: [{ name: "Regression Trend" }] },
          withdateranges: true,
          save_image: true,
          show_popup_button: false,
          details: true,
          hotlist: false,
          calendar: false,
        });
      } catch {}
    };

    if (window.TradingView) {
      loadWidget();
    } else {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = loadWidget;
      document.head.appendChild(script);
    }

    return () => {
      try {
        const el = document.getElementById(containerId);
        if (el && widgetRef.current?.remove) widgetRef.current.remove();
      } catch {}
      widgetRef.current = null;
    };
  }, [symbol, containerId]);

  return <div id={containerId} style={{ width: "100%", height }} className="rounded-[16px] overflow-hidden" />;
}

function WatchlistPanel({
  items, activeSymbol, search, onSearch, onSelect, onToggleFav,
  collapsedGroups, onToggleGroup, onAddSymbol
}: {
  items: WatchlistItem[]; activeSymbol: string; search: string;
  onSearch: (s: string) => void; onSelect: (s: string) => void;
  onToggleFav: (s: string) => void;
  collapsedGroups: Set<string>; onToggleGroup: (g: string) => void;
  onAddSymbol: (s: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newSym, setNewSym] = useState("");

  const filtered = search
    ? items.filter(i => i.display.toLowerCase().includes(search.toLowerCase()) || i.symbol.toLowerCase().includes(search.toLowerCase()))
    : items;

  const favorites = filtered.filter(i => i.favorited);
  const grouped = GROUPS.map(g => ({ group: g, items: filtered.filter(i => i.group === g && !i.favorited) }));

  return (
    <div className="w-[200px] shrink-0 hidden lg:flex flex-col border-r" style={{ borderColor: "#f3f3f8" }}>
      <div className="px-3 pt-2 pb-2">
        <p className="text-xs font-bold mb-2" style={{ color: "#1a1c1f" }}>Watchlist</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "#767586" }} />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs border-none focus:ring-1 focus:outline-none"
            style={{ background: "#f3f3f8", color: "#1a1c1f" }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-2">
        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="mb-2">
            <p className="text-[9px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: "#f59e0b" }}>★ FAVORITES</p>
            {favorites.map(item => (
              <WatchlistRow key={item.symbol} item={item} active={activeSymbol === item.symbol} onSelect={onSelect} onToggleFav={onToggleFav} />
            ))}
          </div>
        )}

        {/* Grouped */}
        {grouped.map(({ group, items: gItems }) => {
          if (gItems.length === 0) return null;
          const collapsed = collapsedGroups.has(group);
          return (
            <div key={group} className="mb-1">
              <button
                onClick={e => { e.stopPropagation(); onToggleGroup(group); }}
                className="flex items-center gap-1 w-full px-2 py-1 text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "#767586" }}
              >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {group}
              </button>
              {!collapsed && gItems.map(item => (
                <WatchlistRow key={item.symbol} item={item} active={activeSymbol === item.symbol} onSelect={onSelect} onToggleFav={onToggleFav} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Add symbol */}
      <div className="px-3 pb-2 pt-1" style={{ borderTop: "1px solid #f3f3f8" }}>
        {adding ? (
          <div className="flex gap-1">
            <input
              value={newSym}
              onChange={e => setNewSym(e.target.value)}
              placeholder="NASDAQ:AAPL"
              className="flex-1 rounded-lg px-2 py-1 text-[10px] border-none focus:ring-1 focus:outline-none"
              style={{ background: "#f3f3f8", color: "#1a1c1f" }}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key === "Enter" && newSym.trim()) {
                  onAddSymbol(newSym.trim().toUpperCase());
                  setNewSym("");
                  setAdding(false);
                }
              }}
              autoFocus
            />
            <button onClick={e => { e.stopPropagation(); setAdding(false); }} className="text-[10px] font-bold" style={{ color: "#767586" }}>✕</button>
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setAdding(true); }}
            className="flex items-center gap-1 text-xs font-bold"
            style={{ color: "#6366f1" }}
          >
            <Plus className="w-3 h-3" /> Add symbol
          </button>
        )}
      </div>
    </div>
  );
}

function WatchlistRow({ item, active, onSelect, onToggleFav }: {
  item: WatchlistItem; active: boolean;
  onSelect: (s: string) => void; onToggleFav: (s: string) => void;
}) {
  const shortName = item.symbol.split(":").pop() || item.symbol;
  return (
    <button
      onClick={e => { e.stopPropagation(); onSelect(item.symbol); }}
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${active ? "bg-[#6366f1]/8" : "hover:bg-[#f3f3f8]"}`}
    >
      <div className="min-w-0">
        <p className={`text-[11px] font-bold truncate ${active ? "text-[#6366f1]" : ""}`} style={active ? {} : { color: "#1a1c1f" }}>{shortName}</p>
        <p className="text-[9px] truncate" style={{ color: "#767586" }}>{item.display}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onToggleFav(item.symbol); }}
        className="shrink-0 p-0.5"
      >
        <Star className="w-3 h-3" style={{ color: item.favorited ? "#f59e0b" : "#e8e8ed" }} fill={item.favorited ? "#f59e0b" : "none"} />
      </button>
    </button>
  );
}

export function TradingViewFront() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST);
  const [activeSymbol, setActiveSymbol] = useState("BINANCE:BTCUSDT");
  const [search, setSearch] = useState("");
  const [showBrokerMenu, setShowBrokerMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleFav = useCallback((sym: string) => {
    setWatchlist(prev => prev.map(i => i.symbol === sym ? { ...i, favorited: !i.favorited } : i));
  }, []);

  const toggleGroup = useCallback((g: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  }, []);

  const addSymbol = useCallback((sym: string) => {
    if (watchlist.some(i => i.symbol === sym)) return;
    setWatchlist(prev => [...prev, { symbol: sym, display: sym.split(":").pop() || sym, group: "CUSTOM", favorited: false }]);
  }, [watchlist]);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [fullscreen]);

  const activeDisplay = watchlist.find(i => i.symbol === activeSymbol)?.display || activeSymbol;

  // Mobile tabs: favorites first, then all
  const mobileTabs = [
    ...watchlist.filter(i => i.favorited),
    ...watchlist.filter(i => !i.favorited).slice(0, 8),
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Market Terminal</h3>
          <span className="text-[9px] font-bold rounded-full px-2 py-0.5 text-white animate-pulse" style={{ background: "#006c49" }}>LIVE</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <button onClick={e => { e.stopPropagation(); setFullscreen(true); }} className="rounded-full p-2 hover:bg-[#e8e8ed] transition hidden md:flex" style={{ background: "#f3f3f8" }}>
            <Maximize2 className="w-4 h-4" style={{ color: "#767586" }} />
          </button>
          <button onClick={e => e.stopPropagation()} className="rounded-full px-4 py-1.5 text-xs font-bold border hidden md:inline-flex" style={{ borderColor: "#6366f1", color: "#6366f1" }}>Create Trading Plan</button>
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setShowBrokerMenu(!showBrokerMenu); }} className="rounded-full px-4 py-1.5 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}>Connect Broker ▼</button>
            {showBrokerMenu && (
              <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50" style={{ background: "#fff", boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
                {["Webull", "TopStep", "IBKR", "E*Trade"].map(b => (
                  <button key={b} onClick={e => { e.stopPropagation(); setShowBrokerMenu(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#f3f3f8]" style={{ color: "#1a1c1f" }}>{b}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticker tape */}
      <div className="rounded-[12px] py-1.5 overflow-hidden mb-3" style={{ background: "rgba(26,28,31,0.04)" }}>
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="text-[11px] font-bold inline-flex items-center gap-1.5" style={{ color: "#1a1c1f" }}>
              <span className="font-bold">{t.symbol}</span>
              <span>{t.price}</span>
              <span style={{ color: t.up ? "#006c49" : "#ba1a1a" }}>{t.change}</span>
              {i < ticker.length * 2 - 1 && <span style={{ color: "#767586" }}>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
        {mobileTabs.slice(0, 10).map(item => {
          const short = item.symbol.split(":").pop() || item.symbol;
          return (
            <button
              key={item.symbol}
              onClick={e => { e.stopPropagation(); setActiveSymbol(item.symbol); }}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors"
              style={activeSymbol === item.symbol ? { background: "#6366f1", color: "#fff" } : { background: "#f3f3f8", color: "#464554" }}
            >
              {item.favorited && "★ "}{short}
            </button>
          );
        })}
      </div>

      {/* Chart + Watchlist */}
      <div className="flex rounded-[16px] overflow-hidden" style={{ background: "#fafafa", height: 520 }}>
        <WatchlistPanel
          items={watchlist}
          activeSymbol={activeSymbol}
          search={search}
          onSearch={setSearch}
          onSelect={setActiveSymbol}
          onToggleFav={toggleFav}
          collapsedGroups={collapsedGroups}
          onToggleGroup={toggleGroup}
          onAddSymbol={addSymbol}
        />
        <div className="flex-1" style={{ height: 520 }}>
          <TradingViewWidget key={activeSymbol} symbol={activeSymbol} containerId="tv_chart_main" height="520px" />
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          #tv_chart_main { height: 340px !important; }
        }
      `}</style>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(26,28,31,0.85)", backdropFilter: "blur(4px)" }}
          onClick={e => { e.stopPropagation(); setFullscreen(false); }}
        >
          <div
            className="bg-white rounded-[24px] overflow-hidden flex flex-col m-4 md:m-8 w-full"
            style={{ height: "calc(100vh - 4rem)", maxHeight: "calc(100vh - 2rem)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #f3f3f8" }}>
              <div>
                <p className="font-bold text-base" style={{ color: "#1a1c1f" }}>{activeDisplay}</p>
                <p className="text-[10px]" style={{ color: "#767586" }}>{activeSymbol}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); setFullscreen(false); }} className="rounded-full p-2" style={{ background: "#f3f3f8" }}>
                <X className="w-4 h-4" style={{ color: "#767586" }} />
              </button>
            </div>
            <div className="flex-1">
              <TradingViewWidget key={`fs-${activeSymbol}`} symbol={activeSymbol} containerId="tv_chart_fullscreen" height="100%" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TradingViewBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Terminal</h3>
      <div><EditLabel>Default Symbol</EditLabel><EditInput value="BINANCE:BTCUSDT" onChange={() => {}} /></div>
      <div><EditLabel>Broker Name</EditLabel><EditInput value="Webull" onChange={() => {}} /></div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>Ticker Items</p>
      {ticker.slice(0, 4).map(t => (
        <div key={t.symbol} className="grid grid-cols-3 gap-2">
          <div><EditInput value={t.symbol} onChange={() => {}} /></div>
          <div><EditInput value={t.price} onChange={() => {}} /></div>
          <div><EditInput value={t.change} onChange={() => {}} /></div>
        </div>
      ))}
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
