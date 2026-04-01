import { useState } from "react";
import { Pencil, Check, X, Target } from "lucide-react";
import { useUserFinances, useUpsertUserFinances } from "@/hooks/useUserFinances";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function SavingsProgress() {
  const { data: finances } = useUserFinances();
  const upsertFinances = useUpsertUserFinances();
  const [editing, setEditing] = useState(false);
  const [editGoal, setEditGoal] = useState("");
  const [editCurrent, setEditCurrent] = useState("");

  const goal = Number(finances?.savings_goal || 0);
  const current = Number(finances?.current_savings || 0);
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  const remaining = Math.max(0, goal - current);

  // Estimate when goal will be reached based on monthly income - expenses
  const monthlyIncome = Number(finances?.monthly_income || 0);
  const monthlySavingRate = monthlyIncome * 0.2; // assume 20% savings rate
  const monthsToGoal = monthlySavingRate > 0 ? Math.ceil(remaining / monthlySavingRate) : 0;
  const goalDate = new Date();
  goalDate.setMonth(goalDate.getMonth() + monthsToGoal);

  const startEdit = () => {
    setEditGoal(String(goal));
    setEditCurrent(String(current));
    setEditing(true);
  };

  const saveEdit = async () => {
    await upsertFinances.mutateAsync({
      savings_goal: parseFloat(editGoal) || 0,
      current_savings: parseFloat(editCurrent) || 0,
      onboarding_completed: true,
    });
    toast.success("Savings updated");
    setEditing(false);
  };

  return (
    <section>
      <div className="group rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Savings Goal</h2>
          </div>
          {!editing && (
            <button onClick={startEdit} className="p-2 rounded-lg hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Goal Amount</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" value={editGoal} onChange={(e) => setEditGoal(e.target.value)} className="pl-7" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Current Savings</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" value={editCurrent} onChange={(e) => setEditCurrent(e.target.value)} className="pl-7" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-success/10 text-success">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : goal > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-semibold">${current.toLocaleString()}</span>
              <span className="text-muted-foreground">${goal.toLocaleString()}</span>
            </div>
            <Progress value={pct} className="h-3" />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">{pct.toFixed(0)}%</span> complete
              </p>
              <p className="text-sm text-muted-foreground">
                ${remaining.toLocaleString()} to go
                {pct >= 100 ? " " : " "}
              </p>
            </div>
            {remaining > 0 && monthlySavingRate > 0 && (
              <p className="text-xs text-muted-foreground">
                At current rate → Goal reached by {goalDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-2">No savings goal set yet</p>
            <button onClick={startEdit} className="text-sm text-primary font-medium hover:underline">+ Set a savings goal</button>
          </div>
        )}
      </div>
    </section>
  );
}
