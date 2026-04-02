import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import {
  ArrowLeft, Sparkles, RefreshCw, X, Mic, Square, Play, Pause,
  Trash2, Send, Loader2, Heart, MapPin, Pencil, Check, Image as ImageIcon,
  BookOpen, Search,
} from "lucide-react";
import { toast } from "sonner";

const MOOD_TAGS = [
  "Personal", "Calm", "Motivation", "Grateful", "Happy", "Inspired",
  "Anxious", "Sad", "Focused", "Reflective", "Energized", "At Peace",
];

const LIBRARY_IMAGES = [
  { id: 1, url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", label: "Sunset Beach" },
  { id: 2, url: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=800", label: "Birds in Flight" },
  { id: 3, url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800", label: "Forest Stream" },
  { id: 4, url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800", label: "Mountain Sunset" },
  { id: 5, url: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800", label: "Peaceful Path" },
  { id: 6, url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800", label: "Mountain View" },
  { id: 7, url: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800", label: "Golden Hour" },
  { id: 8, url: "https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=800", label: "Ocean Calm" },
  { id: 9, url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800", label: "Misty Forest" },
  { id: 10, url: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800", label: "Sunrise" },
  { id: 11, url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800", label: "Wildflowers" },
  { id: 12, url: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800", label: "Starry Night" },
];

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
  const [isEditing, setIsEditing] = useState(isNew);
  const [substackModalOpen, setSubstackModalOpen] = useState(false);
  const [substackEmail, setSubstackEmail] = useState("");
  const [saveSubstackEmail, setSaveSubstackEmail] = useState(true);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoTab, setPhotoTab] = useState<"library" | "upload">("library");

  // Therapist modal state
  const [therapistModalOpen, setTherapistModalOpen] = useState(false);
  const [therapistZip, setTherapistZip] = useState("");
  const [therapistConcern, setTherapistConcern] = useState("");
  const [therapistInsurance, setTherapistInsurance] = useState("");

  // Church modal state
  const [churchModalOpen, setChurchModalOpen] = useState(false);
  const [churchZip, setChurchZip] = useState("");
  const [churchDenomination, setChurchDenomination] = useState("church");
  const [churchPreference, setChurchPreference] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [waveformBars] = useState(() => Array.from({ length: 40 }, () => Math.random() * 24 + 8));

  const isDark = document.documentElement.classList.contains("dark");

  const bg = isDark ? "#1C1C1E" : "#FAF9F7";
  const cardBg = isDark ? "#252528" : "white";
  const borderCol = isDark ? "rgba(255,255,255,0.08)" : "#E8E5E0";
  const textPrimary = isDark ? "#F2F2F2" : "#111827";
  const textSecondary = isDark ? "rgba(255,255,255,0.4)" : "#B0ABA3";
  const textBody = isDark ? "#E5E4E2" : "#111827";
  const modalBg = isDark ? "#1C1C1E" : "white";
  const inputBg = isDark ? "#252528" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";
  const inputColor = isDark ? "#F2F2F2" : "#374151";
  const labelColor = isDark ? "rgba(255,255,255,0.6)" : "#374151";
  const subtextColor = isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF";

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
      const c = typeof existingEntry.content === "string"
        ? existingEntry.content
        : (existingEntry.content_preview || "");
      setContent(c);
      setSelectedTags((existingEntry as any).tags || []);
      setImageUrl((existingEntry as any).image_url || null);
      setAudioUrl((existingEntry as any).audio_url || null);
      setEntryId(existingEntry.id);
      setIsEditing(false);
      if (editorRef.current && c) editorRef.current.innerHTML = c;
    }
  }, [existingEntry]);

  useEffect(() => {
    const today = new Date().toDateString();
    const cached = localStorage.getItem(`dh_journal_prompt_${today}`);
    if (cached) { setDailyPrompt(cached); return; }
    supabase.functions.invoke("generate-trading-plan", {
      body: { prompt: `Generate ONE thoughtful journaling question for today. Make it personal, reflective, and positive. Max 15 words. Just the question, nothing else.` }
    }).then(({ data }) => {
      const p = data?.plan?.trim()?.replace(/^["']|["']$/g, "");
      if (p) { setDailyPrompt(p); localStorage.setItem(`dh_journal_prompt_${today}`, p); }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("dh_substack_email");
    if (saved) setSubstackEmail(saved);
  }, []);

  const toggleTag = (tag: string) => {
    if (!isEditing) return;
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `journal-images/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("journal-media").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data } = supabase.storage.from("journal-media").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setPhotoModalOpen(false);
  };

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

  const handleDelete = async () => {
    if (!window.confirm("Delete this entry? Cannot be undone.")) return;
    if (!entryId || !user) return;
    await supabase.from("journal_entries").delete().eq("id", entryId).eq("user_id", user.id);
    qc.invalidateQueries({ queryKey: ["journal-entries-all"] });
    navigate("/journal");
    toast("Entry deleted");
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

  const entryDate = existingEntry?.created_at
    ? new Date(existingEntry.created_at)
    : new Date();

  const circleBtn = (onClick: () => void, icon: React.ReactNode) => (
    <button onClick={onClick} style={{
      width: 44, height: 44, borderRadius: "50%",
      border: `1px solid ${borderCol}`, background: cardBg,
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    }}>{icon}</button>
  );

  return (
    <AppShell>
      <div style={{ background: bg, minHeight: "100vh" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 120px" }}>

          {/* HEADER */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 0", position: "sticky", top: 0, zIndex: 50, background: bg,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => navigate("/journal")} title="My Entries" style={{
                width: 36, height: 36, borderRadius: "50%", border: `1px solid ${borderCol}`,
                background: cardBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BookOpen size={18} color={isDark ? "rgba(255,255,255,0.6)" : "#374151"} />
              </button>
              <button onClick={() => navigate(-1 as any)} title="Close" style={{
                width: 36, height: 36, borderRadius: "50%", border: `1px solid ${borderCol}`,
                background: cardBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <X size={18} color={isDark ? "rgba(255,255,255,0.6)" : "#374151"} />
              </button>
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: textPrimary, fontFamily: "Inter, sans-serif" }}>
              {isEditing ? (isNew ? "New Entry" : "Edit Entry") : "Journal Entry"}
            </span>
            {isEditing ? (
              <button onClick={handleSave} disabled={saving} style={{
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600, color: "#10B981", fontFamily: "Inter, sans-serif",
                opacity: saving ? 0.6 : 1,
              }}>
                {saving ? "Saving..." : "Save"}
              </button>
            ) : (
              <div style={{ width: 80 }} />
            )}
          </div>

          {/* DATE */}
          <p style={{
            fontSize: 14, fontWeight: 600, color: "#10B981", textAlign: "center",
            margin: "8px 0 12px", fontFamily: "Inter, sans-serif",
          }}>
            {entryDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          {/* TITLE */}
          {isEditing ? (
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Give your entry a title..."
              style={{
                width: "100%", fontSize: 28, fontWeight: 800, color: textPrimary,
                border: "none", outline: "none", background: "transparent", textAlign: "center",
                fontFamily: "Inter, sans-serif", marginBottom: 16, letterSpacing: "-0.5px",
                boxSizing: "border-box",
              }}
            />
          ) : (
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: textPrimary, textAlign: "center",
              fontFamily: "Inter, sans-serif", marginBottom: 16, letterSpacing: "-0.5px", margin: "0 0 16px",
            }}>
              {title || "Untitled Entry"}
            </h1>
          )}

          {/* MOOD TAGS */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {MOOD_TAGS.map(tag => {
              const selected = selectedTags.includes(tag);
              if (!isEditing && !selected) return null;
              return (
                <button key={tag} onClick={() => toggleTag(tag)} style={{
                  padding: "6px 16px", borderRadius: 999,
                  border: `1.5px solid ${selected ? "#10B981" : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`,
                  background: selected ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : (isDark ? "#252528" : "white"),
                  color: selected ? (isDark ? "#6EE7B7" : "#065F46") : (isDark ? "rgba(255,255,255,0.4)" : "#6B7280"),
                  fontSize: 13, fontWeight: selected ? 600 : 400,
                  cursor: isEditing ? "pointer" : "default",
                  fontFamily: "Inter, sans-serif", transition: "all 150ms",
                }}>
                  {tag}
                </button>
              );
            })}
          </div>

          {/* AI PROMPT */}
          {isEditing && !content && isNew && (
            <div style={{
              padding: 16, background: isDark ? "rgba(123,94,167,0.1)" : "#F5F3FF",
              borderRadius: 12, border: `1px solid ${isDark ? "rgba(123,94,167,0.2)" : "#DDD6FE"}`,
              marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <Sparkles size={18} color="#7B5EA7" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#7B5EA7", margin: "0 0 4px", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Today's Prompt</p>
                <p style={{ fontSize: 14, color: isDark ? "#C4B5FD" : "#4C1D95", margin: 0, fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>{dailyPrompt}</p>
              </div>
              <button onClick={() => {
                localStorage.removeItem(`dh_journal_prompt_${new Date().toDateString()}`);
                setDailyPrompt("Loading...");
                supabase.functions.invoke("generate-trading-plan", {
                  body: { prompt: `Generate ONE thoughtful journaling question. Personal, reflective, positive. Max 15 words. Just the question.` }
                }).then(({ data }) => {
                  const p = data?.plan?.trim()?.replace(/^["']|["']$/g, "");
                  if (p) setDailyPrompt(p);
                });
              }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                <RefreshCw size={14} color="#7B5EA7" />
              </button>
            </div>
          )}

          {/* PHOTO */}
          {imageUrl && (
            <div style={{ position: "relative", marginBottom: 20, borderRadius: 12, overflow: "hidden" }}>
              <img src={imageUrl} alt="Journal" style={{ width: "100%", maxHeight: 340, objectFit: "cover", borderRadius: 12 }} />
              {isEditing && (
                <button onClick={() => setImageUrl(null)} style={{
                  position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <X size={14} color="white" />
                </button>
              )}
            </div>
          )}

          {/* VOICE RECORDER / PLAYER */}
          {(audioUrl || isRecording || isEditing) && (
            <div style={{
              marginBottom: 20, padding: 14, background: isDark ? "#252528" : "#FFFBF0",
              borderRadius: 12, border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#FEF3C7"}`,
            }}>
              {!audioUrl && !isRecording && isEditing && (
                <button onClick={startRecording} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "transparent", border: "none", cursor: "pointer", width: "100%", padding: 0,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mic size={16} color="#F59E0B" />
                  </div>
                  <span style={{ fontSize: 13, color: textSecondary, fontFamily: "Inter, sans-serif" }}>Add a voice note</span>
                </button>
              )}
              {isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={stopRecording} style={{
                    width: 36, height: 36, borderRadius: "50%", background: "#EF4444",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Square size={14} color="white" fill="white" />
                  </button>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, height: 32 }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} style={{
                        width: 3, borderRadius: 2, background: "#EF4444",
                        animation: `wave 0.5s ease-in-out ${i * 0.05}s infinite alternate`, height: "60%",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#EF4444", fontFamily: "Inter, sans-serif" }}>{recordingTime}s</span>
                </div>
              )}
              {audioUrl && !isRecording && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={togglePlayback} style={{
                    width: 36, height: 36, borderRadius: "50%", background: "#F59E0B",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isPlaying ? <Pause size={14} color="white" /> : <Play size={14} color="white" />}
                  </button>
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1, height: 32 }}>
                    {waveformBars.map((h, i) => (
                      <div key={i} style={{
                        width: 2, height: h, borderRadius: 1,
                        background: isDark ? "rgba(245,158,11,0.4)" : "#FBBF24",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: textSecondary, fontFamily: "Inter, sans-serif" }}>{audioDuration}</span>
                  {isEditing && (
                    <button onClick={() => { setAudioUrl(null); setAudioBlob(null); audioRef.current = null; }} style={{
                      background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 4,
                    }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BODY TEXT */}
          {isEditing ? (
            <div ref={editorRef} contentEditable suppressContentEditableWarning
              onInput={e => setContent((e.currentTarget as HTMLDivElement).innerHTML)}
              data-placeholder="Start writing..."
              style={{
                minHeight: 200, padding: "0", fontSize: 16, lineHeight: 1.7,
                color: textBody, outline: "none", fontFamily: "Inter, sans-serif",
                caretColor: "#10B981", marginBottom: 24,
              }}
            />
          ) : (
            <div style={{
              fontSize: 16, lineHeight: 1.7, color: textBody, fontFamily: "Inter, sans-serif",
              marginBottom: 24, whiteSpace: "pre-wrap",
            }}
              dangerouslySetInnerHTML={{ __html: content || "<span style='color:#B0ABA3'>No content</span>" }}
            />
          )}

          {/* THERAPIST + CHURCH LINKS */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
            <button onClick={() => setTherapistModalOpen(true)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
              backgroundColor: isDark ? "rgba(190,24,93,0.1)" : "#FDF2F8",
              border: `1px solid ${isDark ? "rgba(190,24,93,0.2)" : "#FDF2F8"}`,
              borderRadius: 999, fontSize: 12, fontWeight: 500, color: "#BE185D",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              <Heart size={12} color="#BE185D" /> Find a Therapist
            </button>
            <button onClick={() => setChurchModalOpen(true)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 14px",
              backgroundColor: isDark ? "rgba(123,94,167,0.1)" : "#F5F3FF",
              border: `1px solid ${isDark ? "rgba(123,94,167,0.2)" : "#F5F3FF"}`,
              borderRadius: 999, fontSize: 12, fontWeight: 500, color: "#7B5EA7",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              <MapPin size={12} color="#7B5EA7" /> Find a Church
            </button>
          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: isDark ? "#1C1C1E" : "white",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E8E5E0"}`,
          padding: "12px 0", display: "flex", justifyContent: "center", gap: 16,
        }}>
          {isEditing ? (
            <>
              {circleBtn(() => setPhotoModalOpen(true), <ImageIcon size={18} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />)}
              {circleBtn(() => setSubstackModalOpen(true), <Send size={18} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />)}
              {circleBtn(handleDelete, <Trash2 size={18} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />)}
            </>
          ) : (
            <>
              {circleBtn(() => setIsEditing(true), <Pencil size={18} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />)}
              {circleBtn(() => setSubstackModalOpen(true), <Send size={18} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />)}
              {circleBtn(handleDelete, <Trash2 size={18} color={isDark ? "rgba(255,255,255,0.5)" : "#6B7280"} />)}
            </>
          )}
        </div>
      </div>

      {/* PHOTO LIBRARY MODAL */}
      {photoModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={() => setPhotoModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: isDark ? "#1C1C1E" : "white", borderRadius: 16, padding: 24,
            maxWidth: 560, width: "100%", maxHeight: "80vh", overflow: "auto",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, margin: "0 0 16px", fontFamily: "Inter, sans-serif" }}>Add a Photo</h3>
            <div style={{ display: "flex", gap: 0, marginBottom: 16, borderRadius: 8, overflow: "hidden", border: `1px solid ${borderCol}` }}>
              {(["library", "upload"] as const).map(tab => (
                <button key={tab} onClick={() => setPhotoTab(tab)} style={{
                  flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600,
                  fontFamily: "Inter, sans-serif", cursor: "pointer", border: "none",
                  background: photoTab === tab ? "#10B981" : (isDark ? "#252528" : "#F9FAFB"),
                  color: photoTab === tab ? "white" : (isDark ? "rgba(255,255,255,0.5)" : "#6B7280"),
                }}>
                  {tab === "library" ? "Choose from Library" : "Upload Photo"}
                </button>
              ))}
            </div>
            {photoTab === "library" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {LIBRARY_IMAGES.map(img => (
                  <div key={img.id} onClick={() => { setImageUrl(img.url); setPhotoModalOpen(false); }}
                    style={{
                      position: "relative", cursor: "pointer", borderRadius: 10, overflow: "hidden",
                      aspectRatio: "1/1", border: imageUrl === img.url ? "3px solid #10B981" : `1px solid ${borderCol}`,
                    }}>
                    <img src={img.url} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {imageUrl === img.url && (
                      <div style={{
                        position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
                        background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Check size={12} color="white" />
                      </div>
                    )}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 6px 4px",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                    }}>
                      <span style={{ fontSize: 10, color: "white", fontFamily: "Inter, sans-serif" }}>{img.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <button onClick={() => photoInputRef.current?.click()} style={{
                  padding: "12px 24px", background: "#10B981", color: "white", border: "none",
                  borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>
                  Choose File
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                <p style={{ fontSize: 12, color: textSecondary, marginTop: 12, fontFamily: "Inter, sans-serif" }}>JPG, PNG, or WebP</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBSTACK MODAL */}
      {substackModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={() => setSubstackModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: modalBg, borderRadius: 16, padding: 24,
            maxWidth: 420, width: "100%",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, margin: "0 0 6px", fontFamily: "Inter, sans-serif" }}>Post to Substack</h3>
            <p style={{ fontSize: 13, color: textSecondary, margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>Send your entry as a draft to your Substack publication.</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: textPrimary, fontFamily: "Inter, sans-serif" }}>Your Substack Draft Email</label>
            <input value={substackEmail} onChange={e => setSubstackEmail(e.target.value)}
              placeholder="yourusername@substack.com"
              style={{
                width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif",
                boxSizing: "border-box", marginTop: 6, marginBottom: 8,
                background: inputBg, color: inputColor,
              }}
            />
            <p style={{ fontSize: 11, color: subtextColor, margin: "0 0 12px", fontFamily: "Inter, sans-serif" }}>
              Find this in Substack → Settings → Import → Email your draft address
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, cursor: "pointer" }}>
              <input type="checkbox" checked={saveSubstackEmail} onChange={e => setSaveSubstackEmail(e.target.checked)} />
              <span style={{ fontSize: 13, color: subtextColor, fontFamily: "Inter, sans-serif" }}>Remember this email</span>
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSubstackModalOpen(false)} style={{
                flex: 1, padding: 11, border: `1.5px solid ${inputBorder}`, borderRadius: 10,
                background: inputBg, fontSize: 14, fontWeight: 500,
                cursor: "pointer", fontFamily: "Inter, sans-serif", color: inputColor,
              }}>Cancel</button>
              <button onClick={handleSubstackPublish} style={{
                flex: 1, padding: 11, background: "#10B981", color: "white", border: "none",
                borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Send to Substack</button>
            </div>
          </div>
        </div>
      )}

      {/* FIND A THERAPIST MODAL */}
      {therapistModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={() => setTherapistModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: modalBg, borderRadius: 20, padding: 28,
            maxWidth: 440, width: "100%",
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>
              Find a Therapist
            </h2>
            <p style={{ fontSize: 13, color: subtextColor, fontFamily: "Inter, sans-serif", marginBottom: 20 }}>
              We'll find licensed therapists near you on Psychology Today
            </p>

            {/* Zip Code */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: labelColor, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Your Zip Code *
              </label>
              <input value={therapistZip} onChange={e => setTherapistZip(e.target.value)}
                placeholder="e.g. 80202" maxLength={10}
                style={{
                  width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                  borderRadius: 8, fontSize: 14, color: inputColor, outline: "none",
                  fontFamily: "Inter, sans-serif", boxSizing: "border-box", background: inputBg,
                }}
                onFocus={e => { e.target.style.borderColor = "#EC4899"; }}
                onBlur={e => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"; }}
              />
            </div>

            {/* Concern */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: labelColor, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                What do you need help with?
              </label>
              <select value={therapistConcern} onChange={e => setTherapistConcern(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                  borderRadius: 8, fontSize: 14, color: inputColor, outline: "none",
                  fontFamily: "Inter, sans-serif", background: inputBg, cursor: "pointer", boxSizing: "border-box",
                }}>
                <option value="">Select a concern...</option>
                <option value="anxiety">Anxiety</option>
                <option value="depression">Depression</option>
                <option value="trauma-and-ptsd">Trauma & PTSD</option>
                <option value="relationship-issues">Relationship Issues</option>
                <option value="grief">Grief & Loss</option>
                <option value="stress">Stress</option>
                <option value="self-esteem">Self-Esteem</option>
                <option value="life-transitions">Life Transitions</option>
                <option value="career">Career Counseling</option>
                <option value="identity">Identity & Purpose</option>
                <option value="adhd">ADHD</option>
                <option value="eating-disorders">Eating Disorders</option>
                <option value="addiction">Addiction</option>
                <option value="family-conflict">Family Conflict</option>
              </select>
            </div>

            {/* Insurance */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: labelColor, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Insurance (optional)
              </label>
              <input value={therapistInsurance} onChange={e => setTherapistInsurance(e.target.value)}
                placeholder="e.g. Blue Cross, Aetna"
                style={{
                  width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                  borderRadius: 8, fontSize: 14, color: inputColor, outline: "none",
                  fontFamily: "Inter, sans-serif", boxSizing: "border-box", background: inputBg,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setTherapistModalOpen(false)} style={{
                flex: 1, padding: 11, border: `1.5px solid ${inputBorder}`, borderRadius: 10,
                background: inputBg, fontSize: 14, fontWeight: 500, color: inputColor,
                cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={() => {
                if (!therapistZip) { toast.error("Enter your zip code"); return; }
                let url = `https://www.psychologytoday.com/us/therapists/${therapistZip}`;
                const params = new URLSearchParams();
                if (therapistConcern) params.append("issue", therapistConcern);
                if (therapistInsurance) params.append("insurance", therapistInsurance.toLowerCase().replace(/\s+/g, "-"));
                const qs = params.toString();
                if (qs) url += "?" + qs;
                const link = document.createElement("a");
                link.href = url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTherapistModalOpen(false);
              }} style={{
                flex: 1, padding: 11, background: "#EC4899", color: "white", border: "none",
                borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Search size={16} /> Find Therapists
              </button>
            </div>

            {/* BetterHelp */}
            <div style={{
              marginTop: 16, padding: "12px 14px", background: isDark ? "#252528" : "#F9FAFB",
              borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: textPrimary, fontFamily: "Inter, sans-serif", margin: 0 }}>Prefer online therapy?</p>
                <p style={{ fontSize: 11, color: subtextColor, fontFamily: "Inter, sans-serif", margin: 0 }}>BetterHelp matches you in 48hrs</p>
              </div>
              <button onClick={() => {
                const link = document.createElement("a");
                link.href = "https://www.betterhelp.com/get-started/";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }} style={{
                padding: "6px 14px", background: "#3B82F6", color: "white", border: "none",
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Try it →</button>
            </div>
          </div>
        </div>
      )}

      {/* FIND A CHURCH MODAL */}
      {churchModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={() => setChurchModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: modalBg, borderRadius: 20, padding: 28,
            maxWidth: 440, width: "100%",
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>
              Find a Church
            </h2>
            <p style={{ fontSize: 13, color: subtextColor, fontFamily: "Inter, sans-serif", marginBottom: 20 }}>
              Find churches near you on Google Maps
            </p>

            {/* Zip Code */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: labelColor, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Your Zip Code *
              </label>
              <input value={churchZip} onChange={e => setChurchZip(e.target.value)}
                placeholder="e.g. 80202" maxLength={10}
                style={{
                  width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                  borderRadius: 8, fontSize: 14, color: inputColor, outline: "none",
                  fontFamily: "Inter, sans-serif", boxSizing: "border-box", background: inputBg,
                }}
                onFocus={e => { e.target.style.borderColor = "#7B5EA7"; }}
                onBlur={e => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"; }}
              />
            </div>

            {/* Denomination */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: labelColor, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Denomination / Religion
              </label>
              <select value={churchDenomination} onChange={e => setChurchDenomination(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                  borderRadius: 8, fontSize: 14, color: inputColor, outline: "none",
                  fontFamily: "Inter, sans-serif", background: inputBg, cursor: "pointer", boxSizing: "border-box",
                }}>
                <option value="church">Any Church</option>
                <option value="non-denominational church">Non-Denominational</option>
                <option value="Baptist church">Baptist</option>
                <option value="Catholic church">Catholic</option>
                <option value="Methodist church">Methodist</option>
                <option value="Pentecostal church">Pentecostal</option>
                <option value="AME church">AME (African Methodist Episcopal)</option>
                <option value="COGIC church">COGIC</option>
                <option value="Presbyterian church">Presbyterian</option>
                <option value="Lutheran church">Lutheran</option>
                <option value="Episcopal church">Episcopal</option>
                <option value="Adventist church">Seventh-day Adventist</option>
                <option value="evangelical church">Evangelical</option>
                <option value="mosque">Mosque (Islam)</option>
                <option value="synagogue">Synagogue (Jewish)</option>
              </select>
            </div>

            {/* Preference */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: labelColor, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Any other preference? (optional)
              </label>
              <input value={churchPreference} onChange={e => setChurchPreference(e.target.value)}
                placeholder="e.g. contemporary, young adults, Spanish speaking"
                style={{
                  width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                  borderRadius: 8, fontSize: 14, color: inputColor, outline: "none",
                  fontFamily: "Inter, sans-serif", boxSizing: "border-box", background: inputBg,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setChurchModalOpen(false)} style={{
                flex: 1, padding: 11, border: `1.5px solid ${inputBorder}`, borderRadius: 10,
                background: inputBg, fontSize: 14, fontWeight: 500, color: inputColor,
                cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Cancel</button>
              <button onClick={() => {
                if (!churchZip) { toast.error("Enter your zip code"); return; }
                const searchTerms = [churchPreference, churchDenomination, "near", churchZip].filter(Boolean).join(" ");
                const link = document.createElement("a");
                link.href = `https://www.google.com/maps/search/${encodeURIComponent(searchTerms)}`;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setChurchModalOpen(false);
              }} style={{
                flex: 1, padding: 11, background: "#7B5EA7", color: "white", border: "none",
                borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <MapPin size={16} /> Find Churches
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #B0ABA3; pointer-events: none; }
        @keyframes wave { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
      `}</style>
    </AppShell>
  );
}
