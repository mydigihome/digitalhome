import { useState } from "react";
import { X } from "lucide-react";
import { useCreateTask } from "@/hooks/useTasks";
import { toast } from "sonner";

interface Props { projectId: string; defaultStatus?: string; onClose: () => void; }

export default function TaskEditor({ projectId, defaultStatus = "backlog", onClose }: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const createTask = useCreateTask();

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Task title is required"); return; }
    await createTask.mutateAsync({ title: title.trim(), project_id: projectId, priority, status: defaultStatus });
    toast.success("Task created!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">New Task</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()}
            placeholder="What needs to be done?" autoFocus
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
          <select value={priority} onChange={e => setPriority(e.target.value)}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none">
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground">Cancel</button>
            <button onClick={handleCreate} disabled={createTask.isPending}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
              {createTask.isPending ? "Creating..." : "Add Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
