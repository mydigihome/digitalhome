import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useQuickTodos, useAddQuickTodo, useUpdateQuickTodo, useDeleteQuickTodo } from "@/hooks/useQuickTodos";
import { useHabits, useHabitLogs, useCreateHabit, useLogHabitHours, getCurrentWeekStart } from "@/hooks/useHabits";
import { useTodayEvents } from "@/hooks/useCalendarEvents";
import { useExpenses } from "@/hooks/useExpenses";
import { useContacts } from "@/hooks/useContacts";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useMarketQuote, useTimeseries, useSymbolSearch } from "@/hooks/useMarketData";
import LiveChart, { TIMEFRAMES } from "@/components/wealth/LiveChart";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, isToday } from "date-fns";
import {
  Plus, Edit2, X, ChevronDown, TrendingUp, TrendingDown, ExternalLink,
  Mail as MailIcon, ShoppingBag, FileText, Link as LinkIcon, Search,
  Smile, CloudRain, Heart, Sun, Trash2, GripVertical, Target, UserPlus,
  Receipt, CheckCircle, BookOpen,
} from "lucide-react";
import BrokerSelectionModal from "@/components/wealth/BrokerSelectionModal";
import { TradingPair } from "@/hooks/useTradingPairs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";
import NoteEditor from "@/components/NoteEditor";
import MonthlyReviewBanner from "@/components/dashboard/MonthlyReviewBanner";
import NetWorthCard from "@/components/dashboard/NetWorthCard";
import AdminReminderWidget from "@/components/AdminReminderWidget";
import JournalEntryModal from "@/components/journal/JournalEntryModal";
import StudioSnapshotCard from "@/components/dashboard/StudioSnapshotCard";
import QuickAddModal from "@/components/dashboard/QuickAddModal";
import StatusUpdateModal from "@/components/dashboard/StatusUpdateModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* ── Progress Ring ── */
function ProgressRing({ progress, size = 80, strokeWidth = 7, gradientId, color1, color2, children }: {
  progress: number; size?: number; strokeWidth?: number; gradientId: string; color1: string; color2: string; children: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`${color1}20`} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={`url(#${gradientId})`} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ── Sortable Card Wrapper ── */
function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.95 : 1,
    zIndex: isDragging ? 50 : undefined,
    boxShadow: isDragging ? "0 8px 30px rgba(0,0,0,0.15)" : undefined,
    scale: isDragging ? 1.01 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative group/drag">
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-1 top-4 z-20 w-6 h-6 rounded-md bg-muted/80 border border-border flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover/drag:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

/* ── Mood Icon ── */
function MoodIcon({ mood }: { mood?: string }) {
  if (!mood) return <Heart className="w-4 h-4 text-muted-foreground/40" />;
  const m = mood.toLowerCase();
  if (m.includes('happy') || m.includes('great') || m === '😊' || m === '❤️' || m === '😄') return <Smile className="w-4 h-4 text-success" />;
  if (m.includes('sad') || m.includes('down') || m === '😢' || m === '🌧') return <CloudRain className="w-4 h-4 text-info" />;
  if (m.includes('calm') || m.includes('peace') || m === '☀️') return <Sun className="w-4 h-4 text-warning" />;
  return <Heart className="w-4 h-4 text-muted-foreground/40" />;
}

/* ── Scripture ── */
const SCRIPTURES: Record<string, { text: string; ref: string }[]> = {
  christianity: [
    { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.", ref: "Jeremiah 29:11" },
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
    { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
    { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  ],
  islam: [
    { text: "Verily, with hardship comes ease.", ref: "Quran 94:6" },
    { text: "And He found you lost and guided you.", ref: "Quran 93:7" },
    { text: "So remember Me; I will remember you.", ref: "Quran 2:152" },
  ],
  judaism: [
    { text: "The Lord bless you and keep you; the Lord make His face shine on you.", ref: "Numbers 6:24-25" },
    { text: "Be strong and of good courage; do not be afraid.", ref: "Deuteronomy 31:6" },
  ],
  hinduism: [
    { text: "You have the right to work, but never to the fruit of work.", ref: "Bhagavad Gita 2:47" },
    { text: "The soul is neither born, and nor does it die.", ref: "Bhagavad Gita 2:20" },
  ],
  buddhism: [
    { text: "Peace comes from within. Do not seek it without.", ref: "Buddha" },
    { text: "What we think, we become.", ref: "Buddha" },
  ],
};
function ScriptureContent({ religion }: { religion?: string }) {
  const verses = SCRIPTURES[religion || ""] || SCRIPTURES.christianity;
  const verse = verses[new Date().getDate() % verses.length];
  return (
    <>
      <p className="text-sm italic leading-relaxed text-foreground/80">{verse.text}</p>
      <p className="text-xs mt-2 text-muted-foreground">— {verse.ref}</p>
    </>
  );
}

const stockOptions = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "BTC/USD", name: "Bitcoin" },
  { symbol: "ETH/USD", name: "Ethereum" },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "SPY", name: "S&P 500 ETF" },
];

const DEFAULT_LEFT_ORDER = ["networth-projects", "market", "momentum", "links", "studio", "reflections"];
const DEFAULT_RIGHT_ORDER = ["scripture", "reminders", "agenda", "todos", "network"];
const HERO_BG = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80";

/* ═══════════════════════════════════════════════════ */
export default function Dashboard() {
  const { profile, user } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: todos = [] } = useQuickTodos();
  const { data: habits = [] } = useHabits();
  const { data: habitLogs = [] } = useHabitLogs();
  const { data: todayEvents = [] } = useTodayEvents();
  const { data: expenses = [] } = useExpenses();
  const { data: contacts = [] } = useContacts();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [logHours, setLogHours] = useState("");
  const now = useCurrentTime();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const quickTodosRef = useRef<HTMLDivElement>(null);

  // Stock state
  const [selectedStock, setSelectedStock] = useState("AAPL");
  const [selectedStockName, setSelectedStockName] = useState("Apple Inc.");
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[2]);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const { data: quoteData } = useMarketQuote(selectedStock);
  const { data: tsData } = useTimeseries(selectedStock, selectedTimeframe.interval, selectedTimeframe.outputsize);
  const { data: searchResults } = useSymbolSearch(stockSearchQuery);

  // Drag-and-drop card order — left column
  const [leftOrder, setLeftOrder] = useState<string[]>(() =>
    loadStoredJson<string[]>("dh_left_column_order", DEFAULT_LEFT_ORDER)
  );
  // Drag-and-drop card order — right column
  const [rightOrder, setRightOrder] = useState<string[]>(() =>
    loadStoredJson<string[]>("dh_right_column_order", DEFAULT_RIGHT_ORDER)
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );
  const handleLeftDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLeftOrder((prev) => {
        const oldIdx = prev.indexOf(active.id as string);
        const newIdx = prev.indexOf(over.id as string);
        const next = arrayMove(prev, oldIdx, newIdx);
        saveStoredJson("dh_left_column_order", next);
        return next;
      });
    }
  };
  const handleRightDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRightOrder((prev) => {
        const oldIdx = prev.indexOf(active.id as string);
        const newIdx = prev.indexOf(over.id as string);
        const next = arrayMove(prev, oldIdx, newIdx);
        saveStoredJson("dh_right_column_order", next);
        return next;
      });
    }
  };

  // Stock dropdown close
  useEffect(() => {
    if (!stockDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-stock-dropdown]")) setStockDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [stockDropdownOpen]);

  const addTodo = useAddQuickTodo();
  const updateTodo = useUpdateQuickTodo();
  const deleteTodo = useDeleteQuickTodo();
  const createHabit = useCreateHabit();
  const logHabitHours = useLogHabitHours();

  // Payment success
  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    const planParam = searchParams.get("plan");
    if (paymentParam === "success") {
      if (planParam === "founding") {
        upsertPrefs.mutate({ is_subscribed: true, subscription_type: "founding", founding_member_since: new Date().toISOString() } as any);
        if (user) {
          supabase.from("profiles").update({ founding_member: true } as any).eq("id", user.id).then(() => {});
        }
      } else {
        upsertPrefs.mutate({ is_subscribed: true, subscription_type: planParam || "pro" } as any);
      }
      import("canvas-confetti").then((m) => {
        m.default({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      });
      toast.success(planParam === "founding" ? "Welcome, Founding Member! Full access unlocked." : "You're all set — Pro features unlocked.");
      setSearchParams({}, { replace: true });
    }
  }, []);

  // Tutorial
  useEffect(() => {
    if (prefs && (prefs as any).welcome_video_watched === false) {
      const timer = setTimeout(() => setShowTutorial(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [prefs]);

  // Computed data
  const userName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const greeting = `${getGreeting()}, ${userName}`;
  const currentDate = format(now, "EEEE, MMMM d");
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "done").length;
  const momentum = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const currentWeekStart = getCurrentWeekStart();
  const thisWeekLogs = (habitLogs || []).filter(log => log.week_start_date === currentWeekStart);
  const totalHours = thisWeekLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
  const habitsProgress = habits.length > 0 ? Math.min(100, Math.round((totalHours / Math.max(1, habits.length * 7)) * 100)) : 0;
  const streakDays = thisWeekLogs.length;

  const activeProjects = projects
    .filter(p => !p.archived)
    .map(p => {
      const pt = tasks.filter(t => t.project_id === p.id);
      const done = pt.filter(t => t.status === "done").length;
      const total = pt.length;
      return { ...p, percentage: total > 0 ? Math.round((done / total) * 100) : 0, total, done };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const agendaItems = [
    ...(todayEvents || []).map(e => ({
      time: format(new Date(e.start_time), "h:mm a"),
      title: e.title,
      subtitle: e.location || "",
      type: "event" as const,
    })),
    ...tasks
      .filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== "done")
      .slice(0, 5)
      .map(t => ({
        time: t.due_date ? format(new Date(t.due_date), "h:mm a") : "",
        title: t.title,
        subtitle: "",
        type: "task" as const,
      })),
  ].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 3);

  const moneyReminders = (expenses || [])
    .filter(e => e.frequency && e.frequency !== "once")
    .slice(0, 2)
    .map(e => ({ name: e.description, amount: e.amount }));

  const { data: journalEntries = [] } = useQuery({
    queryKey: ["recent_journal", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const hasCover = prefs?.dashboard_cover_type === "image" && prefs.dashboard_cover;
  const heroBg = hasCover ? prefs!.dashboard_cover! : HERO_BG;

  const quote = quoteData?.quote;
  const priceChange = quote ? parseFloat(quote.change) : 0;
  const priceChangePercent = quote ? parseFloat(quote.percent_change) : 0;
  const currentPrice = quote ? parseFloat(quote.price) : 0;
  const chartData = tsData?.timeseries || quoteData?.timeseries || [];

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    addTodo.mutate({ text: newTodoText.trim(), order: todos.length });
    setNewTodoText("");
  };

  const scrollToTodos = () => {
    quickTodosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      quickTodosRef.current?.classList.add('ring-2', 'ring-[#10B981]');
      setTimeout(() => quickTodosRef.current?.classList.remove('ring-2', 'ring-[#10B981]'), 1500);
    }, 500);
  };

  /* ── Quick action circles for hero ── */
  const heroActions = [
    { key: "goal", label: "Goal", icon: Target, onClick: () => setProjectModalOpen(true) },
    { key: "contact", label: "Contact", icon: UserPlus, onClick: () => navigate("/relationships") },
    { key: "bill", label: "Bill", icon: Receipt, onClick: () => navigate("/finance/wealth") },
    { key: "todo", label: "Todo", icon: CheckCircle, onClick: scrollToTodos },
    { key: "journal", label: "Journal", icon: BookOpen, onClick: () => setJournalModalOpen(true) },
  ];

  /* ── Link handlers ── */
  const linkIcons: Record<string, React.ReactNode> = {
    mail: <MailIcon className="w-5 h-5 text-info" strokeWidth={1.5} />,
    store: <ShoppingBag className="w-5 h-5 text-success" strokeWidth={1.5} />,
    status: <FileText className="w-5 h-5 text-warning" strokeWidth={1.5} />,
  };

  /* ── Render each draggable card by ID ── */
  /* ── Compact Net Worth (inline) ── */
  const compactNetWorth = (() => {
    const savings = Number(finances?.current_savings || 0);
    const totalDebtCalc = Number(finances?.total_debt || 0) + (loans || []).reduce((s: number, l: any) => s + Number(l.amount), 0);
    const nw = savings - totalDebtCalc;
    const inc = Number(finances?.monthly_income || 0);
    const fmt = (n: number) => { const abs = Math.abs(n); const p = n < 0 ? "-" : ""; return abs >= 1000 ? `${p}$${(abs / 1000).toFixed(1)}K` : `${p}$${abs.toLocaleString()}`; };
    return (
      <button onClick={() => navigate("/finance/wealth")}
        className="h-full p-4 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-primary/30 hover:shadow-md transition-all text-left group flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Net Worth</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className={`text-[28px] font-bold tracking-tight ${nw >= 0 ? "text-success" : "text-destructive"}`}>{fmt(nw)}</p>
        <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground">
          <span>Income: <span className="font-semibold text-success">${inc.toLocaleString()}/mo</span></span>
          {totalDebtCalc > 0 && <span>Debt: <span className="font-semibold text-destructive">{fmt(totalDebtCalc)}</span></span>}
        </div>
      </button>
    );
  })();

  /* ── Compact Active Projects (inline) ── */
  const compactProjects = (
    <div className="h-full p-4 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Active Projects</h2>
        <button onClick={() => navigate("/projects")} className="text-xs font-medium text-success hover:underline">View All</button>
      </div>
      {activeProjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">No active projects yet</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setProjectModalOpen(true)}><Plus className="mr-1 h-3 w-3" /> Create</Button>
        </div>
      ) : (
        <div className="flex gap-2 flex-1 overflow-hidden">
          {activeProjects.map((project) => (
            <button key={project.id} onClick={() => navigate(`/project/${project.id}`)}
              className="flex-1 min-w-0 p-3 bg-muted/40 rounded-lg border border-border hover:border-primary/30 transition text-left flex flex-col justify-between">
              <p className="text-sm font-semibold truncate text-foreground" title={project.name}>
                {project.name.length > 24 ? project.name.slice(0, 24) + "…" : project.name}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{project.done}/{project.total}</span>
                <span className="text-xs font-bold text-primary">{project.percentage}%</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.percentage}%` }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderLeftCard = (id: string) => {
    switch (id) {
      case "networth-projects":
        return (
          <SortableCard key={id} id={id}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="w-full lg:w-[40%]">{compactNetWorth}</div>
              <div className="w-full lg:w-[60%]">{compactProjects}</div>
            </div>
          </SortableCard>
        );

      case "market":
        return (
          <SortableCard key={id} id={id}>
            <div className="overflow-hidden bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-semibold text-foreground">Market Watch</h2>
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> Live
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{selectedStockName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground tabular-nums">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-sm font-semibold flex items-center justify-end gap-1 mt-0.5 ${priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {priceChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}% Today
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="relative" data-stock-dropdown>
                    <button onClick={() => setStockDropdownOpen(!stockDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-sm font-semibold bg-muted text-foreground">
                      <Search className="w-3.5 h-3.5 text-muted-foreground" />
                      {selectedStock}
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {stockDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-80 bg-popover rounded-xl shadow-xl border border-border py-2 z-50">
                        <div className="px-3 pb-2">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <input value={stockSearchQuery} onChange={(e) => setStockSearchQuery(e.target.value)}
                              placeholder="Search stocks, crypto, forex..." className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" autoFocus />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {stockSearchQuery.length > 0 && searchResults?.length > 0 ? (
                            searchResults.slice(0, 10).map((r: any) => (
                              <button key={`${r.symbol}-${r.exchange}`} onClick={() => { setSelectedStock(r.symbol); setSelectedStockName(r.instrument_name || r.symbol); setStockDropdownOpen(false); setStockSearchQuery(""); }}
                                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted transition text-left">
                                <div className="min-w-0">
                                  <span className="text-sm font-bold text-foreground">{r.symbol}</span>
                                  <p className="text-xs text-muted-foreground truncate">{r.instrument_name}</p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold flex-shrink-0 ml-2">{r.instrument_type || r.exchange}</span>
                              </button>
                            ))
                          ) : (
                            stockOptions.map((stock) => (
                              <button key={stock.symbol} onClick={() => { setSelectedStock(stock.symbol); setSelectedStockName(stock.name); setStockDropdownOpen(false); setStockSearchQuery(""); }}
                                className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-muted transition text-left ${selectedStock === stock.symbol ? 'bg-primary/10' : ''}`}>
                                <div>
                                  <span className="text-sm font-bold text-foreground">{stock.symbol}</span>
                                  <span className="text-xs ml-2 text-muted-foreground">{stock.name}</span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                      {TIMEFRAMES.map((tf) => (
                        <button key={tf.label} onClick={() => setSelectedTimeframe(tf)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${selectedTimeframe.label === tf.label ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted bg-secondary'}`}>
                          {tf.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowBrokerModal(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0">
                      Trade
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full" style={{ minHeight: 400 }}>
                {chartData.length > 0 ? <LiveChart data={chartData} symbol={selectedStock} /> : <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>}
              </div>
            </div>
          </SortableCard>
        );

      case "momentum":
        return (
          <SortableCard key={id} id={id}>
            <div className="flex gap-4">
              <div className="flex-1 p-5 flex items-center gap-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <ProgressRing progress={momentum} size={72} strokeWidth={6} gradientId="m-grad" color1="#6366F1" color2="#8B5CF6">
                  <span className="text-base font-bold text-foreground">{momentum}%</span>
                </ProgressRing>
                <div>
                  <p className="text-sm font-semibold text-foreground">Momentum</p>
                  <p className="text-xs text-muted-foreground">{doneTasks}/{totalTasks} tasks done</p>
                  <p className="text-xs font-medium mt-0.5 text-primary">{momentum}% Complete</p>
                </div>
              </div>
              <button onClick={() => habits.length > 0 && setSelectedHabit(habits[0])}
                className="flex-1 p-5 flex items-center gap-4 cursor-pointer hover:opacity-90 transition bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <ProgressRing progress={habitsProgress} size={68} strokeWidth={6} gradientId="h-grad" color1="#10B981" color2="#34D399">
                  <span className="text-sm font-bold text-foreground">{streakDays}</span>
                </ProgressRing>
                <div>
                  <p className="text-sm font-semibold text-foreground">Habit Tracker</p>
                  <p className="text-xs text-muted-foreground">{habits[0]?.name || "Morning Meditation"}</p>
                  <p className="text-xs font-medium mt-0.5 text-success">{habitsProgress}% Consistency</p>
                </div>
              </button>
            </div>
          </SortableCard>
        );

      case "links":
        return (
          <SortableCard key={id} id={id}>
            <div className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0 text-primary">Links</span>
              <button onClick={() => window.location.href = "mailto:"}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary/30 hover:shadow-sm transition flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-info/10 flex items-center justify-center"><MailIcon className="w-3 h-3 text-info" /></div>
                <span className="text-xs font-semibold text-foreground">Email</span>
              </button>
              <button onClick={() => navigate("/finance/applications")}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary/30 hover:shadow-sm transition flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center"><ShoppingBag className="w-3 h-3 text-success" /></div>
                <span className="text-xs font-semibold text-foreground">Store</span>
              </button>
              <button onClick={() => setStatusModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary/30 hover:shadow-sm transition flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center"><FileText className="w-3 h-3 text-warning" /></div>
                <span className="text-xs font-semibold text-foreground">Status</span>
              </button>
              <button onClick={() => setQuickAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-border hover:border-primary transition flex-shrink-0">
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">New</span>
              </button>
            </div>
          </SortableCard>
        );

      case "studio":
        return <SortableCard key={id} id={id}><StudioSnapshotCard /></SortableCard>;

      case "reflections":
        return (
          <SortableCard key={id} id={id}>
            <div className="bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="p-5 pb-0 flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Recent Reflections</h2>
                  <p className="text-xs text-success">Capture your thoughts daily</p>
                </div>
                <button onClick={() => setJournalModalOpen(true)} className="text-sm font-medium text-success hover:underline">New Journal Entry</button>
              </div>
              <div className="px-5 pb-5 space-y-0">
                {(journalEntries.length > 0 ? journalEntries : [
                  { id: "sample1", title: "The Clarity of Morning", created_at: new Date().toISOString(), mood_emoji: "" },
                  { id: "sample2", title: "Stormy Decisions", created_at: new Date(Date.now() - 86400000).toISOString(), mood_emoji: "" },
                ]).slice(0, 5).map((entry: any) => {
                  const entryDate = new Date(entry.created_at);
                  const dateLabel = isToday(entryDate) ? "Today" : format(entryDate, "MMM d");
                  return (
                    <div key={entry.id} className="group flex items-center gap-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition rounded-lg px-2 -mx-2 cursor-pointer"
                      onClick={() => setJournalModalOpen(true)}>
                      <span className="text-[13px] text-muted-foreground w-16 flex-shrink-0">{dateLabel}</span>
                      <span className="text-sm font-medium text-foreground flex-1 truncate">{entry.title || "Untitled Entry"}</span>
                      <MoodIcon mood={entry.mood_emoji} />
                      {entry.id && !entry.id.startsWith("sample") && (
                        <button onClick={(e) => { e.stopPropagation(); setDeleteEntryId(entry.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </SortableCard>
        );

      default: return null;
    }
  };

  /* ── Render right column card by ID ── */
  const renderRightCard = (id: string) => {
    switch (id) {
      case "scripture":
        if (!(prefs as any)?.show_scripture_card) return null;
        return (
          <SortableCard key={id} id={id}>
            <div className="p-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <h3 className="font-semibold text-sm mb-3 text-foreground">Daily Scripture</h3>
              <ScriptureContent religion={(prefs as any)?.religion} />
            </div>
          </SortableCard>
        );

      case "reminders":
        return (
          <SortableCard key={id} id={id}>
            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-semibold text-white">Money Reminders</h2>
              </div>
              {moneyReminders.length > 0 ? (
                <div className="space-y-0">
                  {moneyReminders.map((bill, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-white">{bill.name}</p>
                        <p className="text-xs text-white/50">Due soon</p>
                      </div>
                      <span className="text-base font-bold text-red-400">${bill.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-0">
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div><p className="text-sm font-medium text-white">Credit Card Due</p><p className="text-xs text-white/50">March 5th</p></div>
                    <span className="text-base font-bold text-red-400">$1,240.00</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div><p className="text-sm font-medium text-white">Rent Payment</p><p className="text-xs text-white/50">March 1st</p></div>
                    <span className="text-base font-bold text-red-400">$2,800.00</span>
                  </div>
                </div>
              )}
            </div>
          </SortableCard>
        );

      case "agenda":
        return (
          <SortableCard key={id} id={id}>
            <div className="p-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Today's Agenda</h2>
                <button onClick={() => navigate("/calendar")} className="text-sm font-medium text-success hover:underline">View All</button>
              </div>
              {agendaItems.length > 0 ? (
                <div className="space-y-0">
                  {agendaItems.map((item, idx) => {
                    const colors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--destructive))"];
                    return (
                      <div key={idx} className="flex gap-4 py-3 border-b border-border last:border-b-0">
                        <div className="w-1 rounded-sm flex-shrink-0" style={{ background: colors[idx % 3] }} />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: colors[idx % 3] }}>{item.time}</p>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-center py-6 text-muted-foreground">No events today</p>
              )}
            </div>
          </SortableCard>
        );

      case "todos":
        return (
          <SortableCard key={id} id={id}>
            <div ref={quickTodosRef} className="p-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Quick To-Dos</h2>
              </div>
              <div className="space-y-0">
                {todos.filter(t => !t.completed).slice(0, 3).map(todo => (
                  <div key={todo.id} className="flex items-center gap-3 py-2.5">
                    <button onClick={() => updateTodo.mutate({ id: todo.id, completed: true })}
                      className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 flex items-center justify-center transition hover:border-primary" />
                    <span className="text-sm text-foreground">{todo.text}</span>
                  </div>
                ))}
                {todos.filter(t => t.completed).slice(0, 2).map(todo => (
                  <div key={todo.id} className="flex items-center gap-3 py-2.5">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center bg-primary">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <span className="text-sm line-through text-muted-foreground">{todo.text}</span>
                  </div>
                ))}
                <input value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                  placeholder="Add a quick note..."
                  className="w-full mt-2 py-2 px-3 text-[13px] bg-transparent outline-none rounded-lg border border-dashed border-border text-foreground placeholder:text-muted-foreground" />
              </div>
            </div>
          </SortableCard>
        );

      case "network":
        return (
          <SortableCard key={id} id={id}>
            <div className="p-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]" style={{ maxHeight: 180, overflow: "hidden" }}>
              <h2 className="text-base font-semibold text-foreground mb-3">Network</h2>
              <p className="text-2xl font-bold text-foreground tabular-nums">{contacts.length}</p>
              <p className="text-xs text-muted-foreground mb-3">Total contacts</p>
              {contacts.length > 0 && contacts[0] && (
                <p className="text-xs text-muted-foreground truncate">Last contacted: <span className="text-foreground font-medium">{contacts[0].name}</span></p>
              )}
              <button onClick={() => navigate("/relationships")}
                className="mt-2 text-xs font-medium text-success hover:underline">+ Add Contact</button>
            </div>
          </SortableCard>
        );

      default: return null;
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <MonthlyReviewBanner />

        {/* ═══ TWO-COLUMN LAYOUT ═══ */}
        <div className="max-w-6xl mx-auto px-4 pb-28">

          {/* ═══ HERO BANNER ═══ */}
          <div
            className="relative w-full overflow-hidden rounded-2xl mb-6 group cursor-pointer"
            style={{ height: 220 }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file"; input.accept = "image/*";
              input.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev: any) => {
                    upsertPrefs.mutate({ dashboard_cover: ev.target.result, dashboard_cover_type: "image" });
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)" }} />

            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Edit2 className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Monthly Review Button */}
            {(() => {
              const today = new Date();
              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
              const showReview = today.getDate() >= lastDay - 2 || searchParams.get("review") === "1";
              const alreadyDone = (prefs as any)?.last_review_month === `${format(today, "MMMM yyyy")}`;
              if (!showReview || alreadyDone) return null;
              return (
                <button onClick={(e) => { e.stopPropagation(); navigate("/monthly-review"); }}
                  className="absolute top-4 right-14 z-20 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white rounded-lg bg-primary/80 hover:bg-primary transition">
                  <FileText className="w-3.5 h-3.5" /> Monthly Review
                </button>
              );
            })()}

            <div className="absolute bottom-16 left-6 sm:left-8 z-10">
              <p className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{currentDate}</p>
              <h1 className="text-[32px] leading-[1.15] mt-0.5 font-semibold text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                {greeting}
              </h1>
            </div>

            {/* Quick-action circles at bottom of hero */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-5">
              {heroActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.key} onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                    className="flex flex-col items-center gap-1 group/action">
                    <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center transition-transform group-hover/action:scale-110 shadow-md">
                      <Icon className="w-5 h-5" style={{ color: "#059669" }} strokeWidth={1.8} />
                    </div>
                    <span className="text-[11px] font-medium text-white">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ MAIN TWO-COLUMN GRID ═══ */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT COLUMN */}
            <div className="flex-1 min-w-0 space-y-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
                  {cardOrder.map((id) => renderCard(id))}
                </SortableContext>
              </DndContext>
            </div>

            {/* RIGHT COLUMN — fixed 320px */}
            <div className="w-full lg:w-[320px] lg:flex-shrink-0 space-y-4">
              {/* Daily Scripture */}
              {(prefs as any)?.show_scripture_card && (
                <div className="p-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <h3 className="font-semibold text-sm mb-3 text-foreground">Daily Scripture</h3>
                  <ScriptureContent religion={(prefs as any)?.religion} />
                </div>
              )}

              {/* Money Reminders */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Money Reminders</h2>
                </div>
                {moneyReminders.length > 0 ? (
                  <div className="space-y-0">
                    {moneyReminders.map((bill, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-white">{bill.name}</p>
                          <p className="text-xs text-white/50">Due soon</p>
                        </div>
                        <span className="text-base font-bold text-red-400">${bill.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <div><p className="text-sm font-medium text-white">Credit Card Due</p><p className="text-xs text-white/50">March 5th</p></div>
                      <span className="text-base font-bold text-red-400">$1,240.00</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div><p className="text-sm font-medium text-white">Rent Payment</p><p className="text-xs text-white/50">March 1st</p></div>
                      <span className="text-base font-bold text-red-400">$2,800.00</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Today's Agenda */}
              <div className="p-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground">Today's Agenda</h2>
                  <button onClick={() => navigate("/calendar")} className="text-sm font-medium text-success hover:underline">View All</button>
                </div>
                {agendaItems.length > 0 ? (
                  <div className="space-y-0">
                    {agendaItems.map((item, idx) => {
                      const colors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--destructive))"];
                      return (
                        <div key={idx} className="flex gap-4 py-3 border-b border-border last:border-b-0">
                          <div className="w-1 rounded-sm flex-shrink-0" style={{ background: colors[idx % 3] }} />
                          <div>
                            <p className="text-xs font-semibold" style={{ color: colors[idx % 3] }}>{item.time}</p>
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-center py-6 text-muted-foreground">No events today</p>
                )}
              </div>

              {/* Quick To-Dos */}
              <div ref={quickTodosRef} className="p-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground">Quick To-Dos</h2>
                </div>
                <div className="space-y-0">
                  {todos.filter(t => !t.completed).slice(0, 3).map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 py-2.5">
                      <button onClick={() => updateTodo.mutate({ id: todo.id, completed: true })}
                        className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 flex items-center justify-center transition hover:border-primary" />
                      <span className="text-sm text-foreground">{todo.text}</span>
                    </div>
                  ))}
                  {todos.filter(t => t.completed).slice(0, 2).map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 py-2.5">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center bg-primary">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <span className="text-sm line-through text-muted-foreground">{todo.text}</span>
                    </div>
                  ))}
                  <input value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                    placeholder="Add a quick note..."
                    className="w-full mt-2 py-2 px-3 text-[13px] bg-transparent outline-none rounded-lg border border-dashed border-border text-foreground placeholder:text-muted-foreground" />
                </div>
              </div>

              {/* Network Summary — smaller */}
              <div className="p-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]" style={{ maxHeight: 180, overflow: "hidden" }}>
                <h2 className="text-base font-semibold text-foreground mb-3">Network</h2>
                <p className="text-2xl font-bold text-foreground tabular-nums">{contacts.length}</p>
                <p className="text-xs text-muted-foreground mb-3">Total contacts</p>
                {contacts.length > 0 && contacts[0] && (
                  <p className="text-xs text-muted-foreground truncate">Last contacted: <span className="text-foreground font-medium">{contacts[0].name}</span></p>
                )}
                <button onClick={() => navigate("/relationships")}
                  className="mt-2 text-xs font-medium text-success hover:underline">+ Add Contact</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      <JournalEntryModal open={journalModalOpen} onClose={() => setJournalModalOpen(false)} />
      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onNewGoal={() => setProjectModalOpen(true)}
        onNewTask={scrollToTodos}
        onNewJournal={() => setJournalModalOpen(true)}
        onNewContact={() => navigate("/relationships")}
      />
      <StatusUpdateModal open={statusModalOpen} onClose={() => setStatusModalOpen(false)} />

      <AlertDialog open={!!deleteEntryId} onOpenChange={() => setDeleteEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this journal entry.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const id = deleteEntryId;
                setDeleteEntryId(null);
                await supabase.from("journal_entries").delete().eq("id", id!);
                queryClient.invalidateQueries({ queryKey: ["recent_journal"] });
                toast("Entry deleted", { action: { label: "Undo", onClick: () => toast.info("Undo not available for this action") }, duration: 5000 });
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
      <NoteEditor open={noteEditorOpen} onClose={() => setNoteEditorOpen(false)} />
      {taskEditorOpen && projects.length > 0 && (
        <TaskEditor projectId={projects[0].id} defaultStatus="backlog" onClose={() => setTaskEditorOpen(false)} />
      )}
      {showBrokerModal && (
        <BrokerSelectionModal
          pair={{ id: selectedStock, user_id: "", symbol: selectedStock, display_name: selectedStockName, category: "Stocks", is_active: true, sort_order: 0, created_at: "" } as TradingPair}
          onClose={() => setShowBrokerModal(false)}
        />
      )}

      {/* Tutorial */}
      <AnimatePresence>
        {showTutorial && !showVideoPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowTutorial(false)}
            className="fixed inset-0 flex items-center justify-center z-[10001] bg-black/30 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-[400px] max-w-[90vw] bg-card rounded-2xl p-8 shadow-2xl">
              <p className="text-md font-semibold text-foreground mb-2">Hi, I'm glad you're here.</p>
              <p className="text-sm text-muted-foreground mb-6">Would you like a quick 60-second tour?</p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setShowVideoPlayer(true)} className="w-full">Watch the guide</Button>
                <button onClick={async () => { setShowTutorial(false); await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">Maybe later</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVideoPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[10002] bg-black/40 backdrop-blur-sm">
            <div className="w-[640px] max-w-[95vw] bg-card rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-end mb-4">
                <button onClick={async () => { setShowVideoPlayer(false); setShowTutorial(false); await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any); }}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="w-full rounded-xl overflow-hidden bg-muted" style={{ aspectRatio: "16/9" }}>
                <iframe src={(prefs as any)?.welcome_video_url || "https://www.loom.com/embed/your-video-id"}
                  frameBorder="0" allow="autoplay; fullscreen" allowFullScreen style={{ width: "100%", height: "100%" }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Habit Hours Modal */}
      {selectedHabit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedHabit(null); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl p-6 max-w-md w-full shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">Log Habit Hours</h3>
              <button onClick={() => setSelectedHabit(null)} className="p-1 hover:bg-muted rounded-full transition"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-1 mb-6">
              {habits.map(h => (
                <label key={h.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted cursor-pointer">
                  <input type="radio" name="habit" checked={selectedHabit.id === h.id} onChange={() => setSelectedHabit(h)} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium text-foreground">{h.name}</span>
                </label>
              ))}
              <button onClick={() => { const name = prompt("Enter habit name:"); if (name) createHabit.mutate(name); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted w-full text-left">
                <div className="w-4 h-4 rounded-full border-2 border-border" />
                <span className="text-sm font-medium text-muted-foreground">+ Add Custom Habit</span>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-foreground">Hours this week</label>
              <input type="number" min="0" step="0.5" value={logHours} onChange={(e) => setLogHours(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary bg-background text-foreground" placeholder="0" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSelectedHabit(null); setLogHours(""); }} className="flex-1 px-4 py-3 font-semibold rounded-lg hover:bg-muted transition text-foreground">Cancel</button>
              <button onClick={() => {
                if (logHours && parseFloat(logHours) > 0) {
                  logHabitHours.mutate({ habit_id: selectedHabit.id, hours: parseFloat(logHours), week_start_date: currentWeekStart });
                  setSelectedHabit(null); setLogHours(""); toast.success("Hours logged!");
                }
              }} className="flex-1 px-4 py-3 font-semibold rounded-lg transition bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
            </div>
          </motion.div>
        </div>
      )}
      <AdminReminderWidget />
    </AppShell>
  );
}
