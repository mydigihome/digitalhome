import { useState, useRef, useCallback } from "react";
import {
  X, Bold, Italic, Underline, Strikethrough, Heading2, Heading3,
  List, ListOrdered, ListChecks, Code, Link, Image, Eye, EyeOff,
  Sparkles, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const NOTE_COLORS = {
  yellow: {
    bg: "bg-amber-50/95 dark:bg-amber-950/80",
    border: "border-amber-200 dark:border-amber-700",
    accent: "bg-amber-400",
    header: "bg-amber-100/80 dark:bg-amber-900/40",
    stack1: "bg-amber-100 border-amber-200",
    stack2: "bg-amber-200 border-amber-300",
  },
  pink: {
    bg: "bg-pink-50/95 dark:bg-pink-950/80",
    border: "border-pink-200 dark:border-pink-700",
    accent: "bg-pink-400",
    header: "bg-pink-100/80 dark:bg-pink-900/40",
    stack1: "bg-pink-100 border-pink-200",
    stack2: "bg-pink-200 border-pink-300",
  },
  blue: {
    bg: "bg-sky-50/95 dark:bg-sky-950/80",
    border: "border-sky-200 dark:border-sky-700",
    accent: "bg-sky-400",
    header: "bg-sky-100/80 dark:bg-sky-900/40",
    stack1: "bg-sky-100 border-sky-200",
    stack2: "bg-sky-200 border-sky-300",
  },
  green: {
    bg: "bg-emerald-50/95 dark:bg-emerald-950/80",
    border: "border-emerald-200 dark:border-emerald-700",
    accent: "bg-emerald-400",
    header: "bg-emerald-100/80 dark:bg-emerald-900/40",
    stack1: "bg-emerald-100 border-emerald-200",
    stack2: "bg-emerald-200 border-emerald-300",
  },
  purple: {
    bg: "bg-violet-50/95 dark:bg-violet-950/80",
    border: "border-violet-200 dark:border-violet-700",
    accent: "bg-violet-400",
    header: "bg-violet-100/80 dark:bg-violet-900/40",
    stack1: "bg-violet-100 border-violet-200",
    stack2: "bg-violet-200 border-violet-300",
  },
} as const;

type NoteColor = keyof typeof NOTE_COLORS;

/* ─── Stacked sticky-note icon (3 layered rectangles) ─── */
function StackedNotesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      {/* back note */}
      <rect x="8" y="4" width="18" height="20" rx="2" className="fill-amber-300/70 stroke-amber-400" strokeWidth="1" />
      {/* middle note */}
      <rect x="5" y="7" width="18" height="20" rx="2" className="fill-pink-200/80 stroke-pink-300" strokeWidth="1" />
      {/* front note */}
      <rect x="2" y="10" width="18" height="20" rx="2" className="fill-sky-100 stroke-sky-300" strokeWidth="1" />
      {/* lines on front note */}
      <line x1="6" y1="16" x2="16" y2="16" className="stroke-sky-400/60" strokeWidth="1" strokeLinecap="round" />
      <line x1="6" y1="20" x2="14" y2="20" className="stroke-sky-400/60" strokeWidth="1" strokeLinecap="round" />
      <line x1="6" y1="24" x2="12" y2="24" className="stroke-sky-400/60" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Formatting toolbar button ─── */
function ToolbarBtn({ icon: Icon, label, active }: { icon: any; label: string; active?: boolean }) {
  return (
    <button
      title={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export default function AIStickyNote() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [color, setColor] = useState<NoteColor>("yellow");
  const [transparent, setTransparent] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [checklist, setChecklist] = useState([
    { id: "1", text: "", checked: false },
  ]);
  const dragOffset = useRef({ x: 0, y: 0 });

  const initPosition = useCallback(() => {
    if (position.x === -1) {
      setPosition({
        x: Math.max(40, window.innerWidth / 2 - 280),
        y: Math.max(40, window.innerHeight / 2 - 240),
      });
    }
  }, [position]);

  const handleOpen = () => {
    initPosition();
    setIsOpen(true);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".drag-handle")) return;
      e.preventDefault();
      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;
      dragOffset.current = { x: startX, y: startY };

      const onMove = (ev: MouseEvent) => {
        setPosition({
          x: Math.max(0, ev.clientX - dragOffset.current.x),
          y: Math.max(0, ev.clientY - dragOffset.current.y),
        });
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [position]
  );

  const updateCheckItem = (id: string, text: string) => {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));
  };
  const toggleCheckItem = (id: string) => {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)));
  };
  const addCheckItem = () => {
    setChecklist((prev) => [...prev, { id: Date.now().toString(), text: "", checked: false }]);
  };

  const c = NOTE_COLORS[color];

  /* ─── Closed state: stacked-notes FAB ─── */
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-xl transition-all hover:scale-110 hover:shadow-2xl active:scale-95"
        title="Open Sticky Note"
      >
        <StackedNotesIcon className="h-8 w-8" />
      </button>
    );
  }

  /* ─── Opened state: rich sticky note ─── */
  return (
    <div
      className={cn(
        "fixed z-50 flex w-[560px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border shadow-2xl transition-colors",
        c.bg,
        c.border,
        transparent && "!bg-opacity-40 backdrop-blur-md"
      )}
      style={{
        left: position.x,
        top: position.y,
        opacity: transparent ? 0.65 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* ── Header ── */}
      <div className={cn("drag-handle flex cursor-move items-center justify-between px-4 py-3", c.header)}>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
          <StackedNotesIcon className="h-5 w-5" />
          <span className="text-sm font-semibold text-foreground">Sticky Note</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Transparency toggle */}
          <div className="flex items-center gap-1.5">
            {transparent ? (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Switch
              checked={transparent}
              onCheckedChange={setTransparent}
              className="h-4 w-8 data-[state=checked]:bg-primary"
            />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 transition-colors hover:bg-foreground/10"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* ── Color bar ── */}
      <div className="flex items-center gap-1.5 border-b border-foreground/5 px-4 py-2">
        {(Object.keys(NOTE_COLORS) as NoteColor[]).map((key) => (
          <button
            key={key}
            onClick={() => setColor(key)}
            className={cn(
              "h-5 w-5 rounded-full border transition-all",
              NOTE_COLORS[key].accent,
              "border-foreground/10",
              color === key && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-110"
            )}
          />
        ))}
      </div>

      {/* ── Title ── */}
      <div className="px-4 pt-4">
        <input
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Note title…"
          className="w-full border-none bg-transparent text-lg font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {/* ── Formatting toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-foreground/5 px-4 py-1.5">
        <ToolbarBtn icon={Bold} label="Bold" />
        <ToolbarBtn icon={Italic} label="Italic" />
        <ToolbarBtn icon={Underline} label="Underline" />
        <ToolbarBtn icon={Strikethrough} label="Strikethrough" />
        <div className="mx-1 h-4 w-px bg-foreground/10" />
        <ToolbarBtn icon={Heading2} label="Heading 2" />
        <ToolbarBtn icon={Heading3} label="Heading 3" />
        <div className="mx-1 h-4 w-px bg-foreground/10" />
        <ToolbarBtn icon={List} label="Bullet List" />
        <ToolbarBtn icon={ListOrdered} label="Numbered List" />
        <ToolbarBtn icon={ListChecks} label="Checklist" />
        <div className="mx-1 h-4 w-px bg-foreground/10" />
        <ToolbarBtn icon={Code} label="Code" />
        <ToolbarBtn icon={Link} label="Link" />
        <ToolbarBtn icon={Image} label="Image" />
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 px-4 py-3">
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Type '/' for commands, or just start writing…"
          className="h-32 w-full resize-none border-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      {/* ── Checklist ── */}
      <div className="border-t border-foreground/5 px-4 py-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Steps:</p>
        <div className="space-y-1.5">
          {checklist.map((item) => (
            <label key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleCheckItem(item.id)}
                className="h-4 w-4 rounded border-foreground/20 text-primary accent-primary"
              />
              <input
                value={item.text}
                onChange={(e) => updateCheckItem(item.id, e.target.value)}
                placeholder="Add a step…"
                className={cn(
                  "flex-1 border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none",
                  item.checked && "text-muted-foreground line-through"
                )}
              />
            </label>
          ))}
        </div>
        <button
          onClick={addCheckItem}
          className="mt-1.5 text-xs font-medium text-primary hover:underline"
        >
          + Add step
        </button>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t border-foreground/5 px-4 py-3">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setIsOpen(false)}>
          Close
        </Button>
        <Button size="sm" className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground text-xs">
          <Sparkles className="mr-1.5 h-3 w-3" /> Generate with AI
        </Button>
      </div>
    </div>
  );
}
