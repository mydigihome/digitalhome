import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Copy, Mail, Send, MapPin, Calendar, Clock,
  CheckCircle, CheckCircle2, Circle, HelpCircle, XCircle, Eye, X, Globe, Lock,
  Trash2, ExternalLink, Plus, Crown, UserPlus, ChevronLeft, ChevronDown, Link,
  AlertTriangle, Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  useEventDetails, useEventGuests, useRsvpQuestions,
  useAddEventGuests, useDeleteEventGuest, useUpsertEventDetails,
  type EventGuest,
} from "@/hooks/useEvents";
import {
  useGoalStages, useGoalTasks, useCreateGoalStage, useCreateGoalTask,
  useUpdateGoalTask, useDeleteGoalStage, useDeleteGoalTask,
  type GoalStage, type GoalTask,
} from "@/hooks/useGoals";
import { useAuth } from "@/hooks/useAuth";
import {
  useCollaborators,
  useCreateCollaborator,
  useDeleteCollaborator,
} from "@/hooks/useCollaborators";

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  accepted: { icon: CheckCircle, color: "text-green-500", label: "Accepted" },
  pending: { icon: HelpCircle, color: "text-yellow-500", label: "Pending" },
  declined: { icon: XCircle, color: "text-red-500", label: "Declined" },
  viewed: { icon: Eye, color: "text-blue-500", label: "Viewed" },
};

const EMAIL_TEMPLATES = [
  {
    name: "Reminder",
    subject: (eventName: string) => `Reminder: ${eventName}`,
    body: (eventName: string, date: string) =>
      `Hi there,\n\nJust a friendly reminder about ${eventName} coming up on ${date}. We hope to see you there!\n\nPlease RSVP if you haven't already.\n\nBest regards`,
  },
  {
    name: "Update",
    subject: (eventName: string) => `Update: ${eventName}`,
    body: (eventName: string, _: string) =>
      `Hi everyone,\n\nWe have an update regarding ${eventName}.\n\n[Your update here]\n\nLooking forward to seeing you!\n\nBest regards`,
  },
  {
    name: "Thank You",
    subject: (eventName: string) => `Thank You - ${eventName}`,
    body: (eventName: string, _: string) =>
      `Hi everyone,\n\nThank you so much for attending ${eventName}! We had a wonderful time and hope you did too.\n\nLooking forward to the next one!\n\nWarm regards`,
  },
];

/* ── Animated Counter ── */
function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{display}</span>;
}

interface Props {
  projectId: string;
  projectName: string;
  coverImage?: string | null;
  projectData?: any;
}

export default function EventDetailView({ projectId, projectName, coverImage, projectData }: Props) {
  const navigate = useNavigate();
  const { data: event } = useEventDetails(projectId);
  const { data: guests = [] } = useEventGuests(event?.id);
  const { data: questions = [] } = useRsvpQuestions(event?.id);
  const addGuests = useAddEventGuests();
  const deleteGuest = useDeleteEventGuest();
  const { user } = useAuth();

  // Use goal_stages and goal_tasks for preparation stages (same as goals)
  const { data: stages = [], isLoading: stagesLoading } = useGoalStages(projectId);
  const { data: tasks = [], isLoading: tasksLoading } = useGoalTasks(projectId);
  const createStage = useCreateGoalStage();
  const createTask = useCreateGoalTask();
  const updateTask = useUpdateGoalTask();
  const deleteStage = useDeleteGoalStage();
  const deleteTask = useDeleteGoalTask();

  const { data: allCollaborators = [] } = useCollaborators();
  const createCollab = useCreateCollaborator();
  const deleteCollab = useDeleteCollaborator();
  const coHosts = allCollaborators.filter((c) => c.project_ids?.includes(projectId));

  const [showAddGuests, setShowAddGuests] = useState(false);
  const [newEmails, setNewEmails] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFilter, setEmailFilter] = useState<"all" | "accepted">("all");
  const [emailTemplate, setEmailTemplate] = useState(0);
  const [emailBody, setEmailBody] = useState("");
  const [showCoHostInvite, setShowCoHostInvite] = useState(false);
  const [coHostEmail, setCoHostEmail] = useState("");

  // Stages UI state (matching goal detail)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [addingTaskToStage, setAddingTaskToStage] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingStageName, setAddingStageName] = useState("");
  const [showAddStage, setShowAddStage] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Use event_details data, falling back to project-level data for imported events
  const effectiveEvent = event || (projectData ? {
    id: projectId,
    project_id: projectId,
    event_date: projectData.event_date || projectData.end_date,
    location: projectData.location,
    description: projectData.description || projectData.goal,
    event_type: "event",
    privacy: "private",
    share_token: "",
    location_type: "in_person",
    shared_album_enabled: false,
    external_link_url: null,
    external_link_label: null,
    playlist_url: null,
    background_style: "default",
    rsvp_deadline: null,
    created_at: projectData.created_at,
    updated_at: projectData.updated_at,
  } as any : null);

  // Auto-expand all stages on load
  useEffect(() => {
    if (stages.length > 0 && expandedStages.size === 0) {
      setExpandedStages(new Set(stages.map(s => s.id)));
    }
  }, [stages]);

  const toggleExpand = (id: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleTask = async (task: GoalTask) => {
    const wasCompleted = task.completed;
    await updateTask.mutateAsync({
      id: task.id,
      completed: !wasCompleted,
      completed_at: wasCompleted ? null : new Date().toISOString(),
    });
  };

  const handleAddTask = async (stageId: string) => {
    if (!newTaskTitle.trim()) return;
    const stageTasks = tasks.filter(t => t.stage_id === stageId);
    await createTask.mutateAsync({
      stage_id: stageId,
      project_id: projectId,
      title: newTaskTitle,
      position: stageTasks.length,
    });
    setNewTaskTitle("");
    setAddingTaskToStage(null);
  };

  const handleAddStage = async () => {
    if (!addingStageName.trim()) return;
    await createStage.mutateAsync({
      project_id: projectId,
      name: addingStageName,
      position: stages.length,
    });
    setAddingStageName("");
    setShowAddStage(false);
  };

  const handleDeleteEvent = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete goal_tasks and goal_stages linked to this project
      const { error: e1 } = await (supabase as any).from("goal_tasks").delete().eq("project_id", projectId);
      if (e1) console.error("goal_tasks delete:", e1);
      const { error: e2 } = await (supabase as any).from("goal_stages").delete().eq("project_id", projectId);
      if (e2) console.error("goal_stages delete:", e2);
      // Delete old tasks too
      const { error: e3 } = await supabase.from("tasks").delete().eq("project_id", projectId);
      if (e3) console.error("tasks delete:", e3);
      // Delete event guests, questions, details
      if (event?.id) {
        await (supabase as any).from("event_rsvp_questions").delete().eq("event_id", event.id);
        await (supabase as any).from("event_guests").delete().eq("event_id", event.id);
        await (supabase as any).from("event_details").delete().eq("id", event.id);
      }
      // Delete documents and contact links
      await supabase.from("documents").delete().eq("project_id", projectId);
      await (supabase as any).from("contact_project_links").delete().eq("project_id", projectId);
      // Delete the project
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) {
        console.error("Project delete error:", error);
        throw error;
      }
      toast.success("Event deleted");
      navigate("/projects");
    } catch (e) {
      console.error("Delete error:", e);
      toast.error("Delete failed. Try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleArchiveEvent = async () => {
    if (!user) return;
    setArchiving(true);
    try {
      await supabase.from("projects").update({ archived: true }).eq("id", projectId).eq("user_id", user.id);
      toast.success("Event archived");
      navigate("/projects");
    } catch (e) {
      toast.error("Archive failed. Try again.");
    } finally {
      setArchiving(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!effectiveEvent) return null;

  const counts = {
    total: guests.length,
    accepted: guests.filter(g => g.status === "accepted").length,
    pending: guests.filter(g => g.status === "pending").length,
    declined: guests.filter(g => g.status === "declined").length,
    viewed: guests.filter(g => g.status === "viewed").length,
  };

  const shareUrl = `${window.location.origin}/events/${effectiveEvent.share_token}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  const handleAddGuests = async () => {
    const emails = newEmails
      .split(/[,;\n]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e && e.includes("@"));
    if (emails.length === 0) { toast.error("Enter valid emails"); return; }
    await addGuests.mutateAsync(emails.map(email => ({ event_id: effectiveEvent.id, email })));
    setNewEmails("");
    setShowAddGuests(false);
    toast.success(`${emails.length} guest(s) added`);
  };

  const openEmailComposer = (filter: "all" | "accepted") => {
    setEmailFilter(filter);
    const tpl = EMAIL_TEMPLATES[0];
    const dateStr = effectiveEvent.event_date ? format(new Date(effectiveEvent.event_date), "MMMM d, yyyy") : "TBD";
    setEmailBody(tpl.body(projectName, dateStr));
    setShowEmailModal(true);
  };

  const handleSendEmail = () => {
    const filteredGuests = emailFilter === "accepted"
      ? guests.filter(g => g.status === "accepted")
      : guests;
    const emails = filteredGuests.map(g => g.email).join(",");
    const tpl = EMAIL_TEMPLATES[emailTemplate];
    const subject = tpl.subject(projectName);
    window.open(`mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`);
    setShowEmailModal(false);
    toast.success("Email client opened");
  };

  const eventType = effectiveEvent.event_type?.replace("_", " ") || "Event";
  const staggerDelay = (i: number) => ({ delay: i * 0.1 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen -mx-4 sm:-mx-6 -mt-4"
      style={{ background: "white" }}
    >
      {/* ═══ HERO SECTION ═══ */}
      <div className="relative w-full overflow-hidden" style={{ height: "45vh", minHeight: 360, background: "#1F2937" }}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={projectName}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0, maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)" }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #374151 0%, #1F2937 100%)", zIndex: 0 }} />
        )}

        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)", zIndex: 1 }} />

        <button
          onClick={() => navigate("/projects")}
          className="absolute flex items-center justify-center rounded-full cursor-pointer transition-all duration-200"
          style={{
            top: 56, left: 20, width: 44, height: 44, zIndex: 10,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "white")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
        >
          <ChevronLeft className="h-6 w-6" style={{ color: "#1F2937" }} />
        </button>

        <div
          className="absolute"
          style={{
            bottom: 140, left: 24, zIndex: 2,
            padding: "8px 16px",
            background: "rgba(139,92,246,0.15)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 20,
            fontSize: 12, fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
            color: "#A78BFA",
          }}
        >
          {eventType}
        </div>

        <h1
          className="absolute font-bold"
          style={{
            bottom: 80, left: 24, right: 24, zIndex: 2,
            fontSize: 36, color: "white", lineHeight: 1.2,
            textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            letterSpacing: "-0.02em",
          }}
        >
          {projectName}
        </h1>
      </div>

      {/* ═══ WHITE CONTENT CARD ═══ */}
      <div
        className="relative"
        style={{
          marginTop: -32,
          background: "white",
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: "32px 20px 100px 20px",
          minHeight: "60vh",
          zIndex: 2,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          maxWidth: 800,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* ═══ INFO CARDS ═══ */}
        {effectiveEvent.event_date && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...staggerDelay(0), duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-start gap-4 mb-4"
            style={{ background: "#F9FAFB", borderRadius: 20, padding: 20 }}
          >
            <div className="flex items-center justify-center shrink-0" style={{ width: 48, height: 48, background: "rgba(139,92,246,0.1)", borderRadius: 12 }}>
              <Calendar className="h-6 w-6" style={{ color: "#8B5CF6" }} />
            </div>
            <div>
              <p className="font-semibold" style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 6 }}>Date & Time</p>
              <p className="font-semibold" style={{ fontSize: 16, color: "#1F2937", lineHeight: 1.4 }}>
                {format(new Date(effectiveEvent.event_date), "EEEE, MMMM d, yyyy")} {effectiveEvent.event_date.includes("T") && `\u2022 ${format(new Date(effectiveEvent.event_date), "h:mm a")}`}
              </p>
            </div>
          </motion.div>
        )}

        {effectiveEvent.location && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...staggerDelay(1), duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-start gap-4 mb-4"
            style={{ background: "#F9FAFB", borderRadius: 20, padding: 20 }}
          >
            <div className="flex items-center justify-center shrink-0" style={{ width: 48, height: 48, background: "rgba(139,92,246,0.1)", borderRadius: 12 }}>
              <MapPin className="h-6 w-6" style={{ color: "#8B5CF6" }} />
            </div>
            <div>
              <p className="font-semibold" style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 6 }}>Location</p>
              <p className="font-semibold" style={{ fontSize: 16, color: "#1F2937", lineHeight: 1.4 }}>{effectiveEvent.location}</p>
            </div>
          </motion.div>
        )}

        {/* ═══ ACTION ROW ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...staggerDelay(2), duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex gap-3 flex-wrap my-6"
        >
          {[
            { icon: Link, text: "Copy Link", onClick: handleCopyLink },
            { icon: UserPlus, text: "Invite Co-Hosts", onClick: () => setShowCoHostInvite(true) },
            { icon: Mail, text: "Email All", onClick: () => openEmailComposer("all") },
            { icon: Send, text: "Email Accepted", onClick: () => openEmailComposer("accepted") },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              className="inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all duration-200 active:scale-95 hover:-translate-y-px"
              style={{
                padding: "12px 20px",
                background: "white",
                border: "1.5px solid #E5E7EB",
                borderRadius: 24,
                fontSize: 14, fontWeight: 600,
                color: "#1F2937",
                minHeight: 44,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
            >
              <btn.icon className="h-4 w-4" style={{ color: "#6B7280" }} />
              {btn.text}
            </button>
          ))}
        </motion.div>

        {/* ═══ CO-HOSTS ═══ */}
        {coHosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...staggerDelay(3), duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className="font-bold uppercase mb-4" style={{ fontSize: 11, letterSpacing: "0.8px", color: "#9CA3AF", marginTop: 32 }}>
              Co-Hosts
            </p>
            <div style={{ background: "white", border: "1.5px solid #F3F4F6", borderRadius: 16, padding: 20 }}>
              {coHosts.map((host) => (
                <div key={host.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(139,92,246,0.1)", color: "#8B5CF6", fontSize: 12, fontWeight: 600 }}>
                    {host.invited_email.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm truncate" style={{ color: "#1F2937" }}>{host.invited_email}</span>
                  <span className="text-[10px] capitalize px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>{host.status}</span>
                  <button onClick={() => { deleteCollab.mutate(host.id); toast.success("Co-host removed"); }} className="p-1 transition-colors cursor-pointer" style={{ color: "#9CA3AF" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ ABOUT ═══ */}
        {effectiveEvent.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...staggerDelay(3), duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: "0.8px", color: "#9CA3AF", margin: "32px 0 16px" }}>About</p>
            <div style={{ background: "white", border: "1.5px solid #F3F4F6", borderRadius: 16, padding: 20, fontSize: 15, color: "#4B5563", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
              {effectiveEvent.description}
            </div>
          </motion.div>
        )}

        {/* ═══ GUEST LIST ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...staggerDelay(4), duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between" style={{ margin: "32px 0 16px" }}>
            <p className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: "0.8px", color: "#9CA3AF" }}>Guest List</p>
            <button
              onClick={() => setShowAddGuests(true)}
              className="cursor-pointer transition-colors hover:underline"
              style={{ fontSize: 14, fontWeight: 600, color: "#8B5CF6" }}
            >
              + Add Guests
            </button>
          </div>

          {guests.length === 0 ? (
            <div className="text-center" style={{ background: "white", border: "2px dashed #E5E7EB", borderRadius: 20, padding: "48px 24px" }}>
              <UserPlus className="mx-auto mb-4" style={{ width: 48, height: 48, color: "#D1D5DB" }} />
              <p className="font-semibold mb-2" style={{ fontSize: 18, color: "#1F2937" }}>No guests yet</p>
              <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.5 }}>Add emails to get started with your guest list management.</p>
            </div>
          ) : (
            <div style={{ background: "white", border: "1.5px solid #F3F4F6", borderRadius: 20, overflow: "hidden" }}>
              {guests.map((guest, i) => {
                const config = STATUS_CONFIG[guest.status] || STATUS_CONFIG.pending;
                const StatusIcon = config.icon;
                return (
                  <div
                    key={guest.id}
                    className="group flex items-center gap-3 transition-colors"
                    style={{ padding: 16, borderBottom: i < guests.length - 1 ? "1px solid #F3F4F6" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <StatusIcon className={cn("h-5 w-5 shrink-0", config.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1F2937" }}>
                        {guest.name || guest.email}
                      </p>
                      {guest.name && <p className="text-xs" style={{ color: "#9CA3AF" }}>{guest.email}</p>}
                      {guest.viewed_at && (
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Viewed {formatDistanceToNow(new Date(guest.viewed_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <span className={cn("text-xs capitalize px-2 py-0.5 rounded-full", config.color)} style={{ background: "#F3F4F6" }}>
                      {config.label}
                    </span>
                    <button
                      onClick={() => { deleteGuest.mutate(guest.id); toast.success("Guest removed"); }}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      style={{ color: "#9CA3AF" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              <div className="flex justify-around text-center" style={{ borderTop: "1px solid #F3F4F6", paddingTop: 24, paddingBottom: 8, margin: "0 16px" }}>
                <div>
                  <span className="block font-bold" style={{ fontSize: 28, color: "#1F2937", marginBottom: 4 }}><AnimatedCount value={counts.accepted} /></span>
                  <span className="uppercase font-semibold" style={{ fontSize: 12, letterSpacing: "0.5px", color: "#9CA3AF" }}>Accepted</span>
                </div>
                <div>
                  <span className="block font-bold" style={{ fontSize: 28, color: "#1F2937", marginBottom: 4 }}><AnimatedCount value={counts.pending} /></span>
                  <span className="uppercase font-semibold" style={{ fontSize: 12, letterSpacing: "0.5px", color: "#9CA3AF" }}>Pending</span>
                </div>
              </div>
            </div>
          )}

          {effectiveEvent.rsvp_deadline && (
            <p className="text-center mt-6" style={{ fontSize: 13, color: "#9CA3AF" }}>
              RSVP Deadline: {format(new Date(effectiveEvent.rsvp_deadline), "MMMM d, yyyy")}
              {isPast(new Date(effectiveEvent.rsvp_deadline)) && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>Expired</span>
              )}
            </p>
          )}
        </motion.div>

        {/* ═══ PREPARATION STAGES — matching GoalDetailView exactly ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mt-10"
          style={{ maxWidth: 800 }}
        >
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="font-bold" style={{ fontSize: 32, color: "#1F2937", letterSpacing: "-0.02em" }}>
              Stages
            </h2>
            <button
              onClick={() => setShowAddStage(true)}
              className="flex items-center gap-1.5 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              style={{
                padding: "10px 20px",
                background: "rgba(123,94,167,0.08)",
                borderRadius: 14,
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                color: "#7B5EA7",
                minHeight: 44,
              }}
            >
              <Plus className="h-[18px] w-[18px]" style={{ color: "#7B5EA7" }} />
              Add Stage
            </button>
          </div>

          {/* Empty State */}
          {stages.length === 0 && !showAddStage && (
            <div
              className="flex flex-col items-center justify-center py-16"
              style={{ borderRadius: 20, border: "2px dashed rgba(0,0,0,0.08)" }}
            >
              <Clock className="h-8 w-8 mb-3" style={{ color: "rgba(123,94,167,0.3)" }} />
              <p className="text-sm mb-1" style={{ color: "#6B7280" }}>No stages yet.</p>
            </div>
          )}

          {/* Stage Cards — pixel-identical to GoalDetailView */}
          <div className="space-y-4">
            {stages.map((stage, si) => {
              const stageTasks = tasks.filter(t => t.stage_id === stage.id).sort((a, b) => a.position - b.position);
              const stageCompleted = stageTasks.filter(t => t.completed).length;
              const stageTotal = stageTasks.length;
              const isExpanded = expandedStages.has(stage.id);

              return (
                <div key={stage.id} className="space-y-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: si * 0.05 }}
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      background: "white",
                      border: "1.5px solid rgba(0,0,0,0.08)",
                      borderRadius: 20,
                      padding: 24,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={e => {
                      if (!isExpanded) {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(123,94,167,0.2)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                    }}
                  >
                    {/* Stage Header */}
                    <div className="flex items-start gap-4 cursor-pointer" onClick={() => toggleExpand(stage.id)}>
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 40, height: 40,
                          borderRadius: "50%",
                          background: "rgba(123,94,167,0.12)",
                          border: "1px solid rgba(123,94,167,0.3)",
                          fontSize: 18, fontWeight: 700,
                          color: "#7B5EA7",
                        }}
                      >
                        {si + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold leading-snug" style={{ fontSize: 20, color: "#1F2937", marginBottom: 4 }}>
                          {stage.name}
                        </h4>
                        {stage.description && (
                          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{stage.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-semibold" style={{ fontSize: 13, color: "#9CA3AF" }}>
                          {stageCompleted} / {stageTotal}
                        </span>
                        <ChevronDown
                          className="transition-transform duration-300"
                          style={{
                            width: 20, height: 20,
                            color: "#9CA3AF",
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Task List (Expandable) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-6 mt-6 space-y-1" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                            {stageTasks.map(task => (
                              <div
                                key={task.id}
                                className="group flex items-start gap-3 transition-all duration-200 rounded-lg"
                                style={{ padding: "12px 0" }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.background = "rgba(123,94,167,0.03)";
                                  (e.currentTarget as HTMLElement).style.margin = "0 -12px";
                                  (e.currentTarget as HTMLElement).style.padding = "12px";
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.background = "transparent";
                                  (e.currentTarget as HTMLElement).style.margin = "0";
                                  (e.currentTarget as HTMLElement).style.padding = "12px 0";
                                }}
                              >
                                <button onClick={() => handleToggleTask(task)} className="shrink-0 mt-0.5">
                                  {task.completed ? (
                                    <motion.div
                                      initial={{ scale: 0.8 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                      <div
                                        className="flex items-center justify-center"
                                        style={{
                                          width: 24, height: 24,
                                          borderRadius: "50%",
                                          background: "linear-gradient(135deg, #7B5EA7 0%, #8B5CF6 100%)",
                                        }}
                                      >
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                      </div>
                                    </motion.div>
                                  ) : (
                                    <div
                                      className="transition-all duration-200 cursor-pointer hover:border-[#7B5EA7]"
                                      style={{
                                        width: 24, height: 24,
                                        borderRadius: "50%",
                                        border: "2px solid #D1D5DB",
                                        background: "white",
                                      }}
                                    />
                                  )}
                                </button>
                                <span
                                  className="flex-1 transition-all duration-200"
                                  style={{
                                    fontSize: 15,
                                    lineHeight: 1.5,
                                    color: task.completed ? "#9CA3AF" : "#1F2937",
                                    textDecoration: task.completed ? "line-through" : "none",
                                  }}
                                >
                                  {task.title}
                                </span>
                                <button
                                  onClick={() => { deleteTask.mutate(task.id); toast.success("Task removed"); }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-auto"
                                >
                                  <Trash2 className="h-4 w-4" style={{ color: "#EF4444" }} />
                                </button>
                              </div>
                            ))}

                            {/* Add Task Input */}
                            {addingTaskToStage === stage.id ? (
                              <div className="flex items-center gap-2 mt-4">
                                <input
                                  value={newTaskTitle}
                                  onChange={e => setNewTaskTitle(e.target.value)}
                                  placeholder="Add new task..."
                                  autoFocus
                                  className="flex-1 outline-none"
                                  style={{
                                    padding: "10px 14px",
                                    border: "1px dashed rgba(123,94,167,0.3)",
                                    borderRadius: 12,
                                    fontSize: 14,
                                    background: "rgba(123,94,167,0.03)",
                                    color: "#1F2937",
                                  }}
                                  onFocus={e => {
                                    e.currentTarget.style.borderStyle = "solid";
                                    e.currentTarget.style.borderColor = "#7B5EA7";
                                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(123,94,167,0.1)";
                                  }}
                                  onBlur={e => {
                                    e.currentTarget.style.borderStyle = "dashed";
                                    e.currentTarget.style.borderColor = "rgba(123,94,167,0.3)";
                                    e.currentTarget.style.boxShadow = "none";
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") handleAddTask(stage.id);
                                    if (e.key === "Escape") { setAddingTaskToStage(null); setNewTaskTitle(""); }
                                  }}
                                />
                                <button
                                  onClick={() => handleAddTask(stage.id)}
                                  className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105"
                                  style={{
                                    width: 32, height: 32,
                                    background: "#7B5EA7",
                                    borderRadius: 8,
                                    color: "white",
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                <button onClick={() => { setAddingTaskToStage(null); setNewTaskTitle(""); }} className="cursor-pointer">
                                  <X className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingTaskToStage(stage.id)}
                                className="flex items-center gap-1.5 mt-3 cursor-pointer transition-colors duration-200"
                                style={{ fontSize: 14, fontWeight: 600, color: "#7B5EA7" }}
                              >
                                <Plus className="h-4 w-4" /> Add task
                              </button>
                            )}

                            {/* Delete Stage */}
                            <div className="flex justify-end pt-3">
                              <button
                                onClick={() => { deleteStage.mutate(stage.id); toast.success("Stage removed"); }}
                                className="flex items-center gap-1 transition-colors cursor-pointer text-xs"
                                style={{ color: "#9CA3AF" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
                              >
                                <Trash2 className="h-3 w-3" /> Remove stage
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Add Stage Inline */}
          <AnimatePresence>
            {showAddStage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 mt-4"
              >
                <Input
                  value={addingStageName}
                  onChange={e => setAddingStageName(e.target.value)}
                  placeholder="Stage name..."
                  className="flex-1"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter") handleAddStage();
                    if (e.key === "Escape") { setShowAddStage(false); setAddingStageName(""); }
                  }}
                />
                <Button size="sm" onClick={handleAddStage} style={{ background: "#7B5EA7", minHeight: 44 }}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAddStage(false); setAddingStageName(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ═══ DELETE SECTION ═══ */}
        <div className="text-center" style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #F3F4F6" }}>
          <button
            onClick={() => { setShowDeleteConfirm(true); setDeleteChecked(false); }}
            className="cursor-pointer transition-all duration-200"
            style={{ background: "transparent", border: "none", fontSize: 15, fontWeight: 600, color: "#EF4444", padding: "12px 24px", borderRadius: 8, minHeight: 44 }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Delete Event
          </button>
        </div>

        {/* Delete Confirmation Dialog — matches goal delete modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="w-full max-w-sm"
                style={{ background: "white", borderRadius: 24, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header with warning */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(239,68,68,0.1)" }}>
                    <AlertTriangle className="h-5 w-5" style={{ color: "#EF4444" }} />
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: "#1F2937" }}>Are you sure?</h3>
                </div>

                {/* Red warning box */}
                <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <p className="text-sm font-medium" style={{ color: "#EF4444" }}>
                    This action will permanently delete your project
                  </p>
                  <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                    {projectName}
                  </p>
                </div>

                {/* Checkbox confirmation */}
                <label className="flex items-center gap-3 cursor-pointer mb-6 select-none" style={{ padding: "8px 0" }}>
                  <button
                    onClick={() => setDeleteChecked(!deleteChecked)}
                    style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${deleteChecked ? "#EF4444" : "#D1D5DB"}`,
                      background: deleteChecked ? "#EF4444" : "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "all 150ms",
                    }}
                  >
                    {deleteChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </button>
                  <span className="text-sm" style={{ color: "#1F2937" }}>Yes, please delete</span>
                </label>

                {/* Action buttons */}
                {deleteChecked && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 mb-4"
                  >
                    <button
                      onClick={handleDeleteEvent}
                      disabled={deleting}
                      className="w-full cursor-pointer transition-all py-3 rounded-xl font-semibold text-white"
                      style={{ background: "#EF4444", fontSize: 14, opacity: deleting ? 0.7 : 1, minHeight: 44 }}
                    >
                      {deleting ? "Deleting..." : "Permanently Delete"}
                    </button>
                    <button
                      onClick={handleArchiveEvent}
                      disabled={archiving}
                      className="w-full cursor-pointer transition-all py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                      style={{ border: "1.5px solid #E5E7EB", color: "#6B7280", fontSize: 14, minHeight: 44, opacity: archiving ? 0.7 : 1 }}
                    >
                      <Archive className="h-4 w-4" />
                      {archiving ? "Archiving..." : "Archive Event"}
                    </button>
                  </motion.div>
                )}

                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full cursor-pointer transition-all py-2.5 rounded-xl font-semibold"
                  style={{ border: "1.5px solid #E5E7EB", color: "#1F2937", fontSize: 14, minHeight: 44 }}
                >
                  Cancel
                </button>

                <p className="text-center mt-4 text-xs" style={{ color: "#9CA3AF" }}>
                  Archived events can be restored from Settings → Archived
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Add Guests Modal */}
      <AnimatePresence>
        {showAddGuests && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowAddGuests(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md space-y-4"
              style={{ background: "white", borderRadius: 24, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: "#1F2937" }}>Add Guests</h3>
                <button onClick={() => setShowAddGuests(false)} className="cursor-pointer"><X className="h-5 w-5" style={{ color: "#9CA3AF" }} /></button>
              </div>
              <Textarea value={newEmails} onChange={e => setNewEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" rows={4} />
              <div className="flex gap-3">
                <button onClick={() => setShowAddGuests(false)} className="flex-1 cursor-pointer transition-all py-2.5 rounded-xl font-semibold" style={{ border: "1.5px solid #E5E7EB", color: "#1F2937", fontSize: 14, minHeight: 44 }}>Cancel</button>
                <button onClick={handleAddGuests} className="flex-1 cursor-pointer transition-all py-2.5 rounded-xl font-semibold text-white" style={{ background: "#8B5CF6", fontSize: 14, minHeight: 44 }}>Add Guests</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Composer Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg space-y-4"
              style={{ background: "white", borderRadius: 24, padding: 24, border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "#1F2937" }}>
                  <Mail className="h-5 w-5" style={{ color: "#8B5CF6" }} /> Email Guests
                </h3>
                <button onClick={() => setShowEmailModal(false)} className="cursor-pointer"><X className="h-5 w-5" style={{ color: "#9CA3AF" }} /></button>
              </div>
              <div className="rounded-lg p-3 text-sm" style={{ background: "#F9FAFB", color: "#6B7280" }}>
                Sending to: {emailFilter === "accepted" ? `${counts.accepted} accepted guests` : `${counts.total} guests`}
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: "#9CA3AF" }}>Template</Label>
                <select
                  value={emailTemplate}
                  onChange={e => {
                    const idx = Number(e.target.value);
                    setEmailTemplate(idx);
                    const tpl = EMAIL_TEMPLATES[idx];
                    const dateStr = effectiveEvent.event_date ? format(new Date(effectiveEvent.event_date), "MMMM d, yyyy") : "TBD";
                    setEmailBody(tpl.body(projectName, dateStr));
                  }}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: "1.5px solid #E5E7EB", background: "white", color: "#1F2937" }}
                >
                  {EMAIL_TEMPLATES.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs" style={{ color: "#9CA3AF" }}>Message</Label>
                <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEmailModal(false)} className="flex-1 cursor-pointer transition-all py-2.5 rounded-xl font-semibold" style={{ border: "1.5px solid #E5E7EB", color: "#1F2937", fontSize: 14, minHeight: 44 }}>Cancel</button>
                <button onClick={handleSendEmail} className="flex-1 cursor-pointer transition-all py-2.5 rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2" style={{ background: "#8B5CF6", fontSize: 14, minHeight: 44 }}>
                  <Send className="h-4 w-4" /> Open Email Client
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Co-Host Invite Modal */}
      <AnimatePresence>
        {showCoHostInvite && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowCoHostInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md space-y-4"
              style={{ background: "white", borderRadius: 24, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "#1F2937" }}>
                  <UserPlus className="h-5 w-5" style={{ color: "#8B5CF6" }} /> Invite Co-Hosts
                </h3>
                <button onClick={() => setShowCoHostInvite(false)} className="cursor-pointer">
                  <X className="h-5 w-5" style={{ color: "#9CA3AF" }} />
                </button>
              </div>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Co-hosts can help manage this event, view guest lists, and send communications.
              </p>
              <div className="flex gap-2">
                <Input
                  value={coHostEmail}
                  onChange={e => setCoHostEmail(e.target.value)}
                  placeholder="co-host@example.com"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const trimmed = coHostEmail.trim().toLowerCase();
                      if (!trimmed || !trimmed.includes("@")) { toast.error("Enter a valid email"); return; }
                      createCollab.mutateAsync({
                        invited_email: trimmed,
                        role: "editor",
                        project_ids: [projectId],
                      }).then(() => {
                        toast.success(`${trimmed} invited as co-host`);
                        setCoHostEmail("");
                      }).catch((err: any) => toast.error(err.message || "Failed to invite"));
                    }
                  }}
                  className="flex-1"
                />
                <button
                  disabled={createCollab.isPending}
                  onClick={() => {
                    const trimmed = coHostEmail.trim().toLowerCase();
                    if (!trimmed || !trimmed.includes("@")) { toast.error("Enter a valid email"); return; }
                    createCollab.mutateAsync({
                      invited_email: trimmed,
                      role: "editor",
                      project_ids: [projectId],
                    }).then(() => {
                      toast.success(`${trimmed} invited as co-host`);
                      setCoHostEmail("");
                    }).catch((err: any) => toast.error(err.message || "Failed to invite"));
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-white text-sm cursor-pointer"
                  style={{ background: "#8B5CF6", minHeight: 44 }}
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {coHosts.length > 0 && (
                <div className="space-y-1 pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
                  {coHosts.map((host) => (
                    <div key={host.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                      onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(139,92,246,0.1)", color: "#8B5CF6", fontSize: 12, fontWeight: 600 }}>
                        {host.invited_email.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm truncate" style={{ color: "#1F2937" }}>{host.invited_email}</span>
                      <button
                        onClick={() => { deleteCollab.mutate(host.id); toast.success("Co-host removed"); }}
                        className="p-1 transition-colors cursor-pointer"
                        style={{ color: "#9CA3AF" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={() => setShowCoHostInvite(false)} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ border: "1.5px solid #E5E7EB", color: "#1F2937", minHeight: 44 }}>Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
