import { useState, useMemo } from "react";
import { StickyNote, GripVertical, Trash2, ListTodo, Lightbulb, Sparkles } from "lucide-react";
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
import { useBrainDumps, type BrainDump } from "@/hooks/useBrainDumps";
import NoteEditor from "@/components/NoteEditor";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function hexToRgba(hex: string, opacity: number) {
  if (!hex || !hex.startsWith("#")) return undefined;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity / 100})`;
}

interface UnifiedItem {
  id: string;
  type: "note" | "brain_dump";
  title: string;
  preview: string;
  color: string;
  opacity: number;
  updated_at: string;
  taskCount?: number;
  ideaCount?: number;
  original: Note | BrainDump;
}

function SortableNoteCard({ item, onClick }: { item: UnifiedItem; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const deleteNote = useDeleteNote();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const bgColor = hexToRgba(item.color, item.opacity) || undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeft: `4px solid ${item.color}`, background: bgColor }}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-xl p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm",
        isDragging && "rotate-1 scale-[1.02] shadow-lg z-50"
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate" style={{ color: "rgba(0,0,0,0.85)" }}>
          {item.title || "Untitled note"}
        </p>
        {item.preview && (
          <p className="mt-0.5 text-[13px] line-clamp-2" style={{ color: "rgba(0,0,0,0.5)" }}>
            {item.preview}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[11px]" style={{ color: "rgba(0,0,0,0.35)" }}>
            {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
          </span>
          {item.type === "brain_dump" && item.taskCount && item.taskCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
              <ListTodo className="h-3 w-3" /> {item.taskCount}
            </span>
          )}
          {item.type === "brain_dump" && item.ideaCount && item.ideaCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[11px] font-medium text-purple-700">
              <Lightbulb className="h-3 w-3" /> {item.ideaCount}
            </span>
          )}
          {item.type === "brain_dump" && (
            <Sparkles className="h-3 w-3" style={{ color: "rgba(0,0,0,0.25)" }} />
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          style={{ color: "rgba(0,0,0,0.2)" }}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {item.type === "note" && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteNote.mutate(item.id); toast.success("Note deleted"); }}
            className="rounded p-0.5 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            style={{ color: "rgba(0,0,0,0.2)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotesWidget({ onAddNote }: { onAddNote: () => void }) {
  const { data: notes = [] } = useNotes();
  const { data: dumps = [] } = useBrainDumps();
  const reorderNotes = useReorderNotes();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showAll, setShowAll] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Unify notes and brain dumps into a single sorted list
  const unifiedItems: UnifiedItem[] = useMemo(() => {
    const noteItems: UnifiedItem[] = notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title || "Untitled note",
      preview: n.content_preview || "",
      color: n.card_color || "#8B5CF6",
      opacity: n.card_opacity ?? 92,
      updated_at: n.updated_at,
      original: n,
    }));

    const dumpItems: UnifiedItem[] = dumps.map((d) => {
      const structured = d.structured_data as any;
      return {
        id: d.id,
        type: "brain_dump" as const,
        title: d.ai_title || d.content.slice(0, 40),
        preview: d.summary || d.content.slice(0, 80),
        color: d.card_color || "#8B5CF6",
        opacity: (d as any).card_opacity ?? 92,
        updated_at: d.created_at,
        taskCount: structured?.tasks?.length || 0,
        ideaCount: structured?.ideas?.length || 0,
        original: d,
      };
    });

    return [...noteItems, ...dumpItems].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [notes, dumps]);

  const visibleItems = showAll ? unifiedItems : unifiedItems.slice(0, 8);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Only reorder notes (not brain dumps)
    const noteIds = notes.map((n) => n.id);
    if (!noteIds.includes(active.id as string) || !noteIds.includes(over.id as string)) return;
    const oldIndex = notes.findIndex((n) => n.id === active.id);
    const newIndex = notes.findIndex((n) => n.id === over.id);
    const reordered = arrayMove(notes, oldIndex, newIndex);
    reorderNotes.mutate(reordered.map((n, i) => ({ id: n.id, position: i })));
  };

  const handleItemClick = (item: UnifiedItem) => {
    if (item.type === "note") {
      setEditingNote(item.original as Note);
    }
    // Brain dump click could open a detail view in future
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

        {unifiedItems.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <StickyNote className="mb-2 h-12 w-12 text-muted-foreground/30" />
            </motion.div>
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap + or the animated icon to start</p>
            <button onClick={onAddNote} className="mt-3 text-xs font-medium text-primary hover:text-primary/80">
              Create your first note
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleItems.map((n) => n.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5">
                {visibleItems.map((item) => (
                  <SortableNoteCard key={item.id} item={item} onClick={() => handleItemClick(item)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {unifiedItems.length > 8 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-3 w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all notes ({unifiedItems.length})
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
