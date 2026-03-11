import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useGoalTasks } from "@/hooks/useGoals";
import { Calendar, Target, FolderOpen, ChevronRight, LayoutGrid, List, Search, Archive, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import AppShell from "@/components/AppShell";
import CreateEventModal from "@/components/events/CreateEventModal";
import CreateGoalModal from "@/components/goals/CreateGoalModal";
import { cn } from "@/lib/utils";


const EVENT_TYPE_EMOJIS: Record<string, string> = {
  dinner_party: "🍽️", book_club: "📚", sorority_event: "💜",
  trip: "✈️", workshop: "🎨", birthday: "🎂", other: "🎯",
};

const TYPE_COLORS = {
  goal: { text: "text-primary", bg: "bg-primary/10", border: "bg-gradient-to-r from-primary to-primary/70" },
  event: { text: "text-success", bg: "bg-success/10", border: "bg-gradient-to-r from-success to-success/70" },
};

export function getProjectTypeCategory(type: string): "goal" | "event" {
  return type === "event" ? "event" : "goal";
}

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
  const navigate = useNavigate();

  const filtered = projects
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => statusFilter === "all" || !p.archived);

  const activeProjects = filtered.filter(p => !p.archived);
  const archivedProjects = filtered.filter(p => p.archived);

  const goalProjects = activeProjects.filter(p => getProjectTypeCategory(p.type) === "goal");
  const eventProjects = activeProjects.filter(p => getProjectTypeCategory(p.type) === "event");

  const renderCard = (project: typeof projects[0]) => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const done = projectTasks.filter(t => t.status === "done").length;
    const total = projectTasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    const isComplete = progress === 100 && total > 0;
    const typeCat = getProjectTypeCategory(project.type);
    const colors = TYPE_COLORS[typeCat];

    if (viewMode === "list") {
      return (
        <div
          key={project.id}
          onClick={() => navigate(`/project/${project.id}`)}
          className="group relative flex cursor-pointer items-center gap-4 rounded-2xl bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md overflow-hidden"
        >
          <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl", colors.border)} />
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
            {project.type === "event" ? <Calendar className={cn("h-5 w-5", colors.text)} /> : <FolderOpen className={cn("h-5 w-5", colors.text)} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground truncate">{project.name}</h3>
            <p className="text-xs text-muted-foreground">
              {project.end_date ? `Due ${format(new Date(project.end_date), "MMM d, yyyy")}` : project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "No date"}
            </p>
          </div>
          {total > 0 && (
            <div className="w-20 shrink-0">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-right text-[11px] font-medium text-muted-foreground">{progress}%</p>
            </div>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      );
    }

    return (
      <motion.div
        key={project.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative cursor-pointer rounded-3xl bg-card overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        onClick={() => navigate(`/project/${project.id}`)}
      >
        <div className={cn("h-1 w-full", colors.border)} />
        {project.cover_image && (
          <div className="h-60 w-full bg-muted" style={{ background: `url(${project.cover_image}) center/cover` }} />
        )}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className={cn("text-[11px] font-bold uppercase tracking-[0.05em] px-3 py-1.5 rounded-lg", colors.text, colors.bg)}>
              {typeCat === "event" ? "Event" : "Goal"}
            </span>
            {total > 0 && (
              <span className={cn(
                "flex items-center gap-1 text-[13px] font-semibold px-3 py-1.5 rounded-xl",
                isComplete ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
              )}>
                {isComplete && <Check className="h-3.5 w-3.5" />}
                {done}/{total} tasks
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-[28px] font-bold text-foreground leading-[1.3] tracking-[-0.01em] mb-2">{project.name}</h3>
          {(project.end_date || project.start_date) && (
            <div className="flex items-center gap-1.5 mb-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {project.end_date ? `Due ${format(new Date(project.end_date), "MMM d")}` : format(new Date(project.start_date!), "MMM d, yyyy")}
              </span>
            </div>
          )}
          {total > 0 && (
            <div className="mb-5">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", isComplete ? "bg-success" : "bg-gradient-to-r from-primary to-primary/70")}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <button className="w-full py-3.5 rounded-[14px] bg-primary/[0.06] text-[16px] font-semibold text-primary transition-all duration-200 hover:bg-primary/[0.12] hover:scale-[1.01] active:scale-[0.98]">
            View Details
          </button>
        </div>
      </motion.div>
    );
  };

  const renderSection = (title: string, items: typeof projects, icon: React.ReactNode) => (
    <>
      <div className="flex items-center justify-between mt-8 mb-5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.1em]">{title}</h2>
          <span className="text-[12px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
      </div>
      {items.length > 0 ? (
        viewMode === "card" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map(renderCard)}
          </div>
        ) : (
          <div className="space-y-3">{items.map(renderCard)}</div>
        )
      ) : (
        <div className="rounded-3xl bg-card border-2 border-dashed border-primary/20 shadow-sm py-12 px-6 text-center">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}>
            <FolderOpen className="mx-auto mb-4 h-16 w-16 text-primary/30" />
          </motion.div>
          <p className="text-base font-semibold text-muted-foreground">No {title.toLowerCase()} yet</p>
        </div>
      )}
    </>
  );

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen bg-background -m-4 sm:-m-6 p-5 sm:p-8 lg:p-10"
      >
        {/* ── Search & Filter ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-[14px] border border-border bg-card px-4 pl-10 py-3 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10"
            />
          </div>
          <button
            onClick={() => setStatusFilter(s => s === "active" ? "all" : "active")}
            className={cn(
              "flex items-center gap-1.5 rounded-[14px] px-4 py-3 text-sm font-semibold border transition-all duration-200",
              statusFilter === "all"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <Archive className="h-4 w-4" /> {statusFilter === "all" ? "Active only" : "Archived"}
          </button>
          <div className="flex items-center gap-0.5 rounded-[14px] bg-card border border-border p-1">
            <button
              onClick={() => setViewMode("card")}
              className={cn("rounded-[10px] p-2 transition-all duration-150", viewMode === "card" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("rounded-[10px] p-2 transition-all duration-150", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Create Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
          <button
            onClick={() => setShowCreateEvent(true)}
            className="group relative overflow-hidden rounded-3xl bg-card p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-success/70 rounded-t-3xl" />
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success group-hover:bg-success group-hover:text-success-foreground transition-all duration-200">
                <Calendar className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Create Event</h3>
                <p className="text-sm text-muted-foreground">Plan gatherings, parties, trips & more</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setShowCreateGoal(true)}
            className="group relative overflow-hidden rounded-3xl bg-card p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/70 rounded-t-3xl" />
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                <Target className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Create Goal</h3>
                <p className="text-sm text-muted-foreground">Track milestones with AI-powered stages</p>
              </div>
            </div>
          </button>
        </div>

        {/* ── Goals & Projects Section ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode + search + statusFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {renderSection("Goals & Projects", goalProjects, <Target className="h-4 w-4 text-primary" />)}
            {renderSection("Events", eventProjects, <Calendar className="h-4 w-4 text-success" />)}
          </motion.div>
        </AnimatePresence>

        {/* ── Archived Section ── */}
        {statusFilter === "all" && archivedProjects.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-12 mb-5">
              <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Archived</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {archivedProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group relative cursor-pointer rounded-3xl bg-card overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg opacity-60 hover:opacity-100"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20" />
                  <div className="p-6">
                    <span className="text-[11px] font-bold uppercase tracking-[0.05em] px-3 py-1.5 rounded-lg text-muted-foreground bg-muted">
                      Archived
                    </span>
                    <h3 className="text-xl font-bold text-foreground mt-3 mb-2">{project.name}</h3>
                    <button className="w-full py-3.5 rounded-[14px] bg-primary/[0.06] text-[16px] font-semibold text-primary transition-all duration-200 hover:bg-primary/[0.12]">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
      <CreateGoalModal open={showCreateGoal} onClose={() => setShowCreateGoal(false)} />
    </AppShell>
  );
}
