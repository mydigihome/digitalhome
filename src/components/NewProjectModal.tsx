import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useProjects";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Briefcase, Dumbbell, Plane, LayoutGrid, List, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const types = [
  { value: "personal", label: "Personal", icon: Home },
  { value: "work", label: "Work", icon: Briefcase },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "travel", label: "Travel", icon: Plane },
];

const views = [
  { value: "kanban", label: "Kanban", icon: LayoutGrid, disabled: false },
  { value: "list", label: "List", icon: List, disabled: false },
  { value: "timeline", label: "Timeline", icon: Clock, disabled: true },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewProjectModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [type, setType] = useState("personal");
  const [viewPref, setViewPref] = useState("kanban");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ongoing, setOngoing] = useState(false);
  const createProject = useCreateProject();

  const reset = () => {
    setStep(1); setName(""); setGoal(""); setType("personal"); setViewPref("kanban");
    setStartDate(""); setEndDate(""); setOngoing(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Project name is required"); return; }
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        goal: goal.trim() || undefined,
        type,
        view_preference: viewPref,
        start_date: startDate || undefined,
        end_date: ongoing ? undefined : endDate || undefined,
      });
      toast.success("Project created!");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-[600px] p-8">
        {/* Step dots */}
        <div className="mb-6 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("h-2 w-2 rounded-full transition-colors", s === step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={step}>
          {step === 1 && (
            <motion.div key="s1" variants={slideVariants} custom={1} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <h2 className="text-xl font-medium">What do you want to achieve?</h2>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Project name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My project" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label>Goal (optional)</Label>
                  <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What's the end goal?" rows={3} />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => { if (!name.trim()) { toast.error("Name is required"); return; } setStep(2); }}>Next</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" variants={slideVariants} custom={1} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <h2 className="text-xl font-medium">Shape your project</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {types.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                      type === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    )}
                  >
                    <t.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={ongoing} />
                </div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={ongoing} onChange={(e) => setOngoing(e.target.checked)} className="rounded" />
                Ongoing project
              </label>
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Next</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" variants={slideVariants} custom={1} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <h2 className="text-xl font-medium">How do you want to work?</h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {views.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => !v.disabled && setViewPref(v.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                      v.disabled && "cursor-not-allowed opacity-50",
                      viewPref === v.value && !v.disabled ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    )}
                  >
                    <v.icon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">{v.label}</span>
                    {v.disabled && <span className="text-[10px] text-muted-foreground">Coming soon</span>}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={handleCreate} disabled={createProject.isPending}>
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
