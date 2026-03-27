import { useState, useRef } from "react";
import { Pencil, Sparkles, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function aiEstimatedGoal(name: string): number {
  const n = name.toLowerCase();
  if (/property|house|real estate|home/.test(n)) return 50000;
  if (/business|startup|company/.test(n)) return 25000;
  if (/car|vehicle/.test(n)) return 15000;
  if (/travel|trip|vacation/.test(n)) return 5000;
  if (/education|school|course|degree/.test(n)) return 10000;
  return 20000;
}

function barGradient(pct: number) {
  if (pct >= 67) return "linear-gradient(90deg, #22c55e, #4ade80)";
  if (pct >= 34) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
  return "linear-gradient(90deg, #4648d4, #6063ee)";
}

function barColor(pct: number) {
  if (pct >= 67) return "#22c55e";
  if (pct >= 34) return "#f59e0b";
  return "#4648d4";
}

interface Props {
  projectId: string;
  projectName: string;
  financialGoal: number | null;
  financialGoalSetBy: string | null;
}

export default function ProjectFinancialBar({ projectId, projectName, financialGoal, financialGoalSetBy }: Props) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const qc = useQueryClient();
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const savedAmount = 45234;
  const monthlySavings = 1300;
  const goalAmount = financialGoal || aiEstimatedGoal(projectName);
  const isAiEstimate = !financialGoal;
  const progressPercent = goalAmount ? Math.min((savedAmount / goalAmount) * 100, 100) : 0;
  const remaining = Math.max(goalAmount - savedAmount, 0);
  const monthsAway = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : 0;

  let insightText: string;
  if (progressPercent >= 100) {
    insightText = "Goal reached! You have enough saved for this project.";
  } else if (progressPercent > 66) {
    insightText = `Almost there! You're ${monthsAway} months away at your current savings rate.`;
  } else if (progressPercent >= 34) {
    insightText = `Solid progress. At your current rate you'll reach this goal in ${monthsAway} months.`;
  } else {
    insightText = `You're ${Math.round(progressPercent)}% there. Increase savings by $200/mo to hit this goal in ${monthsAway} months.`;
  }

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setHovered(false), 200);
  };

  const handleSaveGoal = async () => {
    const val = parseFloat(editValue);
    if (!val || val <= 0) { toast.error("Enter a valid amount"); return; }
    await supabase.from("projects").update({ financial_goal: val, financial_goal_set_by: "user" } as any).eq("id", projectId);
    qc.invalidateQueries({ queryKey: ["projects"] });
    setEditing(false);
    toast.success("Goal updated");
  };

  return (
    <>
      {/* Progress bar */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "4px",
          borderRadius: "0 0 24px 24px", backgroundColor: "#f3f3f8", overflow: "hidden", zIndex: 5,
        }}
      >
        <div
          style={{
            height: "100%", width: `${progressPercent}%`,
            background: barGradient(progressPercent), borderRadius: "inherit",
            transition: "width 600ms cubic-bezier(0.25, 1, 0.5, 1)",
            animation: progressPercent >= 100 ? "pulse 2s infinite" : undefined,
          }}
        />
      </div>

      {/* Hover zone */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "24px", zIndex: 8 }}
      />

      {/* Hover panel */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "absolute", bottom: "4px", left: "12px", right: "12px",
          backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px",
          boxShadow: "0 -8px 32px rgba(70,69,84,0.12)", border: "1px solid #f0f0f5",
          transform: hovered ? "translateY(0)" : "translateY(8px)",
          opacity: hovered ? 1 : 0,
          transition: "all 250ms cubic-bezier(0.25,1,0.5,1)",
          pointerEvents: hovered ? "auto" : "none", zIndex: 10,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Row 1 — Goal */}
        <div className="flex justify-between items-center">
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#767586" }}>
            Financial Goal
          </span>
          <div className="flex items-center gap-2">
            {editing ? (
              <div className="flex items-center gap-1">
                <span style={{ color: "#767586", fontSize: "14px", fontWeight: 700 }}>$</span>
                <input
                  type="number" autoFocus value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  style={{ background: "#f3f3f8", borderRadius: "12px", padding: "4px 8px", fontSize: "14px", fontWeight: 700, width: "100px", border: "none", outline: "none" }}
                />
                <button onClick={handleSaveGoal} style={{ background: "#4648d4", color: "white", borderRadius: "9999px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setEditing(false)} style={{ color: "#767586", fontSize: "11px", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#1a1c1f" }}>
                  ${goalAmount.toLocaleString()}
                </span>
                {isAiEstimate && (
                  <span style={{ background: "#e1e0ff", color: "#4648d4", fontSize: "9px", borderRadius: "9999px", padding: "2px 8px", fontWeight: 700 }}>
                    AI estimate
                  </span>
                )}
                <button onClick={() => { setEditValue(String(goalAmount)); setEditing(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#767586" }}>
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Row 2 — Progress */}
        <div className="flex items-center gap-2 mt-2">
          <span style={{ fontSize: "12px", fontWeight: 700, color: barColor(progressPercent) }}>
            {Math.round(progressPercent)}% funded
          </span>
          <span style={{ fontSize: "12px", color: "#767586" }}>
            ${savedAmount.toLocaleString()} of ${goalAmount.toLocaleString()}
          </span>
        </div>

        {/* Row 3 — AI Insight */}
        <div className="flex items-start gap-2 mt-2" style={{ background: "#f3f3f8", borderRadius: "12px", padding: "10px" }}>
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#4648d4" }} />
          <span style={{ fontSize: "12px", color: "#464554", lineHeight: 1.5 }}>{insightText}</span>
        </div>
      </div>
    </>
  );
}
