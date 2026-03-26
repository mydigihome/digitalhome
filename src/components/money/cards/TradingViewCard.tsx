import { useState } from "react";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";

const symbols = [
  { label: "BTC/USD", tv: "BTCUSD" },
  { label: "AAPL", tv: "AAPL" },
  { label: "SPY", tv: "SPY" },
  { label: "ETH/USD", tv: "ETHUSD" },
  { label: "EUR/USD", tv: "EURUSD" },
];

const ticker = [
  { symbol: "BTC/USD", price: "64,231.50", change: "+2.4%", up: true },
  { symbol: "ETH/USD", price: "3,421.12", change: "+1.1%", up: true },
  { symbol: "TSLA", price: "174.50", change: "-0.8%", up: false },
  { symbol: "AAPL", price: "192.25", change: "+0.4%", up: true },
  { symbol: "NVDA", price: "882.30", change: "+4.2%", up: true },
  { symbol: "S&P 500", price: "5,284.34", change: "+0.3%", up: true },
];

export function TradingViewFront() {
  const [active, setActive] = useState(0);
  const [showBrokerMenu, setShowBrokerMenu] = useState(false);
  const src = `https://s.tradingview.com/widgetembed/?frameElementId=tv_widget&symbol=${symbols[active].tv}&interval=D&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=1&toolbarbg=f9f9fe&studies=[]&theme=light&style=1&timezone=exchange&locale=en&allow_symbol_change=1&calendar=0&hotlist=0&news=0`;

  return (
    <div style={{ minHeight: 450 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Market Terminal</h3>
          <span className="text-[9px] font-bold rounded-full px-2 py-0.5 text-white animate-pulse" style={{ background: "#006c49" }}>LIVE</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <button onClick={(e) => e.stopPropagation()} className="rounded-full px-5 py-2 text-sm font-bold border" style={{ borderColor: "#4648d4", color: "#4648d4" }}>Create Trading Plan</button>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowBrokerMenu(!showBrokerMenu); }} className="rounded-full px-5 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}>Connect Broker ▼</button>
            {showBrokerMenu && (
              <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50" style={{ background: "#fff", boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
                {["Webull", "TopStep", "IBKR", "E*Trade"].map((b) => (
                  <button key={b} onClick={(e) => { e.stopPropagation(); setShowBrokerMenu(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-[#f3f3f8]" style={{ color: "#1a1c1f" }}>{b}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticker tape */}
      <div className="rounded-[16px] py-2 overflow-hidden" style={{ background: "rgba(26,28,31,0.04)" }}>
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

      {/* Symbol tabs */}
      <div className="flex gap-3 mt-4 flex-wrap">
        {symbols.map((s, i) => (
          <button
            key={s.label}
            onClick={(e) => { e.stopPropagation(); setActive(i); }}
            className="rounded-full px-4 py-1.5 text-sm font-bold transition-colors"
            style={i === active ? { background: "#4648d4", color: "#fff" } : { background: "#f3f3f8", color: "#464554" }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-[20px] overflow-hidden mt-4" style={{ height: 420 }}>
        <iframe
          key={symbols[active].tv}
          src={src}
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          style={{ border: "none" }}
        />
      </div>
    </div>
  );
}

export function TradingViewBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Terminal</h3>
      <div><EditLabel>Default Symbol</EditLabel><EditInput value="BTC/USD" onChange={() => {}} /></div>
      <div><EditLabel>Broker Name</EditLabel><EditInput value="Webull" onChange={() => {}} /></div>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>Ticker Items</p>
      {ticker.slice(0, 4).map((t) => (
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
