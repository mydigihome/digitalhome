import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCreateTask, useUpdateTask, useDeleteTask, Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: projects = [] } = useProjects();

  const isNew = !task;

  // Auto-save draft to localStorage
  const draftKey = task ? `task-draft-${task.id}` : "task-draft-new";
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(draftKey, JSON.stringify({ title, description, status, priority, dueDate }));
    }, 2000);
    return () => clearInterval(interval);
  }, [title, description, status, priority, dueDate, draftKey]);

  // Load draft
  useEffect(() => {
    if (isNew) {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const d = JSON.parse(draft);
          if (d.title) setTitle(d.title);
          if (d.description) setDescription(d.description);
        } catch {}
      }
    }
  }, []);

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
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
        });
        toast.success("Task updated!");
      }
      localStorage.removeItem(draftKey);
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
      localStorage.removeItem(draftKey);
      onClose();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-foreground/10" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-border bg-background"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-medium">{isNew ? "New Task" : "Edit Task"}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="border-0 px-0 text-xl font-medium shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={4}
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
