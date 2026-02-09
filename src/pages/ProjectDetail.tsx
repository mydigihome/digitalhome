import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects, useUpdateProject } from "@/hooks/useProjects";
import { useTasks, useUpdateTask, Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Plus, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, differenceInDays, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import AppShell from "@/components/AppShell";
import TaskEditor from "@/components/TaskEditor";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const columns = [
  { id: "backlog", label: "Backlog" },
  { id: "ready", label: "Ready" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const priorityDot: Record<string, string> = {
  low: "bg-muted-foreground",
  medium: "bg-warning",
  high: "bg-destructive",
};

function DueDateLabel({ date }: { date: string }) {
  const d = new Date(date);
  const days = differenceInDays(d, new Date());
  if (isPast(d) && days < 0) return <span className="text-xs text-destructive">Overdue</span>;
  if (days <= 7) return <span className="text-xs text-muted-foreground">in {days}d</span>;
  return null;
}

function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 active:cursor-grabbing"
      onClick={onClick}
    >
      <div className="flex items-start gap-2" {...attributes} {...listeners}>
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{task.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", priorityDot[task.priority])} />
            {task.due_date && <DueDateLabel date={task.due_date} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="cursor-grabbing rounded-xl border border-primary bg-card p-4 shadow-lg">
      <p className="text-sm font-medium">{task.title}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", priorityDot[task.priority])} />
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const project = projects.find((p) => p.id === id);
  const { data: tasks = [], isLoading } = useTasks(id);
  const updateTask = useUpdateTask();
  const updateProject = useUpdateProject();

  const [view, setView] = useState(project?.view_preference || "kanban");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!project && !isLoading) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Project not found</p>
          <Button className="mt-4" onClick={() => navigate("/projects")}>Back to Projects</Button>
        </div>
      </AppShell>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overData = over.data.current;

    // If dropped on a column
    let newStatus: string | undefined;
    if (overData?.type === "column") {
      newStatus = over.id as string;
    } else if (overData?.type === "task") {
      newStatus = overData.task.status;
    }

    if (newStatus) {
      const currentTask = tasks.find((t) => t.id === taskId);
      if (currentTask && currentTask.status !== newStatus) {
        updateTask.mutate({ id: taskId, status: newStatus });
      }
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {};

  // List view helpers
  const toggleDone = (task: Task) => {
    updateTask.mutate({ id: task.id, status: task.status === "done" ? "backlog" : "done" });
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate("/projects")} className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Projects
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-semibold tracking-tight">{project?.name}</h1>
            {project?.type && (
              <Badge variant="secondary" className="capitalize">{project.type}</Badge>
            )}
          </div>
          <div className="mt-3">
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="kanban">Kanban</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Kanban View */}
        {view === "kanban" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((col) => {
                const columnTasks = tasks.filter((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    className="min-w-[300px] flex-shrink-0"
                  >
                    <SortableContext
                      items={columnTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                      id={col.id}
                    >
                      <DroppableColumn
                        id={col.id}
                        label={col.label}
                        count={columnTasks.length}
                        onAddTask={() => setAddingToColumn(col.id)}
                      >
                        {columnTasks.map((task) => (
                          <SortableTaskCard key={task.id} task={task} onClick={() => setEditingTask(task)} />
                        ))}
                      </DroppableColumn>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
            <DragOverlay>
              {activeTask && <TaskCardOverlay task={activeTask} />}
            </DragOverlay>
          </DndContext>
        )}

        {/* List View */}
        {view === "list" && (
          <div className="space-y-6">
            {columns.map((col) => {
              const columnTasks = tasks.filter((t) => t.status === col.id);
              if (columnTasks.length === 0) return null;
              return (
                <div key={col.id}>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    {col.label} ({columnTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/30"
                        onClick={() => setEditingTask(task)}
                      >
                        <Checkbox
                          checked={task.status === "done"}
                          onCheckedChange={() => toggleDone(task)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="flex-1 text-sm">{task.title}</span>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                          </span>
                        )}
                        <div className={cn("h-2 w-2 rounded-full", priorityDot[task.priority])} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-muted-foreground">No tasks yet</p>
                <Button className="mt-4" onClick={() => setAddingToColumn("backlog")}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add a task
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Task Editor Panel */}
      <AnimatePresence>
        {(editingTask || addingToColumn) && (
          <TaskEditor
            task={editingTask}
            projectId={id}
            defaultStatus={addingToColumn || undefined}
            onClose={() => { setEditingTask(null); setAddingToColumn(null); }}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function DroppableColumn({
  id,
  label,
  count,
  onAddTask,
  children,
}: {
  id: string;
  label: string;
  count: number;
  onAddTask: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useSortable({
    id,
    data: { type: "column" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[200px] rounded-xl bg-secondary/50 p-4 transition-colors",
        isOver && "bg-primary/5"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">{count}</span>
        </div>
        <button
          onClick={onAddTask}
          className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 [div:hover>&]:opacity-100"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
