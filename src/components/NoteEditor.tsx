import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Draggable from "react-draggable";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bold, Italic, List, GripHorizontal,
} from "lucide-react";
import { useCreateNote, useUpdateNote, type Note } from "@/hooks/useNotes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const NOTE_COLORS = ["#C4B5FD", "#BFDBFE", "#FBCFE8", "#FED7AA"];

function hexToRgba(hex: string, opacity: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity / 100})`;
}

interface NoteEditorProps {
  open: boolean;
  onClose: () => void;
  note?: Note | null;
}

export default function NoteEditor({ open, onClose, note }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [cardColor, setCardColor] = useState(note?.card_color || "#C4B5FD");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const nodeRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start typing your note..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: note?.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] max-h-[400px] overflow-y-auto px-5 py-4",
        style: "font-size:15px;line-height:1.6;color:rgba(0,0,0,0.75);",
      },
    },
  });

  useEffect(() => {
    if (editor && note?.content) editor.commands.setContent(note.content);
  }, [note?.id]);

  useEffect(() => {
    setTitle(note?.title || "");
    setCardColor(note?.card_color || "#C4B5FD");
  }, [note?.id]);

  const getPreview = useCallback(() => {
    if (!editor) return "";
    return editor.getText().slice(0, 200);
  }, [editor]);

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    const content = editor.getJSON();
    const content_preview = getPreview();
    const noteTitle = title.trim() || "Untitled note";

    try {
      if (note?.id) {
        await updateNote.mutateAsync({ id: note.id, title: noteTitle, content, content_preview, card_color: cardColor, card_opacity: 92 });
      } else {
        await createNote.mutateAsync({ title: noteTitle, content, content_preview, card_color: cardColor, card_opacity: 92 });
      }
      toast.success("Note saved!");
      onClose();
    } catch {
      toast.error("Failed to save note");
    }
    setSaving(false);
  };

  // Recalculate position each time modal opens
  const getInitialPos = () => ({
    x: Math.max(0, Math.floor((window.innerWidth - 400) / 2)),
    y: Math.max(20, Math.floor((window.innerHeight - 400) / 2)),
  });

  const stickyContent = (
    <>
      {/* Header - drag handle */}
      <div
        className={cn("drag-handle-note flex items-center justify-between px-4 select-none", !isMobile && "cursor-grab active:cursor-grabbing")}
        style={{
          height: 52,
          background: cardColor,
          borderRadius: isMobile ? "16px 16px 0 0" : "16px 16px 0 0",
        }}
      >
        <GripHorizontal className="h-5 w-5" style={{ color: "rgba(0,0,0,0.3)" }} />
        <div className="flex items-center gap-2">
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex h-7 w-7 rounded-full transition-transform hover:scale-110"
              style={{ background: cardColor, border: "2px solid rgba(0,0,0,0.1)" }}
            />
            {showColorPicker && (
              <div
                className="absolute right-0 top-9 z-10 grid grid-cols-2 gap-2 rounded-xl bg-white p-3"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)", width: 128 }}
              >
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCardColor(c); setShowColorPicker(false); }}
                    className="h-12 w-12 rounded-full transition-all hover:scale-110 hover:-translate-y-0.5"
                    style={{
                      background: c,
                      border: c === cardColor ? "3px solid rgba(0,0,0,0.3)" : "3px solid white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-white/20">
            <X className="h-4 w-4" style={{ color: "rgba(0,0,0,0.4)" }} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className="flex flex-1 flex-col"
        style={{
          background: hexToRgba(cardColor, 85),
          borderRadius: "0 0 16px 16px",
        }}
      >
        {/* Title */}
        <div className="px-5 pt-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full bg-transparent text-lg font-semibold outline-none placeholder:opacity-40"
            style={{ color: "rgba(0,0,0,0.9)" }}
            autoFocus
          />
        </div>

        {/* Simple toolbar */}
        <div className="flex items-center gap-0.5 px-4 py-2 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {[
            { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
            { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
            { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList") },
           ].map(({ icon: Icon, action, active }, i) => (
             <button
               key={i}
               onMouseDown={(e) => { e.preventDefault(); action(); }}
               className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors", active ? "bg-black/10" : "hover:bg-black/5")}
             >
               <Icon className="h-3.5 w-3.5" style={{ color: "rgba(0,0,0,0.6)" }} />
             </button>
           ))}
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: "rgba(0,0,0,0.08)",
              color: "rgba(0,0,0,0.7)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
          >
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-foreground/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {isMobile ? (
            /* Mobile: full-screen bottom sheet */
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[10000] flex flex-col overflow-hidden"
              style={{
                maxHeight: "92vh",
                borderRadius: "16px 16px 0 0",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
              }}
            >
              {/* Drag indicator */}
              <div className="flex justify-center pt-2 pb-0" style={{ background: cardColor, borderRadius: "16px 16px 0 0" }}>
                <div className="h-1 w-10 rounded-full" style={{ background: "rgba(0,0,0,0.2)" }} />
              </div>
              {stickyContent}
            </motion.div>
          ) : (
            /* Desktop: draggable modal */
            <div className="fixed inset-0 z-[10000] pointer-events-none">
              <Draggable
                handle=".drag-handle-note"
                nodeRef={nodeRef as any}
                defaultPosition={getInitialPos()}
              >
                <div
                  ref={nodeRef}
                  className="pointer-events-auto absolute flex flex-col overflow-hidden"
                  style={{
                    width: 400,
                    minHeight: 350,
                    maxHeight: 600,
                    borderRadius: 16,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                  }}
                >
                  {stickyContent}
                </div>
              </Draggable>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
