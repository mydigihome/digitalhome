import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar, Target, FolderOpen, ChevronRight, LayoutGrid, List,
  Search, Archive, Check, CheckSquare, Trash2, Archive as ArchiveIcon,
  X, AlertTriangle, Link, Loader2, Sparkles, MapPin, Users, Eye, User,
} from "lucide-react";
import ProjectFinancialBar from "@/components/projects/ProjectFinancialBar";
import ProjectContactAvatars from "@/components/projects/ProjectContactAvatars";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import AppShell from "@/components/AppShell";
import CreateEventModal from "@/components/events/CreateEventModal";
import CreateGoalModal from "@/components/goals/CreateGoalModal";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function getProjectTypeCategory(type: string): "goal" | "event" {
  return type === "event" ? "event" : "goal";
}

const TYPE_COLORS = {
  goal: { text: "text-primary", bg: "bg-primary/10", border: "bg-gradient-to-r from-primary to-primary/70" },
  event: { text: "text-success", bg: "bg-success/10", border: "bg-gradient-to-r from-success to-success/70" },
};

const DELETED_PROJECT_IDS = new Set<string>();

export default function Projects() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const queryClient = useQueryClient();
  const location = useLocation();
  const deletedProjectIdsFromRoute = ((location.state as { deletedProjectIds?: string[] } | null)?.deletedProjectIds) ?? [];
  const deletedProjectIdsKey = deletedProjectIdsFromRoute.join("|");

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
  const [projectCards, setProjectCards] = useState<typeof projects>([]);
  const [removedProjectIds, setRemovedProjectIds] = useState<string[]>([]);
  const deletedIdsRef = useRef(new Set<string>());
  const navigate = useNavigate();

  // Bulk selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Partiful import
  const [partifulModalOpen, setPartifulModalOpen] = useState(false);
  const [partifulUrl, setPartifulUrl] = useState("");
  const [partifulData, setPartifulData] = useState<Record<string, string>>({});
  const [partifulImporting, setPartifulImporting] = useState(false);
  const [partifulPreview, setPartifulPreview] = useState<any>(null);
  const [partifulFetching, setPartifulFetching] = useState(false);
  const [partifulError, setPartifulError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEventData, setManualEventData] = useState<Record<string, string>>({});

  const isDark = document.documentElement.classList.contains("dark");

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["projects", user?.id] });
  }, []);

  useEffect(() => {
    if (deletedProjectIdsFromRoute.length === 0) return;

    deletedProjectIdsFromRoute.forEach(id => {
      deletedIdsRef.current.add(id);
      DELETED_PROJECT_IDS.add(id);
    });

    queryClient.setQueryData(
      ["projects", user?.id],
      (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter(
          (p: any) => !deletedProjectIdsFromRoute
            .includes(p.id)
        );
      }
    );

    queryClient.setQueryData(
      ["projects"],
      (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter(
          (p: any) => !deletedProjectIdsFromRoute
            .includes(p.id)
        );
      }
    );

    setRemovedProjectIds((prev) =>
      [...new Set([...prev, ...deletedProjectIdsFromRoute])]
    );
  }, [deletedProjectIdsKey]);

  useEffect(() => {
    const hiddenIds = new Set([
      ...removedProjectIds,
      ...deletedIdsRef.current,
      ...DELETED_PROJECT_IDS,
    ]);

    setProjectCards(
      projects.filter(p => !hiddenIds.has(p.id))
    );
  }, [projects, removedProjectIds]);

  const filtered = projectCards
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => statusFilter === "all" || !p.archived);

  const activeProjects = filtered.filter(p => !p.archived);
  const archivedProjects = filtered.filter(p => p.archived);
  const goalProjects = activeProjects.filter(p => getProjectTypeCategory(p.type) === "goal");
  const eventProjects = activeProjects.filter(p => getProjectTypeCategory(p.type) === "event");

  const toggleSelected = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    setBulkDeleteConfirmOpen(false);
    if (selectedIds.length === 0) return;

    const idsToDelete = [...selectedIds];
    const count = idsToDelete.length;
    const deletedItems = projectCards.filter(p => idsToDelete.includes(p.id));

    // Step 1 — remove from UI immediately
    idsToDelete.forEach(id => deletedIdsRef.current.add(id));
    idsToDelete.forEach(id =>
      DELETED_PROJECT_IDS.add(id)
    );
    setRemovedProjectIds((prev) => [...new Set([...prev, ...idsToDelete])]);
    setProjectCards((prev) => prev.filter((item) => !idsToDelete.includes(item.id)));
    setSelectedIds([]);
    setSelectMode(false);

    try {
      await supabase.from("tasks").delete().in("project_id", idsToDelete);
      const { error } = await supabase
        .from("projects")
        .delete()
        .in("id", idsToDelete)
        .eq("user_id", user!.id);

      console.log(
        "Delete attempted for IDs:", idsToDelete
      );
      console.log("Delete error:", error);

      if (error) {
        console.error(
          "DELETE FAILED - Code:", error.code,
          "Message:", error.message,
          "Details:", error.details
        );

        idsToDelete.forEach(id => {
          deletedIdsRef.current.delete(id);
          DELETED_PROJECT_IDS.delete(id);
        });

        setProjectCards(prev => [
          ...deletedItems, ...prev
        ]);
        setRemovedProjectIds(prev =>
          prev.filter(id => !idsToDelete.includes(id))
        );
        toast.error(
          "Delete failed: " + error.message +
          " (Code: " + error.code + ")"
        );
        return;
      }

      console.log("Delete succeeded for:", idsToDelete);

      queryClient.setQueryData(
        ["projects", user?.id],
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter(
            (p: any) => !idsToDelete.includes(p.id)
          );
        }
      );

      queryClient.setQueryData(
        ["projects"],
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter(
            (p: any) => !idsToDelete.includes(p.id)
          );
        }
      );

      toast.success(`${count} item${count > 1 ? "s" : ""} deleted`);
    } catch (err) {
      idsToDelete.forEach(id => {
        deletedIdsRef.current.delete(id);
        DELETED_PROJECT_IDS.delete(id);
      });
      setProjectCards(prev => [...deletedItems, ...prev]);
      setRemovedProjectIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      toast.error("Delete failed. Please try again.");
    }
  };

  const handleBulkArchive = async () => {
    const count = selectedIds.length;
    try {
      for (const id of selectedIds) {
        await supabase.from("projects").update({ archived: true }).eq("id", id);
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSelectedIds([]);
      setSelectMode(false);
      toast.success(`${count} item${count > 1 ? "s" : ""} archived`);
    } catch {
      toast.error("Archive failed.");
    }
  };

  const handleFetchPartiful = async () => {
    setPartifulFetching(true);
    setPartifulPreview(null);
    setPartifulError(null);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-partiful-event", { body: { url: partifulUrl } });
      if (error || !data?.event?.name) {
        setPartifulError("Could not fetch event details");
        return;
      }
      setPartifulPreview(data.event);
    } catch {
      setPartifulError("Network error — check your connection");
    } finally {
      setPartifulFetching(false);
    }
  };

  const handlePartifulImport = async () => {
    setPartifulImporting(true);
    try {
      const eventData = partifulPreview || manualEventData;
      if (!eventData.name?.trim()) {
        toast.error("Event name is required");
        setPartifulImporting(false);
        return;
      }

      console.log("Importing event:", eventData);

      const insertData: any = {
        user_id: user!.id,
        name: eventData.name,
        type: "event",
        view_preference: "kanban",
        goal: eventData.description || null,
        end_date: eventData.date || null,
      };

      const { data: newEvent, error } = await supabase.from("projects")
        .insert(insertData).select().single();

      if (error) throw error;

      // Try to update extra columns (they may exist now)
      if (eventData.image_url || eventData.location || eventData.host) {
        await supabase.from("projects").update({
          cover_image: eventData.image_url || null,
          description: eventData.description || null,
        } as any).eq("id", newEvent.id);
      }

      // Create event_details row so EventDetailView works
      await (supabase as any).from("event_details").upsert({
        project_id: newEvent.id,
        event_date: eventData.date || eventData.event_date || null,
        location: eventData.location || null,
        description: eventData.description || null,
        event_type: "party",
        privacy: "private",
        location_type: "in_person",
      }, { onConflict: "project_id" });

      const importedProject = {
        ...newEvent,
        event_date: eventData.date || eventData.event_date || null,
        end_date: eventData.date || null,
        location: eventData.location || null,
        description: eventData.description || null,
        host_name: eventData.host || null,
        image_url: eventData.image_url || null,
        cover_image: eventData.image_url || null,
      };

      setProjectCards((prev) => [importedProject as (typeof projects)[number], ...prev.filter((item) => item.id !== newEvent.id)]);
      setPartifulModalOpen(false);
      setPartifulUrl("");
      setPartifulPreview(null);
      setManualEventData({});
      setShowManualEntry(false);
      toast.success(`${eventData.name} imported!`);
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error("Import failed. Try again.");
    } finally {
      setPartifulImporting(false);
    }
  };

  const renderCard = (project: typeof projects[0]) => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const done = projectTasks.filter(t => t.status === "done").length;
    const total = projectTasks.length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    const isComplete = progress === 100 && total > 0;
    const typeCat = getProjectTypeCategory(project.type);
    const isEvent = typeCat === "event";
    const accentColor = isEvent ? "#7B5EA7" : "#10B981";
    const accentBg = isEvent ? (isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF") : (isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4");
    const accentBorder = isEvent ? "#DDD6FE" : "#BBF7D0";
    const accentText = isEvent ? (isDark ? "#C4B5FD" : "#7B5EA7") : (isDark ? "#6EE7B7" : "#10B981");
    const isSelected = selectedIds.includes(project.id);
    const proj = project as any;

    if (viewMode === "list") {
      return (
        <div
          key={project.id}
          onClick={() => selectMode ? toggleSelected(project.id) : navigate(`/project/${project.id}`)}
          className="group relative flex cursor-pointer items-center gap-4 rounded-2xl bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md overflow-hidden"
        >
          {selectMode && (
            <button
              onClick={e => { e.stopPropagation(); toggleSelected(project.id); }}
              style={{
                width: "20px", height: "20px", borderRadius: "6px",
                border: `2px solid ${isSelected ? "#10B981" : "#D1D5DB"}`,
                background: isSelected ? "#10B981" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isSelected && <Check size={12} color="white" strokeWidth={3} />}
            </button>
          )}
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: accentColor }} />
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: accentBg }}>
            {isEvent ? <Calendar className="h-5 w-5" style={{ color: accentColor }} /> : <FolderOpen className="h-5 w-5" style={{ color: accentColor }} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground truncate">{project.name}</h3>
            <p className="text-xs text-muted-foreground">
              {proj.event_date ? format(new Date(proj.event_date), "MMM d, yyyy")
                : project.end_date ? `Due ${format(new Date(project.end_date), "MMM d, yyyy")}`
                : project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "No date"}
            </p>
          </div>
          {total > 0 && (
            <div className="w-20 shrink-0">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: accentColor }} />
              </div>
              <p className="mt-1 text-right text-[11px] font-medium text-muted-foreground">{progress}%</p>
            </div>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      );
    }

    return (
      <div
        key={project.id}
        className="group relative cursor-pointer rounded-3xl bg-card overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        style={{ position: "relative" }}
        onClick={() => selectMode ? toggleSelected(project.id) : navigate(`/project/${project.id}`)}
      >
        {/* Bulk checkbox */}
        {selectMode && (
          <button
            onClick={e => { e.stopPropagation(); toggleSelected(project.id); }}
            style={{
              position: "absolute", top: "10px", left: "10px", zIndex: 10,
              width: "20px", height: "20px", borderRadius: "6px",
              border: `2px solid ${isSelected ? "#10B981" : "#D1D5DB"}`,
              background: isSelected ? "#10B981" : "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            {isSelected && <Check size={12} color="white" strokeWidth={3} />}
          </button>
        )}

        <div className="h-1 w-full" style={{ background: accentColor }} />

        {/* Event cover image */}
        {(proj.image_url || proj.cover_image) && (
          <div style={{ height: "120px", overflow: "hidden", position: "relative" }}>
            <img
              src={proj.image_url || proj.cover_image}
              alt={project.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {isDark && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40px", background: "linear-gradient(transparent, rgba(0,0,0,0.3))" }} />}
          </div>
        )}
        {!proj.image_url && !proj.cover_image && project.cover_image && (
          <div className="h-60 w-full bg-muted" style={{ background: `url(${project.cover_image}) center/cover` }} />
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span style={{
              fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
              letterSpacing: "0.05em", padding: "4px 10px", borderRadius: "8px",
              background: accentBg, color: accentText,
              border: `1px solid ${isEvent ? (isDark ? "rgba(123,94,167,0.3)" : accentBorder) : (isDark ? "rgba(16,185,129,0.2)" : accentBorder)}`,
            }}>
              {isEvent ? "Event" : "Goal"}
            </span>
            {isEvent && proj.event_date ? (
              <span style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontSize: "12px", fontWeight: "500", color: accentText,
                background: accentBg, padding: "4px 10px", borderRadius: "8px",
              }}>
                <Calendar size={12} />
                {format(new Date(proj.event_date), "MMM d")}
              </span>
            ) : total > 0 ? (
              <span style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontSize: "13px", fontWeight: "600", padding: "4px 10px", borderRadius: "12px",
                background: isComplete ? (isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)") : accentBg,
                color: isComplete ? (isDark ? "#6EE7B7" : "#10B981") : accentText,
              }}>
                {isComplete && <Check className="h-3.5 w-3.5" />}
                {done}/{total} tasks
              </span>
            ) : null}
          </div>

          <h3 className="text-2xl sm:text-[28px] font-bold text-foreground leading-[1.3] tracking-[-0.01em] mb-2">{project.name}</h3>

          {/* Event-specific details */}
          {isEvent && proj.location && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
              <MapPin size={11} color="#7B5EA7" />
              <span style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {proj.location}
              </span>
            </div>
          )}
          {isEvent && proj.description && (
            <p style={{
              fontSize: "12px", color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
              lineHeight: "1.4", fontFamily: "Inter, sans-serif",
              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
              marginTop: "4px", marginBottom: "4px",
            }}>
              {proj.description}
            </p>
          )}
          {isEvent && proj.host_name && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "6px", marginBottom: "8px" }}>
              <User size={11} color="#9CA3AF" />
              <span style={{ fontSize: "11px", color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF", fontFamily: "Inter, sans-serif" }}>
                Hosted by {proj.host_name}
              </span>
            </div>
          )}

          {/* Goal date / progress */}
          {!isEvent && (project.end_date || project.start_date) && (
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
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: accentColor }} />
              </div>
            </div>
          )}

          <button style={{
            width: "100%", padding: "14px", borderRadius: "14px",
            background: isEvent ? (isDark ? "rgba(123,94,167,0.08)" : "rgba(123,94,167,0.06)") : undefined,
            fontSize: "16px", fontWeight: "600", color: accentText,
            border: "none", cursor: "pointer",
            transition: "all 200ms",
          }}
          className={!isEvent ? "bg-primary/[0.06] hover:bg-primary/[0.12]" : ""}
          >
            View Details
          </button>
        </div>
        <ProjectContactAvatars projectId={project.id} />
        <ProjectFinancialBar
          projectId={project.id}
          projectName={project.name}
          financialGoal={(project as any).financial_goal}
          financialGoalSetBy={(project as any).financial_goal_set_by}
        />
      </div>
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
        {/* ── Search, Filter, Toolbar ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
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

          {/* Select toggle */}
          <button
            onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 14px", border: "1.5px solid",
              borderColor: selectMode ? "#10B981" : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"),
              borderRadius: "8px",
              background: selectMode ? (isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4") : (isDark ? "#252528" : "white"),
              color: selectMode ? (isDark ? "#6EE7B7" : "#065F46") : (isDark ? "#F2F2F2" : "#374151"),
              fontSize: "13px", fontWeight: selectMode ? "600" : "400",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
          >
            <CheckSquare size={14} />
            {selectMode ? "Selecting..." : "Select"}
          </button>

          {/* Import from Partiful */}
          <button
            onClick={() => setShowCreateEvent(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 14px", border: "1.5px solid",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
              borderRadius: "8px",
              background: isDark ? "#252528" : "white",
              fontSize: "13px", fontWeight: "500",
              color: isDark ? "#F2F2F2" : "#374151",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
          >
            <Link size={14} />
            Import
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
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: "#7B5EA7" }} />
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200"
                style={{
                  background: "rgba(123,94,167,0.1)",
                  color: "#7B5EA7",
                }}
              >
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
            {renderSection("Events", eventProjects, <Calendar className="h-4 w-4" style={{ color: "#7B5EA7" }} />)}
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
                    <span className="text-[11px] font-bold uppercase tracking-[0.05em] px-3 py-1.5 rounded-lg text-muted-foreground bg-muted">Archived</span>
                    <h3 className="text-xl font-bold text-foreground mt-3 mb-2">{project.name}</h3>
                    <button className="w-full py-3.5 rounded-[14px] bg-primary/[0.06] text-[16px] font-semibold text-primary transition-all duration-200 hover:bg-primary/[0.12]">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ── Bulk Action Bar ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            style={{
              position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 20px", background: "#111827",
              borderRadius: "14px", boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              zIndex: 9999, fontFamily: "Inter, sans-serif",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleBulkArchive}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
                color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer",
              }}
            >
              <ArchiveIcon size={14} /> Archive
            </button>
            <button
              onClick={() => setBulkDeleteConfirmOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", background: "rgba(220,38,38,0.2)",
                border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px",
                color: "#FCA5A5", fontSize: "13px", fontWeight: "600", cursor: "pointer",
              }}
            >
              <Trash2 size={14} /> Delete ({selectedIds.length})
            </button>
            <button
              onClick={() => { setSelectedIds([]); setSelectMode(false); }}
              style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "4px" }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bulk Delete Confirm Modal ── */}
      {bulkDeleteConfirmOpen && (
        <div
          onClick={() => setBulkDeleteConfirmOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "400px", maxWidth: "90vw",
              background: isDark ? "#1C1C1E" : "white",
              borderRadius: "16px", padding: "32px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              textAlign: "center", fontFamily: "Inter, sans-serif",
            }}
          >
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: isDark ? "rgba(220,38,38,0.15)" : "#FEE2E2",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <AlertTriangle size={22} color="#DC2626" />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: isDark ? "#F2F2F2" : "#111827", marginBottom: "8px" }}>
              Delete {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""}?
            </h3>
            <p style={{ fontSize: "14px", color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", marginBottom: "24px", lineHeight: "1.5" }}>
              This will permanently delete {selectedIds.length} selected item{selectedIds.length > 1 ? "s" : ""} and all their tasks. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setBulkDeleteConfirmOpen(false)}
                style={{
                  flex: 1, padding: "11px", border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  borderRadius: "10px", background: isDark ? "#252528" : "white",
                  fontSize: "14px", fontWeight: "500", color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                style={{
                  flex: 1, padding: "11px", border: "none", borderRadius: "10px",
                  background: "#DC2626", fontSize: "14px", fontWeight: "600",
                  color: "white", cursor: "pointer",
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partiful Import Modal removed — use CreateEventModal instead */}

      <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} />
      <CreateGoalModal open={showCreateGoal} onClose={() => setShowCreateGoal(false)} />
    </AppShell>
  );
}
