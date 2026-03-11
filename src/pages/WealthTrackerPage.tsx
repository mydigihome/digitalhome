import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, PiggyBank, Pencil, Trash2, LayoutGrid, Check } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

import SortableCard from "@/components/wealth/SortableCard";
import AppShell from "@/components/AppShell";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useExpenses } from "@/hooks/useExpenses";
import { useLoans } from "@/hooks/useLoans";
import { useAuth } from "@/hooks/useAuth";
import { useMarketQuote } from "@/hooks/useMarketData";
import { useTradingPairs, useRemoveTradingPair, TradingPair } from "@/hooks/useTradingPairs";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import WealthOnboarding from "@/components/wealth/WealthOnboarding";
import AddPairModal from "@/components/wealth/AddPairModal";
import CreatePlanModal from "@/components/wealth/CreatePlanModal";
import TradeModal from "@/components/wealth/TradeModal";
import BrokerSelectionModal from "@/components/wealth/BrokerSelectionModal";
import ActiveTradingPlans from "@/components/wealth/ActiveTradingPlans";
import HeaderCustomizationModal from "@/components/wealth/HeaderCustomizationModal";
import { InvestmentScheduleCard } from "@/components/wealth/InvestmentScheduleCard";
import { StudentLoanCard } from "@/components/wealth/StudentLoanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─── helpers ─── */
const FAITH_MESSAGES = [
  "Wealth is options", "Provision for purpose", "Build with intention",
  "Steward well, grow bold", "Your work has value", "Abundance follows discipline",
  "Invest in what matters", "Generosity multiplies",
];

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
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showBrokerSelection, setShowBrokerSelection] = useState(false);
  const [selectedPairForPlan, setSelectedPairForPlan] = useState<TradingPair | null>(null);
  const [selectedPairForTrade, setSelectedPairForTrade] = useState<TradingPair | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // Card ordering
  const DEFAULT_CARD_ORDER = [
    "credit-score", "stats-grid", "market-intelligence", "trading-plans",
    "savings-goal", "bills", "subscriptions", "investment-schedule", "student-loans"
  ];
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("wealth-card-order");
      return saved ? JSON.parse(saved) : DEFAULT_CARD_ORDER;
    } catch { return DEFAULT_CARD_ORDER; }
  });

  useEffect(() => {
    localStorage.setItem("wealth-card-order", JSON.stringify(cardOrder));
  }, [cardOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // User preferences for header
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();

  // Market data
  const { data: btcQuote } = useMarketQuote("BTC/USD");

  // Custom trading pairs
  const { data: tradingPairs } = useTradingPairs();
  const removePair = useRemoveTradingPair();
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
    { symbol: "EUR/USD", badge: "FX", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
    { symbol: "ETH/USD", badge: "ETH", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
    { symbol: "AAPL", badge: "AAPL", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" },
  ];

  const btcPrice = btcQuote?.quote?.price ? parseFloat(btcQuote.quote.price) : 64284.5;
  const btcChange = btcQuote?.quote?.percent_change ? parseFloat(btcQuote.quote.percent_change) : 2.4;

  const moneyHeaderType = (prefs as any)?.money_header_type || "color";
  const moneyHeaderValue = (prefs as any)?.money_header_value || (prefs as any)?.banner_color || "#6366F1";
  const headerStyle = moneyHeaderType === "photo"
    ? { backgroundImage: `url(${moneyHeaderValue})`, backgroundSize: "cover" as const, backgroundPosition: "center" as const, borderRadius: "0 0 40px 40px" }
    : { background: `linear-gradient(135deg, ${moneyHeaderValue}20, ${moneyHeaderValue}10)`, borderRadius: "0 0 40px 40px" };

  const handleCardEdit = async (card: string, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) { toast.error("Enter a valid number"); return; }
    const fieldMap: Record<string, string> = {
      income: "monthly_income",
      credit: "credit_score",
      debt: "total_debt",
      savings: "current_savings",
    };
    if (fieldMap[card]) {
      const { error } = await (supabase as any).from("user_finances").update({ [fieldMap[card]]: num }).eq("user_id", user!.id);
      if (error) toast.error("Update failed");
      else { toast.success("Updated!"); setEditingCard(null); }
    }
  };

  /* ─── Reusable card item row ─── */
  const CardItemRow = ({ icon, title, subtitle, amount, amountColor = "text-foreground" }: { icon: React.ReactNode; title: string; subtitle: string; amount: string; amountColor?: string }) => (
    <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-sm">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <p className={`text-sm font-bold ${amountColor}`}>{amount}</p>
    </div>
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-background">

        {/* Customizable Header */}
        <div
          className="relative group cursor-pointer"
          style={{ ...headerStyle, paddingTop: 16, paddingBottom: 12 }}
          onClick={() => setIsEditingHeader(true)}
        >
          <button className="absolute top-3 right-4 w-7 h-7 rounded-full bg-card/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Pencil className="w-3 h-3 text-foreground" />
          </button>
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-xs font-medium italic" style={{ color: moneyHeaderValue }}>
              "{FAITH_MESSAGES[new Date().getDate() % FAITH_MESSAGES.length]}"
            </p>
          </div>
        </div>

        {/* Edit Layout FAB */}
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="fixed top-20 right-6 z-50 px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition flex items-center gap-2 bg-primary text-primary-foreground"
        >
          {isEditMode ? <Check className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          <span className="text-sm">{isEditMode ? "Done" : "Edit Layout"}</span>
        </button>

        <div className="hidden md:block px-6 pt-6 pb-32 max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-6">
            {/* LEFT 8 cols: Credit Score + Market + Savings */}
            <div className="col-span-8 space-y-6">

              {/* Credit Score */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-6 relative group"
              >
                <button
                  onClick={() => { setEditingCard("credit"); setEditValue(String(creditScore)); }}
                  className="absolute top-4 right-14 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-primary text-primary-foreground"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Credit Score
                  </span>
                  <button
                    onClick={() => navigate("/finance/wealth")}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition bg-primary/10 text-primary"
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
                      <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" />
                      <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="url(#csGradD)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${arcDash} ${arcGap}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                      <span className="text-3xl font-bold text-foreground">{creditScore || "—"}</span>
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
                      <div className="h-full" style={{ width: `${arcPct * 100}%`, background: "transparent", borderRight: "3px solid hsl(var(--background))" }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">300</span>
                      <span className="text-[10px] text-muted-foreground">850</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Market Intelligence */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-foreground">Market Intelligence</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddPair(true)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition bg-primary text-primary-foreground"
                    >
                      + Add Pair
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Live</span>
                    </div>
                  </div>
                </div>

                {/* BTC highlight */}
                <div className="bg-card rounded-2xl border border-border p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground">BTC/USD</span>
                      <p className={`text-xs font-semibold ${btcChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(1)}%
                      </p>
                      <p className="text-xl font-bold text-foreground mt-1">${btcPrice.toLocaleString()}</p>
                    </div>
                    <svg width="100" height="40" viewBox="0 0 100 40" className="text-emerald-400">
                      <polyline points="0,35 15,28 30,32 45,20 55,24 70,15 85,18 100,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Asset Table - Custom pairs + defaults */}
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-left">
                        <th className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase">Asset</th>
                        <th className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase">Price</th>
                        <th className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPairs.length > 0 ? userPairs.map((pair) => (
                        <tr key={pair.id} className="border-t border-border hover:bg-muted/30 transition group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary">{pair.category}</span>
                              <span className="font-medium text-foreground">{pair.symbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">—</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedPairForTrade(pair); setShowBrokerSelection(true); }}
                                className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition"
                              >
                                Trade
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedPairForPlan(pair); setShowCreatePlan(true); }}
                                className="text-xs px-3 py-1 rounded-lg bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition"
                              >
                                Plan
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Remove this trading pair?")) {
                                    removePair.mutate(pair.id, {
                                      onSuccess: () => toast.success("Pair removed"),
                                      onError: () => toast.error("Failed to remove pair"),
                                    });
                                  }
                                }}
                                className="text-xs px-2 py-1 rounded-lg bg-destructive/10 text-destructive font-semibold opacity-0 group-hover:opacity-100 transition hover:bg-destructive/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : watchlist.map((w) => {
                        const fakePair: TradingPair = { id: w.symbol, user_id: "", symbol: w.symbol, display_name: w.symbol, category: w.badge, is_active: true, sort_order: 0, created_at: "" };
                        return (
                        <tr key={w.symbol} className="border-t border-border hover:bg-muted/30 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${w.color}`}>{w.badge}</span>
                              <span className="font-medium text-foreground">{w.symbol}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">—</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedPairForTrade(fakePair); setShowBrokerSelection(true); }}
                                className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition"
                              >Trade</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedPairForPlan(fakePair); setShowCreatePlan(true); }}
                                className="text-xs px-3 py-1 rounded-lg bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition"
                              >Plan</button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
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
                className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-5"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-foreground">Savings Goal</h3>
                  <span className="text-xs text-muted-foreground font-medium">{savingsPct}% of Goal reached</span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-foreground">{fmt(currentSavings)}</span>
                    <span className="text-xs text-muted-foreground ml-2">/ {fmt(savingsGoal)}</span>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Monthly: <span className="font-semibold text-foreground">${Math.round(monthlyIncome * 0.2).toLocaleString()}</span></p>
                    <p>{savingsGoal > currentSavings ? `${Math.ceil((savingsGoal - currentSavings) / Math.max(1, monthlyIncome * 0.2))} Months left` : "Goal reached!"}</p>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
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
                  { key: "income", label: "Income", value: monthlyIncome, icon: <DollarSign className="w-4 h-4" />, iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", editColor: "#10B981" },
                  { key: "expenses", label: "Expenses", value: totalExpenses, icon: <CreditCard className="w-4 h-4" />, iconBg: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400", editColor: "#EF4444" },
                  { key: "net", label: "Net", value: netIncome, icon: <TrendingUp className="w-4 h-4" />, iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", editColor: "#3B82F6" },
                  { key: "debt", label: "Debt", value: totalDebt, icon: <Wallet className="w-4 h-4" />, iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", editColor: "#F59E0B" },
                ].map((c) => (
                  <div key={c.label} className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-4 flex flex-col gap-2 relative group">
                    {c.key !== "net" && c.key !== "expenses" && (
                      <button
                        onClick={() => { setEditingCard(c.key); setEditValue(String(c.value)); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white"
                        style={{ backgroundColor: c.editColor }}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.iconBg}`}>{c.icon}</div>
                    <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
                    {editingCard === c.key ? (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 text-sm w-24"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") handleCardEdit(c.key, editValue); if (e.key === "Escape") setEditingCard(null); }}
                        />
                        <button onClick={() => handleCardEdit(c.key, editValue)} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">✓</button>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-foreground">{fmt(c.value)}</span>
                    )}
                  </div>
                ))}
              </motion.div>

              {/* Upcoming: Bills */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-5"
              >
                <h3 className="text-base font-bold text-foreground mb-4">Upcoming Bills</h3>
                {recurringBills.length > 0 ? (
                  <div className="space-y-3">
                    {recurringBills.slice(0, 4).map((bill) => (
                      <CardItemRow key={bill.id} icon="💳" title={bill.description} subtitle={bill.frequency} amount={`-$${Number(bill.amount).toFixed(2)}`} amountColor="text-red-600 dark:text-red-400" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <CardItemRow icon="⚡" title="Electricity" subtitle="Due in 2 days" amount="$142.00" amountColor="text-red-600 dark:text-red-400" />
                    <CardItemRow icon="📡" title="Starlink" subtitle="Due in 5 days" amount="$120.00" amountColor="text-red-600 dark:text-red-400" />
                  </div>
                )}
              </motion.div>

              {/* Upcoming: Subscriptions */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-foreground">Subscriptions</h3>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wide">
                    {subscriptions.length || 3} Active
                  </span>
                </div>
                {subscriptions.length > 0 ? (
                  <div className="space-y-2">
                    {subscriptions.map((sub) => (
                      <CardItemRow key={sub.id} icon="🎬" title={sub.description} subtitle={sub.frequency} amount={`$${Number(sub.amount).toFixed(2)}`} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <CardItemRow icon="🎨" title="Creative Cloud" subtitle="Monthly" amount="$54.99" />
                    <CardItemRow icon="🎬" title="Netflix" subtitle="Monthly" amount="$19.99" />
                    <CardItemRow icon="☁️" title="Google One" subtitle="Yearly" amount="$99.99" />
                  </div>
                )}
              </motion.div>

              {/* Investment Schedule - Desktop */}
              <InvestmentScheduleCard />

              {/* Student Loans - Desktop */}
              <StudentLoanCard />

            </div>
          </div>
        </div>

        {/* ═══ MOBILE LAYOUT ═══ */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
            <div className="md:hidden max-w-xl mx-auto px-4 pt-6 pb-32 space-y-5">
              {cardOrder.map((cardId) => {
                switch (cardId) {
                  case "credit-score":
                    return (
                      <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-6 flex flex-col items-center">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Credit Score</span>
                          <div className="relative w-44 h-24">
                            <svg viewBox="0 0 160 90" className="w-full h-full">
                              <defs><linearGradient id="csGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#EF4444" /><stop offset="33%" stopColor="#F59E0B" /><stop offset="66%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#10B981" /></linearGradient></defs>
                              <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" />
                              <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="url(#csGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${arcDash} ${arcGap}`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                              <span className="text-3xl font-bold text-foreground">{creditScore || "—"}</span>
                            </div>
                          </div>
                          <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${creditColor}20`, color: creditColor }}>{creditLabel}</span>
                        </motion.div>
                      </SortableCard>
                    );
                  case "stats-grid":
                    return (
                      <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-5">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { key: "income", label: "Income", value: monthlyIncome, icon: <DollarSign className="w-4 h-4" />, iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", editColor: "#10B981" },
                              { key: "expenses", label: "Expenses", value: totalExpenses, icon: <CreditCard className="w-4 h-4" />, iconBg: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400", editColor: "#EF4444" },
                              { key: "net", label: "Net", value: netIncome, icon: <TrendingUp className="w-4 h-4" />, iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", editColor: "#3B82F6" },
                              { key: "debt", label: "Debt", value: totalDebt, icon: <Wallet className="w-4 h-4" />, iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", editColor: "#F59E0B" },
                            ].map((c) => (
                              <div key={c.label} className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-2 relative group">
                                {c.key !== "net" && c.key !== "expenses" && (
                                  <button onClick={() => { setEditingCard(c.key); setEditValue(String(c.value)); }} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity z-10 text-white" style={{ backgroundColor: c.editColor }}>
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.iconBg}`}>{c.icon}</div>
                                <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
                                {editingCard === c.key ? (
                                  <div className="flex gap-1">
                                    <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 text-sm w-20" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleCardEdit(c.key, editValue); if (e.key === "Escape") setEditingCard(null); }} />
                                    <button onClick={() => handleCardEdit(c.key, editValue)} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground">✓</button>
                                  </div>
                                ) : (
                                  <span className="text-lg font-bold text-foreground">{fmt(c.value)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </SortableCard>
                    );
                  case "bills":
                    return (
                      <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-foreground">Bills & Due Dates</h3>
                            <button onClick={() => navigate("/finance/wealth")} className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition"><Plus className="w-4 h-4" /></button>
                          </div>
                          {recurringBills.length > 0 ? (
                            <div className="space-y-3">
                              {recurringBills.slice(0, 4).map((bill) => (
                                <div key={bill.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-sm">💳</div>
                                    <div><p className="text-sm font-semibold text-foreground">{bill.description}</p><p className="text-xs text-muted-foreground">{bill.frequency}</p></div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-red-600 dark:text-red-400">-${Number(bill.amount).toFixed(2)}</p>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">Pending</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6"><p className="text-sm text-muted-foreground">No upcoming bills</p></div>
                          )}
                        </motion.div>
                      </SortableCard>
                    );
                  case "savings-goal":
                    return (
                      <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-5">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-bold text-foreground">Savings Goal</h3>
                            <span className="text-xs text-muted-foreground font-medium">{savingsPct}% of Goal reached</span>
                          </div>
                          <div className="mb-3">
                            <span className="text-2xl font-bold text-foreground">{fmt(currentSavings)}</span>
                            <span className="text-xs text-muted-foreground ml-2">Target: {fmt(savingsGoal)}</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${savingsPct}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                          </div>
                        </motion.div>
                      </SortableCard>
                    );
                  case "market-intelligence":
                    return (
                      <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-foreground">Market Intelligence</h3>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setShowAddPair(true)} className="text-xs px-3 py-1.5 rounded-lg font-semibold transition bg-primary text-primary-foreground">+ Add Pair</button>
                              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Live</span></div>
                            </div>
                          </div>
                          <div className="bg-card rounded-2xl border border-border p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground">BTC/USD</span>
                                <p className={`text-xs font-semibold ${btcChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>{btcChange >= 0 ? "+" : ""}{btcChange.toFixed(1)}%</p>
                                <p className="text-xl font-bold text-foreground mt-1">${btcPrice.toLocaleString()}</p>
                              </div>
                              <svg width="100" height="40" viewBox="0 0 100 40" className="text-emerald-400"><polyline points="0,35 15,28 30,32 45,20 55,24 70,15 85,18 100,8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{userPairs.length > 0 ? "Your Pairs" : "Watchlist"}</p>
                          <div className="space-y-2">
                            {userPairs.length > 0 ? userPairs.map((pair) => (
                              <div key={pair.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary">{pair.category}</span>
                                  <span className="text-sm font-medium text-foreground">{pair.symbol}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); setSelectedPairForTrade(pair); setShowBrokerSelection(true); }} className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition">Trade</button>
                                  <button onClick={(e) => { e.stopPropagation(); setSelectedPairForPlan(pair); setShowCreatePlan(true); }} className="text-xs px-3 py-1 rounded-lg bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition">Plan</button>
                                  <button onClick={(e) => { e.stopPropagation(); if (confirm("Remove this trading pair?")) { removePair.mutate(pair.id, { onSuccess: () => toast.success("Pair removed"), onError: () => toast.error("Failed to remove pair") }); } }} className="text-xs px-2 py-1 rounded-lg bg-destructive/10 text-destructive font-semibold transition hover:bg-destructive/20"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            )) : watchlist.map((w) => {
                              const fakePair: TradingPair = { id: w.symbol, user_id: "", symbol: w.symbol, display_name: w.symbol, category: w.badge, is_active: true, sort_order: 0, created_at: "" };
                              return (
                                <div key={w.symbol} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                                  <div className="flex items-center gap-3"><span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${w.color}`}>{w.badge}</span><span className="text-sm font-medium text-foreground">{w.symbol}</span></div>
                                  <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedPairForTrade(fakePair); setShowBrokerSelection(true); }} className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition">Trade</button>
                                    <button onClick={(e) => { e.stopPropagation(); setSelectedPairForPlan(fakePair); setShowCreatePlan(true); }} className="text-xs px-3 py-1 rounded-lg bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition">Plan</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      </SortableCard>
                    );
                  case "trading-plans":
                    return (
                      <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                        <ActiveTradingPlans />
                      </SortableCard>
                    );
                  case "subscriptions":
                    return (
                      <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-foreground">Subscriptions</h3>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wide">{subscriptions.length} Active</span>
                          </div>
                          {subscriptions.length > 0 ? (
                            <div className="space-y-2">
                              {subscriptions.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                                  <div className="flex items-center gap-3"><div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm">🎬</div><div><p className="text-sm font-semibold text-foreground">{sub.description}</p><p className="text-[11px] text-muted-foreground">{sub.frequency}</p></div></div>
                                  <div className="text-right"><p className="text-sm font-bold text-foreground">${Number(sub.amount).toFixed(2)}</p><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">active</span></div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6"><p className="text-sm text-muted-foreground">No subscriptions tracked yet</p></div>
                          )}
                        </motion.div>
                      </SortableCard>
                    );
                  case "investment-schedule":
                    return (
                      <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                        <InvestmentScheduleCard />
                      </SortableCard>
                    );
                  case "student-loans":
                    return (
                      <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
                        <StudentLoanCard />
                      </SortableCard>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Floating Add (mobile only) */}
        <div className="fixed bottom-24 right-6 z-30 md:hidden">
          <button
            onClick={() => navigate("/finance/wealth")}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
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
        {showTradeModal && selectedPairForTrade && (
          <TradeModal
            pair={selectedPairForTrade}
            onClose={() => { setShowTradeModal(false); setSelectedPairForTrade(null); }}
          />
        )}
        {showBrokerSelection && (
          <BrokerSelectionModal
            pair={selectedPairForTrade}
            onClose={() => { setShowBrokerSelection(false); setSelectedPairForTrade(null); }}
          />
        )}
        {isEditingHeader && (
          <HeaderCustomizationModal
            pageKey="money"
            currentType={moneyHeaderType}
            currentValue={moneyHeaderValue}
            onClose={() => setIsEditingHeader(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
