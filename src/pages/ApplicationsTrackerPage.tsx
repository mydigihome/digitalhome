import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, ExternalLink, Paperclip, Upload, Rocket, Calendar, X, FileText, ArrowRight, Download, ChevronLeft, Search, Bell, MoreVertical, FolderOpen, CloudUpload, Folder, FileIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AppShell from "@/components/AppShell";
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from "@/hooks/useApplications";
import { useResumes, useCreateResume, useDeleteResume } from "@/hooks/useResumes";
import ResumeManager from "@/components/ResumeManager";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CollegeApplicationsTab from "@/components/CollegeApplicationsTab";
import { useNavigate } from "react-router-dom";

type AppCategory = "all" | "job" | "internship" | "fellowship" | "brand_collab" | "college";

const categoryLabels: Record<string, string> = {
  job: "Job", internship: "Internship", fellowship: "Fellowship", brand_collab: "Brand Collab",
};
const categoryColors: Record<string, string> = {
  job: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  internship: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  fellowship: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  brand_collab: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};
const statusColors: Record<string, string> = {
  applied: "bg-secondary text-muted-foreground",
  interview_scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  interviewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  offer: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  withdrawn: "bg-secondary text-muted-foreground",
};
const statusLabels: Record<string, string> = {
  applied: "Applied", interview_scheduled: "Interview Scheduled", interviewed: "Interviewed",
  offer: "Offer Received", rejected: "Rejected", withdrawn: "Withdrawn",
};

const gradientPresets = [
  "linear-gradient(135deg, #DBEAFE 0%, #93C5FD 50%, #60A5FA 100%)",
  "linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 50%, #A78BFA 100%)",
  "linear-gradient(135deg, #FEF3C7 0%, #FCD34D 50%, #FBBF24 100%)",
  "linear-gradient(135deg, #FCE7F3 0%, #F9A8D4 50%, #F472B6 100%)",
  "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 50%, #6EE7B7 100%)",
  "linear-gradient(135deg, #CFFAFE 0%, #67E8F9 50%, #22D3EE 100%)",
  "linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 50%, #F87171 100%)",
  "linear-gradient(135deg, #F3F4F6 0%, #D1D5DB 50%, #9CA3AF 100%)",
];

export default function ApplicationsTrackerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const { data: applications = [] } = useApplications();
  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();
  const { data: resumes = [] } = useResumes();
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();

  const [activeCategory, setActiveCategory] = useState<AppCategory>("all");
  const isStudent = (prefs as any)?.user_type === "student";
  const [showStudentPrompt, setShowStudentPrompt] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    company_name: "", position_title: "", category: "job", status: "applied",
    application_date: format(new Date(), "yyyy-MM-dd"), application_url: "", notes: "",
  });

  const filtered = activeCategory === "all" ? applications : applications.filter(a => a.category === activeCategory);
  const counts = {
    all: applications.length,
    job: applications.filter(a => a.category === "job").length,
    internship: applications.filter(a => a.category === "internship").length,
    fellowship: applications.filter(a => a.category === "fellowship").length,
    brand_collab: applications.filter(a => a.category === "brand_collab").length,
  };

  const bannerUrl = (prefs as any)?.app_banner_url;

  const handleSubmit = async () => {
    if (!form.company_name || !form.position_title) { toast.error("Fill required fields"); return; }
    if (editingApp) {
      await updateApp.mutateAsync({ id: editingApp, ...form });
      toast.success("Application updated");
    } else {
      await createApp.mutateAsync(form as any);
      toast.success("Application added");
    }
    setForm({ company_name: "", position_title: "", category: "job", status: "applied", application_date: format(new Date(), "yyyy-MM-dd"), application_url: "", notes: "" });
    setShowForm(false);
    setEditingApp(null);
  };

  const handleEdit = (app: any) => {
    setForm({ company_name: app.company_name, position_title: app.position_title, category: app.category, status: app.status, application_date: app.application_date, application_url: app.application_url || "", notes: app.notes || "" });
    setEditingApp(app.id);
    setShowForm(true);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc", "txt"].includes(ext || "")) { toast.error("Supported: PDF, DOCX, DOC, TXT"); return; }
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    await createResume.mutateAsync({
      title: file.name.replace(/\.[^/.]+$/, ""),
      file_url: path,
      file_type: ext || "pdf",
      file_size: file.size,
      notes: null,
      application_id: null,
    });
    toast.success("Resume uploaded");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const path = `${user.id}/app-tracker-${Date.now()}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    await upsertPrefs.mutateAsync({ app_banner_url: publicUrl } as any);
    setShowBannerMenu(false);
    toast.success("Banner updated");
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-screen bg-background">

        {/* Gradient Header */}
        <div
          className="relative w-full overflow-hidden group"
          style={{
            background: bannerUrl?.startsWith("linear-gradient") ? bannerUrl
              : !bannerUrl ? "linear-gradient(135deg, hsl(262 80% 50% / 0.08) 0%, hsl(330 80% 70% / 0.1) 100%)" : undefined,
            backgroundImage: bannerUrl && !bannerUrl.startsWith("linear-gradient") ? `url(${bannerUrl})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
            borderRadius: "0 0 40px 40px",
            paddingTop: 48,
            paddingBottom: 40,
          }}
        >
          <div className="max-w-xl lg:max-w-6xl mx-auto px-5">
            {/* Top Nav */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-card/50 backdrop-blur-md hover:bg-card/70 transition"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-card/50 backdrop-blur-md hover:bg-card/70 transition">
                  <Search className="h-4 w-4 text-foreground" />
                </button>
                <button 
                  onClick={async () => {
                    const current = (prefs as any)?.template_notifications ?? false;
                    await upsertPrefs.mutateAsync({ template_notifications: !current } as any);
                    toast.success(!current ? "You'll be notified of new templates! 🔔" : "Notifications turned off");
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-card/50 backdrop-blur-md hover:bg-card/70 transition"
                >
                  <Bell className={`h-4 w-4 ${(prefs as any)?.template_notifications ? 'text-primary fill-primary' : 'text-foreground'}`} />
                </button>
              </div>
            </div>

            <h1 className="text-5xl font-semibold tracking-tight text-foreground">
              Resource Studio
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-2">
              {(prefs as any)?.app_banner_text || "Download free career resources and premium templates."}
            </p>
          </div>

          {/* Banner change controls */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <Button variant="secondary" size="sm" onClick={() => setShowBannerMenu(!showBannerMenu)} className="rounded-full backdrop-blur-md bg-card/50">Change cover</Button>
              {showBannerMenu && (
                <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl border border-border bg-card p-2 shadow-lg">
                  <button onClick={() => bannerInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-secondary">Upload image</button>
                  <div className="px-3 py-2 text-xs text-muted-foreground">Gradients</div>
                  <div className="grid grid-cols-4 gap-1 px-3 pb-2">
                    {gradientPresets.map((g, i) => (
                      <button key={i} onClick={async () => { await upsertPrefs.mutateAsync({ app_banner_url: g } as any); setShowBannerMenu(false); toast.success("Banner updated"); }} className="h-8 w-full rounded-lg" style={{ background: g }} />
                    ))}
                  </div>
                  <button onClick={async () => { await upsertPrefs.mutateAsync({ app_banner_url: null, app_banner_text: null } as any); setShowBannerMenu(false); toast.success("Banner reset"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10">Reset to default</button>
                </div>
              )}
            </div>
          </div>
          <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleBannerUpload} />
        </div>

        {/* Main Content */}
        <div className="max-w-xl lg:max-w-6xl mx-auto px-5 py-8 space-y-10">

          {/* SECTION 1: Featured Templates (MAX 4) */}
          <FeaturedTemplatesSection userId={user?.id} />

          {/* SECTION 2: Applications Tracker */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Applications Tracker</h2>
              </div>
              {activeCategory !== "college" && (
                <button
                  onClick={() => { setEditingApp(null); setForm({ company_name: "", position_title: "", category: "job", status: "applied", application_date: format(new Date(), "yyyy-MM-dd"), application_url: "", notes: "" }); setShowForm(true); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-lg shadow-primary/25"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-5">
              {(["all", "job", "internship", "fellowship", "brand_collab"] as AppCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-xs whitespace-nowrap transition-all",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25"
                      : "bg-card text-muted-foreground font-semibold border border-border hover:border-primary/30"
                  )}
                >
                  {cat === "all" ? "All" : categoryLabels[cat]} ({counts[cat]})
                </button>
              ))}
              {isStudent && (
                <button
                  onClick={() => setActiveCategory("college")}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-xs whitespace-nowrap transition-all",
                    activeCategory === "college"
                      ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25"
                      : "bg-card text-muted-foreground font-semibold border border-border hover:border-primary/30"
                  )}
                >
                  🎓 College
                </button>
              )}
              {!isStudent && (
                <button
                  onClick={() => setShowStudentPrompt(true)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap border border-dashed border-border text-muted-foreground hover:border-primary/30 transition-all"
                >
                  🎓 College
                </button>
              )}
            </div>

            {/* College Applications Tab */}
            {activeCategory === "college" && isStudent && <CollegeApplicationsTab />}

            {/* Regular Applications */}
            {activeCategory !== "college" && (
              <>
                {filtered.length === 0 ? (
                  <div className="rounded-[32px] border-2 border-dashed border-primary/20 p-10 text-center bg-card/70 backdrop-blur-xl">
                    <div className="relative mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 animate-pulse" />
                      <Rocket className="h-10 w-10 text-primary relative z-10" />
                    </div>
                    <p className="text-lg font-bold text-foreground">Your next big break starts here.</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[220px] mx-auto">
                      Click "Add Application" to begin tracking your professional journey.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
                    {filtered.map(app => {
                      const appResumes = resumes.filter(r => r.application_id === app.id);
                      return (
                        <div key={app.id} className="rounded-3xl border border-border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary shrink-0">
                              {app.company_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-foreground truncate">{app.company_name}</h3>
                              <p className="text-xs text-muted-foreground truncate">{app.position_title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", categoryColors[app.category])}>
                              {categoryLabels[app.category] || app.category}
                            </span>
                            <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", statusColors[app.status])}>
                              {statusLabels[app.status] || app.status}
                            </span>
                            {appResumes.length > 0 && <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3">
                            Applied {formatDistanceToNow(new Date(app.application_date), { addSuffix: true })}
                          </p>
                          <div className="flex items-center gap-2 border-t border-border pt-3">
                            {app.application_url && (
                              <a href={app.application_url.startsWith("http") ? app.application_url : `https://${app.application_url}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition"><ExternalLink className="h-4 w-4" /></a>
                            )}
                            <button onClick={() => handleEdit(app)} className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => { deleteApp.mutate(app.id); toast.success("Deleted"); }} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Resumes & Files Section — Stitch Style */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Folder className="h-4 w-4 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">Resumes & Files</h2>
                    </div>
                    <button
                      onClick={() => resumeInputRef.current?.click()}
                      className="flex items-center gap-2 text-primary font-bold text-xs bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition"
                    >
                      <CloudUpload className="h-3.5 w-3.5" />
                      Upload
                    </button>
                  </div>
                  <input ref={resumeInputRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleResumeUpload} />

                  <div className="space-y-3">
                    {resumes.length === 0 ? (
                      <div
                        className="rounded-[32px] border-2 border-dashed border-primary/20 p-10 text-center bg-card/70 backdrop-blur-xl cursor-pointer hover:border-primary/40 transition"
                        onClick={() => resumeInputRef.current?.click()}
                      >
                        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 mb-3">
                          <FolderOpen className="h-7 w-7 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No files uploaded yet. Click "Upload" to add your first file.
                        </p>
                      </div>
                    ) : (
                      resumes.map(r => {
                        const ext = r.file_type?.toLowerCase();
                        const isPdf = ext === "pdf";
                        const isDoc = ["doc", "docx"].includes(ext || "");
                        return (
                          <div key={r.id} className="flex items-center gap-4 p-4 rounded-3xl border border-border bg-card hover:shadow-sm transition">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                              isPdf ? "bg-red-50 dark:bg-red-900/30" : isDoc ? "bg-blue-50 dark:bg-blue-900/30" : "bg-secondary"
                            )}>
                              <FileText className={cn(
                                "h-5 w-5",
                                isPdf ? "text-red-500" : isDoc ? "text-blue-500" : "text-muted-foreground"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-foreground truncate">{r.title}.{r.file_type}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
                                {r.file_size ? `${(r.file_size / (1024 * 1024)).toFixed(1)} MB` : "Unknown"} • {format(new Date(r.created_at), "MMM d, yyyy").toUpperCase()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle active resume for actions
                                setEditingApp(editingApp === r.id ? null : r.id);
                              }}
                              className="text-muted-foreground/40 hover:text-muted-foreground transition shrink-0"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Application Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
            <div className="w-full max-w-[600px] rounded-3xl bg-card p-8 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{editingApp ? "Edit Application" : "Add Application"}</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Company Name *</Label><Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} className="rounded-xl" /></div>
                <div className="space-y-1"><Label>Position Title *</Label><Input value={form.position_title} onChange={e => setForm(p => ({ ...p, position_title: e.target.value }))} className="rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Category *</Label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      <option value="job">Job</option>
                      <option value="internship">Internship</option>
                      <option value="fellowship">Fellowship</option>
                      <option value="brand_collab">Brand Collab</option>
                    </select>
                  </div>
                  <div className="space-y-1"><Label>Status</Label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      <option value="applied">Applied</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="interviewed">Interviewed</option>
                      <option value="offer">Offer Received</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1"><Label>Application Date</Label><Input type="date" value={form.application_date} onChange={e => setForm(p => ({ ...p, application_date: e.target.value }))} className="rounded-xl" /></div>
                <div className="space-y-1"><Label>Application URL (optional)</Label><Input value={form.application_url} onChange={e => setForm(p => ({ ...p, application_url: e.target.value }))} placeholder="https://..." className="rounded-xl" /></div>
                <div className="space-y-1"><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="rounded-xl" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleSubmit} disabled={createApp.isPending || updateApp.isPending} className="flex-1 rounded-xl">
                  {(createApp.isPending || updateApp.isPending) ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Student Prompt Modal */}
        {showStudentPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setShowStudentPrompt(false)}>
            <div className="w-full max-w-[360px] rounded-3xl bg-card p-6 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-lg font-bold text-foreground mb-2">🎓 Are you a student?</p>
              <p className="text-sm text-muted-foreground mb-6">Enable the College Applications tracker to manage your college journey.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowStudentPrompt(false)} className="flex-1 rounded-xl">No</Button>
                <Button onClick={() => { upsertPrefs.mutate({ user_type: "student" } as any); setShowStudentPrompt(false); setActiveCategory("college"); toast.success("College tracker enabled!"); }} className="flex-1 rounded-xl">Yes, I'm a student</Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}

/* ─── Featured Templates Section (MAX 4 total) ─── */

function FeaturedTemplatesSection({ userId }: { userId?: string }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  useEffect(() => {
    supabase
      .from("shop_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(4)
      .then(({ data }) => {
        setTemplates(data || []);
        setLoading(false);
      });
  }, []);

  const handleDownload = async (template: any) => {
    if (!template.file_url) { toast.error("File not available yet"); return; }
    if (template.price_cents > 0) {
      window.open("/templates", "_blank");
      return;
    }
    if (userId) {
      await supabase.from("template_downloads").insert({ template_id: template.id, user_id: userId });
      supabase.rpc("increment_download_count_if_exists", { tid: template.id });
    }
    const { data } = await supabase.storage.from("template-files").createSignedUrl(template.file_url, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
      toast.success("Download started!");
    } else {
      toast.error("Could not generate download link");
    }
  };

  const templateGradients = [
    "linear-gradient(135deg, hsl(262 80% 60% / 0.15), hsl(280 65% 60% / 0.2))",
    "linear-gradient(135deg, hsl(330 80% 70% / 0.15), hsl(350 70% 65% / 0.2))",
    "linear-gradient(135deg, hsl(200 70% 55% / 0.15), hsl(220 65% 60% / 0.2))",
    "linear-gradient(135deg, hsl(160 60% 50% / 0.15), hsl(180 60% 55% / 0.2))",
  ];

  const fallbackTemplates = [
    { id: "f1", title: "Creative Resume", description: "Modern & Minimalist", price_cents: 0, icon: <FileText className="h-10 w-10 text-primary/40" /> },
    { id: "f2", title: "Portfolio Kit", description: "Designer Edition", price_cents: 100, icon: <FileText className="h-10 w-10 text-primary/40" /> },
    { id: "f3", title: "Email Templates", description: "Professional Outreach", price_cents: 0, icon: <FileText className="h-10 w-10 text-primary/40" /> },
    { id: "f4", title: "Cover Letters", description: "Standout Intros", price_cents: 100, icon: <FileText className="h-10 w-10 text-primary/40" /> },
  ];

  const displayTemplates = templates.length > 0 ? templates.slice(0, 4) : fallbackTemplates;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-sm">✨</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Featured Templates</h2>
        </div>
        <button
          onClick={() => navigate('/templates')}
          className="text-primary font-semibold text-sm hover:underline flex items-center gap-1"
        >
          See All
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading templates...
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {displayTemplates.map((template: any, idx: number) => (
            <button
              key={template.id}
              onClick={() => templates.length > 0 ? setSelectedTemplate(template) : navigate('/templates')}
              className="rounded-3xl border border-border bg-card p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div
                className="aspect-[3/4] rounded-2xl mb-3 overflow-hidden relative flex items-center justify-center"
                style={{ background: templateGradients[idx % templateGradients.length] }}
              >
                {template.preview_image_url ? (
                  <img src={template.preview_image_url} alt={template.title} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="h-10 w-10 text-primary/40" />
                )}
                <span className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-foreground">
                  {template.price_cents === 0 ? "FREE" : `$${(template.price_cents / 100).toFixed(0)}`}
                </span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{template.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3 truncate">{template.description || "Professional template"}</p>
              <div className="w-full py-2 bg-secondary rounded-xl text-primary font-bold text-xs flex items-center justify-center gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {template.price_cents === 0 ? <><Download className="h-3 w-3" /> Download</> : <><ArrowRight className="h-3 w-3" /> Get Template</>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Bundle link */}
      <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <a
          href="/templates"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          💎 Get All Templates — $5 Bundle
        </a>
        <a
          href="/templates"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-semibold"
        >
          Browse Full Shop <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setSelectedTemplate(null)}>
          <div className="w-full max-w-[500px] rounded-3xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{selectedTemplate.title}</h3>
              <button onClick={() => setSelectedTemplate(null)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition"><X className="h-5 w-5" /></button>
            </div>
            {selectedTemplate.preview_image_url && (
              <div className="aspect-[3/2] rounded-2xl overflow-hidden bg-muted mb-4">
                <img src={selectedTemplate.preview_image_url} alt={selectedTemplate.title} className="w-full h-full object-cover" />
              </div>
            )}
            {selectedTemplate.description && (
              <p className="text-sm text-muted-foreground mb-4">{selectedTemplate.description}</p>
            )}
            <div className="text-sm text-muted-foreground mb-4 space-y-1">
              <p className="font-bold text-foreground">What's included:</p>
              <p>• Editable template file</p>
              <p>• PDF version</p>
              <p>• Customization guide</p>
            </div>
            <Button
              onClick={() => { handleDownload(selectedTemplate); setSelectedTemplate(null); }}
              className="w-full rounded-xl"
            >
              {selectedTemplate.price_cents === 0 ? "Download Free" : `Buy Now — $${(selectedTemplate.price_cents / 100).toFixed(0)}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
