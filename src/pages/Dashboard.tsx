import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useQuickTodos, useAddQuickTodo, useUpdateQuickTodo, useDeleteQuickTodo } from "@/hooks/useQuickTodos";
import { useHabits, useHabitLogs, useCreateHabit, useLogHabitHours, getCurrentWeekStart } from "@/hooks/useHabits";
import { useTodayEvents } from "@/hooks/useCalendarEvents";
import { useExpenses } from "@/hooks/useExpenses";
import { useBills } from "@/hooks/useBills";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useLoans } from "@/hooks/useLoans";
import { useContacts } from "@/hooks/useContacts";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import TradingViewWidget from "@/components/dashboard/TradingViewWidget";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, isToday } from "date-fns";
import {
  Plus, Edit2, X, TrendingUp, ExternalLink,
  Mail as MailIcon, ShoppingBag, FileText,
  Smile, CloudRain, Heart, Sun, Trash2, GripVertical, Target, UserPlus,
  Receipt, CheckCircle, BookOpen,
} from "lucide-react";
import BrokerSelectionModal from "@/components/wealth/BrokerSelectionModal";
import { TradingPair } from "@/hooks/useTradingPairs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import CreateGoalModal from "@/components/goals/CreateGoalModal";
import TaskEditor from "@/components/TaskEditor";
import NoteEditor from "@/components/NoteEditor";
import MonthlyReviewBanner from "@/components/dashboard/MonthlyReviewBanner";
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
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Maximize2 } from "lucide-react";
import { createPortal } from "react-dom";
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
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative group/drag">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-3 top-3 z-20 w-7 h-7 rounded-md bg-muted/80 backdrop-blur border border-border flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover/drag:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
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


const DEFAULT_LEFT_ORDER = ["networth-projects", "market", "momentum", "links", "studio", "reflections"];
const DEFAULT_RIGHT_ORDER = ["scripture", "reminders", "agenda", "todos", "network"];
import defaultHeroBg from "@/assets/default-dashboard-hero.png";
const HERO_BG = defaultHeroBg;

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
  const { data: finances } = useUserFinances();
  const { data: loans } = useLoans();
  const { data: contacts = [] } = useContacts();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
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
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [isMarketFullscreen, setIsMarketFullscreen] = useState(false);
  const enterFullscreen = () => { setIsMarketFullscreen(true); document.body.style.overflow = "hidden"; };
  const exitFullscreen = () => { setIsMarketFullscreen(false); document.body.style.overflow = ""; };
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drag-and-drop card order — left column
  const [leftOrder, setLeftOrder] = useState<string[]>(() =>
    loadStoredJson<string[]>("dh_left_column_order", DEFAULT_LEFT_ORDER)
  );
  // Drag-and-drop card order — right column
  const [rightOrder, setRightOrder] = useState<string[]>(() =>
    loadStoredJson<string[]>("dh_right_column_order", DEFAULT_RIGHT_ORDER)
  );

  // Load widget order from Supabase on mount (overrides localStorage)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("user_preferences")
        .select("widget_order_left, widget_order_right")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.widget_order_left && Array.isArray(data.widget_order_left)) {
        setLeftOrder(data.widget_order_left);
        saveStoredJson("dh_left_column_order", data.widget_order_left);
      }
      if (data?.widget_order_right && Array.isArray(data.widget_order_right)) {
        setRightOrder(data.widget_order_right);
        saveStoredJson("dh_right_column_order", data.widget_order_right);
      }
    })();
  }, [user]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveWidgetOrderToDb = async (left: string[], right: string[]) => {
    if (!user) return;
    await (supabase as any).from("user_preferences").update({
      widget_order_left: left,
      widget_order_right: right,
    }).eq("user_id", user.id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    if (leftOrder.includes(active.id as string)) {
      setLeftOrder((prev) => {
        const next = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string));
        saveStoredJson("dh_left_column_order", next);
        saveWidgetOrderToDb(next, rightOrder);
        return next;
      });
    } else if (rightOrder.includes(active.id as string)) {
      setRightOrder((prev) => {
        const next = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string));
        saveStoredJson("dh_right_column_order", next);
        saveWidgetOrderToDb(leftOrder, next);
        return next;
      });
    }
  };

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

  const { data: bills = [] } = useBills();
  const moneyReminders = (() => {
    const today = new Date();
    const upcoming = (bills || [])
      .filter(b => {
        if (b.status === 'paid') return false;
        const due = new Date(b.due_date);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);
        return diffDays >= -3 && diffDays <= 14;
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 3)
      .map(b => ({ name: b.merchant, amount: b.amount, dueDate: b.due_date }));
    return upcoming;
  })();

  const { data: journalEntries = [] } = useQuery({
    queryKey: ["recent_journal", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  // Emotion stats for journal card
  const journalEmotionStats = (() => {
    const counts: Record<string, number> = {};
    let total = 0;
    journalEntries.forEach((e: any) => {
      if (e.mood) { counts[e.mood] = (counts[e.mood] || 0) + 1; total++; }
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count, percentage: total ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  })();
  const EMOTION_COLORS_DASH: Record<string, string> = { Happy: "#F59E0B", Sad: "#7C3A2D", Calm: "#6B8F3A", Anxious: "#7B7464", Inspired: "#7B5EA7", Focused: "#10B981" };

  const hasCover = prefs?.dashboard_cover_type === "image" && prefs.dashboard_cover;
  const heroBg = hasCover ? prefs!.dashboard_cover! : HERO_BG;


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
    { key: "goal", label: "Goal", icon: Target, onClick: () => setCreateGoalOpen(true) },
    { key: "contact", label: "Contact", icon: UserPlus, onClick: () => navigate("/relationships") },
    { key: "bill", label: "Bill", icon: Receipt, onClick: () => navigate("/finance/wealth") },
    { key: "todo", label: "Todo", icon: CheckCircle, onClick: scrollToTodos },
    { key: "journal", label: "Journal", icon: BookOpen, onClick: () => navigate("/journal/new") },
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
      case "networth-projects": {
        
        return (
           <SortableCard key={id} id={id}>
            <div className="flex flex-col md:flex-row items-stretch gap-4 w-full">
              <div className="w-full md:w-72 flex-shrink-0 flex flex-col">{compactNetWorth}</div>
              <div className="w-full md:flex-1 min-w-0 flex flex-col">{compactProjects}</div>
            </div>
          </SortableCard>
        );
      }

      case "market":
        return (
          <SortableCard key={id} id={id}>
            <div className="overflow-hidden bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">Market Watch</h2>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> Live
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={enterFullscreen}
                    title="Fullscreen"
                    className="w-7 h-7 flex items-center justify-center rounded-md transition text-muted-foreground hover:bg-success/10 hover:text-success"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setShowBrokerModal(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-primary text-primary-foreground hover:bg-primary/90">
                    Trade
                  </button>
                </div>
              </div>
              <div style={{ height: 500 }}>
                <TradingViewWidget />
              </div>
            </div>
            {isMarketFullscreen && createPortal(
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', flexDirection: 'column' }} className="bg-background">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-foreground">Market Watch</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> Live
                    </span>
                  </div>
                  <button onClick={exitFullscreen} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <TradingViewWidget />
                </div>
              </div>,
              document.body
            )}
          </SortableCard>
        );

      case "momentum": {
        const mobile = window.innerWidth < 768;
        return (
          <SortableCard key={id} id={id}>
            <div className={mobile ? "flex flex-col gap-3" : "flex gap-4"}>
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
      }

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
                <button onClick={() => navigate("/journal/new")} className="text-sm font-medium text-success hover:underline">New Journal Entry</button>
              </div>
              <div className="px-5 pb-5 flex flex-col sm:flex-row gap-5">
                {/* LEFT — Entry list */}
                <div className="flex-1 sm:flex-[0_0_60%]">
                  {(journalEntries.length > 0 ? journalEntries : [
                    { id: "sample1", title: "The Clarity of Morning", created_at: new Date().toISOString(), mood_emoji: "", mood: "Calm" },
                    { id: "sample2", title: "Stormy Decisions", created_at: new Date(Date.now() - 86400000).toISOString(), mood_emoji: "", mood: "Anxious" },
                  ]).slice(0, 3).map((entry: any) => {
                    const entryDate = new Date(entry.created_at);
                    const dateLabel = isToday(entryDate) ? "Today" : format(entryDate, "MMM d");
                    return (
                      <div key={entry.id} className="group py-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition rounded-lg px-2 -mx-2 cursor-pointer"
                        onClick={() => entry.id.startsWith("sample") ? navigate("/journal") : navigate(`/journal/${entry.id}`)}>
                        <span className="text-[11px] font-medium" style={{ color: "#10B981" }}>{dateLabel}</span>
                        <p className="text-sm font-medium text-foreground truncate mt-0.5">{entry.title || "Untitled Entry"}</p>
                        {entry.mood && <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${EMOTION_COLORS_DASH[entry.mood] || "#9CA3AF"}20`, color: EMOTION_COLORS_DASH[entry.mood] || "#9CA3AF" }}>{entry.mood}</span>}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{String(entry.content_preview || "").replace(/<[^>]*>/g, "").substring(0, 80)}</p>
                      </div>
                    );
                  })}
                  <button onClick={() => navigate("/journal")} className="text-xs font-medium text-success hover:underline mt-2 block">View all →</button>
                </div>
                {/* RIGHT — Emotion bars */}
                <div className="sm:flex-[0_0_35%]">
                  {(journalEmotionStats.length > 0 ? journalEmotionStats : [
                    { label: "Calm", percentage: 40 }, { label: "Happy", percentage: 30 }, { label: "Focused", percentage: 20 }, { label: "Sad", percentage: 10 },
                  ]).map(em => (
                    <div key={em.label} style={{ marginBottom: 8 }}>
                      <div style={{ height: 20, background: "var(--muted)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.max(em.percentage, 10)}%`, background: EMOTION_COLORS_DASH[em.label] || "#9CA3AF", borderRadius: 999, transition: "width 600ms ease" }} />
                      </div>
                      <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{em.label}</span>
                    </div>
                  ))}
                </div>
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
        if (!(prefs as any)?.show_scripture_card && localStorage.getItem("dh_scripture") !== "true") return null;
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
            <button onClick={() => navigate("/finance/wealth")} className="w-full text-left p-5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600 hover:from-slate-700 hover:to-slate-600 transition-all cursor-pointer border-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-semibold text-white">Bills & Recurring</h2>
                <ExternalLink className="w-3.5 h-3.5 text-white/40 ml-auto" />
              </div>
              {moneyReminders.length > 0 ? (
                <div className="space-y-0">
                  {moneyReminders.map((bill, idx) => {
                    const due = new Date(bill.dueDate);
                    const diffDays = Math.ceil((due.getTime() - Date.now()) / 86400000);
                    const dueLabel = diffDays < 0 ? "Overdue" : diffDays === 0 ? "Due today" : diffDays === 1 ? "Due tomorrow" : `Due ${format(due, "MMM d")}`;
                    return (
                      <div key={idx} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-white">{bill.name}</p>
                          <p className={`text-xs ${diffDays < 0 ? "text-red-400" : diffDays <= 2 ? "text-amber-400" : "text-white/50"}`}>{dueLabel}</p>
                        </div>
                        <span className="text-base font-bold text-red-400">${bill.amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-white/50 text-center py-4">No upcoming bills</p>
              )}
            </button>
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
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No events today.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect Google or Apple Calendar in{" "}
                    <button onClick={() => navigate("/settings?tab=connections")} className="text-primary font-medium hover:underline">
                      Settings &rarr; Connections
                    </button>{" "}
                    to sync your schedule.
                  </p>
                </div>
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
            style={{ height: window.innerWidth < 768 ? 160 : 220 }}
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
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 sm:gap-5">
              {heroActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.key} onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                    className="flex flex-col items-center gap-1 group/action">
                    <div className="w-10 h-10 sm:w-[52px] sm:h-[52px] rounded-full bg-white flex items-center justify-center transition-transform group-hover/action:scale-110 shadow-md">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#059669" }} strokeWidth={1.8} />
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={leftOrder} strategy={verticalListSortingStrategy}>
                  {leftOrder.map((id) => renderLeftCard(id))}
                </SortableContext>
                <DragOverlay>
                  {activeId && leftOrder.includes(activeId) ? (
                    <div className="opacity-95 scale-[1.005]" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
                      {renderLeftCard(activeId)}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

            {/* RIGHT COLUMN — fixed 320px */}
            <div className="w-full lg:w-[320px] lg:flex-shrink-0 space-y-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={rightOrder} strategy={verticalListSortingStrategy}>
                  {rightOrder.map((id) => renderRightCard(id))}
                </SortableContext>
                <DragOverlay>
                  {activeId && rightOrder.includes(activeId) ? (
                    <div className="opacity-95 scale-[1.005]" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
                      {renderRightCard(activeId)}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      {/* JournalEntryModal removed — now uses /journal route */}
      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onNewGoal={() => setCreateGoalOpen(true)}
        onNewTask={scrollToTodos}
        onNewJournal={() => navigate("/journal/new")}
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
      <CreateGoalModal open={createGoalOpen} onClose={() => setCreateGoalOpen(false)} />
      <NoteEditor open={noteEditorOpen} onClose={() => setNoteEditorOpen(false)} />
      {taskEditorOpen && projects.length > 0 && (
        <TaskEditor projectId={projects[0].id} defaultStatus="backlog" onClose={() => setTaskEditorOpen(false)} />
      )}
      {showBrokerModal && (
        <BrokerSelectionModal
          pair={{ id: "AAPL", user_id: "", symbol: "AAPL", display_name: "Apple Inc.", category: "Stocks", is_active: true, sort_order: 0, created_at: "" } as TradingPair}
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
