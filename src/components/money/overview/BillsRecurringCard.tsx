import { useState, useRef } from "react";
import { CreditCard, Plus, MoreVertical, Pencil, Trash2, AlertTriangle, Paperclip } from "lucide-react";
import { useBills, useAddBill, useDeleteBill, useUpdateBill, type Bill } from "@/hooks/useBills";
import { toast } from "sonner";
import { format, isBefore, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_CYCLE = ["upcoming", "paid", "overdue"] as const;

function getMerchantDomain(merchant: string): string | null {
  const map: Record<string, string> = {
    spotify: "spotify.com", netflix: "netflix.com", hulu: "hulu.com",
    amazon: "amazon.com", apple: "apple.com", google: "google.com",
    "at&t": "att.com", verizon: "verizon.com", tmobile: "t-mobile.com",
    comcast: "comcast.com", xfinity: "xfinity.com", "state farm": "statefarm.com",
    geico: "geico.com", adobe: "adobe.com", microsoft: "microsoft.com",
    dropbox: "dropbox.com", gym: null, rent: null,
  };
  const lower = merchant.toLowerCase();
  for (const [key, domain] of Object.entries(map)) {
    if (lower.includes(key)) return domain;
  }
  return null;
}

function MerchantLogo({ merchant }: { merchant: string }) {
  const [failed, setFailed] = useState(false);
  const domain = getMerchantDomain(merchant);

  if (!domain || failed) {
    const letter = merchant.charAt(0).toUpperCase();
    const colors = ["hsl(var(--primary))", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];
    const color = colors[letter.charCodeAt(0) % colors.length];
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: `${color}20`, color }}
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={merchant}
      className="w-8 h-8 rounded-lg object-contain shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

function StatusBadge({ status, onClick }: { status: string; onClick: () => void }) {
  const styles: Record<string, { bg: string; text: string }> = {
    upcoming: { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" },
    paid: { bg: "hsl(var(--primary) / 0.1)", text: "hsl(var(--primary))" },
    overdue: { bg: "hsl(var(--destructive) / 0.1)", text: "hsl(var(--destructive))" },
  };
  const s = styles[status] || styles.upcoming;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer border-none transition-transform hover:scale-105"
      style={{ background: s.bg, color: s.text }}
      title="Click to change status"
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </button>
  );
}

export default function BillsRecurringCard() {
  const { user } = useAuth();
  const { data: bills = [] } = useBills();
  const addBill = useAddBill();
  const deleteBill = useDeleteBill();
  const updateBill = useUpdateBill();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ merchant: "", amount: "", due_date: format(new Date(), "yyyy-MM-dd"), frequency: "monthly", category: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBillId, setUploadingBillId] = useState<string | null>(null);

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

  const cycleStatus = async (bill: Bill) => {
    const currentIdx = STATUS_CYCLE.indexOf(bill.status as any);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    try {
      await updateBill.mutateAsync({ id: bill.id, status: nextStatus });
      toast.success(`Status changed to ${nextStatus}`);
    } catch { toast.error("Failed to update status"); }
  };

  const handleReceiptUpload = async (billId: string, file: File) => {
    if (!user) return;
    setUploadingBillId(billId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/receipts/${billId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("user-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("user-assets").getPublicUrl(path);
      await updateBill.mutateAsync({ id: billId, receipt_url: urlData.publicUrl } as any);
      toast.success("Receipt uploaded");
    } catch {
      toast.error("Failed to upload receipt");
    } finally {
      setUploadingBillId(null);
    }
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
          {bills.map(bill => (
            <div key={bill.id} className="relative flex-shrink-0 w-[200px] h-[130px] rounded-xl border border-border bg-muted/30 p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <MerchantLogo merchant={bill.merchant} />
                  <p className="text-sm font-semibold text-foreground truncate">{bill.merchant}</p>
                </div>
                <button onClick={() => setMenuOpen(menuOpen === bill.id ? null : bill.id)} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground shrink-0">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                {menuOpen === bill.id && (
                  <div className="absolute right-3 top-10 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[100px]">
                    <button className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted text-foreground"><Pencil className="w-3 h-3" /> Edit</button>
                    <button
                      onClick={() => {
                        setMenuOpen(null);
                        setUploadingBillId(bill.id);
                        fileInputRef.current?.click();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted text-foreground"
                    >
                      <Paperclip className="w-3 h-3" /> Receipt
                    </button>
                    <button onClick={() => { setDeleteTarget(bill.id); setMenuOpen(null); }} className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted text-destructive"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </div>
              <p className="text-base font-bold text-destructive">${bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Due {format(new Date(bill.due_date), "MMM d")}</span>
                <div className="flex items-center gap-1">
                  {(bill as any).receipt_url && (
                    <Paperclip className="w-3 h-3 text-primary" />
                  )}
                  <StatusBadge status={bill.status} onClick={() => cycleStatus(bill)} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setShowAdd(true)} className="flex-shrink-0 w-[200px] h-[130px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 transition">
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">Add Bill</span>
          </button>
        </div>
      )}

      {/* Hidden file input for receipt upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingBillId) {
            handleReceiptUpload(uploadingBillId, file);
          }
          e.target.value = "";
        }}
      />

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
