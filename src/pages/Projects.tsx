import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import AppShell from "@/components/AppShell";
import NewProjectModal from "@/components/NewProjectModal";

const typeColors: Record<string, string> = {
  personal: "bg-primary/10 text-primary",
  work: "bg-warning/10 text-warning",
  fitness: "bg-success/10 text-success",
  travel: "bg-destructive/10 text-destructive",
};

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[32px] font-semibold tracking-tight">Projects</h1>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Project
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">No projects yet</p>
            <Button className="mt-4" onClick={() => setModalOpen(true)}>Create your first project</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const projectTasks = tasks.filter((t) => t.project_id === p.id);
              const done = projectTasks.filter((t) => t.status === "done").length;
              const total = projectTasks.length;
              const progress = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <Card
                  key={p.id}
                  className="cursor-pointer rounded-2xl border-border p-6 shadow-none transition-colors hover:border-primary/30"
                  onClick={() => navigate(`/project/${p.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-medium">{p.name}</h3>
                    <Badge variant="secondary" className={typeColors[p.type] || ""}>
                      {p.type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{total} tasks</p>
                  <Progress value={progress} className="mt-3 h-1.5" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      <NewProjectModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppShell>
  );
}
