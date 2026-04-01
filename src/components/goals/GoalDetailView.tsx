import { useState, useEffect } from "react";
import { StageFinancialTrigger, StageFinancialPanel } from "@/components/goals/StageFinancialPanel";
import { usePremiumStatus } from "@/components/PremiumGate";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  CheckCircle2, Circle, Plus, Trash2, X, ExternalLink, Link2, Sparkles,
  ChevronDown, ChevronLeft, Loader2, Mail, Zap,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useGoalStages, useGoalTasks, useCreateGoalStage, useCreateGoalTask,
  useUpdateGoalTask, useDeleteGoalStage, useDeleteGoalTask,
  type GoalStage, type GoalTask,
} from "@/hooks/useGoals";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import QuickEmailComposer from "@/components/events/QuickEmailComposer";

const AFFIRMATIONS: Record<number, { message: string; emoji: string }> = {
  0: { message: "Every journey begins with a single step", emoji: "🌱" },
  10: { message: "You've started! Keep the momentum going ", emoji: "" },
  25: { message: "A quarter of the way there! ", emoji: "" },
  50: { message: "Halfway to your goal! You're crushing it! ", emoji: "" },
  75: { message: "Almost there! The finish line is in sight ", emoji: "" },
  100: { message: "Goal achieved! You did it! 🏆", emoji: "🏆" },
};

function getAffirmation(progress: number) {
  const thresholds = [100, 75, 50, 25, 10, 0];
  for (const t of thresholds) {
    if (progress >= t) return AFFIRMATIONS[t];
  }
  return AFFIRMATIONS[0];
}

/* ── Circular Progress Ring ── */
function CircularProgress({ percentage, size = 80 }: { percentage: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(99,102,241,0.15)" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#progressGradient)" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold" style={{ color: "#1F2937" }}>{percentage}%</span>
      </div>
    </div>
  );
}

interface Props {
  projectId: string;
  projectName: string;
  coverImage?: string | null;
}

export default function GoalDetailView({ projectId, projectName, coverImage }: Props) {
  const navigate = useNavigate();
  const { isPremium } = usePremiumStatus();
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
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [financialPanelId, setFinancialPanelId] = useState<string | null>(null);

  const toggleFinancialPanel = (id: string) => {
    setFinancialPanelId(prev => prev === id ? null : id);
  };

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
      const newCompleted = completedTasks + 1;
      const newProgress = Math.round((newCompleted / totalTasks) * 100);

      if (newProgress === 100) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 }, colors: ["#6366F1", "#8B5CF6", "#A78BFA"] });
        toast.success("🏆 Goal achieved! Congratulations!");
      } else if (newProgress >= 75 && progress < 75) {
        confetti({ particleCount: 80, spread: 60, colors: ["#6366F1", "#8B5CF6", "#A78BFA"] });
        toast.success(" Almost there! 75% complete!");
      } else if (newProgress >= 50 && progress < 50) {
        confetti({ particleCount: 60, spread: 50, colors: ["#6366F1", "#8B5CF6", "#A78BFA"] });
        toast.success(" Halfway there!");
      } else if (newProgress >= 25 && progress < 25) {
        confetti({ particleCount: 40, spread: 40, colors: ["#6366F1", "#8B5CF6", "#A78BFA"] });
        toast.success(" 25% done! Keep going!");
      } else {
        confetti({ particleCount: 15, spread: 30, origin: { y: 0.7 }, colors: ["#6366F1", "#8B5CF6", "#A78BFA"] });
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
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#6366F1" }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen bg-white -mx-4 sm:-mx-6 -mt-4"
    >
      {/* ═══ HERO SECTION ═══ */}
      <div className="relative w-full overflow-hidden" style={{ height: "50vh", minHeight: 400 }}>
        {/* Cover Image or Gradient */}
        {coverImage ? (
          <img
            src={coverImage}
            alt={projectName}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", zIndex: 0 }}
          />
        )}

        {/* Gradient Overlay */}
        <div
          className="absolute bottom-0 w-full"
          style={{
            height: "60%",
            background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 50%, white 100%)",
            zIndex: 1,
          }}
        />

        {/* ═══ TOP NAV BAR ═══ */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-5" style={{ zIndex: 10, height: 80 }}>
          {/* Back Button */}
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center justify-center rounded-full bg-white transition-all duration-200 hover:bg-white/90 cursor-pointer"
            style={{
              width: 48, height: 48,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <ChevronLeft className="h-6 w-6" style={{ color: "#1F2937" }} />
          </button>

          {/* Email Button */}
          <button
            onClick={() => setShowEmailComposer(!showEmailComposer)}
            className="flex items-center gap-2 transition-all duration-200 cursor-pointer hover:-translate-y-px"
            style={{
              padding: "12px 20px",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: 24,
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Mail className="h-[18px] w-[18px]" style={{ color: "#6366F1" }} />
            <span className="text-[15px] font-semibold" style={{ color: "#1F2937" }}>Email about project</span>
          </button>
        </div>

        {/* ═══ FROSTED GLASS CARD ═══ */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-start gap-5"
          style={{
            bottom: 40,
            width: 420,
            maxWidth: "calc(100% - 40px)",
            padding: 32,
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.8)",
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            zIndex: 2,
          }}
        >
          <CircularProgress percentage={progress} />
          <div className="flex-1 min-w-0">
            <h1
              className="font-bold leading-tight"
              style={{ fontSize: 28, color: "#1F2937", letterSpacing: "-0.01em", lineHeight: 1.3 }}
            >
              {projectName}
            </h1>
            <p
              className="italic mt-2"
              style={{
                fontStyle: "italic",
                fontSize: 16,
                fontWeight: 400,
                color: "rgba(31,41,55,0.8)",
                lineHeight: 1.5,
              }}
            >
              {affirmation.emoji} {affirmation.message}
            </p>
          </div>
        </div>
      </div>

      {/* Email Composer Dropdown */}
      {showEmailComposer && (
        <div className="px-5 py-3 flex justify-end">
          <QuickEmailComposer projectName={projectName} projectType="goal" />
        </div>
      )}

      {/* ═══ STAGES SECTION ═══ */}
      <div className="bg-white px-5 py-10 mx-auto" style={{ maxWidth: 800 }}>
        {/* Stages Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <h2
            className="font-bold"
            style={{ fontSize: 32, color: "#1F2937", letterSpacing: "-0.02em" }}
          >
            Stages
          </h2>
          <button
            onClick={() => setShowAddStage(true)}
            className="flex items-center gap-1.5 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
            style={{
              padding: "10px 20px",
              background: "rgba(99,102,241,0.08)",
              borderRadius: 14,
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              color: "#6366F1",
            }}
          >
            <Plus className="h-[18px] w-[18px]" style={{ color: "#6366F1" }} />
            Add Stage
          </button>
        </div>

        {/* Empty State */}
        {stages.length === 0 && !showAddStage && (
          <div
            className="flex flex-col items-center justify-center py-16"
            style={{ borderRadius: 20, border: "2px dashed rgba(0,0,0,0.08)" }}
          >
            <Sparkles className="h-8 w-8 mb-3" style={{ color: "rgba(99,102,241,0.3)" }} />
            <p className="text-sm mb-1" style={{ color: "#6B7280" }}>No stages yet</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Edit this goal to generate AI-powered stages</p>
          </div>
        )}

        {/* Stage Cards */}
        <div className="space-y-4">
          {stages.map((stage, si) => {
            const stageTasks = tasks.filter(t => t.stage_id === stage.id).sort((a, b) => a.position - b.position);
            const stageCompleted = stageTasks.filter(t => t.completed).length;
            const stageTotal = stageTasks.length;
            const isExpanded = expandedStages.has(stage.id);

            return (
              <div key={stage.id} className="space-y-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.05 }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  background: "white",
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  borderRadius: 20,
                  padding: 24,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => {
                  if (!isExpanded) {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.2)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                }}
              >
                {/* Stage Header */}
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => toggleExpand(stage.id)}
                >
                  {/* Number Badge */}
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 40, height: 40,
                      borderRadius: "50%",
                      background: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#6366F1",
                    }}
                  >
                    {si + 1}
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold leading-snug" style={{ fontSize: 20, color: "#1F2937", marginBottom: 4 }}>
                      {stage.name}
                    </h4>
                    {stage.description && (
                      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{stage.description}</p>
                    )}
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-semibold" style={{ fontSize: 13, color: "#9CA3AF" }}>
                      {stageCompleted} / {stageTotal}
                    </span>
                    <ChevronDown
                      className="transition-transform duration-300"
                      style={{
                        width: 20, height: 20,
                        color: "#9CA3AF",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </div>
                </div>

                {/* ═══ TASK LIST (Expandable) ═══ */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="pt-6 mt-6 space-y-1"
                        style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                      >
                        {stageTasks.map(task => (
                          <div
                            key={task.id}
                            className="group flex items-start gap-3 transition-all duration-200 rounded-lg"
                            style={{ padding: "12px 0" }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.03)";
                              (e.currentTarget as HTMLElement).style.margin = "0 -12px";
                              (e.currentTarget as HTMLElement).style.padding = "12px";
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                              (e.currentTarget as HTMLElement).style.margin = "0";
                              (e.currentTarget as HTMLElement).style.padding = "12px 0";
                            }}
                          >
                            {/* Checkbox */}
                            <button onClick={() => handleToggleTask(task)} className="shrink-0 mt-0.5">
                              {task.completed ? (
                                <motion.div
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                  <div
                                    className="flex items-center justify-center"
                                    style={{
                                      width: 24, height: 24,
                                      borderRadius: "50%",
                                      background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </div>
                                </motion.div>
                              ) : (
                                <div
                                  className="transition-all duration-200 cursor-pointer hover:border-[#6366F1]"
                                  style={{
                                    width: 24, height: 24,
                                    borderRadius: "50%",
                                    border: "2px solid #D1D5DB",
                                    background: "white",
                                  }}
                                />
                              )}
                            </button>

                            {/* Task Text */}
                            <span
                              className="flex-1 transition-all duration-200"
                              style={{
                                fontSize: 15,
                                lineHeight: 1.5,
                                color: task.completed ? "#9CA3AF" : "#1F2937",
                                textDecoration: task.completed ? "line-through" : "none",
                              }}
                            >
                              {task.title}
                            </span>

                            {/* Delete */}
                            <button
                              onClick={() => { deleteTask.mutate(task.id); toast.success("Task removed"); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-auto"
                            >
                              <Trash2 className="h-4 w-4" style={{ color: "#EF4444" }} />
                            </button>
                          </div>
                        ))}

                        {/* Add Task Input */}
                        {addingTaskToStage === stage.id ? (
                          <div className="flex items-center gap-2 mt-4">
                            <input
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              placeholder="Add new task..."
                              autoFocus
                              className="flex-1 outline-none"
                              style={{
                                padding: "10px 14px",
                                border: "1px dashed rgba(99,102,241,0.3)",
                                borderRadius: 12,
                                fontSize: 14,
                                background: "rgba(99,102,241,0.03)",
                                color: "#1F2937",
                              }}
                              onFocus={e => {
                                e.currentTarget.style.borderStyle = "solid";
                                e.currentTarget.style.borderColor = "#6366F1";
                                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                              }}
                              onBlur={e => {
                                e.currentTarget.style.borderStyle = "dashed";
                                e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                              onKeyDown={e => {
                                if (e.key === "Enter") handleAddTask(stage.id);
                                if (e.key === "Escape") { setAddingTaskToStage(null); setNewTaskTitle(""); }
                              }}
                            />
                            <button
                              onClick={() => handleAddTask(stage.id)}
                              className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105"
                              style={{
                                width: 32, height: 32,
                                background: "#6366F1",
                                borderRadius: 8,
                                color: "white",
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setAddingTaskToStage(null); setNewTaskTitle(""); }}
                              className="cursor-pointer"
                            >
                              <X className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingTaskToStage(stage.id)}
                            className="flex items-center gap-1.5 mt-3 cursor-pointer transition-colors duration-200"
                            style={{ fontSize: 14, fontWeight: 600, color: "#6366F1" }}
                          >
                            <Plus className="h-4 w-4" /> Add task
                          </button>
                        )}

                        {/* Delete Stage */}
                        <div className="flex justify-end pt-3">
                          <button
                            onClick={() => { deleteStage.mutate(stage.id); toast.success("Stage removed"); }}
                            className="flex items-center gap-1 transition-colors cursor-pointer text-xs"
                            style={{ color: "#9CA3AF" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
                          >
                            <Trash2 className="h-3 w-3" /> Remove stage
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Financial AI Trigger — premium only */}
                {isPremium && (
                  <StageFinancialTrigger
                    stageId={stage.id}
                    stageTitle={stage.name}
                    stageDescription={stage.description}
                    projectGoal={null}
                    projectName={projectName}
                    expandedId={financialPanelId}
                    onToggle={toggleFinancialPanel}
                  />
                )}
              </motion.div>

              {/* Financial Panel (outside card, below it) */}
              {isPremium && (
                <StageFinancialPanel
                  stageId={stage.id}
                  stageTitle={stage.name}
                  projectGoal={null}
                  projectName={projectName}
                  expandedId={financialPanelId}
                  onClose={() => setFinancialPanelId(null)}
                />
              )}
            </div>
            );
          })}
        </div>

        {/* Add Stage Inline */}
        <AnimatePresence>
          {showAddStage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 mt-4"
            >
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
              <Button size="sm" onClick={handleAddStage} style={{ background: "#6366F1" }}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAddStage(false); setAddingStageName(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ RESOURCES SECTION ═══ */}
        <div
          className="mt-10"
          style={{
            borderRadius: 20,
            border: "1.5px solid rgba(0,0,0,0.08)",
            padding: 24,
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#1F2937" }}>
              <Link2 className="h-4 w-4" style={{ color: "#6366F1" }} /> Useful Resources
            </h3>
            <button
              onClick={() => setAddingResource(true)}
              className="flex items-center gap-1 text-sm font-medium cursor-pointer transition-colors"
              style={{ color: "#6366F1" }}
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          {resources.length === 0 && !addingResource && (
            <p className="text-sm text-center py-4" style={{ color: "#9CA3AF" }}>No resources yet</p>
          )}

          <div className="space-y-2">
            {resources.map(r => (
              <div
                key={r.id}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <ExternalLink className="h-4 w-4 shrink-0" style={{ color: "#6366F1" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#1F2937" }}>{r.title}</p>
                  {r.url && <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{r.url}</p>}
                </div>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: "#6366F1" }}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleDeleteResource(r.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ color: "#EF4444" }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {addingResource && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                <Input value={newResourceTitle} onChange={e => setNewResourceTitle(e.target.value)} placeholder="Resource title" />
                <Input value={newResourceUrl} onChange={e => setNewResourceUrl(e.target.value)} placeholder="URL (optional)" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddResource} className="flex-1" style={{ background: "#6366F1" }}>Add Resource</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAddingResource(false); setNewResourceTitle(""); setNewResourceUrl(""); }}>Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </motion.div>
  );
}
