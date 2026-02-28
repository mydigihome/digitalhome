import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { Plus, Calendar, Target, FolderOpen, ChevronRight, LayoutGrid, List, Search, Archive, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import AppShell from "@/components/AppShell";
import CreateEventModal from "@/components/events/CreateEventModal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const EVENT_TYPE_EMOJIS: Record<string, string> = {
  dinner_party: "🍽️", book_club: "📚", sorority_event: "💜",
  trip: "✈️", workshop: "🎨", birthday: "🎂", other: "🎯",
};

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
  const navigate = useNavigate();

  const filtered = projects
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => statusFilter === "all" || !p.archived);

  const events = filtered.filter(p => p.type === "event");
  const goals = filtered.filter(p => p.type !== "event");

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-sm bg-secondary p-0.5">
              <button
                onClick={() => setViewMode("card")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-medium transition-all duration-150",
                  viewMode === "card" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Cards
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-medium transition-all duration-150",
                  viewMode === "list" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>
          </div>
        </div>

        {/* Create Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowCreateEvent(true)}
            className="group relative overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-left transition-all hover:border-primary hover:bg-primary/10 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <Calendar className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Create Event</h3>
                <p className="text-sm text-muted-foreground">Plan gatherings, parties, trips & more</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate("/project/new?type=goal")}
            className="group relative overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-left transition-all hover:border-primary hover:bg-primary/10 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <Target className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Create Goal</h3>
                <p className="text-sm text-muted-foreground">Track milestones with AI-powered stages</p>
              </div>
            </div>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="pl-9"
            />
          </div>
          <button
            onClick={() => setStatusFilter(s => s === "active" ? "all" : "active")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium border transition",
              statusFilter === "all" ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <Archive className="h-3.5 w-3.5" /> {statusFilter === "all" ? "Show active only" : "Include archived"}
          </button>
        </div>

        {/* Events Section */}
        {events.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Events</h2>
              <span className="text-sm text-muted-foreground">({events.length})</span>
            </div>
            {viewMode === "card" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map(project => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                  >
                    {/* Cover */}
                    <div
                      className="h-28 w-full"
                      style={{
                        background: project.cover_image
                          ? `url(${project.cover_image}) center/cover`
                          : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.6) 100%)",
                      }}
                    />
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "No date set"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {events.map(project => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="group flex cursor-pointer items-center gap-4 rounded-sm p-3 transition-all duration-150 hover:bg-secondary"
                  >
                    <Calendar className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "No date"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Goals / Other Projects Section */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Goals & Projects</h2>
            <span className="text-sm text-muted-foreground">({goals.length})</span>
          </div>
          {goals.length > 0 ? (
            viewMode === "card" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {goals.map(project => {
                  const projectTasks = tasks.filter(t => t.project_id === project.id);
                  const done = projectTasks.filter(t => t.status === "done").length;
                  const total = projectTasks.length;
                  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
                          <FolderOpen className="h-4 w-4 text-primary" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{project.name}</h3>
                      {total > 0 && (
                        <div className="mb-2">
                          <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{done}/{total} tasks</p>
                        </div>
                      )}
                      {project.end_date && (
                        <p className="text-xs text-muted-foreground">
                          Due {format(new Date(project.end_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {goals.map(project => {
                  const projectTasks = tasks.filter(t => t.project_id === project.id);
                  const done = projectTasks.filter(t => t.status === "done").length;
                  const total = projectTasks.length;
                  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="group flex cursor-pointer items-center gap-4 rounded-sm p-3 transition-all duration-150 hover:bg-secondary"
                    >
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-foreground">{project.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(project.created_at), "MMM d, yyyy")}
                          {project.end_date && ` · Due ${format(new Date(project.end_date), "MMM d, yyyy")}`}
                        </p>
                      </div>
                      {total > 0 && (
                        <div className="w-24">
                          <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{progress}%</p>
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="rounded-lg border-2 border-dashed border-border py-12 text-center">
              <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground mb-3">No projects yet</p>
              <button
                onClick={() => navigate("/project/new?type=goal")}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Create your first goal
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
    </AppShell>
  );
}
