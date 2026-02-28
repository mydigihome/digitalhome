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
  Plus, FolderOpen, Calendar, Clock, ExternalLink,
  Sparkles, Edit2, Check, ImageIcon, StickyNote, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import TaskEditor from "@/components/TaskEditor";
import PageHeader from "@/components/PageHeader";

import NotesWidget from "@/components/NotesWidget";
import NoteEditor from "@/components/NoteEditor";
import BrainDumpWidget from "@/components/BrainDumpWidget";
import HabitTrackerWidget from "@/components/HabitTrackerWidget";
import YourDayAgenda from "@/components/YourDayAgenda";
import { cn } from "@/lib/utils";
import JournalEntriesList from "@/components/journal/JournalEntriesList";

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

  // Tutorial modal - show 5s after entering dashboard for new users
  useEffect(() => {
    if (prefs && (prefs as any).welcome_video_watched === false) {
      const timer = setTimeout(() => setShowTutorial(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [prefs]);

  const [everydayLinks, setEverydayLinks] = useState<EverydayLink[]>([
    { id: "1", name: "Check your email", icon: "📧", url: "mailto:", completed: false },
    { id: "2", name: "Review Shopify Sales", icon: "🛍️", url: "https://shopify.com", completed: false },
    { id: "3", name: "Check Application Status", icon: "📝", url: "#applications", completed: false },
  ]);

  const toggleLinkCompletion = (id: string) => {
    setEverydayLinks(everydayLinks.map(link =>
      link.id === id ? { ...link, completed: !link.completed } : link
    ));
  };

  const addNewLink = () => {
    setEverydayLinks([...everydayLinks, {
      id: Date.now().toString(), name: "New Link", icon: "🔗", url: "#", completed: false,
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

  const totalDone = tasks.filter(t => t.status === "done").length;
  const momentumPct = tasks.length > 0 ? Math.round((totalDone / tasks.length) * 100) : 0;

  const projectsWithStats = projects.map((p) => {
    const ptasks = tasks.filter((t) => t.project_id === p.id);
    const done = ptasks.filter((t) => t.status === "done").length;
    const total = ptasks.length;
    return { ...p, done, total, pending: total - done };
  });
  const priorityProjects = [...projectsWithStats]
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 3);

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {/* Page Header */}
        <PageHeader
          title=""
          icon={prefs?.dashboard_icon || "🏠"}
          iconType={prefs?.dashboard_icon_type || "emoji"}
          coverImage={prefs?.dashboard_cover}
          coverType={prefs?.dashboard_cover_type || "none"}
          onIconChange={(icon, type) => upsertPrefs.mutate({ dashboard_icon: icon, dashboard_icon_type: type })}
          onCoverChange={(cover, type) => upsertPrefs.mutate({ dashboard_cover: cover, dashboard_cover_type: type })}
          editable
        />

        {/* Welcome Section */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {profile?.full_name
                    ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${profile.full_name.split(" ")[0]}`
                    : "Digital Home"}
                </h2>
                <p className="text-sm text-muted-foreground" style={{ letterSpacing: "0.3px" }}>
                  Your life in one place
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setNoteEditorOpen(true)}>
                <StickyNote className="mr-1.5 h-4 w-4" /> Add Note
              </Button>
              <Button onClick={() => setTaskEditorOpen(true)} size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> New Task
              </Button>
              <Button variant="outline" size="sm" onClick={() => setProjectModalOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> New Project
              </Button>
            </div>
          </div>

          {/* Momentum bar */}
          <div className="mt-5 max-w-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-2xl font-medium text-foreground">{momentumPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-1000 ease-out"
                style={{ width: `${momentumPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Momentum score · {totalDone} of {tasks.length} tasks complete</p>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {/* Your Day Agenda Widget */}
          <div className="xl:col-span-2">
            <YourDayAgenda />
          </div>

          {/* Right column widgets */}
          <div className="space-y-5">
            {/* Date & Time */}
            <div className="rounded-lg bg-gradient-primary p-5 text-primary-foreground shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium opacity-80">Today</span>
              </div>
              <p className="text-md font-semibold">
                {format(now, "EEEE, MMMM d, yyyy")}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Clock className="h-4 w-4" />
                <span className="text-2xl font-semibold">
                  {format(now, "hh:mm a")}
                </span>
              </div>
            </div>

            {/* Top Priority Projects */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-warning" />
                  <h3 className="text-lg font-semibold text-foreground">Priority Projects</h3>
                </div>
                <button
                  onClick={() => navigate("/projects")}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View all
                </button>
              </div>
              {priorityProjects.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <FolderOpen className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {priorityProjects.map((project) => {
                    const pct = project.total > 0 ? Math.round((project.done / project.total) * 100) : 0;
                    return (
                      <div
                        key={project.id}
                        className="cursor-pointer rounded-sm p-3 transition-all duration-150 hover:bg-secondary"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">{project.name}</p>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: project.color || undefined }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => setTaskEditorOpen(true)}
                  className="w-full justify-start"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setProjectModalOpen(true)}
                  className="w-full justify-start"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              </div>
            </div>

            {/* Habit Tracker Widget */}
            <HabitTrackerWidget />
          </div>

          {/* Everyday Links */}
          <div className="xl:col-span-3 md:col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Everyday Links</h3>
              <div className="flex items-center gap-1">
                {editingLinks && (
                  <button onClick={addNewLink} className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setEditingLinks(!editingLinks)}
                  className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {everydayLinks.map((link) => (
                <div key={link.id} className="group flex items-center gap-3 rounded-sm p-3 transition-all duration-100 hover:bg-secondary">
                  <button
                    onClick={() => toggleLinkCompletion(link.id)}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      link.completed
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30 hover:border-primary"
                    )}
                  >
                    {link.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                  </button>

                  {/* Link thumbnail */}
                  {(() => {
                    const imgSrc = link.image || getFaviconUrl(link.url);
                    return (
                      <div className="relative h-8 w-8 flex-shrink-0 rounded-md bg-secondary overflow-hidden flex items-center justify-center">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-sm">{link.icon}</span>
                        )}
                        {editingLinks && (
                          <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-foreground/40 opacity-0 transition-opacity hover:opacity-100">
                            <ImageIcon className="h-3.5 w-3.5 text-primary-foreground" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => updateLink(link.id, "image", ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })()}

                  {editingLinks ? (
                    <>
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => updateLink(link.id, "name", e.target.value)}
                        className="flex-1 rounded-sm border border-border bg-background px-2.5 py-1 text-sm"
                      />
                      <button onClick={() => deleteLink(link.id)} className="text-xs text-destructive hover:text-destructive/80">✕</button>
                    </>
                  ) : (
                    <>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("flex-1 text-sm", link.completed ? "text-muted-foreground line-through" : "text-foreground")}
                      >
                        {link.name}
                      </a>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Brain Dump Widget */}
          <div className="xl:col-span-3 md:col-span-2">
            <BrainDumpWidget />
          </div>

          {/* Journal Entries */}
          <div className="xl:col-span-3 md:col-span-2">
            <JournalEntriesList />
          </div>

          {/* Notes Widget */}
          <div className="xl:col-span-3 md:col-span-2">
            <NotesWidget onAddNote={() => setNoteEditorOpen(true)} />
          </div>
        </div>
      </motion.div>

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
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(8px)',
              zIndex: 10001,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '400px',
                maxWidth: '90vw',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              }}
            >
              <p style={{ fontSize: '17px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>
                Hi, I'm glad you're here.
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                Would you like a quick 60-second tour?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setShowVideoPlayer(true)}
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Watch the guide
                </button>
                <button
                  onClick={async () => {
                    setShowTutorial(false);
                    await upsertPrefs.mutateAsync({ welcome_video_watched: true } as any);
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: '#9CA3AF',
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '8px',
                  }}
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
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              zIndex: 10002,
            }}
          >
            <div
              style={{
                width: '640px',
                maxWidth: '95vw',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
              <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', backgroundColor: '#000' }}>
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
