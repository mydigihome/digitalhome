import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useHabitLogs, useAllHabitLogs, getCurrentWeekStart } from "@/hooks/useHabits";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus, FolderOpen, Calendar, Clock, ExternalLink,
  Sparkles, Edit2, Check, ImageIcon, StickyNote, X,
  TrendingUp, CheckCircle2, ListTodo, Target, Settings, Mic,
  Zap, Heart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";

import NotesWidget from "@/components/NotesWidget";
import NoteEditor from "@/components/NoteEditor";
import BrainDumpWidget from "@/components/BrainDumpWidget";
import HabitTrackerWidget from "@/components/HabitTrackerWidget";
import YourDayAgenda from "@/components/YourDayAgenda";
import QuickTodosWidget from "@/components/QuickTodosWidget";
import NinetyDayGoalWidget from "@/components/NinetyDayGoalWidget";
import { cn } from "@/lib/utils";
import JournalEntriesList from "@/components/journal/JournalEntriesList";

// ── Progress Ring SVG ──
function ProgressRing({ progress, color, size = 60 }: { progress: number; color: string; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

// ── Everyday Link types & helpers ──
interface EverydayLink {
  id: string;
  name: string;
  icon: string;
  url: string;
  completed: boolean;
  image?: string;
  color?: string;
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

// ── CSS variable overrides for dark glass theme ──
const dashboardVars: React.CSSProperties = {
  // @ts-ignore -- custom properties
  '--background': '234 32% 14%',
  '--foreground': '0 0% 100%',
  '--card': '0 0% 100% / 0.1',
  '--card-foreground': '0 0% 100%',
  '--popover': '234 32% 18%',
  '--popover-foreground': '0 0% 100%',
  '--secondary': '0 0% 100% / 0.08',
  '--secondary-foreground': '0 0% 100%',
  '--muted': '0 0% 100% / 0.08',
  '--muted-foreground': '0 0% 100% / 0.5',
  '--accent': '0 0% 100% / 0.12',
  '--accent-foreground': '0 0% 100%',
  '--border': '0 0% 100% / 0.15',
  '--input': '0 0% 100% / 0.12',
  '--ring': '258 90% 66%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 100%',
  '--success': '142 71% 45%',
  '--success-foreground': '0 0% 100%',
  '--warning': '38 92% 50%',
  '--warning-foreground': '0 0% 100%',
  '--info': '217 91% 60%',
  '--info-foreground': '0 0% 100%',
};

const GLASS = "bg-[hsl(0_0%_100%/0.1)] backdrop-blur-[20px] border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)]";

export default function Dashboard() {
  const { profile, user } = useAuth();
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

  // Habit data for summary card
  const weekStart = getCurrentWeekStart();
  const { data: weekLogs = [] } = useHabitLogs(weekStart);
  const totalHabitHours = weekLogs.reduce((s, l) => s + Number(l.hours), 0);

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
    { id: "1", name: "Email", icon: "📧", url: "mailto:", completed: false, color: "#3B82F6" },
    { id: "2", name: "Shopify", icon: "🛍️", url: "https://shopify.com", completed: false, color: "#10B981" },
    { id: "3", name: "Status", icon: "📝", url: "#applications", completed: false, color: "#F59E0B" },
    { id: "4", name: "New", icon: "✨", url: "#", completed: false, color: "#8B5CF6" },
  ]);

  const toggleLinkCompletion = (id: string) => {
    setEverydayLinks(everydayLinks.map(link =>
      link.id === id ? { ...link, completed: !link.completed } : link
    ));
  };

  const addNewLink = () => {
    setEverydayLinks([...everydayLinks, {
      id: Date.now().toString(), name: "New Link", icon: "🔗", url: "#", completed: false, color: "#8B5CF6",
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

  const timeOfDay = now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";
  const firstName = profile?.full_name?.split(" ")[0];
  const avatarUrl = prefs?.profile_photo;
  const initials = (profile?.full_name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <AppShell>
      <div
        className="dashboard-dark-scope min-h-screen relative"
        style={{
          ...dashboardVars,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        {/* Subtle wave overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div
            className="absolute -top-1/2 -left-1/4 w-[150%] h-[80%] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-1/4 -right-1/4 w-[120%] h-[60%] rounded-full blur-[100px]"
            style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.1) 0%, transparent 70%)' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative mx-auto max-w-[600px] px-5 py-6 md:py-10 pb-28"
        >
          {/* ── Header: Avatar + Settings ── */}
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-full border-2 border-white/20 overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#8B5CF6] text-sm font-semibold text-white">
                  {initials}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center justify-center h-12 w-12 rounded-full bg-white/10 backdrop-blur-[10px] transition-colors hover:bg-white/15"
            >
              <Settings className="h-6 w-6 text-white/60" />
            </button>
          </div>

          {/* ── Date & Greeting ── */}
          <div className="mt-10">
            <p className="text-sm text-white/60">{format(now, "EEEE, MMMM d")}</p>
            <h1 className="text-[32px] md:text-[40px] font-bold text-white leading-[1.2]">
              Good {timeOfDay},{" "}
              <span className="font-light italic">{firstName || "there"}</span>
            </h1>
          </div>

          {/* ── 90-Day Goal ── */}
          <div className="mt-6 [&>div]:backdrop-blur-[20px] [&>div]:!rounded-3xl [&>div]:!shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <NinetyDayGoalWidget />
          </div>

          {/* ── Momentum + Habits Cards ── */}
          <div className="mt-5 grid grid-cols-2 gap-4">
            {/* Momentum */}
            <div className={GLASS}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-[11px] font-bold text-[#8B5CF6] tracking-[1px] uppercase">Momentum</p>
                  </div>
                  <p className="text-[48px] font-bold text-white leading-none mb-1">{momentumPct}%</p>
                  <p className="text-[13px] text-white/60">Daily Goal</p>
                </div>
                <div className="flex-shrink-0">
                  <Zap className="h-5 w-5 text-[#8B5CF6] mb-2" />
                  <ProgressRing progress={momentumPct} color="#8B5CF6" size={56} />
                </div>
              </div>
            </div>

            {/* Habits */}
            <div className={GLASS}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-[11px] font-bold text-[#EC4899] tracking-[1px] uppercase">Habits</p>
                  </div>
                  <p className="text-[48px] font-bold text-white leading-none mb-1">{totalHabitHours}</p>
                  <p className="text-[13px] text-white/60">Hours logged</p>
                </div>
                <div className="flex-shrink-0">
                  <Heart className="h-5 w-5 text-[#EC4899] mb-2" />
                  <ProgressRing
                    progress={totalHabitHours > 0 ? Math.min(100, Math.round((totalHabitHours / 40) * 100)) : 0}
                    color="#EC4899"
                    size={56}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Today's Agenda ── */}
          <div className="mt-5 [&>div]:backdrop-blur-[20px] [&>div]:!rounded-3xl [&>div]:!shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <YourDayAgenda />
          </div>

          {/* ── Quick To-Dos ── */}
          <div className="mt-5 [&>div]:backdrop-blur-[20px] [&>div]:!rounded-3xl [&>div]:!shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <QuickTodosWidget />
          </div>

          {/* ── Habit Tracker (full widget) ── */}
          <div className="mt-5 [&>div]:backdrop-blur-[20px] [&>div]:!rounded-3xl [&>div]:!shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <HabitTrackerWidget />
          </div>

          {/* ── Everyday Links ── */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Everyday Links</h3>
              <div className="flex items-center gap-1">
                {editingLinks && (
                  <button onClick={addNewLink} className="rounded-md p-1.5 text-white/40 transition-colors hover:text-white/60">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setEditingLinks(!editingLinks)}
                  className="rounded-md p-1.5 text-white/40 transition-colors hover:text-white/60"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {everydayLinks.map((link) => {
                const linkColor = link.color || "#8B5CF6";

                if (editingLinks) {
                  return (
                    <div key={link.id} className={cn(GLASS, "flex flex-col items-center justify-center aspect-square relative")}>
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => updateLink(link.id, "name", e.target.value)}
                        className="w-full bg-transparent text-center text-[11px] font-semibold text-white/60 uppercase outline-none border-b border-white/20 pb-1 mb-1"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateLink(link.id, "url", e.target.value)}
                        placeholder="URL"
                        className="w-full bg-transparent text-center text-[10px] text-white/40 outline-none"
                      />
                      <button
                        onClick={() => deleteLink(link.id)}
                        className="absolute top-2 right-2 text-white/30 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                }

                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex flex-col items-center justify-center aspect-square rounded-2xl",
                      "bg-white/10 backdrop-blur-[20px] border border-white/20",
                      "transition-all duration-200 hover:bg-white/15 hover:-translate-y-0.5"
                    )}
                  >
                    <span className="text-[28px] mb-2" style={{ filter: `drop-shadow(0 0 8px ${linkColor}40)` }}>
                      {link.icon}
                    </span>
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wide">
                      {link.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* ── Recent Journal ── */}
          <div className="mt-8">
            <div className="[&>div]:backdrop-blur-[20px] [&>div]:!rounded-3xl [&>div]:!shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
              <JournalEntriesList />
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="mt-5 [&>div]:backdrop-blur-[20px] [&>div]:!rounded-3xl [&>div]:!shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <NotesWidget onAddNote={() => setNoteEditorOpen(true)} />
          </div>

          {/* Brain Dump Widget */}
          <BrainDumpWidget />
        </motion.div>

        {/* ── Floating Voice Button ── */}
        <div className="fixed bottom-[100px] right-6 z-40">
          <button
            className="flex items-center justify-center h-16 w-16 rounded-full shadow-[0_8px_24px_rgba(139,92,246,0.4)] transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}
            onClick={() => {
              // Trigger voice input - the VoiceInput component handles this in AppShell
              const voiceBtn = document.querySelector('[aria-label="Voice input"]') as HTMLButtonElement;
              if (voiceBtn) voiceBtn.click();
            }}
          >
            <Mic className="h-7 w-7 text-white" />
          </button>
        </div>
      </div>

      {/* ── Modals (outside dark scope for proper theming) ── */}
      <NewProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
      <NoteEditor open={noteEditorOpen} onClose={() => setNoteEditorOpen(false)} />
      {taskEditorOpen && projects.length > 0 && (
        <TaskEditor
          projectId={projects[0].id}
          defaultStatus="backlog"
          onClose={() => setTaskEditorOpen(false)}
        />
      )}

      {/* Tutorial prompt modal */}
      <AnimatePresence>
        {showTutorial && !showVideoPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowTutorial(false)}
            className="fixed inset-0 flex items-center justify-center z-[10001]"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[400px] max-w-[90vw] bg-card rounded-2xl p-8 shadow-2xl"
            >
              <p className="text-md font-semibold text-foreground mb-2">
                Hi, I'm glad you're here.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Would you like a quick 60-second tour?
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setShowVideoPlayer(true)} className="w-full">
                  Watch the guide
                </Button>
                <button
                  onClick={async () => {
                    setShowTutorial(false);
                    await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video player modal */}
      <AnimatePresence>
        {showVideoPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[10002]"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          >
            <div className="w-[640px] max-w-[95vw] bg-card rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-end mb-4">
                <button
                  onClick={async () => {
                    setShowVideoPlayer(false);
                    setShowTutorial(false);
                    await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any);
                  }}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: 'hsl(var(--muted))' }}>
                <iframe
                  src={(prefs as any)?.welcome_video_url || 'https://www.loom.com/embed/your-video-id'}
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
