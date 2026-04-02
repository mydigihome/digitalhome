import { useState, useMemo } from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import { Plus, Pencil, Trash2, Home, Tv, ShoppingBag, UtensilsCrossed, Banknote, Circle, MoreHorizontal, Info, DollarSign } from "lucide-react";
import { useTransactions, useAddTransaction, useDeleteTransaction, type Transaction } from "@/hooks/useTransactions";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CATEGORIES = [
  { id: "Subscription", color: "#7B5EA7", icon: Tv },
  { id: "Living Cost", color: "#3B82F6", icon: Home },
  { id: "Lifestyle", color: "#F59E0B", icon: ShoppingBag },
  { id: "Food", color: "#EF4444", icon: UtensilsCrossed },
  { id: "Income", color: "#10B981", icon: Banknote },
  { id: "Other", color: "#6B7280", icon: Circle },
];

const BAR_CATEGORIES = [
  { id: "Living Cost", color: "#7B5EA7", label: "Living Cost" },
  { id: "Subscription", color: "#A78BFA", label: "Subscription" },
  { id: "Lifestyle", color: "#C4B5FD", label: "Lifestyle" },
  { id: "Food", color: "#EDE9FE", label: "Food" },
];

function getCatMeta(cat: string) {
  return CATEGORIES.find(c => c.id === cat) || CATEGORIES[5];
}

const SAMPLE_TRANSACTIONS: Omit<Transaction, "user_id" | "created_at">[] = [
  { id: "s1", name: "Netflix Subscription", amount: -199, category: "Subscription", date: "2026-02-04T21:17:00Z", notes: null, source: "sample" },
  { id: "s2", name: "Electricity Bill Payment", amount: -125, category: "Living Cost", date: "2026-02-03T10:26:00Z", notes: null, source: "sample" },
  { id: "s3", name: "Shopping", amount: -273.10, category: "Lifestyle", date: "2026-02-02T18:53:00Z", notes: null, source: "sample" },
  { id: "s4", name: "Restaurant Bill Payment", amount: -58, category: "Food", date: "2026-02-02T14:11:00Z", notes: null, source: "sample" },
  { id: "s5", name: "YouTube Subscription", amount: -128, category: "Subscription", date: "2026-02-01T21:05:00Z", notes: null, source: "sample" },
  { id: "s6", name: "Salary Credited", amount: 5000, category: "Income", date: "2026-02-01T10:00:00Z", notes: null, source: "sample" },
  { id: "s7", name: "Insurances", amount: -30, category: "Living Cost", date: "2026-01-30T09:28:00Z", notes: null, source: "sample" },
  { id: "s8", name: "Spotify Subscription", amount: -129, category: "Subscription", date: "2026-01-30T22:11:00Z", notes: null, source: "sample" },
  { id: "s9", name: "Send Money to John", amount: -500, category: "Living Cost", date: "2026-01-25T13:11:00Z", notes: null, source: "sample" },
  { id: "s10", name: "Restaurant Bill Payment", amount: -45, category: "Food", date: "2026-01-23T08:55:00Z", notes: null, source: "sample" },
];

export default function TransactionHistoryPanel() {
  const { data: realTransactions = [] } = useTransactions();
  const addTx = useAddTransaction();
  const deleteTx = useDeleteTransaction();
  const [showAdd, setShowAdd] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", amount: "", category: "Living Cost", date: format(new Date(), "yyyy-MM-dd"), notes: "" });

  const isSampleMode = realTransactions.length === 0;
  const transactions = isSampleMode ? SAMPLE_TRANSACTIONS as any as Transaction[] : realTransactions;

  // This month stats
  const thisMonthStart = startOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const thisMonthTxs = transactions.filter(t => new Date(t.date) >= thisMonthStart && t.amount < 0);
  const lastMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= lastMonthStart && d < thisMonthStart && t.amount < 0;
  });
  const thisMonthTotal = thisMonthTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
  const lastMonthTotal = lastMonthTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
  const pctChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : -4.5;

  // Category breakdown for segmented bar
  const catTotals = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0);
    const map: Record<string, number> = {};
    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + Math.abs(t.amount); });
    return BAR_CATEGORIES.map(c => ({ ...c, total: map[c.id] || 0 }));
  }, [transactions]);

  const catBarTotal = catTotals.reduce((s, c) => s + c.total, 0) || 1;
  const displayTotal = thisMonthTotal > 0 ? thisMonthTotal : 783.10;

  // Group by month
  const grouped = useMemo(() => {
    const sorted = [...transactions].slice(0, visibleCount);
    const groups: Record<string, Transaction[]> = {};
    sorted.forEach(t => {
      const key = format(new Date(t.date), "MMMM yyyy");
      (groups[key] = groups[key] || []).push(t);
    });
    return Object.entries(groups);
  }, [transactions, visibleCount]);

  const handleAdd = async () => {
    if (!form.name || !form.amount) return;
    const amt = parseFloat(form.amount);
    if (isNaN(amt)) return;
    try {
      await addTx.mutateAsync({
        name: form.name,
        amount: form.category === "Income" ? Math.abs(amt) : -Math.abs(amt),
        category: form.category,
        date: new Date(form.date).toISOString(),
        notes: form.notes || null,
        source: "manual",
      });
      setForm({ name: "", amount: "", category: "Living Cost", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
      setShowAdd(false);
      toast.success("Transaction added");
    } catch {
      toast.error("Failed to add transaction");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (isSampleMode) { setDeleteTarget(null); return; }
    const tx = transactions.find(t => t.id === deleteTarget);
    try {
      await deleteTx.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      toast.success("Transaction deleted", {
        action: { label: "Undo", onClick: () => { if (tx) addTx.mutate({ name: tx.name, amount: tx.amount, category: tx.category, date: tx.date, notes: tx.notes, source: tx.source }); } },
        duration: 5000,
      });
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col" style={{ padding: 24 }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }} className="text-foreground">Transaction History</h2>
          <p style={{ fontSize: 13 }} className="text-muted-foreground mt-0.5">See every transaction at a glance</p>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Sample data banner */}
      {isSampleMode && (
        <div className="flex items-center gap-2 mt-3 rounded-r-lg" style={{ background: '#F0FDF4', borderLeft: '3px solid #10B981', padding: '8px 12px' }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#065F46' }} />
          <span style={{ fontSize: 12, color: '#065F46' }}>Sample data shown. Connect your bank to see real transactions.</span>
        </div>
      )}

      {/* Transaction Categories mini-card */}
      <div className="mt-4 rounded-lg border border-border" style={{ background: 'hsl(var(--muted) / 0.3)', padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600 }} className="text-foreground mb-2">Transaction Categories</p>
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: 20, fontWeight: 700 }} className="text-foreground">${displayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#FEE2E2', color: '#DC2626' }}>
            ● {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}% vs. Last month
          </span>
        </div>
        {/* Segmented bar */}
        <div className="flex overflow-hidden" style={{ height: 8, borderRadius: 4, width: '100%' }}>
          {catTotals.map(c => {
            const pct = catBarTotal > 0 ? (c.total / catBarTotal) * 100 : (BAR_CATEGORIES.indexOf(c) === 0 ? 45 : BAR_CATEGORIES.indexOf(c) === 1 ? 28 : BAR_CATEGORIES.indexOf(c) === 2 ? 17 : 10);
            return <div key={c.id} style={{ width: `${pct}%`, backgroundColor: c.color, minWidth: pct > 0 ? 4 : 0 }} />;
          })}
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-2">
          {BAR_CATEGORIES.map(c => (
            <div key={c.id} className="flex items-center gap-1.5" style={{ fontSize: 12 }}>
              <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: c.color, display: 'inline-block' }} />
              <span className="text-muted-foreground">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="flex-1 mt-4">
        {grouped.map(([month, txs]) => (
          <div key={month}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 20, marginBottom: 8 }}>{month}</p>
            {txs.map(tx => {
              const meta = getCatMeta(tx.category);
              const Icon = meta.icon;
              return (
                <div key={tx.id} className="group flex items-center relative" style={{ gap: 12, padding: '10px 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: '50%', background: `${meta.color}20` }}>
                    <Icon size={16} style={{ color: meta.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }} className="text-foreground truncate">{tx.name}</div>
                    <div style={{ fontSize: 12 }} className="text-muted-foreground">{format(new Date(tx.date), "MMMM dd, h:mm a")}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: tx.amount >= 0 ? '#10B981' : '#DC2626' }}>
                      {tx.amount >= 0 ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11 }} className="text-muted-foreground">{tx.category}</div>
                  </div>
                  {/* Hover actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ position: 'absolute', right: 0 }}>
                    <button className="text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(tx.id)} style={{ color: '#DC2626' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {transactions.length > visibleCount && (
          <button onClick={() => setVisibleCount(v => v + 8)} className="w-full text-muted-foreground hover:text-foreground" style={{ fontSize: 13, padding: 8, borderRadius: 8, border: '1px solid hsl(var(--border))', marginTop: 12 }}>
            Load more
          </button>
        )}
      </div>

      {/* FAB */}
      <div className="flex justify-end mt-4">
        <button onClick={() => setShowAdd(true)} className="flex items-center justify-center shadow-lg hover:opacity-90 transition" style={{ width: 44, height: 44, borderRadius: '50%', background: '#10B981', color: 'white' }}>
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Add Transaction</h3>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
              <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-foreground">Cancel</button>
              <button onClick={handleAdd} disabled={addTx.isPending} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                {addTx.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action can be undone within 5 seconds.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
