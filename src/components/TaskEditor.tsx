import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateTask, useUpdateTask, useDeleteTask, Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { X, Clock, Tag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

const statuses = [
  { value: "backlog", label: "Backlog" },
  { value: "ready", label: "Ready" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const priorities = [
  { value: "low", label: "Low", color: "bg-muted-foreground" },
  { value: "medium", label: "Medium", color: "bg-warning" },
  { value: "high", label: "High", color: "bg-destructive" },
];

const availableLabels = [
  { name: "Urgent", color: "bg-destructive/10 text-destructive" },
  { name: "Important", color: "bg-warning/10 text-warning" },
  { name: "Review", color: "bg-primary/10 text-primary" },
  { name: "Blocked", color: "bg-muted text-muted-foreground" },
];

interface Props {
  task?: Task | null;
  projectId?: string;
  defaultStatus?: string;
  onClose: () => void;
}

export default function TaskEditor({ task, projectId, defaultStatus, onClose }: Props) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || defaultStatus || "backlog");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [selectedProject, setSelectedProject] = useState(task?.project_id || projectId || "");
  const [duration, setDuration] = useState<number | "">(task?.duration ?? "");
  const [minChunk, setMinChunk] = useState<number | "">(task?.min_chunk ?? "");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [labels, setLabels] = useState<string[]>(task?.labels || []);
  const [autoScheduled, setAutoScheduled] = useState(task?.auto_scheduled || false);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: projects = [] } = useProjects();

  const isNew = !task;

  const draftKey = task ? `task-draft-${task.id}` : "task-draft-new";
  useEffect(() => {
    const interval = setInterval(() => {
      saveStoredJson(draftKey, { title, description, status, priority, dueDate });
    }, 2000);
    return () => clearInterval(interval);
  }, [title, description, status, priority, dueDate, draftKey]);

  useEffect(() => {
    if (isNew) {
      const draft = loadStoredJson<any>(draftKey, null);
      if (draft) {
        try {
          if (draft.title) setTitle(draft.title);
          if (draft.description) setDescription(draft.description);
        } catch {}
      }
    }
  }, []);

  const toggleLabel = (name: string) => {
    setLabels((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const extra = {
      duration: duration || null,
      min_chunk: minChunk || null,
      assignee: assignee.trim() || null,
      labels,
      auto_scheduled: autoScheduled,
    };
    try {
      if (isNew) {
        if (!selectedProject) { toast.error("Select a project"); return; }
        await createTask.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          due_date: dueDate || null,
          project_id: selectedProject,
          ...extra,
        });
        toast.success("Task created!");
      } else {
        await updateTask.mutateAsync({
          id: task.id,
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          due_date: dueDate || null,
          ...extra,
        });
        toast.success("Task updated!");
      }
      localStorage.removeItem(draftKey); localStorage.removeItem(`${draftKey}__backup`);
      onClose();
    } catch {
      toast.error("Failed to save task");
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Task deleted");
      localStorage.removeItem(draftKey); localStorage.removeItem(`${draftKey}__backup`);
      onClose();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const formatDuration = (mins: number | "") => {
    if (!mins) return "";
    const h = Math.floor(Number(mins) / 60);
    const m = Number(mins) % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/10" onClick={onClose} />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-border bg-background"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-medium">{isNew ? "New Task" : "Edit Task"}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="border-0 px-0 text-xl font-medium shadow-none focus-visible:ring-0"
            autoFocus
          />

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
            />
          </div>

          {isNew && !projectId && (
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
                    priority === p.value ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full", p.color)} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due date</Label>
            <div className="flex gap-2">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              {dueDate && (
                <Button variant="ghost" size="sm" onClick={() => setDueDate("")}>Clear</Button>
              )}
            </div>
          </div>

          {/* Duration & Min Chunk */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Duration (min)
              </Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="e.g. 120"
              />
              {duration && (
                <p className="text-xs text-muted-foreground">{formatDuration(duration)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Min chunk (min)</Label>
              <Input
                type="number"
                value={minChunk}
                onChange={(e) => setMinChunk(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="e.g. 60"
              />
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Who's responsible?"
            />
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              Labels
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map((l) => (
                <button
                  key={l.name}
                  onClick={() => toggleLabel(l.name)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all",
                    l.color,
                    labels.includes(l.name) ? "ring-2 ring-primary ring-offset-1" : "opacity-60 hover:opacity-100"
                  )}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-schedule */}
          <label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer">
            <Checkbox checked={autoScheduled} onCheckedChange={(c) => setAutoScheduled(!!c)} />
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Auto-schedule this task</span>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4">
          {!isNew ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete task?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : <div />}
          <Button onClick={handleSave} disabled={createTask.isPending || updateTask.isPending}>
            Save
          </Button>
        </div>
      </motion.div>
    </>
  );
}
