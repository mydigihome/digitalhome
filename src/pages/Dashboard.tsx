import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus, FolderOpen, Calendar, Edit2, X,
  Settings, Mic,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";
import NoteEditor from "@/components/NoteEditor";
import YourDayAgenda from "@/components/YourDayAgenda";
import QuickTodosWidget from "@/components/QuickTodosWidget";
import JournalEntriesList from "@/components/journal/JournalEntriesList";
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
function ProgressRing({ progress, size = 96, strokeWidth = 8, gradientId, color1, color2, children }: {
  progress: number; size?: number; strokeWidth?: number; gradientId: string; color1: string; color2: string; children: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
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
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskEditorOpen, setTaskEditorOpen] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [editingLinks, setEditingLinks] = useState(false);
  const now = useCurrentTime();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

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

  const [everydayLinks, setEverydayLinks] = useState<EverydayLink[]>([
    { id: "1", name: "Email", icon: "📧", url: "mailto:", completed: false },
    { id: "2", name: "Shopify", icon: "🛍️", url: "https://shopify.com", completed: false },
    { id: "3", name: "Status", icon: "📝", url: "#applications", completed: false },
  ]);

  const addNewLink = () => {
    setEverydayLinks([...everydayLinks, {
      id: Date.now().toString(), name: "New", icon: "🔗", url: "#", completed: false,
    }]);
  };

  const updateLink = (id: string, field: string, value: string) => {
    setEverydayLinks(everydayLinks.map(link =>
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const deleteLink = (id: string) => {
    setEverydayLinks(everydayLinks.filter(link => link.id !== id));
  };

  // Stats
  const totalTasks = tasks.length;
  const totalDone = tasks.filter(t => t.status === "done").length;
  const momentumPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const tasksAhead = tasks.filter(t => t.status !== "done").length;

  const projectsWithStats = projects.map((p) => {
    const ptasks = tasks.filter((t) => t.project_id === p.id);
    const done = ptasks.filter((t) => t.status === "done").length;
    const total = ptasks.length;
    return { ...p, done, total, pending: total - done };
  });
  const priorityProjects = [...projectsWithStats]
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 4);

  const hasCover = prefs?.dashboard_cover_type && prefs.dashboard_cover_type !== "none" && prefs.dashboard_cover;
  const coverStyle = hasCover
    ? prefs.dashboard_cover_type === "gradient"
      ? { background: prefs.dashboard_cover! }
      : { backgroundImage: `url(${prefs.dashboard_cover})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, #4fd1c5 0%, #f6ad55 30%, #fefcbf 60%, #e2e8f0 100%)" };

  const greeting = profile?.full_name
    ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${profile.full_name.split(" ")[0]}`
    : "Welcome back";

  const stagger = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } });

  const linkColors: Record<string, string> = {
    "📧": "#3B82F6", "🛍️": "#10B981", "📝": "#F59E0B", "🔗": "#8B5CF6",
  };

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
        <div className="max-w-md mx-auto px-5 pb-32">

          {/* ═══ 1. HERO HEADER ═══ */}
          <motion.div {...stagger(0)} className="relative rounded-3xl overflow-hidden mb-0" style={{ height: "clamp(200px, 30vh, 240px)" }}>
            <div className="absolute inset-0" style={coverStyle} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)" }} />

            {/* Top controls */}
            <div className="absolute top-5 left-5 right-5 flex justify-between z-10">
              <button
                className="h-11 w-11 rounded-full flex items-center justify-center text-xl"
                style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backdropFilter: "blur(10px)" }}
              >
                {prefs?.dashboard_icon || "🏠"}
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="h-11 w-11 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backdropFilter: "blur(10px)" }}
              >
                <Settings className="h-5 w-5" style={{ color: "#1F2937" }} />
              </button>
            </div>

            {/* Greeting */}
            <div className="absolute bottom-6 left-6 right-6 z-[2]">
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                {format(now, "EEEE, MMMM d")}
              </p>
              <h1
                className="text-[32px] sm:text-[40px] leading-[1.2] mt-1"
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

          {/* ═══ 2. MOMENTUM & HABITS (ONE CARD) ═══ */}
          <motion.div {...stagger(1)} className="-mt-10 relative z-[5] mb-6">
            <div className="p-6 rounded-[20px]" style={glassCard}>
              <div className="grid grid-cols-2 gap-4">
                {/* Momentum */}
                <div className="text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.8px] mb-4" style={{ color: "#6366F1" }}>Momentum</p>
                  <ProgressRing progress={momentumPct} gradientId="momentum-grad" color1="#6366F1" color2="#8B5CF6">
                    <span className="text-2xl font-bold" style={{ color: "#1F2937" }}>{momentumPct}%</span>
                  </ProgressRing>
                  <p className="text-sm font-medium mt-3" style={{ color: "#6B7280" }}>Daily Goal</p>
                </div>
                {/* Habits */}
                <div className="text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.8px] mb-4" style={{ color: "#8B5CF6" }}>Habits</p>
                  <ProgressRing progress={Math.min(100, totalDone * 10)} gradientId="habits-grad" color1="#8B5CF6" color2="#EC4899">
                    <span className="text-2xl font-bold" style={{ color: "#1F2937" }}>{totalDone}h</span>
                  </ProgressRing>
                  <p className="text-sm font-medium mt-3" style={{ color: "#6B7280" }}>
                    <span style={{ color: "#F59E0B" }}>🔥</span> {totalDone} days
                  </p>
                </div>
              </div>
              {/* Subtitle inside same card */}
              <div className="mt-6 p-3 rounded-xl text-center" style={{ background: "rgba(99,102,241,0.1)" }}>
                <p className="text-sm font-medium" style={{ color: "#6366F1" }}>
                  🎯 You're on track! {tasksAhead} tasks ahead.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ═══ 3. EVERYDAY LINKS ═══ */}
          <motion.div {...stagger(2)} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "#1F2937" }}>Everyday Links</h2>
              <button onClick={() => setEditingLinks(!editingLinks)} className="p-1.5 rounded-md hover:bg-black/5">
                <Edit2 className="h-4 w-4" style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {everydayLinks.map((link) => {
                const imgSrc = link.image || getFaviconUrl(link.url);
                return (
                  <motion.div key={link.id} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-[6px] flex-shrink-0">
                    {editingLinks ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-[72px] w-[72px] rounded-full bg-white flex items-center justify-center" style={{ border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                          {imgSrc ? <img src={imgSrc} alt="" className="h-6 w-6 object-contain" /> : <span className="text-2xl">{link.icon}</span>}
                        </div>
                        <input value={link.name} onChange={(e) => updateLink(link.id, "name", e.target.value)} className="w-16 text-center text-[10px] bg-transparent outline-none border-b border-dashed border-gray-300" />
                        <button onClick={() => deleteLink(link.id)} className="text-[10px] text-red-400">✕</button>
                      </div>
                    ) : (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-[6px] cursor-pointer">
                        <div className="h-[72px] w-[72px] rounded-full bg-white flex items-center justify-center transition-all" style={{ border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                          {imgSrc ? <img src={imgSrc} alt="" className="h-6 w-6 object-contain" /> : <span className="text-2xl">{link.icon}</span>}
                        </div>
                        <span className="text-[10px] font-semibold uppercase text-center" style={{ color: "#6B7280" }}>{link.name}</span>
                      </a>
                    )}
                  </motion.div>
                );
              })}
              <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }} onClick={addNewLink} className="flex flex-col items-center gap-[6px] flex-shrink-0 cursor-pointer">
                <div className="h-[72px] w-[72px] rounded-full bg-white flex items-center justify-center" style={{ border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <Plus className="h-6 w-6" style={{ color: "#8B5CF6" }} />
                </div>
                <span className="text-[10px] font-semibold uppercase" style={{ color: "#6B7280" }}>New</span>
              </motion.button>
            </div>
          </motion.div>

          {/* ═══ 4. TODAY'S AGENDA ═══ */}
          <motion.div {...stagger(3)} className="mb-6">
            <YourDayAgenda />
          </motion.div>

          {/* ═══ 5. QUICK TO-DOS ═══ */}
          <motion.div {...stagger(4)} className="mb-6">
            <QuickTodosWidget />
          </motion.div>

          {/* ═══ 6. ACTIVE PROJECTS ═══ */}
          <motion.div {...stagger(5)} className="mb-6">
            <div className="p-6 rounded-[20px]" style={glassCard}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: "#1F2937" }}>Active Projects</h2>
                <button onClick={() => navigate("/projects")} className="text-sm font-semibold cursor-pointer hover:underline" style={{ color: "#6366F1" }}>
                  View All
                </button>
              </div>
              {priorityProjects.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <FolderOpen className="mb-2 h-8 w-8" style={{ color: "#D1D5DB" }} />
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>No active projects</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setProjectModalOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Create one
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {priorityProjects.map((project) => {
                    const pct = project.total > 0 ? Math.round((project.done / project.total) * 100) : 0;
                    return (
                      <motion.div
                        key={project.id}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer rounded-2xl p-4 transition-all hover:shadow-md"
                        style={{ background: "white", border: "1px solid #F3F4F6" }}
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3 text-xl"
                          style={{ background: "rgba(99,102,241,0.1)" }}
                        >
                          {project.icon || "📁"}
                        </div>
                        <p className="text-[15px] font-semibold truncate mb-1" style={{ color: "#1F2937" }}>{project.name}</p>
                        <p className="text-xs font-semibold" style={{ color: pct > 50 ? "#10B981" : "#6366F1" }}>{pct}% complete</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* ═══ 7. MONEY REMINDERS ═══ */}
          <motion.div {...stagger(6)} className="mb-6">
            <div className="p-6 rounded-[20px]" style={glassCard}>
              <h2 className="text-lg font-bold mb-5" style={{ color: "#1F2937" }}>Money Reminders</h2>
              <div className="text-center py-6">
                <p className="text-sm" style={{ color: "#9CA3AF" }}>No upcoming bills</p>
              </div>
            </div>
          </motion.div>

          {/* ═══ 8. RECENT JOURNAL ═══ */}
          <motion.div {...stagger(7)} className="mb-6">
            <JournalEntriesList />
          </motion.div>
        </div>

        {/* ═══ 9. FLOATING VOICE BUTTON ═══ */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed z-50 h-16 w-16 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            bottom: "88px",
            right: "24px",
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
            animation: "dashboard-pulse-glow 2s ease-in-out infinite",
          }}
          onClick={() => toast.info("Voice input coming soon!")}
        >
          <Mic className="h-7 w-7 text-white" strokeWidth={2.5} />
        </motion.button>
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
            onClick={() => setShowTutorial(false)}
            className="fixed inset-0 flex items-center justify-center z-[10001]"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
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
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          >
            <div className="w-[640px] max-w-[95vw] bg-card rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-end mb-4">
                <button
                  onClick={async () => { setShowVideoPlayer(false); setShowTutorial(false); await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any); }}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                ><X size={18} className="text-muted-foreground" /></button>
              </div>
              <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: 'hsl(var(--muted))' }}>
                <iframe
                  src={(prefs as any)?.welcome_video_url || 'https://www.loom.com/embed/your-video-id'}
                  frameBorder="0" allow="autoplay; fullscreen" allowFullScreen
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes dashboard-pulse-glow {
          0%, 100% { box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
          50% { box-shadow: 0 12px 40px rgba(99,102,241,0.6), 0 0 0 12px rgba(99,102,241,0.1); }
        }
      `}</style>
    </AppShell>
  );
}
