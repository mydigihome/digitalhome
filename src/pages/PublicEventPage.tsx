import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Calendar, Clock, MapPin, CheckCircle, XCircle, HelpCircle,
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
      {/* Cover Image / Header */}
      <div className="relative w-full h-[220px] sm:h-[280px]">
        <div
          className="absolute inset-0"
          style={{
            background: event.projects.cover_image
              ? `url(${event.projects.cover_image}) center/cover`
              : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.6) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content Card */}
      <div className="max-w-xl mx-auto px-4 -mt-20 relative z-10 pb-12">
        <div className="rounded-2xl border border-border bg-card shadow-lg p-6 space-y-5">
          {/* Event Type Badge */}
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
            {eventType}
          </span>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground">{event.projects.name}</h1>

          {/* Date, Time, Location */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {event.event_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}</span>
              </div>
            )}
            {event.event_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{format(new Date(event.event_date), "h:mm a")}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* RSVP */}
          <div className="space-y-3 pt-2">
            {!submitted ? (
              <Button onClick={() => setShowRsvp(!showRsvp)} className="w-full" size="lg">
                RSVP Now
              </Button>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-2" />
                <p className="text-lg font-semibold text-foreground">You're In!</p>
                <p className="text-sm text-muted-foreground">The host has been notified.</p>
              </div>
            )}
          </div>

          {/* Inline RSVP Form */}
          {showRsvp && !submitted && (
            <div className="space-y-4 pt-4 border-t border-border">
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

              <Button onClick={handleSubmit} className="w-full" size="lg">
                Submit RSVP
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Digital Home
        </p>
      </div>
    </div>
  );
}
