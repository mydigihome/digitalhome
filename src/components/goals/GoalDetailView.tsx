import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  CheckCircle2, Circle, Plus, Trash2, X, ExternalLink, Link2, Sparkles,
  ChevronDown, ChevronRight, Loader2,
} from "lucide-react";
import QuickEmailComposer from "@/components/events/QuickEmailComposer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useGoalStages, useGoalTasks, useCreateGoalStage, useCreateGoalTask,
  useUpdateGoalTask, useDeleteGoalStage, useDeleteGoalTask,
  type GoalStage, type GoalTask,
} from "@/hooks/useGoals";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const AFFIRMATIONS: Record<number, { message: string; emoji: string }> = {
  0: { message: "Every journey begins with a single step", emoji: "🌱" },
  10: { message: "Great start! Keep that momentum going", emoji: "🌟" },
  25: { message: "You're crushing it! A quarter of the way there", emoji: "💪" },
  50: { message: "Halfway there! You're doing amazing", emoji: "🎉" },
  75: { message: "Almost there! You can see the finish line", emoji: "🚀" },
  100: { message: "YOU DID IT! Goal achieved!", emoji: "🏆" },
};

function getAffirmation(progress: number) {
  const thresholds = [100, 75, 50, 25, 10, 0];
  for (const t of thresholds) {
    if (progress >= t) return AFFIRMATIONS[t];
  }
  return AFFIRMATIONS[0];
}

function CircularProgress({ percentage, size = 160 }: { percentage: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="hsl(var(--secondary))" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="hsl(var(--primary))" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{percentage}%</span>
        <span className="text-xs text-muted-foreground">Complete</span>
      </div>
    </div>
  );
}

interface Props {
  projectId: string;
  projectName: string;
}

export default function GoalDetailView({ projectId, projectName }: Props) {
  const { data: stages = [], isLoading: stagesLoading } = useGoalStages(projectId);
  const { data: tasks = [], isLoading: tasksLoading } = useGoalTasks(projectId);
  const createStage = useCreateGoalStage();
  const createTask = useCreateGoalTask();
  const updateTask = useUpdateGoalTask();
  const deleteStage = useDeleteGoalStage();
  const deleteTask = useDeleteGoalTask();

  const { data: resources = [] } = useQuery({
    queryKey: ["project_resources", projectId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("project_resources")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as { id: string; title: string; url: string | null; resource_type: string }[];
    },
    enabled: !!projectId,
  });

  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [addingTaskToStage, setAddingTaskToStage] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingStageName, setAddingStageName] = useState("");
  const [showAddStage, setShowAddStage] = useState(false);
  const [addingResource, setAddingResource] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  // Expand all stages on first load
  useEffect(() => {
    if (stages.length > 0 && expandedStages.size === 0) {
      setExpandedStages(new Set(stages.map(s => s.id)));
    }
  }, [stages]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const affirmation = getAffirmation(progress);

  const toggleExpand = (id: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleTask = async (task: GoalTask) => {
    const wasCompleted = task.completed;
    await updateTask.mutateAsync({
      id: task.id,
      completed: !wasCompleted,
      completed_at: wasCompleted ? null : new Date().toISOString(),
    });

    if (!wasCompleted) {
      // Check if this completes a milestone
      const newCompleted = completedTasks + 1;
      const newProgress = Math.round((newCompleted / totalTasks) * 100);
      
      if (newProgress === 100) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });
        toast.success("🏆 Goal achieved! Congratulations!");
      } else if (newProgress >= 75 && progress < 75) {
        confetti({ particleCount: 80, spread: 60 });
        toast.success("🚀 Almost there! 75% complete!");
      } else if (newProgress >= 50 && progress < 50) {
        confetti({ particleCount: 60, spread: 50 });
        toast.success("🎉 Halfway there!");
      } else if (newProgress >= 25 && progress < 25) {
        confetti({ particleCount: 40, spread: 40 });
        toast.success("💪 25% done! Keep going!");
      } else {
        // Small celebration for each task
        confetti({ particleCount: 15, spread: 30, origin: { y: 0.7 } });
      }
    }
  };

  const handleAddTask = async (stageId: string) => {
    if (!newTaskTitle.trim()) return;
    const stageTasks = tasks.filter(t => t.stage_id === stageId);
    await createTask.mutateAsync({
      stage_id: stageId,
      project_id: projectId,
      title: newTaskTitle,
      position: stageTasks.length,
    });
    setNewTaskTitle("");
    setAddingTaskToStage(null);
  };

  const handleAddStage = async () => {
    if (!addingStageName.trim()) return;
    await createStage.mutateAsync({
      project_id: projectId,
      name: addingStageName,
      position: stages.length,
    });
    setAddingStageName("");
    setShowAddStage(false);
  };

  const handleAddResource = async () => {
    if (!newResourceTitle.trim()) return;
    await (supabase as any).from("project_resources").insert({
      project_id: projectId,
      title: newResourceTitle,
      url: newResourceUrl || null,
      resource_type: "link",
    });
    setNewResourceTitle("");
    setNewResourceUrl("");
    setAddingResource(false);
    toast.success("Resource added");
  };

  const handleDeleteResource = async (id: string) => {
    await (supabase as any).from("project_resources").delete().eq("id", id);
    toast.success("Resource removed");
  };

  if (stagesLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Hero */}
      <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <CircularProgress percentage={progress} />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
            <span className="text-3xl">{affirmation.emoji}</span>
            <h2 className="text-lg font-semibold text-foreground">{affirmation.message}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {completedTasks} of {totalTasks} tasks completed
          </p>
          {/* Success bar */}
          <div className="h-3 w-full max-w-md rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Stages</h3>
          <Button variant="outline" size="sm" onClick={() => setShowAddStage(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Stage
          </Button>
        </div>

        {stages.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No stages yet</p>
            <p className="text-xs text-muted-foreground">Edit this goal to generate AI-powered stages</p>
          </div>
        )}

        {stages.map((stage, si) => {
          const stageTasks = tasks.filter(t => t.stage_id === stage.id).sort((a, b) => a.position - b.position);
          const stageCompleted = stageTasks.filter(t => t.completed).length;
          const stageTotal = stageTasks.length;
          const stageProgress = stageTotal > 0 ? Math.round((stageCompleted / stageTotal) * 100) : 0;
          const isExpanded = expandedStages.has(stage.id);
          const isComplete = stageTotal > 0 && stageCompleted === stageTotal;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
              className={cn(
                "rounded-xl border bg-card overflow-hidden transition-all",
                isComplete ? "border-primary/30 bg-primary/5" : "border-border"
              )}
            >
              {/* Stage Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition"
                onClick={() => toggleExpand(stage.id)}
              >
                <span className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors",
                  isComplete ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                )}>
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : si + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{stage.name}</h4>
                  {stage.description && <p className="text-xs text-muted-foreground truncate">{stage.description}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">{stageCompleted}/{stageTotal}</span>
                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stageProgress}%` }} />
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Tasks */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-4 pb-4 pt-2 space-y-1">
                      {stageTasks.map(task => (
                        <div
                          key={task.id}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-secondary/50",
                            task.completed && "opacity-60"
                          )}
                        >
                          <button onClick={() => handleToggleTask(task)} className="shrink-0">
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                            )}
                          </button>
                          <span className={cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground")}>
                            {task.title}
                          </span>
                          <button
                            onClick={() => { deleteTask.mutate(task.id); toast.success("Task removed"); }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add task */}
                      {addingTaskToStage === stage.id ? (
                        <div className="flex items-center gap-2 pl-8 mt-2">
                          <Input
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            placeholder="New task..."
                            className="h-8 text-sm flex-1"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === "Enter") handleAddTask(stage.id);
                              if (e.key === "Escape") { setAddingTaskToStage(null); setNewTaskTitle(""); }
                            }}
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleAddTask(stage.id)}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setAddingTaskToStage(null); setNewTaskTitle(""); }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingTaskToStage(stage.id)}
                          className="flex items-center gap-2 pl-8 mt-1 text-xs text-primary hover:text-primary/80 font-medium"
                        >
                          <Plus className="h-3 w-3" /> Add task
                        </button>
                      )}

                      {/* Delete stage */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => { deleteStage.mutate(stage.id); toast.success("Stage removed"); }}
                          className="text-xs text-muted-foreground hover:text-destructive transition flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Remove stage
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Add Stage Inline */}
        <AnimatePresence>
          {showAddStage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
              <Input
                value={addingStageName}
                onChange={e => setAddingStageName(e.target.value)}
                placeholder="Stage name..."
                className="flex-1"
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") handleAddStage();
                  if (e.key === "Escape") { setShowAddStage(false); setAddingStageName(""); }
                }}
              />
              <Button size="sm" onClick={handleAddStage}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAddStage(false); setAddingStageName(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resources Section */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Useful Resources
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setAddingResource(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {resources.length === 0 && !addingResource && (
          <p className="text-sm text-muted-foreground text-center py-4">No resources yet</p>
        )}

        <div className="space-y-2">
          {resources.map(r => (
            <div key={r.id} className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary/50 transition">
              <ExternalLink className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                {r.url && <p className="text-xs text-muted-foreground truncate">{r.url}</p>}
              </div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button onClick={() => handleDeleteResource(r.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {addingResource && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2 overflow-hidden">
              <Input value={newResourceTitle} onChange={e => setNewResourceTitle(e.target.value)} placeholder="Resource title" />
              <Input value={newResourceUrl} onChange={e => setNewResourceUrl(e.target.value)} placeholder="URL (optional)" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddResource} className="flex-1">Add Resource</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingResource(false); setNewResourceTitle(""); setNewResourceUrl(""); }}>Cancel</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Email Quick Access - Context-Aware */}
      <QuickEmailComposer projectName={projectName} projectType="goal" />
    </div>
  );
}
