import { useState, useEffect } from "react";
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
} from "lucide-react";
import BrokerSelectionModal from "@/components/wealth/BrokerSelectionModal";
import { TradingPair } from "@/hooks/useTradingPairs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";
import NoteEditor from "@/components/NoteEditor";
import QuickActionsRow from "@/components/dashboard/QuickActionsRow";
import NetWorthCard from "@/components/dashboard/NetWorthCard";
import MonthlyReviewBanner from "@/components/dashboard/MonthlyReviewBanner";

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

/* ── Scripture Data ── */
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
  const today = new Date().getDate();
  const verse = verses[today % verses.length];
  return (
    <>
      <p className="text-sm italic leading-relaxed text-foreground/80">{verse.text}</p>
      <p className="text-xs mt-2 text-muted-foreground">— {verse.ref}</p>
    </>
  );
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
  const { data: contacts = [] } = useContacts();
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
  const [selectedStockName, setSelectedStockName] = useState("Apple Inc.");
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[2]);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const { data: quoteData } = useMarketQuote(selectedStock);
  const { data: tsData } = useTimeseries(selectedStock, selectedTimeframe.interval, selectedTimeframe.outputsize);
  const { data: searchResults } = useSymbolSearch(stockSearchQuery);

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
        // Also set founding_member on profiles
        if (user) {
          supabase.from("profiles").update({ founding_member: true }).eq("id", user.id).then(() => {});
          // Insert admin reminders for the admin
          const insertReminders = async () => {
            const { data: adminProfile } = await supabase.from("profiles").select("id").eq("full_name", "").limit(1);
            // Look up admin by email - we'll use a direct approach
            const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("founding_member", true);
            const n = (count || 0);
            const adminUserId = user.id; // reminders go to admin, but we store for now
            // We can't look up by email from client, so reminders are created server-side ideally
            // For now, skip client-side reminder creation - it would be handled by webhook
          };
          insertReminders();
        }
      } else {
        upsertPrefs.mutate({ is_subscribed: true, subscription_type: planParam || "pro" } as any);
      }
      import("canvas-confetti").then((m) => {
        const confetti = m.default;
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      });
      toast.success(planParam === "founding" ? "Welcome, Founding Member! Full access unlocked 🏅" : "You're all set — Pro features unlocked 🎉");
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
    mail: <MailIcon className="w-6 h-6 text-info" strokeWidth={1.5} />,
    store: <ShoppingBag className="w-6 h-6 text-success" strokeWidth={1.5} />,
    status: <FileText className="w-6 h-6 text-warning" strokeWidth={1.5} />,
  };
  const linkBgs: Record<string, string> = {
    mail: "bg-info/10",
    store: "bg-success/10",
    status: "bg-warning/10",
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* MONTHLY REVIEW BANNER — absolute top */}
        <MonthlyReviewBanner />

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
          ) : (() => {
            const bc = (prefs as any)?.banner_color || '#6366F1';
            return <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${bc}15, ${bc}05)` }} />;
          })()}

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-background pointer-events-none" />

          <div className="absolute bottom-10 left-6 sm:left-8 z-10">
            <p className="text-xs font-medium text-white/85">{currentDate}</p>
            <h1
              className="text-[32px] sm:text-[40px] leading-[1.15] mt-0.5 font-semibold text-white"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
            >
              {greeting}
            </h1>
          </div>

          {/* Monthly Review Button — shows last 3 days of month or ?review=1 */}
          {(() => {
            const today = new Date();
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const showReview = today.getDate() >= lastDay - 2 || searchParams.get("review") === "1";
            const alreadyDone = (prefs as any)?.last_review_month === `${format(today, "MMMM yyyy")}`;
            if (!showReview || alreadyDone) return null;
            return (
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/monthly-review"); }}
                className="absolute bottom-10 right-6 sm:right-8 z-20 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-[12px] transition-colors"
                style={{ background: "#6366f1" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#4f46e5")}
                onMouseLeave={e => (e.currentTarget.style.background = "#6366f1")}
              >
                <FileText className="w-4 h-4" />
                Monthly Review
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white/30 animate-ping" />
              </button>
            );
          })()}
        </motion.div>

        {/* ═══ MOBILE LAYOUT (hidden on desktop) ═══ */}
        <div className="lg:hidden max-w-xl mx-auto px-4 pb-28 -mt-8 relative z-10">



          {/* QUICK ACTIONS */}
          <div className="mb-5">
            <QuickActionsRow
              onNewGoal={() => setProjectModalOpen(true)}
              onNewContact={() => navigate("/relationships")}
              onNewBill={() => navigate("/finance/wealth")}
              onNewTodo={() => document.querySelector<HTMLInputElement>('[placeholder="Add a quick note..."]')?.focus()}
              onJournal={() => navigate("/journal?new=true")}
            />
          </div>

          {/* NET WORTH */}
          <div className="mb-4">
            <NetWorthCard />
          </div>

          {/* MOMENTUM & HABITS — vertical centered cards */}
          <motion.div {...stagger(1)} className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-4 text-center bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.8px] mb-2 text-primary">Momentum</p>
              <div className="flex justify-center">
                <ProgressRing progress={momentum} size={80} strokeWidth={7} gradientId="m-grad-m" color1="#6366F1" color2="#8B5CF6">
                  <span className="text-[22px] font-bold text-foreground">{momentum}%</span>
                </ProgressRing>
              </div>
              <p className="text-[10px] font-medium mt-2 text-muted-foreground">Daily Goal</p>
            </div>
            <button
              onClick={() => habits.length > 0 && setSelectedHabit(habits[0])}
              className="p-4 text-center cursor-pointer hover:opacity-90 transition bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.8px] mb-2 text-success">Habits</p>
              <div className="flex justify-center">
                <ProgressRing progress={habitsProgress} size={80} strokeWidth={7} gradientId="h-grad-m" color1="#10B981" color2="#34D399">
                  <span className="text-[22px] font-bold text-foreground">{totalHours}h</span>
                </ProgressRing>
              </div>
              <p className="text-[10px] font-medium mt-2 text-muted-foreground">🔥 {streakDays} days</p>
            </button>
          </motion.div>

          {/* DAILY SCRIPTURE (mobile) */}
          {(prefs as any)?.show_scripture_card && (
            <motion.div {...stagger(2)} className="p-6 mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
              <h3 className="font-bold text-sm mb-4 text-foreground">Daily Scripture</h3>
              <ScriptureContent religion={(prefs as any)?.religion} />
            </motion.div>
          )}

          {/* TODAY'S AGENDA */}
          <motion.div {...stagger(2)} className="p-5 mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-foreground">Today's Agenda</h2>
              <button onClick={() => navigate("/calendar")} className="text-sm font-semibold text-primary">View All</button>
            </div>
            {agendaItems.length > 0 ? (
              <div className="space-y-0">
                {agendaItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 py-3 border-b border-border last:border-b-0">
                    <div className="w-1 rounded-sm flex-shrink-0" style={{ background: item.type === "event" ? "hsl(var(--primary))" : "hsl(var(--success))" }} />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{item.time}</p>
                      <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
                      {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-6 text-muted-foreground">No events today</p>
            )}
          </motion.div>

          {/* QUICK TO-DOS */}
          <motion.div {...stagger(3)} className="p-5 mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-foreground">Quick To-Dos</h2>
              <span className="text-sm font-semibold text-primary">Edit List</span>
            </div>
            <div className="space-y-0">
              {todos.filter(t => !t.completed).slice(0, 3).map(todo => (
                <div key={todo.id} className="flex items-center gap-3 py-2.5">
                  <button
                    onClick={() => updateTodo.mutate({ id: todo.id, completed: true })}
                    className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 flex items-center justify-center transition hover:border-primary"
                  />
                  <span className="text-[15px] text-foreground">{todo.text}</span>
                </div>
              ))}
              {todos.filter(t => t.completed).slice(0, 2).map(todo => (
                <div key={todo.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center bg-primary">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span className="text-[15px] line-through text-muted-foreground">{todo.text}</span>
                </div>
              ))}
              <input
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                placeholder="Add a quick note..."
                className="w-full mt-2 py-2 px-3 text-[13px] bg-transparent outline-none rounded-lg border border-dashed border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </motion.div>

          {/* STOCK / TRADING WIDGET */}
          <motion.div {...stagger(4)} className="mb-4 overflow-hidden bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{selectedStock}</span>
                    <span className="text-xs text-muted-foreground">{selectedStockName}</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-sm font-semibold flex items-center gap-1 mt-0.5 ${priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {priceChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {priceChange >= 0 ? "↑" : "↓"} {Math.abs(priceChange).toFixed(2)} ({priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%)
                  </div>
                </div>
                <div className="relative" data-stock-dropdown>
                  <button onClick={() => setStockDropdownOpen(!stockDropdownOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition bg-muted text-sm font-semibold text-foreground">
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  {stockDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-popover rounded-xl shadow-xl border border-border py-2 z-50">
                      <div className="px-3 pb-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                          <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <input
                            value={stockSearchQuery}
                            onChange={(e) => setStockSearchQuery(e.target.value)}
                            placeholder="Search any symbol..."
                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {stockSearchQuery.length > 0 && searchResults?.length > 0 ? (
                          searchResults.slice(0, 8).map((r: any) => (
                            <button key={r.symbol} onClick={() => { setSelectedStock(r.symbol); setSelectedStockName(r.instrument_name || r.symbol); setStockDropdownOpen(false); setStockSearchQuery(""); }}
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
              </div>
              <div className="flex gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {TIMEFRAMES.map((tf) => (
                  <button key={tf.label} onClick={() => setSelectedTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${selectedTimeframe.label === tf.label ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted bg-secondary'}`}>
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-3 pb-3">
              {chartData.length > 0 ? <LiveChart data={chartData} symbol={selectedStock} /> : <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>}
            </div>
            <div className="px-5 pb-4 flex gap-2">
              <button
                onClick={() => setShowBrokerModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Place Trade
              </button>
              <a href={`https://www.tradingview.com/symbols/${selectedStock}/`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-primary/10 text-primary bg-primary/5">
                TradingView <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>

          {/* ACTIVE PROJECTS */}
          <motion.div {...stagger(5)} className="p-5 mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-foreground">Active Projects</h2>
              <button onClick={() => navigate("/projects")} className="text-sm font-semibold text-primary">View All</button>
            </div>
            {activeProjects.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <p className="text-sm text-muted-foreground">No active projects</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setProjectModalOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Create one</Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeProjects.map((project) => (
                  <button key={project.id} onClick={() => navigate(`/project/${project.id}`)}
                    className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition text-left">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">{project.icon || "📁"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">{project.name}</p>
                      <p className="text-[11px] text-muted-foreground">{project.done}/{project.total} tasks</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{project.percentage}%</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* MONEY REMINDERS */}
          <motion.div {...stagger(6)} className="p-5 mb-4 bg-destructive/5 border border-destructive/20 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-foreground">Money Reminders</h2>
              <button onClick={() => navigate("/finance/wealth")} className="text-sm font-semibold text-primary">Manage</button>
            </div>
            {moneyReminders.length > 0 ? (
              <div className="space-y-0">
                {moneyReminders.map((bill, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-3 border-b border-destructive/10 last:border-b-0">
                    <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center text-lg flex-shrink-0">{bill.icon}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{bill.name}</p></div>
                    <span className="text-base font-bold text-destructive">-${bill.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-6 text-muted-foreground">No recurring expenses</p>
            )}
          </motion.div>

          {/* EVERYDAY LINKS */}
          <motion.div {...stagger(7)} className="p-5 mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
            <h2 className="text-[17px] font-bold mb-4 text-foreground">Everyday Links</h2>
            <div className="grid grid-cols-4 gap-3">
              {everydayLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                  <div className={`w-14 h-14 rounded-full ${linkBgs[link.icon] || "bg-muted"} flex items-center justify-center transition group-hover:shadow-md group-hover:scale-105`}>
                    {linkIcons[link.icon] || <LinkIcon className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground">{link.name}</span>
                </a>
              ))}
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center transition group-hover:border-primary">
                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">New</span>
              </button>
            </div>
          </motion.div>

          {/* RECENT JOURNAL */}
          <motion.div {...stagger(8)} className="p-5 mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-foreground">Recent Journal</h2>
              <button onClick={() => navigate("/journal?new=true")} className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition">+ New Entry</button>
            </div>
            <div className="space-y-3">
              {(journalEntries.length > 0 ? journalEntries : [
                { id: "sample", title: "Untitled Entry", created_at: new Date().toISOString(), content_preview: "Today I finally finished the vision pro design sync and the team loved the new glassmorphic direction..." },
              ]).slice(0, 3).map((entry: any) => {
                const entryDate = new Date(entry.created_at);
                const dateLabel = isToday(entryDate) ? "TODAY" : format(entryDate, "MMM d").toUpperCase();
                return (
                  <button key={entry.id} onClick={() => navigate("/journal")}
                    className="w-full p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition text-left">
                    <p className="text-[15px] font-semibold mb-0.5 text-foreground">{entry.title || "Untitled Entry"}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-2 text-primary">{dateLabel}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {entry.content_preview || "No content yet..."}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>


        </div>

        {/* ═══ DESKTOP LAYOUT (hidden on mobile) ═══ */}
        <div className="hidden lg:block max-w-6xl mx-auto px-4 pb-28 -mt-8 relative z-10">
          <div className="flex gap-6">

            {/* LEFT COLUMN (~65%) */}
            <div className="flex-[2] min-w-0">



              {/* QUICK ACTIONS */}
              <div className="mb-5">
                <QuickActionsRow
                  onNewGoal={() => setProjectModalOpen(true)}
                  onNewContact={() => navigate("/relationships")}
                  onNewBill={() => navigate("/finance/wealth")}
                  onNewTodo={() => document.querySelector<HTMLInputElement>('[placeholder="Add a quick note..."]')?.focus()}
                  onJournal={() => navigate("/journal?new=true")}
                />
              </div>

              {/* NET WORTH */}
              <div className="mb-4">
                <NetWorthCard />
              </div>

              {/* MARKET WATCH */}
              <motion.div {...stagger(1)} className="mb-4 overflow-hidden bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-[17px] font-bold text-foreground">Market Watch</h2>
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                          Live
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{selectedStockName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
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
                              <input
                                value={stockSearchQuery}
                                onChange={(e) => setStockSearchQuery(e.target.value)}
                                placeholder="Search stocks, crypto, forex, indices..."
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                                autoFocus
                              />
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
                      <button
                        onClick={() => setShowBrokerModal(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
                      >
                        Trade
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-3">
                  {chartData.length > 0 ? <LiveChart data={chartData} symbol={selectedStock} /> : <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>}
                </div>
              </motion.div>

              {/* MOMENTUM + HABITS ROW */}
              <motion.div {...stagger(2)} className="flex gap-4 mb-5">
                <div className="flex-1 p-5 flex items-center gap-5 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
                  <ProgressRing progress={momentum} size={72} strokeWidth={6} gradientId="m-grad" color1="#6366F1" color2="#8B5CF6">
                    <div className="flex flex-col items-center">
                      <span className="text-[16px] font-bold text-foreground">{momentum}%</span>
                    </div>
                  </ProgressRing>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">Momentum</p>
                    <p className="text-xs text-muted-foreground">{doneTasks}/{totalTasks} tasks done</p>
                    <p className="text-xs font-semibold mt-0.5 text-primary">{momentum}% Complete</p>
                  </div>
                </div>
                <button
                  onClick={() => habits.length > 0 && setSelectedHabit(habits[0])}
                  className="flex-1 p-4 flex items-center gap-4 cursor-pointer hover:opacity-90 transition bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
                  <ProgressRing progress={habitsProgress} size={68} strokeWidth={6} gradientId="h-grad" color1="#10B981" color2="#34D399">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px]">🔥</span>
                      <span className="text-[14px] font-bold text-foreground">{streakDays}</span>
                    </div>
                  </ProgressRing>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">Habit Tracker</p>
                    <p className="text-xs text-muted-foreground">{habits[0]?.name || "Morning Meditation"}</p>
                    <p className="text-xs font-semibold mt-0.5 text-success">{habitsProgress}% Consistency</p>
                  </div>
                </button>
              </motion.div>

              {/* LINKS — horizontal pills */}
              <motion.div {...stagger(3)} className="flex items-center gap-3 mb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0 text-primary">Links</span>
                {everydayLinks.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:border-primary/30 hover:shadow-sm transition flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full ${linkBgs[link.icon] || "bg-muted"} flex items-center justify-center`}>
                      {linkIcons[link.icon] ? <span className="scale-[0.55]">{linkIcons[link.icon]}</span> : <LinkIcon className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{link.name}</span>
                  </a>
                ))}
                <button className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed border-border hover:border-primary transition flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">New</span>
                </button>
              </motion.div>

              {/* ACTIVE PROJECTS — 3 columns */}
              <motion.div {...stagger(4)} className="mb-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-bold text-foreground">Active Projects</h2>
                  <button onClick={() => navigate("/projects")} className="text-sm font-semibold text-primary">View All</button>
                </div>
                {activeProjects.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
                    <p className="text-sm text-muted-foreground">No active projects</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setProjectModalOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Create one</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {projects.filter(p => !p.archived).slice(0, 3).map((project) => {
                      const pt = tasks.filter(t => t.project_id === project.id);
                      const done = pt.filter(t => t.status === "done").length;
                      const total = pt.length;
                      return (
                        <button key={project.id} onClick={() => navigate(`/project/${project.id}`)}
                          className="p-5 bg-card rounded-[20px] border border-border hover:border-primary/30 hover:shadow-md transition text-left">
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg mb-3"
                            style={{ background: project.color ? `${project.color}20` : "hsl(var(--primary) / 0.1)" }}>
                            {project.icon || "📁"}
                          </div>
                          <p className="text-sm font-bold truncate mb-1 text-foreground">{project.name}</p>
                          <p className="text-xs mb-3 text-muted-foreground">{project.goal || `${done}/${total} tasks`}</p>
                          <div className="flex items-center -space-x-2">
                            <div className="w-7 h-7 rounded-full bg-muted border-2 border-card" />
                            <div className="w-7 h-7 rounded-full bg-muted-foreground/20 border-2 border-card" />
                            {total > 2 && (
                              <div className="w-7 h-7 rounded-full bg-primary border-2 border-card flex items-center justify-center">
                                <span className="text-[9px] font-bold text-primary-foreground">+{total - 2}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* RECENT REFLECTIONS — 3 columns */}
              <motion.div {...stagger(5)} className="mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
                <div className="p-5 pb-0 flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-[17px] font-bold text-foreground">Recent Reflections</h2>
                    <p className="text-xs text-success">Capture your thoughts daily</p>
                  </div>
                  <button onClick={() => navigate("/journal?new=true")} className="text-sm font-semibold text-primary">New Journal Entry</button>
                </div>
                <div className="px-5 pb-5 grid grid-cols-3 gap-3">
                  {(journalEntries.length > 0 ? journalEntries : [
                    { id: "sample1", title: "The Clarity of Morning", created_at: new Date().toISOString(), content_preview: "Woke up feeling incredibly refreshed today. The meditation session really helped clear the fog before starting the major project review...", mood_emoji: "❤️" },
                    { id: "sample2", title: "Stormy Decisions", created_at: new Date(Date.now() - 86400000).toISOString(), content_preview: "Today was challenging. Sometimes the market doesn't go the way you expect, but it's important to stay disciplined with the long-term plan...", mood_emoji: "🌧" },
                    { id: "sample3", title: "Small Wins Matter", created_at: new Date(Date.now() - 172800000).toISOString(), content_preview: "The new design system component was finally approved. It feels good to see the months of effort co...", mood_emoji: "⚙️" },
                  ]).slice(0, 3).map((entry: any) => {
                    const entryDate = new Date(entry.created_at);
                    const dateLabel = isToday(entryDate) ? "TODAY" : format(entryDate, "MMM d, yyyy").toUpperCase();
                    return (
                      <button key={entry.id} onClick={() => navigate("/journal")}
                        className="p-4 bg-card rounded-[16px] border border-border hover:border-primary/30 hover:shadow-md transition text-left relative">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">{dateLabel}</p>
                          <span className="text-lg opacity-40">{entry.mood_emoji || "❤️"}</span>
                        </div>
                        <p className="text-[15px] font-semibold mb-1 text-foreground">
                          {entry.title || "Untitled Entry"}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                          {entry.content_preview || "No content yet..."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

            </div>

            {/* RIGHT COLUMN (~35%) */}
            <div className="flex-1 min-w-[320px] max-w-[380px]">

              {/* DAILY SCRIPTURE (desktop) */}
              {(prefs as any)?.show_scripture_card && (
                <motion.div {...stagger(0)} className="p-5 mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
                  <h3 className="font-bold text-sm mb-3 text-foreground">Daily Scripture</h3>
                  <ScriptureContent religion={(prefs as any)?.religion} />
                </motion.div>
              )}

              {/* MONEY REMINDERS — solid dark card */}
              <motion.div {...stagger(1)} className="p-5 mb-4 rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><span className="text-base">💳</span></div>
                  <h2 className="text-[17px] font-bold text-white">Money Reminders</h2>
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
              </motion.div>

              {/* TODAY'S AGENDA */}
              <motion.div {...stagger(2)} className="p-5 mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-bold text-foreground">Today's Agenda</h2>
                  <button onClick={() => navigate("/calendar")} className="text-sm font-semibold text-primary">View All</button>
                </div>
                {agendaItems.length > 0 ? (
                  <div className="space-y-0">
                    {agendaItems.map((item, idx) => {
                      const accentColors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--destructive))"];
                      return (
                        <div key={idx} className="flex gap-4 py-3 border-b border-border last:border-b-0">
                          <div className="w-1 rounded-sm flex-shrink-0" style={{ background: accentColors[idx % 3] }} />
                          <div>
                            <p className="text-xs font-semibold" style={{ color: accentColors[idx % 3] }}>{item.time}</p>
                            <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
                            {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-0">
                    <div className="flex gap-4 py-3 border-b border-border">
                      <div className="w-1 rounded-sm flex-shrink-0 bg-primary" />
                      <div><p className="text-xs font-semibold text-primary">09:00 - 10:30</p><p className="text-[15px] font-semibold text-foreground">Design Systems Sync</p><p className="text-xs text-muted-foreground">Zoom Call with Team</p></div>
                    </div>
                    <div className="flex gap-4 py-3 border-b border-border">
                      <div className="w-1 rounded-sm flex-shrink-0 bg-success" />
                      <div><p className="text-xs font-semibold text-success">12:00 - 13:00</p><p className="text-[15px] font-semibold text-foreground">Lunch with Sarah</p><p className="text-xs text-muted-foreground">The Green Cafe</p></div>
                    </div>
                    <div className="flex gap-4 py-3">
                      <div className="w-1 rounded-sm flex-shrink-0 bg-destructive" />
                      <div><p className="text-xs font-semibold text-destructive">15:00 - 16:30</p><p className="text-[15px] font-semibold text-foreground">Project Review</p><p className="text-xs text-muted-foreground">Strategy Planning</p></div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* QUICK TO-DOS */}
              <motion.div {...stagger(3)} className="p-5 mb-4 bg-card/70 dark:bg-card/50 backdrop-blur-xl border border-border rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-bold text-foreground">Quick To-Dos</h2>
                  <span className="text-sm font-semibold text-primary">Edit List</span>
                </div>
                <div className="space-y-0">
                  {todos.filter(t => !t.completed).slice(0, 3).map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 py-2.5">
                      <button onClick={() => updateTodo.mutate({ id: todo.id, completed: true })}
                        className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 flex items-center justify-center transition hover:border-primary" />
                      <span className="text-[15px] text-foreground">{todo.text}</span>
                    </div>
                  ))}
                  {todos.filter(t => t.completed).slice(0, 2).map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 py-2.5">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center bg-primary">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      <span className="text-[15px] line-through text-muted-foreground">{todo.text}</span>
                    </div>
                  ))}
                  <input value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                    placeholder="Add a quick note..."
                    className="w-full mt-2 py-2 px-3 text-[13px] bg-transparent outline-none rounded-lg border border-dashed border-border text-foreground placeholder:text-muted-foreground" />
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
      {showBrokerModal && (
        <BrokerSelectionModal
          pair={{ id: selectedStock, user_id: "", symbol: selectedStock, display_name: selectedStockName, category: "Stocks", is_active: true, sort_order: 0, created_at: "" } as TradingPair}
          onClose={() => setShowBrokerModal(false)}
        />
      )}

      {/* Tutorial */}
      <AnimatePresence>
        {showTutorial && !showVideoPlayer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowTutorial(false)}
            className="fixed inset-0 flex items-center justify-center z-[10001] bg-black/30 backdrop-blur-sm"
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
            className="fixed inset-0 flex items-center justify-center z-[10002] bg-black/40 backdrop-blur-sm"
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
              <div className="w-full rounded-xl overflow-hidden bg-muted" style={{ aspectRatio: "16/9" }}>
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
            className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">Log Habit Hours</h3>
              <button onClick={() => setSelectedHabit(null)} className="p-1 hover:bg-muted rounded-full transition">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-1 mb-6">
              {habits.map(h => (
                <label key={h.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted cursor-pointer">
                  <input type="radio" name="habit" checked={selectedHabit.id === h.id} onChange={() => setSelectedHabit(h)} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium text-foreground">{h.name}</span>
                </label>
              ))}
              <button
                onClick={() => { const name = prompt("Enter habit name:"); if (name) createHabit.mutate(name); }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted w-full text-left"
              >
                <div className="w-4 h-4 rounded-full border-2 border-border" />
                <span className="text-sm font-medium text-muted-foreground">+ Add Custom Habit</span>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-foreground">Hours this week</label>
              <input
                type="number" min="0" step="0.5" value={logHours}
                onChange={(e) => setLogHours(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="0"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSelectedHabit(null); setLogHours(""); }} className="flex-1 px-4 py-3 font-semibold rounded-xl hover:bg-muted transition text-foreground">Cancel</button>
              <button
                onClick={() => {
                  if (logHours && parseFloat(logHours) > 0) {
                    logHabitHours.mutate({ habit_id: selectedHabit.id, hours: parseFloat(logHours), week_start_date: currentWeekStart });
                    setSelectedHabit(null);
                    setLogHours("");
                    toast.success("Hours logged!");
                  }
                }}
                className="flex-1 px-4 py-3 font-semibold rounded-xl transition bg-primary text-primary-foreground hover:bg-primary/90"
              >Save</button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
