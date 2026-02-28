import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Users, Copy, Mail, Send, MapPin, Calendar, Clock,
  CheckCircle, HelpCircle, XCircle, Eye, X, Globe, Lock,
  Trash2, ExternalLink, Plus, Crown, UserPlus,
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

interface Props {
  projectId: string;
  projectName: string;
  coverImage?: string | null;
}

export default function EventDetailView({ projectId, projectName, coverImage }: Props) {
  const { data: event } = useEventDetails(projectId);
  const { data: guests = [] } = useEventGuests(event?.id);
  const { data: questions = [] } = useRsvpQuestions(event?.id);
  const addGuests = useAddEventGuests();
  const deleteGuest = useDeleteEventGuest();
  const { user } = useAuth();

  // Co-hosts (collaborators scoped to this project)
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
    toast.success("Event link copied!");
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

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden">
        <div
          className="h-[200px] w-full"
          style={{
            background: coverImage
              ? `url(${coverImage}) center/cover`
              : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.6) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Badge className="mb-2 capitalize bg-background/20 text-background border-0">
            {eventType}
          </Badge>
          <h1 className="text-3xl font-bold text-background mb-2">{projectName}</h1>
          <div className="flex items-center gap-4 text-background/80 text-sm">
            {event.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}
              </span>
            )}
            {event.event_date && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {format(new Date(event.event_date), "h:mm a")}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Share & Actions Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          <Copy className="h-4 w-4 mr-1" /> Copy Link
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowCoHostInvite(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Invite Co-Hosts
        </Button>
        <Button variant="outline" size="sm" onClick={() => openEmailComposer("all")}>
          <Mail className="h-4 w-4 mr-1" /> Email All Guests
        </Button>
        <Button variant="outline" size="sm" onClick={() => openEmailComposer("accepted")}>
          <Send className="h-4 w-4 mr-1" /> Email Accepted
        </Button>
        <Badge variant="secondary" className="ml-auto">
          {event.privacy === "public" ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
          {event.privacy === "public" ? "Public" : "Private"}
        </Badge>
      </div>

      {/* Co-Hosts Section */}
      {coHosts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" /> Co-Hosts
          </h3>
          <div className="space-y-2">
            {coHosts.map((host) => (
              <div key={host.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary/30 transition-colors">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                  {host.invited_email.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-foreground truncate">{host.invited_email}</span>
                <Badge variant="secondary" className="text-[10px] capitalize">{host.status}</Badge>
                <button
                  onClick={() => { deleteCollab.mutate(host.id); toast.success("Co-host removed"); }}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {event.description && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">About</h3>
          <p className="text-foreground whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Guest Management Dashboard */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Guest List
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{counts.total} invited</span>
              <span className="text-green-500">{counts.accepted} accepted</span>
              <span className="text-yellow-500">{counts.pending} pending</span>
              <span className="text-red-500">{counts.declined} declined</span>
              <span className="text-blue-500">{counts.viewed} viewed</span>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowAddGuests(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Guests
          </Button>
        </div>

        {/* Guest Rows */}
        <div className="divide-y divide-border">
          {guests.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No guests yet. Add emails to get started.</p>
            </div>
          )}
          {guests.map(guest => {
            const config = STATUS_CONFIG[guest.status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            return (
              <div key={guest.id} className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition">
                <StatusIcon className={cn("h-5 w-5 shrink-0", config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {guest.name || guest.email}
                  </p>
                  {guest.name && <p className="text-xs text-muted-foreground">{guest.email}</p>}
                  {guest.viewed_at && (
                    <p className="text-xs text-muted-foreground">
                      Viewed {formatDistanceToNow(new Date(guest.viewed_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className={cn("text-xs capitalize", config.color)}>
                  {config.label}
                </Badge>
                <button
                  onClick={() => { deleteGuest.mutate(guest.id); toast.success("Guest removed"); }}
                  className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* RSVP Info */}
        {event.rsvp_deadline && (
          <div className="p-4 border-t border-border bg-secondary/30">
            <p className="text-xs text-muted-foreground">
              RSVP Deadline: {format(new Date(event.rsvp_deadline), "MMMM d, yyyy")}
              {isPast(new Date(event.rsvp_deadline)) && (
                <span className="text-destructive ml-2">• Expired</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Add Guests Modal */}
      <AnimatePresence>
        {showAddGuests && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setShowAddGuests(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Guests</h3>
                <button onClick={() => setShowAddGuests(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <Textarea
                value={newEmails}
                onChange={e => setNewEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                rows={4}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowAddGuests(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddGuests} className="flex-1">Add Guests</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Composer Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-card border border-primary/20 p-6 shadow-xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" /> Email Guests
                </h3>
                <button onClick={() => setShowEmailModal(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
                Sending to: {emailFilter === "accepted" ? `${counts.accepted} accepted guests` : `${counts.total} guests`}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Template</Label>
                <select
                  value={emailTemplate}
                  onChange={e => {
                    const idx = Number(e.target.value);
                    setEmailTemplate(idx);
                    const tpl = EMAIL_TEMPLATES[idx];
                    const dateStr = event.event_date ? format(new Date(event.event_date), "MMMM d, yyyy") : "TBD";
                    setEmailBody(tpl.body(projectName, dateStr));
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {EMAIL_TEMPLATES.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Message</Label>
                <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowEmailModal(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSendEmail} className="flex-1">
                  <Send className="h-4 w-4 mr-1" /> Open Email Client
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Co-Host Invite Modal */}
      <AnimatePresence>
        {showCoHostInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setShowCoHostInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Invite Co-Hosts
                </h3>
                <button onClick={() => setShowCoHostInvite(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
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
                <Button
                  size="sm"
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
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              {/* Current co-hosts */}
              {coHosts.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border">
                  {coHosts.map((host) => (
                    <div key={host.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary/30 transition-colors">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                        {host.invited_email.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm text-foreground truncate">{host.invited_email}</span>
                      <button
                        onClick={() => { deleteCollab.mutate(host.id); toast.success("Co-host removed"); }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowCoHostInvite(false)}>Done</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
