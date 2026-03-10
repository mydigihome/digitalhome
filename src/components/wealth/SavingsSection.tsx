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

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  targetDate: string;
  color: string;
  backedBySpending: boolean;
}

const PASTEL_COLORS = [
  "bg-blue-50 border-blue-200", "bg-emerald-50 border-emerald-200", "bg-violet-50 border-violet-200",
  "bg-amber-50 border-amber-200", "bg-pink-50 border-pink-200", "bg-cyan-50 border-cyan-200",
];

function loadGoals(): SavingsGoal[] { return loadStoredJson<SavingsGoal[]>("wealth_savings_goals", []); }
function saveGoals(g: SavingsGoal[]) { saveStoredJson("wealth_savings_goals", g); }

function getMonthlyLeftover(): number {
  try {
    const data = loadStoredJson<any[]>("wealth_monthly_spending", []);
    if (data.length === 0) return 0;
    const totals = data.map((m: any) => {
      const inc = m.transactions.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
      const exp = Math.abs(m.transactions.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + t.amount, 0));
      return inc - exp;
    });
    return totals.reduce((a: number, b: number) => a + b, 0) / totals.length;
  } catch { return 0; }
}

export default function SavingsSection() {
  const [goals, setGoals] = useState<SavingsGoal[]>(loadGoals);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentSaved: "", targetDate: "" });

  const persist = (next: SavingsGoal[]) => { setGoals(next); saveGoals(next); };
  const resetForm = () => { setForm({ name: "", targetAmount: "", currentSaved: "", targetDate: "" }); setEditingId(null); setShowForm(false); };

  const handleSave = () => {
    if (!form.name || !form.targetAmount || !form.targetDate) { toast.error("Fill name, target, and date"); return; }
    if (editingId) {
      persist(goals.map(g => g.id === editingId ? { ...g, name: form.name, targetAmount: Number(form.targetAmount), currentSaved: Number(form.currentSaved) || 0, targetDate: form.targetDate } : g));
      toast.success("Updated");
    } else {
      persist([...goals, { id: crypto.randomUUID(), name: form.name, targetAmount: Number(form.targetAmount), currentSaved: Number(form.currentSaved) || 0, targetDate: form.targetDate, color: PASTEL_COLORS[goals.length % PASTEL_COLORS.length], backedBySpending: false }]);
      toast.success("Goal added");
    }
    resetForm();
  };

  const handleEdit = (g: SavingsGoal) => {
    setForm({ name: g.name, targetAmount: String(g.targetAmount), currentSaved: String(g.currentSaved), targetDate: g.targetDate });
    setEditingId(g.id); setShowForm(true);
  };

  const handleDelete = (id: string) => { persist(goals.filter(g => g.id !== id)); toast.success("Deleted"); };
  const toggleBacked = (id: string) => persist(goals.map(g => g.id === id ? { ...g, backedBySpending: !g.backedBySpending } : g));
  const updateSaved = (id: string, v: string) => {
    const next = goals.map(g => g.id === id ? { ...g, currentSaved: Number(v) || 0 } : g);
    persist(next);
    const g = next.find(g => g.id === id);
    if (g && g.currentSaved >= g.targetAmount) { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); toast.success("🎉 Goal reached!"); }
  };

  const leftover = getMonthlyLeftover();

  return (
    <section id="goals">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Savings Goals</h2>
        <Button size="sm" variant="outline" onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Goal
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="text-xs font-medium text-foreground mb-1 block">Goal Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Emergency Fund..." className="h-8 text-sm" /></div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Target ($)</label><Input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} placeholder="10000" className="h-8 text-sm" /></div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Saved ($)</label><Input type="number" value={form.currentSaved} onChange={e => setForm({ ...form, currentSaved: e.target.value })} placeholder="0" className="h-8 text-sm" /></div>
                <div><label className="text-xs font-medium text-foreground mb-1 block">Target Date</label><Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} className="h-8 text-sm" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>{editingId ? "Update" : "Add"}</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-base font-semibold text-foreground mb-1">No savings goals yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Create goals and track your progress toward each one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map(g => {
            const pct = g.targetAmount > 0 ? Math.min(100, (g.currentSaved / g.targetAmount) * 100) : 0;
            const monthsLeft = Math.max(1, Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (30.44 * 24 * 60 * 60 * 1000)));
            const remaining = Math.max(0, g.targetAmount - g.currentSaved);
            const monthlyNeeded = remaining / monthsLeft;

            return (
              <motion.div key={g.id} layout className={`rounded-xl border p-5 space-y-3 ${g.color}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{g.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(g.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} · {monthsLeft}mo left
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover/goal:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(g)} className="p-1 rounded hover:bg-background/50 text-muted-foreground"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => handleDelete(g.id)} className="p-1 rounded hover:bg-background/50 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">${g.currentSaved.toLocaleString()}</span>
                    <span className="text-muted-foreground">${g.targetAmount.toLocaleString()}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-[11px] text-muted-foreground mt-1">{pct.toFixed(0)}% · Need ${monthlyNeeded.toFixed(0)}/mo</p>
                </div>
                <Input type="number" value={g.currentSaved} onChange={e => updateSaved(g.id, e.target.value)} className="h-7 text-xs" />
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><TrendingDown className="h-3 w-3" /> Surplus from spending</div>
                  <Switch checked={g.backedBySpending} onCheckedChange={() => toggleBacked(g.id)} />
                </div>
                {g.backedBySpending && leftover > 0 && (
                  <div className="text-[11px] text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5">
                    ~${leftover.toFixed(0)}/mo available {leftover >= monthlyNeeded ? "✅ On track" : `⚠️ Need $${(monthlyNeeded - leftover).toFixed(0)} more`}
                  </div>
                )}
                {g.backedBySpending && leftover <= 0 && (
                  <div className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">Upload spending data to enable this feature</div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
