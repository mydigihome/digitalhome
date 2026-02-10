import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Hash, MessageSquare, StickyNote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const createDump = useCreateBrainDump();
  const createTask = useCreateTask();
  const { data: projects = [] } = useProjects();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendChat = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    // Save to brain_dumps
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
    } catch (e) {
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
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
        style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 20px -4px hsl(var(--primary) / 0.3); }
          50% { box-shadow: 0 4px 30px -2px hsl(var(--primary) / 0.5); }
        }
      `}</style>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[9998] bg-foreground/10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-24 right-6 z-[9999] flex w-[90vw] max-w-[500px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
              style={{ height: "min(70vh, 560px)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/80 px-4 py-3">
                <div className="flex items-center gap-2 text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">AI Brain Dump</span>
                </div>
                <button onClick={() => setOpen(false)}>
                  <X className="h-4 w-4 text-primary-foreground/80" />
                </button>
              </div>

              {/* Mode tabs */}
              <div className="border-b border-border px-4 py-2">
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                  <TabsList className="h-7 w-full">
                    <TabsTrigger value="chat" className="flex-1 gap-1 text-xs">
                      <MessageSquare className="h-3 w-3" /> Chat
                    </TabsTrigger>
                    <TabsTrigger value="capture" className="flex-1 gap-1 text-xs">
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
                        <Sparkles className="mb-2 h-8 w-8 text-primary/30" />
                        <p className="text-sm text-muted-foreground">Dump your thoughts here...</p>
                        <p className="mt-1 text-xs text-muted-foreground/60">I'll help organize them into tasks and ideas</p>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-secondary"
                        )}>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </div>
                    ))}
                    {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl border border-border bg-secondary px-3 py-2">
                          <div className="flex gap-1">
                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.1s" }} />
                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border p-3">
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                        placeholder="Dump your thoughts here..."
                        className="min-h-[40px] resize-none"
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
                    placeholder="What's on your mind? Use #task, #idea, or #note"
                    className="flex-1 resize-none"
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}
