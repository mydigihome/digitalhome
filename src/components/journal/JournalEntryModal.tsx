import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cloud, Lock, Unlock, Paperclip, Pencil, Puzzle, Palette, Heart, Bold, Italic, Underline, List, ListOrdered, ChevronLeft, MoreHorizontal, Church } from "lucide-react";
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
import ChurchFinderModal from "./ChurchFinderModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const STITCH_MOODS = [
  { emoji: "happy", label: "Happy" },
  { emoji: "calm", label: "Calm" },
  { emoji: "inspired", label: "Inspired" },
  { emoji: "focused", label: "Focused" },
  { emoji: "sad", label: "Sad" },
];

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
  const [showChurch, setShowChurch] = useState(false);
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
      Placeholder.configure({ placeholder: "Start writing your thoughts..." }),
    ],
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] px-1 text-base leading-relaxed",
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
      setTimeout(() => setShowWelcome(false), 1500);
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
    await supabase.from("journal_activities").insert({
      entry_id: currentEntryId,
      activity_type: "puzzle",
      activity_data: { game: gameName, time_seconds: timeSeconds },
    });
    if (editor) {
      const timeStr = `${Math.floor(timeSeconds / 60)}:${(timeSeconds % 60).toString().padStart(2, "0")}`;
      editor.commands.insertContent(`<p> I completed <strong>${gameName}</strong> in <strong>${timeStr}</strong>!</p>`);
    }
  };

  const handleLockToggle = async () => {
    if (!entryId) {
      toast.error("Save the entry first before locking");
      return;
    }
    if (isLocked) {
      setPinMode("unlock");
      setShowPinModal(true);
    } else {
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
  const formattedDate = (() => {
    try {
      return format(new Date(entryDate), "EEEE, MMMM d");
    } catch {
      return entryDate;
    }
  })();

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 35, stiffness: 400 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: "#F9FAFB" }}
          >
            {/* ─── Stitch Header ─── */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <button onClick={onClose} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" style={{ color: "#6366F1" }} />
                <span className="text-xs font-medium" style={{ color: "#6366F1" }}>SYNCING</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLockToggle}
                  className="rounded-lg p-1.5 transition-colors"
                  style={isLocked ? { backgroundColor: "#EEF2FF", color: "#6366F1" } : { color: "#9CA3AF" }}
                  title={isLocked ? "Unlock entry" : "Lock entry"}
                >
                  {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100">
                  <MoreHorizontal className="h-4 w-4" />
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
                  className="absolute inset-0 z-10 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(249,250,251,0.9)" }}
                >
                  <p className="text-lg text-center px-8 italic" style={{ color: "#6B7280" }}>
                    Hi {firstName}, let your thoughts go here...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
                {/* Date */}
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer"
                    style={{ color: "#6366F1" }}
                    readOnly={readOnly}
                  />
                </div>

                {/* Title - Stitch style */}
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Entry"
                  className="w-full border-none text-4xl sm:text-5xl font-semibold bg-transparent outline-none placeholder:text-slate-300"
                  style={{ color: "#0F172A", lineHeight: 1.1 }}
                  readOnly={readOnly}
                />

                {/* Mood pills - Stitch style */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {STITCH_MOODS.map(({ emoji, label }) => {
                    const isActive = moodEmoji === emoji;
                    return (
                      <button
                        key={emoji}
                        onClick={() => !readOnly && setMoodEmoji(moodEmoji === emoji ? null : emoji)}
                        disabled={readOnly}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={isActive
                          ? { backgroundColor: "rgba(99,102,241,0.1)", border: "2px solid #6366F1", color: "#6366F1" }
                          : { backgroundColor: "white", border: "1px solid #E5E7EB", color: "#6B7280" }
                        }
                      >
                        <span className="text-sm">{emoji}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Rich text toolbar */}
                {!readOnly && editor && (
                  <div className="mt-5 flex items-center gap-1 pb-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
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
                        className="rounded-lg p-2 transition-colors"
                        style={active
                          ? { backgroundColor: "rgba(99,102,241,0.1)", color: "#6366F1" }
                          : { color: "#9CA3AF" }
                        }
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
                      <div key={i} className="aspect-square overflow-hidden rounded-xl" style={{ border: "1px solid #E5E7EB" }}>
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Creative tools - bottom icons */}
                {!readOnly && (
                  <div className="mt-6 flex items-center gap-3">
                    <label className="cursor-pointer">
                      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl transition-colors hover:bg-slate-100" style={{ border: "1px solid #E5E7EB" }}>
                        <Paperclip className="h-4 w-4" style={{ color: "#6B7280" }} />
                      </span>
                    </label>
                    <button onClick={() => setShowDrawing(true)} className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100" style={{ border: "1px solid #E5E7EB" }}>
                      <Pencil className="h-4 w-4" style={{ color: "#6B7280" }} />
                    </button>
                    <button onClick={() => setShowColoring(true)} className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100" style={{ border: "1px solid #E5E7EB" }}>
                      <Palette className="h-4 w-4" style={{ color: "#6B7280" }} />
                    </button>
                    <button onClick={() => setShowPuzzle(true)} className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100" style={{ border: "1px solid #E5E7EB" }}>
                      <Puzzle className="h-4 w-4" style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Bottom bar - Stitch ─── */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6" style={{ borderTop: "1px solid #E5E7EB", backgroundColor: "white" }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTherapist(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-indigo-50"
                  style={{ border: "2px solid #6366F1", color: "#6366F1" }}
                >
                  Find Therapist
                </button>
                <button
                  onClick={() => setShowChurch(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-indigo-50"
                  style={{ border: "2px solid #6366F1", color: "#6366F1" }}
                >
                  Find a Church
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                  Discard
                </button>
                {!readOnly && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="rounded-xl"
                    style={{ backgroundColor: "#6366F1" }}
                  >
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
      <ChurchFinderModal open={showChurch} onClose={() => setShowChurch(false)} />
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
