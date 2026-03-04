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
  Plus, Edit2, X, ChevronDown, TrendingUp, TrendingDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";
import NoteEditor from "@/components/NoteEditor";
import "@fontsource/playfair-display/400-italic.css";

interface EverydayLink {
  id: string;
  name: string;
  icon: string;
  url: string;
  completed: boolean;
  image?: string;
}

function getFaviconUrl(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (parsed.protocol === "mailto:") return null;
    if (parsed.hostname === "" || parsed.hash) return null;
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return null;
  }
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
function ProgressRing({ progress, size = 100, strokeWidth = 8, gradientId, color1, color2, children }: {
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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`${color1}26`} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={`url(#${gradientId})`} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const glassCard = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.8)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
};

const stockOptions = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "BTC/USD", name: "Bitcoin" },
  { symbol: "ETH/USD", name: "Ethereum" },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "SPY", name: "S&P 500 ETF" },
];

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
  const [editingLinks, setEditingLinks] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [logHours, setLogHours] = useState("");
  const now = useCurrentTime();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Stock chart state
  const [selectedStock, setSelectedStock] = useState("AAPL");
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[2]); // 1M default

  const { data: quoteData } = useMarketQuote(selectedStock);
  const { data: tsData } = useTimeseries(selectedStock, selectedTimeframe.interval, selectedTimeframe.outputsize);

  // Close stock dropdown on outside click
  useEffect(() => {
    if (!stockDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-stock-dropdown]")) {
        setStockDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [stockDropdownOpen]);

  const addTodo = useAddQuickTodo();
  const updateTodo = useUpdateQuickTodo();
  const deleteTodo = useDeleteQuickTodo();
  const createHabit = useCreateHabit();
  const logHabitHours = useLogHabitHours();

  // Handle payment success
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      upsertPrefs.mutate({ is_subscribed: true, subscription_type: "pro" } as any);
      import("canvas-confetti").then((confettiModule) => {
        const confetti = confettiModule.default;
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } }), 300);
      });
      toast.success("You're all set — Pro features unlocked 🎉");
      setSearchParams({}, { replace: true });
    }
  }, []);

  // Tutorial modal
  useEffect(() => {
    if (prefs && (prefs as any).welcome_video_watched === false) {
      const timer = setTimeout(() => setShowTutorial(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [prefs]);

  // Everyday Links
  const [everydayLinks, setEverydayLinks] = useState<EverydayLink[]>([
    { id: "1", name: "Email", icon: "📧", url: "mailto:", completed: false },
    { id: "2", name: "Shopify", icon: "🛍️", url: "https://shopify.com", completed: false },
    { id: "3", name: "Status", icon: "📝", url: "#applications", completed: false },
  ]);
  const addNewLink = () => {
    setEverydayLinks([...everydayLinks, { id: Date.now().toString(), name: "New", icon: "🔗", url: "#", completed: false }]);
  };
  const updateLink = (id: string, field: string, value: string) => {
    setEverydayLinks(everydayLinks.map(link => link.id === id ? { ...link, [field]: value } : link));
  };
  const deleteLink = (id: string) => {
    setEverydayLinks(everydayLinks.filter(link => link.id !== id));
  };

  // Momentum calculation
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "done").length;
  const momentum = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const tasksAhead = tasks.filter(t => t.status !== "done").length;

  // Habits calculation
  const currentWeekStart = getCurrentWeekStart();
  const thisWeekLogs = (habitLogs || []).filter(log => log.week_start_date === currentWeekStart);
  const totalHours = thisWeekLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
  const habitsProgress = habits.length > 0 ? Math.min(100, Math.round((totalHours / Math.max(1, habits.length * 7)) * 100)) : 0;
  const streakDays = thisWeekLogs.length;

  // Active projects with progress
  const activeProjects = projects
    .filter(p => !p.archived)
    .map(p => {
      const projectTasks = tasks.filter(t => t.project_id === p.id);
      const done = projectTasks.filter(t => t.status === "done").length;
      const total = projectTasks.length;
      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
      return { ...p, percentage, total, done };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 2);

  // Agenda items
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
        time: t.due_date ? format(new Date(t.due_date), "h:mm a") : "No time",
        title: t.title,
        subtitle: t.description || "",
        type: "task" as const,
      })),
  ].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 5);

  // Money reminders from expenses
  const moneyReminders = (expenses || [])
    .filter(e => e.frequency && e.frequency !== "once")
    .slice(0, 3)
    .map(e => ({ name: e.description, amount: e.amount }));

  // Recent journal entry
  const { data: journalEntries = [] } = useQuery({
    queryKey: ["recent_journal", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      return data || [];
    },
    enabled: !!user,
  });
  const recentEntry = journalEntries[0];

  // Cover
  const hasCover = prefs?.dashboard_cover_type && prefs.dashboard_cover_type !== "none" && prefs.dashboard_cover;
  const coverStyle = hasCover
    ? prefs.dashboard_cover_type === "gradient"
      ? { background: prefs.dashboard_cover! }
      : { backgroundImage: `url(${prefs.dashboard_cover})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, #4fd1c5 0%, #f6ad55 30%, #fefcbf 60%, #e2e8f0 100%)" };

  // Greeting
  const hour = new Date().getHours();
  const greeting = profile?.full_name
    ? `Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, ${profile.full_name.split(" ")[0]}`
    : "Welcome back";

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  });

  const linkColors: Record<string, string> = {
    "📧": "#3B82F6", "🛍️": "#10B981", "📝": "#F59E0B", "🔗": "#8B5CF6",
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    addTodo.mutate({ text: newTodoText.trim(), order: todos.length });
    setNewTodoText("");
  };

  const quote = quoteData?.quote;
  const priceChange = quote ? parseFloat(quote.change) : 0;
  const priceChangePercent = quote ? parseFloat(quote.percent_change) : 0;
  const currentPrice = quote ? parseFloat(quote.price) : 0;
  const chartData = tsData?.timeseries || quoteData?.timeseries || [];

  return (
    <AppShell>
      <div
        className="min-h-screen"
        style={{
          background: `
            radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 100% 0%, rgba(251, 146, 60, 0.05) 0%, transparent 50%),
            #F9FAFB
          `,
        }}
      >
        {/* ═══ HERO HEADER — Full-bleed ═══ */}
        <motion.div
          {...stagger(0)}
          className="relative w-full h-52 sm:h-64 lg:h-80 overflow-hidden cursor-pointer group"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event: any) => {
                  upsertPrefs.mutate({
                    dashboard_cover: event.target.result,
                    dashboard_cover_type: 'image'
                  });
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

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-[#F9FAFB] pointer-events-none" />

          <div className="absolute bottom-12 left-8 lg:left-12 z-10">
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
              {format(now, "EEEE, MMMM d")}
            </p>
            <h1
              className="text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.15] mt-0.5"
              style={{
                fontFamily: "'Playfair Display', serif",
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

        {/* ═══ MOMENTUM & HABITS — overlapping hero ═══ */}
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 -mt-10 relative z-[5] mb-6">
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto sm:max-w-sm lg:max-w-md">
            {/* Momentum Card */}
            <motion.div {...stagger(1)} className="rounded-2xl p-3 lg:p-5 text-center" style={glassCard}>
              <p className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.8px] mb-1.5 lg:mb-3" style={{ color: "#6366F1" }}>Momentum</p>
              <div className="flex justify-center">
                <div className="lg:hidden">
                  <ProgressRing progress={momentum} size={68} strokeWidth={6} gradientId="momentum-grad" color1="#6366F1" color2="#8B5CF6">
                    <span className="text-[20px] font-bold" style={{ color: "#1F2937" }}>{momentum}%</span>
                  </ProgressRing>
                </div>
                <div className="hidden lg:block">
                  <ProgressRing progress={momentum} size={100} strokeWidth={8} gradientId="momentum-grad-lg" color1="#6366F1" color2="#8B5CF6">
                    <span className="text-[28px] font-bold" style={{ color: "#1F2937" }}>{momentum}%</span>
                  </ProgressRing>
                </div>
              </div>
              <p className="text-[10px] lg:text-xs font-medium mt-1.5 lg:mt-3" style={{ color: "#6B7280" }}>Daily Goal</p>
            </motion.div>

            {/* Habits Card */}
            <motion.div {...stagger(1.5)} className="rounded-2xl p-3 lg:p-5 text-center" style={glassCard}>
              <p className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.8px] mb-1.5 lg:mb-3" style={{ color: "#10B981" }}>Habits</p>
              <button onClick={() => habits.length > 0 && setSelectedHabit(habits[0])} className="flex justify-center mx-auto hover:opacity-80 transition">
                <div className="lg:hidden">
                  <ProgressRing progress={habitsProgress} size={68} strokeWidth={6} gradientId="habits-grad" color1="#10B981" color2="#34D399">
                    <span className="text-[20px] font-bold" style={{ color: "#1F2937" }}>{totalHours}h</span>
                  </ProgressRing>
                </div>
                <div className="hidden lg:block">
                  <ProgressRing progress={habitsProgress} size={100} strokeWidth={8} gradientId="habits-grad-lg" color1="#10B981" color2="#34D399">
                    <span className="text-[28px] font-bold" style={{ color: "#1F2937" }}>{totalHours}h</span>
                  </ProgressRing>
                </div>
              </button>
              <p className="text-[10px] lg:text-xs font-medium mt-1.5 lg:mt-3" style={{ color: "#6B7280" }}>🔥 {streakDays} days</p>
            </motion.div>
          </div>

          {tasksAhead > 0 && (
            <div className="mt-3 text-[12px] font-medium py-2 px-3 rounded-xl text-center max-w-md mx-auto" style={{ color: "#6366F1", background: "rgba(99,102,241,0.08)" }}>
              🎯 You're on track! {tasksAhead} tasks ahead.
            </div>
          )}
        </div>

        {/* ═══ MAIN DASHBOARD GRID ═══ */}
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 pb-24">
          <div className="grid grid-cols-12 gap-6">

            {/* ═══ ROW 1: STOCK CHART — full width ═══ */}
            <motion.div {...stagger(2)} className="col-span-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Stock selector */}
                <div className="relative" data-stock-dropdown>
                  <button
                    onClick={() => setStockDropdownOpen(!stockDropdownOpen)}
                    className="flex items-center gap-3 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{selectedStock}</span>
                      <span className="text-xs text-gray-500">{stockOptions.find(s => s.symbol === selectedStock)?.name}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {stockDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      {stockOptions.map((stock) => (
                        <button
                          key={stock.symbol}
                          onClick={() => { setSelectedStock(stock.symbol); setStockDropdownOpen(false); }}
                          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition ${selectedStock === stock.symbol ? 'bg-indigo-50' : ''}`}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-bold text-gray-900">{stock.symbol}</span>
                            <span className="text-xs text-gray-500">{stock.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price + controls */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  {/* Current price */}
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-sm font-semibold flex items-center gap-1 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                    </div>
                  </div>

                  {/* Timeframe selector */}
                  <div className="flex gap-1">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf.label}
                        onClick={() => setSelectedTimeframe(tf)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                          selectedTimeframe.label === tf.label
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>

                  {/* Open in Webull */}
                  <a
                    href={`https://app.webull.com/stocks/${selectedStock}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
                  >
                    Open in Webull →
                  </a>
                </div>
              </div>

              {/* Chart */}
              <div className="p-4 sm:p-6">
                {chartData.length > 0 ? (
                  <LiveChart data={chartData} symbol={selectedStock} />
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-400 text-sm">
                    Loading chart data...
                  </div>
                )}
              </div>
            </motion.div>

            {/* ═══ ROW 2: EVERYDAY LINKS + TODAY'S AGENDA ═══ */}
            <motion.div {...stagger(3)} className="col-span-12 lg:col-span-6">
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold" style={{ color: "#1F2937" }}>Everyday Links</h2>
                  <button onClick={() => setEditingLinks(!editingLinks)} className="p-1.5 rounded-md transition-colors hover:bg-black/5">
                    <Edit2 className="h-4 w-4" style={{ color: "#6B7280" }} />
                  </button>
                </div>
                <div className="flex justify-between pb-2" style={{ scrollbarWidth: "none" }}>
                  {everydayLinks.map((link) => {
                    const colorMap: Record<string, { bg: string; text: string }> = {
                      "📧": { bg: "bg-blue-100", text: "text-blue-600" },
                      "🛍️": { bg: "bg-green-100", text: "text-green-600" },
                      "📝": { bg: "bg-orange-100", text: "text-orange-600" },
                      "🔗": { bg: "bg-purple-100", text: "text-purple-600" },
                    };
                    const colors = colorMap[link.icon] || { bg: "bg-gray-100", text: "text-gray-600" };
                    const svgIcons: Record<string, React.ReactNode> = {
                      "📧": <svg className={`w-6 h-6 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                      "🛍️": <svg className={`w-6 h-6 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
                      "📝": <svg className={`w-6 h-6 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                    };
                    const imgSrc = link.image || getFaviconUrl(link.url);
                    return (
                      <motion.div key={link.id} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-[6px] flex-1 min-w-0">
                        {editingLinks ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                              <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
                                {svgIcons[link.icon] || (imgSrc ? <img src={imgSrc} alt="" className="h-6 w-6 object-contain" /> : <span className="text-2xl">{link.icon}</span>)}
                              </div>
                            </div>
                            <input value={link.name} onChange={(e) => updateLink(link.id, "name", e.target.value)} className="w-16 text-center text-[10px] bg-transparent outline-none border-b border-dashed border-gray-300" />
                            <button onClick={() => deleteLink(link.id)} className="text-[10px] text-red-400">✕</button>
                          </div>
                        ) : (
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-[6px] cursor-pointer">
                            <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                              <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
                                {svgIcons[link.icon] || (imgSrc ? <img src={imgSrc} alt="" className="h-6 w-6 object-contain" /> : <span className="text-2xl">{link.icon}</span>)}
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold uppercase text-center" style={{ color: "#6B7280" }}>{link.name}</span>
                          </a>
                        )}
                      </motion.div>
                    );
                  })}
                  <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} onClick={addNewLink} className="flex flex-col items-center gap-[6px] flex-1 min-w-0 cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase" style={{ color: "#6B7280" }}>New</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <motion.div {...stagger(3.5)} className="col-span-12 lg:col-span-6">
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold" style={{ color: "#1F2937" }}>Today's Agenda</h2>
                  <button onClick={() => navigate("/calendar")} className="text-sm font-semibold cursor-pointer hover:underline" style={{ color: "#6366F1" }}>
                    View All
                  </button>
                </div>
                {agendaItems.length > 0 ? (
                  <div className="space-y-0">
                    {agendaItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4 py-4" style={{ borderBottom: idx < agendaItems.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                        <div className="w-1 rounded-sm flex-shrink-0" style={{ background: item.type === "event" ? "#6366F1" : "#10B981" }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#6B7280" }}>{item.time}</p>
                          <p className="text-base font-semibold" style={{ color: "#1F2937" }}>{item.title}</p>
                          {item.subtitle && <p className="text-[13px]" style={{ color: "#9CA3AF" }}>{item.subtitle}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>No events today</p>
                )}
              </div>
            </motion.div>

            {/* ═══ ROW 3: TODOS + PROJECTS + MONEY ═══ */}
            <motion.div {...stagger(4)} className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="rounded-2xl p-5" style={glassCard}>
                <h2 className="text-lg font-bold mb-5" style={{ color: "#1F2937" }}>Quick To-Dos</h2>
                <div className="space-y-0">
                  {todos.filter(t => !t.completed).slice(0, 5).map(todo => (
                    <div key={todo.id} className="flex items-center gap-2.5 py-2">
                      <button
                        onClick={() => updateTodo.mutate({ id: todo.id, completed: true })}
                        className="h-[18px] w-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                        style={{ borderColor: "#D1D5DB" }}
                      />
                      <span className="text-sm flex-1" style={{ color: "#1F2937" }}>{todo.text}</span>
                    </div>
                  ))}
                  {todos.filter(t => t.completed).slice(0, 3).map(todo => (
                    <div key={todo.id} className="flex items-center gap-2.5 py-2">
                      <div
                        className="h-[18px] w-[18px] rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                      >
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <span className="text-sm flex-1 line-through" style={{ color: "#9CA3AF" }}>{todo.text}</span>
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
              </div>
            </motion.div>

            <motion.div {...stagger(5)} className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold" style={{ color: "#1F2937" }}>Active Projects</h2>
                  <button onClick={() => navigate("/projects")} className="text-sm font-semibold cursor-pointer hover:underline" style={{ color: "#6366F1" }}>
                    View All
                  </button>
                </div>
                {activeProjects.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <p className="text-sm" style={{ color: "#9CA3AF" }}>No active projects</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setProjectModalOpen(true)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Create one
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeProjects.map((project, idx) => (
                      <motion.div
                        key={project.id}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer rounded-xl p-3 flex items-center gap-3 transition-all hover:shadow-md"
                        style={{ background: "white", border: "1px solid #F3F4F6" }}
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${idx === 0 ? 'bg-indigo-100' : 'bg-green-100'}`}>
                          {project.icon || "📁"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#1F2937" }}>{project.name}</p>
                          <p className={`text-[11px] font-semibold ${idx === 0 ? 'text-indigo-600' : 'text-green-600'}`}>{project.percentage}% complete</p>
                        </div>
                        <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#D1D5DB" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div {...stagger(6)} className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="rounded-2xl p-5 bg-red-50/50 border border-red-100" style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}>
                <h2 className="text-lg font-bold mb-5" style={{ color: "#1F2937" }}>Money Reminders</h2>
                {moneyReminders.length > 0 ? (
                  <div className="space-y-0">
                    {moneyReminders.map((reminder, idx) => (
                      <div key={idx} className="flex justify-between py-4" style={{ borderBottom: idx < moneyReminders.length - 1 ? "1px solid rgba(239,68,68,0.15)" : "none" }}>
                        <span className="text-[15px] font-medium" style={{ color: "#1F2937" }}>{reminder.name}</span>
                        <span className="text-base font-bold" style={{ color: "#EF4444" }}>${reminder.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No recurring expenses</p>
                )}
              </div>
            </motion.div>

            {/* ═══ ROW 4: HABIT TRACKER + JOURNAL ═══ */}
            <motion.div {...stagger(7)} className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="rounded-2xl p-5" style={glassCard}>
                <h2 className="text-lg font-bold mb-5" style={{ color: "#1F2937" }}>Habit Tracker</h2>
                <div className="space-y-1">
                  {habits.slice(0, 4).map(habit => {
                    const habitHours = (habitLogs || [])
                      .filter(log => log.habit_id === habit.id && log.week_start_date === currentWeekStart)
                      .reduce((sum, log) => sum + (log.hours || 0), 0);
                    return (
                      <button
                        key={habit.id}
                        onClick={() => setSelectedHabit(habit)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition text-left"
                      >
                        <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{habit.name}</span>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>{habitHours}h this week</span>
                      </button>
                    );
                  })}
                  {habits.length === 0 && (
                    <button
                      onClick={() => {
                        const name = prompt('Enter habit name:');
                        if (name) createHabit.mutate(name);
                      }}
                      className="w-full text-sm text-center py-6 hover:bg-gray-50 rounded-xl transition"
                      style={{ color: "#9CA3AF" }}
                    >
                      + Add your first habit
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div {...stagger(8)} className="col-span-12 md:col-span-6 lg:col-span-8">
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => navigate('/journal')}
                    className="text-lg font-bold hover:opacity-70 transition"
                    style={{ color: "#1F2937" }}
                  >
                    Recent Journal
                  </button>
                  <button onClick={() => navigate("/journal?new=true")} className="text-sm font-bold cursor-pointer hover:underline" style={{ color: "#6366F1" }}>
                    New Entry
                  </button>
                </div>
                {recentEntry ? (
                  <button
                    onClick={() => navigate('/journal')}
                    className="w-full relative rounded-2xl p-5 text-left hover:shadow-md transition"
                    style={{ background: "white", border: "1px solid #F3F4F6" }}
                  >
                    <div className="absolute top-4 right-4 p-1">
                      <svg className="w-4 h-4" style={{ color: "#D1D5DB" }} fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
                      </svg>
                    </div>
                    <p className="text-[17px] font-semibold mb-1 pr-8" style={{ color: "#1F2937" }}>
                      {(recentEntry as any).title || "Untitled Entry"}
                    </p>
                    <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>
                      {format(new Date(recentEntry.created_at), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#4B5563", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {(recentEntry as any).content_preview || "No content yet..."}
                    </p>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/journal?new=true')}
                    className="w-full relative rounded-2xl p-5 text-left hover:shadow-md transition"
                    style={{ background: "white", border: "1px solid #F3F4F6" }}
                  >
                    <p className="text-[17px] font-semibold mb-1" style={{ color: "#1F2937" }}>Untitled Entry</p>
                    <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>{format(new Date(), "MMM d, yyyy")}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>
                      Today I finally finished the vision pro design sync and the team loved the new glassmorphic direction...
                    </p>
                  </button>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => navigate('/journal')}
                    className="text-xs flex items-center gap-1 transition hover:opacity-70"
                    style={{ color: "#9CA3AF" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    <span>View all entries</span>
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Modals */}
      <NewProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
      <NoteEditor open={noteEditorOpen} onClose={() => setNoteEditorOpen(false)} />
      {taskEditorOpen && projects.length > 0 && (
        <TaskEditor projectId={projects[0].id} defaultStatus="backlog" onClose={() => setTaskEditorOpen(false)} />
      )}

      {/* Tutorial prompt modal */}
      <AnimatePresence>
        {showTutorial && !showVideoPlayer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
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

      {/* Video player modal */}
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
                  <input
                    type="radio" name="habit"
                    checked={selectedHabit.id === h.id}
                    onChange={() => setSelectedHabit(h)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{h.name}</span>
                </label>
              ))}
              <button
                onClick={() => {
                  const name = prompt('Enter habit name:');
                  if (name) createHabit.mutate(name);
                }}
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
              <button
                onClick={() => { setSelectedHabit(null); setLogHours(''); }}
                className="flex-1 px-4 py-3 font-semibold rounded-xl hover:bg-gray-100 transition"
                style={{ color: "#374151" }}
              >Cancel</button>
              <button
                onClick={() => {
                  if (logHours && parseFloat(logHours) > 0) {
                    logHabitHours.mutate({
                      habit_id: selectedHabit.id,
                      hours: parseFloat(logHours),
                      week_start_date: currentWeekStart,
                    });
                    setSelectedHabit(null);
                    setLogHours('');
                    toast.success('Hours logged!');
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
