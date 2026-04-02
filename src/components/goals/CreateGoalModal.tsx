import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Target, ChevronRight, Sparkles, X, Plus, Trash2, Loader2,
  Home, Music, UtensilsCrossed, Briefcase, Heart, Rocket, Dumbbell,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useProjects";
import { useCreateGoalStage, useCreateGoalTask } from "@/hooks/useGoals";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";

const GOAL_TYPES: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "home", label: "Buy a Home", Icon: Home },
  { value: "music", label: "Launch Music EP", Icon: Music },
  { value: "cooking", label: "Plan Family Cookout", Icon: UtensilsCrossed },
  { value: "business", label: "Start a Business", Icon: Briefcase },
  { value: "wedding", label: "Wedding Planning", Icon: Heart },
  { value: "career", label: "Career Change", Icon: Rocket },
  { value: "fitness", label: "Fitness Goal", Icon: Dumbbell },
  { value: "custom", label: "Custom", Icon: Sparkles },
];

interface StageData {
  name: string;
  description: string;
  tasks: { title: string }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateGoalModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const createStage = useCreateGoalStage();
  const createTask = useCreateGoalTask();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goalType, setGoalType] = useState("custom");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<StageData[]>([]);
  const [resources, setResources] = useState<{ title: string; url: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isDark = document.documentElement.classList.contains("dark");

  const generateStages = async () => {
    if (!name.trim()) { toast.error("Enter a goal name first"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-goal-stages", {
        body: { goalName: name, goalType: GOAL_TYPES.find(g => g.value === goalType)?.label || goalType },
      });
      if (error) throw error;
      if (data?.stages) setStages(data.stages);
      if (data?.resources) setResources(data.resources);
      toast.success("AI stages generated!");
    } catch {
      toast.error("Failed to generate stages");
    } finally {
      setGenerating(false);
    }
  };

  const addStage = () => {
    setStages(prev => [...prev, { name: "", description: "", tasks: [{ title: "" }] }]);
  };

  const removeStage = (idx: number) => {
    setStages(prev => prev.filter((_, i) => i !== idx));
  };

  const updateStage = (idx: number, field: string, value: string) => {
    setStages(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addTask = (stageIdx: number) => {
    setStages(prev => prev.map((s, i) => i === stageIdx ? { ...s, tasks: [...s.tasks, { title: "" }] } : s));
  };

  const removeTask = (stageIdx: number, taskIdx: number) => {
    setStages(prev => prev.map((s, i) =>
      i === stageIdx ? { ...s, tasks: s.tasks.filter((_, j) => j !== taskIdx) } : s
    ));
  };

  const updateTask = (stageIdx: number, taskIdx: number, title: string) => {
    setStages(prev => prev.map((s, i) =>
      i === stageIdx ? { ...s, tasks: s.tasks.map((t, j) => j === taskIdx ? { title } : t) } : s
    ));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Goal name is required"); return; }
    setSubmitting(true);
    try {
      const project = await createProject.mutateAsync({
        name,
        type: "goal",
        view_preference: "kanban",
        goal: description || undefined,
        end_date: endDate || undefined,
      });

      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        if (!s.name.trim()) continue;
        const stageData = await createStage.mutateAsync({
          project_id: project.id,
          name: s.name,
          description: s.description || undefined,
          position: i,
        });

        for (let j = 0; j < s.tasks.length; j++) {
          const t = s.tasks[j];
          if (!t.title.trim()) continue;
          await createTask.mutateAsync({
            stage_id: stageData.id,
            project_id: project.id,
            title: t.title,
            position: j,
          });
        }
      }

      if (resources.length > 0) {
        for (const r of resources) {
          if (!r.title.trim()) continue;
          await (supabase as any).from("project_resources").insert({
            project_id: project.id,
            title: r.title,
            url: r.url || null,
            resource_type: "link",
          });
        }
      }

      toast.success("Goal created!");
      onClose();
      navigate(`/project/${project.id}`);
    } catch {
      toast.error("Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-[640px] max-h-[85vh] overflow-y-auto rounded-2xl bg-card border border-primary/20 p-6 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Create Goal
              </h2>
              <p className="text-sm text-muted-foreground">Step {step + 1} of 2</p>
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1 mb-6">
            {[0, 1].map(i => (
              <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= step ? "bg-primary" : "bg-secondary")} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Goal Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Buy a Home" className="text-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Goal Type</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {GOAL_TYPES.map(t => {
                      const isSelected = goalType === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setGoalType(t.value)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "14px 16px",
                            border: "1.5px solid",
                            borderColor: isSelected ? "#10B981" : (isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"),
                            borderRadius: "10px",
                            background: isSelected
                              ? (isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4")
                              : (isDark ? "#252528" : "white"),
                            cursor: "pointer",
                            transition: "all 150ms",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "14px",
                            fontWeight: isSelected ? "600" : "400",
                            color: isSelected
                              ? (isDark ? "#6EE7B7" : "#065F46")
                              : (isDark ? "#F2F2F2" : "#374151"),
                          }}
                        >
                          <t.Icon size={18} style={{ color: isSelected ? "#10B981" : (isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF") }} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Completion Date</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What do you want to achieve?" />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full border-primary/30 hover:bg-primary/5"
                  onClick={generateStages}
                  disabled={generating}
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating stages...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2 text-primary" /> AI Generate Stages</>
                  )}
                </Button>

                <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                  {stages.map((stage, si) => (
                    <div key={si} className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{si + 1}</span>
                        <Input
                          value={stage.name}
                          onChange={e => updateStage(si, "name", e.target.value)}
                          placeholder="Stage name"
                          className="flex-1 font-medium"
                        />
                        <button onClick={() => removeStage(si)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1.5 pl-8">
                        {stage.tasks.map((task, ti) => (
                          <div key={ti} className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded border-2 border-border shrink-0" />
                            <Input
                              value={task.title}
                              onChange={e => updateTask(si, ti, e.target.value)}
                              placeholder="Task..."
                              className="flex-1 h-8 text-sm"
                            />
                            <button onClick={() => removeTask(si, ti)} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addTask(si)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 pl-6">
                          <Plus className="h-3 w-3" /> Add task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={addStage} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium">
                  <Plus className="h-4 w-4" /> Add Stage
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-border">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>
            )}
            {step === 0 ? (
              <Button onClick={() => {
                if (!name.trim()) { toast.error("Goal name is required"); return; }
                setStep(1);
              }} className="flex-1">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? "Creating..." : "Create Goal"} <Sparkles className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
