import { useState } from "react";
import { Plus, Check, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays, format, isAfter, isBefore, startOfDay, endOfDay, addMonths, addWeeks, addYears } from "date-fns";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  recurring: boolean;
}

function load(): Bill[] {
  try { return JSON.parse(localStorage.getItem("wealth_bills") || "[]"); } catch { return []; }
}
function save(b: Bill[]) { localStorage.setItem("wealth_bills", JSON.stringify(b)); }

function getSubscriptionBills(): Bill[] {
  try {
    const subs = JSON.parse(localStorage.getItem("wealth_subscriptions") || "[]");
    return subs
      .filter((s: any) => s.status === "active" && s.nextBillingDate)
      .map((s: any) => ({
        id: `sub-${s.id}`,
        name: s.name,
        amount: s.amount,
        dueDate: s.nextBillingDate,
        paid: false,
        recurring: true,
      }));
  } catch { return []; }
}

export default function BillsCalendar() {
  const [manualBills, setManualBills] = useState<Bill[]>(load);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", dueDate: "" });

  const persist = (next: Bill[]) => { setManualBills(next); save(next); };

  const allBills = [...getSubscriptionBills(), ...manualBills]
    .filter(b => {
      const due = new Date(b.dueDate);
      const now = startOfDay(new Date());
      const limit = endOfDay(addDays(now, 30));
      return isBefore(due, limit);
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const today = startOfDay(new Date());
  const weekEnd = endOfDay(addDays(today, 7));

  const dueThisWeek = allBills.filter(b => !b.paid && isBefore(new Date(b.dueDate), weekEnd)).reduce((s, b) => s + b.amount, 0);
  const dueThisMonth = allBills.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0);
  const totalUpcoming = allBills.filter(b => !b.paid).length;

  const togglePaid = (id: string) => {
    if (id.startsWith("sub-")) return; // subscription bills can't be toggled here
    persist(manualBills.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
  };

  const addBill = () => {
    if (!form.name || !form.amount || !form.dueDate) return;
    persist([...manualBills, { id: crypto.randomUUID(), name: form.name, amount: Number(form.amount), dueDate: form.dueDate, paid: false, recurring: false }]);
    setForm({ name: "", amount: "", dueDate: "" });
    setShowAdd(false);
  };

  const removeBill = (id: string) => persist(manualBills.filter(b => b.id !== id));

  return (
    <section id="bills">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Bills & Due Dates</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Bill
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-0.5">Due This Week</p>
          <p className="text-lg font-bold text-foreground">${dueThisWeek.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-0.5">Due This Month</p>
          <p className="text-lg font-bold text-foreground">${dueThisMonth.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-0.5">Total Upcoming</p>
          <p className="text-lg font-bold text-foreground">{totalUpcoming} bills</p>
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs font-medium text-foreground mb-1 block">Bill Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-8 text-sm" placeholder="Rent, Gym..." />
              </div>
              <div className="w-28">
                <label className="text-xs font-medium text-foreground mb-1 block">Amount</label>
                <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="h-8 text-sm" placeholder="$" />
              </div>
              <div className="w-36">
                <label className="text-xs font-medium text-foreground mb-1 block">Due Date</label>
                <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="h-8 text-sm" />
              </div>
              <Button size="sm" onClick={addBill} className="h-8">Add</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bills timeline */}
      {allBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-base font-semibold text-foreground mb-1">No upcoming bills</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Add subscriptions or one-off bills to see your upcoming due dates here.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {allBills.map(bill => {
            const due = new Date(bill.dueDate);
            const overdue = !bill.paid && isBefore(due, today);
            const isManual = !bill.id.startsWith("sub-");

            return (
              <div
                key={bill.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                  bill.paid ? "border-border/50 bg-muted/20 opacity-60" : overdue ? "border-red-200 bg-red-50/50" : "border-border bg-card"
                }`}
              >
                {isManual ? (
                  <button
                    onClick={() => togglePaid(bill.id)}
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      bill.paid ? "bg-emerald-500 border-emerald-500 text-white" : "border-border hover:border-primary"
                    }`}
                  >
                    {bill.paid && <Check className="h-3 w-3" />}
                  </button>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                )}
                <span className={`flex-1 text-sm font-medium ${bill.paid ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {bill.name}
                </span>
                {overdue && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                <span className="text-sm font-semibold text-foreground">${bill.amount.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground w-20 text-right">{format(due, "MMM d")}</span>
                {isManual && (
                  <button onClick={() => removeBill(bill.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
