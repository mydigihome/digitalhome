import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cloud, Lock, Unlock, Paperclip, Pencil, Puzzle, Palette, Heart, Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCreateJournalEntry, useUpdateJournalEntry, JournalEntry } from "@/hooks/useJournal";
import { supabase } from "@/integrations/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import DrawingCanvas from "./DrawingCanvas";
import ColoringBook from "./ColoringBook";
import PuzzleGames from "./PuzzleGames";
import PinModal from "./PinModal";
import TherapistFinderModal from "./TherapistFinderModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const MOODS = ["😢", "😟", "😐", "🙂", "😊"];

interface JournalEntryModalProps {
  open: boolean;
  onClose: () => void;
  entry?: JournalEntry | null;
  readOnly?: boolean;
}

export default function JournalEntryModal({ open, onClose, entry, readOnly = false }: JournalEntryModalProps) {
  const { profile } = useAuth();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [moodEmoji, setMoodEmoji] = useState<string | null>(null);
  const [moodText, setMoodText] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showColoring, setShowColoring] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showTherapist, setShowTherapist] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "unlock">("set");
  const [saving, setSaving] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] px-1",
      },
    },
  });

  // Init from entry
  useEffect(() => {
    if (!open) return;
    if (entry) {
      setTitle(entry.title || "");
      setEntryDate(entry.entry_date);
      setMoodEmoji(entry.mood_emoji);
      setMoodText(entry.mood_text || "");
      setIsLocked(entry.is_locked);
      setEntryId(entry.id);
      if (editor && entry.content) {
        editor.commands.setContent(entry.content);
      }
    } else {
      setTitle("");
      setEntryDate(format(new Date(), "yyyy-MM-dd"));
      setMoodEmoji(null);
      setMoodText("");
      setIsLocked(false);
      setEntryId(null);
      setMediaUrls([]);
      editor?.commands.clearContent();
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 3000);
    }
  }, [open, entry, editor]);

  // Auto-save every 30s
  useEffect(() => {
    if (!open || readOnly || !editor) return;
    autoSaveTimer.current = setInterval(() => {
      handleSave(true);
    }, 30000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [open, readOnly, editor, entryId]);

  const getPreview = useCallback(() => {
    if (!editor) return "";
    return editor.getText().slice(0, 200);
  }, [editor]);

  const handleSave = async (silent = false) => {
    if (!editor || saving) return;
    setSaving(true);
    try {
      const payload = {
        title: title || "Untitled Entry",
        content: editor.getJSON(),
        content_preview: getPreview(),
        mood_emoji: moodEmoji,
        mood_text: moodText || null,
        entry_date: entryDate,
        is_locked: isLocked,
      };

      if (entryId) {
        await updateEntry.mutateAsync({ id: entryId, ...payload });
      } else {
        const result = await createEntry.mutateAsync(payload);
        setEntryId(result.id);
      }
      if (!silent) {
        toast.success("Entry saved");
        onClose();
      }
    } catch {
      if (!silent) toast.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const ensureEntryId = async (): Promise<string> => {
    if (entryId) return entryId;
    const result = await createEntry.mutateAsync({
      title: title || "Untitled Entry",
      content: editor?.getJSON(),
      content_preview: getPreview(),
      entry_date: entryDate,
    });
    setEntryId(result.id);
    return result.id;
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const currentEntryId = await ensureEntryId();

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${(await supabase.auth.getUser()).data.user?.id}/${currentEntryId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("journal-media").upload(path, file);
      if (error) { toast.error("Upload failed"); continue; }

      const { data: urlData } = supabase.storage.from("journal-media").getPublicUrl(path);
      await supabase.from("journal_media").insert({
        entry_id: currentEntryId,
        media_type: file.type.startsWith("video") ? "video" : "image",
        file_url: urlData.publicUrl,
      });
      setMediaUrls((prev) => [...prev, urlData.publicUrl]);
    }
    toast.success("Media uploaded");
  };

  const handleImageSave = async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const currentEntryId = await ensureEntryId();
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const path = `${userId}/${currentEntryId}/${crypto.randomUUID()}.png`;
    const { error } = await supabase.storage.from("journal-media").upload(path, blob);
    if (error) { toast.error("Failed to save"); return; }
    const { data: urlData } = supabase.storage.from("journal-media").getPublicUrl(path);
    await supabase.from("journal_media").insert({
      entry_id: currentEntryId,
      media_type: "drawing",
      file_url: urlData.publicUrl,
    });
    setMediaUrls((prev) => [...prev, urlData.publicUrl]);
    toast.success("Saved to journal");
  };

  const handlePuzzleComplete = async (gameName: string, timeSeconds: number) => {
    const currentEntryId = await ensureEntryId();
    // Add activity record
    await supabase.from("journal_activities").insert({
      entry_id: currentEntryId,
      activity_type: "puzzle",
      activity_data: { game: gameName, time_seconds: timeSeconds },
    });
    // Append completion note to editor
    if (editor) {
      const timeStr = `${Math.floor(timeSeconds / 60)}:${(timeSeconds % 60).toString().padStart(2, "0")}`;
      editor.commands.insertContent(`<p>🧩 I completed <strong>${gameName}</strong> in <strong>${timeStr}</strong>!</p>`);
    }
  };

  const handleLockToggle = async () => {
    if (!entryId) {
      // Must save first
      toast.error("Save the entry first before locking");
      return;
    }
    if (isLocked) {
      // Unlock
      setPinMode("unlock");
      setShowPinModal(true);
    } else {
      // Set PIN
      setPinMode("set");
      setShowPinModal(true);
    }
  };

  const handlePinSuccess = () => {
    if (pinMode === "set") {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
    qc.invalidateQueries({ queryKey: ["journal-entries"] });
    qc.invalidateQueries({ queryKey: ["journal-entry"] });
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Friend";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col bg-background"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Journal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLockToggle}
                  className={`rounded-md p-1.5 transition-colors ${isLocked ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary"}`}
                  title={isLocked ? "Unlock entry" : "Lock entry"}
                >
                  {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>
                <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Welcome message overlay */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-background/80"
                >
                  <p className="text-lg text-muted-foreground/60 text-center px-8">
                    Hi {firstName}, let your thoughts go here...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
                {/* Title */}
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Entry"
                  className="border-none text-xl font-semibold shadow-none focus-visible:ring-0 px-0 h-auto py-1"
                  readOnly={readOnly}
                />

                {/* Date */}
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="mt-1 text-xs text-muted-foreground bg-transparent border-none outline-none"
                  readOnly={readOnly}
                />

                {/* Mood */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {MOODS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => !readOnly && setMoodEmoji(moodEmoji === emoji ? null : emoji)}
                        className={`text-2xl transition-transform hover:scale-110 ${
                          moodEmoji === emoji ? "scale-125 drop-shadow-md" : "opacity-50 hover:opacity-80"
                        }`}
                        disabled={readOnly}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={moodText}
                    onChange={(e) => setMoodText(e.target.value)}
                    placeholder="How do you feel?"
                    className="text-sm border-dashed"
                    readOnly={readOnly}
                  />
                </div>

                {/* Rich text toolbar */}
                {!readOnly && editor && (
                  <div className="mt-4 flex items-center gap-1 border-b border-border pb-2">
                    {[
                      { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
                      { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
                      { icon: Underline, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
                      { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
                      { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
                    ].map(({ icon: Icon, action, active }, i) => (
                      <button
                        key={i}
                        onMouseDown={(e) => { e.preventDefault(); action(); }}
                        className={`rounded-md p-1.5 transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Editor */}
                <div className="mt-4 min-h-[300px]">
                  <EditorContent editor={editor} />
                </div>

                {/* Media previews */}
                {mediaUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {mediaUrls.map((url, i) => (
                      <div key={i} className="aspect-square overflow-hidden rounded-lg border border-border">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Creative tools */}
                {!readOnly && (
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer">
                      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary">
                        <Paperclip className="h-4 w-4" />
                        Add Media
                      </span>
                    </label>
                    <Button variant="outline" size="sm" onClick={() => setShowDrawing(true)}>
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Draw
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowColoring(true)}>
                      <Palette className="mr-1.5 h-4 w-4" />
                      Coloring Book
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowPuzzle(true)}>
                      <Puzzle className="mr-1.5 h-4 w-4" />
                      Puzzle
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-6">
              <Button variant="outline" size="sm" onClick={() => setShowTherapist(true)} className="text-primary border-primary/30">
                <Heart className="mr-1.5 h-4 w-4" />
                Find Therapist
              </Button>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                  Discard
                </button>
                {!readOnly && (
                  <Button size="sm" onClick={() => handleSave(false)} disabled={saving}>
                    {saving ? "Saving..." : "Save Entry"}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DrawingCanvas open={showDrawing} onClose={() => setShowDrawing(false)} onSave={handleImageSave} />
      <ColoringBook open={showColoring} onClose={() => setShowColoring(false)} onSave={handleImageSave} />
      <PuzzleGames open={showPuzzle} onClose={() => setShowPuzzle(false)} onComplete={handlePuzzleComplete} />
      <TherapistFinderModal open={showTherapist} onClose={() => setShowTherapist(false)} />
      {entryId && (
        <PinModal
          open={showPinModal}
          onClose={() => setShowPinModal(false)}
          entryId={entryId}
          mode={pinMode}
          onSuccess={handlePinSuccess}
        />
      )}
    </>
  );
}
