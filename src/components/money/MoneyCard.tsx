import { useState, ReactNode } from "react";
import { Pencil, GripVertical, EyeOff } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Switch } from "@/components/ui/switch";

interface MoneyCardProps {
  id: string;
  front: ReactNode;
  back: ReactNode;
  className?: string;
  fullWidth?: boolean;
  onHide?: () => void;
  cardLabel?: string;
}

export default function MoneyCard({ id, front, back, className = "", fullWidth, onHide, cardLabel }: MoneyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hideToggle, setHideToggle] = useState(false);
  const [hiding, setHiding] = useState(false);

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
    transition: transition || "transform 350ms cubic-bezier(0.25, 1, 0.5, 1)",
    opacity: hiding ? 0 : isDragging ? 0.95 : 1,
    zIndex: isDragging ? 50 : undefined,
    scale: hiding ? 0.95 : isDragging ? 1.02 : 1,
  };

  const handleFlip = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select") || target.closest("textarea") || target.closest("iframe") || target.closest("a") || target.closest("[role='switch']")) return;
    setIsFlipped((f) => !f);
  };

  const handleSave = () => {
    if (hideToggle && onHide) {
      setHiding(true);
      setTimeout(() => { onHide(); setHiding(false); setHideToggle(false); setIsFlipped(false); }, 300);
    } else {
      setIsFlipped(false);
    }
  };

  const handleCancel = () => {
    setHideToggle(false);
    setIsFlipped(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group/card transition-all duration-300 ${fullWidth ? "col-span-1 lg:col-span-2" : ""} ${className}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-1 top-3 z-30 w-6 h-7 rounded-lg bg-white/80 dark:bg-[#252836]/80 backdrop-blur flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover/card:opacity-40 hover:!opacity-100 transition-opacity hidden md:flex"
        style={{ boxShadow: "0 2px 8px rgba(70,69,84,0.1)" }}
      >
        <GripVertical className="w-3.5 h-3.5" style={{ color: "#767586" }} />
      </div>

      {/* Edit hint */}
      <div className="absolute top-3 right-3 z-30 w-6 h-6 rounded-full bg-white/80 dark:bg-[#252836]/80 backdrop-blur flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hidden md:flex pointer-events-none"
        style={{ boxShadow: "0 2px 8px rgba(70,69,84,0.1)" }}
      >
        <Pencil className="w-3 h-3" style={{ color: "#767586" }} />
      </div>

      {/* Card — no flip, show front or back */}
      <div
        className="money-card cursor-pointer"
        style={{
          boxShadow: isDragging ? "0 20px 60px rgba(70,69,84,0.15)" : undefined,
          overflow: "hidden",
        }}
        onClick={handleFlip}
      >
        {!isFlipped ? (
          front
        ) : (
          <div>
            {back}

            {/* Hide toggle */}
            {onHide && (
              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid #f3f3f8" }}>
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4" style={{ color: "#767586" }} />
                  <span className="text-sm font-bold" style={{ color: "#767586" }}>Hide this card</span>
                </div>
                <Switch
                  checked={hideToggle}
                  onCheckedChange={setHideToggle}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Cancel/Save */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="flex-1 rounded-full px-5 py-2 font-bold text-sm"
                style={{ background: "#f3f3f8", color: "#464554" }}
              >
                Cancel
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                className="flex-1 rounded-full px-5 py-2 font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
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
      className="w-full rounded-xl px-3 py-2 text-sm font-medium border-none focus:ring-2 focus:outline-none"
      style={{ background: "#f3f3f8", color: "#1a1c1f" }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export function EditActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return null;
}
