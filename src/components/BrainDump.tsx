import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Hash, MessageSquare, StickyNote, GripVertical, Sparkles, Palette, Bold, Italic, Underline, Strikethrough, Heading2, Heading3, List, ListOrdered, ListChecks, Code, Image, Link2, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useCreateBrainDump } from "@/hooks/useBrainDumps";
import { useCreateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const COLORS = [
  { name: "Yellow", bg: "bg-amber-50", header: "bg-amber-200/80", border: "border-amber-300", grad: "linear-gradient(135deg, #FDE68A 0%, #FCD34D 50%, #FBBF24 100%)", borderColor: "rgba(251,191,36,0.5)", darkBg: "dark:bg-amber-950/90", darkHeader: "dark:bg-amber-900/40", darkBorder: "dark:border-amber-800", inputBorder: "border-amber-200/60 dark:border-amber-800/40", tabBg: "bg-amber-100/60 dark:bg-amber-900/30", dot: "#FBBF24" },
  { name: "Pink", bg: "bg-pink-50", header: "bg-pink-200/80", border: "border-pink-300", grad: "linear-gradient(135deg, #FBCFE8 0%, #F9A8D4 50%, #F472B6 100%)", borderColor: "rgba(244,114,182,0.5)", darkBg: "dark:bg-pink-950/90", darkHeader: "dark:bg-pink-900/40", darkBorder: "dark:border-pink-800", inputBorder: "border-pink-200/60 dark:border-pink-800/40", tabBg: "bg-pink-100/60 dark:bg-pink-900/30", dot: "#F472B6" },
  { name: "Blue", bg: "bg-sky-50", header: "bg-sky-200/80", border: "border-sky-300", grad: "linear-gradient(135deg, #BAE6FD 0%, #7DD3FC 50%, #38BDF8 100%)", borderColor: "rgba(56,189,248,0.5)", darkBg: "dark:bg-sky-950/90", darkHeader: "dark:bg-sky-900/40", darkBorder: "dark:border-sky-800", inputBorder: "border-sky-200/60 dark:border-sky-800/40", tabBg: "bg-sky-100/60 dark:bg-sky-900/30", dot: "#38BDF8" },
  { name: "Green", bg: "bg-emerald-50", header: "bg-emerald-200/80", border: "border-emerald-300", grad: "linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 50%, #34D399 100%)", borderColor: "rgba(52,211,153,0.5)", darkBg: "dark:bg-emerald-950/90", darkHeader: "dark:bg-emerald-900/40", darkBorder: "dark:border-emerald-800", inputBorder: "border-emerald-200/60 dark:border-emerald-800/40", tabBg: "bg-emerald-100/60 dark:bg-emerald-900/30", dot: "#34D399" },
  { name: "Purple", bg: "bg-violet-50", header: "bg-violet-200/80", border: "border-violet-300", grad: "linear-gradient(135deg, #DDD6FE 0%, #C4B5FD 50%, #A78BFA 100%)", borderColor: "rgba(167,139,250,0.5)", darkBg: "dark:bg-violet-950/90", darkHeader: "dark:bg-violet-900/40", darkBorder: "dark:border-violet-800", inputBorder: "border-violet-200/60 dark:border-violet-800/40", tabBg: "bg-violet-100/60 dark:bg-violet-900/30", dot: "#A78BFA" },
];

const STACK_COLORS = [
  { grad: "linear-gradient(135deg, #FBCFE8 0%, #F9A8D4 100%)", border: "rgba(249,168,212,0.4)" },
  { grad: "linear-gradient(135deg, #BAE6FD 0%, #7DD3FC 100%)", border: "rgba(125,211,252,0.4)" },
];

const SIZES = [
  { label: "S", width: 380, height: 420 },
  { label: "M", width: 500, height: 560 },
  { label: "L", width: 640, height: 680 },
];

export default function BrainDump() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "capture">("capture");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [opacity, setOpacity] = useState(100);
  const [colorIdx, setColorIdx] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [showAIAction, setShowAIAction] = useState(false);
  const [aiActionPos, setAiActionPos] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [sizeIdx, setSizeIdx] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLTextAreaElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const createDump = useCreateBrainDump();
  const createTask = useCreateTask();
  const { data: projects = [] } = useProjects();

  const color = COLORS[colorIdx];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initPosition = useCallback(() => {
    if (position.x === -1) {
      const sz = SIZES[sizeIdx];
      setPosition({
        x: Math.max(16, window.innerWidth - sz.width - 40),
        y: Math.max(16, window.innerHeight - sz.height - 60),
      });
    }
  }, [position, sizeIdx]);

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

  // Handle text selection in capture textarea
  const handleTextSelect = () => {
    const textarea = captureRef.current;
    if (!textarea) return;
    const sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
    if (sel.length > 2) {
      setSelectedText(sel);
      // Position AI action near the textarea
      const rect = textarea.getBoundingClientRect();
      setAiActionPos({ x: rect.left + rect.width / 2 - 100, y: rect.top - 44 });
      setShowAIAction(true);
    } else {
      setShowAIAction(false);
      setSelectedText("");
    }
  };

  const handleAIAction = (action: string) => {
    setShowAIAction(false);
    // Switch to chat and send the selected text with the action
    const prompt = `${action}: "${selectedText}"`;
    setMode("chat");
    // Trigger chat with this prompt
    const userMsg: Msg = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setSelectedText("");
    // Auto-send
    streamChat([...messages, userMsg]);
  };

  const streamChat = async (allMessages: Msg[]) => {
    setIsStreaming(true);
    createDump.mutate({ type: "chat", content: allMessages[allMessages.length - 1].content });

    let assistantSoFar = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brain-dump-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
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

  const sendChat = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const all = [...messages, userMsg];
    setMessages(all);
    setInput("");
    await streamChat(all);
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

  const isTransparent = opacity < 100;

  return (
    <>
      {/* ── Stacked sticky notes FAB with sparkle ── */}
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
              background: color.grad,
              border: `2px solid ${color.borderColor}`,
            }}
            title="AI Brain Dump"
          >
            {/* Stacked notes behind */}
            <span
              className="absolute -right-1 -top-1 h-full w-full rounded-2xl"
              style={{
                background: STACK_COLORS[0].grad,
                border: `1.5px solid ${STACK_COLORS[0].border}`,
                zIndex: -2,
                transform: "rotate(8deg) translate(3px, -3px)",
              }}
            />
            <span
              className="absolute -right-0.5 -top-0.5 h-full w-full rounded-2xl"
              style={{
                background: STACK_COLORS[1].grad,
                border: `1.5px solid ${STACK_COLORS[1].border}`,
                zIndex: -1,
                transform: "rotate(4deg) translate(1px, -1px)",
              }}
            />
            <Sparkles className="h-6 w-6 text-white drop-shadow-md" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Floating AI action on text selection ── */}
      <AnimatePresence>
        {showAIAction && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="fixed z-[10000] flex gap-1 rounded-xl border border-border bg-card p-1 shadow-lg"
            style={{ left: aiActionPos.x, top: aiActionPos.y }}
          >
            <button onClick={() => handleAIAction("Structure this into a list")} className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-primary/10 text-foreground">📝 Make a list</button>
            <button onClick={() => handleAIAction("Summarize this")} className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-primary/10 text-foreground">✨ Summarize</button>
            <button onClick={() => handleAIAction("Turn this into actionable tasks")} className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:bg-primary/10 text-foreground">📋 Tasks</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Draggable sticky note widget ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="widget"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: opacity / 100, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className={cn(
              "fixed z-[9999] flex max-w-[94vw] flex-col overflow-hidden rounded-2xl border shadow-2xl transition-[width,height] duration-200",
              isTransparent ? "backdrop-blur-lg" : "",
              color.border, color.bg, color.darkBg, color.darkBorder
            )}
            style={{ left: position.x, top: position.y, width: SIZES[sizeIdx].width, height: `min(85vh, ${SIZES[sizeIdx].height}px)` }}
            onMouseDown={handleMouseDown}
          >
            {/* Header — draggable */}
            <div
              className={cn(
                "drag-handle flex cursor-move items-center justify-between px-4 py-2.5",
                color.header, color.darkHeader
              )}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 opacity-40" />
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">AI Brain Dump</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Color picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="rounded-lg p-1 transition-colors hover:bg-foreground/10" onClick={(e) => e.stopPropagation()}>
                      <Palette className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="end" onClick={(e) => e.stopPropagation()}>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Color</p>
                    <div className="flex gap-1.5">
                      {COLORS.map((c, i) => (
                        <button
                          key={c.name}
                          onClick={() => setColorIdx(i)}
                          className={cn(
                            "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                            colorIdx === i ? "border-foreground scale-110" : "border-transparent"
                          )}
                          style={{ background: c.grad }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {/* Size picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="rounded-lg p-1 transition-colors hover:bg-foreground/10" onClick={(e) => e.stopPropagation()}>
                      <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="end" onClick={(e) => e.stopPropagation()}>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Size</p>
                    <div className="flex gap-1">
                      {SIZES.map((s, i) => (
                        <button
                          key={s.label}
                          onClick={() => setSizeIdx(i)}
                          className={cn(
                            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                            sizeIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1 transition-colors hover:bg-foreground/10">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Opacity slider */}
            <div className="flex items-center gap-3 border-b px-4 py-2" style={{ borderColor: "inherit" }} onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Capacity</span>
              <Slider
                value={[opacity]}
                onValueChange={(v) => setOpacity(v[0])}
                min={30}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{opacity}%</span>
            </div>

            {/* Mode tabs */}
            <div className={cn("border-b px-4 py-2", color.inputBorder)}>
              <div className="flex gap-1 rounded-lg p-0.5" style={{ background: "rgba(0,0,0,0.04)" }}>
                <button
                  onClick={() => setMode("capture")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all",
                    mode === "capture" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <StickyNote className="h-3 w-3" /> Notes
                </button>
                <button
                  onClick={() => setMode("chat")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all",
                    mode === "chat" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-3 w-3" /> Chat
                </button>
              </div>
            </div>

            {/* Chat mode */}
            {mode === "chat" && (
              <>
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Sparkles className="mb-2 h-8 w-8 text-primary/60" />
                      <p className="text-sm font-medium text-foreground">Ask AI anything...</p>
                      <p className="mt-1 text-xs text-muted-foreground">Or highlight text in Notes to send it here</p>
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
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_pre]:text-xs [&_code]:text-xs">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        )}
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
                <div className={cn("border-t p-3", color.inputBorder)}>
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                      placeholder="Ask AI to organize your thoughts..."
                      className={cn("min-h-[40px] resize-none bg-background/60", color.inputBorder)}
                      rows={1}
                    />
                    <Button size="icon" onClick={sendChat} disabled={isStreaming || !input.trim()} className="shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Notes (formerly Quick Capture) */}
            {mode === "capture" && (
              <div className="flex flex-1 flex-col">
                {/* Formatting toolbar */}
                <div className={cn("flex flex-wrap items-center gap-0.5 border-b px-3 py-1.5", color.inputBorder)}>
                  {[
                    { icon: Bold, label: "Bold" },
                    { icon: Italic, label: "Italic" },
                    { icon: Underline, label: "Underline" },
                    { icon: Strikethrough, label: "Strikethrough" },
                  ].map(({ icon: Icon, label }) => (
                    <button key={label} title={label} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                  <span className="mx-1 h-4 w-px bg-border" />
                  <button title="Heading 2" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
                    <Heading2 className="h-3.5 w-3.5" />
                  </button>
                  <button title="Heading 3" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
                    <Heading3 className="h-3.5 w-3.5" />
                  </button>
                  <span className="mx-1 h-4 w-px bg-border" />
                  <button title="Bullet List" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button title="Numbered List" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <button title="Checklist" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
                    <ListChecks className="h-3.5 w-3.5" />
                  </button>
                  <span className="mx-1 h-4 w-px bg-border" />
                  <button title="Code" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
                    <Code className="h-3.5 w-3.5" />
                  </button>
                  <button title="Image" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
                    <Image className="h-3.5 w-3.5" />
                  </button>
                  <button title="Link" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground">
                    <Link2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Dump your thoughts below. <span className="font-medium text-foreground">Highlight text</span> to ask AI to organize it ✨
                  </p>
                  <Textarea
                    ref={captureRef}
                    value={captureText}
                    onChange={(e) => setCaptureText(e.target.value)}
                    onMouseUp={handleTextSelect}
                    onKeyUp={handleTextSelect}
                    placeholder={"1. Call the dentist\n2. Research project ideas\n3. Buy groceries\n4. Review budget spreadsheet..."}
                    className={cn("flex-1 resize-none bg-background/60 font-mono text-sm leading-relaxed", color.inputBorder)}
                    rows={8}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">#task</span>
                      <span className="rounded-full bg-muted px-2 py-0.5">#idea</span>
                      <span className="rounded-full bg-muted px-2 py-0.5">#note</span>
                    </div>
                    <Button size="sm" onClick={handleCaptureSave} disabled={!captureText.trim()}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
