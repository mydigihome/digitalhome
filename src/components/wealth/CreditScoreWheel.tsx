import { useState, useEffect, useCallback } from "react";
import { Pencil, Check, X, Info, Lightbulb, Sparkles, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useUserFinances, useUpsertUserFinances } from "@/hooks/useUserFinances";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

interface CreditTip {
  tip: string;
  impact: string;
  category: string;
  fetchedAt: number;
  score: number;
}

const CACHE_KEY = "dh_credit_tip";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function CreditScoreWheel() {
  const { data: finances } = useUserFinances();
  const upsertFinances = useUpsertUserFinances();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [creditTip, setCreditTip] = useState<CreditTip | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);

  const score = finances?.credit_score;

  const fetchTip = useCallback(async (forceRefresh = false) => {
    if (!score) return;

    // Check cache
    if (!forceRefresh) {
      const cached = loadStoredJson<CreditTip | null>(CACHE_KEY, null);
      if (cached && Date.now() - cached.fetchedAt < WEEK_MS && cached.score === score) {
        setCreditTip(cached);
        return;
      }
    }

    setLoadingTip(true);
    try {
      const { data, error } = await supabase.functions.invoke("credit-tip", {
        body: { credit_score: score },
      });

      if (error) throw error;

      const tip: CreditTip = {
        tip: data.tip,
        impact: data.impact,
        category: data.category,
        fetchedAt: Date.now(),
        score,
      };
      setCreditTip(tip);
      saveStoredJson(CACHE_KEY, tip);
    } catch (e) {
      console.error("Failed to fetch credit tip:", e);
      // Use fallback
      const fallback: CreditTip = {
        tip: "Keep your credit utilization below 30% of your total available credit for the best impact on your score.",
        impact: "+10 to +30 pts",
        category: "Utilization",
        fetchedAt: Date.now(),
        score: score,
      };
      setCreditTip(fallback);
    } finally {
      setLoadingTip(false);
    }
  }, [score]);

  useEffect(() => {
    if (score) fetchTip();
  }, [score, fetchTip]);

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
                <path d="M 30 120 A 90 90 0 0 1 210 120" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
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
                    <text x="120" y="125" textAnchor="middle" fontSize="14" fill={color} fontWeight="600">{label}</text>
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
                { range: "750-850", label: "Excellent", color: "bg-success" },
                { range: "670-749", label: "Good", color: "bg-success/60" },
                { range: "580-669", label: "Fair", color: "bg-warning" },
                { range: "300-579", label: "Poor", color: "bg-destructive" },
              ].map((r) => (
                <div key={r.range} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${r.color}`} />
                  <span className="text-muted-foreground w-20">{r.range}</span>
                  <span className="text-foreground font-medium">{r.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* This Week's Credit Tip */}
        {score && (
          <div className="mt-6 pt-5 border-t border-border">
            <div className="rounded-xl p-4 text-left" style={{
              background: "linear-gradient(135deg, #7B5EA7, #6D4F9A)",
            }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-white/90" />
                  <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">This Week's Credit Tip</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <Sparkles className="h-3 w-3 text-white/80" />
                    <span className="text-[10px] font-medium text-white/80">AI Powered</span>
                  </div>
                  <button
                    onClick={() => fetchTip(true)}
                    disabled={loadingTip}
                    className="p-1 rounded-md hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-white/70 ${loadingTip ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {loadingTip && !creditTip ? (
                <div className="py-3">
                  <div className="h-3 w-3/4 rounded bg-white/20 animate-pulse mb-2" />
                  <div className="h-3 w-1/2 rounded bg-white/20 animate-pulse" />
                </div>
              ) : creditTip ? (
                <>
                  <p className="text-sm text-white/95 leading-relaxed mb-3">{creditTip.tip}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-white px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.3)", border: "1px solid rgba(16,185,129,0.4)" }}>
                      Potential: {creditTip.impact}
                    </span>
                    <span className="text-[11px] text-white/60">{creditTip.category}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
