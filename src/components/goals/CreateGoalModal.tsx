import { useState } from "react";
import { X, Target } from "lucide-react";
import { useCreateProject } from "@/hooks/useProjects";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; }

export default function CreateGoalModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createProject = useCreateProject();

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Goal name is required"); return; }
    await createProject.mutateAsync({ name: name.trim(), goal: description.trim() || undefined, type: "goal", view_preference: "kanban" });
    toast.success("Goal created!");
    setName(""); setDescription("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">New Goal</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Goal Name</label>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="What do you want to achieve?" autoFocus
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Why does this goal matter?"
              rows={3} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition">Cancel</button>
            <button onClick={handleCreate} disabled={createProject.isPending}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition">
              {createProject.isPending ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
