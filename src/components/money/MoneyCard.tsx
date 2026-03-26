import { useState, ReactNode } from "react";
import { Pencil, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MoneyCardProps {
  id: string;
  front: ReactNode;
  back: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export default function MoneyCard({ id, front, back, className = "", fullWidth }: MoneyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleFlip = (e: React.MouseEvent) => {
    // Don't flip if clicking buttons/inputs inside
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select") || target.closest("textarea") || target.closest("iframe") || target.closest("a")) return;
    setIsFlipped((f) => !f);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group/card ${fullWidth ? "col-span-1 lg:col-span-2" : ""} ${className}`}
    >
      {/* Drag handle — desktop only */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-1 top-4 z-30 w-7 h-8 rounded-lg bg-white/80 backdrop-blur flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover/card:opacity-100 transition-opacity hidden md:flex"
        style={{ boxShadow: "0 2px 8px rgba(70,69,84,0.1)" }}
      >
        <GripVertical className="w-3.5 h-3.5" style={{ color: "#767586" }} />
      </div>

      {/* Edit hint — desktop only */}
      <div className="absolute top-4 right-4 z-30 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hidden md:flex pointer-events-none"
        style={{ boxShadow: "0 2px 8px rgba(70,69,84,0.1)" }}
      >
        <Pencil className="w-3 h-3" style={{ color: "#767586" }} />
      </div>

      {/* Flip container */}
      <div
        className="w-full cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={handleFlip}
      >
        <div
          className="relative w-full transition-transform duration-[400ms] ease-in-out"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* FRONT */}
          <div
            className="w-full rounded-[24px] p-6 md:p-8"
            style={{
              backfaceVisibility: "hidden",
              background: "#ffffff",
              boxShadow: "0 12px 40px rgba(70,69,84,0.06)",
            }}
          >
            {front}
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 w-full rounded-[24px] p-6 md:p-8 overflow-y-auto"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#ffffff",
              boxShadow: "0 12px 40px rgba(70,69,84,0.06)",
            }}
          >
            {back}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Shared edit form components */
export function EditLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#767586" }}>
      {children}
    </label>
  );
}

export function EditInput({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium border-none focus:ring-2 focus:outline-none"
      style={{ background: "#f3f3f8", color: "#1a1c1f" }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export function EditActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="flex-1 rounded-full px-6 py-2.5 font-bold text-sm"
        style={{ background: "#f3f3f8", color: "#464554" }}
      >
        Cancel
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onSave(); }}
        className="flex-1 rounded-full px-6 py-2.5 font-bold text-sm text-white"
        style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
      >
        Save Changes
      </button>
    </div>
  );
}
