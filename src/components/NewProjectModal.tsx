import { useState } from "react";
import { X, Calendar, Users, Settings, FileText, Check, LayoutGrid, List, Clock, Sparkles, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateProject } from "@/hooks/useProjects";
import { useCreateTask } from "@/hooks/useTasks";
import { useTemplates, ProjectTemplate } from "@/hooks/useTemplates";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Stage {
  name: string;
  duration: number;
  enabled: boolean;
  color: string;
}

interface CustomField {
  id: string;
  name: string;
  value: string;
  applyToAll: boolean;
}

const stageColorMap: Record<string, string> = {
  yellow: "bg-yellow-400",
  orange: "bg-orange-400",
  blue: "bg-blue-400",
  purple: "bg-purple-400",
  green: "bg-green-400",
  teal: "bg-teal-400",
  red: "bg-red-400",
};

const defaultStages: Stage[] = [
  { name: "Planning", duration: 5, enabled: true, color: "yellow" },
  { name: "Execution", duration: 10, enabled: true, color: "orange" },
  { name: "Review", duration: 3, enabled: true, color: "blue" },
  { name: "Completion", duration: 1, enabled: true, color: "green" },
];

const steps = [
  { id: 1, name: "Template", icon: Sparkles },
  { id: 2, name: "Project Title", icon: FileText },
  { id: 3, name: "Set Dates", icon: Calendar },
  { id: 4, name: "Assign Roles", icon: Users },
  { id: 5, name: "Custom Fields", icon: Settings },
  { id: 6, name: "View Style", icon: LayoutGrid },
];

const types = [
  { value: "personal", label: "Personal" },
  { value: "work", label: "Work" },
  { value: "travel", label: "Travel" },
  
];

const views = [
  { value: "kanban", label: "Kanban", icon: LayoutGrid, disabled: false },
  { value: "list", label: "List", icon: List, disabled: false },
  { value: "timeline", label: "Timeline", icon: Clock, disabled: true },
];

const roles = ["Project Manager", "Designer", "Developer", "Reviewer"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: string;
}

export default function NewProjectModal({ open, onOpenChange, defaultType }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ongoing, setOngoing] = useState(false);
  const [type, setType] = useState(defaultType || "personal");
  const [viewPref, setViewPref] = useState("kanban");
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [stages, setStages] = useState<Stage[]>(defaultStages);
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: "1", name: "URL", value: "", applyToAll: false },
    { id: "2", name: "Category", value: defaultType || "personal", applyToAll: true },
  ]);

  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const { data: templates = [] } = useTemplates();

  const reset = () => {
    setCurrentStep(1);
    setName("");
    setGoal("");
    setStartDate("");
    setEndDate("");
    setOngoing(false);
    setType(defaultType || "personal");
    setViewPref("kanban");
    setSelectedTemplate(null);
    setStages(defaultStages);
    setAssignedRoles([]);
    setCustomFields([
      { id: "1", name: "URL", value: "", applyToAll: false },
      { id: "2", name: "Category", value: defaultType || "personal", applyToAll: true },
    ]);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    try {
      const project = await createProject.mutateAsync({
        name: name.trim(),
        goal: goal.trim() || undefined,
        type,
        view_preference: viewPref,
        start_date: startDate || undefined,
        end_date: ongoing ? undefined : endDate || undefined,
      });

      if (selectedTemplate && project?.id) {
        for (const task of selectedTemplate.tasks) {
          await createTask.mutateAsync({
            title: task.title,
            project_id: project.id,
            priority: task.priority || "medium",
            status: task.status || "backlog",
          });
        }
      }

      toast.success("Project created!");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const canProceed = () => {
    if (currentStep === 2 && !name.trim()) return false;
    return true;
  };

  const selectTemplate = (template: ProjectTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setName(template.name);
      setType(template.type);
      if (template.description) setGoal(template.description);
    }
  };

  const toggleRole = (role: string) => {
    setAssignedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const addCustomField = () => {
    setCustomFields((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", value: "", applyToAll: false },
    ]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateCustomField = (id: string, field: string, value: string | boolean) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Choose a Template</h2>
            <p className="text-muted-foreground">Start with a pre-built workflow or create from scratch.</p>
            <div
              onClick={() => selectTemplate(null)}
              className={cn(
                "cursor-pointer rounded-xl border-2 p-4 transition-all",
                !selectedTemplate ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Start from scratch</p>
                  <p className="text-sm text-muted-foreground">Create an empty project with custom stages</p>
                </div>
                {!selectedTemplate && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all",
                    selectedTemplate?.id === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                      <p className="font-medium text-foreground">{t.name}</p>
                    </div>
                    {selectedTemplate?.id === t.id && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                  <p className="mt-2 text-xs text-primary">{t.tasks.length} tasks included</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Project Title</h2>
            <p className="text-muted-foreground">What do you want to achieve?</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name..."
                  autoFocus
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label>Goal (optional)</Label>
                <Input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="What's the end goal?"
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Set Dates</h2>
              <p className="text-muted-foreground">Set your project's start date & deadline.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={ongoing} className="h-12" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={ongoing} onCheckedChange={(c) => setOngoing(!!c)} />
              Ongoing project (no deadline)
            </label>

            {/* Stage deadlines */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Stage deadlines</h3>
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Checkbox
                      checked={stage.enabled}
                      onCheckedChange={(c) => {
                        const newStages = [...stages];
                        newStages[index].enabled = !!c;
                        setStages(newStages);
                      }}
                    />
                    <div className={cn("h-3 w-3 rounded-full", stageColorMap[stage.color])} />
                    <Input
                      value={stage.name}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[index].name = e.target.value;
                        setStages(newStages);
                      }}
                      className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0"
                    />
                    <Input
                      type="number"
                      value={stage.duration}
                      onChange={(e) => {
                        const newStages = [...stages];
                        newStages[index].duration = parseInt(e.target.value) || 0;
                        setStages(newStages);
                      }}
                      className="w-16 text-center"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Assign Roles</h2>
            <p className="text-muted-foreground">Add team members or assign yourself to different roles.</p>
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-2 p-3 transition-all cursor-pointer",
                    assignedRoles.includes(role)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                  onClick={() => toggleRole(role)}
                >
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 font-medium text-foreground">{role}</span>
                  {assignedRoles.includes(role) ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <span className="text-xs text-primary font-medium">Assign</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Custom Fields</h2>
            <p className="text-muted-foreground">Add metadata to your project.</p>
            <div className="space-y-3">
              {customFields.map((field) => (
                <div key={field.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <Input
                    value={field.name}
                    onChange={(e) => updateCustomField(field.id, "name", e.target.value)}
                    placeholder="Field name"
                    className="w-28 text-sm"
                  />
                  <span className="text-muted-foreground">:</span>
                  <Input
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 text-sm"
                  />
                  <label className="flex items-center gap-1.5 whitespace-nowrap">
                    <Checkbox
                      checked={field.applyToAll}
                      onCheckedChange={(c) => updateCustomField(field.id, "applyToAll", !!c)}
                    />
                    <span className="text-xs text-muted-foreground">All tasks</span>
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomField(field.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <button
                onClick={addCustomField}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-3 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                Add custom field
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">View Style</h2>
            <p className="text-muted-foreground">How do you want to organize your tasks?</p>
            <div className="grid grid-cols-3 gap-3">
              {views.map((v) => (
                <button
                  key={v.value}
                  onClick={() => !v.disabled && setViewPref(v.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                    v.disabled && "cursor-not-allowed opacity-50",
                    viewPref === v.value && !v.disabled
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <v.icon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{v.label}</span>
                  {v.disabled && <span className="text-[10px] text-muted-foreground">Coming soon</span>}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-4xl overflow-hidden p-0">
        <div className="flex min-h-[520px]">
          {/* Sidebar stepper */}
          <div className="w-56 border-r border-border bg-secondary/30 p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Set up your project
            </h3>
            <div className="space-y-1">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (step.id <= 1 || step.id === 2 || name.trim()) setCurrentStep(step.id);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-3 text-sm transition-colors",
                      isActive
                        ? "bg-card shadow-sm font-medium text-foreground"
                        : "text-muted-foreground hover:bg-card/50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        isActive ? "bg-primary/10" : "bg-secondary"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      )}
                    </div>
                    {step.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border p-5">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!canProceed()) {
                      toast.error("Project name is required");
                      return;
                    }
                    if (currentStep < steps.length) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      handleCreate();
                    }
                  }}
                  disabled={createProject.isPending}
                >
                  {currentStep < steps.length
                    ? "Continue"
                    : createProject.isPending
                    ? "Creating..."
                    : selectedTemplate
                    ? `Create with ${selectedTemplate.tasks.length} Tasks`
                    : "Create Project"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
