import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects, useUpdateProject, useDeleteProject } from "@/hooks/useProjects";
import { useTasks, useUpdateTask, Task } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Plus, GripVertical, FileText, Sparkles, Calendar, Clock, User, Tag, Link2, Trash2, Archive, AlertTriangle, X, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, differenceInDays, isPast, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import AppShell from "@/components/AppShell";
import TaskEditor from "@/components/TaskEditor";
import DocumentsTab from "@/components/DocumentsTab";
import AITaskGenerator from "@/components/AITaskGenerator";
import PageHeader from "@/components/PageHeader";
import EventDetailView from "@/components/events/EventDetailView";
import GoalDetailView from "@/components/goals/GoalDetailView";
import QuickEmailComposer from "@/components/events/QuickEmailComposer";

import {
  DndContext, DragEndEvent, DragStartEvent, DragOverEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, closestCorners, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const columns = [
  { id: "backlog", label: "Backlog", color: "bg-muted-foreground" },
  { id: "ready", label: "Ready", color: "bg-primary/60" },
  { id: "in_progress", label: "In Progress", color: "bg-primary" },
  { id: "review", label: "Review", color: "bg-warning" },
  { id: "done", label: "Done", color: "bg-success" },
];

const priorityBorder: Record<string, string> = {
  low: "border-l-success",
  medium: "border-l-warning",
  high: "border-l-destructive",
};

const priorityDot: Record<string, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-destructive",
};

function DueBadge({ date }: { date: string }) {
  const d = new Date(date);
  const days = differenceInDays(d, new Date());
  
  if (isPast(d) && !isToday(d)) {
    return <span className="rounded-xs bg-destructive px-1.5 py-0.5 text-[11px] font-medium uppercase text-destructive-foreground">Overdue</span>;
  }
  if (isToday(d)) {
    return <span className="rounded-xs bg-destructive/90 px-1.5 py-0.5 text-[11px] font-medium uppercase text-destructive-foreground">Today</span>;
  }
  if (isTomorrow(d)) {
    return <span className="rounded-xs bg-warning px-1.5 py-0.5 text-[11px] font-medium uppercase text-warning-foreground">Tomorrow</span>;
  }
  if (days <= 7) {
    return <span className="rounded-xs bg-info/20 px-1.5 py-0.5 text-[11px] font-medium uppercase text-info">This week</span>;
  }
  return <span className="rounded-xs bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">in {days}d</span>;
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
      className={cn(
        "cursor-grab rounded-md border border-border border-l-[3px] bg-card p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:cursor-grabbing active:shadow-lg active:rotate-1 active:scale-[1.02]",
        priorityBorder[task.priority]
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {task.due_date && <DueBadge date={task.due_date} />}
        {task.labels && task.labels.length > 0 && task.labels.slice(0, 2).map((label, i) => (
          <span key={i} className="rounded-xs bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">{label}</span>
        ))}
      </div>
      {task.assignee && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" /> {task.assignee}
        </div>
      )}
    </div>
  );
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className={cn("cursor-grabbing rounded-md border border-primary border-l-[3px] bg-card p-3 shadow-lg rotate-2 scale-[1.02]", priorityBorder[task.priority])}>
      <p className="text-sm font-medium">{task.title}</p>
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
  const deleteProject = useDeleteProject();

  const [mainTab, setMainTab] = useState("board");
  const [view, setView] = useState(project?.view_preference || "kanban");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const isEvent = project?.type === "event";
  const isGoal = project?.type === "goal";

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

  const handleDragOver = (event: DragOverEvent) => {};

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id as string;
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    const overId = over.id as string;
    const overData = over.data.current;

    let targetStatus: string;
    let targetPosition: number;

    if (overData?.type === "column") {
      targetStatus = overId;
      const columnTasks = tasks.filter((t) => t.status === targetStatus && t.id !== taskId);
      targetPosition = columnTasks.length;
    } else if (overData?.type === "task") {
      const overTask = overData.task as Task;
      targetStatus = overTask.status;
      const columnTasks = tasks
        .filter((t) => t.status === targetStatus && t.id !== taskId)
        .sort((a, b) => a.position - b.position);
      const overIndex = columnTasks.findIndex((t) => t.id === overTask.id);
      targetPosition = overIndex >= 0 ? overIndex : columnTasks.length;
    } else {
      return;
    }

    if (currentTask.status !== targetStatus || currentTask.position !== targetPosition) {
      updateTask.mutate({ id: taskId, status: targetStatus, position: targetPosition });
    }
  };

  const toggleDone = (task: Task) => {
    updateTask.mutate({ id: task.id, status: task.status === "done" ? "backlog" : "done" });
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {/* Back nav (only for non-event, non-goal views) */}
        {!isEvent && !isGoal && (
          <div className="mb-4">
            <button onClick={() => navigate("/projects")} className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Projects
            </button>
          </div>
        )}

        {/* Event View */}
        {isEvent ? (
          <EventDetailView
            projectId={id!}
            projectName={project?.name || ""}
            coverImage={project?.cover_image || (project as any)?.image_url}
            projectData={project}
          />
        ) : isGoal ? (
          <GoalDetailView projectId={id!} projectName={project?.name || ""} coverImage={project?.cover_image} />
        ) : (
          <>
            {/* Page Header */}
            <PageHeader
              title={project?.name || "Project"}
              icon={project?.icon || ""}
              iconType={project?.icon_type || "emoji"}
              coverImage={project?.cover_image}
              coverType={project?.cover_type || "none"}
              onTitleChange={(name) => id && updateProject.mutate({ id, name })}
              onIconChange={(icon, icon_type) => id && updateProject.mutate({ id, icon, icon_type })}
              onCoverChange={(cover_image, cover_type) => id && updateProject.mutate({ id, cover_image, cover_type })}
              editable
            />

            <div className="mb-6 flex items-center gap-3">
              {project?.type && (
                <Badge variant="secondary" className="capitalize">{project.type}</Badge>
              )}
            </div>

            {/* Progress bar */}
            {tasks.length > 0 && (() => {
              const doneTasks = tasks.filter(t => t.status === "done").length;
              const progress = Math.round((doneTasks / tasks.length) * 100);
              return (
                <div className="mt-3 max-w-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{doneTasks} of {tasks.length} tasks</span>
                    <span className="text-xs font-medium text-foreground">{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })()}

            <div className="mt-3 mb-6 flex items-center gap-3">
              <Tabs value={mainTab} onValueChange={setMainTab}>
                <TabsList>
                  <TabsTrigger value="board" className="text-xs">Board</TabsTrigger>
                  <TabsTrigger value="documents" className="text-xs">
                    <FileText className="mr-1 h-3 w-3" /> Playbooks
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {mainTab === "board" && (
                <>
                  <Tabs value={view} onValueChange={setView}>
                    <TabsList>
                      <TabsTrigger value="kanban" className="text-xs">Kanban</TabsTrigger>
                      <TabsTrigger value="list" className="text-xs">List</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button variant="outline" size="sm" onClick={() => setAiGeneratorOpen(true)} className="ml-auto">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> AI Generate
                  </Button>
                </>
              )}
            </div>

            {mainTab === "board" && (
              <>
                {/* Kanban View */}
                {view === "kanban" && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                  >
                    <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
                      {columns.map((col) => {
                        const columnTasks = tasks.filter((t) => t.status === col.id).sort((a, b) => a.position - b.position);
                        return (
                          <div key={col.id} className="min-w-[320px] flex-shrink-0">
                            <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy} id={col.id}>
                              <DroppableColumn id={col.id} label={col.label} color={col.color} count={columnTasks.length} onAddTask={() => setAddingToColumn(col.id)}>
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
                          <div className="mb-2 flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", col.color)} />
                            <h3 className="text-sm font-medium text-muted-foreground">{col.label} ({columnTasks.length})</h3>
                          </div>
                          <div className="space-y-1">
                            {columnTasks.map((task) => (
                              <div
                                key={task.id}
                                className={cn("group/task flex cursor-pointer items-center gap-3 rounded-md border border-border border-l-[3px] p-3 transition-all duration-150 hover:shadow-sm hover:bg-secondary/30", priorityBorder[task.priority])}
                                onClick={() => setEditingTask(task)}
                              >
                                <div className="relative flex items-center">
                                  <Checkbox
                                    checked={task.status === "done"}
                                    onCheckedChange={() => toggleDone(task)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="group-hover/task:opacity-0 transition-opacity"
                                  />
                                  <button
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/task:opacity-100 transition-opacity text-primary hover:text-primary/80"
                                    onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                    title="Edit task"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <span className={cn("flex-1 text-sm", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</span>
                                {task.due_date && <DueBadge date={task.due_date} />}
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
              </>
            )}

            {mainTab === "documents" && id && <DocumentsTab projectId={id} />}
          </>
        )}

        {/* Delete / Archive Project — hidden for events (EventDetailView has its own Delete Event link) */}
        {!isEvent && (
          <div className="mt-12 border-t border-border pt-8 pb-4">
            <div className="flex justify-center">
              <Button
                variant="destructive"
                onClick={() => { setShowDeleteModal(true); setConfirmChecked(false); }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete Project
              </Button>
            </div>
          </div>
        )}
      </motion.div>

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

      {id && project && !isEvent && !isGoal && (
        <AITaskGenerator
          open={aiGeneratorOpen}
          onOpenChange={setAiGeneratorOpen}
          projectId={id}
          projectName={project.name}
        />
      )}

      {/* Delete / Archive Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Are you sure?</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive mb-1"> This action will permanently delete your project</p>
              <p className="text-xs text-muted-foreground">All project data, tasks, and files will be lost forever. You can choose to archive instead.</p>
            </div>

            <div className="mb-5 rounded-lg border border-border bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Project</p>
              <p className="text-sm font-medium text-foreground">{project?.name}</p>
            </div>

            <label className="mb-5 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="h-4 w-4 rounded border-border text-destructive focus:ring-destructive"
              />
              <span className="text-sm text-foreground">Yes, please delete</span>
            </label>

            {confirmChecked ? (
              <div className="space-y-2">
                <div className="mb-3 h-px bg-border" />
                <p className="text-xs text-muted-foreground mb-3">Choose an action:</p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (id) {
                      deleteProject.mutate(id, { onSuccess: () => navigate("/projects") });
                    }
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Permanently Delete
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (id) {
                      updateProject.mutate({ id, archived: true }, { onSuccess: () => navigate("/projects") });
                    }
                  }}
                >
                  <Archive className="mr-1.5 h-4 w-4" /> Archive Project
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Archived projects can be restored from Settings → Archived
                </p>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </AppShell>
  );
}

function DroppableColumn({ id, label, color, count, onAddTask, children }: {
  id: string; label: string; color: string; count: number; onAddTask: () => void; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column" } });

  return (
    <div ref={setNodeRef} className={cn("min-h-[400px] rounded-lg bg-background p-4 transition-colors", isOver && "bg-primary/5")}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", color)} />
          <span className="text-md font-medium">{label}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-card shadow-xs text-xs text-muted-foreground">{count}</span>
        </div>
        <button
          onClick={onAddTask}
          className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-card hover:shadow-sm hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
