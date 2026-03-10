import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useQuickTodos, useAddQuickTodo, useUpdateQuickTodo, useDeleteQuickTodo } from "@/hooks/useQuickTodos";
import { useHabits, useHabitLogs, useCreateHabit, useLogHabitHours, getCurrentWeekStart } from "@/hooks/useHabits";
import { useTodayEvents } from "@/hooks/useCalendarEvents";
import { useExpenses } from "@/hooks/useExpenses";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useMarketQuote, useTimeseries } from "@/hooks/useMarketData";
import LiveChart, { TIMEFRAMES } from "@/components/wealth/LiveChart";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, isToday } from "date-fns";
import {
  Plus, Edit2, X, ChevronDown, TrendingUp, TrendingDown, ExternalLink,
  Mail as MailIcon, ShoppingBag, FileText, Link as LinkIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";
import NoteEditor from "@/components/NoteEditor";
import "@fontsource/playfair-display/400-italic.css";

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

/* ── Animated SVG Progress Ring ── */
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.3)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderRadius: 24,
};

const stockOptions = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "BTC/USD", name: "Bitcoin" },
  { symbol: "ETH/USD", name: "Ethereum" },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "SPY", name: "S&P 500 ETF" },
];

interface EverydayLink {
  id: string; name: string; icon: string; url: string;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: todos = [] } = useQuickTodos();
  const { data: habits = [] } = useHabits();
  const { data: habitLogs = [] } = useHabitLogs();
  const { data: todayEvents = [] } = useTodayEvents();
  const { data: expenses = [] } = useExpenses();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const navigate = useNavigate();
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

  // Stock
  const [selectedStock, setSelectedStock] = useState("AAPL");
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[2]);
  const { data: quoteData } = useMarketQuote(selectedStock);
  const { data: tsData } = useTimeseries(selectedStock, selectedTimeframe.interval, selectedTimeframe.outputsize);

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
    if (searchParams.get("payment") === "success") {
      upsertPrefs.mutate({ is_subscribed: true, subscription_type: "pro" } as any);
      import("canvas-confetti").then((m) => {
        const confetti = m.default;
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      });
      toast.success("You're all set — Pro features unlocked 🎉");
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

  // Everyday Links (static for now)
  const everydayLinks: EverydayLink[] = [
    { id: "1", name: "Email", icon: "mail", url: "mailto:" },
    { id: "2", name: "Store", icon: "store", url: "https://shopify.com" },
    { id: "3", name: "Status", icon: "status", url: "#applications" },
  ];

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
    .map(e => ({ name: e.description, amount: e.amount, icon: "📱" }));

  const { data: journalEntries = [] } = useQuery({
    queryKey: ["recent_journal", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  const hasCover = prefs?.dashboard_cover_type && prefs.dashboard_cover_type !== "none" && prefs.dashboard_cover;

  const quote = quoteData?.quote;
  const priceChange = quote ? parseFloat(quote.change) : 0;
  const priceChangePercent = quote ? parseFloat(quote.percent_change) : 0;
  const currentPrice = quote ? parseFloat(quote.price) : 0;
  const chartData = tsData?.timeseries || quoteData?.timeseries || [];

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  });

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    addTodo.mutate({ text: newTodoText.trim(), order: todos.length });
    setNewTodoText("");
  };

  const linkIcons: Record<string, React.ReactNode> = {
    mail: <MailIcon className="w-6 h-6 text-blue-600" strokeWidth={1.5} />,
    store: <ShoppingBag className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />,
    status: <FileText className="w-6 h-6 text-amber-600" strokeWidth={1.5} />,
  };
  const linkBgs: Record<string, string> = {
    mail: "bg-blue-100",
    store: "bg-emerald-100",
    status: "bg-amber-100",
  };

  return (
    <AppShell>
      <div className="min-h-screen" style={{ background: "#F8F9FC" }}>

        {/* ═══ HERO HEADER ═══ */}
        <motion.div
          {...stagger(0)}
          className="relative w-full h-72 overflow-hidden cursor-pointer group"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = (e: any) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event: any) => {
                  upsertPrefs.mutate({ dashboard_cover: event.target.result, dashboard_cover_type: "image" });
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }}
        >
          {hasCover ? (
            <img src={prefs!.dashboard_cover!} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/80 via-orange-300/70 to-amber-200/60" />
          )}

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-[#F8F9FC] pointer-events-none" />

          <div className="absolute bottom-10 left-6 sm:left-8 z-10">
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{currentDate}</p>
            <h1
              className="text-[32px] sm:text-[40px] leading-[1.15] mt-0.5"
              style={{
                fontFamily: "'Instrument Serif', 'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "white",
                textShadow: "0 2px 12px rgba(0,0,0,0.3)",
              }}
            >
              {greeting}
            </h1>
          </div>
        </motion.div>

        {/* ═══ MAIN CONTENT ═══ */}
        {/* Mobile: single column max-w-xl | Desktop: 2-column max-w-6xl */}
        <div className="max-w-xl lg:max-w-6xl mx-auto px-4 pb-28 -mt-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:gap-6">

            {/* ═══ LEFT COLUMN (Desktop ~65%) ═══ */}
            <div className="flex-1 lg:flex-[2] min-w-0">

              {/* MARKET WATCH */}
              <motion.div {...stagger(1)} className="mb-4 overflow-hidden" style={glass}>
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-[17px] font-bold" style={{ color: "#1F2937" }}>Market Watch</h2>
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "#10B981" }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Live Index
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>{stockOptions.find(s => s.symbol === selectedStock)?.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: "#1F2937" }}>
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-sm font-semibold flex items-center justify-end gap-1 mt-0.5 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {priceChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}% Today
                      </div>
                    </div>
                  </div>

                  {/* Stock selector + Timeframes */}
                  <div className="flex items-center justify-between">
                    <div className="relative" data-stock-dropdown>
                      <button
                        onClick={() => setStockDropdownOpen(!stockDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-sm font-semibold"
                        style={{ background: "#F3F4F6", color: "#374151" }}
                      >
                        {selectedStock}
                        <ChevronDown className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
                      </button>
                      {stockDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                          {stockOptions.map((stock) => (
                            <button
                              key={stock.symbol}
                              onClick={() => { setSelectedStock(stock.symbol); setStockDropdownOpen(false); }}
                              className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition text-left ${selectedStock === stock.symbol ? 'bg-indigo-50' : ''}`}
                            >
                              <div>
                                <span className="text-sm font-bold" style={{ color: "#1F2937" }}>{stock.symbol}</span>
                                <span className="text-xs ml-2" style={{ color: "#9CA3AF" }}>{stock.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                      {TIMEFRAMES.map((tf) => (
                        <button
                          key={tf.label}
                          onClick={() => setSelectedTimeframe(tf)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                            selectedTimeframe.label === tf.label
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          style={selectedTimeframe.label !== tf.label ? { background: "#F1F5F9" } : undefined}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="px-3 pb-3">
                  {chartData.length > 0 ? (
                    <LiveChart data={chartData} symbol={selectedStock} />
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                      Loading chart...
                    </div>
                  )}
                </div>
              </motion.div>

              {/* MOMENTUM & HABITS — horizontal cards side by side */}
              <motion.div {...stagger(2)} className="grid grid-cols-2 gap-3 mb-5">
                {/* Momentum */}
                <div className="p-4 flex items-center gap-4" style={glass}>
                  <ProgressRing progress={momentum} size={68} strokeWidth={6} gradientId="m-grad" color1="#6366F1" color2="#8B5CF6">
                    <span className="text-[18px] font-bold" style={{ color: "#1F2937" }}>{momentum}%</span>
                  </ProgressRing>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: "#1F2937" }}>Momentum Score</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Based on active tasks</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "#10B981" }}>+5% increase</p>
                  </div>
                </div>

                {/* Habits */}
                <button
                  onClick={() => habits.length > 0 && setSelectedHabit(habits[0])}
                  className="p-4 flex items-center gap-4 cursor-pointer hover:opacity-90 transition"
                  style={glass}
                >
                  <ProgressRing progress={habitsProgress} size={68} strokeWidth={6} gradientId="h-grad" color1="#10B981" color2="#34D399">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px]">🔥</span>
                      <span className="text-[14px] font-bold" style={{ color: "#1F2937" }}>{streakDays}</span>
                    </div>
                  </ProgressRing>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: "#1F2937" }}>Habit Tracker</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{habits[0]?.name || "Morning Meditation"}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "#10B981" }}>{habitsProgress}% Consistency</p>
                  </div>
                </button>
              </motion.div>

              {/* LINKS — horizontal pills */}
              <motion.div {...stagger(3)} className="flex items-center gap-3 mb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "#6366F1" }}>Links</span>
                {everydayLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition flex-shrink-0"
                  >
                    <div className={`w-6 h-6 rounded-full ${linkBgs[link.icon] || "bg-gray-100"} flex items-center justify-center`}>
                      {linkIcons[link.icon] ? <span className="scale-[0.55]">{linkIcons[link.icon]}</span> : <LinkIcon className="w-3 h-3 text-gray-500" />}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "#374151" }}>{link.name}</span>
                  </a>
                ))}
                <button className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-gray-200 hover:border-indigo-300 transition flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>New</span>
                </button>
              </motion.div>

              {/* ACTIVE PROJECTS — 3 columns on desktop */}
              <motion.div {...stagger(4)} className="mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-bold" style={{ color: "#1F2937" }}>Active Projects</h2>
                  <button onClick={() => navigate("/projects")} className="text-sm font-semibold" style={{ color: "#6366F1" }}>
                    View All
                  </button>
                </div>
                {activeProjects.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center" style={glass}>
                    <p className="text-sm" style={{ color: "#9CA3AF" }}>No active projects</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setProjectModalOpen(true)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Create one
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {projects.filter(p => !p.archived).slice(0, 3).map((project) => {
                      const pt = tasks.filter(t => t.project_id === project.id);
                      const done = pt.filter(t => t.status === "done").length;
                      const total = pt.length;
                      return (
                        <button
                          key={project.id}
                          onClick={() => navigate(`/project/${project.id}`)}
                          className="p-5 bg-white rounded-[20px] border border-slate-100 hover:border-indigo-200 hover:shadow-md transition text-left"
                        >
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg mb-3"
                            style={{ background: project.color ? `${project.color}20` : "#EEF2FF" }}
                          >
                            {project.icon || "📁"}
                          </div>
                          <p className="text-sm font-bold truncate mb-1" style={{ color: "#1F2937" }}>{project.name}</p>
                          <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>{project.goal || `${done}/${total} tasks`}</p>
                          <div className="flex items-center -space-x-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white" />
                            <div className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white" />
                            {total > 2 && (
                              <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white">+{total - 2}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* RECENT REFLECTIONS — 3 columns on desktop */}
              <motion.div {...stagger(5)} className="mb-4" style={glass}>
                <div className="p-5 pb-0 flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-[17px] font-bold" style={{ color: "#1F2937" }}>Recent Reflections</h2>
                    <p className="text-xs" style={{ color: "#10B981" }}>Capture your thoughts daily</p>
                  </div>
                  <button onClick={() => navigate("/journal?new=true")} className="text-sm font-semibold" style={{ color: "#6366F1" }}>
                    New Journal Entry
                  </button>
                </div>
                <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {(journalEntries.length > 0 ? journalEntries : [
                    { id: "sample1", title: "The Clarity of Morning", created_at: new Date().toISOString(), content_preview: "Woke up feeling incredibly refreshed today. The meditation session really helped clear the fog before starting the major project review...", mood_emoji: "❤️" },
                    { id: "sample2", title: "Stormy Decisions", created_at: new Date(Date.now() - 86400000).toISOString(), content_preview: "Today was challenging. Sometimes the market doesn't go the way you expect, but it's important to stay disciplined with the long-term plan...", mood_emoji: "🌧" },
                    { id: "sample3", title: "Small Wins Matter", created_at: new Date(Date.now() - 172800000).toISOString(), content_preview: "The new design system component was finally approved. It feels good to see the months of effort co...", mood_emoji: "⚙️" },
                  ]).slice(0, 3).map((entry: any) => {
                    const entryDate = new Date(entry.created_at);
                    const dateLabel = isToday(entryDate) ? "TODAY" : format(entryDate, "MMM d, yyyy").toUpperCase();
                    return (
                      <button
                        key={entry.id}
                        onClick={() => navigate("/journal")}
                        className="p-4 bg-white rounded-[16px] border border-slate-100 hover:border-indigo-200 hover:shadow-md transition text-left relative"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#6366F1" }}>{dateLabel}</p>
                          <span className="text-lg opacity-40">{entry.mood_emoji || "❤️"}</span>
                        </div>
                        <p className="text-[15px] font-semibold mb-1" style={{
                          fontFamily: "'Instrument Serif', 'Playfair Display', Georgia, serif",
                          fontStyle: "italic",
                          color: "#1F2937"
                        }}>{entry.title || "Untitled Entry"}</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#6B7280", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {entry.content_preview || "No content yet..."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

            </div>

            {/* ═══ RIGHT COLUMN (Desktop ~35%) ═══ */}
            <div className="lg:flex-1 lg:min-w-[320px] lg:max-w-[380px]">

              {/* MONEY REMINDERS — solid dark card */}
              <motion.div {...stagger(1)} className="p-5 mb-4 rounded-[20px]" style={{
                background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
                border: "none",
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <span className="text-base">💳</span>
                  </div>
                  <h2 className="text-[17px] font-bold text-white">Money Reminders</h2>
                </div>
                {moneyReminders.length > 0 ? (
                  <div className="space-y-0">
                    {moneyReminders.map((bill, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3" style={{ borderBottom: idx < moneyReminders.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                        <div>
                          <p className="text-sm font-medium text-white">{bill.name}</p>
                          <p className="text-xs text-white/50">Due soon</p>
                        </div>
                        <span className="text-base font-bold" style={{ color: "#EF4444" }}>${bill.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0">
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <div>
                        <p className="text-sm font-medium text-white">Credit Card Due</p>
                        <p className="text-xs text-white/50">March 5th</p>
                      </div>
                      <span className="text-base font-bold" style={{ color: "#EF4444" }}>$1,240.00</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-white">Rent Payment</p>
                        <p className="text-xs text-white/50">March 1st</p>
                      </div>
                      <span className="text-base font-bold" style={{ color: "#EF4444" }}>$2,800.00</span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* TODAY'S AGENDA */}
              <motion.div {...stagger(2)} className="p-5 mb-4" style={glass}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-bold" style={{ color: "#1F2937" }}>Today's Agenda</h2>
                  <button onClick={() => navigate("/calendar")} className="text-sm font-semibold" style={{ color: "#6366F1" }}>
                    View All
                  </button>
                </div>
                {agendaItems.length > 0 ? (
                  <div className="space-y-0">
                    {agendaItems.map((item, idx) => {
                      const colors = ["#6366F1", "#10B981", "#EF4444"];
                      return (
                        <div key={idx} className="flex gap-4 py-3" style={{ borderBottom: idx < agendaItems.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                          <div className="w-1 rounded-sm flex-shrink-0" style={{ background: colors[idx % 3] }} />
                          <div>
                            <p className="text-xs font-semibold" style={{ color: colors[idx % 3] }}>{item.time}</p>
                            <p className="text-[15px] font-semibold" style={{ color: "#1F2937" }}>{item.title}</p>
                            {item.subtitle && <p className="text-xs" style={{ color: "#9CA3AF" }}>{item.subtitle}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-0">
                    <div className="flex gap-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="w-1 rounded-sm flex-shrink-0" style={{ background: "#6366F1" }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#6366F1" }}>09:00 - 10:30</p>
                        <p className="text-[15px] font-semibold" style={{ color: "#1F2937" }}>Design Systems Sync</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Zoom Call with Team</p>
                      </div>
                    </div>
                    <div className="flex gap-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="w-1 rounded-sm flex-shrink-0" style={{ background: "#10B981" }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#10B981" }}>12:00 - 13:00</p>
                        <p className="text-[15px] font-semibold" style={{ color: "#1F2937" }}>Lunch with Sarah</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>The Green Cafe</p>
                      </div>
                    </div>
                    <div className="flex gap-4 py-3">
                      <div className="w-1 rounded-sm flex-shrink-0" style={{ background: "#EF4444" }} />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#EF4444" }}>15:00 - 16:30</p>
                        <p className="text-[15px] font-semibold" style={{ color: "#1F2937" }}>Project Review</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Strategy Planning</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* QUICK TO-DOS */}
              <motion.div {...stagger(3)} className="p-5 mb-4" style={glass}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-bold" style={{ color: "#1F2937" }}>Quick To-Dos</h2>
                  <span className="text-sm font-semibold" style={{ color: "#6366F1" }}>Edit List</span>
                </div>
                <div className="space-y-0">
                  {todos.filter(t => !t.completed).slice(0, 3).map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 py-2.5">
                      <button
                        onClick={() => updateTodo.mutate({ id: todo.id, completed: true })}
                        className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition hover:border-indigo-400"
                        style={{ borderColor: "#D1D5DB" }}
                      />
                      <span className="text-[15px]" style={{ color: "#1F2937" }}>{todo.text}</span>
                    </div>
                  ))}
                  {todos.filter(t => t.completed).slice(0, 2).map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 py-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <span className="text-[15px] line-through" style={{ color: "#9CA3AF" }}>{todo.text}</span>
                    </div>
                  ))}
                  <input
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                    placeholder="Add a quick note..."
                    className="w-full mt-2 py-2 px-3 text-[13px] bg-transparent outline-none rounded-lg"
                    style={{ border: "1px dashed #D1D5DB", color: "#1F2937" }}
                  />
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
      <NoteEditor open={noteEditorOpen} onClose={() => setNoteEditorOpen(false)} />
      {taskEditorOpen && projects.length > 0 && (
        <TaskEditor projectId={projects[0].id} defaultStatus="backlog" onClose={() => setTaskEditorOpen(false)} />
      )}

      {/* Tutorial */}
      <AnimatePresence>
        {showTutorial && !showVideoPlayer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowTutorial(false)}
            className="fixed inset-0 flex items-center justify-center z-[10001]"
            style={{ backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[400px] max-w-[90vw] bg-card rounded-2xl p-8 shadow-2xl"
            >
              <p className="text-md font-semibold text-foreground mb-2">Hi, I'm glad you're here.</p>
              <p className="text-sm text-muted-foreground mb-6">Would you like a quick 60-second tour?</p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setShowVideoPlayer(true)} className="w-full">Watch the guide</Button>
                <button
                  onClick={async () => { setShowTutorial(false); await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >Maybe later</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVideoPlayer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[10002]"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          >
            <div className="w-[640px] max-w-[95vw] bg-card rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-end mb-4">
                <button
                  onClick={async () => { setShowVideoPlayer(false); setShowTutorial(false); await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any); }}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", backgroundColor: "hsl(var(--muted))" }}>
                <iframe
                  src={(prefs as any)?.welcome_video_url || "https://www.loom.com/embed/your-video-id"}
                  frameBorder="0" allow="autoplay; fullscreen" allowFullScreen
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Habit Hours Modal */}
      {selectedHabit && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedHabit(null); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{ color: "#1F2937" }}>Log Habit Hours</h3>
              <button onClick={() => setSelectedHabit(null)} className="p-1 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5" style={{ color: "#9CA3AF" }} />
              </button>
            </div>
            <div className="space-y-1 mb-6">
              {habits.map(h => (
                <label key={h.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="habit" checked={selectedHabit.id === h.id} onChange={() => setSelectedHabit(h)} className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{h.name}</span>
                </label>
              ))}
              <button
                onClick={() => { const name = prompt("Enter habit name:"); if (name) createHabit.mutate(name); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 w-full text-left"
              >
                <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: "#D1D5DB" }} />
                <span className="text-sm font-medium" style={{ color: "#9CA3AF" }}>+ Add Custom Habit</span>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>Hours this week</label>
              <input
                type="number" min="0" step="0.5" value={logHours}
                onChange={(e) => setLogHours(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ borderColor: "#D1D5DB" }}
                placeholder="0"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSelectedHabit(null); setLogHours(""); }} className="flex-1 px-4 py-3 font-semibold rounded-xl hover:bg-gray-100 transition" style={{ color: "#374151" }}>Cancel</button>
              <button
                onClick={() => {
                  if (logHours && parseFloat(logHours) > 0) {
                    logHabitHours.mutate({ habit_id: selectedHabit.id, hours: parseFloat(logHours), week_start_date: currentWeekStart });
                    setSelectedHabit(null);
                    setLogHours("");
                    toast.success("Hours logged!");
                  }
                }}
                className="flex-1 px-4 py-3 text-white font-semibold rounded-xl transition"
                style={{ background: "#6366F1" }}
              >Save</button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
