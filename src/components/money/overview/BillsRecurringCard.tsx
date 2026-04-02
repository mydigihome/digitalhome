import { useState } from "react";
import { CreditCard, Plus, MoreVertical, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useBills, useAddBill, useDeleteBill, type Bill } from "@/hooks/useBills";
import { toast } from "sonner";
import { format, isBefore, addDays } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BillsRecurringCard() {
  const { data: bills = [] } = useBills();
  const addBill = useAddBill();
  const deleteBill = useDeleteBill();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ merchant: "", amount: "", due_date: format(new Date(), "yyyy-MM-dd"), frequency: "monthly", category: "" });

  const handleAdd = async () => {
    if (!form.merchant || !form.amount) return;
    try {
      await addBill.mutateAsync({
        merchant: form.merchant,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
        frequency: form.frequency,
        category: form.category || null,
        status: "upcoming",
      });
      setForm({ merchant: "", amount: "", due_date: format(new Date(), "yyyy-MM-dd"), frequency: "monthly", category: "" });
      setShowAdd(false);
      toast.success("Bill added");
    } catch { toast.error("Failed to add bill"); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const bill = bills.find(b => b.id === deleteTarget);
    try {
      await deleteBill.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      toast.success("Bill deleted", {
        action: { label: "Undo", onClick: () => { if (bill) addBill.mutate({ merchant: bill.merchant, amount: bill.amount, due_date: bill.due_date, frequency: bill.frequency, category: bill.category, status: bill.status }); } },
        duration: 5000,
      });
    } catch { toast.error("Failed to delete"); }
  };

  const getStatus = (dueDate: string) => {
    const d = new Date(dueDate);
    const now = new Date();
    if (isBefore(d, now)) return { label: "Overdue", cls: "bg-destructive/10 text-destructive" };
    if (isBefore(d, addDays(now, 7))) return { label: "Due Soon", cls: "bg-warning/10 text-warning" };
    return { label: "Upcoming", cls: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="w-4.5 h-4.5 text-foreground" />
        <h3 className="text-base font-semibold text-foreground">Bills & Recurring Payments</h3>
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">Recurring charges detected from your account</p>

      {bills.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No recurring bills detected yet.</p>
          <button onClick={() => setShowAdd(true)} className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground">Add Bill</button>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {bills.map(bill => {
            const status = getStatus(bill.due_date);
            return (
              <div key={bill.id} className="relative flex-shrink-0 w-[200px] h-[120px] rounded-xl border border-border bg-muted/30 p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-foreground truncate pr-6">{bill.merchant}</p>
                  <button onClick={() => setMenuOpen(menuOpen === bill.id ? null : bill.id)} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  {menuOpen === bill.id && (
                    <div className="absolute right-3 top-10 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[100px]">
                      <button className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted text-foreground"><Pencil className="w-3 h-3" /> Edit</button>
                      <button onClick={() => { setDeleteTarget(bill.id); setMenuOpen(null); }} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted text-destructive"><Trash2 className="w-3 h-3" /> Delete</button>
                    </div>
                  )}
                </div>
                <p className="text-base font-bold text-destructive">${bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Due {format(new Date(bill.due_date), "MMM d")}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowAdd(true)} className="flex-shrink-0 w-[200px] h-[120px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 transition">
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">Add Bill</span>
          </button>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Add Bill</h3>
            <div className="space-y-3">
              <input value={form.merchant} onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} placeholder="Merchant" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <input value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="annual">Annual</option>
              </select>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category (optional)" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-foreground">Cancel</button>
              <button onClick={handleAdd} disabled={addBill.isPending} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                {addBill.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bill?</AlertDialogTitle>
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
