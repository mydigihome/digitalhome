import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Hash, MessageSquare, StickyNote, Eye, EyeOff, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateBrainDump } from "@/hooks/useBrainDumps";
import { useCreateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

export default function BrainDump() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "capture">("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [transparent, setTransparent] = useState(false);
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const createDump = useCreateBrainDump();
  const createTask = useCreateTask();
  const { data: projects = [] } = useProjects();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initPosition = useCallback(() => {
    if (position.x === -1) {
      setPosition({
        x: Math.max(16, window.innerWidth - 540),
        y: Math.max(16, window.innerHeight - 620),
      });
    }
  }, [position]);

  const handleOpen = () => {
    initPosition();
    setOpen(true);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".drag-handle")) return;
      e.preventDefault();
      dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      const onMove = (ev: MouseEvent) => {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 100, ev.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - dragOffset.current.y)),
        });
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [position]
  );

  const sendChat = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    createDump.mutate({ type: "chat", content: userMsg.content });

    let assistantSoFar = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brain-dump-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "AI error" }));
        toast.error(err.error || "Failed to get AI response");
        setIsStreaming(false);
        return;
      }

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      if (!reader) { setIsStreaming(false); return; }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch {
      toast.error("Failed to connect to AI");
    }
    setIsStreaming(false);
  };

  const handleCaptureSave = () => {
    if (!captureText.trim()) return;
    const tags = captureText.match(/#\w+/g)?.map((t) => t.slice(1)) || [];
    const isTask = tags.includes("task");

    createDump.mutate({ type: "note", content: captureText.trim(), tags });

    if (isTask && projects.length > 0) {
      const title = captureText.replace(/#\w+/g, "").trim();
      createTask.mutate({ title, project_id: projects[0].id });
      toast.success("Task created from capture!");
    } else {
      toast.success("Note saved!");
    }
    setCaptureText("");
  };

  return (
    <>
      {/* ── Fun sticky-note emoji FAB ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 30 }}
            whileHover={{ scale: 1.15, rotate: 6 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl transition-shadow hover:shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #FDE68A 0%, #FCD34D 50%, #FBBF24 100%)",
              border: "2px solid rgba(251, 191, 36, 0.4)",
            }}
            title="AI Brain Dump"
          >
            {/* Stacked effect behind */}
            <span
              className="absolute -right-1 -top-1 h-full w-full rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #FBCFE8 0%, #F9A8D4 100%)",
                border: "1.5px solid rgba(249, 168, 212, 0.4)",
                zIndex: -2,
                transform: "rotate(8deg) translate(3px, -3px)",
              }}
            />
            <span
              className="absolute -right-0.5 -top-0.5 h-full w-full rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #BAE6FD 0%, #7DD3FC 100%)",
                border: "1.5px solid rgba(125, 211, 252, 0.4)",
                zIndex: -1,
                transform: "rotate(4deg) translate(1px, -1px)",
              }}
            />
            <span className="text-2xl select-none" role="img" aria-label="sticky note">🧠</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Draggable sticky note widget ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="widget"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: transparent ? 0.7 : 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className={cn(
              "fixed z-[9999] flex w-[500px] max-w-[94vw] flex-col overflow-hidden rounded-2xl border shadow-2xl",
              transparent
                ? "border-amber-300/30 bg-amber-50/50 backdrop-blur-lg dark:border-amber-700/30 dark:bg-amber-950/30"
                : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/90"
            )}
            style={{ left: position.x, top: position.y, height: "min(75vh, 560px)" }}
            onMouseDown={handleMouseDown}
          >
            {/* Header — draggable */}
            <div
              className={cn(
                "drag-handle flex cursor-move items-center justify-between px-4 py-2.5",
                transparent
                  ? "bg-amber-200/30 dark:bg-amber-800/20"
                  : "bg-amber-100 dark:bg-amber-900/40"
              )}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-amber-500/50" />
                <span className="select-none text-lg" role="img">🧠</span>
                <span className="text-sm font-bold text-foreground">AI Brain Dump</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Transparency toggle */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {transparent ? (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <Switch
                    checked={transparent}
                    onCheckedChange={setTransparent}
                    className="h-4 w-8 data-[state=checked]:bg-primary"
                  />
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1 transition-colors hover:bg-foreground/10">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="border-b border-amber-200/60 px-4 py-2 dark:border-amber-800/40">
              <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                <TabsList className="h-8 w-full bg-amber-100/60 dark:bg-amber-900/30">
                  <TabsTrigger value="chat" className="flex-1 gap-1.5 text-xs">
                    <MessageSquare className="h-3 w-3" /> Chat
                  </TabsTrigger>
                  <TabsTrigger value="capture" className="flex-1 gap-1.5 text-xs">
                    <StickyNote className="h-3 w-3" /> Quick Capture
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Chat mode */}
            {mode === "chat" && (
              <>
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center py-8 text-center">
                      <span className="mb-2 text-4xl select-none">💭</span>
                      <p className="text-sm font-medium text-foreground">Dump your thoughts here...</p>
                      <p className="mt-1 text-xs text-muted-foreground">I'll help organize them into tasks and ideas</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card"
                      )}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  ))}
                  {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-border bg-card px-3 py-2">
                        <div className="flex gap-1">
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.1s" }} />
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-amber-200/60 p-3 dark:border-amber-800/40">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                      placeholder="Dump your thoughts here..."
                      className="min-h-[40px] resize-none border-amber-200/60 bg-background/60 dark:border-amber-800/40"
                      rows={1}
                    />
                    <Button size="icon" onClick={sendChat} disabled={isStreaming || !input.trim()} className="shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Quick Capture mode */}
            {mode === "capture" && (
              <div className="flex flex-1 flex-col p-4">
                <Textarea
                  value={captureText}
                  onChange={(e) => setCaptureText(e.target.value)}
                  placeholder="What's on your mind? Use #task, #idea, or #note ✏️"
                  className="flex-1 resize-none border-amber-200/60 bg-background/60 dark:border-amber-800/40"
                  rows={8}
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">#task</span>
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-warning">#idea</span>
                    <span className="rounded-full bg-muted px-2 py-0.5">#note</span>
                  </div>
                  <Button size="sm" onClick={handleCaptureSave} disabled={!captureText.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
