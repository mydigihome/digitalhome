import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, X, Lock, Unlock, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Extend window for webkit prefix
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const [locked, setLocked] = useState(() => localStorage.getItem("voice-btn-locked") === "true");
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem("voice-btn-pos");
    return saved ? JSON.parse(saved) : null;
  });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; bottom: number; right: number } | null>(null);
  const recognitionRef = useRef<any>(null);
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  const queryClient = useQueryClient();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const current = event.results[event.results.length - 1];
        const text = current[0].transcript;
        setTranscript(text);

        if (current.isFinal) {
          handleFinalTranscript(text);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const handleFinalTranscript = useCallback(
    async (text: string) => {
      if (!user || !text.trim()) return;
      const lower = text.toLowerCase();

      const isEvent =
        lower.includes("meeting") ||
        lower.includes("appointment") ||
        lower.includes("event") ||
        lower.includes("schedule");

      if (isEvent) {
        await createEvent(text);
      } else {
        await createTask(text);
      }
      setTranscript("");
    },
    [user, projects]
  );

  const createTask = async (text: string) => {
    if (!user) return;
    let title = text
      .replace(/^(add|create|new|make)\s+(a\s+)?(task|todo|to do|reminder?)\s*/i, "")
      .replace(/\s*(today|tomorrow)\s*/gi, "")
      .trim();
    if (!title) title = text.trim();

    let dueDate: string | null = null;
    if (text.toLowerCase().includes("tomorrow")) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dueDate = d.toISOString().split("T")[0];
    } else if (text.toLowerCase().includes("today")) {
      dueDate = new Date().toISOString().split("T")[0];
    }

    const projectId = projects[0]?.id;
    if (!projectId) {
      toast({ title: "No project found", description: "Create a project first to add tasks.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      project_id: projectId,
      title,
      due_date: dueDate,
      status: "backlog",
      priority: "medium",
      position: 0,
    });

    if (!error) {
      toast({ title: "✅ Task added", description: title });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } else {
      toast({ title: "Failed to add task", description: error.message, variant: "destructive" });
    }
  };

  const createEvent = async (text: string) => {
    if (!user) return;
    let title = text
      .replace(/^(add|create|new|make|schedule)\s+(a\s+)?(meeting|appointment|event)\s*/i, "")
      .replace(/\s*at\s+\d+\s*(am|pm)\s*/gi, "")
      .replace(/\s*(today|tomorrow)\s*/gi, "")
      .trim();

    const withMatch = text.match(/with\s+(\w+)/i);
    if (withMatch) {
      title = `Meeting with ${withMatch[1]}`;
    }
    if (!title) title = text.trim();

    const eventDate = new Date();
    if (text.toLowerCase().includes("tomorrow")) {
      eventDate.setDate(eventDate.getDate() + 1);
    }

    const timeMatch = text.match(/(\d+)\s*(am|pm)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      if (timeMatch[2].toLowerCase() === "pm" && hour !== 12) hour += 12;
      if (timeMatch[2].toLowerCase() === "am" && hour === 12) hour = 0;
      eventDate.setHours(hour, 0, 0, 0);
    }

    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title,
      start_time: eventDate.toISOString(),
      source: "manual",
    });

    if (!error) {
      toast({ title: "📅 Event added", description: `${title} — ${eventDate.toLocaleString()}` });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    } else {
      toast({ title: "Failed to add event", description: error.message, variant: "destructive" });
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (!supported) return null;

  return (
    <>
      {/* Floating mic button — draggable when unlocked */}
      <div
        className="fixed z-40 lg:z-50"
        style={
          position
            ? { bottom: `${position.bottom}px`, right: `${position.right}px` }
            : { bottom: "76px", right: "16px" }
        }
        onPointerDown={(e) => {
          if (locked) return;
          e.preventDefault();
          setDragging(true);
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            bottom: window.innerHeight - rect.bottom,
            right: window.innerWidth - rect.right,
          };

          const onMove = (ev: PointerEvent) => {
            if (!dragStartRef.current) return;
            const dx = ev.clientX - dragStartRef.current.x;
            const dy = ev.clientY - dragStartRef.current.y;
            const newBottom = Math.max(8, dragStartRef.current.bottom - dy);
            const newRight = Math.max(8, dragStartRef.current.right - dx);
            setPosition({ bottom: newBottom, right: newRight });
          };

          const onUp = () => {
            setDragging(false);
            dragStartRef.current = null;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };

          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }}
      >
        {/* Lock/unlock toggle — visible when unlocked or long-pressing */}
        {!locked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (position) {
                localStorage.setItem("voice-btn-pos", JSON.stringify(position));
              }
              localStorage.setItem("voice-btn-locked", "true");
              setLocked(true);
              toast({ title: "Button locked", description: "Position saved." });
            }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-card border border-border px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm hover:text-foreground"
          >
            <Lock className="h-3 w-3" /> Lock
          </button>
        )}

        <motion.button
          onClick={() => {
            if (dragging) return;
            if (locked) {
              toggleListening();
            }
          }}
          onDoubleClick={() => {
            if (locked) {
              localStorage.setItem("voice-btn-locked", "false");
              setLocked(false);
              toast({ title: "Button unlocked", description: "Drag to reposition, then tap Lock." });
            }
          }}
          className={cn(
            "flex items-center justify-center rounded-full transition-colors",
            "h-12 w-12 lg:h-14 lg:w-14",
            !locked && "ring-2 ring-dashed ring-primary/40 cursor-grab active:cursor-grabbing",
             locked && (isListening
               ? "bg-destructive/25 text-destructive-foreground backdrop-blur-2xl border border-white/10 shadow-none lg:bg-destructive lg:backdrop-blur-none lg:border-0 lg:shadow-lg"
               : "bg-primary/20 text-primary-foreground hover:bg-primary/35 backdrop-blur-2xl border border-white/10 shadow-none lg:bg-primary lg:backdrop-blur-none lg:border-0 lg:shadow-lg"),
             !locked && "bg-primary/15 text-primary-foreground backdrop-blur-2xl border-2 border-dashed border-white/15 shadow-none"
          )}
          whileTap={locked ? { scale: 0.9 } : {}}
          animate={isListening && locked ? { scale: [1, 1.08, 1] } : {}}
          transition={isListening ? { repeat: Infinity, duration: 1.2 } : {}}
          aria-label={locked ? (isListening ? "Stop listening" : "Voice input") : "Drag to move, tap Lock to save"}
        >
          {!locked ? (
            <GripVertical className="h-5 w-5 lg:h-6 lg:w-6" />
          ) : isListening ? (
            <MicOff className="h-5 w-5 lg:h-6 lg:w-6" />
          ) : (
            <Mic className="h-5 w-5 lg:h-6 lg:w-6" />
          )}
        </motion.button>
      </div>

      {/* Transcript overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-36 left-4 right-4 z-50 lg:bottom-24 lg:left-auto lg:right-6 lg:w-80"
          >
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">Listening…</span>
                <button onClick={toggleListening} className="ml-auto rounded-full p-1 hover:bg-secondary">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-foreground min-h-[1.5rem]">
                {transcript || <span className="text-muted-foreground italic">Say something like "Add task buy groceries tomorrow"</span>}
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Try: "Add meeting with Sarah at 3pm" · "Create task finish report today"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
