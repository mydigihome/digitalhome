import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useQuickTodos, useAddQuickTodo, useUpdateQuickTodo, useDeleteQuickTodo } from "@/hooks/useQuickTodos";
import { useHabits, useHabitLogs, useLogHabitHours, getCurrentWeekStart } from "@/hooks/useHabits";
import { useTodayEvents } from "@/hooks/useCalendarEvents";
import { useExpenses } from "@/hooks/useExpenses";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, isToday } from "date-fns";
import { Plus, Edit2, X } from "lucide-react";
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

const glassCard = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.8)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
};

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
});

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
  const addHabitLog = useLogHabitHours();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [editingLinks, setEditingLinks] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const now = useCurrentTime();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Habit tracker modal state
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [habitHours, setHabitHours] = useState("1");

  const addTodo = useAddQuickTodo();
  const updateTodo = useUpdateQuickTodo();
  const deleteTodo = useDeleteQuickTodo();

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
  const streakDays = thisWeekLogs.length;

  const getHabitHours = (habitId: string) => {
    return thisWeekLogs.filter(l => l.habit_id === habitId).reduce((s, l) => s + (l.hours || 0), 0);
  };

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

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    addTodo.mutate({ text: newTodoText.trim(), order: todos.length });
    setNewTodoText("");
  };

  const handleSaveHabitHours = () => {
    if (!selectedHabit || !habitHours) return;
    addHabitLog.mutate({
      habit_id: selectedHabit.id,
      hours: parseFloat(habitHours),
      week_start_date: currentWeekStart,
    });
    setSelectedHabit(null);
    setHabitHours("1");
    toast.success("Hours logged!");
  };

  const colorMap: Record<string, { bg: string; text: string }> = {
    "📧": { bg: "bg-blue-100", text: "text-blue-600" },
    "🛍️": { bg: "bg-green-100", text: "text-green-600" },
    "📝": { bg: "bg-orange-100", text: "text-orange-600" },
    "🔗": { bg: "bg-purple-100", text: "text-purple-600" },
  };

  const svgIcons: Record<string, (cls: string) => React.ReactNode> = {
    "📧": (cls) => <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    "🛍️": (cls) => <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    "📝": (cls) => <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  };

  // Momentum ring math
  const mRadius = 42;
  const mCirc = 2 * Math.PI * mRadius;

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
        {/* Wide on desktop, full on mobile */}
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-32">

          {/* ═══ HERO HEADER — Clickable upload area ═══ */}
          <div className="pt-4">
            <motion.div
              {...stagger(0)}
              className="relative h-44 sm:h-52 mb-12 rounded-3xl overflow-hidden shadow-xl cursor-pointer group"
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

              {/* Upload overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                <div className="text-center">
                  <svg className="w-12 h-12 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-white font-semibold text-sm">Change Cover</p>
                </div>
              </div>

              {/* Gradient blend to white */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-white pointer-events-none" />

              {/* Greeting */}
              <div className="absolute bottom-5 left-5 sm:bottom-6 sm:left-6 z-10">
                <p className="text-xs sm:text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {format(now, "EEEE, MMMM d")}
                </p>
                <h1
                  className="text-[28px] sm:text-[40px] leading-[1.2] mt-1"
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
          </div>

          {/* ═══ MOMENTUM SCORE — Single ring with lightning bolt ═══ */}
          <motion.div {...stagger(1)} className="-mt-6 relative z-[5] mb-6 rounded-[20px] p-6" style={glassCard}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6366F1" }}>
                  MOMENTUM SCORE
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold" style={{ color: "#1F2937" }}>{momentum}%</span>
                  <span className="text-sm" style={{ color: "#6B7280" }}>of daily goal</span>
                </div>
              </div>

              {/* Single progress ring with lightning icon */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="transform -rotate-90 w-20 h-20" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={mRadius} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r={mRadius} fill="none"
                    stroke="url(#momentum-single-grad)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={mCirc}
                    initial={{ strokeDashoffset: mCirc }}
                    animate={{ strokeDashoffset: mCirc - (momentum / 100) * mCirc }}
                    transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <defs>
                    <linearGradient id="momentum-single-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8" style={{ color: "#6366F1" }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Motivational message box */}
            <div className="p-4 rounded-2xl" style={{ background: "rgba(99,102,241,0.08)" }}>
              <p className="text-sm font-medium flex items-center gap-2" style={{ color: "#6366F1" }}>
                <span>🎯</span>
                <span>You're crushing it! {tasksAhead} tasks ahead of schedule.</span>
              </p>
            </div>
          </motion.div>

          {/* ═══ EVERYDAY LINKS ═══ */}
          <motion.div {...stagger(2)} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "#1F2937" }}>Everyday Links</h2>
              <button onClick={() => setEditingLinks(!editingLinks)} className="p-1.5 rounded-md transition-colors hover:bg-black/5">
                <Edit2 className="h-4 w-4" style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {everydayLinks.map((link) => {
                const colors = colorMap[link.icon] || { bg: "bg-gray-100", text: "text-gray-600" };
                const iconFn = svgIcons[link.icon];
                const imgSrc = link.image || getFaviconUrl(link.url);
                return (
                  <motion.div key={link.id} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-[6px] flex-shrink-0">
                    {editingLinks ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                          <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
                            {iconFn ? iconFn(`w-6 h-6 ${colors.text}`) : (imgSrc ? <img src={imgSrc} alt="" className="h-6 w-6 object-contain" /> : <span className="text-2xl">{link.icon}</span>)}
                          </div>
                        </div>
                        <input value={link.name} onChange={(e) => updateLink(link.id, "name", e.target.value)} className="w-16 text-center text-[10px] bg-transparent outline-none border-b border-dashed border-gray-300" />
                        <button onClick={() => deleteLink(link.id)} className="text-[10px] text-red-400">✕</button>
                      </div>
                    ) : (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-[6px] cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                          <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
                            {iconFn ? iconFn(`w-6 h-6 ${colors.text}`) : (imgSrc ? <img src={imgSrc} alt="" className="h-6 w-6 object-contain" /> : <span className="text-2xl">{link.icon}</span>)}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold uppercase text-center" style={{ color: "#6B7280" }}>{link.name}</span>
                      </a>
                    )}
                  </motion.div>
                );
              })}
              <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} onClick={addNewLink} className="flex flex-col items-center gap-[6px] flex-shrink-0 cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase" style={{ color: "#6B7280" }}>New</span>
              </motion.button>
            </div>
          </motion.div>

          {/* ═══ TODAY'S AGENDA ═══ */}
          <motion.div {...stagger(3)} className="mb-6 rounded-[20px] p-6" style={glassCard}>
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
                    <div className="w-1 rounded-sm flex-shrink-0 self-stretch" style={{ background: item.type === "event" ? "#6366F1" : "#10B981" }} />
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
          </motion.div>

          {/* ═══ QUICK TO-DOS — Compact ═══ */}
          <motion.div {...stagger(4)} className="mb-6 rounded-[20px] p-6" style={glassCard}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#1F2937" }}>Quick To-Dos</h2>
            <div className="space-y-1">
              {todos.filter(t => !t.completed).slice(0, 5).map(todo => (
                <div key={todo.id} className="flex items-center gap-2 py-1">
                  <button
                    onClick={() => updateTodo.mutate({ id: todo.id, completed: true })}
                    className="h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all hover:border-indigo-500"
                    style={{ borderColor: "#D1D5DB" }}
                  />
                  <span className="text-sm flex-1" style={{ color: "#1F2937" }}>{todo.text}</span>
                </div>
              ))}
              {todos.filter(t => t.completed).slice(0, 2).map(todo => (
                <div key={todo.id} className="flex items-center gap-2 py-1">
                  <div
                    className="h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span className="text-sm flex-1 line-through" style={{ color: "#9CA3AF" }}>{todo.text}</span>
                </div>
              ))}
              <div className="pt-2">
                <input
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                  placeholder="Add a quick note..."
                  className="w-full py-2 px-3 text-sm bg-transparent outline-none rounded-lg"
                  style={{ border: "1px dashed #D1D5DB", color: "#1F2937" }}
                />
              </div>
            </div>
          </motion.div>

          {/* ═══ ACTIVE PROJECTS ═══ */}
          <motion.div {...stagger(5)} className="mb-6 rounded-[20px] p-6" style={glassCard}>
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
              <div className="grid grid-cols-2 gap-3">
                {activeProjects.map((project, idx) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer rounded-2xl p-4 transition-all hover:shadow-md"
                    style={{ background: "white", border: "1px solid #F3F4F6" }}
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 text-xl ${idx === 0 ? 'bg-indigo-100' : 'bg-green-100'}`}>
                      {project.icon || "📁"}
                    </div>
                    <p className="text-sm font-semibold truncate mb-1" style={{ color: "#1F2937" }}>{project.name}</p>
                    <p className={`text-xs font-semibold ${idx === 0 ? 'text-indigo-600' : 'text-green-600'}`}>{project.percentage}% complete</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ═══ MONEY REMINDERS ═══ */}
          <motion.div {...stagger(6)} className="mb-6 rounded-[20px] p-6 bg-red-50/50 border border-red-100" style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: "#1F2937" }}>Money Reminders</h2>
            {moneyReminders.length > 0 ? (
              <div className="space-y-0">
                {moneyReminders.map((reminder, idx) => (
                  <div key={idx} className="flex justify-between py-4" style={{ borderBottom: idx < moneyReminders.length - 1 ? "1px solid rgba(239,68,68,0.15)" : "none" }}>
                    <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{reminder.name}</span>
                    <span className="text-base font-bold" style={{ color: "#EF4444" }}>${reminder.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No recurring expenses</p>
            )}
          </motion.div>

          {/* ═══ HABIT TRACKER ═══ */}
          <motion.div {...stagger(7)} className="mb-6 rounded-[20px] p-6" style={glassCard}>
            <h2 className="text-lg font-bold mb-5" style={{ color: "#1F2937" }}>Habit Tracker</h2>
            {habits.length > 0 ? (
              <div className="space-y-1">
                {habits.slice(0, 5).map(habit => (
                  <button
                    key={habit.id}
                    onClick={() => { setSelectedHabit(habit); setHabitHours("1"); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition text-left"
                  >
                    <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{habit.name}</span>
                    <span className="text-xs font-semibold" style={{ color: "#10B981" }}>
                      {getHabitHours(habit.id)}h this week
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No habits tracked yet</p>
            )}
          </motion.div>

          {/* ═══ RECENT JOURNAL ═══ */}
          <motion.div {...stagger(8)} className="mb-6 rounded-[20px] p-6" style={glassCard}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "#1F2937" }}>Recent Journal</h2>
              <button onClick={() => navigate("/journal")} className="text-sm font-semibold cursor-pointer hover:underline uppercase tracking-wide" style={{ color: "#6366F1" }}>
                New Entry
              </button>
            </div>
            {recentEntry ? (
              <div className="rounded-2xl p-5 relative" style={{ background: "white", border: "1px solid #F3F4F6" }}>
                {/* Three-dot menu */}
                <button className="absolute top-4 right-4 hover:opacity-70" style={{ color: "#D1D5DB" }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold mb-1 pr-8" style={{ color: "#1F2937" }}>
                  {(recentEntry as any).title || "Untitled Entry"}
                </h3>
                <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>
                  {format(new Date(recentEntry.created_at), "MMM d, yyyy")}
                </p>
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#4B5563" }}>
                  {(recentEntry as any).content_preview || "No content yet..."}
                </p>
              </div>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>
                The page is blank. What's on your mind, {profile?.full_name?.split(" ")[0] || "there"}?
              </p>
            )}
          </motion.div>

        </div>
      </div>

      {/* Modals */}
      <NewProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
      <NoteEditor open={noteEditorOpen} onClose={() => setNoteEditorOpen(false)} />
      {taskEditorOpen && projects.length > 0 && (
        <TaskEditor projectId={projects[0].id} defaultStatus="backlog" onClose={() => setTaskEditorOpen(false)} />
      )}

      {/* Log Habit Hours Modal */}
      <AnimatePresence>
        {selectedHabit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedHabit(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold" style={{ color: "#1F2937" }}>Log Habit Hours</h3>
                <button onClick={() => setSelectedHabit(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 mb-6">
                {habits.map(h => (
                  <label key={h.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="habit"
                      checked={selectedHabit.id === h.id}
                      onChange={() => setSelectedHabit(h)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{h.name}</span>
                    <span className="ml-auto text-xs" style={{ color: "#10B981" }}>{getHabitHours(h.id)}h</span>
                  </label>
                ))}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>Hours this week</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={habitHours}
                  onChange={(e) => setHabitHours(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedHabit(null)}
                  className="flex-1 px-4 py-3 font-semibold rounded-xl hover:bg-gray-100 transition"
                  style={{ color: "#374151" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHabitHours}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </AppShell>
  );
}
