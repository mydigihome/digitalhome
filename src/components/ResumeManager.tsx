import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Upload, Paperclip, Trash2, Star, Mail, Eye, Copy, X,
  Tag, Filter, Clock, Lightbulb, Send, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useResumes, useCreateResume, useUpdateResume, useDeleteResume, type Resume } from "@/hooks/useResumes";
import { useApplications, type Application } from "@/hooks/useApplications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const TAG_PRESETS = [
  "Software Engineering", "Data Science", "Product Management",
  "Marketing", "Design", "Finance", "Consulting", "General",
];

const EMAIL_TEMPLATES = [
  {
    name: "Job Application",
    subject: (pos: string, co: string) => `Application for ${pos} - ${co}`,
    body: (pos: string, co: string, name: string) =>
      `Dear Hiring Manager,\n\nI am writing to express my interest in the ${pos} role at ${co}. Please find my resume attached for your review.\n\nI am particularly excited about this opportunity because [1-2 sentences about why].\n\nI would welcome the chance to discuss how my experience aligns with your needs. Thank you for your consideration.\n\nBest regards,\n${name}`,
  },
  {
    name: "Networking Introduction",
    subject: (_: string, co: string) => `Connecting - Impressed by your work at ${co}`,
    body: (_: string, co: string, name: string) =>
      `Hi [Name],\n\nI came across your work at ${co} and was impressed by [specific detail]. I'm currently exploring opportunities in [field] and would love to connect.\n\nI've attached my resume for your reference. Would you be open to a brief conversation about your experience at ${co}?\n\nThanks,\n${name}`,
  },
  {
    name: "Follow-up After Interview",
    subject: (pos: string, co: string) => `Follow-up: ${pos} Interview - ${co}`,
    body: (pos: string, co: string, name: string) =>
      `Hi [Name],\n\nThank you for taking the time to meet with me regarding the ${pos} role at ${co}. I truly enjoyed our conversation and am even more excited about the opportunity.\n\nPlease don't hesitate to reach out if you need any additional information. I look forward to hearing about the next steps.\n\nBest regards,\n${name}`,
  },
  {
    name: "Cold Outreach",
    subject: (_: string, co: string) => `Exploring Opportunities at ${co}`,
    body: (_: string, co: string, name: string) =>
      `Hi [Name],\n\nI wanted to follow up on my application for the [Position] role submitted on [Date]. I remain very interested in this opportunity and would love to learn more about the next steps in your process.\n\nPlease let me know if you need any additional information.\n\nThank you,\n${name}`,
  },
];

interface Props {
  resumeInputRef: React.RefObject<HTMLInputElement>;
  handleResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ResumeManager({ resumeInputRef, handleResumeUpload }: Props) {
  const { user, profile } = useAuth();
  const { data: resumes = [] } = useResumes();
  const { data: applications = [] } = useApplications();
  const updateResume = useUpdateResume();
  const deleteResume = useDeleteResume();

  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [emailModalResume, setEmailModalResume] = useState<Resume | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showTagInput, setShowTagInput] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    body: "",
    templateIdx: 0,
  });

  const userName = (profile as any)?.full_name || "Your Name";

  const filteredResumes = filterTag
    ? resumes.filter(r => r.tags?.includes(filterTag))
    : resumes;

  const starredFirst = [...filteredResumes].sort((a, b) => {
    if (a.is_starred && !b.is_starred) return -1;
    if (!a.is_starred && b.is_starred) return 1;
    return 0;
  });

  const allTags = Array.from(new Set(resumes.flatMap(r => r.tags || [])));

  const handleToggleStar = async (r: Resume) => {
    await updateResume.mutateAsync({ id: r.id, is_starred: !r.is_starred });
    toast.success(r.is_starred ? "Removed from favorites" : "Added to favorites");
  };

  const handleAddTag = async (resumeId: string) => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume) return;
    const newTags = [...(resume.tags || []), trimmed].filter((v, i, a) => a.indexOf(v) === i);
    await updateResume.mutateAsync({ id: resumeId, tags: newTags });
    setTagInput("");
    setShowTagInput(null);
    toast.success("Tag added");
  };

  const handleRemoveTag = async (resumeId: string, tag: string) => {
    const resume = resumes.find(r => r.id === resumeId);
    if (!resume) return;
    const newTags = (resume.tags || []).filter(t => t !== tag);
    await updateResume.mutateAsync({ id: resumeId, tags: newTags });
  };

  const handlePreview = async (r: Resume) => {
    const { data } = await supabase.storage.from("resumes").createSignedUrl(r.file_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Could not preview file");
  };

  const handleCopyLink = async (r: Resume) => {
    const { data } = await supabase.storage.from("resumes").createSignedUrl(r.file_url, 86400);
    if (data?.signedUrl) {
      await navigator.clipboard.writeText(data.signedUrl);
      toast.success("Link copied to clipboard (valid 24h)");
    } else toast.error("Could not generate link");
  };

  const openEmailModal = (r: Resume) => {
    const tpl = EMAIL_TEMPLATES[0];
    setEmailForm({
      to: "",
      subject: tpl.subject("Position", "Company"),
      body: tpl.body("Position", "Company", userName),
      templateIdx: 0,
    });
    setEmailModalResume(r);
  };

  const handleTemplateChange = (idx: number) => {
    const tpl = EMAIL_TEMPLATES[idx];
    setEmailForm(prev => ({
      ...prev,
      templateIdx: idx,
      subject: tpl.subject("Position", "Company"),
      body: tpl.body("Position", "Company", userName),
    }));
  };

  const handleSendEmail = async () => {
    const mailtoUrl = `mailto:${encodeURIComponent(emailForm.to)}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`;
    window.open(mailtoUrl);
    if (emailModalResume) {
      await updateResume.mutateAsync({ id: emailModalResume.id, last_sent_date: new Date().toISOString() });
    }
    setEmailModalResume(null);
    toast.success("Email client opened");
  };

  // Follow-up suggestions based on applications
  const followUpSuggestions = applications
    .filter(a => a.status !== "rejected" && a.status !== "withdrawn" && a.status !== "offer")
    .map((app: Application) => {
      const days = differenceInDays(new Date(), new Date(app.application_date));
      if (app.status === "applied" && days >= 3 && days < 7) {
        return {
          app,
          message: `Applied to ${app.company_name} ${days} days ago? Send a check-in email.`,
          template: `Hi [Hiring Manager],\n\nI wanted to follow up on my application for the ${app.position_title} role at ${app.company_name} submitted on ${format(new Date(app.application_date), "MMM d, yyyy")}. I remain very interested and would love to learn about next steps.\n\nThank you,\n${userName}`,
        };
      }
      if ((app.status === "interviewed" || app.status === "interview_scheduled") && days >= 7 && days < 14) {
        return {
          app,
          message: `Interview with ${app.company_name} was ${days} days ago? Ask for a timeline update.`,
          template: `Hi [Name],\n\nThank you again for meeting with me about the ${app.position_title} role. I wanted to check in on the timeline for next steps. I'm still very excited about the opportunity at ${app.company_name}.\n\nBest,\n${userName}`,
        };
      }
      if (app.status === "applied" && days >= 14) {
        return {
          app,
          message: `No response from ${app.company_name} in ${days} days? Consider moving on.`,
          template: `Hi [Hiring Manager],\n\nI'm following up one last time regarding my application for ${app.position_title} at ${app.company_name}. If the position has been filled, I completely understand. I'd appreciate any update you can share.\n\nThank you for your time,\n${userName}`,
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Resumes Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-xl font-semibold text-foreground">📎 Resumes</h3>
            <p className="text-sm text-muted-foreground">Upload, organize, and share your resumes.</p>
          </div>
          <div className="flex items-center gap-2">
            {allTags.length > 0 && (
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterTag || ""}
                  onChange={e => setFilterTag(e.target.value || null)}
                  className="text-xs rounded-md border border-border bg-background px-2 py-1"
                >
                  <option value="">All tags</option>
                  {allTags.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            <Button variant="outline" onClick={() => resumeInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> Upload
            </Button>
          </div>
          <input ref={resumeInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleResumeUpload} />
        </div>
        <div className="p-6 space-y-3">
          {starredFirst.length === 0 && (
            <div
              className="rounded-lg border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary transition"
              onClick={() => resumeInputRef.current?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                {filterTag ? "No resumes match this tag." : "Drag & drop or click to upload (PDF, DOCX, DOC, TXT — max 10MB)"}
              </p>
            </div>
          )}
          {starredFirst.map(r => (
            <motion.div
              key={r.id}
              layout
              className="group rounded-lg border border-border p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => handleToggleStar(r)} className="shrink-0">
                  <Star className={cn("h-5 w-5 transition", r.is_starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40 hover:text-yellow-400")} />
                </button>
                <Paperclip className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{r.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{r.file_type.toUpperCase()}</span>
                    {r.file_size && <span>• {(r.file_size / 1024).toFixed(0)} KB</span>}
                    <span>• {format(new Date(r.created_at), "MMM d, yyyy")}</span>
                    {r.last_sent_date && (
                      <span className="flex items-center gap-0.5">
                        <Send className="h-3 w-3" /> Sent {formatDistanceToNow(new Date(r.last_sent_date), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {/* Tags */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {(r.tags || []).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
                        {tag}
                        <button onClick={() => handleRemoveTag(r.id, tag)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {showTagInput === r.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleAddTag(r.id); if (e.key === "Escape") setShowTagInput(null); }}
                          className="h-6 w-28 text-xs"
                          placeholder="Add tag..."
                          autoFocus
                          list="tag-presets"
                        />
                        <datalist id="tag-presets">
                          {TAG_PRESETS.map(t => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setShowTagInput(r.id); setTagInput(""); }}
                        className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary"
                      >
                        <Tag className="h-3 w-3" /> Add tag
                      </button>
                    )}
                  </div>
                </div>
                {/* Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEmailModal(r)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary" title="Email This">
                    <Mail className="h-4 w-4" />
                  </button>
                  <button onClick={() => handlePreview(r)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary" title="Preview">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleCopyLink(r)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary" title="Copy Link">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { deleteResume.mutate(r.id); toast.success("Resume deleted"); }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Follow-Up Suggestions */}
      {followUpSuggestions.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" /> Suggested Follow-Ups
            </h3>
            <p className="text-sm text-muted-foreground">Context-aware suggestions based on your application timeline.</p>
          </div>
          <div className="p-6 space-y-3">
            {followUpSuggestions.map((s: any, i: number) => (
              <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.template.split("\n")[0]}...</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(s.template);
                      toast.success("Template copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Sharing Modal */}
      <AnimatePresence>
        {emailModalResume && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setEmailModalResume(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[560px] rounded-2xl bg-card border border-primary/20 p-6 shadow-xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" /> Email Resume
                </h3>
                <button onClick={() => setEmailModalResume(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Attachment Preview */}
              <div className="rounded-lg border border-border bg-secondary/50 p-3 flex items-center gap-3">
                <Paperclip className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{emailModalResume.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {emailModalResume.file_type.toUpperCase()} • {emailModalResume.file_size ? `${(emailModalResume.file_size / 1024).toFixed(0)} KB` : ""}
                  </p>
                </div>
              </div>

              {/* Template Selector */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email Template</Label>
                <select
                  value={emailForm.templateIdx}
                  onChange={e => handleTemplateChange(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {EMAIL_TEMPLATES.map((t, i) => (
                    <option key={i} value={i}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  value={emailForm.to}
                  onChange={e => setEmailForm(p => ({ ...p, to: e.target.value }))}
                  placeholder="recipient@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Input
                  value={emailForm.subject}
                  onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Message</Label>
                <Textarea
                  value={emailForm.body}
                  onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))}
                  rows={8}
                  className="text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEmailModalResume(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleSendEmail} className="flex-1">
                  <Send className="h-4 w-4 mr-1" /> Open in Email Client
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
