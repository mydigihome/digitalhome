import { useState } from "react";
import { Plus, X, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

export interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  cycle: "monthly" | "yearly";
  nextBillingDate: string;
  status: "active" | "paused" | "cancelled";
}

const CATEGORIES = ["Streaming", "Software", "Health", "Food", "Other"];
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

function loadSubscriptions(): Subscription[] {
  return loadStoredJson<Subscription[]>("wealth_subscriptions", []);
}
function saveSubscriptions(s: Subscription[]) { saveStoredJson("wealth_subscriptions", s); }

export default function SubscriptionsTab() {
  const [subs, setSubs] = useState<Subscription[]>(loadSubscriptions);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; category: string; amount: string; cycle: "monthly" | "yearly"; nextBillingDate: string; status: "active" | "paused" | "cancelled" }>({ name: "", category: "Other", amount: "", cycle: "monthly", nextBillingDate: "", status: "active" });

  const persist = (next: Subscription[]) => { setSubs(next); saveSubscriptions(next); };

  const handleSave = () => {
    if (!form.name || !form.amount) { toast.error("Fill name and amount"); return; }
    if (editingId) {
      const next = subs.map(s => s.id === editingId ? {
        ...s, name: form.name, category: form.category, amount: Number(form.amount),
        cycle: form.cycle as "monthly" | "yearly", nextBillingDate: form.nextBillingDate,
        status: form.status as "active" | "paused" | "cancelled",
      } : s);
      persist(next);
      toast.success("Updated");
    } else {
      const sub: Subscription = {
        id: crypto.randomUUID(), name: form.name, category: form.category,
        amount: Number(form.amount), cycle: form.cycle as "monthly" | "yearly",
        nextBillingDate: form.nextBillingDate, status: form.status as "active" | "paused" | "cancelled",
      };
      persist([...subs, sub]);
      toast.success("Subscription added");
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: "", category: "Other", amount: "", cycle: "monthly" as "monthly" | "yearly", nextBillingDate: "", status: "active" as "active" | "paused" | "cancelled" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (s: Subscription) => {
    setForm({ name: s.name, category: s.category, amount: String(s.amount), cycle: s.cycle, nextBillingDate: s.nextBillingDate, status: s.status });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => { persist(subs.filter(s => s.id !== id)); toast.success("Deleted"); };

  const totalMonthly = subs.filter(s => s.status !== "cancelled").reduce((sum, s) => sum + (s.cycle === "yearly" ? s.amount / 12 : s.amount), 0);
  const totalYearly = subs.filter(s => s.status !== "cancelled").reduce((sum, s) => sum + (s.cycle === "yearly" ? s.amount : s.amount * 12), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Total Monthly Cost</p>
          <p className="text-2xl font-bold text-foreground">${totalMonthly.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">Total Yearly Cost</p>
          <p className="text-2xl font-bold text-foreground">${totalYearly.toFixed(2)}</p>
        </div>
      </div>

      {/* Add button */}
      <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
        <Plus className="h-4 w-4" /> Add Subscription
      </Button>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Netflix, Spotify..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Amount ($)</label>
                  <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="9.99" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Billing Cycle</label>
                  <Select value={form.cycle} onValueChange={v => setForm({ ...form, cycle: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Next Billing Date</label>
                  <Input type="date" value={form.nextBillingDate} onChange={e => setForm({ ...form, nextBillingDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave}>{editingId ? "Update" : "Add"}</Button>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {subs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No subscriptions yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Track your recurring subscriptions to see how much you're spending each month.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cycle</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Next Billing</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.category}</td>
                    <td className="px-4 py-3 text-foreground">${s.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{s.cycle}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.nextBillingDate || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(s)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
