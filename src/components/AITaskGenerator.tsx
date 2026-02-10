import { useState } from "react";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useCreateTask } from "@/hooks/useTasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GeneratedTask {
  title: string;
  priority: string;
  description?: string;
  selected: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export default function AITaskGenerator({ open, onOpenChange, projectId, projectName }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [adding, setAdding] = useState(false);
  const createTask = useCreateTask();

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setTasks([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tasks", {
        body: { prompt: prompt.trim(), projectName },
      });
      if (error) throw error;
      if (data?.tasks) {
        setTasks(data.tasks.map((t: any) => ({ ...t, selected: true })));
      } else {
        toast.error("No tasks generated. Try a more specific description.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate tasks");
    } finally {
      setLoading(false);
    }
  };

  const addSelected = async () => {
    const selected = tasks.filter((t) => t.selected);
    if (selected.length === 0) {
      toast.error("Select at least one task");
      return;
    }
    setAdding(true);
    try {
      for (const task of selected) {
        await createTask.mutateAsync({
          title: task.title,
          project_id: projectId,
          priority: task.priority || "medium",
          description: task.description || null,
          status: "backlog",
        });
      }
      toast.success(`Added ${selected.length} tasks!`);
      setTasks([]);
      setPrompt("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to add some tasks");
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const priorityColor: Record<string, string> = {
    high: "text-destructive",
    medium: "text-warning",
    low: "text-success",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Task Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Describe what you want to accomplish and AI will generate tasks for you.
            </p>
            <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Plan a birthday party for 20 people"
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
              <Button onClick={generate} disabled={loading || !prompt.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
              </Button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Generating tasks...</span>
            </div>
          )}

          {tasks.length > 0 && (
            <>
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {tasks.map((task, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border border-border p-3 transition-colors",
                      task.selected ? "bg-card" : "bg-muted/30 opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={task.selected}
                      onCheckedChange={() => toggleTask(i)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      {task.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                    <span className={cn("text-xs font-medium capitalize", priorityColor[task.priority] || "text-muted-foreground")}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setTasks([])}>
                  Clear
                </Button>
                <Button className="flex-1" onClick={addSelected} disabled={adding}>
                  {adding ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add {tasks.filter((t) => t.selected).length} Tasks
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
