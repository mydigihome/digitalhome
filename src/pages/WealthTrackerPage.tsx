import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, PiggyBank, Pencil } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useUserFinances, useUpdateFinances } from "@/hooks/useUserFinances";
import { useExpenses } from "@/hooks/useExpenses";
import { useLoans } from "@/hooks/useLoans";
import { useAuth } from "@/hooks/useAuth";
import { useMarketQuote } from "@/hooks/useMarketData";
import { useTradingPairs, TradingPair } from "@/hooks/useTradingPairs";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import WealthOnboarding from "@/components/wealth/WealthOnboarding";
import AddPairModal from "@/components/wealth/AddPairModal";
import CreatePlanModal from "@/components/wealth/CreatePlanModal";
import ActiveTradingPlans from "@/components/wealth/ActiveTradingPlans";
import HeaderCustomizationModal from "@/components/wealth/HeaderCustomizationModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/* ─── helpers ─── */
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.3)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 24,
};

const FAITH_MESSAGES = [
  "Wealth is options", "Provision for purpose", "Build with intention",
  "Steward well, grow bold", "Your work has value", "Abundance follows discipline",
  "Invest in what matters", "Generosity multiplies",
];

function FaithMessage() {
  const today = new Date().getDate();
  const msg = FAITH_MESSAGES[today % FAITH_MESSAGES.length];
  return (
    <div className="px-6 py-3 rounded-2xl text-center" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)" }}>
      <p className="text-xs italic" style={{ color: "#6B7280" }}>"{msg}"</p>
    </div>
  );
}

const fmt = (n: number) =>
  n >= 1000
    ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`
    : `$${n.toFixed(2)}`;

export default function WealthTrackerPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: finances, isLoading } = useUserFinances();
  const { data: expenses } = useExpenses();
  const { data: loans } = useLoans();
  const [justCompleted, setJustCompleted] = useState(false);
  const [addBillOpen, setAddBillOpen] = useState(false);
  const [showAddPair, setShowAddPair] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [selectedPairForPlan, setSelectedPairForPlan] = useState<TradingPair | null>(null);

  // Market data
  const { data: btcQuote } = useMarketQuote("BTC/USD");

  // Custom trading pairs
  const { data: tradingPairs } = useTradingPairs();
  const userPairs = tradingPairs || [];

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (!finances?.onboarding_completed && !justCompleted) {
    return (
      <AppShell>
        <WealthOnboarding onComplete={() => setJustCompleted(true)} />
      </AppShell>
    );
  }

  /* ─── derived data ─── */
  const monthlyIncome = finances?.monthly_income || 0;
  const totalExpenses =
    expenses?.reduce((s, e) => s + Number(e.amount || 0), 0) || 0;
  const netIncome = monthlyIncome - totalExpenses;
  const totalDebt = finances?.total_debt || 0;

  const creditScore = finances?.credit_score || 0;
  const creditLabel =
    creditScore >= 750
      ? "Excellent"
      : creditScore >= 700
      ? "Good"
      : creditScore >= 650
      ? "Fair"
      : "Poor";
  const creditColor =
    creditScore >= 750
      ? "#10B981"
      : creditScore >= 700
      ? "#3B82F6"
      : creditScore >= 650
      ? "#F59E0B"
      : "#EF4444";

  const savingsGoal = finances?.savings_goal || 1;
  const currentSavings = finances?.current_savings || 0;
  const savingsPct = Math.min(
    100,
    Math.round((currentSavings / savingsGoal) * 100)
  );

  // Credit score arc
  const arcR = 70;
  const arcCirc = Math.PI * arcR; // semi-circle
  const arcPct = Math.min(creditScore / 850, 1);
  const arcDash = arcCirc * arcPct;
  const arcGap = arcCirc - arcDash;

  // Bills from expenses with frequency !== 'one-time'
  const recurringBills =
    expenses?.filter((e) => e.frequency !== "one-time") || [];

  // Subscriptions
  const subscriptions = recurringBills.filter(
    (e) => e.category === "Subscriptions" || e.category === "Entertainment"
  );

  const watchlist = [
    { symbol: "EUR/USD", badge: "FX", color: "bg-blue-100 text-blue-700" },
    { symbol: "ETH/USD", badge: "ETH", color: "bg-amber-100 text-amber-700" },
    { symbol: "AAPL", badge: "AAPL", color: "bg-purple-100 text-purple-700" },
  ];

  const btcPrice = btcQuote?.quote?.price ? parseFloat(btcQuote.quote.price) : 64284.5;
  const btcChange = btcQuote?.quote?.percent_change ? parseFloat(btcQuote.quote.percent_change) : 2.4;

  return (
    <AppShell>
      <div className="min-h-screen" style={{ background: "#F8F9FC" }}>

        {/* ═══ DESKTOP LAYOUT (12-col grid) ═══ */}
        <div className="hidden md:block px-6 pt-6 pb-32 max-w-6xl mx-auto">
          {/* Faith Message */}
          <FaithMessage />

          <div className="grid grid-cols-12 gap-6 mt-5">
            {/* LEFT 8 cols: Credit Score + Market + Savings */}
            <div className="col-span-8 space-y-6">

              {/* Credit Score */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={glass}
                className="p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Credit Score
                  </span>
                  <button
                    onClick={() => navigate("/finance/wealth")}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    style={{ color: "#6366F1", background: "#EEF2FF" }}
                  >
                    Full Report
                  </button>
                </div>

                <div className="flex items-center gap-8">
                  <div className="relative w-44 h-24 flex-shrink-0">
                    <svg viewBox="0 0 160 90" className="w-full h-full">
                      <defs>
                        <linearGradient id="csGradD" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#EF4444" />
                          <stop offset="33%" stopColor="#F59E0B" />
                          <stop offset="66%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                      <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
                      <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="url(#csGradD)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${arcDash} ${arcGap}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                      <span className="text-3xl font-bold text-slate-900">{creditScore || "—"}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `${creditColor}20`, color: creditColor }}
                    >
                      {creditLabel}
                    </span>
                    {/* Rainbow bar */}
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg, #EF4444, #F59E0B, #3B82F6, #10B981)" }}>
                      <div className="h-full" style={{ width: `${arcPct * 100}%`, background: "transparent", borderRight: "3px solid white" }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-slate-400">300</span>
                      <span className="text-[10px] text-slate-400">850</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Market Intelligence */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={glass}
                className="p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Market Intelligence</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddPair(true)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                      style={{ background: "#6366F1", color: "#fff" }}
                    >
                      + Add Pair
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-emerald-600 font-semibold">Live</span>
                    </div>
                  </div>
                </div>

                {/* BTC highlight */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500">BTC/USD</span>
                      <p className={`text-xs font-semibold ${btcChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(1)}%
                      </p>
                      <p className="text-xl font-bold text-slate-900 mt-1">${btcPrice.toLocaleString()}</p>
                    </div>
                    <svg width="100" height="40" viewBox="0 0 100 40" className="text-emerald-400">
                      <polyline points="0,35 15,28 30,32 45,20 55,24 70,15 85,18 100,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Asset Table - Custom pairs + defaults */}
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase">Asset</th>
                        <th className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPairs.length > 0 ? userPairs.map((pair) => (
                        <tr key={pair.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-700">{pair.category}</span>
                              <span className="font-medium text-slate-900">{pair.symbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">—</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 transition">Trade</button>
                              <button
                                onClick={() => { setSelectedPairForPlan(pair); setShowCreatePlan(true); }}
                                className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition"
                              >
                                Plan
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : watchlist.map((w) => (
                        <tr key={w.symbol} className="border-t border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${w.color}`}>{w.badge}</span>
                              <span className="font-medium text-slate-900">{w.symbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">—</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 transition">Trade</button>
                              <button className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition">Plan</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Active Trading Plans */}
              <ActiveTradingPlans />

              {/* Savings Goal */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={glass}
                className="p-5"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-slate-900">Savings Goal</h3>
                  <span className="text-xs text-slate-500 font-medium">{savingsPct}% of Goal reached</span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-slate-900">{fmt(currentSavings)}</span>
                    <span className="text-xs text-slate-400 ml-2">/ {fmt(savingsGoal)}</span>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>Monthly: <span className="font-semibold text-slate-700">${Math.round(monthlyIncome * 0.2).toLocaleString()}</span></p>
                    <p>{savingsGoal > currentSavings ? `${Math.ceil((savingsGoal - currentSavings) / Math.max(1, monthlyIncome * 0.2))} Months left` : "Goal reached!"}</p>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${savingsPct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </motion.div>
            </div>

            {/* RIGHT 4 cols: Stats grid + Upcoming */}
            <div className="col-span-4 space-y-6">

              {/* 2x2 Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { label: "Income", value: monthlyIncome, icon: <DollarSign className="w-4 h-4" />, iconBg: "bg-emerald-100 text-emerald-600" },
                  { label: "Expenses", value: totalExpenses, icon: <CreditCard className="w-4 h-4" />, iconBg: "bg-red-100 text-red-600" },
                  { label: "Net", value: netIncome, icon: <TrendingUp className="w-4 h-4" />, iconBg: "bg-blue-100 text-blue-600" },
                  { label: "Debt", value: totalDebt, icon: <Wallet className="w-4 h-4" />, iconBg: "bg-amber-100 text-amber-600" },
                ].map((c) => (
                  <div key={c.label} style={glass} className="p-4 flex flex-col gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.iconBg}`}>{c.icon}</div>
                    <span className="text-xs text-slate-500 font-medium">{c.label}</span>
                    <span className="text-lg font-bold text-slate-900">{fmt(c.value)}</span>
                  </div>
                ))}
              </motion.div>

              {/* Upcoming: Bills */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={glass}
                className="p-5"
              >
                <h3 className="text-base font-bold text-slate-900 mb-4">Upcoming Bills</h3>
                {recurringBills.length > 0 ? (
                  <div className="space-y-3">
                    {recurringBills.slice(0, 4).map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-sm">💳</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{bill.description}</p>
                            <p className="text-xs text-slate-500">{bill.frequency}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-red-600">-${Number(bill.amount).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-sm">⚡</div>
                        <div><p className="text-sm font-semibold text-slate-900">Electricity</p><p className="text-xs text-slate-500">Due in 2 days</p></div>
                      </div>
                      <p className="text-sm font-bold text-red-600">$142.00</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-sm">📡</div>
                        <div><p className="text-sm font-semibold text-slate-900">Starlink</p><p className="text-xs text-slate-500">Due in 5 days</p></div>
                      </div>
                      <p className="text-sm font-bold text-red-600">$120.00</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Upcoming: Subscriptions */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={glass}
                className="p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Subscriptions</h3>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wide">
                    {subscriptions.length || 3} Active
                  </span>
                </div>
                {subscriptions.length > 0 ? (
                  <div className="space-y-2">
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">🎬</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{sub.description}</p>
                            <p className="text-[11px] text-slate-400">{sub.frequency}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900">${Number(sub.amount).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm">🎨</div>
                        <div><p className="text-sm font-semibold text-slate-900">Creative Cloud</p><p className="text-[11px] text-slate-400">Monthly</p></div>
                      </div>
                      <p className="text-sm font-bold text-slate-900">$54.99</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm">🎬</div>
                        <div><p className="text-sm font-semibold text-slate-900">Netflix</p><p className="text-[11px] text-slate-400">Monthly</p></div>
                      </div>
                      <p className="text-sm font-bold text-slate-900">$19.99</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">☁️</div>
                        <div><p className="text-sm font-semibold text-slate-900">Google One</p><p className="text-[11px] text-slate-400">Yearly</p></div>
                      </div>
                      <p className="text-sm font-bold text-slate-900">$99.99</p>
                    </div>
                  </div>
                )}
              </motion.div>

            </div>
          </div>
        </div>

        {/* ═══ MOBILE LAYOUT ═══ */}
        <div className="md:hidden max-w-xl mx-auto px-4 pt-6 pb-32 space-y-5">
          {/* Faith Message */}
          <FaithMessage />
          {/* Credit Score */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={glass}
            className="p-6 flex flex-col items-center"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Credit Score</span>
            <div className="relative w-44 h-24">
              <svg viewBox="0 0 160 90" className="w-full h-full">
                <defs>
                  <linearGradient id="csGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="33%" stopColor="#F59E0B" />
                    <stop offset="66%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="url(#csGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${arcDash} ${arcGap}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                <span className="text-3xl font-bold text-slate-900">{creditScore || "—"}</span>
              </div>
            </div>
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${creditColor}20`, color: creditColor }}>{creditLabel}</span>
          </motion.div>

          {/* Financial Overview 2×2 */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={glass} className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Income", value: monthlyIncome, icon: <DollarSign className="w-4 h-4" />, iconBg: "bg-emerald-100 text-emerald-600" },
                { label: "Expenses", value: totalExpenses, icon: <CreditCard className="w-4 h-4" />, iconBg: "bg-red-100 text-red-600" },
                { label: "Net", value: netIncome, icon: <TrendingUp className="w-4 h-4" />, iconBg: "bg-blue-100 text-blue-600" },
                { label: "Debt", value: totalDebt, icon: <Wallet className="w-4 h-4" />, iconBg: "bg-amber-100 text-amber-600" },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.iconBg}`}>{c.icon}</div>
                  <span className="text-xs text-slate-500 font-medium">{c.label}</span>
                  <span className="text-lg font-bold text-slate-900">{fmt(c.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bills & Due Dates */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={glass} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Bills & Due Dates</h3>
              <button onClick={() => navigate("/finance/wealth")} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {recurringBills.length > 0 ? (
              <div className="space-y-3">
                {recurringBills.slice(0, 4).map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-sm">💳</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{bill.description}</p>
                        <p className="text-xs text-slate-500">{bill.frequency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">-${Number(bill.amount).toFixed(2)}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6"><p className="text-sm text-slate-400">No upcoming bills</p></div>
            )}
          </motion.div>

          {/* Savings Goal */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={glass} className="p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Savings Goal</h3>
              <span className="text-xs text-slate-500 font-medium">{savingsPct}% of Goal reached</span>
            </div>
            <div className="mb-3">
              <span className="text-2xl font-bold text-slate-900">{fmt(currentSavings)}</span>
              <span className="text-xs text-slate-400 ml-2">Target: {fmt(savingsGoal)}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${savingsPct}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
            </div>
          </motion.div>

          {/* Market Intelligence */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={glass} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Market Intelligence</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddPair(true)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                  style={{ background: "#6366F1", color: "#fff" }}
                >
                  + Add Pair
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 font-semibold">Live</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">BTC/USD</span>
                  <p className={`text-xs font-semibold ${btcChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>{btcChange >= 0 ? "+" : ""}{btcChange.toFixed(1)}%</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">${btcPrice.toLocaleString()}</p>
                </div>
                <svg width="100" height="40" viewBox="0 0 100 40" className="text-emerald-400">
                  <polyline points="0,35 15,28 30,32 45,20 55,24 70,15 85,18 100,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {userPairs.length > 0 ? "Your Pairs" : "Watchlist"}
            </p>
            <div className="space-y-2">
              {userPairs.length > 0 ? userPairs.map((pair) => (
                <div key={pair.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-700">{pair.category}</span>
                    <span className="text-sm font-medium text-slate-900">{pair.symbol}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 transition">Trade</button>
                    <button
                      onClick={() => { setSelectedPairForPlan(pair); setShowCreatePlan(true); }}
                      className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition"
                    >
                      Plan
                    </button>
                  </div>
                </div>
              )) : watchlist.map((w) => (
                <div key={w.symbol} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${w.color}`}>{w.badge}</span>
                    <span className="text-sm font-medium text-slate-900">{w.symbol}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 transition">Trade</button>
                    <button className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition">Plan</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active Trading Plans (Mobile) */}
          <ActiveTradingPlans />

          {/* Subscriptions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={glass} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Subscriptions</h3>
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wide">{subscriptions.length} Active</span>
            </div>
            {subscriptions.length > 0 ? (
              <div className="space-y-2">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">🎬</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{sub.description}</p>
                        <p className="text-[11px] text-slate-400">{sub.frequency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">${Number(sub.amount).toFixed(2)}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">active</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6"><p className="text-sm text-slate-400">No subscriptions tracked yet</p></div>
            )}
          </motion.div>
        </div>

        {/* Floating Add (mobile only) */}
        <div className="fixed bottom-24 right-6 z-30 md:hidden">
          <button
            onClick={() => navigate("/finance/wealth")}
            className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Modals */}
        {showAddPair && (
          <AddPairModal
            onClose={() => setShowAddPair(false)}
            existingSymbols={userPairs.map((p) => p.symbol)}
          />
        )}
        {showCreatePlan && selectedPairForPlan && (
          <CreatePlanModal
            pair={selectedPairForPlan}
            onClose={() => { setShowCreatePlan(false); setSelectedPairForPlan(null); }}
          />
        )}
      </div>
    </AppShell>
  );
}
