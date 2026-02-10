import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { Progress } from "@/components/ui/progress";
import { Plus, Home, Briefcase, Plane, FolderOpen, ChevronRight, LayoutGrid, List } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";
import { cn } from "@/lib/utils";

const workspaceConfig = [
  {
    id: "personal",
    title: "Personal Projects",
    icon: Home,
    colorClass: "bg-primary",
    textClass: "text-primary",
    borderClass: "border-primary",
    hoverClass: "hover:bg-primary/5",
  },
  {
    id: "work",
    title: "Work",
    icon: Briefcase,
    colorClass: "bg-accent-foreground",
    textClass: "text-accent-foreground",
    borderClass: "border-accent-foreground",
    hoverClass: "hover:bg-accent/50",
  },
  {
    id: "travel",
    title: "Trips",
    icon: Plane,
    colorClass: "bg-destructive",
    textClass: "text-destructive",
    borderClass: "border-destructive",
    hoverClass: "hover:bg-destructive/5",
  },
];

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get("type");

  const filteredWorkspaces = filterType
    ? workspaceConfig.filter((w) => w.id === filterType)
    : workspaceConfig;

  const pageTitle = filterType
    ? filteredWorkspaces[0]?.title || "Workspaces"
    : "Workspaces";

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-foreground">{pageTitle}</h1>
          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "card" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Card View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
              List View
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {filteredWorkspaces.map((workspace) => {
            const Icon = workspace.icon;
            const workspaceProjects = projects.filter((p) => p.type === workspace.id);

            return (
              <div key={workspace.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${workspace.colorClass} rounded-xl p-3`}>
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">{workspace.title}</h2>
                      <p className="text-sm text-muted-foreground">{workspaceProjects.length} projects</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalOpen(true)}
                    className={`flex items-center gap-2 rounded-lg ${workspace.colorClass} px-4 py-2 text-primary-foreground transition hover:opacity-90`}
                  >
                    <Plus className="h-5 w-5" />
                    New Project
                  </button>
                </div>

                {workspaceProjects.length > 0 ? (
                  viewMode === "card" ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {workspaceProjects.map((project) => {
                        const projectTasks = tasks.filter((t) => t.project_id === project.id);
                        const done = projectTasks.filter((t) => t.status === "done").length;
                        const total = projectTasks.length;
                        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                        return (
                          <div
                            key={project.id}
                            onClick={() => navigate(`/project/${project.id}`)}
                            className={`group cursor-pointer rounded-xl border-2 ${workspace.borderClass} p-4 transition ${workspace.hoverClass}`}
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <FolderOpen className={`h-8 w-8 ${workspace.textClass}`} />
                              <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:text-foreground" />
                            </div>
                            <h3 className="mb-2 font-semibold text-foreground">{project.name}</h3>
                            {total > 0 && (
                              <div className="mb-2">
                                <Progress value={progress} className="h-1.5" />
                                <p className="mt-1 text-xs text-muted-foreground">{done}/{total} tasks done</p>
                              </div>
                            )}
                            {project.end_date && (
                              <p className="text-sm text-muted-foreground">
                                Due: {format(new Date(project.end_date), "MMM d, yyyy")}
                              </p>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                              Created {format(new Date(project.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {workspaceProjects.map((project) => {
                        const projectTasks = tasks.filter((t) => t.project_id === project.id);
                        const done = projectTasks.filter((t) => t.status === "done").length;
                        const total = projectTasks.length;
                        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                        return (
                          <div
                            key={project.id}
                            onClick={() => navigate(`/project/${project.id}`)}
                            className={`group flex cursor-pointer items-center gap-4 rounded-lg border-l-4 ${workspace.borderClass} p-4 transition ${workspace.hoverClass}`}
                          >
                            <FolderOpen className={`h-6 w-6 ${workspace.textClass}`} />
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{project.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Created {format(new Date(project.created_at), "MMM d, yyyy")}
                                {project.end_date && ` • Due ${format(new Date(project.end_date), "MMM d, yyyy")}`}
                              </p>
                            </div>
                            {total > 0 && (
                              <div className="w-32">
                                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                            )}
                            <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:text-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
                    <FolderOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                    <p className="mb-4 text-muted-foreground">No projects yet</p>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="font-medium text-primary hover:text-primary/80"
                    >
                      Create your first project
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      <NewProjectModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppShell>
  );
}
