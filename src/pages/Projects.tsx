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
    dotColor: "bg-primary",
  },
  {
    id: "work",
    title: "Work",
    icon: Briefcase,
    dotColor: "bg-info",
  },
  {
    id: "travel",
    title: "Trips",
    icon: Plane,
    dotColor: "bg-destructive",
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{pageTitle}</h1>
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

        <div className="space-y-8">
          {filteredWorkspaces.map((workspace) => {
            const Icon = workspace.icon;
            const workspaceProjects = projects.filter((p) => p.type === workspace.id);

            return (
              <div key={workspace.id}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", workspace.dotColor)} />
                    <h2 className="text-lg font-semibold text-foreground">{workspace.title}</h2>
                    <span className="text-sm text-muted-foreground">({workspaceProjects.length})</span>
                  </div>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-accent"
                  >
                    <Plus className="h-3.5 w-3.5" /> New Project
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
                            className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <FolderOpen className="h-5 w-5 text-muted-foreground" />
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
                      {workspaceProjects.map((project) => {
                        const projectTasks = tasks.filter((t) => t.project_id === project.id);
                        const done = projectTasks.filter((t) => t.status === "done").length;
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
                      onClick={() => setModalOpen(true)}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
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
