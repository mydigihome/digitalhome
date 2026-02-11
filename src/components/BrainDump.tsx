import { useState, useRef, useEffect } from "react";
import { X, Mic, MicOff, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBrainDump } from "@/hooks/useBrainDumps";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { RamenIcon, HouseAnimIcon, LampIcon } from "@/components/AnimatedIcons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ActiveIcon = "ramen" | "house" | "lamp";

function getActiveIcon(hour: number, pathname: string): ActiveIcon {
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

export default function BrainDump() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [timer, setTimer] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const createDump = useCreateBrainDump();
  const location = useLocation();

  const hour = new Date().getHours();
  const activeIcon = getActiveIcon(hour, location.pathname);

  const IconComponent = activeIcon === "ramen" ? RamenIcon : activeIcon === "house" ? HouseAnimIcon : LampIcon;

  const charCount = mode === "text" ? text.length : transcription.length;

  const handleSave = () => {
    const content = mode === "text" ? text.trim() : transcription.trim();
    if (!content) return;
    const tags = content.match(/#\w+/g)?.map((t) => t.slice(1)) || [];
    createDump.mutate({ type: mode === "text" ? "note" : "voice", content, tags });
    toast.success("Brain dump saved!");
    setText("");
    setTranscription("");
    setOpen(false);
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
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
    recognition.onerror = () => {
      setRecording(false);
      toast.error("Recording error");
    };
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
              onClick={() => setOpen(false)}
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
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ background: HEADER_BG[activeIcon] }}
              >
                <div className="flex items-center gap-3">
                  <IconComponent size={32} />
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Brain Dump</h2>
                    <p className="text-xs text-muted-foreground">Drop everything on your mind</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-secondary">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Mode tabs */}
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

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {mode === "text" ? (
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
              <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={(mode === "text" && !text.trim()) || (mode === "voice" && !transcription.trim())}
                >
                  Save Dump
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
