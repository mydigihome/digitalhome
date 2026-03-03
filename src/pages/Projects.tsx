import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useGoalTasks } from "@/hooks/useGoals";
import { Plus, Calendar, Target, FolderOpen, ChevronRight, LayoutGrid, List, Search, Archive, Filter, User, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import AppShell from "@/components/AppShell";
import CreateEventModal from "@/components/events/CreateEventModal";
import CreateGoalModal from "@/components/goals/CreateGoalModal";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const EVENT_TYPE_EMOJIS: Record<string, string> = {
  dinner_party: "🍽️", book_club: "📚", sorority_event: "💜",
  trip: "✈️", workshop: "🎨", birthday: "🎂", other: "🎯",
};

const TABS = ["Personal", "Work", "Trips"] as const;
type TabKey = typeof TABS[number];

// Category colors
const CAT_COLORS: Record<TabKey, { gradient: string; text: string; bg: string; border: string }> = {
  Personal: { gradient: "from-[#6366F1] to-[#8B5CF6]", text: "text-[#6366F1]", bg: "bg-[#6366F1]/10", border: "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" },
  Work: { gradient: "from-[#10B981] to-[#34D399]", text: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "bg-gradient-to-r from-[#10B981] to-[#34D399]" },
  Trips: { gradient: "from-[#F59E0B] to-[#FBBF24]", text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", border: "bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]" },
};

function getCategoryForProject(project: { type: string; name: string }): TabKey {
  if (project.type === "event") {
    const n = project.name.toLowerCase();
    if (n.includes("trip") || n.includes("travel") || n.includes("vacation")) return "Trips";
    return "Personal";
  }
  return "Personal";
}

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
  const [activeTab, setActiveTab] = useState<TabKey>("Personal");
  const navigate = useNavigate();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered = projects
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => statusFilter === "all" || !p.archived);

  const activeProjects = filtered.filter(p => !p.archived);
  const archivedProjects = filtered.filter(p => p.archived);

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen bg-[#F5F5F7] -m-4 sm:-m-6 p-5 sm:p-8 lg:p-10"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0E7FF]">
              <User className="h-6 w-6 text-[#6366F1]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1F2937] tracking-[-0.02em]">Workspaces</h1>
          </div>
          <button
            onClick={() => setShowCreateEvent(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_8px_24px_rgba(99,102,241,0.25)] transition-all duration-200 hover:scale-105 active:scale-[0.98] animate-[pulse-btn_2s_ease-in-out_infinite]"
          >
            <Plus className="h-7 w-7 text-white" />
          </button>
        </div>

        {/* ── Category Tabs ── */}
        <div className="relative mb-6 border-b border-black/[0.08]">
          <div className="flex gap-10 pb-4">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                ref={el => { tabRefs.current[i] = el; }}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative text-lg font-semibold transition-colors duration-200 pb-0",
                  activeTab === tab ? "text-[#1F2937]" : "text-[#9CA3AF]"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-4 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Search & Filter ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-[14px] border border-black/[0.08] bg-white px-4 pl-10 py-3 text-[15px] text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#6366F1] focus:ring-[3px] focus:ring-[#6366F1]/10"
            />
          </div>
          <button
            onClick={() => setStatusFilter(s => s === "active" ? "all" : "active")}
            className={cn(
              "flex items-center gap-1.5 rounded-[14px] px-4 py-3 text-sm font-semibold border transition-all duration-200",
              statusFilter === "all"
                ? "border-[#6366F1] bg-[#6366F1]/5 text-[#6366F1]"
                : "border-black/[0.08] bg-white text-[#6B7280] hover:bg-[#F3F4F6]"
            )}
          >
            <Archive className="h-4 w-4" /> {statusFilter === "all" ? "Active only" : "Archived"}
          </button>
          <div className="flex items-center gap-0.5 rounded-[14px] bg-white border border-black/[0.08] p-1">
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "rounded-[10px] p-2 transition-all duration-150",
                viewMode === "card" ? "bg-[#6366F1]/10 text-[#6366F1]" : "text-[#9CA3AF] hover:text-[#6B7280]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-[10px] p-2 transition-all duration-150",
                viewMode === "list" ? "bg-[#6366F1]/10 text-[#6366F1]" : "text-[#9CA3AF] hover:text-[#6B7280]"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Create Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <button
            onClick={() => setShowCreateEvent(true)}
            className="group relative overflow-hidden rounded-3xl bg-white p-6 text-left shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] active:scale-[0.98]"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-t-3xl" />
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366F1]/10 text-[#6366F1] group-hover:bg-[#6366F1] group-hover:text-white transition-all duration-200">
                <Calendar className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Create Event</h3>
                <p className="text-sm text-[#9CA3AF]">Plan gatherings, parties, trips & more</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setShowCreateGoal(true)}
            className="group relative overflow-hidden rounded-3xl bg-white p-6 text-left shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] active:scale-[0.98]"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-t-3xl" />
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10B981]/10 text-[#10B981] group-hover:bg-[#10B981] group-hover:text-white transition-all duration-200">
                <Target className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Create Goal</h3>
                <p className="text-sm text-[#9CA3AF]">Track milestones with AI-powered stages</p>
              </div>
            </div>
          </button>
        </div>

        {/* ── Active Projects Section ── */}
        <div className="flex items-center justify-between mt-8 mb-5">
          <h2 className="text-[13px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em]">Active Projects</h2>
          <button className="text-[15px] font-semibold text-[#6366F1] hover:underline transition-all">See all</button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {activeProjects.length > 0 ? (
              viewMode === "card" ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {activeProjects.map(project => {
                    const projectTasks = tasks.filter(t => t.project_id === project.id);
                    const done = projectTasks.filter(t => t.status === "done").length;
                    const total = projectTasks.length;
                    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
                    const isComplete = progress === 100 && total > 0;
                    const cat = getCategoryForProject(project);
                    const colors = CAT_COLORS[cat];

                    return (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative cursor-pointer rounded-3xl bg-white overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        {/* Top accent bar */}
                        <div className={cn("h-1 w-full", colors.border)} />

                        {/* Cover image */}
                        {project.cover_image && (
                          <div
                            className="h-60 w-full bg-[#F3F4F6]"
                            style={{ background: `url(${project.cover_image}) center/cover` }}
                          />
                        )}

                        <div className="p-6">
                          {/* Header row */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={cn("text-[11px] font-bold uppercase tracking-[0.05em] px-3 py-1.5 rounded-lg", colors.text, colors.bg)}>
                              {cat}
                            </span>
                            {total > 0 && (
                              <span className={cn(
                                "flex items-center gap-1 text-[13px] font-semibold px-3 py-1.5 rounded-xl",
                                isComplete
                                  ? "bg-[#10B981]/15 text-[#10B981]"
                                  : "bg-[#6366F1]/10 text-[#6366F1]"
                              )}>
                                {isComplete && <Check className="h-3.5 w-3.5" />}
                                {done}/{total} tasks
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-2xl sm:text-[28px] font-bold text-[#1F2937] leading-[1.3] tracking-[-0.01em] mb-2">
                            {project.name}
                          </h3>

                          {/* Due date */}
                          {(project.end_date || project.start_date) && (
                            <div className="flex items-center gap-1.5 mb-4">
                              <Calendar className="h-4 w-4 text-[#9CA3AF]" />
                              <span className="text-sm font-medium text-[#6B7280]">
                                {project.end_date
                                  ? `Due ${format(new Date(project.end_date), "MMM d")}`
                                  : format(new Date(project.start_date!), "MMM d, yyyy")}
                              </span>
                            </div>
                          )}

                          {/* Progress bar */}
                          {total > 0 && (
                            <div className="mb-5">
                              <div className="h-1.5 w-full rounded-full bg-[#F3F4F6] overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isComplete ? "bg-[#10B981]" : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
                                  )}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* View Details button */}
                          <button className="w-full py-3.5 rounded-[14px] bg-[#6366F1]/[0.06] text-[16px] font-semibold text-[#6366F1] transition-all duration-200 hover:bg-[#6366F1]/[0.12] hover:scale-[1.01] active:scale-[0.98]">
                            View Details
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* ── List View ── */
                <div className="space-y-3">
                  {activeProjects.map(project => {
                    const projectTasks = tasks.filter(t => t.project_id === project.id);
                    const done = projectTasks.filter(t => t.status === "done").length;
                    const total = projectTasks.length;
                    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
                    const cat = getCategoryForProject(project);
                    const colors = CAT_COLORS[cat];

                    return (
                      <div
                        key={project.id}
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="group relative flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] overflow-hidden"
                      >
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl", colors.border)} />
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
                          {project.type === "event" ? <Calendar className={cn("h-5 w-5", colors.text)} /> : <FolderOpen className={cn("h-5 w-5", colors.text)} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-semibold text-[#1F2937] truncate">{project.name}</h3>
                          <p className="text-xs text-[#9CA3AF]">
                            {project.end_date ? `Due ${format(new Date(project.end_date), "MMM d, yyyy")}` : project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "No date"}
                          </p>
                        </div>
                        {total > 0 && (
                          <div className="w-20 shrink-0">
                            <div className="h-1.5 w-full rounded-full bg-[#F3F4F6] overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="mt-1 text-right text-[11px] font-medium text-[#9CA3AF]">{progress}%</p>
                          </div>
                        )}
                        <ChevronRight className="h-4 w-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* ── Empty State ── */
              <div className="rounded-3xl bg-white border-2 border-dashed border-[#6366F1]/20 shadow-[0_10px_30px_rgba(0,0,0,0.04)] py-16 px-6 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                >
                  <FolderOpen className="mx-auto mb-5 h-20 w-20 text-[#6366F1]/30" />
                </motion.div>
                <p className="text-lg font-semibold text-[#6B7280]">Drop your first project here</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Archived Section ── */}
        {statusFilter === "all" && archivedProjects.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-12 mb-5">
              <h2 className="text-[13px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em]">Archived</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {archivedProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group relative cursor-pointer rounded-3xl bg-white overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] opacity-60 hover:opacity-100"
                >
                  <div className="h-1 w-full bg-gradient-to-r from-[#9CA3AF] to-[#D1D5DB]" />
                  <div className="p-6">
                    <span className="text-[11px] font-bold uppercase tracking-[0.05em] px-3 py-1.5 rounded-lg text-[#9CA3AF] bg-[#9CA3AF]/10">
                      Archived
                    </span>
                    <h3 className="text-xl font-bold text-[#1F2937] mt-3 mb-2">{project.name}</h3>
                    <button className="w-full py-3.5 rounded-[14px] bg-[#6366F1]/[0.06] text-[16px] font-semibold text-[#6366F1] transition-all duration-200 hover:bg-[#6366F1]/[0.12]">
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
