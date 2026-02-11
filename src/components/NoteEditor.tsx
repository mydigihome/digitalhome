import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks,
  Link2, Code, Quote, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateNote, useUpdateNote, type Note } from "@/hooks/useNotes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  open: boolean;
  onClose: () => void;
  note?: Note | null;
}

export default function NoteEditor({ open, onClose, note }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start writing your note..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: note?.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-6 py-5",
      },
    },
  });

  useEffect(() => {
    if (editor && note?.content) {
      editor.commands.setContent(note.content);
    }
  }, [note?.id]);

  useEffect(() => {
    setTitle(note?.title || "");
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
        await updateNote.mutateAsync({ id: note.id, title: noteTitle, content, content_preview });
      } else {
        await createNote.mutateAsync({ title: noteTitle, content, content_preview });
      }
      setLastSaved(new Date());
      toast.success("Note saved!");
      onClose();
    } catch {
      toast.error("Failed to save note");
    }
    setSaving(false);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold"), group: 1 },
    { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic"), group: 1 },
    { icon: UnderlineIcon, action: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline"), group: 1 },
    { icon: Strikethrough, action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive("strike"), group: 1 },
    { icon: Heading1, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }), group: 2 },
    { icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }), group: 2 },
    { icon: Heading3, action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }), group: 2 },
    { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList"), group: 3 },
    { icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList"), group: 3 },
    { icon: ListChecks, action: () => editor?.chain().focus().toggleTaskList().run(), active: editor?.isActive("taskList"), group: 3 },
    { icon: Code, action: () => editor?.chain().focus().toggleCodeBlock().run(), active: editor?.isActive("codeBlock"), group: 4 },
    { icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive("blockquote"), group: 4 },
    { icon: Minus, action: () => editor?.chain().focus().setHorizontalRule().run(), active: false, group: 4 },
  ];

  let lastGroup = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-foreground/40 backdrop-blur-[4px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/2 z-[9999] flex w-[680px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
            style={{ maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 pt-5 pb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled note..."
                className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                autoFocus
              />
              <button onClick={onClose} className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-secondary">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/50 px-4 py-2">
              {toolbarButtons.map(({ icon: Icon, action, active, group }, i) => {
                const showDivider = lastGroup !== 0 && group !== lastGroup;
                lastGroup = group;
                return (
                  <span key={i} className="contents">
                    {showDivider && <span className="mx-1 h-4 w-px bg-border" />}
                    <button
                      onClick={action}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(80vh - 180px)" }}>
              <EditorContent editor={editor} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <div className="flex items-center gap-2">
                {lastSaved && <div className="h-2 w-2 rounded-full bg-success" />}
                <span className="text-xs text-muted-foreground">
                  {saving ? "Saving..." : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : "Editing now"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
