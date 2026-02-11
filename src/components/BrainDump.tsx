import { useState, useRef, useEffect } from "react";
import { X, Mic, MicOff, Type, Sparkles, Loader2, CheckCircle2, ListTodo, Lightbulb, Target, Bell, GripHorizontal, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBrainDump } from "@/hooks/useBrainDumps";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAnimatedIcon, AnimatedIconImage } from "@/components/AnimatedIcons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface OrganizedResult {
  title: string;
  summary: string;
  tasks: string[];
  ideas: string[];
  goals: string[];
  reminders: string[];
  mood: string;
}

const NOTE_COLORS = ["#8B5CF6", "#3B82F6", "#EC4899", "#F59E0B"];

function hexToRgba(hex: string, opacity: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity / 100})`;
}

const MOOD_COLORS: Record<string, string> = {
  productive: "hsl(var(--primary))",
  reflective: "hsl(210, 60%, 50%)",
  stressed: "hsl(0, 70%, 55%)",
  excited: "hsl(45, 90%, 50%)",
  neutral: "hsl(var(--muted-foreground))",
};

export default function BrainDump() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [timer, setTimer] = useState(0);
  const [organizing, setOrganizing] = useState(false);
  const [result, setResult] = useState<OrganizedResult | null>(null);
  const [cardColor, setCardColor] = useState("#8B5CF6");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const createDump = useCreateBrainDump();
  const { icon: currentIcon, index: currentIndex } = useAnimatedIcon();

  const currentContent = mode === "text" ? text : transcription;

  const handleOrganize = async () => {
    const content = currentContent.trim();
    if (!content) return;
    setOrganizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("organize-brain-dump", {
        body: { content },
      });
      if (error) throw error;
      setResult(data as OrganizedResult);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to process. Saving as regular note.");
    } finally {
      setOrganizing(false);
    }
  };

  const handleSave = () => {
    const content = currentContent.trim();
    if (!content) return;
    const tags = content.match(/#\w+/g)?.map((t) => t.slice(1)) || [];

    createDump.mutate({
      type: mode === "text" ? "note" : "voice",
      content,
      tags,
      card_color: cardColor,
      ...(result
        ? {
            ai_title: result.title,
            summary: result.summary,
            structured_data: result as any,
            processed: true,
          }
        : {}),
    });

    setOpen(false);
    toast.success("Saved to Notes ✓");
    setText("");
    setTranscription("");
    setResult(null);
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice recording not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setTranscription(transcript);
    };
    recognition.onerror = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
    setTimer(0);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const initialPos = useRef({
    x: Math.floor(window.innerWidth / 2 - 200),
    y: Math.floor(window.innerHeight / 2 - 200),
  });

  return (
    <>
      {/* Floating animated icon button */}
      <AnimatePresence>
        {!open && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                key="brain-fab"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{
                  scale: 1.12,
                  y: -4,
                  boxShadow: `0 8px 32px ${currentIcon.glowColor}`,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-[9999] flex h-[88px] w-[88px] items-center justify-center rounded-full cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <AnimatedIconImage icon={currentIcon} index={currentIndex} size={64} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium"
              style={{ background: "#1F2937", color: "white" }}
            >
              Brain Dump
            </TooltipContent>
          </Tooltip>
        )}
      </AnimatePresence>

      {/* Brain Dump Draggable Sticky Note */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-foreground/20 backdrop-blur-[2px]"
              onClick={handleClose}
            />
            <Draggable
              handle=".drag-handle-bd"
              bounds="parent"
              nodeRef={nodeRef as any}
              defaultPosition={initialPos.current}
            >
              <motion.div
                ref={nodeRef}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="fixed z-[10000] flex flex-col overflow-hidden"
                style={{
                  width: 400,
                  minHeight: 350,
                  borderRadius: 16,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                }}
              >
                {/* Header - drag handle */}
                <div
                  className="drag-handle-bd flex items-center justify-between px-4 cursor-grab active:cursor-grabbing select-none"
                  style={{
                    height: 52,
                    background: cardColor,
                    borderRadius: "16px 16px 0 0",
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
                    <button onClick={handleClose} className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-white/20">
                      <X className="h-4 w-4" style={{ color: "rgba(0,0,0,0.4)" }} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div
                  className="flex flex-1 flex-col overflow-y-auto"
                  style={{
                    background: hexToRgba(cardColor, 85),
                    borderRadius: "0 0 16px 16px",
                  }}
                >
                  {/* Mode tabs */}
                  {!result && (
                    <div className="flex gap-1 px-5 py-3">
                      <button
                        onClick={() => setMode("text")}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                          mode === "text"
                            ? "bg-white/50 text-foreground"
                            : "text-foreground/60 hover:bg-black/5"
                        )}
                        style={{ height: 40, background: mode === "text" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.05)" }}
                      >
                        <Type className="h-3.5 w-3.5" /> Text
                      </button>
                      <button
                        onClick={() => setMode("voice")}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                          mode === "voice"
                            ? "bg-white/50 text-foreground"
                            : "text-foreground/60 hover:bg-black/5"
                        )}
                        style={{ height: 40, background: mode === "voice" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.05)" }}
                      >
                        <Mic className="h-3.5 w-3.5" /> Voice
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 px-5 pb-4">
                    <AnimatePresence mode="wait">
                      {result ? (
                        <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" style={{ color: cardColor }} />
                            <h3 className="text-base font-semibold" style={{ color: "rgba(0,0,0,0.9)" }}>{result.title}</h3>
                            <span className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: MOOD_COLORS[result.mood] || MOOD_COLORS.neutral }}>
                              {result.mood}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>{result.summary}</p>
                          {result.tasks.length > 0 && (
                            <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.4)" }}>
                              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.7)" }}><ListTodo className="h-3.5 w-3.5" /> Tasks</div>
                              {result.tasks.map((t, i) => (<div key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(0,0,0,0.6)" }}><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cardColor }} />{t}</div>))}
                            </div>
                          )}
                          {result.ideas.length > 0 && (
                            <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.4)" }}>
                              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.7)" }}><Lightbulb className="h-3.5 w-3.5" /> Ideas</div>
                              {result.ideas.map((idea, i) => (<div key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(0,0,0,0.6)" }}><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />{idea}</div>))}
                            </div>
                          )}
                          {result.reminders.length > 0 && (
                            <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.4)" }}>
                              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(0,0,0,0.7)" }}><Bell className="h-3.5 w-3.5" /> Reminders</div>
                              {result.reminders.map((r, i) => (<div key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(0,0,0,0.6)" }}><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />{r}</div>))}
                            </div>
                          )}
                          <button onClick={() => setResult(null)} className="w-full rounded-lg py-2 text-sm font-medium" style={{ background: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.6)" }}>← Back to editing</button>
                        </motion.div>
                      ) : mode === "text" ? (
                        <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Pour everything on your mind here..."
                            className="w-full resize-none rounded-xl border-none outline-none"
                            style={{
                              minHeight: 240,
                              padding: 16,
                              background: "rgba(255,255,255,0.4)",
                              fontSize: 16,
                              lineHeight: 1.7,
                              color: "rgba(0,0,0,0.8)",
                            }}
                          />
                        </motion.div>
                      ) : (
                        <motion.div key="voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center pt-6">
                          <motion.button
                            onClick={recording ? stopRecording : startRecording}
                            className="flex h-20 w-20 items-center justify-center rounded-full"
                            style={recording
                              ? { background: "linear-gradient(135deg, #EF4444, #DC2626)" }
                              : { background: "rgba(0,0,0,0.08)" }
                            }
                            animate={recording ? { boxShadow: ["0 0 0 0 rgba(239,68,68,0.4)", "0 0 0 20px rgba(239,68,68,0)", "0 0 0 0 rgba(239,68,68,0.4)"] } : {}}
                            transition={recording ? { duration: 1.5, repeat: Infinity } : {}}
                          >
                            {recording ? <MicOff className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8" style={{ color: "rgba(0,0,0,0.4)" }} />}
                          </motion.button>
                          <p className="mt-3 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
                            {recording ? (<>Recording... <span className="ml-1 font-mono" style={{ color: "rgba(0,0,0,0.8)" }}>{formatTime(timer)}</span></>) : "Tap to record"}
                          </p>
                          {transcription && (
                            <textarea
                              value={transcription}
                              onChange={(e) => setTranscription(e.target.value)}
                              className="mt-4 w-full resize-none rounded-xl border-none outline-none"
                              style={{ minHeight: 120, padding: 16, background: "rgba(255,255,255,0.4)", fontSize: 16, lineHeight: 1.7 }}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex gap-2 px-5 pb-5">
                    <button
                      onClick={handleOrganize}
                      disabled={organizing || !currentContent.trim() || !!result}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white disabled:opacity-50 transition-all"
                      style={{ background: `linear-gradient(135deg, ${cardColor}, ${cardColor}dd)` }}
                    >
                      {organizing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>) : (<><Sparkles className="h-4 w-4" /> Organize My Thoughts ✨</>)}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!currentContent.trim()}
                      className="rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ background: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.7)" }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            </Draggable>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
