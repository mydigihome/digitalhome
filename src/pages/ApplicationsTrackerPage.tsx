import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, ExternalLink, Paperclip, Upload, Rocket, Calendar, X, FileText, ArrowRight, Download, ChevronLeft, Search, Bell, MoreVertical, FolderOpen, CloudUpload, Folder, FileIcon, MoreHorizontal, Clock, Inbox, GripVertical } from "lucide-react";
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
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CollegeApplicationsTab from "@/components/CollegeApplicationsTab";
import { useNavigate } from "react-router-dom";

const columns = [
  { id: "applied", label: "Applied", color: "#7B5EA7", bg: "#F5F3FF", border: "#DDD6FE", darkBg: "rgba(123,94,167,0.1)" },
  { id: "interview", label: "In Interview", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", darkBg: "rgba(245,158,11,0.1)" },
  { id: "completed", label: "Completed", color: "#10B981", bg: "#F0FDF4", border: "#BBF7D0", darkBg: "rgba(16,185,129,0.1)" },
  { id: "closed", label: "Didn't Work Out", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", darkBg: "rgba(107,114,128,0.1)" },
];

const categoryLabels: Record<string, string> = {
  job: "Job", internship: "Internship", fellowship: "Fellowship", brand_collab: "Brand Collab", college: "College",
};

const statusMap: Record<string, string> = {
  applied: "applied",
  interview_scheduled: "interview",
  interviewed: "interview",
  offer: "completed",
  rejected: "closed",
  withdrawn: "closed",
  interview: "interview",
  completed: "completed",
  closed: "closed",
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
  const { data: applications = [], refetch: refetchApplications } = useApplications();
  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();
  const { data: resumes = [] } = useResumes();
  const createResume = useCreateResume();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [activeFilter, setActiveFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [deletedApp, setDeletedApp] = useState<any>(null);
  const [cardMenuOpen, setCardMenuOpen] = useState<string | null>(null);
  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const [showStudentPrompt, setShowStudentPrompt] = useState(false);
  const isStudent = (prefs as any)?.user_type === "student";

  const [form, setForm] = useState({
    company_name: "", position_title: "", category: "job", status: "applied",
    application_date: format(new Date(), "yyyy-MM-dd"), application_url: "", notes: "",
  });

  const bannerUrl = (prefs as any)?.app_banner_url;

  // Map existing statuses to kanban columns
  const getColumnId = (status: string) => statusMap[status] || "applied";

  const filteredApps = applications.filter(a => {
    if (activeFilter === "All") return true;
    const cat = activeFilter.toLowerCase().replace(" ", "_");
    return a.category === cat;
  });

  const handleDrop = async (applicationId: string, newStatus: string) => {
    const { error } = await (supabase as any)
      .from("applications")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", applicationId)
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Failed to update");
      refetchApplications();
    } else {
      toast.success(`Moved to ${columns.find(c => c.id === newStatus)?.label || newStatus}`);
      refetchApplications();
    }
  };

  const handleSubmit = async () => {
    if (!form.company_name || !form.position_title) {
      toast.error("Company and Role are required");
      return;
    }
    if (editingApp) {
      await updateApp.mutateAsync({ id: editingApp.id, ...form });
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
    setForm({
      company_name: app.company_name, position_title: app.position_title,
      category: app.category, status: app.status,
      application_date: app.application_date, application_url: app.application_url || "", notes: app.notes || "",
    });
    setEditingApp(app);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const appCopy = { ...deleteConfirm };
    await deleteApp.mutateAsync(deleteConfirm.id);
    setDeleteConfirm(null);
    setDeletedApp(appCopy);
    toast.success("Application deleted", {
      action: {
        label: "Undo",
        onClick: async () => {
          await createApp.mutateAsync({
            company_name: appCopy.company_name,
            position_title: appCopy.position_title,
            category: appCopy.category,
            status: appCopy.status,
            application_date: appCopy.application_date,
            application_url: appCopy.application_url || "",
            notes: appCopy.notes || "",
          } as any);
          toast.success("Application restored");
        },
      },
      duration: 5000,
    });
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
      file_url: path, file_type: ext || "pdf", file_size: file.size, notes: null, application_id: null,
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

  // Close card menus on outside click
  useEffect(() => {
    const handler = () => setCardMenuOpen(null);
    if (cardMenuOpen) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [cardMenuOpen]);

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-screen bg-background">

        {/* Gradient Header */}
        <div
          className="relative w-full overflow-hidden group"
          style={{
            background: bannerUrl?.startsWith("linear-gradient") ? bannerUrl
              : !bannerUrl ? `linear-gradient(135deg, ${(prefs as any)?.banner_color || '#6366F1'}15, ${(prefs as any)?.banner_color || '#6366F1'}05)` : undefined,
            backgroundImage: bannerUrl && !bannerUrl.startsWith("linear-gradient") ? `url(${bannerUrl})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
            borderRadius: "0 0 40px 40px", paddingTop: 48, paddingBottom: 40,
          }}
        >
          <div className="max-w-xl lg:max-w-6xl mx-auto px-5">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-card/50 backdrop-blur-md hover:bg-card/70 transition">
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
                    toast.success(!current ? "You'll be notified of new templates!" : "Notifications turned off");
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-card/50 backdrop-blur-md hover:bg-card/70 transition"
                >
                  <Bell className={`h-4 w-4 ${(prefs as any)?.template_notifications ? 'text-primary fill-primary' : 'text-foreground'}`} />
                </button>
              </div>
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-foreground">Resource Studio</h1>
            <p className="text-sm font-medium text-muted-foreground mt-2">
              {(prefs as any)?.app_banner_text || "Download free career resources and premium templates."}
            </p>
          </div>
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

          {/* SECTION 1: Featured Templates */}
          <FeaturedTemplatesSection userId={user?.id} />

          {/* SECTION 2: Applications Tracker — Kanban */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }} className="text-foreground">Applications Tracker</h2>
                <p style={{ fontSize: 13 }} className="text-muted-foreground">Track every opportunity in one place</p>
              </div>
              <button
                onClick={() => { setEditingApp(null); setForm({ company_name: "", position_title: "", category: "job", status: "applied", application_date: format(new Date(), "yyyy-MM-dd"), application_url: "", notes: "" }); setShowForm(true); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                <Plus size={16} /> Add Application
              </button>
            </div>

            {/* Filter Row */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {["All", "Job", "Internship", "Fellowship", "Brand Collab", ...(isStudent ? ["College"] : [])].map(filter => (
                <button
                  key={filter}
                  onClick={() => {
                    if (filter === "College" && !isStudent) { setShowStudentPrompt(true); return; }
                    setActiveFilter(filter);
                  }}
                  style={{
                    padding: "6px 16px", borderRadius: 999, border: "1.5px solid",
                    borderColor: activeFilter === filter ? "#10B981" : isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
                    background: activeFilter === filter ? "#10B981" : "transparent",
                    color: activeFilter === filter ? "white" : isDark ? "#F2F2F2" : "#374151",
                    fontSize: 13, fontWeight: activeFilter === filter ? 600 : 400, cursor: "pointer",
                  }}
                >
                  {filter}
                  {filter === "All" && (
                    <span style={{ marginLeft: 6, background: "rgba(255,255,255,0.3)", borderRadius: 999, padding: "1px 6px", fontSize: 11 }}>
                      {applications.length}
                    </span>
                  )}
                </button>
              ))}
              {!isStudent && (
                <button
                  onClick={() => setShowStudentPrompt(true)}
                  style={{
                    padding: "6px 16px", borderRadius: 999, border: "1.5px dashed",
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
                    background: "transparent", color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280",
                    fontSize: 13, cursor: "pointer",
                  }}
                >
                  🎓 College
                </button>
              )}
            </div>

            {/* College Tab */}
            {activeFilter === "College" && isStudent ? (
              <CollegeApplicationsTab />
            ) : (
              /* Kanban Board */
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "start" }} className="kanban-board">
                {columns.map(col => {
                  const cards = filteredApps.filter(a => getColumnId(a.status) === col.id);
                  return (
                    <div
                      key={col.id}
                      style={{
                        background: isDark ? col.darkBg : col.bg,
                        borderRadius: 14,
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : col.border}`,
                        padding: 16, minHeight: 400,
                      }}
                    >
                      {/* Column header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
                          <span style={{ fontWeight: 700, fontSize: 14 }} className="text-foreground">{col.label}</span>
                        </div>
                        <span style={{
                          background: isDark ? "rgba(255,255,255,0.06)" : "white",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : col.border}`,
                          borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600, color: col.color,
                        }}>
                          {cards.length}
                        </span>
                      </div>

                      {/* Drop zone */}
                      <div
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const appId = e.dataTransfer.getData("applicationId"); if (appId) handleDrop(appId, col.id); }}
                        style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 300 }}
                      >
                        {cards.map(card => (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={e => e.dataTransfer.setData("applicationId", card.id)}
                            className="kanban-card"
                            style={{
                              background: isDark ? "#1C1C1E" : "white",
                              borderRadius: 10,
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6"}`,
                              padding: 14, cursor: "grab",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                              position: "relative",
                            }}
                          >
                            {/* Card header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: col.color + "20",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 16, fontWeight: 800, color: col.color, flexShrink: 0,
                              }}>
                                {card.company_name.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ position: "relative" }}>
                                <button
                                  onClick={e => { e.stopPropagation(); setCardMenuOpen(cardMenuOpen === card.id ? null : card.id); }}
                                  style={{ padding: 4, border: "none", background: "transparent", cursor: "pointer", borderRadius: 4 }}
                                >
                                  <MoreHorizontal size={16} className="text-muted-foreground" />
                                </button>
                                {cardMenuOpen === card.id && (
                                  <div onClick={e => e.stopPropagation()} style={{
                                    position: "absolute", right: 0, top: "100%",
                                    background: isDark ? "#1C1C1E" : "white",
                                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
                                    borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    zIndex: 50, minWidth: 140, overflow: "hidden",
                                  }}>
                                    <button
                                      onClick={() => { handleEdit(card); setCardMenuOpen(null); }}
                                      style={{ width: "100%", padding: "10px 14px", textAlign: "left", border: "none", background: "transparent", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                                      className="text-foreground hover:bg-secondary"
                                    >
                                      <Pencil size={13} /> Edit
                                    </button>
                                    <button
                                      onClick={() => { setDeleteConfirm(card); setCardMenuOpen(null); }}
                                      style={{ width: "100%", padding: "10px 14px", textAlign: "left", border: "none", background: "transparent", fontSize: 13, color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                                    >
                                      <Trash2 size={13} /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Company + Role */}
                            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }} className="text-foreground">{card.company_name}</p>
                            <p style={{ fontSize: 12, marginBottom: 10 }} className="text-muted-foreground">{card.position_title}</p>

                            {/* Tags */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                              <span style={{
                                background: col.color + "15", color: col.color,
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.5px",
                              }}>
                                {categoryLabels[card.category] || card.category}
                              </span>
                            </div>

                            {/* Applied date */}
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Clock size={11} className="text-muted-foreground" />
                              <span style={{ fontSize: 11 }} className="text-muted-foreground">
                                Applied {formatDistanceToNow(new Date(card.application_date), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        ))}

                        {cards.length === 0 && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, opacity: 0.5 }}>
                            <Inbox size={28} color={col.color} />
                            <p style={{ fontSize: 13, marginTop: 8, textAlign: "center" }} className="text-muted-foreground">
                              No applications here yet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: Resumes & Files */}
          <div>
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
                <CloudUpload className="h-3.5 w-3.5" /> Upload
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
                  <p className="text-sm text-muted-foreground">No files uploaded yet. Click "Upload" to add your first file.</p>
                </div>
              ) : (
                resumes.map(r => {
                  const ext = r.file_type?.toLowerCase();
                  const isPdf = ext === "pdf";
                  const isDoc = ["doc", "docx"].includes(ext || "");
                  return (
                    <div key={r.id} className="flex items-center gap-4 p-4 rounded-3xl border border-border bg-card hover:shadow-sm transition">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", isPdf ? "bg-red-50 dark:bg-red-900/30" : isDoc ? "bg-blue-50 dark:bg-blue-900/30" : "bg-secondary")}>
                        <FileText className={cn("h-5 w-5", isPdf ? "text-red-500" : isDoc ? "text-blue-500" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{r.title}.{r.file_type}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
                          {r.file_size ? `${(r.file_size / (1024 * 1024)).toFixed(1)} MB` : "Unknown"} • {format(new Date(r.created_at), "MMM d, yyyy").toUpperCase()}
                        </p>
                      </div>
                      <button className="text-muted-foreground/40 hover:text-muted-foreground transition shrink-0">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Application Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => { setShowForm(false); setEditingApp(null); }}>
            <div className="w-full max-w-[500px] rounded-2xl bg-card p-7 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 style={{ fontSize: 20, fontWeight: 700 }} className="text-foreground">{editingApp ? "Edit Application" : "Add Application"}</h3>
                <button onClick={() => { setShowForm(false); setEditingApp(null); }} className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Company Name *</Label>
                  <Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} className={cn("rounded-xl", !form.company_name && form.company_name !== undefined ? "" : "")} placeholder="e.g. Google" />
                </div>
                <div className="space-y-1">
                  <Label>Role/Position *</Label>
                  <Input value={form.position_title} onChange={e => setForm(p => ({ ...p, position_title: e.target.value }))} className="rounded-xl" placeholder="e.g. Software Engineer" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Application Type *</Label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      <option value="job">Job</option>
                      <option value="internship">Internship</option>
                      <option value="fellowship">Fellowship</option>
                      <option value="brand_collab">Brand Collab</option>
                      <option value="college">College</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      <option value="applied">Applied</option>
                      <option value="interview">In Interview</option>
                      <option value="completed">Completed</option>
                      <option value="closed">Didn't Work Out</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Applied Date</Label>
                  <Input type="date" value={form.application_date} onChange={e => setForm(p => ({ ...p, application_date: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label>Application URL (optional)</Label>
                  <Input value={form.application_url} onChange={e => setForm(p => ({ ...p, application_url: e.target.value }))} placeholder="Link to job posting" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label>Notes (optional)</Label>
                  <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Interview notes, contacts..." rows={3} className="rounded-xl" />
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={createApp.isPending || updateApp.isPending}
                style={{ width: "100%", height: 48, background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                {createApp.isPending || updateApp.isPending ? "Saving..." : editingApp ? "Save Changes" : "Add Application"}
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
            <div className="w-full max-w-[360px] rounded-2xl bg-card p-6 shadow-xl text-center" onClick={e => e.stopPropagation()}>
              <p style={{ fontSize: 18, fontWeight: 700 }} className="text-foreground mb-2">Delete this application?</p>
              <p style={{ fontSize: 14 }} className="text-muted-foreground mb-1">{deleteConfirm.company_name} — {deleteConfirm.position_title}</p>
              <p style={{ fontSize: 13 }} className="text-muted-foreground mb-6">This cannot be undone.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl">Cancel</Button>
                <button
                  onClick={handleDeleteConfirm}
                  style={{ flex: 1, padding: "10px 20px", background: "#DC2626", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Prompt Modal */}
        {showStudentPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setShowStudentPrompt(false)}>
            <div className="w-full max-w-[360px] rounded-3xl bg-card p-6 shadow-xl text-center" onClick={e => e.stopPropagation()}>
              <p className="text-lg font-bold text-foreground mb-2">🎓 Are you a student?</p>
              <p className="text-sm text-muted-foreground mb-6">Enable the College Applications tracker to manage your college journey.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowStudentPrompt(false)} className="flex-1 rounded-xl">No</Button>
                <Button onClick={() => { upsertPrefs.mutate({ user_type: "student" } as any); setShowStudentPrompt(false); setActiveFilter("College"); toast.success("College tracker enabled!"); }} className="flex-1 rounded-xl">Yes, I'm a student</Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Responsive: stack kanban on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .kanban-board {
            grid-template-columns: 1fr !important;
            overflow-x: auto;
          }
        }
      `}</style>
    </AppShell>
  );
}

/* ─── Featured Templates Section ─── */

function FeaturedTemplatesSection({ userId }: { userId?: string }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);

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

  // Check if user has purchased bundle
  useEffect(() => {
    if (!userId) return;
    (supabase as any)
      .from("template_purchases")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .then(({ data }: any) => {
        if (data && data.length > 0) setHasPurchased(true);
      });
  }, [userId]);

  const handleDownload = async (template: any) => {
    if (!template.file_url) { toast.error("File not available yet"); return; }
    if (!hasPurchased && template.price_cents > 0) {
      toast("Redirecting to secure checkout...");
      window.open("https://buy.stripe.com/PLACEHOLDER", "_blank");
      return;
    }
    if (userId) {
      await (supabase as any).from("template_downloads").insert({ template_id: template.id, user_id: userId });
      (supabase as any).rpc("increment_download_count_if_exists", { tid: template.id });
    }
    const { data } = await supabase.storage.from("template-files").createSignedUrl(template.file_url, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
      toast.success("Download started!");
    } else {
      toast.error("Could not generate download link");
    }
  };

  const handleBundleClick = () => {
    toast("Redirecting to secure checkout...");
    window.open("https://buy.stripe.com/PLACEHOLDER", "_blank");
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
        <button onClick={() => navigate('/templates')} className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
          See All <ArrowRight className="h-4 w-4" />
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
              onClick={() => {
                if (!hasPurchased && template.price_cents > 0) {
                  handleBundleClick();
                } else if (templates.length > 0) {
                  setSelectedTemplate(template);
                } else {
                  navigate('/templates');
                }
              }}
              className="rounded-3xl border border-border bg-card p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group relative"
            >
              {/* Lock overlay for non-purchased paid templates */}
              {!hasPurchased && template.price_cents > 0 && (
                <div className="absolute inset-0 rounded-3xl bg-card/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground bg-card/90 px-3 py-1.5 rounded-full border border-border">🔒 Bundle Only</span>
                </div>
              )}
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
                {hasPurchased || template.price_cents === 0 ? (
                  <><Download className="h-3 w-3" /> Download</>
                ) : (
                  <>🔒 Unlock — $25 Bundle</>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Bundle button */}
      <div className="mt-5">
        <button
          onClick={handleBundleClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          💎 Get All Templates — $25
        </button>
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
            {selectedTemplate.description && <p className="text-sm text-muted-foreground mb-4">{selectedTemplate.description}</p>}
            <div className="text-sm text-muted-foreground mb-4 space-y-1">
              <p className="font-bold text-foreground">What's included:</p>
              <p>• Editable template file</p>
              <p>• PDF version</p>
              <p>• Customization guide</p>
            </div>
            <Button onClick={() => { handleDownload(selectedTemplate); setSelectedTemplate(null); }} className="w-full rounded-xl" size="lg">
              {hasPurchased || selectedTemplate.price_cents === 0 ? "Download Now" : "Unlock — $25 Bundle"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
