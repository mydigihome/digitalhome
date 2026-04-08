import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Calendar, MapPin, Users, Clock, Image, Plus, X, Mail,
  Globe, Lock, ChevronRight,
  UtensilsCrossed, BookOpen, Heart, Plane, Palette, Cake, Target, PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useProjects";
import { useUpsertEventDetails, useAddEventGuests, useCreateRsvpQuestion } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const EVENT_TYPES = [
  { Icon: UtensilsCrossed, label: "Dinner Party", value: "dinner_party" },
  { Icon: BookOpen, label: "Book Club", value: "book_club" },
  { Icon: Heart, label: "Sorority Event", value: "sorority_event" },
  { Icon: Plane, label: "Trip", value: "trip" },
  { Icon: Palette, label: "Workshop", value: "workshop" },
  { Icon: Cake, label: "Birthday", value: "birthday" },
  { Icon: PartyPopper, label: "Party", value: "party" },
  { Icon: Target, label: "Other", value: "other" },
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
  const isDark = document.documentElement.classList.contains("dark");

  const [step, setStep] = useState(0);
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

  const [aiStages, setAiStages] = useState<{ task: string; description: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [aiTriggered, setAiTriggered] = useState(false);

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

      setCreatedProjectId(project.id);
      setStep(3); // Move to Step 4 (AI generation)
    } catch (err) {
      toast.error("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-trigger AI generation when step 4 is shown
  useEffect(() => {
    if (step === 3 && !aiTriggered && createdProjectId) {
      setAiTriggered(true);
      generateAIEventStages();
    }
  }, [step, aiTriggered, createdProjectId]);

  const generateAIEventStages = async () => {
    setAiLoading(true);
    try {
      const guestEmails = form.guest_emails.split(/[,;\n]+/).filter(e => e.trim() && e.includes("@"));
      const guestCount = guestEmails.length || "unknown number of";
      const eventDate = form.event_date
        ? new Date(form.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "TBD";
      const eventTypeName = EVENT_TYPES.find(t => t.value === form.event_type)?.label || form.event_type;

      const prompt = `Generate exactly 5 specific preparation tasks for the following event:
- Event name: ${form.name}
- Event type: ${eventTypeName}
- Date: ${eventDate}
- Location: ${form.location || "TBD"}
- Guest count: ${guestCount}
${form.description ? `- Description: ${form.description}` : ""}
The tasks must be specific to THIS type of event. A birthday party needs different prep than a business conference or a dinner party. Return a JSON array of exactly 5 objects: [{"task":"string","description":"string"}]`;

      const { data } = await supabase.functions.invoke("generate-trading-plan", { body: { prompt } });
      const text = data?.plan || "";
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(text.substring(start, end + 1));
        if (Array.isArray(parsed)) {
          const stages = parsed.slice(0, 5);
          setAiStages(stages);

          const tasks = stages.map((s: any, i: number) => ({
            project_id: createdProjectId,
            user_id: user!.id,
            title: s.task || s.title,
            description: s.description || null,
            status: "backlog",
            priority: "medium",
            position: i,
          }));
          await supabase.from("tasks").insert(tasks);
        }
      }
    } catch (e) {
      console.error("AI stage generation error:", e);
    } finally {
      setAiLoading(false);
    }
  };

  if (!open) return null;

  const purple = "#7B5EA7";
  const purpleLight = isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF";
  const purpleBorder = purple;

  const steps = [
    // Step 0: Basic Info
    <div className="space-y-4" key="basic">
      <div className="space-y-2">
        <Label>Event Name *</Label>
        <Input
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="My Amazing Event"
          className="text-lg focus-visible:border-[#7B5EA7] focus-visible:ring-[#7B5EA7]/10"
        />
      </div>
      <div className="space-y-2">
        <Label>Event Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map(t => {
            const selected = form.event_type === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setForm(p => ({ ...p, event_type: t.value }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px 16px",
                  border: "1.5px solid",
                  borderColor: selected ? purpleBorder : (isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"),
                  borderRadius: "10px",
                  background: selected ? purpleLight : (isDark ? "#252528" : "white"),
                  cursor: "pointer",
                  textAlign: "left" as const,
                  transition: "all 150ms",
                  width: "100%",
                }}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: selected ? purple : (isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 150ms", flexShrink: 0,
                }}>
                  <t.Icon size={16} color={selected ? "white" : (isDark ? "rgba(255,255,255,0.5)" : "#6B7280")} />
                </div>
                <span style={{
                  fontSize: "13px", fontWeight: selected ? "600" : "400",
                  color: selected ? (isDark ? "#E9D5FF" : "#5B21B6") : (isDark ? "#F2F2F2" : "#374151"),
                  fontFamily: "Inter, sans-serif",
                }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,

    // Step 1: Date, Location, Cover
    <div className="space-y-4" key="details">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} className="focus-visible:border-[#7B5EA7] focus-visible:ring-[#7B5EA7]/10" />
        </div>
        <div className="space-y-2">
          <Label>Time</Label>
          <Input type="time" value={form.event_time} onChange={e => setForm(p => ({ ...p, event_time: e.target.value }))} className="focus-visible:border-[#7B5EA7] focus-visible:ring-[#7B5EA7]/10" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setForm(p => ({ ...p, location_type: "physical" }))}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", borderRadius: "6px", fontSize: "12px",
              border: `1px solid ${form.location_type === "physical" ? purple : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`,
              background: form.location_type === "physical" ? purpleLight : "transparent",
              color: form.location_type === "physical" ? purple : (isDark ? "#F2F2F2" : "#374151"),
              cursor: "pointer", transition: "all 150ms",
            }}
          >
            <MapPin size={14} /> Physical
          </button>
          <button
            onClick={() => setForm(p => ({ ...p, location_type: "virtual" }))}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", borderRadius: "6px", fontSize: "12px",
              border: `1px solid ${form.location_type === "virtual" ? purple : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`,
              background: form.location_type === "virtual" ? purpleLight : "transparent",
              color: form.location_type === "virtual" ? purple : (isDark ? "#F2F2F2" : "#374151"),
              cursor: "pointer", transition: "all 150ms",
            }}
          >
            <Globe size={14} /> Virtual
          </button>
        </div>
        <Input
          value={form.location}
          onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          placeholder={form.location_type === "virtual" ? "Zoom/Meet link" : "123 Main St, City"}
          className="focus-visible:border-[#7B5EA7] focus-visible:ring-[#7B5EA7]/10"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What's this event about?" className="focus-visible:border-[#7B5EA7] focus-visible:ring-[#7B5EA7]/10" />
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
          <button
            onClick={() => coverInputRef.current?.click()}
            style={{
              width: "100%", height: "96px", borderRadius: "8px",
              border: `2px dashed ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              fontSize: "14px", color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
              cursor: "pointer", transition: "border 150ms", background: "transparent",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = purple; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"; }}
          >
            <Image size={20} /> Upload cover image
          </button>
        )}
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      </div>
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
          className="focus-visible:border-[#7B5EA7] focus-visible:ring-[#7B5EA7]/10"
        />
        <p className="text-xs text-muted-foreground">Separate emails with commas, semicolons, or new lines</p>
      </div>
      <div className="space-y-2">
        <Label>RSVP Deadline</Label>
        <Input type="date" value={form.rsvp_deadline} onChange={e => setForm(p => ({ ...p, rsvp_deadline: e.target.value }))} className="focus-visible:border-[#7B5EA7] focus-visible:ring-[#7B5EA7]/10" />
      </div>
      <div className="space-y-2">
        <Label>Privacy</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setForm(p => ({ ...p, privacy: "private" }))}
            style={{
              display: "flex", alignItems: "center", gap: "6px", flex: 1,
              padding: "8px 12px", borderRadius: "6px", fontSize: "13px",
              border: `1px solid ${form.privacy === "private" ? purple : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`,
              background: form.privacy === "private" ? purpleLight : "transparent",
              color: form.privacy === "private" ? purple : (isDark ? "#F2F2F2" : "#374151"),
              cursor: "pointer", transition: "all 150ms",
            }}
          >
            <Lock size={16} /> Private (invite only)
          </button>
          <button
            onClick={() => setForm(p => ({ ...p, privacy: "public" }))}
            style={{
              display: "flex", alignItems: "center", gap: "6px", flex: 1,
              padding: "8px 12px", borderRadius: "6px", fontSize: "13px",
              border: `1px solid ${form.privacy === "public" ? purple : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`,
              background: form.privacy === "public" ? purpleLight : "transparent",
              color: form.privacy === "public" ? purple : (isDark ? "#F2F2F2" : "#374151"),
              cursor: "pointer", transition: "all 150ms",
            }}
          >
            <Globe size={16} /> Public link
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
          <Input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="e.g. Any dietary restrictions?" className="focus-visible:border-[#7B5EA7] focus-visible:ring-[#7B5EA7]/10" onKeyDown={e => {
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

  // If on step 3 (AI generation step), render that instead of the normal flow
  if (step === 3) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-[580px] max-h-[85vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
            style={{ border: `1px solid ${isDark ? "rgba(123,94,167,0.3)" : "rgba(123,94,167,0.2)"}` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Target className="h-5 w-5" style={{ color: purple }} /> AI Prep Stages
                </h2>
                <p className="text-sm text-muted-foreground">Step 4 of 4</p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex gap-1 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-1 flex-1 rounded-full" style={{ background: purple }} />
              ))}
            </div>

            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: purple, borderTopColor: "transparent" }} />
                <p className="text-sm font-medium text-muted-foreground">Generating your prep plan...</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  {aiStages.map((stage, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border p-4"
                      style={{
                        borderColor: isDark ? "rgba(123,94,167,0.2)" : "rgba(123,94,167,0.15)",
                        background: isDark ? "rgba(123,94,167,0.08)" : "#F5F3FF",
                      }}
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ background: purple, color: "white" }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{stage.task}</p>
                        {stage.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {aiStages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No prep tasks generated. You can add them manually later.</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      onClose();
                      if (createdProjectId) navigate(`/project/${createdProjectId}`);
                    }}
                    style={{
                      width: "100%", padding: "12px 20px",
                      background: purple, border: "none", borderRadius: "10px",
                      fontSize: "14px", fontWeight: "600", color: "white",
                      cursor: "pointer", fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Take me to my event →
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

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
          className="w-full max-w-[580px] max-h-[85vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
          style={{ border: `1px solid ${isDark ? "rgba(123,94,167,0.3)" : "rgba(123,94,167,0.2)"}` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Create Event</h2>
              <p className="text-sm" style={{ color: purple }}>Step {step + 1} of {steps.length}</p>
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress — purple */}
          <div className="flex gap-1 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all"
                style={{ background: i <= step ? purple : (isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB") }}
              />
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

          {/* Navigation — purple buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-border">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={() => {
                  if (step === 0 && !form.name.trim()) { toast.error("Event name is required"); return; }
                  setStep(s => s + 1);
                }}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                  padding: "10px 20px", background: purple, border: "none", borderRadius: "8px",
                  fontSize: "14px", fontWeight: "600", color: "white", cursor: "pointer",
                  transition: "background 150ms", fontFamily: "Inter, sans-serif",
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = "#6D4F9A"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = purple; }}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1, padding: "10px 20px",
                  background: submitting ? "#9B85BF" : purple,
                  border: "none", borderRadius: "8px",
                  fontSize: "14px", fontWeight: "600", color: "white",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {submitting ? "Creating..." : "Create Event"}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
