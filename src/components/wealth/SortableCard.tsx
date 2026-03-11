import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableCardProps {
  id: string;
  isEditMode: boolean;
  children: React.ReactNode;
}

export default function SortableCard({ id, isEditMode, children }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isEditMode && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-12 rounded-lg bg-primary/90 text-primary-foreground flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <div className={isEditMode ? "ring-2 ring-primary/40 rounded-3xl transition-shadow" : ""}>
        {children}
      </div>
    </div>
  );
}
