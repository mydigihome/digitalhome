import { useState } from "react";
import { X } from "lucide-react";
import { useCreateNote } from "@/hooks/useNotes";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; }

export default function NoteEditor({ open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createNote = useCreateNote();

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) { toast.error("Add a title or content"); return; }
    await createNote.mutateAsync({ title: title.trim() || "Untitled Note", content: content.trim() });
    toast.success("Note saved!");
    setTitle(""); setContent("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">New Note</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-primary mb-3" />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Start writing..." rows={5}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-primary resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">Save Note</button>
        </div>
      </div>
    </div>
  );
}
