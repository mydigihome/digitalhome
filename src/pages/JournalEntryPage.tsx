import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import { ArrowLeft, Plus, Sparkles, RefreshCw, Camera, X, Mic, Square, Play, Pause, Trash2, Bold, Italic, Underline, Send, Loader2, Heart, Church, Image as ImageIcon } from "lucide-react";
import TherapistFinderModal from "@/components/journal/TherapistFinderModal";
import ChurchFinderModal from "@/components/journal/ChurchFinderModal";
import { toast } from "sonner";

const TAG_OPTIONS = ["Personal", "Calm", "Motivation", "Grateful", "Anxious", "Happy", "Sad", "Inspired", "Focused"];

export default function JournalEntryPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isNew = !id || id === "new";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState("0:00");
  const [isPlaying, setIsPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(isNew ? null : id!);
  const [dailyPrompt, setDailyPrompt] = useState("What's one thing you're proud of today?");
  const [therapistModalOpen, setTherapistModalOpen] = useState(false);
  const [churchModalOpen, setChurchModalOpen] = useState(false);
  const [substackModalOpen, setSubstackModalOpen] = useState(false);
  const [substackEmail, setSubstackEmail] = useState("");
  const [saveSubstackEmail, setSaveSubstackEmail] = useState(true);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [waveformBars] = useState(() => Array.from({ length: 40 }, () => Math.random() * 24 + 8));

  const isDark = document.documentElement.classList.contains("dark");

  // Load existing entry
  const { data: existingEntry } = useQuery({
    queryKey: ["journal-entry", id],
    queryFn: async () => {
      const { data } = await supabase.from("journal_entries").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (existingEntry) {
      setTitle(existingEntry.title || "");
      const c = typeof existingEntry.content === "string" ? existingEntry.content : (existingEntry.content_preview || "");
      setContent(c);
      setSelectedTags((existingEntry as any).tags || []);
      setImageUrl((existingEntry as any).image_url || null);
      setAudioUrl((existingEntry as any).audio_url || null);
      setEntryId(existingEntry.id);
      if (editorRef.current && c) editorRef.current.innerHTML = c;
    }
  }, [existingEntry]);

  // Daily prompt
  useEffect(() => {
    const today = new Date().toDateString();
    const cached = localStorage.getItem(`dh_journal_prompt_${today}`);
    if (cached) { setDailyPrompt(cached); return; }
    supabase.functions.invoke("generate-trading-plan", {
      body: { prompt: `Generate ONE thoughtful journaling question for today. Make it personal, reflective, and positive. Max 15 words. Just the question, nothing else. Examples: "What small moment brought you joy today?" "What are you grateful for that you often overlook?"` }
    }).then(({ data }) => {
      const p = data?.plan?.trim()?.replace(/^["']|["']$/g, "");
      if (p) { setDailyPrompt(p); localStorage.setItem(`dh_journal_prompt_${today}`, p); }
    }).catch(() => {});
  }, []);

  // Substack email
  useEffect(() => {
    const saved = localStorage.getItem("dh_substack_email");
    if (saved) setSubstackEmail(saved);
  }, []);

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `journal-images/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("journal-media").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data } = supabase.storage.from("journal-media").getPublicUrl(path);
    setImageUrl(data.publicUrl);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          const mins = Math.floor(audio.duration / 60);
          const secs = Math.floor(audio.duration % 60);
          setAudioDuration(`${mins}:${secs.toString().padStart(2, "0")}`);
        };
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const uploadAudio = async (blob: Blob): Promise<string | null> => {
    if (!user) return null;
    const path = `journal-audio/${user.id}/${Date.now()}.webm`;
    const { error } = await supabase.storage.from("journal-media").upload(path, blob);
    if (error) return null;
    const { data } = supabase.storage.from("journal-media").getPublicUrl(path);
    return data.publicUrl;
  };

  // Save
  const handleSave = async () => {
    const editorContent = editorRef.current?.innerHTML || content;
    if (!editorContent && !title) { toast("Nothing to save"); return; }
    if (!user) return;
    setSaving(true);
    try {
      let savedAudioUrl = audioUrl;
      if (audioBlob) { savedAudioUrl = await uploadAudio(audioBlob) || audioUrl; }
      const entryData: any = {
        user_id: user.id,
        title: title || "Untitled Entry",
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: editorContent }] }] },
        content_preview: editorContent?.replace(/<[^>]*>/g, "").substring(0, 200),
        mood_emoji: selectedTags[0] || null,
        mood_text: selectedTags[0] || null,
        mood: selectedTags[0] || null,
        tags: selectedTags,
        image_url: imageUrl,
        audio_url: savedAudioUrl,
        updated_at: new Date().toISOString(),
      };
      if (entryId) {
        await supabase.from("journal_entries").update(entryData).eq("id", entryId);
      } else {
        entryData.entry_date = new Date().toISOString().split("T")[0];
        const { data } = await supabase.from("journal_entries").insert(entryData).select().single();
        if (data) setEntryId(data.id);
      }
      qc.invalidateQueries({ queryKey: ["journal-entries-all"] });
      qc.invalidateQueries({ queryKey: ["recent_journal"] });
      toast.success("Entry saved ✓");
      navigate("/journal");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const handleSubstackPublish = () => {
    if (!substackEmail) return;
    if (saveSubstackEmail) localStorage.setItem("dh_substack_email", substackEmail);
    const editorContent = editorRef.current?.innerHTML || content;
    const mailtoUrl = `mailto:${substackEmail}?subject=${encodeURIComponent(title || "Journal Entry")}&body=${encodeURIComponent(editorContent?.replace(/<[^>]*>/g, "") || "")}`;
    window.open(mailtoUrl);
    setSubstackModalOpen(false);
    toast.success("Opening email to Substack...");
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 120px" }}>
        {/* Back */}
        <button onClick={() => navigate("/journal")} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", fontFamily: "Inter, sans-serif", marginBottom: 20, padding: 0 }}>
          <ArrowLeft size={16} /> Back to Journal
        </button>

        {/* Date */}
        <p style={{ fontSize: 13, fontWeight: 600, color: "#10B981", textAlign: "center", margin: "0 0 12px", fontFamily: "Inter, sans-serif" }}>
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your entry a title..." style={{ width: "100%", fontSize: 28, fontWeight: 800, color: isDark ? "#F2F2F2" : "#111827", border: "none", outline: "none", background: "transparent", textAlign: "center", fontFamily: "Inter, sans-serif", marginBottom: 16, letterSpacing: "-0.5px", boxSizing: "border-box" }} />

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {TAG_OPTIONS.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)} style={{ padding: "6px 16px", borderRadius: 999, border: "1.5px solid", borderColor: selectedTags.includes(tag) ? "#10B981" : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"), background: selectedTags.includes(tag) ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : (isDark ? "#252528" : "white"), color: selectedTags.includes(tag) ? "#065F46" : (isDark ? "rgba(255,255,255,0.5)" : "#6B7280"), fontSize: 13, fontWeight: selectedTags.includes(tag) ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 150ms" }}>
              {tag}
            </button>
          ))}
        </div>

        {/* AI Prompt */}
        {!content && !existingEntry && (
          <div style={{ padding: 16, background: isDark ? "rgba(123,94,167,0.1)" : "#F5F3FF", borderRadius: 12, border: `1px solid ${isDark ? "rgba(123,94,167,0.2)" : "#DDD6FE"}`, marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Sparkles size={18} color="#7B5EA7" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#7B5EA7", margin: "0 0 4px", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Today's Prompt</p>
              <p style={{ fontSize: 14, color: isDark ? "#C4B5FD" : "#4C1D95", margin: 0, fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>{dailyPrompt}</p>
            </div>
            <button onClick={() => { localStorage.removeItem(`dh_journal_prompt_${new Date().toDateString()}`); setDailyPrompt("Loading..."); supabase.functions.invoke("generate-trading-plan", { body: { prompt: `Generate ONE thoughtful journaling question. Personal, reflective, positive. Max 15 words. Just the question.` } }).then(({ data }) => { const p = data?.plan?.trim()?.replace(/^["']|["']$/g, ""); if (p) setDailyPrompt(p); }); }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
              <RefreshCw size={14} color="#7B5EA7" />
            </button>
          </div>
        )}

        {/* Photo */}
        {imageUrl && (
          <div style={{ position: "relative", marginBottom: 20, borderRadius: 12, overflow: "hidden" }}>
            <img src={imageUrl} alt="Journal" style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 12 }} />
            <button onClick={() => setImageUrl(null)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} color="white" />
            </button>
          </div>
        )}

        {/* Voice Recorder */}
        <div style={{ marginBottom: 20, padding: 16, background: isDark ? "#1C1C1E" : "#F9FAFB", borderRadius: 12, border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}` }}>
          {!audioUrl && !isRecording && (
            <button onClick={startRecording} style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", width: "100%", padding: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mic size={16} color="#EF4444" />
              </div>
              <span style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", fontFamily: "Inter, sans-serif" }}>Add a voice note</span>
            </button>
          )}
          {isRecording && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={stopRecording} style={{ width: 36, height: 36, borderRadius: "50%", background: "#EF4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Square size={14} color="white" fill="white" />
              </button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, height: 32 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} style={{ width: 3, borderRadius: 2, background: "#EF4444", animation: `wave 0.5s ease-in-out ${i * 0.05}s infinite alternate`, height: "60%" }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#EF4444", fontFamily: "Inter, sans-serif" }}>{recordingTime}s</span>
            </div>
          )}
          {audioUrl && !isRecording && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={togglePlayback} style={{ width: 36, height: 36, borderRadius: "50%", background: "#10B981", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isPlaying ? <Pause size={14} color="white" /> : <Play size={14} color="white" />}
              </button>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1, height: 32 }}>
                {waveformBars.map((h, i) => (
                  <div key={i} style={{ width: 2, height: h, borderRadius: 1, background: isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB" }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", fontFamily: "Inter, sans-serif" }}>{audioDuration}</span>
              <button onClick={() => { setAudioUrl(null); setAudioBlob(null); audioRef.current = null; }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Editor */}
        <div style={{ marginBottom: 20, background: isDark ? "#1C1C1E" : "white", borderRadius: 12, border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}` }}>
            {[{ label: "B", action: "bold", s: { fontWeight: 700 } as React.CSSProperties }, { label: "I", action: "italic", s: { fontStyle: "italic" } as React.CSSProperties }, { label: "U", action: "underline", s: { textDecoration: "underline" } as React.CSSProperties }].map(btn => (
              <button key={btn.action} onClick={() => document.execCommand(btn.action)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, background: isDark ? "#252528" : "white", cursor: "pointer", fontSize: 13, color: isDark ? "#F2F2F2" : "#374151", ...btn.s }}>
                {btn.label}
              </button>
            ))}
          </div>
          <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={e => setContent((e.currentTarget as HTMLDivElement).innerHTML)} data-placeholder="Start writing your thoughts..." style={{ minHeight: 200, padding: "16px", fontSize: 16, lineHeight: 1.7, color: isDark ? "#F2F2F2" : "#111827", outline: "none", fontFamily: "Inter, sans-serif", caretColor: "#10B981" }} />
        </div>

        {/* Bottom Action Bar */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: isDark ? "#1C1C1E" : "white", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => photoInputRef.current?.click()} style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6"}`, background: isDark ? "#252528" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={16} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
            <button onClick={() => setTherapistModalOpen(true)} style={{ padding: "8px 14px", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6"}`, borderRadius: 999, background: isDark ? "#252528" : "white", cursor: "pointer", fontSize: 12, fontWeight: 500, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
              <Heart size={12} /> Find Therapist
            </button>
            <button onClick={() => setChurchModalOpen(true)} style={{ padding: "8px 14px", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#F3F4F6"}`, borderRadius: 999, background: isDark ? "#252528" : "white", cursor: "pointer", fontSize: 12, fontWeight: 500, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
              <Church size={12} /> Find Church
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSubstackModalOpen(true)} style={{ padding: "8px 16px", border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: 8, background: isDark ? "#252528" : "white", cursor: "pointer", fontSize: 13, fontWeight: 500, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <Send size={13} /> Substack
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", background: "#10B981", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save Entry
            </button>
          </div>
        </div>
      </div>

      {/* Substack Modal */}
      {substackModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSubstackModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: 16, padding: 24, maxWidth: 420, width: "100%" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: "0 0 6px", fontFamily: "Inter, sans-serif" }}>Post to Substack</h3>
            <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>This will send your entry as a draft to your Substack publication.</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#F2F2F2" : "#374151", fontFamily: "Inter, sans-serif" }}>Your Substack Draft Email</label>
            <input value={substackEmail} onChange={e => setSubstackEmail(e.target.value)} placeholder="yourusername@substack.com" style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box", marginTop: 6, marginBottom: 8, background: isDark ? "#252528" : "white", color: isDark ? "#F2F2F2" : "#111827" }} />
            <p style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF", margin: "0 0 12px", fontFamily: "Inter, sans-serif" }}>Find this in Substack → Settings → Import → Email your draft address</p>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }}>
              <input type="checkbox" checked={saveSubstackEmail} onChange={e => setSaveSubstackEmail(e.target.checked)} />
              <span style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", fontFamily: "Inter, sans-serif" }}>Remember this email</span>
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSubstackModalOpen(false)} style={{ flex: 1, padding: 11, border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: 10, background: isDark ? "#252528" : "white", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", color: isDark ? "#F2F2F2" : "#374151" }}>Cancel</button>
              <button onClick={handleSubstackPublish} style={{ flex: 1, padding: 11, background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Send to Substack</button>
            </div>
          </div>
        </div>
      )}

      <TherapistFinderModal open={therapistModalOpen} onClose={() => setTherapistModalOpen(false)} />
      <ChurchFinderModal open={churchModalOpen} onClose={() => setChurchModalOpen(false)} />

      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #9CA3AF; pointer-events: none; }
        @keyframes wave { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
      `}</style>
    </AppShell>
  );
}
