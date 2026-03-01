import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Calendar, MapPin, Users, Clock, Image, Plus, X, Mail,
  Globe, Lock, ChevronRight, ChevronDown, Camera, Link2, Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { useCreateProject } from "@/hooks/useProjects";
import { useUpsertEventDetails, useAddEventGuests, useCreateRsvpQuestion } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const EVENT_TYPES = [
  { value: "dinner_party", label: "Dinner Party", emoji: "🍽️" },
  { value: "book_club", label: "Book Club", emoji: "📚" },
  { value: "sorority_event", label: "Sorority Event", emoji: "💜" },
  { value: "trip", label: "Trip", emoji: "✈️" },
  { value: "workshop", label: "Workshop", emoji: "🎨" },
  { value: "birthday", label: "Birthday", emoji: "🎂" },
  { value: "other", label: "Other", emoji: "🎯" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateEventModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createProject = useCreateProject();
  const upsertEvent = useUpsertEventDetails();
  const addGuests = useAddEventGuests();
  const createQuestion = useCreateRsvpQuestion();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    event_type: "other",
    event_date: "",
    event_time: "",
    location: "",
    location_type: "physical" as "physical" | "virtual",
    description: "",
    cover_image: "",
    guest_emails: "",
    rsvp_deadline: "",
    privacy: "private",
    rsvp_questions: [] as string[],
    shared_album_enabled: false,
    external_link_url: "",
    external_link_label: "",
    playlist_url: "",
  });
  const [newQuestion, setNewQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const path = `${user.id}/event-cover-${Date.now()}`;
    const { error } = await supabase.storage.from("user-assets").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("user-assets").getPublicUrl(path);
    setForm(p => ({ ...p, cover_image: publicUrl }));
    toast.success("Cover uploaded");
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Event name is required"); return; }
    setSubmitting(true);
    try {
      const project = await createProject.mutateAsync({
        name: form.name,
        type: "event",
        view_preference: "kanban",
        start_date: form.event_date || undefined,
      });

      const eventDateTime = form.event_date && form.event_time
        ? new Date(`${form.event_date}T${form.event_time}`).toISOString()
        : form.event_date ? new Date(form.event_date).toISOString() : null;

      const eventDetails = await upsertEvent.mutateAsync({
        project_id: project.id,
        event_date: eventDateTime,
        location: form.location || null,
        location_type: form.location_type,
        description: form.description || null,
        rsvp_deadline: form.rsvp_deadline ? new Date(form.rsvp_deadline).toISOString() : null,
        privacy: form.privacy,
        event_type: form.event_type,
        shared_album_enabled: form.shared_album_enabled,
        external_link_url: form.external_link_url || null,
        external_link_label: form.external_link_label || null,
        playlist_url: form.playlist_url || null,
      });

      if (form.cover_image) {
        await supabase.from("projects").update({
          cover_image: form.cover_image,
          cover_type: "image",
        }).eq("id", project.id);
      }

      const emails = form.guest_emails
        .split(/[,;\n]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes("@"));
      if (emails.length > 0 && eventDetails) {
        await addGuests.mutateAsync(
          emails.map(email => ({ event_id: eventDetails.id, email }))
        );
      }

      if (eventDetails) {
        for (let i = 0; i < form.rsvp_questions.length; i++) {
          await createQuestion.mutateAsync({
            event_id: eventDetails.id,
            question_text: form.rsvp_questions[i],
            position: i,
          });
        }
      }

      toast.success("Event created!");
      onClose();
      navigate(`/project/${project.id}`);
    } catch (err) {
      toast.error("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const steps = [
    // Step 0: Basic Info
    <div className="space-y-4" key="basic">
      <div className="space-y-2">
        <Label>Event Name *</Label>
        <Input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="My Amazing Event"
          className="text-lg"
        />
      </div>
      <div className="space-y-2">
        <Label>Event Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setForm(p => ({ ...p, event_type: t.value }))}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 text-sm transition-all",
                form.event_type === t.value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              )}
            >
              <span className="text-lg">{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // Step 1: Date, Location, Cover + Collapsible Extras
    <div className="space-y-4" key="details">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Time</Label>
          <Input type="time" value={form.event_time} onChange={e => setForm(p => ({ ...p, event_time: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setForm(p => ({ ...p, location_type: "physical" }))}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs border transition",
              form.location_type === "physical" ? "border-primary bg-primary/5" : "border-border")}
          >
            <MapPin className="h-3.5 w-3.5" /> Physical
          </button>
          <button
            onClick={() => setForm(p => ({ ...p, location_type: "virtual" }))}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs border transition",
              form.location_type === "virtual" ? "border-primary bg-primary/5" : "border-border")}
          >
            <Globe className="h-3.5 w-3.5" /> Virtual
          </button>
        </div>
        <Input
          value={form.location}
          onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          placeholder={form.location_type === "virtual" ? "Zoom/Meet link" : "123 Main St, City"}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What's this event about?" />
      </div>
      <div className="space-y-2">
        <Label>Cover Image</Label>
        {form.cover_image ? (
          <div className="relative rounded-lg overflow-hidden h-32">
            <img src={form.cover_image} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setForm(p => ({ ...p, cover_image: "" }))} className="absolute top-2 right-2 p-1 rounded-full bg-foreground/50 text-background hover:bg-foreground/70">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button onClick={() => coverInputRef.current?.click()} className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary transition flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Image className="h-5 w-5" /> Upload cover image
          </button>
        )}
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      </div>

      {/* Collapsible Additional Options */}
      <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">
          {extrasOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Additional Options
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4">
          {/* Shared Album Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <Camera className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">📸 Shared Album</p>
                <p className="text-xs text-muted-foreground">Guests can share event photos</p>
              </div>
            </div>
            <Switch
              checked={form.shared_album_enabled}
              onCheckedChange={v => setForm(p => ({ ...p, shared_album_enabled: v }))}
            />
          </div>

          {/* External Link */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">🔗 Event Link</p>
            </div>
            <Input
              value={form.external_link_label}
              onChange={e => setForm(p => ({ ...p, external_link_label: e.target.value }))}
              placeholder="Link label (e.g., Event Website)"
              className="text-sm"
            />
            <Input
              value={form.external_link_url}
              onChange={e => setForm(p => ({ ...p, external_link_url: e.target.value }))}
              placeholder="https://..."
              className="text-sm"
            />
          </div>

          {/* Playlist */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">🎵 Playlist</p>
            </div>
            <Input
              value={form.playlist_url}
              onChange={e => setForm(p => ({ ...p, playlist_url: e.target.value }))}
              placeholder="https://open.spotify.com/... or Apple Music link"
              className="text-sm"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>,

    // Step 2: Guests & RSVP
    <div className="space-y-4" key="guests">
      <div className="space-y-2">
        <Label>Guest Emails</Label>
        <Textarea
          value={form.guest_emails}
          onChange={e => setForm(p => ({ ...p, guest_emails: e.target.value }))}
          placeholder="email1@example.com, email2@example.com"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">Separate emails with commas, semicolons, or new lines</p>
      </div>
      <div className="space-y-2">
        <Label>RSVP Deadline</Label>
        <Input type="date" value={form.rsvp_deadline} onChange={e => setForm(p => ({ ...p, rsvp_deadline: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Privacy</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setForm(p => ({ ...p, privacy: "private" }))}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-2 text-sm border transition flex-1",
              form.privacy === "private" ? "border-primary bg-primary/5" : "border-border")}
          >
            <Lock className="h-4 w-4" /> Private (invite only)
          </button>
          <button
            onClick={() => setForm(p => ({ ...p, privacy: "public" }))}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-2 text-sm border transition flex-1",
              form.privacy === "public" ? "border-primary bg-primary/5" : "border-border")}
          >
            <Globe className="h-4 w-4" /> Public link
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Custom RSVP Questions (optional)</Label>
        {form.rsvp_questions.map((q, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm text-foreground flex-1 rounded-md border border-border px-3 py-2 bg-secondary/50">{q}</span>
            <button onClick={() => setForm(p => ({ ...p, rsvp_questions: p.rsvp_questions.filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="e.g. Any dietary restrictions?" onKeyDown={e => {
            if (e.key === "Enter" && newQuestion.trim()) {
              setForm(p => ({ ...p, rsvp_questions: [...p.rsvp_questions, newQuestion.trim()] }));
              setNewQuestion("");
            }
          }} />
          <Button variant="outline" size="sm" onClick={() => {
            if (newQuestion.trim()) {
              setForm(p => ({ ...p, rsvp_questions: [...p.rsvp_questions, newQuestion.trim()] }));
              setNewQuestion("");
            }
          }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>,
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-[580px] max-h-[85vh] overflow-y-auto rounded-2xl bg-card border border-primary/20 p-6 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Create Event</h2>
              <p className="text-sm text-muted-foreground">Step {step + 1} of {steps.length}</p>
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= step ? "bg-primary" : "bg-secondary")} />
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {steps[step]}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-border">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => {
                if (step === 0 && !form.name.trim()) { toast.error("Event name is required"); return; }
                setStep(s => s + 1);
              }} className="flex-1">
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? "Creating..." : "Create Event"}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
