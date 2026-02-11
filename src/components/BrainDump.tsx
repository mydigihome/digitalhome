import { useState, useRef, useEffect } from "react";
import { X, Mic, MicOff, Type, Sparkles, Loader2, CheckCircle2, ListTodo, Lightbulb, Target, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBrainDump } from "@/hooks/useBrainDumps";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { RamenIcon, HouseAnimIcon, LampIcon } from "@/components/AnimatedIcons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ActiveIcon = "ramen" | "house" | "lamp";

export function getActiveIcon(hour: number, pathname: string): ActiveIcon {
  if (pathname === "/dashboard" || pathname === "/") {
    if (hour >= 5 && hour < 12) return "lamp";
    if (hour >= 12 && hour < 17) return "house";
    return "ramen";
  }
  if (pathname.includes("/notes") || pathname.includes("/brain-dump")) return "lamp";
  if (pathname.includes("/finance") || pathname.includes("/wealth")) return "house";
  if (pathname.includes("/project")) {
    return hour >= 5 && hour < 12 ? "lamp" : "house";
  }
  if (hour >= 5 && hour < 12) return "lamp";
  if (hour >= 12 && hour < 18) return "house";
  return "ramen";
}

const GLOW: Record<ActiveIcon, string> = {
  ramen: "rgba(232,131,74,0.3)",
  house: "rgba(139,92,246,0.3)",
  lamp: "rgba(212,169,106,0.3)",
};

const HEADER_BG: Record<ActiveIcon, string> = {
  ramen: "rgba(232,131,74,0.05)",
  house: "rgba(139,92,246,0.05)",
  lamp: "rgba(212,169,106,0.05)",
};

interface OrganizedResult {
  title: string;
  summary: string;
  tasks: string[];
  ideas: string[];
  goals: string[];
  reminders: string[];
  mood: string;
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
  const [showNotification, setShowNotification] = useState(false);
  const [notifColor, setNotifColor] = useState("#8B5CF6");
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const createDump = useCreateBrainDump();
  const location = useLocation();

  const hour = new Date().getHours();
  const activeIcon = getActiveIcon(hour, location.pathname);
  const IconComponent = activeIcon === "ramen" ? RamenIcon : activeIcon === "house" ? HouseAnimIcon : LampIcon;

  const currentContent = mode === "text" ? text : transcription;
  const charCount = currentContent.length;

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
      // Show inline error instead of toast
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
      ...(result ? {
        ai_title: result.title,
        summary: result.summary,
        structured_data: result as any,
        processed: true,
      } : {}),
    });

    // Show success notification
    setOpen(false);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2500);

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
    if (!SpeechRecognition) return;
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

  return (
    <>
      {/* Success notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-[10000] -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-card px-5 py-3 shadow-lg"
            style={{ borderLeft: `4px solid ${notifColor}` }}
          >
            <IconComponent size={16} />
            <span className="text-sm font-medium text-foreground">Saved to Brain Dump ✓</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating animated icon button */}
      <AnimatePresence>
        {!open && !showNotification && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                key="brain-fab"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.08, boxShadow: `0 0 24px ${GLOW[activeIcon]}` }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-[9999] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-transparent border-none cursor-pointer"
                style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIcon}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <IconComponent size={72} />
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-foreground text-background text-xs px-3 py-1.5 rounded-md">
              Brain Dump
            </TooltipContent>
          </Tooltip>
        )}
      </AnimatePresence>

      {/* Brain Dump Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-foreground/30 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-1/2 top-1/2 z-[9999] flex w-[640px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
              style={{ minHeight: 400, maxHeight: "75vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ background: HEADER_BG[activeIcon] }}>
                <div className="flex items-center gap-3">
                  <IconComponent size={32} />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Brain Dump</h2>
                    <p className="text-xs text-muted-foreground">Drop everything on your mind</p>
                  </div>
                </div>
                <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-secondary">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Mode tabs */}
              {!result && (
                <div className="flex gap-1 px-6 py-3 border-b border-border">
                  <button
                    onClick={() => setMode("text")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                      mode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Type className="h-3.5 w-3.5" /> Text
                  </button>
                  <button
                    onClick={() => setMode("voice")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                      mode === "voice" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Mic className="h-3.5 w-3.5" /> Voice
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold text-foreground">{result.title}</h3>
                        <span
                          className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium text-primary-foreground"
                          style={{ backgroundColor: MOOD_COLORS[result.mood] || MOOD_COLORS.neutral }}
                        >
                          {result.mood}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>

                      {result.tasks.length > 0 && (
                        <div className="rounded-xl border border-border p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                            <ListTodo className="h-3.5 w-3.5" /> Tasks
                          </div>
                          {result.tasks.map((t, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {t}
                            </div>
                          ))}
                        </div>
                      )}

                      {result.ideas.length > 0 && (
                        <div className="rounded-xl border border-border p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                            <Lightbulb className="h-3.5 w-3.5" /> Ideas
                          </div>
                          {result.ideas.map((idea, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                              {idea}
                            </div>
                          ))}
                        </div>
                      )}

                      {result.goals.length > 0 && (
                        <div className="rounded-xl border border-border p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                            <Target className="h-3.5 w-3.5" /> Goals
                          </div>
                          {result.goals.map((g, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                              {g}
                            </div>
                          ))}
                        </div>
                      )}

                      {result.reminders.length > 0 && (
                        <div className="rounded-xl border border-border p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                            <Bell className="h-3.5 w-3.5" /> Reminders
                          </div>
                          {result.reminders.map((r, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                              {r}
                            </div>
                          ))}
                        </div>
                      )}

                      <Button variant="outline" size="sm" onClick={() => setResult(null)} className="w-full">
                        ← Back to editing
                      </Button>
                    </motion.div>
                  ) : mode === "text" ? (
                    <motion.div
                      key="text"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="relative">
                        <Textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="What's on your mind? Pour it all out here. Thoughts, ideas, tasks, anything..."
                          className="min-h-[200px] max-h-[300px] resize-none rounded-xl border-border bg-background text-base leading-relaxed placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/20"
                          style={{ fontFamily: "Inter", fontSize: 16, lineHeight: 1.7 }}
                        />
                        <span className={cn(
                          "absolute bottom-2 right-3 text-xs",
                          charCount > 1000 ? "text-destructive" : charCount > 500 ? "text-warning" : "text-muted-foreground/40"
                        )}>
                          {charCount} characters
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="voice"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center"
                    >
                      <motion.button
                        onClick={recording ? stopRecording : startRecording}
                        className={cn(
                          "flex h-20 w-20 items-center justify-center rounded-full transition-colors",
                          recording ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        )}
                        animate={recording ? {
                          boxShadow: ["0 0 0 0 rgba(239,68,68,0.4)", "0 0 0 20px rgba(239,68,68,0)", "0 0 0 0 rgba(239,68,68,0.4)"],
                        } : {}}
                        transition={recording ? { duration: 1.5, repeat: Infinity } : {}}
                      >
                        {recording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                      </motion.button>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {recording ? (
                          <>Recording... tap to stop <span className="ml-1 font-mono text-foreground">{formatTime(timer)}</span></>
                        ) : transcription ? "Transcription (tap to edit)" : "Tap to start recording"}
                      </p>
                      {transcription && (
                        <Textarea
                          value={transcription}
                          onChange={(e) => setTranscription(e.target.value)}
                          className="mt-4 min-h-[120px] w-full resize-none rounded-xl border-border"
                          style={{ fontFamily: "Inter", fontSize: 16, lineHeight: 1.7 }}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-3">
                <Button
                  variant="default"
                  onClick={handleOrganize}
                  disabled={organizing || !currentContent.trim() || !!result}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {organizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI is organizing...
                    </>
                  ) : (
                    <>
                      <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ duration: 0.2 }}>
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                      Organize my thoughts ✨
                    </>
                  )}
                </Button>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={(mode === "text" && !text.trim()) || (mode === "voice" && !transcription.trim())}
                  >
                    Save Dump
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
