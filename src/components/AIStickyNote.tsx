import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const NOTE_COLORS = {
  yellow: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    swatch: "bg-amber-200 border-amber-300",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    border: "border-pink-200 dark:border-pink-800",
    swatch: "bg-pink-200 border-pink-300",
  },
  blue: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
    swatch: "bg-sky-200 border-sky-300",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    swatch: "bg-emerald-200 border-emerald-300",
  },
  purple: {
    bg: "bg-primary/5",
    border: "border-primary/20",
    swatch: "bg-primary/30 border-primary/40",
  },
} as const;

type NoteColor = keyof typeof NOTE_COLORS;

export default function AIStickyNote() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: -1, y: 100 });
  const [color, setColor] = useState<NoteColor>("yellow");
  const [transparency, setTransparency] = useState([95]);
  const [noteContent, setNoteContent] = useState("");
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Initialize position on first open
  useEffect(() => {
    if (isOpen && position.x === -1) {
      setPosition({ x: window.innerWidth - 420, y: 100 });
    }
  }, [isOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      isDragging.current = true;
      dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };

      const handleMove = (ev: MouseEvent) => {
        setPosition({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y });
      };
      const handleUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    }
  }, [position]);

  const c = NOTE_COLORS[color];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20 bg-card shadow-lg transition-transform hover:scale-110"
        title="AI Sticky Note"
      >
        <Sparkles className="h-5 w-5 text-primary" />
      </button>
    );
  }

  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed z-50 rounded-2xl border-2 shadow-2xl transition-colors",
        c.bg,
        c.border,
        isMinimized ? "w-64" : "w-96"
      )}
      style={{ left: position.x, top: position.y, opacity: transparency[0] / 100 }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="drag-handle flex cursor-move items-center justify-between border-b border-foreground/10 p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Note</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="rounded p-1 transition-colors hover:bg-foreground/10">
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="rounded p-1 transition-colors hover:bg-foreground/10">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="p-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Ask AI anything… or jot a quick note"
              className="h-48 w-full resize-none rounded-lg border-none bg-background/50 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-3 border-t border-foreground/10 p-4">
            {/* Color Picker */}
            <div>
              <span className="mb-2 block text-xs font-medium text-muted-foreground">Color</span>
              <div className="flex gap-2">
                {(Object.keys(NOTE_COLORS) as NoteColor[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setColor(key)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      NOTE_COLORS[key].swatch,
                      color === key && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Transparency */}
            <div>
              <span className="mb-2 block text-xs font-medium text-muted-foreground">
                Opacity: {transparency[0]}%
              </span>
              <Slider min={30} max={100} step={1} value={transparency} onValueChange={setTransparency} className="w-full" />
            </div>

            {/* AI Button */}
            <Button className="w-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground" size="sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate with AI
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
