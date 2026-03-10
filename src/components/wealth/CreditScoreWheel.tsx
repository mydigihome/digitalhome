import { useState } from "react";
import { Pencil, Check, X, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useUserFinances, useUpsertUserFinances } from "@/hooks/useUserFinances";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CreditScoreWheel() {
  const { data: finances } = useUserFinances();
  const upsertFinances = useUpsertUserFinances();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const score = finances?.credit_score;

  const startEdit = () => {
    setEditValue(String(score || ""));
    setEditing(true);
  };

  const saveEdit = async () => {
    const val = parseInt(editValue);
    if (val && val >= 300 && val <= 850) {
      await upsertFinances.mutateAsync({ credit_score: val, onboarding_completed: true });
      toast.success("Credit score updated");
    }
    setEditing(false);
  };

  const clampedScore = Math.max(300, Math.min(850, score || 300));
  const percentage = ((clampedScore - 300) / 550) * 100;
  const angle = (percentage / 100) * 180;

  const getColor = (s: number) =>
    s >= 750 ? "hsl(var(--success))" : s >= 670 ? "hsl(142, 71%, 45%)" : s >= 580 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const getLabel = (s: number) =>
    s >= 750 ? "Excellent" : s >= 670 ? "Good" : s >= 580 ? "Fair" : "Poor";
  const getEmoji = (s: number) =>
    s >= 750 ? "🟢" : s >= 670 ? "🟢" : s >= 580 ? "🟡" : "🔴";

  const color = getColor(clampedScore);
  const label = getLabel(clampedScore);

  return (
    <section>
      <div className="group rounded-2xl border border-border bg-card p-8 text-center relative">
        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <Info className="h-4 w-4" />
          </button>
          {!editing && (
            <button onClick={startEdit} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Credit Score</p>

        {!score && !editing ? (
          <div className="py-6">
            <p className="text-sm text-muted-foreground mb-3">No credit score added yet</p>
            <button onClick={startEdit} className="text-sm text-primary font-medium hover:underline">+ Add your credit score</button>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <svg viewBox="0 0 240 140" className="w-64">
                {/* Background arc */}
                <path d="M 30 120 A 90 90 0 0 1 210 120" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
                {/* Score arc */}
                <path
                  d="M 30 120 A 90 90 0 0 1 210 120"
                  fill="none"
                  stroke={score ? color : "hsl(var(--muted))"}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${(angle / 180) * 282.7} 282.7`}
                  style={{ transition: "stroke-dasharray 1s ease-out" }}
                />
                {score && (
                  <>
                    <text x="120" y="100" textAnchor="middle" className="fill-foreground" fontSize="36" fontWeight="bold">{score}</text>
                    <text x="120" y="125" textAnchor="middle" fontSize="14" fill={color} fontWeight="600">{label} {getEmoji(clampedScore)}</text>
                  </>
                )}
              </svg>
            </div>

            {editing && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Input
                  type="number"
                  min={300}
                  max={850}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="300-850"
                  className="h-10 w-32 text-center text-lg font-bold"
                  autoFocus
                />
                <button onClick={saveEdit} className="p-2 rounded-lg hover:bg-success/10 text-success">
                  <Check className="h-5 w-5" />
                </button>
                <button onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}

        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 pt-4 border-t border-border text-left"
          >
            <h4 className="text-sm font-semibold text-foreground mb-2">Credit Score Ranges</h4>
            <div className="space-y-1.5">
              {[
                { range: "750-850", label: "Excellent", color: "bg-success", emoji: "🟢" },
                { range: "670-749", label: "Good", color: "bg-success/60", emoji: "🟢" },
                { range: "580-669", label: "Fair", color: "bg-warning", emoji: "🟡" },
                { range: "300-579", label: "Poor", color: "bg-destructive", emoji: "🔴" },
              ].map((r) => (
                <div key={r.range} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${r.color}`} />
                  <span className="text-muted-foreground w-20">{r.range}</span>
                  <span className="text-foreground font-medium">{r.label} {r.emoji}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
