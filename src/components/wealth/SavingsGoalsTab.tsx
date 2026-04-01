import { useState } from "react";
import { Plus, Pencil, Trash2, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  targetDate: string;
  color: string;
  backedBySpending: boolean;
}

const PASTEL_COLORS = [
  "bg-blue-50 border-blue-200",
  "bg-emerald-50 border-emerald-200",
  "bg-violet-50 border-violet-200",
  "bg-amber-50 border-amber-200",
  "bg-pink-50 border-pink-200",
  "bg-cyan-50 border-cyan-200",
  "bg-rose-50 border-rose-200",
  "bg-indigo-50 border-indigo-200",
];

function loadGoals(): SavingsGoal[] {
  return loadStoredJson<SavingsGoal[]>("wealth_savings_goals", []);
}
function saveGoals(g: SavingsGoal[]) { saveStoredJson("wealth_savings_goals", g); }

function getAverageMonthlySpending(): number {
  try {
    const data = loadStoredJson<any[]>("wealth_monthly_spending", []);
    if (data.length === 0) return 0;
    const totals = data.map((m: any) =>
      Math.abs(m.transactions.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + t.amount, 0))
    );
    return totals.reduce((a: number, b: number) => a + b, 0) / totals.length;
  } catch { return 0; }
}

function getAverageMonthlyIncome(): number {
  try {
    const data = loadStoredJson<any[]>("wealth_monthly_spending", []);
    if (data.length === 0) return 0;
    const totals = data.map((m: any) =>
      m.transactions.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0)
    );
    return totals.reduce((a: number, b: number) => a + b, 0) / totals.length;
  } catch { return 0; }
}

export default function SavingsGoalsTab() {
  const [goals, setGoals] = useState<SavingsGoal[]>(loadGoals);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentSaved: "", targetDate: "" });

  const persist = (next: SavingsGoal[]) => { setGoals(next); saveGoals(next); };

  const handleSave = () => {
    if (!form.name || !form.targetAmount || !form.targetDate) { toast.error("Fill name, target amount, and target date"); return; }
    if (editingId) {
      const next = goals.map(g => g.id === editingId ? {
        ...g, name: form.name, targetAmount: Number(form.targetAmount),
        currentSaved: Number(form.currentSaved) || 0, targetDate: form.targetDate,
      } : g);
      persist(next);
      toast.success("Goal updated");
    } else {
      const goal: SavingsGoal = {
        id: crypto.randomUUID(), name: form.name,
        targetAmount: Number(form.targetAmount), currentSaved: Number(form.currentSaved) || 0,
        targetDate: form.targetDate, color: PASTEL_COLORS[goals.length % PASTEL_COLORS.length],
        backedBySpending: false,
      };
      persist([...goals, goal]);
      toast.success("Goal added");
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: "", targetAmount: "", currentSaved: "", targetDate: "" });
    setEditingId(null); setShowForm(false);
  };

  const handleEdit = (g: SavingsGoal) => {
    setForm({ name: g.name, targetAmount: String(g.targetAmount), currentSaved: String(g.currentSaved), targetDate: g.targetDate });
    setEditingId(g.id); setShowForm(true);
  };

  const handleDelete = (id: string) => { persist(goals.filter(g => g.id !== id)); toast.success("Goal deleted"); };

  const toggleBacked = (id: string) => {
    const next = goals.map(g => g.id === id ? { ...g, backedBySpending: !g.backedBySpending } : g);
    persist(next);
  };

  const handleUpdateSaved = (id: string, amount: string) => {
    const next = goals.map(g => g.id === id ? { ...g, currentSaved: Number(amount) || 0 } : g);
    persist(next);
    // Check if completed
    const goal = next.find(g => g.id === id);
    if (goal && goal.currentSaved >= goal.targetAmount) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      toast.success(" Goal reached!");
    }
  };

  const avgSpending = getAverageMonthlySpending();
  const avgIncome = getAverageMonthlyIncome();
  const monthlyLeftover = avgIncome - avgSpending;

  return (
    <div className="space-y-6">
      <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
        <Plus className="h-4 w-4" /> Add Goal
      </Button>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Goal Name</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Emergency Fund, Vacation..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Target Amount ($)</label>
                  <Input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} placeholder="10000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Currently Saved ($)</label>
                  <Input type="number" value={form.currentSaved} onChange={e => setForm({ ...form, currentSaved: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Target Date</label>
                  <Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} />
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

      {/* Goal cards */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3"></div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No savings goals yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Create goals like "Emergency Fund" or "Dream Vacation" and track your progress toward each one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => {
            const pct = g.targetAmount > 0 ? Math.min(100, (g.currentSaved / g.targetAmount) * 100) : 0;
            const monthsRemaining = Math.max(1, Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (30.44 * 24 * 60 * 60 * 1000)));
            const remaining = Math.max(0, g.targetAmount - g.currentSaved);
            const monthlyNeeded = remaining / monthsRemaining;

            return (
              <motion.div key={g.id} layout className={`rounded-xl border p-5 space-y-4 ${g.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{g.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target: {new Date(g.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      {" · "}{monthsRemaining} month{monthsRemaining !== 1 ? "s" : ""} left
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(g)} className="p-1.5 rounded-md hover:bg-background/50 text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-md hover:bg-background/50 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-foreground font-medium">${g.currentSaved.toLocaleString()}</span>
                    <span className="text-muted-foreground">${g.targetAmount.toLocaleString()}</span>
                  </div>
                  <Progress value={pct} className="h-2.5" />
                  <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% complete</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly needed:</span>
                  <span className="font-semibold text-foreground">${monthlyNeeded.toFixed(2)}/mo</span>
                </div>

                {/* Update saved amount inline */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={g.currentSaved}
                    onChange={e => handleUpdateSaved(g.id, e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Current saved"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">saved</span>
                </div>

                {/* Backed by spending toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Backed by spending data
                  </div>
                  <Switch checked={g.backedBySpending} onCheckedChange={() => toggleBacked(g.id)} />
                </div>
                {g.backedBySpending && monthlyLeftover > 0 && (
                  <div className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                    Based on your avg spending, you have ~${monthlyLeftover.toFixed(0)}/mo available.
                    {monthlyLeftover >= monthlyNeeded
                      ? "  You're on track!"
                      : `  You need $${(monthlyNeeded - monthlyLeftover).toFixed(0)} more/mo.`}
                  </div>
                )}
                {g.backedBySpending && monthlyLeftover <= 0 && avgSpending > 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    Your avg spending exceeds your income. Consider reducing expenses.
                  </div>
                )}
                {g.backedBySpending && avgSpending === 0 && (
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                    Upload bank statements in Monthly Spending to enable this feature.
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
