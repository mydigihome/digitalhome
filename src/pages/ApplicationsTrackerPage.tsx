import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, ExternalLink, Paperclip, Upload, Rocket, Calendar, X, FileText, ArrowRight, Download, ChevronLeft, Search, Bell, MoreVertical, FolderOpen, CloudUpload, Folder, FileIcon, MoreHorizontal, Clock, Inbox, GripVertical, Eye, Sparkles, MoreHorizontal as Dots, List, LayoutGrid, Lock, Info, RotateCcw, Briefcase } from "lucide-react";
import ResourcesPage from "@/pages/ResourcesPage";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
  applied: "applied", interview_scheduled: "interview", interviewed: "interview",
  offer: "completed", rejected: "closed", withdrawn: "closed",
  interview: "interview", completed: "completed", closed: "closed",
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

const BUNDLE_STRIPE_URL = "https://buy.stripe.com/cNiaEXcS6dsG5X6bu2ak006";
const SINGLE_STRIPE_URL = "https://buy.stripe.com/6oUfZhdWa88m71a1Tsak005";

const defaultTemplateData = [
  { name: "Corporate Resume", description: "Professional format for traditional industries. Clean, ATS-friendly layout that gets callbacks." },
  { name: "General Portfolio", description: "Showcase your work beautifully with this versatile template. Perfect for creatives and professionals." },
  { name: "Cold Outreach Basics", description: "Get responses with proven cold email templates. Built for networking and landing opportunities." },
  { name: "Creative Resume", description: "Stand out with this modern design. Perfect for designers, marketers, and creative roles." },
];

export default function ApplicationsTrackerPage() {
  const navigate = useNavigate();
  const [appTab, setAppTab] = useState<'applications' | 'resources'>(
    window.location.search.includes('tab=resources') ? 'resources' : 'applications'
  );
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
  const [bannerColorPickerOpen, setBannerColorPickerOpen] = useState(false);
  const isStudent = (prefs as any)?.user_type === "student";

  const [view, setView] = useState<"list" | "kanban">(() => {
    return (localStorage.getItem("dh_applications_view") as "list" | "kanban") || "list";
  });

  useEffect(() => {
    localStorage.setItem("dh_applications_view", view);
  }, [view]);

  const [form, setForm] = useState({
    company_name: "", position_title: "", category: "job", status: "applied",
    application_date: format(new Date(), "yyyy-MM-dd"), application_url: "", notes: "",
  });

  const bannerUrl = (prefs as any)?.app_banner_url;
  const savedBannerColor = (prefs as any)?.applications_header_value;
  const bannerGradient = savedBannerColor
    ? `linear-gradient(135deg, ${savedBannerColor}, ${savedBannerColor}cc)`
    : "linear-gradient(135deg, #059669, #10B981)";

  const bannerColorPresets = [
    { label: "Green", color: "#059669" },
    { label: "Purple", color: "#7B5EA7" },
    { label: "Dark", color: "#1C1C1E" },
    { label: "Blue", color: "#2563EB" },
    { label: "Rose", color: "#E11D48" },
    { label: "Slate", color: "#475569" },
  ];

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
            company_name: appCopy.company_name, position_title: appCopy.position_title,
            category: appCopy.category, status: appCopy.status,
            application_date: appCopy.application_date, application_url: appCopy.application_url || "", notes: appCopy.notes || "",
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

  useEffect(() => {
    const handler = () => setCardMenuOpen(null);
    if (cardMenuOpen) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [cardMenuOpen]);

  const isDark = document.documentElement.classList.contains("dark");

  const getStatusLabel = (status: string) => {
    const colId = getColumnId(status);
    return columns.find(c => c.id === colId)?.label || status;
  };

  const getStatusColor = (status: string) => {
    const colId = getColumnId(status);
    const col = columns.find(c => c.id === colId);
    return col || columns[0];
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-screen bg-background">

        {/* Slim Banner Header */}
        <div className="max-w-xl lg:max-w-6xl mx-auto px-5 pt-6">
          <div
            style={{
              background: bannerGradient,
              borderRadius: 14,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "-0.3px", margin: 0 }}>
                <em style={{ fontStyle: "italic" }}>Resource</em> Studio
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "2px 0 0" }}>
                Career templates and application tracker
              </p>
            </div>
            <Popover open={bannerColorPickerOpen} onOpenChange={setBannerColorPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px",
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 8, color: "white", fontSize: 12, fontWeight: 500,
                    cursor: "pointer", backdropFilter: "blur(4px)",
                  }}
                >
                  <Pencil size={12} /> Customize
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Banner Color</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  {bannerColorPresets.map(p => (
                    <button
                      key={p.color}
                      onClick={async () => {
                        await upsertPrefs.mutateAsync({ applications_header_value: p.color } as any);
                        setBannerColorPickerOpen(false);
                        toast.success("Banner updated");
                      }}
                      title={p.label}
                      style={{
                        width: 28, height: 28, borderRadius: "50%", background: p.color,
                        border: savedBannerColor === p.color ? "2px solid white" : "2px solid transparent",
                        boxShadow: savedBannerColor === p.color ? "0 0 0 2px #10B981" : "0 0 0 1px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={async () => {
                    await upsertPrefs.mutateAsync({ applications_header_value: null } as any);
                    setBannerColorPickerOpen(false);
                    toast.success("Reset to default");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition"
                >
                  Reset to default
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-xl lg:max-w-6xl mx-auto px-5">
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, marginBottom: 0 }}>
            {[
              { id: 'applications' as const, label: 'Applications', Icon: Briefcase },
              { id: 'resources' as const, label: 'Resource Center', Icon: Sparkles },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAppTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 16px", border: "none",
                  borderBottom: `2px solid ${appTab === tab.id ? "#10B981" : "transparent"}`,
                  background: "transparent",
                  fontSize: 14, fontWeight: appTab === tab.id ? 600 : 400,
                  color: appTab === tab.id ? (isDark ? "#F2F2F2" : "#111827") : (isDark ? "rgba(255,255,255,0.5)" : "#6B7280"),
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                  marginBottom: -1, transition: "all 150ms",
                }}
              >
                <tab.Icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {appTab === 'resources' ? (
          <div className="max-w-xl lg:max-w-6xl mx-auto px-5 py-8">
            <ResourcesPage />
          </div>
        ) : (
        <div className="max-w-xl lg:max-w-6xl mx-auto px-5 py-8 space-y-10">

          {/* SECTION 1: Career Templates */}
          <ResourceStudioSection userId={user?.id} userEmail={user?.email} />

          {/* SECTION 2: Applications Tracker */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }} className="text-foreground">Applications Tracker</h2>
                <p style={{ fontSize: 13 }} className="text-muted-foreground">{applications.length} applications tracked</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {/* View toggle */}
                <div style={{
                  display: "flex",
                  background: isDark ? "#252528" : "#F3F4F6",
                  borderRadius: 8, padding: 4, gap: 4,
                }}>
                  <button
                    onClick={() => setView("list")}
                    style={{
                      padding: "7px 12px", borderRadius: 6, border: "none",
                      background: view === "list" ? (isDark ? "#1C1C1E" : "white") : "transparent",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                      fontSize: 13, fontWeight: view === "list" ? 600 : 400,
                      boxShadow: view === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      color: isDark ? "#F2F2F2" : "#374151",
                    }}
                  >
                    <List size={14} /> List
                  </button>
                  <button
                    onClick={() => setView("kanban")}
                    style={{
                      padding: "7px 12px", borderRadius: 6, border: "none",
                      background: view === "kanban" ? (isDark ? "#1C1C1E" : "white") : "transparent",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                      fontSize: 13, fontWeight: view === "kanban" ? 600 : 400,
                      boxShadow: view === "kanban" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                      color: isDark ? "#F2F2F2" : "#374151",
                    }}
                  >
                    <LayoutGrid size={14} /> Kanban
                  </button>
                </div>
                <button
                  onClick={() => { setEditingApp(null); setForm({ company_name: "", position_title: "", category: "job", status: "applied", application_date: format(new Date(), "yyyy-MM-dd"), application_url: "", notes: "" }); setShowForm(true); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  <Plus size={15} /> Add Application
                </button>
              </div>
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
            ) : view === "list" ? (
              /* LIST VIEW */
              <div style={{
                background: isDark ? "#1C1C1E" : "white",
                borderRadius: 12,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
                overflow: "hidden",
              }}>
                {/* Table header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr auto",
                  padding: "12px 16px",
                  background: isDark ? "#252528" : "#F9FAFB",
                  borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
                  fontSize: 12, fontWeight: 600, color: "#6B7280",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  <span>Company</span>
                  <span>Role</span>
                  <span>Type</span>
                  <span>Status</span>
                  <span>Applied</span>
                  <span></span>
                </div>

                {filteredApps.map(app => {
                  const sc = getStatusColor(app.status);
                  return (
                    <div
                      key={app.id}
                      style={{
                        display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr auto",
                        padding: "14px 16px",
                        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB"}`,
                        alignItems: "center", cursor: "pointer",
                      }}
                      className="hover:bg-secondary/50 transition-colors"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 800, color: "#7B5EA7", flexShrink: 0,
                        }}>
                          {app.company_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600 }} className="text-foreground">{app.company_name}</span>
                      </div>
                      <span style={{ fontSize: 14 }} className="text-muted-foreground">{app.position_title}</span>
                      <span style={{
                        display: "inline-flex", padding: "3px 10px", borderRadius: 999,
                        fontSize: 11, fontWeight: 600, background: "#F5F3FF", color: "#7B5EA7", width: "fit-content",
                      }}>
                        {categoryLabels[app.category] || app.category}
                      </span>
                      <span style={{
                        display: "inline-flex", padding: "3px 10px", borderRadius: 999,
                        fontSize: 11, fontWeight: 600, width: "fit-content",
                        background: isDark ? sc.darkBg : sc.bg,
                        color: sc.color,
                      }}>
                        {getStatusLabel(app.status)}
                      </span>
                      <span style={{ fontSize: 13 }} className="text-muted-foreground">
                        {new Date(app.application_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleEdit(app)} style={{ padding: 6, border: "none", background: "transparent", cursor: "pointer", borderRadius: 6 }} className="text-muted-foreground hover:text-foreground">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(app)} style={{ padding: 6, border: "none", background: "transparent", cursor: "pointer", borderRadius: 6 }} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredApps.length === 0 && (
                  <div style={{ padding: "60px 20px", textAlign: "center" }}>
                    <Inbox size={40} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }} className="text-foreground">No applications yet</p>
                    <p style={{ fontSize: 13 }} className="text-muted-foreground">Add your first application to start tracking</p>
                  </div>
                )}
              </div>
            ) : (
              /* KANBAN VIEW */
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
                              padding: 14, cursor: "grab", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", position: "relative",
                            }}
                          >
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
                            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }} className="text-foreground">{card.company_name}</p>
                            <p style={{ fontSize: 12, marginBottom: 10 }} className="text-muted-foreground">{card.position_title}</p>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                              <span style={{
                                background: col.color + "15", color: col.color,
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.5px",
                              }}>
                                {categoryLabels[card.category] || card.category}
                              </span>
                            </div>
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
                            <p style={{ fontSize: 13, marginTop: 8, textAlign: "center" }} className="text-muted-foreground">No applications here yet</p>
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
        )}

        {/* Add/Edit Application Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => { setShowForm(false); setEditingApp(null); }}>
            <div className="w-full max-w-[500px] rounded-2xl bg-card p-7 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 style={{ fontSize: 20, fontWeight: 700 }} className="text-foreground">{editingApp ? "Edit Application" : "Add Application"}</h3>
                <button onClick={() => { setShowForm(false); setEditingApp(null); }} className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Company Name *</Label><Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder="e.g. Google" className="rounded-xl" /></div>
                <div className="space-y-1"><Label>Role/Position *</Label><Input value={form.position_title} onChange={e => setForm(p => ({ ...p, position_title: e.target.value }))} className="rounded-xl" placeholder="e.g. Software Engineer" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Application Type *</Label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      <option value="job">Job</option><option value="internship">Internship</option><option value="fellowship">Fellowship</option><option value="brand_collab">Brand Collab</option><option value="college">College</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      <option value="applied">Applied</option><option value="interview">In Interview</option><option value="completed">Completed</option><option value="closed">Didn't Work Out</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1"><Label>Applied Date</Label><Input type="date" value={form.application_date} onChange={e => setForm(p => ({ ...p, application_date: e.target.value }))} className="rounded-xl" /></div>
                <div className="space-y-1"><Label>Application URL (optional)</Label><Input value={form.application_url} onChange={e => setForm(p => ({ ...p, application_url: e.target.value }))} placeholder="Link to job posting" className="rounded-xl" /></div>
                <div className="space-y-1"><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Interview notes, contacts..." rows={3} className="rounded-xl" /></div>
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
                <button onClick={handleDeleteConfirm} style={{ flex: 1, padding: "10px 20px", background: "#DC2626", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
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

      <style>{`
        @media (max-width: 768px) {
          .kanban-board { grid-template-columns: 1fr !important; overflow-x: auto; }
        }
      `}</style>
    </AppShell>
  );
}

/* ─── Resource Studio Section (Templates) ─── */

function ResourceStudioSection({ userId, userEmail }: { userId?: string; userEmail?: string }) {
  const isAdmin = userEmail === "myslimher@gmail.com";
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [cardMenuId, setCardMenuId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isDark = document.documentElement.classList.contains("dark");

  useEffect(() => {
    (supabase as any)
      .from("shop_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(4)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setTemplates(data);
        } else {
          // Seed with defaults if none exist
          setTemplates(defaultTemplateData.map((t, i) => ({
            id: `default-${i}`,
            title: t.name,
            description: t.description,
            file_url: null,
            preview_image_url: null,
            price_cents: 800,
            template_type: "resume",
            is_active: true,
          })));
        }
        setLoading(false);
      });
  }, []);

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

  const handleFileUpload = async (templateId: string, file: File) => {
    if (!userId) return;
    setUploadingId(templateId);
    const path = `templates/${templateId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("template-files").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploadingId(null); return; }

    // Update the shop_templates row with file_url
    await (supabase as any).from("shop_templates").update({ file_url: path }).eq("id", templateId);
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, file_url: path } : t));
    setUploadingId(null);
    toast.success("File uploaded successfully!");
  };

  const handlePreview = async (template: any) => {
    if (!template.file_url) { toast.error("No file uploaded yet"); return; }
    const { data } = await supabase.storage.from("template-files").createSignedUrl(template.file_url, 600);
    if (data?.signedUrl) {
      setPreviewTemplate({ ...template, signedUrl: data.signedUrl });
    } else {
      toast.error("Could not generate preview");
    }
  };

  const handleDownload = async (template: any) => {
    if (!template.file_url) { toast.error("File not available"); return; }
    if (userId) {
      await (supabase as any).from("template_downloads").insert({ template_id: template.id, user_id: userId });
    }
    const { data } = await supabase.storage.from("template-files").createSignedUrl(template.file_url, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
      toast.success("Download started!");
    }
  };

  const openStripeForSingle = () => {
    window.location.href = SINGLE_STRIPE_URL;
  };

  const openStripeForBundle = () => {
    window.location.href = BUNDLE_STRIPE_URL;
  };

  const handleDeleteFile = async (templateId: string, fileUrl: string) => {
    await supabase.storage.from("template-files").remove([fileUrl]);
    await (supabase as any).from("shop_templates").update({ file_url: null }).eq("id", templateId);
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, file_url: null } : t));
    setCardMenuId(null);
    toast.success("File removed");
  };

  const handlePreviewImageUpload = async (templateId: string, file: File) => {
    if (!userId) return;
    const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) { toast.error("Only PNG, JPG, WEBP allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const path = `${templateId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("template-previews").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("template-previews").getPublicUrl(path);
    await (supabase as any).from("shop_templates").update({ preview_image_url: publicUrl }).eq("id", templateId);
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, preview_image_url: publicUrl } : t));
    toast.success("Preview image uploaded!");
  };

  if (loading) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Sparkles size={16} color="#10B981" />
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }} className="text-foreground">Career Templates</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />Loading templates...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Section title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="#10B981" />
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }} className="text-foreground">Career Templates</h2>
        </div>
        <p style={{ fontSize: 13 }} className="text-muted-foreground">Preview free · Purchase to download</p>
      </div>

      {/* 2x2 Template Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {templates.slice(0, 4).map((template, idx) => (
          <div
            key={template.id}
            className="template-card"
            style={{
              background: isDark ? "#1C1C1E" : "white",
              borderRadius: 16,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
              overflow: "hidden",
            }}
          >
            {/* Card header */}
            <div style={{ padding: "16px 16px 12px" }}>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }} className="text-foreground">{template.title || defaultTemplateData[idx]?.name}</p>
              <p style={{ fontSize: 12, lineHeight: 1.4 }} className="text-muted-foreground">{template.description || defaultTemplateData[idx]?.description}</p>
            </div>

            {/* Admin Upload zones */}
            {isAdmin && !template.file_url && (
              <div style={{ padding: "0 16px 12px" }}>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(template.id, f); }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf,.docx,.doc";
                    input.onchange = (ev: any) => { const f = ev.target.files?.[0]; if (f) handleFileUpload(template.id, f); };
                    input.click();
                  }}
                  style={{
                    border: `2px dashed ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    borderRadius: 10, padding: "32px 16px", textAlign: "center",
                    background: isDark ? "#252528" : "#F9FAFB", cursor: "pointer",
                  }}
                >
                  <Upload size={24} style={{ margin: "0 auto 8px", color: "#9CA3AF" }} />
                  <p style={{ fontSize: 13 }} className="text-muted-foreground">
                    <span style={{ fontWeight: 600 }} className="text-foreground">Click to upload</span> or drop file here
                  </p>
                  <p style={{ fontSize: 11, marginTop: 4, color: "#9CA3AF" }}>PDF, DOCX up to 10MB</p>
                </div>
              </div>
            )}

            {/* Admin Preview Image Upload */}
            {isAdmin && !template.preview_image_url && (
              <div style={{ padding: "0 16px 12px" }}>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>Preview Image (thumbnail)</p>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePreviewImageUpload(template.id, f); }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/png,image/jpg,image/jpeg,image/webp";
                    input.onchange = (ev: any) => { const f = ev.target.files?.[0]; if (f) handlePreviewImageUpload(template.id, f); };
                    input.click();
                  }}
                  style={{
                    border: `2px dashed ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    borderRadius: 10, padding: "20px 16px", textAlign: "center",
                    background: isDark ? "#252528" : "#F9FAFB", cursor: "pointer",
                  }}
                >
                  <Upload size={18} style={{ margin: "0 auto 6px", color: "#9CA3AF" }} />
                  <p style={{ fontSize: 12 }} className="text-muted-foreground">
                    <span style={{ fontWeight: 600 }} className="text-foreground">Upload preview</span> PNG, JPG, WEBP
                  </p>
                </div>
              </div>
            )}

            {/* Uploading state */}
            {uploadingId === template.id && (
              <div style={{ padding: "0 16px 16px", textAlign: "center" }}>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                <p style={{ fontSize: 13 }} className="text-muted-foreground">Uploading file...</p>
              </div>
            )}

            {/* Card thumbnail — always show if preview_image_url exists, or file_url exists */}
            {(template.preview_image_url || template.file_url) && uploadingId !== template.id && (
              <div style={{ position: "relative", margin: "0 16px 16px", borderRadius: 10, overflow: "hidden" }}>
                {template.preview_image_url ? (
                  <img
                    src={template.preview_image_url}
                    alt={template.title}
                    style={{
                      width: "100%",
                      aspectRatio: "3/4",
                      objectFit: "cover",
                      objectPosition: "top",
                      borderRadius: 8,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
                      display: "block",
                    }}
                  />
                ) : (
                  <div style={{
                    aspectRatio: "3/4",
                    background: isDark ? "#252528" : "#F5F3FF",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    borderRadius: 8, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
                  }}>
                    <FileText size={40} style={{ color: "#7B5EA7", opacity: 0.4 }} />
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>No preview yet</p>
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className="preview-overlay"
                  style={{
                    position: "absolute", inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: 0, transition: "opacity 200ms",
                  }}
                >
                  <button
                    onClick={() => handlePreview(template)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", background: "#10B981", color: "white",
                      border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <Eye size={14} /> Preview
                  </button>
                  {isAdmin && (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCardMenuId(cardMenuId === template.id ? null : template.id); }}
                        style={{ padding: 8, background: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {cardMenuId === template.id && (
                        <div style={{
                          position: "absolute", right: 0, top: "100%", marginTop: 4,
                          background: isDark ? "#1C1C1E" : "white",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
                          borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 50,
                          minWidth: 140, overflow: "hidden",
                        }}>
                          <button
                            onClick={() => handleDeleteFile(template.id, template.file_url)}
                            style={{ width: "100%", padding: "10px 14px", textAlign: "left", border: "none", background: "transparent", fontSize: 13, color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                          >
                            <Trash2 size={13} /> Remove File
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin synced info */}
            {isAdmin && template.file_url && uploadingId !== template.id && (
              <div style={{
                margin: "0 16px 16px",
                padding: "10px 14px", borderRadius: 10,
                background: isDark ? "rgba(59,130,246,0.1)" : "#EFF6FF",
                border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "#BFDBFE"}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Info size={14} style={{ color: "#3B82F6", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: isDark ? "#93C5FD" : "#1E40AF" }}>File uploaded. Users can preview and purchase to download.</p>
              </div>
            )}

            {/* Preview / Download buttons */}
            <div style={{ padding: "0 16px 16px", display: "flex", gap: 8 }}>
              {template.file_url && (
                <button
                  onClick={() => handlePreview(template)}
                  style={{
                    flex: 1, padding: 10,
                    background: "transparent",
                    border: `1.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "#E5E7EB"}`,
                    borderRadius: 999, fontSize: 13, fontWeight: 500,
                    color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all 150ms", minHeight: 44,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#10B981"; e.currentTarget.style.color = "#10B981"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.15)" : "#E5E7EB"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.7)" : "#374151"; }}
                >
                  <Eye size={14} /> Preview
                </button>
              )}
              {hasPurchased ? (
                <button
                  onClick={() => handleDownload(template)}
                  style={{
                    flex: 1, padding: 10,
                    background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4",
                    border: `1.5px solid ${isDark ? "rgba(16,185,129,0.3)" : "#BBF7D0"}`,
                    borderRadius: 999, fontSize: 13, fontWeight: 600,
                    color: isDark ? "#10B981" : "#065F46",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all 150ms", minHeight: 44,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#10B981"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#10B981"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4"; e.currentTarget.style.color = isDark ? "#10B981" : "#065F46"; e.currentTarget.style.borderColor = isDark ? "rgba(16,185,129,0.3)" : "#BBF7D0"; }}
                >
                  <Download size={14} /> Download
                </button>
              ) : (
                <button
                  onClick={() => { window.location.href = SINGLE_STRIPE_URL; }}
                  style={{
                    flex: 1, padding: 10,
                    background: "#10B981", color: "white",
                    border: "none", borderRadius: 999, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all 150ms", minHeight: 44,
                  }}
                >
                  <Download size={14} /> Download — $8
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal (fullscreen PDF) */}
      {previewTemplate && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          zIndex: 9999, display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            background: isDark ? "#1C1C1E" : "white",
            padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
          }}>
            <p style={{ fontWeight: 700, fontSize: 15 }} className="text-foreground">{previewTemplate.title}</p>
            <button onClick={() => setPreviewTemplate(null)} style={{ padding: 6, border: "none", background: "transparent", cursor: "pointer" }} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          {/* Content area with conditional blur */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <iframe src={previewTemplate.signedUrl} style={{ width: "100%", height: "100%", border: "none" }} />

            {/* Blur overlay for non-purchasers */}
            {!hasPurchased && !isAdmin && (
              <>
                {/* Gradient + blur overlay starting at 30% */}
                <div style={{
                  position: "absolute", left: 0, right: 0, top: "30%", bottom: 0,
                  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                  background: isDark
                    ? "linear-gradient(to bottom, rgba(17,17,18,0) 0%, rgba(17,17,18,0.7) 30%, rgba(17,17,18,0.95) 100%)"
                    : "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.95) 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }} />

                {/* Purchase CTA card */}
                <div style={{
                  position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)",
                  background: isDark ? "#1C1C1E" : "white",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  borderRadius: 16, padding: "28px 32px", textAlign: "center",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  maxWidth: 340, width: "90%",
                  zIndex: 2,
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#9CA3AF" : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }} className="text-foreground">Purchase to unlock full access</p>
                  <p style={{ fontSize: 13, marginBottom: 16 }} className="text-muted-foreground">Get the full template to customize</p>
                  <button
                    onClick={() => { window.location.href = SINGLE_STRIPE_URL; }}
                    style={{
                      width: "100%", padding: "12px 20px",
                      background: "#10B981", color: "white",
                      border: "none", borderRadius: 10,
                      fontSize: 14, fontWeight: 600, cursor: "pointer",
                      minHeight: 44, marginBottom: 10,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Download Template — $8
                  </button>
                  <button
                    onClick={() => { window.location.href = BUNDLE_STRIPE_URL; }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 500,
                      color: "#7B5EA7", textDecoration: "underline",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Or get all templates for $25
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer — only show for purchasers/admin */}
          {(hasPurchased || isAdmin) && (
            <div style={{
              padding: "16px 24px",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6"}`,
              background: isDark ? "#111112" : "#F9FAFB",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0,
            }}>
              <div>
                <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.6)" : "#6B7280", marginBottom: 2 }}>Ready to download</p>
              </div>
              <button
                onClick={() => { handleDownload(previewTemplate); setPreviewTemplate(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 24px", background: "#10B981", color: "white",
                  border: "none", borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Download size={14} /> Download Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hover style for preview overlay */}
      <style>{`
        .template-card:hover .preview-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
