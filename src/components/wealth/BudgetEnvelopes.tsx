import { useState } from "react";
import { Plus, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: "food", name: "Food", limit: 500 },
  { id: "transport", name: "Transport", limit: 200 },
  { id: "entertainment", name: "Entertainment", limit: 150 },
  { id: "shopping", name: "Shopping", limit: 300 },
  { id: "health", name: "Health", limit: 100 },
  { id: "other", name: "Other", limit: 200 },
];

function loadBudgets(): BudgetCategory[] {
  return loadStoredJson<BudgetCategory[]>("wealth_budgets", DEFAULT_CATEGORIES);
}
function saveBudgets(b: BudgetCategory[]) { saveStoredJson("wealth_budgets", b); }

function getCurrentMonthSpending(): Record<string, number> {
  try {
    const data = loadStoredJson<any[]>("wealth_monthly_spending", []);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthData = data.find((m: any) => m.month === currentMonth);
    if (!monthData) return {};
    const totals: Record<string, number> = {};
    for (const t of monthData.transactions) {
      if (t.amount < 0) {
        totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount);
      }
    }
    return totals;
  } catch { return {}; }
}

export default function BudgetEnvelopes() {
  const [budgets, setBudgets] = useState<BudgetCategory[]>(loadBudgets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLimit, setNewLimit] = useState("");

  const spending = getCurrentMonthSpending();
  const persist = (next: BudgetCategory[]) => { setBudgets(next); saveBudgets(next); };

  const startEdit = (b: BudgetCategory) => { setEditingId(b.id); setEditLimit(String(b.limit)); };
  const saveEdit = (id: string) => {
    persist(budgets.map(b => b.id === id ? { ...b, limit: Number(editLimit) || 0 } : b));
    setEditingId(null);
  };

  const addCategory = () => {
    if (!newName) return;
    persist([...budgets, { id: crypto.randomUUID(), name: newName, limit: Number(newLimit) || 0 }]);
    setNewName(""); setNewLimit(""); setShowAdd(false);
  };

  return (
    <section id="budget">
      <h2 className="text-lg font-semibold text-foreground mb-4">Budget Envelopes</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {budgets.map(b => {
          const spent = spending[b.name] || 0;
          const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
          const remaining = Math.max(0, b.limit - spent);
          const barColor = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500";

          return (
            <div key={b.id} className="group/card rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{b.name}</span>
                {editingId === b.id ? (
                  <button onClick={() => saveEdit(b.id)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <Check className="h-3 w-3" />
                  </button>
                ) : (
                  <button onClick={() => startEdit(b)} className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
              {editingId === b.id ? (
                <Input type="number" value={editLimit} onChange={e => setEditLimit(e.target.value)} className="h-7 text-xs" placeholder="Budget limit" />
              ) : (
                <p className="text-xs text-muted-foreground">${spent.toFixed(0)} / ${b.limit.toFixed(0)}</p>
              )}
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">${remaining.toFixed(0)} remaining</p>
            </div>
          );
        })}

        {/* Add category card */}
        {showAdd ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-4 space-y-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category" className="h-7 text-xs" />
            <Input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} placeholder="Limit" className="h-7 text-xs" />
            <div className="flex gap-1">
              <Button size="sm" onClick={addCategory} className="h-7 text-xs px-2">Add</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="h-7 text-xs px-2">Cancel</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="rounded-xl border border-dashed border-border bg-card/50 p-4 flex flex-col items-center justify-center gap-1 hover:bg-muted/30 transition-colors text-muted-foreground">
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium">Add Category</span>
          </button>
        )}
      </div>
    </section>
  );
}
