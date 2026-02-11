import { useState, useMemo } from "react";
import { StickyNote, GripVertical, Trash2, ListTodo, Lightbulb, Sparkles, Plus } from "lucide-react";
import { motion } from "framer-motion";
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
  updated_at: string;
  taskCount?: number;
  ideaCount?: number;
  reminderCount?: number;
  original: Note | BrainDump;
}

function SortableNoteRow({ item, onClick }: { item: UnifiedItem; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const deleteNote = useDeleteNote();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const bgColor = hexToRgba(item.color, 15);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeft: `4px solid ${item.color}`, background: bgColor }}
      className={cn(
        "group flex items-center gap-3 rounded-[10px] p-3 transition-all duration-150 cursor-pointer",
        isDragging && "rotate-1 scale-[1.03] shadow-lg z-50",
        !isDragging && "hover:-translate-y-px hover:shadow-sm"
      )}
      onClick={onClick}
    >
      {/* Drag handle - visible on hover */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing shrink-0"
        style={{ color: "rgba(0,0,0,0.2)" }}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "rgba(0,0,0,0.85)" }}>
          {item.title || "Untitled note"}
        </p>
        {item.preview && (
          <p className="mt-0.5 text-[13px] truncate" style={{ color: "rgba(0,0,0,0.5)" }}>
            {item.preview}
          </p>
        )}
        {/* Badges */}
        {item.type === "brain_dump" && (item.taskCount || item.ideaCount || item.reminderCount) ? (
          <div className="mt-1 flex items-center gap-1">
            {item.taskCount! > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                Tasks: {item.taskCount}
              </span>
            )}
            {item.ideaCount! > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[11px] font-medium text-purple-700">
                Ideas: {item.ideaCount}
              </span>
            )}
            {item.reminderCount! > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[11px] font-medium text-orange-700">
                Reminders: {item.reminderCount}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>
          {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
        </span>
        {item.type === "brain_dump" && (
          <Sparkles className="h-3 w-3" style={{ color: "rgba(0,0,0,0.2)" }} />
        )}
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

  const unifiedItems: UnifiedItem[] = useMemo(() => {
    const noteItems: UnifiedItem[] = notes.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title || "Untitled note",
      preview: n.content_preview || "",
      color: n.card_color || "#8B5CF6",
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
        updated_at: d.created_at,
        taskCount: structured?.tasks?.length || 0,
        ideaCount: structured?.ideas?.length || 0,
        reminderCount: structured?.reminders?.length || 0,
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
  };

  return (
    <>
      <div
        className="rounded-2xl border border-border bg-card shadow-sm"
        style={{ padding: 24, minHeight: 300, maxHeight: 500 }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <StickyNote className="h-[18px] w-[18px] text-primary" />
            <h3 className="text-[17px] font-semibold text-foreground">Notes</h3>
          </div>
          <button
            onClick={onAddNote}
            className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        {/* Notes list */}
        {unifiedItems.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <StickyNote className="mb-2 h-12 w-12 text-muted-foreground/30" />
            </motion.div>
            <p className="text-[15px] font-medium text-muted-foreground">No notes yet</p>
            <p className="text-[13px] text-muted-foreground/60 mt-1">Click + to create your first note</p>
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleItems.map((n) => n.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {visibleItems.map((item) => (
                    <SortableNoteRow key={item.id} item={item} onClick={() => handleItemClick(item)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
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
