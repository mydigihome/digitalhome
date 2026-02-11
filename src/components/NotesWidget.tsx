import { useState, useMemo } from "react";
import { StickyNote, GripVertical, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNotes, useDeleteNote, useReorderNotes, type Note } from "@/hooks/useNotes";
import NoteEditor from "@/components/NoteEditor";
import { formatDistanceToNow, isToday, isYesterday, subDays, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function SortableNoteCard({ note, onClick }: { note: Note; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  const deleteNote = useDeleteNote();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-all duration-150 hover:border-accent hover:shadow-sm",
        isDragging && "rotate-1 scale-[1.02] shadow-lg z-50"
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{note.title || "Untitled note"}</p>
        {note.content_preview && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{note.content_preview}</p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab rounded p-0.5 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); deleteNote.mutate(note.id); toast.success("Note deleted"); }}
          className="rounded p-0.5 text-muted-foreground/30 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function NotesWidget({ onAddNote }: { onAddNote: () => void }) {
  const { data: notes = [] } = useNotes();
  const reorderNotes = useReorderNotes();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showAll, setShowAll] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    const groups: { label: string; notes: Note[] }[] = [
      { label: "Today", notes: [] },
      { label: "Yesterday", notes: [] },
      { label: "Earlier this week", notes: [] },
      { label: "Older", notes: [] },
    ];
    notes.forEach((n) => {
      const d = new Date(n.updated_at);
      if (isToday(d)) groups[0].notes.push(n);
      else if (isYesterday(d)) groups[1].notes.push(n);
      else if (isAfter(d, weekAgo)) groups[2].notes.push(n);
      else groups[3].notes.push(n);
    });
    return groups.filter((g) => g.notes.length > 0);
  }, [notes]);

  const visibleNotes = showAll ? notes : notes.slice(0, 4);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = notes.findIndex((n) => n.id === active.id);
    const newIndex = notes.findIndex((n) => n.id === over.id);
    const reordered = arrayMove(notes, oldIndex, newIndex);
    reorderNotes.mutate(reordered.map((n, i) => ({ id: n.id, position: i })));
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Notes</h3>
          </div>
          <button onClick={onAddNote} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            + Add Note
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <StickyNote className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <button onClick={onAddNote} className="mt-2 text-xs font-medium text-primary hover:text-primary/80">
              Create your first note
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleNotes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {visibleNotes.map((note) => (
                  <SortableNoteCard key={note.id} note={note} onClick={() => setEditingNote(note)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {notes.length > 4 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-3 w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            See all notes ({notes.length})
          </button>
        )}
      </div>

      <NoteEditor
        open={!!editingNote}
        onClose={() => setEditingNote(null)}
        note={editingNote}
      />
    </>
  );
}
