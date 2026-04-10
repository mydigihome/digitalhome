import { useState, useEffect, useMemo } from "react";
import { Plus, MoreHorizontal, X, ExternalLink, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import TradingTerminal from "./investing/TradingTerminal";
import TradingPlanModal from "./investing/TradingPlanModal";
import PastTradingPlans from "./investing/PastTradingPlans";
import MarketIntelCard from "./MarketIntelCard";

/* ──────────────────────── types ──────────────────────── */
interface WatchlistStock {
  id: string;
  symbol: string;
  exchange: string | null;
  display_name: string | null;
}

const DEFAULT_STOCKS = [
  { symbol: "AAPL", exchange: "NASDAQ", name: "Apple Inc.", price: 189.84, change: 2.31, pct: 1.23 },
  { symbol: "TSLA", exchange: "NASDAQ", name: "Tesla Inc.", price: 248.42, change: -4.10, pct: -1.62 },
  { symbol: "NVDA", exchange: "NASDAQ", name: "NVIDIA Corp.", price: 131.60, change: 3.87, pct: 3.03 },
  { symbol: "MSFT", exchange: "NASDAQ", name: "Microsoft", price: 430.16, change: 1.05, pct: 0.24 },
];

const POPULAR_SYMBOLS = [
  "AAPL","TSLA","NVDA","MSFT","GOOGL","AMZN","META","NFLX","AMD","COIN",
  "BTC","ETH","EURUSD","GBPUSD","GOLD","OIL",
];

const ORDER_TYPES = ["Delivery", "Intraday", "MTF"] as const;

const portfolioData = [
  { month: "Jan", actual: 38000, projected: 42000 },
  { month: "Feb", actual: 51000, projected: 48000 },
  { month: "Mar", actual: 30000, projected: 45000 },
  { month: "Apr", actual: 49000, projected: 50000 },
  { month: "May", actual: 40000, projected: 46000 },
];

const LOGO_COLORS: Record<string, string> = {
  A: "#3B82F6", B: "#10B981", C: "#F59E0B", D: "#EF4444",
  E: "#8B5CF6", F: "#EC4899", G: "#14B8A6", H: "#F97316",
  I: "#6366F1", J: "#84CC16", K: "#06B6D4", L: "#E11D48",
  M: "#7C3AED", N: "#0EA5E9", O: "#D946EF", P: "#22C55E",
};

function getLogoColor(symbol: string) {
  return LOGO_COLORS[symbol[0]?.toUpperCase()] || "#3B82F6";
}

/* ──────────────────────── component ──────────────────────── */
export default function InvestingTab() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [selectedStock, setSelectedStock] = useState(DEFAULT_STOCKS[0]);
  const [buySellMode, setBuySellMode] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<string>("Delivery");
  const [quantity, setQuantity] = useState("1");
  const [exchange, setExchange] = useState("NSE");
  const [priceType, setPriceType] = useState("Market");
  const [depositMode, setDepositMode] = useState<"deposit" | "withdraw">("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  // Fetch watchlist
  useEffect(() => {
    if (!user) return;
    supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setWatchlist(data as WatchlistStock[]);
      });
  }, [user]);

  const displayStocks = useMemo(() => {
    if (watchlist.length > 0) {
      return watchlist.map((w) => {
        const def = DEFAULT_STOCKS.find((d) => d.symbol === w.symbol);
        return {
          symbol: w.symbol,
          exchange: w.exchange || "NASDAQ",
          name: w.display_name || w.symbol,
          price: def?.price || (100 + Math.random() * 200),
          change: def?.change || +(Math.random() * 6 - 3).toFixed(2),
          pct: def?.pct || +(Math.random() * 4 - 2).toFixed(2),
          id: w.id,
        };
      });
    }
    return DEFAULT_STOCKS.map((d, i) => ({ ...d, id: `default-${i}` }));
  }, [watchlist]);

  const addToWatchlist = async (symbol: string) => {
    if (!user) return;
    if (watchlist.length >= 10) {
      toast.error("Max 10 stocks in watchlist");
      return;
    }
    if (watchlist.some((w) => w.symbol === symbol)) {
      toast.error("Already in watchlist");
      return;
    }
    const { data, error } = await supabase
      .from("watchlist")
      .insert({ user_id: user.id, symbol, exchange: "NASDAQ", display_name: symbol })
      .select()
      .single();
    if (error) { toast.error("Failed to add"); return; }
    setWatchlist((prev) => [...prev, data as WatchlistStock]);
    setAddModalOpen(false);
    setSearchTerm("");
    toast.success(`${symbol} added to watchlist`);
  };

  const removeFromWatchlist = async (id: string) => {
    if (!user) return;
    await supabase.from("watchlist").delete().eq("id", id).eq("user_id", user.id);
    setWatchlist((prev) => prev.filter((w) => w.id !== id));
    toast.success("Removed from watchlist");
  };

  const estTotal = +(parseFloat(quantity || "0") * (selectedStock?.price || 0)).toFixed(2);

  const handleOrder = async () => {
    if (!user || !selectedStock) return;
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { toast.error("Enter a valid quantity"); return; }
    setConfirmOpen(true);
  };

  const confirmOrder = async () => {
    if (!user || !selectedStock) return;
    const qty = parseFloat(quantity);
    await supabase.from("orders").insert({
      user_id: user.id,
      symbol: selectedStock.symbol,
      order_type: buySellMode,
      quantity: qty,
      price_type: priceType.toLowerCase(),
      estimated_total: estTotal,
      status: "pending",
    });
    setConfirmOpen(false);
    setQuantity("1");
    toast.success(`${buySellMode === "buy" ? "Buy" : "Sell"} order for ${qty} ${selectedStock.symbol} placed`);
  };

  const filteredSymbols = POPULAR_SYMBOLS.filter(
    (s) => s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentMonth = new Date().toLocaleString("default", { month: "short" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top 3-col grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.2fr",
          gap: 20,
          alignItems: "start",
        }}
        className="investing-grid"
      >
        {/* LEFT: Stocks Watchlist */}
        <div className="rounded-2xl border border-border bg-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }} className="text-foreground">Stocks</span>
            <span
              className="bg-muted text-foreground"
              style={{ borderRadius: 6, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}
            >
              {String(displayStocks.length).padStart(2, "0")}
            </span>
          </div>

          {displayStocks.map((stock, i) => (
            <div
              key={stock.id || i}
              onClick={() =>
                setSelectedStock({
                  symbol: stock.symbol,
                  exchange: stock.exchange,
                  name: stock.name,
                  price: stock.price,
                  change: stock.change,
                  pct: stock.pct,
                })
              }
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: i < displayStocks.length - 1 ? "1px solid hsl(var(--border))" : "none",
                cursor: "pointer",
              }}
              className="group"
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }} className="text-foreground">
                  {stock.symbol}
                </div>
                <div style={{ fontSize: 12 }} className="text-muted-foreground">
                  {stock.exchange}
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }} className="text-foreground">
                    ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: stock.change > 0 ? "#10B981" : "#DC2626",
                    }}
                  >
                    {stock.change > 0 ? "+" : ""}
                    {stock.change} ({stock.pct}%)
                  </div>
                </div>
                {/* Remove btn for custom watchlist items */}
                {"id" in stock && !String(stock.id).startsWith("default") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(stock.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => setAddModalOpen(true)}
            style={{
              width: "100%",
              padding: 10,
              border: "1px dashed hsl(var(--border))",
              borderRadius: 8,
              background: "transparent",
              cursor: "pointer",
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 13,
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Stock
          </button>
        </div>

        {/* CENTER: Buy/Sell Panel */}
        <div className="rounded-2xl border border-border bg-card" style={{ padding: 24 }}>
          {/* Stock header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: getLogoColor(selectedStock.symbol),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {selectedStock.symbol[0]}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }} className="text-foreground">
                {selectedStock.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }} className="text-foreground">
                  ${selectedStock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: 13, color: selectedStock.change > 0 ? "#10B981" : "#DC2626" }}>
                  {selectedStock.change > 0 ? "+" : ""}
                  {selectedStock.change} ({selectedStock.pct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Buy/Sell toggle */}
          <div
            className="bg-muted"
            style={{ display: "flex", borderRadius: 10, padding: 4, marginTop: 16 }}
          >
            {(["buy", "sell"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setBuySellMode(m)}
                className={buySellMode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 8,
                  border: "none",
                  fontWeight: buySellMode === m ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 150ms",
                  textTransform: "capitalize",
                  fontSize: 14,
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Order type pills */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {ORDER_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1.5px solid",
                  borderColor: orderType === t ? "hsl(var(--foreground))" : "hsl(var(--border))",
                  background: orderType === t ? "hsl(var(--foreground))" : "transparent",
                  color: orderType === t ? "hsl(var(--background))" : "hsl(var(--foreground))",
                  fontSize: 13,
                  fontWeight: orderType === t ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 6,
              }}
              className="text-muted-foreground"
            >
              <span>Qty</span>
              <button
                onClick={() => setExchange(exchange === "NSE" ? "NYSE" : exchange === "NYSE" ? "BSE" : "NSE")}
                className="text-muted-foreground hover:text-foreground"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
              >
                {exchange} ▾
              </button>
            </div>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-card text-foreground border-border focus:ring-1 focus:ring-primary"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid hsl(var(--border))",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 500,
                outline: "none",
              }}
            />
          </div>

          {/* Price */}
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 6,
              }}
              className="text-muted-foreground"
            >
              <span>Price</span>
              <button
                onClick={() =>
                  setPriceType(priceType === "Market" ? "Limit" : priceType === "Limit" ? "Stop Loss" : "Market")
                }
                className="text-muted-foreground hover:text-foreground"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
              >
                {priceType} ▾
              </button>
            </div>
            <input
              value="At market"
              readOnly
              className="bg-muted text-foreground border-border"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1.5px solid hsl(var(--border))",
                borderRadius: 10,
                fontSize: 14,
              }}
            />
            <p style={{ fontSize: 11, marginTop: 6 }} className="text-muted-foreground">
              Order will be executed at best price in market
            </p>
          </div>

          {/* Order summary */}
          <div
            className="bg-muted"
            style={{ borderRadius: 8, padding: "10px 14px", marginTop: 12 }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }} className="text-foreground">
              Est. Total: ${estTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Action button */}
          <button
            onClick={handleOrder}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "none",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 12,
              background: buySellMode === "sell" ? "#DC2626" : "hsl(var(--foreground))",
              color: buySellMode === "sell" ? "white" : "hsl(var(--background))",
              transition: "opacity 150ms",
            }}
          >
            {buySellMode === "buy" ? "Buy" : "Sell"}
          </button>

          <p style={{ fontSize: 11, textAlign: "center", marginTop: 8 }} className="text-muted-foreground">
            Orders cannot be directly executed here. Connect your broker to place live trades.
          </p>
        </div>

        {/* RIGHT: Active Investments + Portfolio */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Active SIPs */}
          <div
            style={{
              background: "#1B2E1B",
              borderRadius: 16,
              padding: 24,
              color: "white",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Active SIPs</div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: "#4ADE80", lineHeight: 1 }}>86%</span>
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginTop: 12 }}>2/4</span>
              </div>
              <div style={{ display: "flex" }}>
                {["#7B5EA7", "#10B981", "#F59E0B", "#EF4444"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: c,
                      border: "2px solid #1B2E1B",
                      marginLeft: i > 0 ? -8 : 0,
                    }}
                  />
                ))}
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                background: "rgba(255,255,255,0.15)",
                marginTop: 16,
                overflow: "hidden",
              }}
            >
              <div style={{ width: "86%", height: "100%", borderRadius: 999, background: "#4ADE80" }} />
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
              Active investment performance
            </p>
          </div>

          {/* Portfolio Chart */}
          <div className="rounded-2xl border border-border bg-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 700 }} className="text-foreground">
                Your Investments
              </span>
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#10B981", marginTop: 8 }}>
              +$42,728
            </div>
            <p style={{ fontSize: 13, marginTop: 4, marginBottom: 16 }} className="text-muted-foreground">
              Your estimated return this month is approximately $52,557
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={portfolioData} barGap={2}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={({ x, y, payload }) => (
                    <text
                      x={x}
                      y={y + 14}
                      textAnchor="middle"
                      style={{
                        fontSize: 11,
                        fill: payload.value === currentMonth ? "hsl(var(--foreground))" : "#9CA3AF",
                        fontWeight: payload.value === currentMonth ? 700 : 400,
                      }}
                    >
                      {payload.value}
                    </text>
                  )}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(val: number) => [`$${val.toLocaleString()}` ]}
                />
                <Bar dataKey="actual" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="projected" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <MarketIntelCard />

      {/* Deposit / Withdraw */}
      <div className="rounded-2xl border border-border bg-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div
            className="bg-muted"
            style={{ display: "flex", borderRadius: 10, padding: 4, width: "fit-content" }}
          >
            {(["deposit", "withdraw"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setDepositMode(m)}
                className={depositMode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: depositMode === m ? 600 : 400,
                  cursor: "pointer",
                  fontSize: 14,
                  textTransform: "capitalize",
                  transition: "all 150ms",
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12 }} className="text-muted-foreground">
            Connect a broker to deposit funds
          </span>
        </div>

        <label style={{ fontSize: 13 }} className="text-muted-foreground">
          Enter amount
        </label>
        <div
          className="border-border"
          style={{
            display: "flex",
            alignItems: "center",
            border: "1.5px solid hsl(var(--border))",
            borderRadius: 10,
            padding: "12px 14px",
            marginTop: 8,
          }}
        >
          <span style={{ marginRight: 8, fontSize: 16 }} className="text-muted-foreground">
            $
          </span>
          <input
            type="number"
            placeholder="0.00"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="text-foreground placeholder:text-muted-foreground"
            style={{
              border: "none",
              outline: "none",
              fontSize: 18,
              fontWeight: 600,
              flex: 1,
              background: "transparent",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[100, 500, 1000].map((amt) => (
            <button
              key={amt}
              onClick={() => setDepositAmount(String(+(parseFloat(depositAmount || "0") + amt)))}
              style={{
                padding: "6px 16px",
                border: "1.5px solid hsl(var(--border))",
                borderRadius: 999,
                background: "transparent",
                fontSize: 13,
                cursor: "pointer",
              }}
              className="text-foreground hover:bg-muted transition-colors"
            >
              +${amt}
            </button>
          ))}
        </div>

        <button
          onClick={() => toast.info("Connect a broker to proceed")}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 12,
            border: "none",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 16,
            background: "hsl(var(--foreground))",
            color: "hsl(var(--background))",
          }}
        >
          {depositMode === "deposit" ? "Deposit money" : "Withdraw funds"}
        </button>
      </div>

      {/* ── Add Stock Modal ── */}
      {addModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="bg-card border border-border"
            style={{
              width: 380,
              borderRadius: 16,
              padding: 24,
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }} className="text-foreground">
                Add to Watchlist
              </span>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className="border-border"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1.5px solid hsl(var(--border))",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 12,
              }}
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ticker symbol..."
                className="text-foreground placeholder:text-muted-foreground"
                style={{ border: "none", outline: "none", flex: 1, fontSize: 14, background: "transparent" }}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {filteredSymbols.map((s) => (
                <button
                  key={s}
                  onClick={() => addToWatchlist(s)}
                  className="text-foreground hover:bg-muted"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: 500,
                    transition: "background 150ms",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Order Modal ── */}
      {confirmOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-card border border-border"
            style={{ width: 400, borderRadius: 16, padding: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }} className="text-foreground">
              Confirm {buySellMode === "buy" ? "Buy" : "Sell"}
            </h3>
            <p style={{ fontSize: 14, marginBottom: 20 }} className="text-muted-foreground">
              {quantity} shares of {selectedStock.symbol} at market price
            </p>
            <div
              className="bg-muted"
              style={{ borderRadius: 10, padding: 16, marginBottom: 20 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span className="text-muted-foreground">Symbol</span>
                <span className="text-foreground" style={{ fontWeight: 600 }}>{selectedStock.symbol}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span className="text-muted-foreground">Quantity</span>
                <span className="text-foreground" style={{ fontWeight: 600 }}>{quantity}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span className="text-muted-foreground">Est. Cost</span>
                <span className="text-foreground" style={{ fontWeight: 700 }}>
                  ${estTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setConfirmOpen(false)}
                className="border-border text-foreground hover:bg-muted"
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  border: "1.5px solid hsl(var(--border))",
                  background: "transparent",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmOrder}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  background: buySellMode === "sell" ? "#DC2626" : "hsl(var(--foreground))",
                  color: buySellMode === "sell" ? "white" : "hsl(var(--background))",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Trading Terminal */}
      <TradingTerminal onOpenPlanModal={() => setPlanModalOpen(true)} />


      {/* Past Trading Plans */}
      <PastTradingPlans />

      {/* Trading Plan Modal */}
      <TradingPlanModal open={planModalOpen} onClose={() => setPlanModalOpen(false)} />

      <style>{`
        @media (max-width: 1024px) {
          .investing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
