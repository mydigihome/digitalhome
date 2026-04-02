import { useState, useMemo } from "react";
import { format, startOfMonth, subMonths } from "date-fns";
import { Plus, Pencil, Trash2, ShoppingCart, Home, Tv, Utensils, DollarSign, MoreHorizontal } from "lucide-react";
import { useTransactions, useAddTransaction, useDeleteTransaction, type Transaction } from "@/hooks/useTransactions";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CATEGORIES = [
  { id: "Living Cost", color: "#7B5EA7", icon: Home },
  { id: "Subscription", color: "#A78BFA", icon: Tv },
  { id: "Lifestyle", color: "#C4B5FD", icon: ShoppingCart },
  { id: "Food", color: "#EDE9FE", icon: Utensils },
  { id: "Income", color: "#10B981", icon: DollarSign },
  { id: "Other", color: "#9CA3AF", icon: MoreHorizontal },
];

function getCatMeta(cat: string) {
  return CATEGORIES.find(c => c.id === cat) || CATEGORIES[5];
}

export default function TransactionHistoryPanel() {
  const { data: transactions = [] } = useTransactions();
  const addTx = useAddTransaction();
  const deleteTx = useDeleteTransaction();
  const [showAdd, setShowAdd] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ name: "", amount: "", category: "Living Cost", date: format(new Date(), "yyyy-MM-dd"), notes: "" });

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
  const pctChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  // Category breakdown for bar
  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonthTxs.forEach(t => { map[t.category] = (map[t.category] || 0) + Math.abs(t.amount); });
    return CATEGORIES.filter(c => c.id !== "Income").map(c => ({ ...c, total: map[c.id] || 0 })).filter(c => c.total > 0);
  }, [thisMonthTxs]);

  const catBarTotal = catTotals.reduce((s, c) => s + c.total, 0) || 1;

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
    const tx = transactions.find(t => t.id === deleteTarget);
    try {
      await deleteTx.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      toast.success("Transaction deleted", {
        action: { label: "Undo", onClick: () => {
          if (tx) addTx.mutate({ name: tx.name, amount: tx.amount, category: tx.category, date: tx.date, notes: tx.notes, source: tx.source });
        }},
        duration: 5000,
      });
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] h-full flex flex-col">
      <div className="p-5 pb-3">
        <h2 className="text-xl font-bold text-foreground">Transaction History</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">See every transaction at a glance</p>
      </div>

      {/* Category breakdown mini-card */}
      {thisMonthTotal > 0 && (
        <div className="mx-5 mb-4 p-4 rounded-lg bg-muted/40 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-foreground">${thisMonthTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pctChange > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
              {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}% vs. Last month
            </span>
          </div>
          {/* Segmented bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden mb-2">
            {catTotals.map(c => (
              <div key={c.id} style={{ width: `${(c.total / catBarTotal) * 100}%`, backgroundColor: c.color }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {catTotals.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                {c.id}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto px-5">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">No transactions yet.</p>
            <p className="text-xs text-muted-foreground mb-3">Add one manually or connect your bank.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">Add Transaction</button>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-foreground">Connect Bank</button>
            </div>
          </div>
        ) : (
          grouped.map(([month, txs]) => (
            <div key={month} className="mb-4">
              <p className="text-[13px] font-bold text-muted-foreground mb-2">{month}</p>
              {txs.map(tx => {
                const meta = getCatMeta(tx.category);
                const Icon = meta.icon;
                return (
                  <div key={tx.id} className="group flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${meta.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.date), "MMM d, yyyy • h:mm a")}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${tx.amount >= 0 ? "text-success" : "text-destructive"}`}>
                        {tx.amount >= 0 ? "+" : "-"}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{tx.category}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(tx.id)} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        {transactions.length > visibleCount && (
          <button onClick={() => setVisibleCount(v => v + 8)} className="w-full text-sm font-medium text-primary py-2 mb-2 hover:underline">Load more</button>
        )}
      </div>

      {/* FAB */}
      <div className="p-4 flex justify-end">
        <button onClick={() => setShowAdd(true)} className="w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition">
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
