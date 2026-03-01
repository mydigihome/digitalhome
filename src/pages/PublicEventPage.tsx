import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Calendar, Clock, MapPin, CheckCircle, XCircle, HelpCircle,
  ExternalLink, Send, Music, Link2, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AddToCalendarButton from "@/components/events/AddToCalendarButton";

interface EventData {
  id: string;
  event_date: string | null;
  location: string | null;
  location_type: string;
  description: string | null;
  rsvp_deadline: string | null;
  privacy: string;
  event_type: string;
  external_link_url: string | null;
  external_link_label: string | null;
  playlist_url: string | null;
  shared_album_enabled: boolean;
  background_style: string;
  projects: { name: string; cover_image: string | null; cover_type: string | null };
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
}

const APPLE_GRADIENT = "linear-gradient(135deg, #FF6B35 0%, #F72585 25%, #7209B7 50%, #3A0CA3 75%, #4361EE 100%)";

export default function PublicEventPage() {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showRsvp, setShowRsvp] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    status: "" as "" | "accepted" | "declined" | "maybe",
    answers: {} as Record<string, string>,
  });

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/event-rsvp`;

  useEffect(() => {
    if (!token) return;
    fetch(`${baseUrl}?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else {
          setEvent(data.event);
          setQuestions(data.questions || []);
        }
      })
      .catch(() => setError("Failed to load event"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!form.email || !form.status) {
      toast.error("Please enter your email and select your response");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_email: form.email,
          status: form.status,
          name: form.name,
          answers: form.answers,
        }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setSubmitted(true);
      toast.success("RSVP submitted!");
    } catch {
      toast.error("Failed to submit RSVP");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Event Not Found</h1>
          <p className="text-white/60">This event may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const eventType = event.event_type?.replace("_", " ") || "Event";
  const bgStyle = event.projects.cover_image
    ? { backgroundImage: `url(${event.projects.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: APPLE_GRADIENT };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#000" }}>
      {/* Full-screen background */}
      <div className="fixed inset-0 z-0" style={bgStyle} />
      <div className="fixed inset-0 z-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero - takes up most of the screen */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/80 mb-6">
              {eventType}
            </span>
            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-4 tracking-tight leading-[1.1]">
              {event.projects.name}
            </h1>

            {/* Date & Location */}
            <div className="flex flex-col items-center gap-2 mt-6">
              {event.event_date && (
                <p className="text-lg sm:text-xl text-white/90 font-light">
                  {format(new Date(event.event_date), "EEEE, MMMM d, yyyy · h:mm a")}
                </p>
              )}
              {event.location && (
                <p className="text-base text-white/70 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {event.location}
                </p>
              )}
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-3"
          >
            <Button
              size="lg"
              onClick={() => setShowRsvp(true)}
              className="bg-white text-black hover:bg-white/90 rounded-full px-8 text-base font-semibold shadow-2xl"
            >
              RSVP Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const subject = encodeURIComponent(`About ${event.projects.name}`);
                const body = encodeURIComponent(`Hi! I wanted to reach out about ${event.projects.name}.\n\n`);
                window.open(`mailto:?subject=${subject}&body=${body}`);
              }}
              className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 text-base backdrop-blur-sm"
            >
              <Send className="h-4 w-4 mr-2" /> Send a Note
            </Button>
          </motion.div>
        </div>

        {/* Bottom info section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="px-4 pb-8 max-w-2xl mx-auto w-full space-y-4"
        >
          {/* Description card */}
          {event.description && (
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-6">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">About</h3>
              <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Extra tiles */}
          <div className="flex flex-col gap-3">
            {event.external_link_url && (
              <a
                href={event.external_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-4 hover:bg-white/15 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{event.external_link_label || "Event Link"}</p>
                  <p className="text-xs text-white/50 truncate">{event.external_link_url}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-white/40" />
              </a>
            )}

            {event.playlist_url && (
              <a
                href={event.playlist_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-4 hover:bg-white/15 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Music className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Event Playlist</p>
                  <p className="text-xs text-white/50">Tap to listen</p>
                </div>
                <ExternalLink className="h-4 w-4 text-white/40" />
              </a>
            )}

            {event.shared_album_enabled && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Shared Album</p>
                  <p className="text-xs text-white/50">Photos will be available after the event</p>
                </div>
              </div>
            )}
          </div>

          {/* Add to Calendar */}
          <div className="pt-2">
            <AddToCalendarButton
              eventName={event.projects.name}
              eventDate={event.event_date}
              location={event.location}
              description={event.description}
            />
          </div>

          <p className="text-center text-xs text-white/30 pt-4">
            Powered by Digital Home
          </p>
        </motion.div>
      </div>

      {/* RSVP Modal */}
      {showRsvp && !submitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowRsvp(false)}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-6 sm:hidden" />
            <h2 className="text-2xl font-bold text-foreground mb-6">RSVP</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
              </div>

              <div className="space-y-2">
                <Label>Will you attend? *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "accepted", label: "Yes", icon: CheckCircle, color: "text-green-500 border-green-500 bg-green-500/5" },
                    { value: "declined", label: "No", icon: XCircle, color: "text-red-500 border-red-500 bg-red-500/5" },
                    { value: "maybe", label: "Maybe", icon: HelpCircle, color: "text-yellow-500 border-yellow-500 bg-yellow-500/5" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(p => ({ ...p, status: opt.value as any }))}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                        form.status === opt.value ? opt.color : "border-border hover:border-primary/30"
                      )}
                    >
                      <opt.icon className={cn("h-6 w-6", form.status === opt.value ? "" : "text-muted-foreground")} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {questions.map(q => (
                <div key={q.id} className="space-y-2">
                  <Label>{q.question_text}</Label>
                  <Input
                    value={form.answers[q.id] || ""}
                    onChange={e => setForm(p => ({ ...p, answers: { ...p.answers, [q.id]: e.target.value } }))}
                  />
                </div>
              ))}

              <Button onClick={handleSubmit} className="w-full rounded-full" size="lg">
                Submit RSVP
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Success State */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-2xl"
          >
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">You're In!</h2>
            <p className="text-muted-foreground mb-6">The host has been notified. See you there!</p>
            <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-full">
              Done
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
