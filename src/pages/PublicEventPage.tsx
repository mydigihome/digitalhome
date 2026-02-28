import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Calendar, Clock, MapPin, CheckCircle, XCircle, HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventData {
  id: string;
  event_date: string | null;
  location: string | null;
  location_type: string;
  description: string | null;
  rsvp_deadline: string | null;
  privacy: string;
  event_type: string;
  projects: { name: string; cover_image: string | null; cover_type: string | null };
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
}

export default function PublicEventPage() {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  const handleAddToCalendar = () => {
    if (!event?.event_date) return;
    const start = new Date(event.event_date);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.projects.name)}&dates=${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z&location=${encodeURIComponent(event.location || "")}&details=${encodeURIComponent(event.description || "")}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
          <p className="text-muted-foreground">This event may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const eventType = event.event_type?.replace("_", " ") || "Event";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative w-full h-[300px]">
        <div
          className="absolute inset-0"
          style={{
            background: event.projects.cover_image
              ? `url(${event.projects.cover_image}) center/cover`
              : "linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(262 83% 40%) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Event Info Card */}
          <div className="rounded-2xl bg-card border border-border shadow-lg p-8 mb-6">
            <span className="text-xs font-medium uppercase tracking-wider text-primary capitalize">{eventType}</span>
            <h1 className="text-3xl font-bold text-foreground mt-1 mb-4">{event.projects.name}</h1>

            <div className="space-y-3 mb-6">
              {event.event_date && (
                <div className="flex items-center gap-3 text-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>{format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}</span>
                </div>
              )}
              {event.event_date && (
                <div className="flex items-center gap-3 text-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{format(new Date(event.event_date), "h:mm a")}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-muted-foreground whitespace-pre-wrap mb-6">{event.description}</p>
            )}

            {event.event_date && (
              <Button variant="outline" size="sm" onClick={handleAddToCalendar}>
                <ExternalLink className="h-4 w-4 mr-1" /> Add to Google Calendar
              </Button>
            )}
          </div>

          {/* RSVP Form */}
          {!submitted ? (
            <div className="rounded-2xl bg-card border border-border shadow-lg p-8">
              <h2 className="text-xl font-bold text-foreground mb-4">RSVP</h2>

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
                          "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                          form.status === opt.value ? opt.color : "border-border hover:border-primary/30"
                        )}
                      >
                        <opt.icon className={cn("h-6 w-6", form.status === opt.value ? "" : "text-muted-foreground")} />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Questions */}
                {questions.map(q => (
                  <div key={q.id} className="space-y-2">
                    <Label>{q.question_text}</Label>
                    <Input
                      value={form.answers[q.id] || ""}
                      onChange={e => setForm(p => ({ ...p, answers: { ...p.answers, [q.id]: e.target.value } }))}
                    />
                  </div>
                ))}

                <Button onClick={handleSubmit} className="w-full" size="lg">
                  Submit RSVP
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-card border border-border shadow-lg p-8 text-center"
            >
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
              <h2 className="text-xl font-bold text-foreground mb-2">Thanks for your RSVP!</h2>
              <p className="text-muted-foreground">The host has been notified. See you there!</p>
            </motion.div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-8 pb-8">
            Powered by Digital Home
          </p>
        </motion.div>
      </div>
    </div>
  );
}
