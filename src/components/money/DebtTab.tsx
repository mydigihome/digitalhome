import { useState, useMemo, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Pencil, Trash2, FileX, ChevronDown, ExternalLink, Lightbulb } from "lucide-react";
import { useDebts, useAddDebt, useDeleteDebt, useUpdateDebt, type Debt } from "@/hooks/useDebts";
import { useTransactions } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAYMENT_DATA = [
  { month: "Jan", amount: 860, label: "$860" },
  { month: "Feb", amount: 1260, label: "$1,260" },
  { month: "Mar", amount: 1030, label: "$1,030" },
  { month: "Apr", amount: 1498, label: "$1,498" },
  { month: "May", amount: 1015, label: "$1,015" },
];

const DEBT_TYPES = ["Credit Card", "Student Loan", "Auto Loan", "Medical", "Personal", "Other"];
const DEBT_TABS = ["All", "Credit Cards", "Student Loans", "Auto Loans", "Medical", "Other"];

const TYPE_COLORS: Record<string, string> = {
  "Credit Card": "#7B5EA7",
  "Student Loan": "#10B981",
  "Auto Loan": "#F59E0B",
  "Medical": "#EF4444",
  "Personal": "#3B82F6",
  "Other": "#9CA3AF",
};

function calcPayment(balance: number, monthlyRate: number, months: number) {
  if (balance <= 0) return 0;
  if (monthlyRate === 0) return balance / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return balance * (monthlyRate * factor) / (factor - 1);
}

function calcPayoffMonths(balance: number, monthlyRate: number, payment: number) {
  if (balance <= 0 || payment <= 0) return 0;
  if (monthlyRate === 0) return Math.ceil(balance / payment);
  const interestOnly = balance * monthlyRate;
  if (payment <= interestOnly) return Infinity;
  return Math.ceil(-Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate));
}

function roundUp50(n: number) {
  return Math.ceil(n / 50) * 50;
}

function CustomPaymentTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div style={{
      background: '#7B5EA7', color: 'white', borderRadius: 10,
      padding: '8px 14px', fontSize: 13, fontWeight: 600,
      textAlign: 'center', boxShadow: '0 4px 12px rgba(123,94,167,0.4)',
      position: 'relative',
    }}>
      <div style={{ fontWeight: 700 }}>13% ↗</div>
      <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.9 }}>$ {value.toLocaleString()}</div>
      <div style={{
        position: 'absolute', bottom: -6, left: '50%',
        transform: 'translateX(-50%)', width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid #7B5EA7',
      }} />
    </div>
  );
}

export default function DebtTab() {
  const { data: debts = [] } = useDebts();
  const { data: transactions = [] } = useTransactions();
  const addDebt = useAddDebt();
  const deleteDebt = useDeleteDebt();
  const updateDebt = useUpdateDebt();
  const { user } = useAuth();
  const qc = useQueryClient();

  const loanCalcRef = useRef<HTMLDivElement>(null);

  const [selectedTier, setSelectedTier] = useState<'minimum' | 'recommended' | 'aggressive'>('recommended');
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [chartPeriod, setChartPeriod] = useState("5 Months");
  const [showChartDropdown, setShowChartDropdown] = useState(false);
  const [debtTab, setDebtTab] = useState("All");
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showNoUrlModal, setShowNoUrlModal] = useState(false);
  const [noUrlDebt, setNoUrlDebt] = useState<Debt | null>(null);
  const [tempPaymentUrl, setTempPaymentUrl] = useState("");
  const [debtForm, setDebtForm] = useState({
    creditor: "", type: "Credit Card", balance: "", interest_rate: "",
    monthly_payment: "", due_date: "", notes: "", payment_url: "",
  });

  const activeDebts = useMemo(() => debts.filter(d => d.status !== 'paid_off'), [debts]);
  const totalDebt = activeDebts.reduce((s, d) => s + d.balance, 0);
  const totalMonthly = activeDebts.reduce((s, d) => s + d.monthly_payment, 0);
  const avgRate = activeDebts.length > 0
    ? activeDebts.reduce((s, d) => s + d.interest_rate * d.balance, 0) / (totalDebt || 1)
    : 0;
  const monthlyRate = avgRate / 100 / 12;
  const highestDebt = activeDebts.length > 0
    ? activeDebts.reduce((max, d) => d.balance > max.balance ? d : max, activeDebts[0])
    : null;

  // Debt type breakdown for segmented bar
  const typeBreakdown = useMemo(() => {
    if (totalDebt === 0) return [];
    const groups: Record<string, number> = {};
    activeDebts.forEach(d => { groups[d.type] = (groups[d.type] || 0) + d.balance; });
    return Object.entries(groups).map(([type, amount]) => ({
      type,
      pct: amount / totalDebt * 100,
      color: TYPE_COLORS[type] || "#9CA3AF",
    })).sort((a, b) => b.pct - a.pct);
  }, [activeDebts, totalDebt]);

  // Smart payment tiers
  const tiers = useMemo(() => {
    const hasDebts = activeDebts.length > 0 && totalDebt > 0;
    if (!hasDebts) {
      return [
        { id: 'minimum' as const, amount: 1000, months: 0, label: "Minimum", desc: "Add your debts below to see personalized payment tiers" },
        { id: 'recommended' as const, amount: 2500, months: 0, label: "Recommended", desc: "Add your debts below to see personalized payment tiers" },
        { id: 'aggressive' as const, amount: 5000, months: 0, label: "Aggressive", desc: "Add your debts below to see personalized payment tiers" },
      ];
    }
    const minPayment = totalMonthly > 0 ? totalMonthly : (totalDebt * monthlyRate) + (totalDebt * 0.01);
    const minRounded = roundUp50(minPayment);
    const minMonths = calcPayoffMonths(totalDebt, monthlyRate, minRounded);

    const recPayment = roundUp50(calcPayment(totalDebt, monthlyRate, 36));
    const recMonths = 36;

    const aggPayment = roundUp50(calcPayment(totalDebt, monthlyRate, 12));
    const aggMonths = 12;

    const fmtTime = (m: number) => {
      if (m === Infinity) return "Never (interest only)";
      if (m >= 24) return `~${Math.round(m / 12)} years`;
      return `~${m} months`;
    };

    return [
      { id: 'minimum' as const, amount: minRounded, months: minMonths, label: "Minimum", desc: `Payoff in ${fmtTime(minMonths)}   Interest: ${avgRate.toFixed(1)}%` },
      { id: 'recommended' as const, amount: recPayment, months: recMonths, label: "Recommended", desc: `Payoff in ${fmtTime(recMonths)}   Interest: ${avgRate.toFixed(1)}%` },
      { id: 'aggressive' as const, amount: aggPayment, months: aggMonths, label: "Aggressive", desc: `Payoff in ${fmtTime(aggMonths)}   Interest: ${avgRate.toFixed(1)}%` },
    ];
  }, [activeDebts, totalDebt, totalMonthly, monthlyRate, avgRate]);

  const currentTier = tiers.find(t => t.id === selectedTier)!;
  const totalInterest = currentTier.months > 0 && currentTier.months !== Infinity
    ? (currentTier.amount * currentTier.months) - totalDebt
    : 0;
  const totalCost = totalDebt + Math.max(0, totalInterest);

  // Monthly income from transactions
  const monthlyIncome = useMemo(() => {
    const monthStart = startOfMonth(new Date()).toISOString();
    return transactions
      .filter(t => t.category === 'Income' && t.date >= monthStart)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  }, [transactions]);

  // Suggested payment
  const suggestedPayment = useMemo(() => {
    if (totalDebt <= 0) return { amount: 0, months: 0, date: "" };
    const aggTier = tiers.find(t => t.id === 'aggressive')!;
    const amount = monthlyIncome > 0 ? Math.min(monthlyIncome * 0.20, aggTier.amount) : 0;
    if (amount <= 0) return { amount: 0, months: 0, date: "" };
    const months = calcPayoffMonths(totalDebt, monthlyRate, amount);
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);
    return { amount, months, date: format(payoffDate, "MMMM yyyy") };
  }, [totalDebt, monthlyRate, monthlyIncome, tiers]);

  // Highest rate debt for avalanche
  const highestRateDebt = useMemo(() =>
    activeDebts.length > 0
      ? [...activeDebts].sort((a, b) => b.interest_rate - a.interest_rate)[0]
      : null
  , [activeDebts]);

  const debtsWithUrls = useMemo(() => activeDebts.filter(d => d.payment_url), [activeDebts]);

  const filteredDebts = useMemo(() => {
    if (debtTab === "All") return debts;
    const typeMap: Record<string, string> = {
      "Credit Cards": "Credit Card", "Student Loans": "Student Loan",
      "Auto Loans": "Auto Loan", "Medical": "Medical", "Other": "Other",
    };
    return debts.filter(d => d.type === (typeMap[debtTab] || debtTab));
  }, [debts, debtTab]);

  const handleRecordPayment = async () => {
    if (!user || activeDebts.length === 0) return;
    try {
      // 1. Record payment
      await (supabase as any).from("loan_payments").insert({
        user_id: user.id,
        amount: currentTier.amount,
        payment_date: new Date().toISOString().split('T')[0],
        tier_used: selectedTier,
        note: paymentNote || null,
      });

      // 2. Debt avalanche distribution
      let remaining = currentTier.amount;
      const sorted = [...activeDebts].sort((a, b) => b.interest_rate - a.interest_rate);

      // Pay minimums first
      for (const debt of sorted) {
        const minPay = Math.min(debt.monthly_payment, debt.balance, remaining);
        if (minPay > 0) {
          remaining -= minPay;
          const newBal = Math.max(0, debt.balance - minPay);
          await (supabase as any).from("debts").update({
            balance: newBal,
            ...(newBal === 0 ? { status: 'paid_off' } : {}),
          }).eq("id", debt.id);
        }
      }

      // Apply remainder to highest rate
      if (remaining > 0 && sorted.length > 0) {
        const target = sorted[0];
        const newBal = Math.max(0, target.balance - remaining);
        await (supabase as any).from("debts").update({
          balance: newBal,
          ...(newBal === 0 ? { status: 'paid_off' } : {}),
        }).eq("id", target.id);
      }

      qc.invalidateQueries({ queryKey: ["debts"] });
      setShowPaymentConfirm(false);
      setPaymentNote("");
      toast.success(`Payment of $${currentTier.amount.toLocaleString()} recorded!`);
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const handleMakePayment = () => {
    if (debtsWithUrls.length > 1) {
      // Multiple debts with URLs - could show a selector, for now open highest rate one
      const target = debtsWithUrls.sort((a, b) => b.interest_rate - a.interest_rate)[0];
      window.open(target.payment_url!, '_blank');
    } else if (highestRateDebt?.payment_url) {
      window.open(highestRateDebt.payment_url, '_blank');
    } else if (highestRateDebt) {
      setNoUrlDebt(highestRateDebt);
      setTempPaymentUrl("");
      setShowNoUrlModal(true);
    }
  };

  const handleSaveAndOpenUrl = async () => {
    if (!noUrlDebt || !tempPaymentUrl) return;
    try {
      await (supabase as any).from("debts").update({ payment_url: tempPaymentUrl }).eq("id", noUrlDebt.id);
      qc.invalidateQueries({ queryKey: ["debts"] });
      setShowNoUrlModal(false);
      window.open(tempPaymentUrl, '_blank');
      toast.success("Payment URL saved!");
    } catch {
      toast.error("Failed to save URL");
    }
  };

  const openAddDebt = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtForm({
        creditor: debt.creditor, type: debt.type, balance: String(debt.balance),
        interest_rate: String(debt.interest_rate), monthly_payment: String(debt.monthly_payment),
        due_date: debt.due_date || "", notes: debt.notes || "", payment_url: debt.payment_url || "",
      });
    } else {
      setEditingDebt(null);
      setDebtForm({ creditor: "", type: "Credit Card", balance: "", interest_rate: "", monthly_payment: "", due_date: "", notes: "", payment_url: "" });
    }
    setShowAddDebt(true);
  };

  const handleSaveDebt = async () => {
    if (!debtForm.creditor || !debtForm.balance) return;
    try {
      const payload = {
        creditor: debtForm.creditor, type: debtForm.type,
        balance: parseFloat(debtForm.balance), interest_rate: parseFloat(debtForm.interest_rate) || 0,
        monthly_payment: parseFloat(debtForm.monthly_payment) || 0,
        due_date: debtForm.due_date || null, notes: debtForm.notes || null,
        payment_url: debtForm.payment_url || null,
        status: "current",
      };
      if (editingDebt) {
        await (supabase as any).from("debts").update(payload).eq("id", editingDebt.id);
        qc.invalidateQueries({ queryKey: ["debts"] });
      } else {
        await addDebt.mutateAsync(payload);
      }
      setShowAddDebt(false);
      toast.success(editingDebt ? "Debt updated" : "Debt added");
    } catch { toast.error("Failed to save debt"); }
  };

  const handleDeleteDebt = async () => {
    if (!deleteTarget) return;
    const debt = debts.find(d => d.id === deleteTarget);
    try {
      await deleteDebt.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      toast.success("Debt deleted", {
        action: { label: "Undo", onClick: () => {
          if (debt) addDebt.mutate({ creditor: debt.creditor, type: debt.type, balance: debt.balance, interest_rate: debt.interest_rate, monthly_payment: debt.monthly_payment, due_date: debt.due_date, notes: debt.notes, payment_url: debt.payment_url, status: debt.status });
        }},
        duration: 5000,
      });
    } catch { toast.error("Failed to delete"); }
  };

  const cardStyle = "bg-card border border-border rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

  return (
    <div className="space-y-6">
      {/* Two column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start', width: '100%' }}
        className="max-lg:grid-cols-1"
      >
        {/* LEFT: Smart Payment Calculator */}
        <div ref={loanCalcRef} className={cardStyle} style={{ padding: 28, borderRadius: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700 }} className="text-foreground">Payment Calculator</h2>
          <p style={{ fontSize: 13, marginTop: 4, marginBottom: 24 }} className="text-muted-foreground">
            {activeDebts.length > 0 ? "Based on your actual debt data." : "Add debts below to see personalized tiers."}
          </p>

          {tiers.map(t => {
            const selected = selectedTier === t.id;
            return (
              <div key={t.id} onClick={() => setSelectedTier(t.id)}
                className="cursor-pointer transition-all"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 12, marginBottom: 12,
                  border: selected ? '2px solid #7B5EA7' : '1.5px solid hsl(var(--border))',
                  background: selected ? 'hsl(var(--accent) / 0.3)' : 'transparent',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: selected ? '2px solid #7B5EA7' : '2px solid hsl(var(--muted-foreground) / 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7B5EA7' }} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 22, fontWeight: 700 }} className="text-foreground">${t.amount.toLocaleString()}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, background: 'hsl(var(--muted))', borderRadius: 4, padding: '1px 6px' }} className="text-muted-foreground">{t.label}</span>
                  </div>
                  <div style={{ fontSize: 13 }} className="text-muted-foreground">{t.desc}</div>
                </div>
              </div>
            );
          })}

          {/* Payment details */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid hsl(var(--border))' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }} className="text-foreground">Payment details</h3>
            {[
              { label: "Selected Payment", value: `$${currentTier.amount.toLocaleString()}` },
              { label: "Est. Total Interest", value: `$${Math.max(0, totalInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
                <span style={{ fontSize: 14 }} className="text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground" style={{ fontSize: 11, background: 'hsl(var(--muted))', borderRadius: 4, padding: '2px 8px', fontWeight: 500 }}>USD</span>
                  <span style={{ fontSize: 16, fontWeight: 700 }} className="text-foreground">{row.value}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between" style={{ marginTop: 8, paddingTop: 12, borderTop: '1.5px solid hsl(var(--border))' }}>
              <span style={{ fontSize: 14 }} className="text-muted-foreground">Total Cost</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground" style={{ fontSize: 11, background: 'hsl(var(--muted))', borderRadius: 4, padding: '2px 8px', fontWeight: 500 }}>USD</span>
                <span style={{ fontSize: 20, fontWeight: 800 }} className="text-foreground">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="flex-1 border border-border rounded-xl text-foreground hover:bg-muted transition" style={{ height: 48, fontSize: 15, fontWeight: 500, background: 'transparent' }}>
                Cancel
              </button>
              <button
                onClick={() => activeDebts.length > 0 && setShowPaymentConfirm(true)}
                disabled={activeDebts.length === 0}
                className="flex-1 rounded-xl text-white transition disabled:opacity-50"
                style={{ height: 48, fontSize: 15, fontWeight: 600, background: '#7B5EA7', border: 'none' }}
                onMouseEnter={e => { if (activeDebts.length > 0) e.currentTarget.style.background = '#6D4F9A'; }}
                onMouseLeave={e => (e.currentTarget.style.background = '#7B5EA7')}
              >
                Record Payment
              </button>
            </div>
            {highestRateDebt && (
              <>
                <div style={{ fontSize: 11, textAlign: 'center' }} className="text-muted-foreground">
                  Targeting: {highestRateDebt.creditor} (highest rate at {highestRateDebt.interest_rate}%)
                </div>
                <button
                  onClick={handleMakePayment}
                  title="Opens your lender's payment portal in a new tab"
                  className="rounded-xl text-white transition flex items-center justify-center gap-2"
                  style={{ width: '100%', height: 48, background: '#10B981', borderRadius: 12, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#059669')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#10B981')}
                >
                  <ExternalLink size={16} /> Make Payment →
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Total Loan Balance */}
          <div className={cardStyle} style={{ padding: 24, borderRadius: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }} className="text-foreground">Total Loan Balance</h3>
            {activeDebts.length === 0 ? (
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#9CA3AF' }}>$0.00</div>
                <p style={{ fontSize: 13 }} className="text-muted-foreground mt-2">Add debts below to see your total</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <div style={{ fontSize: 12 }} className="text-muted-foreground mb-1">Total Owed</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#DC2626' }}>
                      ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12 }} className="text-muted-foreground mb-1">Active Debts</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }} className="text-foreground">{activeDebts.length} debt{activeDebts.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="flex justify-between" style={{ margin: '12px 0', fontSize: 13 }}>
                  <span className="text-muted-foreground">Highest: {highestDebt?.creditor} (${highestDebt?.balance.toLocaleString()})</span>
                  <span className="text-muted-foreground">Avg Interest: {avgRate.toFixed(1)}%</span>
                </div>
                {/* Segmented bar */}
                {typeBreakdown.length > 0 && (
                  <>
                    <div style={{ display: 'flex', width: '100%', height: 10, borderRadius: 999, overflow: 'hidden', margin: '16px 0 8px' }}>
                      {typeBreakdown.map(seg => (
                        <div key={seg.type} style={{ width: `${seg.pct}%`, background: seg.color }} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4" style={{ marginTop: 8 }}>
                      {typeBreakdown.map(seg => (
                        <div key={seg.type} className="flex items-center gap-1.5" style={{ fontSize: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color }} />
                          <span className="text-muted-foreground">{seg.type}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Payments Chart */}
          <div className={cardStyle} style={{ padding: 24, borderRadius: 16 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 15, fontWeight: 600 }} className="text-foreground">Payments based on your sales</h3>
              <div className="relative">
                <button onClick={() => setShowChartDropdown(!showChartDropdown)} className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 6, padding: '4px 10px' }}>
                  {chartPeriod} <ChevronDown size={10} />
                </button>
                {showChartDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[100px]">
                    {["3 Months", "5 Months", "1 Year"].map(p => (
                      <button key={p} onClick={() => { setChartPeriod(p); setShowChartDropdown(false); }} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${chartPeriod === p ? "font-bold text-foreground" : "text-muted-foreground"}`}>{p}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PAYMENT_DATA} margin={{ top: 40, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <XAxis xAxisId="amount-axis" dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={8} />
                  <YAxis hide />
                  <Tooltip content={<CustomPaymentTooltip />} cursor={false} />
                  <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2.5} fill="url(#payGrad)"
                    dot={(props: any) => <circle key={props.index} cx={props.cx} cy={props.cy} r={6} fill="#10B981" stroke="#FFFFFF" strokeWidth={2.5} />}
                    activeDot={{ r: 8, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Suggested Payment */}
            <div style={{ borderTop: '1px solid hsl(var(--border))', margin: '16px 0', paddingTop: 16 }}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} style={{ color: '#7B5EA7' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }} className="text-foreground">Suggested Monthly Payment</span>
              </div>
              {suggestedPayment.amount > 0 ? (
                <>
                  <div className="dark:bg-[#052e16] dark:border-[#166534]" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: 10, padding: '14px 16px',
                  }}>
                    <div>
                      <div style={{ fontSize: 13 }} className="text-muted-foreground">Pay this monthly</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#10B981' }}>
                        ${suggestedPayment.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13 }} className="text-muted-foreground">Debt-free by</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }} className="text-foreground">{suggestedPayment.date}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }} className="text-muted-foreground">
                    Based on 20% of your monthly income using the debt avalanche method
                  </p>
                  <button
                    onClick={() => {
                      const closest = tiers.reduce((prev, curr) =>
                        Math.abs(curr.amount - suggestedPayment.amount) < Math.abs(prev.amount - suggestedPayment.amount) ? curr : prev
                      );
                      setSelectedTier(closest.id);
                      loanCalcRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ fontSize: 12, color: '#7B5EA7', display: 'block', textAlign: 'center', marginTop: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Use this amount →
                  </button>
                </>
              ) : (
                <p style={{ fontSize: 13 }} className="text-muted-foreground">
                  {totalDebt > 0 ? "Add income transactions to get a suggestion" : "Add debts to see a suggested payment"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* My Debts — Full Width */}
      <div className={cardStyle} style={{ padding: 24, borderRadius: 16 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 20, fontWeight: 700 }} className="text-foreground">My Debts</h2>
          <button onClick={() => openAddDebt()} className="flex items-center gap-2 rounded-lg text-white transition" style={{ background: '#10B981', padding: '8px 16px', fontWeight: 500, fontSize: 14, border: 'none' }}>
            <Plus size={16} /> Add Debt
          </button>
        </div>

        {/* Summary row */}
        {debts.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="text-muted-foreground text-xs mb-1">Total Debt</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="text-muted-foreground text-xs mb-1">Monthly Payments</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>${totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="text-muted-foreground text-xs mb-1">Avg Interest Rate</div>
              <div style={{ fontSize: 20, fontWeight: 700 }} className="text-muted-foreground">{avgRate.toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center border-b border-border mb-4">
          {DEBT_TABS.map(tab => (
            <button key={tab} onClick={() => setDebtTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${debtTab === tab ? "border-success text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >{tab}</button>
          ))}
        </div>

        {/* Debt table or empty state */}
        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileX className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-lg font-semibold text-foreground mb-1">No debts tracked yet</p>
            <p className="text-sm text-muted-foreground mb-4">Add your first debt to start tracking</p>
            <button onClick={() => openAddDebt()} className="flex items-center gap-2 rounded-lg text-white" style={{ background: '#10B981', padding: '8px 16px', fontWeight: 500, fontSize: 14, border: 'none' }}>
              <Plus size={16} /> Add Debt
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Creditor", "Type", "Balance", "Interest Rate", "Monthly Payment", "Due Date", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDebts.map(debt => (
                  <tr key={debt.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                    <td className="py-3 px-3 font-medium text-foreground">{debt.creditor}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{debt.type}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-foreground">${debt.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 text-muted-foreground">{debt.interest_rate}%</td>
                    <td className="py-3 px-3 text-foreground">${debt.monthly_payment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 text-muted-foreground">{debt.due_date ? format(new Date(debt.due_date), "MMM d, yyyy") : "—"}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        debt.status === "current" ? "bg-success/10 text-success" :
                        debt.status === "overdue" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{debt.status === "current" ? "Current" : debt.status === "overdue" ? "Overdue" : "Paid Off"}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => openAddDebt(debt)} className="text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(debt.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Confirm */}
      <AlertDialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record payment of ${currentTier.amount.toLocaleString()}?</AlertDialogTitle>
            <AlertDialogDescription>This will be logged and your balances updated using the debt avalanche method.</AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={paymentNote}
            onChange={e => setPaymentNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm mb-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecordPayment} style={{ background: '#7B5EA7' }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Debt Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this debt?</AlertDialogTitle>
            <AlertDialogDescription>This action can be undone within 5 seconds.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDebt} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No URL Modal */}
      {showNoUrlModal && noUrlDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNoUrlModal(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-2">No payment link saved</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a payment URL for <strong>{noUrlDebt.creditor}</strong> so we can take you directly to your lender.
            </p>
            <input
              value={tempPaymentUrl}
              onChange={e => setTempPaymentUrl(e.target.value)}
              placeholder="https://your-lender.com/pay"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm mb-1"
            />
            <p style={{ fontSize: 11, marginBottom: 12 }} className="text-muted-foreground">Payment Website URL</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNoUrlModal(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-foreground">Skip for now</button>
              <button onClick={handleSaveAndOpenUrl} disabled={!tempPaymentUrl} className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50" style={{ background: '#10B981' }}>
                Save & Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Debt Modal */}
      {showAddDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddDebt(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">{editingDebt ? "Edit Debt" : "Add Debt"}</h3>
            <div className="space-y-3">
              <input value={debtForm.creditor} onChange={e => setDebtForm(f => ({ ...f, creditor: e.target.value }))} placeholder="Creditor Name" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <select value={debtForm.type} onChange={e => setDebtForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                {DEBT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={debtForm.balance} onChange={e => setDebtForm(f => ({ ...f, balance: e.target.value }))} placeholder="Current Balance" type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <input value={debtForm.interest_rate} onChange={e => setDebtForm(f => ({ ...f, interest_rate: e.target.value }))} placeholder="Interest Rate %" type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <input value={debtForm.monthly_payment} onChange={e => setDebtForm(f => ({ ...f, monthly_payment: e.target.value }))} placeholder="Monthly Minimum Payment" type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <input value={debtForm.due_date} onChange={e => setDebtForm(f => ({ ...f, due_date: e.target.value }))} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <div>
                <input value={debtForm.payment_url} onChange={e => setDebtForm(f => ({ ...f, payment_url: e.target.value }))} placeholder="https://your-lender.com/pay" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
                <p style={{ fontSize: 11, marginTop: 2 }} className="text-muted-foreground">Payment Website (optional) — Where you go to make your actual payment</p>
              </div>
              <textarea value={debtForm.notes} onChange={e => setDebtForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowAddDebt(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-foreground">Cancel</button>
              <button onClick={handleSaveDebt} disabled={addDebt.isPending} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                {addDebt.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
