import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Users, Copy, Mail, Send, MapPin, Calendar, Clock,
  CheckCircle, HelpCircle, XCircle, Eye, X, Globe, Lock,
  Trash2, ExternalLink, Plus, Crown, UserPlus, ChevronLeft, Link,
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
}

export default function EventDetailView({ projectId, projectName, coverImage }: Props) {
  const navigate = useNavigate();
  const { data: event } = useEventDetails(projectId);
  const { data: guests = [] } = useEventGuests(event?.id);
  const { data: questions = [] } = useRsvpQuestions(event?.id);
  const addGuests = useAddEventGuests();
  const deleteGuest = useDeleteEventGuest();
  const { user } = useAuth();

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

  if (!event) return null;

  const counts = {
    total: guests.length,
    accepted: guests.filter(g => g.status === "accepted").length,
    pending: guests.filter(g => g.status === "pending").length,
    declined: guests.filter(g => g.status === "declined").length,
    viewed: guests.filter(g => g.status === "viewed").length,
  };

  const shareUrl = `${window.location.origin}/events/${event.share_token}`;

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
    await addGuests.mutateAsync(emails.map(email => ({ event_id: event.id, email })));
    setNewEmails("");
    setShowAddGuests(false);
    toast.success(`${emails.length} guest(s) added`);
  };

  const openEmailComposer = (filter: "all" | "accepted") => {
    setEmailFilter(filter);
    const tpl = EMAIL_TEMPLATES[0];
    const dateStr = event.event_date ? format(new Date(event.event_date), "MMMM d, yyyy") : "TBD";
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

  const eventType = event.event_type?.replace("_", " ") || "Event";
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

        {/* Dark Overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)", zIndex: 1 }} />

        {/* Back Button */}
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

        {/* Event Type Badge */}
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

        {/* Event Title */}
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
        {event.event_date && (
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
                {format(new Date(event.event_date), "EEEE, MMMM d, yyyy")} • {format(new Date(event.event_date), "h:mm a")}
              </p>
            </div>
          </motion.div>
        )}

        {event.location && (
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
              <p className="font-semibold" style={{ fontSize: 16, color: "#1F2937", lineHeight: 1.4 }}>{event.location}</p>
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
        {event.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...staggerDelay(3), duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: "0.8px", color: "#9CA3AF", margin: "32px 0 16px" }}>About</p>
            <div style={{ background: "white", border: "1.5px solid #F3F4F6", borderRadius: 16, padding: 20, fontSize: 15, color: "#4B5563", lineHeight: 1.7, whiteSpace: "pre-wrap" as const }}>
              {event.description}
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

              {/* Counts Row */}
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

          {/* RSVP Deadline */}
          {event.rsvp_deadline && (
            <p className="text-center mt-6" style={{ fontSize: 13, color: "#9CA3AF" }}>
              RSVP Deadline: {format(new Date(event.rsvp_deadline), "MMMM d, yyyy")}
              {isPast(new Date(event.rsvp_deadline)) && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>Expired</span>
              )}
            </p>
          )}
        </motion.div>

        {/* ═══ DELETE SECTION ═══ */}
        <div className="text-center" style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #F3F4F6" }}>
          <button
            className="cursor-pointer transition-all duration-200"
            style={{ background: "transparent", border: "none", fontSize: 15, fontWeight: 600, color: "#EF4444", padding: "12px 24px", borderRadius: 8 }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Delete Event
          </button>
        </div>
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
                <button onClick={() => setShowAddGuests(false)} className="flex-1 cursor-pointer transition-all py-2.5 rounded-xl font-semibold" style={{ border: "1.5px solid #E5E7EB", color: "#1F2937", fontSize: 14 }}>Cancel</button>
                <button onClick={handleAddGuests} className="flex-1 cursor-pointer transition-all py-2.5 rounded-xl font-semibold text-white" style={{ background: "#8B5CF6", fontSize: 14 }}>Add Guests</button>
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
                    const dateStr = event.event_date ? format(new Date(event.event_date), "MMMM d, yyyy") : "TBD";
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
                <button onClick={() => setShowEmailModal(false)} className="flex-1 cursor-pointer transition-all py-2.5 rounded-xl font-semibold" style={{ border: "1.5px solid #E5E7EB", color: "#1F2937", fontSize: 14 }}>Cancel</button>
                <button onClick={handleSendEmail} className="flex-1 cursor-pointer transition-all py-2.5 rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2" style={{ background: "#8B5CF6", fontSize: 14 }}>
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
                  style={{ background: "#8B5CF6" }}
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
                <button onClick={() => setShowCoHostInvite(false)} className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ border: "1.5px solid #E5E7EB", color: "#1F2937" }}>Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
