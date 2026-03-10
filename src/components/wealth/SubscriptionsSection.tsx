import { useState, useMemo } from "react";
import { Plus, X, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addMonths, addWeeks, addYears, addDays, format } from "date-fns";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

export interface Subscription {
  id: string;
  name: string;
  category: string;
  cycle: "weekly" | "monthly" | "quarterly" | "yearly";
  cost: number;
  startDate: string;
  nextBillingDate: string;
  annualCost: number;
  status: "active" | "cancelled" | "ended";
  autoRenewal: boolean;
  paymentMethod: string;
  notes: string;
}

const CATEGORIES = ["Streaming", "Software", "Health", "Food", "Work", "Other"];
const CYCLES = ["weekly", "monthly", "quarterly", "yearly"] as const;
const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  ended: "bg-muted text-muted-foreground",
};

function calcNextBilling(startDate: string, cycle: string): string {
  if (!startDate) return "";
  let d = new Date(startDate);
  const now = new Date();
  while (d < now) {
    if (cycle === "weekly") d = addWeeks(d, 1);
    else if (cycle === "monthly") d = addMonths(d, 1);
    else if (cycle === "quarterly") d = addMonths(d, 3);
    else d = addYears(d, 1);
  }
  return format(d, "yyyy-MM-dd");
}

function calcAnnual(cost: number, cycle: string): number {
  if (cycle === "weekly") return cost * 52;
  if (cycle === "monthly") return cost * 12;
  if (cycle === "quarterly") return cost * 4;
  return cost;
}

function loadSubs(): Subscription[] {
  return loadStoredJson<Subscription[]>("wealth_subscriptions", []);
}
function saveSubs(s: Subscription[]) { saveStoredJson("wealth_subscriptions", s); }

type FormState = {
  name: string; category: string; cycle: string; cost: string; startDate: string;
  status: string; autoRenewal: boolean; paymentMethod: string; notes: string;
};
const emptyForm: FormState = { name: "", category: "Other", cycle: "monthly", cost: "", startDate: "", status: "active", autoRenewal: true, paymentMethod: "", notes: "" };

export default function SubscriptionsSection() {
  const [subs, setSubs] = useState<Subscription[]>(loadSubs);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const persist = (next: Subscription[]) => { setSubs(next); saveSubs(next); };
  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const handleSave = () => {
    if (!form.name || !form.cost) { toast.error("Fill name and cost"); return; }
    const cycle = form.cycle as Subscription["cycle"];
    const cost = Number(form.cost);
    const nextBillingDate = calcNextBilling(form.startDate, cycle);
    const annualCost = calcAnnual(cost, cycle);
    const status = form.status as Subscription["status"];

    if (editingId) {
      persist(subs.map(s => s.id === editingId ? { ...s, name: form.name, category: form.category, cycle, cost, startDate: form.startDate, nextBillingDate, annualCost, status, autoRenewal: form.autoRenewal, paymentMethod: form.paymentMethod, notes: form.notes } : s));
      toast.success("Updated");
    } else {
      persist([...subs, { id: crypto.randomUUID(), name: form.name, category: form.category, cycle, cost, startDate: form.startDate, nextBillingDate, annualCost, status, autoRenewal: form.autoRenewal, paymentMethod: form.paymentMethod, notes: form.notes }]);
      toast.success("Subscription added");
    }
    resetForm();
  };

  const handleEdit = (s: Subscription) => {
    setForm({ name: s.name, category: s.category, cycle: s.cycle, cost: String(s.cost), startDate: s.startDate, status: s.status, autoRenewal: s.autoRenewal, paymentMethod: s.paymentMethod, notes: s.notes });
    setEditingId(s.id); setShowForm(true);
  };

  const handleDelete = (id: string) => { persist(subs.filter(s => s.id !== id)); toast.success("Deleted"); };

  const activeSubs = subs.filter(s => s.status === "active");
  const totalMonthly = activeSubs.reduce((sum, s) => {
    if (s.cycle === "weekly") return sum + s.cost * 4.33;
    if (s.cycle === "monthly") return sum + s.cost;
    if (s.cycle === "quarterly") return sum + s.cost / 3;
    return sum + s.cost / 12;
  }, 0);
  const totalAnnual = activeSubs.reduce((sum, s) => sum + s.annualCost, 0);

  return (
    <section id="subscriptions">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Subscriptions</h2>
        <Button size="sm" variant="outline" onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Subscription
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="text-xs font-medium text-foreground mb-1 block">Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Netflix..." className="h-8 text-sm" /></div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Category</label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Billing Cycle</label>
                  <Select value={form.cycle} onValueChange={v => setForm({ ...form, cycle: v })}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger><SelectContent>{CYCLES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent></Select>
                </div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Cost ($)</label><Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="9.99" className="h-8 text-sm" /></div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Start Date</label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="h-8 text-sm" /></div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Status</label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="ended">Ended</SelectItem></SelectContent></Select>
                </div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Payment Method</label><Input value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} placeholder="Visa ****1234" className="h-8 text-sm" /></div>
                <div className="sm:col-span-2"><label className="text-xs font-medium text-foreground mb-1 block">Notes</label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="h-8 text-sm" /></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.autoRenewal} onChange={e => setForm({ ...form, autoRenewal: e.target.checked })} className="rounded" />
                  Auto-renewal
                </label>
                <div className="flex-1" />
                <Button size="sm" onClick={handleSave}>{editingId ? "Update" : "Add"}</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {subs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-base font-semibold text-foreground mb-1">No subscriptions yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Track your recurring subscriptions to see how much you're spending.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Cycle</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Cost</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Start</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Next Billing</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Annual</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Auto</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Payment</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Notes</th>
                  <th className="px-3 py-2.5 w-14"></th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s, i) => (
                  <tr key={s.id} className={`group/row border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${s.status !== "active" ? "opacity-50" : ""}`}>
                    <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground">{s.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.category}</td>
                    <td className="px-3 py-2.5 text-muted-foreground capitalize">{s.cycle}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-foreground">${(s.cost || 0).toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.startDate || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.nextBillingDate || "—"}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-foreground">${(s.annualCost || 0).toFixed(0)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_STYLES[s.status]}`}>{s.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">{s.autoRenewal ? "✓" : "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[80px]">{s.paymentMethod || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[100px]">{s.notes || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(s)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Summary bar */}
          <div className="border-t border-border bg-muted/20 px-3 py-3 flex items-center gap-6 text-xs">
            <span className="text-muted-foreground">Total Monthly: <span className="font-semibold text-foreground">${totalMonthly.toFixed(2)}</span></span>
            <span className="text-muted-foreground">Total Annual: <span className="font-semibold text-foreground">${totalAnnual.toFixed(0)}</span></span>
            <span className="text-muted-foreground">Active: <span className="font-semibold text-foreground">{activeSubs.length}</span></span>
          </div>
        </div>
      )}
    </section>
  );
}
