import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useArchivedProjects, useRestoreProject, useDeleteArchivedProject } from "@/hooks/useArchivedProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Moon, Sun, Sparkles, ExternalLink, Palette, Shield, Camera, Brain, FileText, Calendar, MessageSquare, Zap, Workflow, Layers, Github, TrendingUp, CheckCircle, Columns, AlertCircle, Archive, RotateCcw, Trash2, Settings, HeadphonesIcon, Star, CreditCard, Crown, GraduationCap, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51T0ZZyDs3UlCCXBa9qLPUy9c2w3osnYHXs1JKuALZkoOWZ688sRtnGzOJ0AaXXlD0CGI0cUSH9gOjzmlRRmcASeU00YOjg9k0v");

const accentColors = [
  { label: "Purple", value: "#8B5CF6" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Green", value: "#10B981" },
  { label: "Orange", value: "#F59E0B" },
  { label: "Pink", value: "#EC4899" },
  { label: "Red", value: "#EF4444" },
  { label: "Black", value: "#1A1A1A" },
  { label: "Brown", value: "#6B4226" },
];

const sidebarIconItems = [
  { label: "Home", defaultColor: "#8B5CF6" },
  { label: "Projects", defaultColor: "#F59E0B" },
  { label: "Finance", defaultColor: "#F59E0B" },
  { label: "Wealth Tracker", defaultColor: "#10B981" },
  { label: "Applications Tracker", defaultColor: "#3B82F6" },
  { label: "Calendar", defaultColor: "#3B82F6" },
  { label: "Team", defaultColor: "#6B7280" },
];

const fontOptions = ["Inter", "Georgia", "Mono", "System"];
const sizeOptions = ["Small", "Medium", "Large"];
const spacingOptions = ["Compact", "Comfortable", "Spacious"];

type ResourceItem = {
  id: number;
  name: string;
  description: string;
  image: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  category: string;
  url: string;
  isIntegration?: boolean;
};

const getFaviconUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (parsed.protocol === "mailto:") return null;
    if (parsed.hostname === "" || parsed.hash) return null;
    // Try multiple favicon sources with fallback
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`;
  } catch {
    return null;
  }
};

const aiResources: ResourceItem[] = [
  { id: 1, name: "Gamma", description: "Make a pitch deck/powerpoint in minutes", image: "", category: "Presentations", url: "https://gamma.app" },
  { id: 2, name: "Midjourney", description: "Create stunning AI-generated images and art", image: "", category: "Image Generation", url: "https://midjourney.com" },
  { id: 3, name: "Runway", description: "AI video generation and editing tools", image: "", category: "Video", url: "https://runwayml.com" },
  { id: 4, name: "Zocks", description: "AI-powered meeting notes and action items", image: "", category: "Finance", url: "https://zocks.ai" },
  { id: 5, name: "Monarch Money", description: "Smart financial tracking and budgeting with AI insights", image: "", category: "Finance", url: "https://monarchmoney.com" },
  { id: 6, name: "Luma", description: "Beautiful event pages and calendar management", image: "", category: "Events", url: "https://lu.ma" },
  { id: 7, name: "Posh VIP", description: "Premium event hosting and ticketing platform", image: "", category: "Events", url: "https://posh.vip" },
  { id: 8, name: "Partiful", description: "Fun and easy party planning and invitations", image: "", category: "Events", url: "https://partiful.com" },
  { id: 100, name: "Claude AI", description: "Power your AI Brain Dump with Claude's advanced reasoning", image: "", icon: Brain, iconColor: "text-purple-500", category: "AI", url: "https://anthropic.com", isIntegration: true },
  { id: 101, name: "ChatGPT", description: "Alternative AI assistant for task suggestions and planning", image: "", icon: Sparkles, iconColor: "text-blue-500", category: "AI", url: "https://chat.openai.com", isIntegration: true },
  { id: 102, name: "Notion", description: "Sync your projects and tasks with Notion workspaces", image: "", icon: FileText, iconColor: "text-foreground", category: "Productivity", url: "https://notion.so", isIntegration: true },
  { id: 103, name: "Google Calendar", description: "Two-way sync with your Google Calendar events", image: "", icon: Calendar, iconColor: "text-red-500", category: "Productivity", url: "https://calendar.google.com", isIntegration: true },
  { id: 104, name: "Slack", description: "Get task reminders and updates in your Slack channels", image: "", icon: MessageSquare, iconColor: "text-purple-500", category: "Communication", url: "https://slack.com", isIntegration: true },
  { id: 105, name: "Zapier", description: "Connect to 5,000+ apps with automated workflows", image: "", icon: Zap, iconColor: "text-orange-500", category: "Automation", url: "https://zapier.com", isIntegration: true },
  { id: 106, name: "Make", description: "Build complex automation scenarios visually", image: "", icon: Workflow, iconColor: "text-blue-500", category: "Automation", url: "https://make.com", isIntegration: true },
  { id: 107, name: "Figma", description: "Import design files and link to project tasks", image: "", icon: Layers, iconColor: "text-pink-500", category: "Design", url: "https://figma.com", isIntegration: true },
  { id: 108, name: "GitHub", description: "Track issues and pull requests as project tasks", image: "", icon: Github, iconColor: "text-foreground", category: "Development", url: "https://github.com", isIntegration: true },
  { id: 109, name: "Linear", description: "Sync engineering tasks and sprint planning", image: "", icon: TrendingUp, iconColor: "text-purple-500", category: "Development", url: "https://linear.app", isIntegration: true },
  { id: 110, name: "Asana", description: "Import existing Asana projects and workflows", image: "", icon: CheckCircle, iconColor: "text-pink-500", category: "Productivity", url: "https://asana.com", isIntegration: true },
  { id: 111, name: "Trello", description: "Migrate your Trello boards to Digital Home", image: "", icon: Columns, iconColor: "text-blue-500", category: "Productivity", url: "https://trello.com", isIntegration: true },
];

const categories = ["All", "AI", "Productivity", "Automation", "Development", "Design", "Communication", "Presentations", "Image Generation", "Video", "Finance", "Events", "College"];

const settingsTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "account", label: "Account", icon: Shield },
  { id: "resources", label: "AI Resources", icon: Sparkles },
  { id: "archived", label: "Archived Projects", icon: Archive },
  { id: "support", label: "Support", icon: HeadphonesIcon },
] as const;

type SettingsTab = typeof settingsTabs[number]["id"];

export default function SettingsPage() {
  const { user, profile, signOut, updateProfile, updatePassword } = useAuth();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: archivedProjects = [] } = useArchivedProjects();
  const restoreProject = useRestoreProject();
  const deleteArchivedProject = useDeleteArchivedProject();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(prefs?.bio || "");
  const [location, setLocation] = useState(prefs?.location || "");
  const [website, setWebsite] = useState(prefs?.website || "");
  const [videoUrl, setVideoUrl] = useState((prefs as any)?.welcome_video_url || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tab = searchParams.get("tab");
    return (tab && settingsTabs.some(t => t.id === tab) ? tab : "profile") as SettingsTab;
  });
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("category") || "All");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [engagementCounts, setEngagementCounts] = useState<Record<number, { clicks: number; signups: number }>>({});
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [selectedSize, setSelectedSize] = useState("Medium");
  const [selectedSpacing, setSelectedSpacing] = useState("Comfortable");
  const [sidebarColors, setSidebarColors] = useState<Record<string, string>>({});
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackEmail, setFeedbackEmail] = useState(user?.email || "");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [studentDiscount, setStudentDiscount] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStep, setVerificationStep] = useState<"idle" | "sent" | "verified">("idle");
  const [verifying, setVerifying] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  useEffect(() => {
    if (prefs) {
      setBio(prefs.bio || "");
      setLocation(prefs.location || "");
      setWebsite(prefs.website || "");
      setVideoUrl((prefs as any)?.welcome_video_url || "");
      if (prefs.font_size) setSelectedSize(prefs.font_size);
      if (prefs.density) setSelectedSpacing(prefs.density);
      const accColors = prefs.accent_colors as any;
      if (accColors?.sidebarColors) setSidebarColors(accColors.sidebarColors);
      if (accColors?.font) setSelectedFont(accColors.font);
      if (prefs.student_verified) {
        setVerificationStep("verified");
        setStudentDiscount(true);
      }
      if (prefs.student_email) setStudentEmail(prefs.student_email);
    }
  }, [prefs]);

  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("resource_engagements")
        .select("resource_id, engagement_type");
      if (!data) return;
      const counts: Record<number, { clicks: number; signups: number }> = {};
      data.forEach((row: any) => {
        if (!counts[row.resource_id]) counts[row.resource_id] = { clicks: 0, signups: 0 };
        if (row.engagement_type === "click") counts[row.resource_id].clicks++;
        else if (row.engagement_type === "signup") counts[row.resource_id].signups++;
      });
      setEngagementCounts(counts);
    };
    fetchCounts();
  }, []);

  const trackClick = async (resource: ResourceItem) => {
    if (!user) return;
    await supabase.from("resource_engagements").insert({
      resource_id: resource.id,
      resource_name: resource.name,
      engagement_type: "click",
      user_id: user.id,
    });
    setEngagementCounts((prev) => ({
      ...prev,
      [resource.id]: {
        clicks: (prev[resource.id]?.clicks || 0) + 1,
        signups: prev[resource.id]?.signups || 0,
      },
    }));
  };

  const trackSignup = async (resource: ResourceItem) => {
    if (!user) return;
    await supabase.from("resource_engagements").insert({
      resource_id: resource.id,
      resource_name: resource.name,
      engagement_type: "signup",
      user_id: user.id,
    });
    setEngagementCounts((prev) => ({
      ...prev,
      [resource.id]: {
        clicks: prev[resource.id]?.clicks || 0,
        signups: (prev[resource.id]?.signups || 0) + 1,
      },
    }));
  };

  const handleRestoreProject = async (projectId: string) => {
    await restoreProject.mutateAsync(projectId);
    toast.success("Project restored to active projects");
  };

  const handleDeleteArchivedProject = async (projectId: string) => {
    const project = archivedProjects?.find(p => p.id === projectId);
    if (!project) return;
    if (confirm(`Permanently delete "${project.name}"? This cannot be undone.`)) {
      await deleteArchivedProject.mutateAsync(projectId);
      toast.success("Project permanently deleted");
    }
  };

  const filteredResources = selectedCategory === "All"
    ? aiResources : aiResources.filter((r) => r.category === selectedCategory);

  const themeColor = prefs?.theme_color || "#8B5CF6";

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile({ full_name: fullName.trim() });
    if (!error) {
      await upsertPrefs.mutateAsync({ bio, location, website });
      toast.success("Profile saved");
    } else {
      toast.error("Failed to save profile");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPw(true);
    const { error } = await updatePassword(newPassword);
    setChangingPw(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setNewPassword(""); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    setUploadingPhoto(true);
    const path = `${user.id}/profile/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("user-assets").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploadingPhoto(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("user-assets").getPublicUrl(path);
    await upsertPrefs.mutateAsync({ profile_photo: publicUrl });
    setUploadingPhoto(false);
    toast.success("Photo updated");
  };

  const handleSidebarColorChange = (label: string, color: string) => {
    const newColors = { ...sidebarColors, [label]: color };
    setSidebarColors(newColors);
    const accColors = (prefs?.accent_colors as any) || {};
    upsertPrefs.mutate({ accent_colors: { ...accColors, sidebarColors: newColors } } as any);
  };

  const handleResetSidebarColor = (label: string) => {
    const newColors = { ...sidebarColors };
    delete newColors[label];
    setSidebarColors(newColors);
    const accColors = (prefs?.accent_colors as any) || {};
    upsertPrefs.mutate({ accent_colors: { ...accColors, sidebarColors: newColors } } as any);
  };

  const handleFontChange = (font: string) => {
    setSelectedFont(font);
    const accColors = (prefs?.accent_colors as any) || {};
    upsertPrefs.mutate({ accent_colors: { ...accColors, font } } as any);
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    upsertPrefs.mutate({ font_size: size } as any);
  };

  const handleSpacingChange = (spacing: string) => {
    setSelectedSpacing(spacing);
    upsertPrefs.mutate({ density: spacing } as any);
  };

  const initials = (profile?.full_name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <AppShell>
      <div className="w-full min-h-screen bg-background">
        {/* SLIM GRADIENT BANNER */}
        <div className="w-full h-[100px] relative" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 pb-20 relative" style={{ marginTop: '-40px' }}>
          {/* PAGE HEADER */}
          <div className="bg-card rounded-2xl p-6 px-10 mb-8 shadow-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                <Settings size={20} className="text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your profile, appearance, and account</p>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
            {/* LEFT SIDEBAR */}
            <div className="bg-card rounded-xl p-2 border border-border sticky top-6">
              <nav className="space-y-0.5">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                        activeTab === tab.id
                          ? "bg-secondary font-medium text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* RIGHT CONTENT AREA */}
            <div className="space-y-6">
              {/* ==================== PROFILE TAB ==================== */}
              {activeTab === "profile" && (
                <>
                  {/* Avatar section */}
                  <div className="flex flex-col items-center mb-10">
                    <div className="relative group">
                      <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-4 border-card shadow-md overflow-hidden" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}>
                        {prefs?.profile_photo ? (
                          <img src={prefs.profile_photo} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-4xl font-bold text-white">{initials}</span>
                        )}
                      </div>
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Camera className="h-6 w-6 text-white" />
                      </button>
                      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoUpload} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {uploadingPhoto ? "Uploading..." : "Click to change photo"}
                    </p>
                    {profile?.founding_member && (
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 border border-amber-200">
                        ⭐ Founding Member
                      </span>
                    )}
                  </div>

                  {/* Form fields */}
                  <div className="max-w-[600px] mx-auto">
                    <div className="bg-card rounded-xl border border-border p-8 shadow-sm space-y-5">
                      <div className="space-y-2">
                        <Label>Full name</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user?.email || ""} disabled className="bg-muted opacity-60" />
                      </div>
                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="A short bio about yourself"
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
                        </div>
                        <div className="space-y-2">
                          <Label>Website</Label>
                          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>I am a:</Label>
                        <select
                          value={(prefs as any)?.user_type || "other"}
                          onChange={(e) => upsertPrefs.mutate({ user_type: e.target.value } as any)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                          <option value="professional">Professional</option>
                          <option value="entrepreneur">Entrepreneur</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                        {saving ? "Saving..." : "Save Profile"}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* ==================== APPEARANCE TAB ==================== */}
              {activeTab === "appearance" && (
                <>
                  {/* Theme toggle */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Theme</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => { document.documentElement.classList.remove("dark"); setDarkMode(false); }}
                        className={cn(
                          "rounded-xl border-2 p-4 text-left transition-all",
                          !darkMode ? "border-primary" : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Sun size={16} className="text-muted-foreground" />
                          <span className="font-medium text-sm">Light</span>
                        </div>
                        <div className="h-8 rounded bg-gray-200" />
                      </button>
                      <button
                        onClick={() => { document.documentElement.classList.add("dark"); setDarkMode(true); }}
                        className={cn(
                          "rounded-xl border-2 p-4 text-left transition-all",
                          darkMode ? "border-primary" : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Moon size={16} className="text-muted-foreground" />
                          <span className="font-medium text-sm">Dark</span>
                        </div>
                        <div className="h-8 rounded bg-gray-800" />
                      </button>
                    </div>
                  </div>

                  {/* Accent color */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Accent color</h3>
                    <div className="flex gap-3 flex-wrap">
                      {accentColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => upsertPrefs.mutate({ theme_color: color.value } as any)}
                          className={cn(
                            "w-12 h-12 rounded-full border-3 transition-all",
                            themeColor === color.value ? "ring-2 ring-offset-2 ring-foreground" : "border-transparent hover:scale-110"
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sidebar icon colors */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Sidebar icon colors</h3>
                    <p className="text-sm text-muted-foreground mb-5">Customize each sidebar icon color individually</p>
                    <div className="space-y-3">
                      {sidebarIconItems.map((item) => {
                        const currentColor = sidebarColors[item.label] || item.defaultColor;
                        return (
                          <div key={item.label} className="flex items-center justify-between py-1">
                            <span className="text-sm text-foreground">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <label className="relative">
                                <input
                                  type="color"
                                  value={currentColor}
                                  onChange={(e) => handleSidebarColorChange(item.label, e.target.value)}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
                                />
                                <div
                                  className="w-8 h-8 rounded-md border border-border cursor-pointer"
                                  style={{ backgroundColor: currentColor }}
                                />
                              </label>
                              <button
                                onClick={() => handleResetSidebarColor(item.label)}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Font */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Font</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {fontOptions.map((font) => (
                        <button
                          key={font}
                          onClick={() => handleFontChange(font)}
                          className={cn(
                            "rounded-xl border-2 px-6 py-4 text-sm font-medium transition-all",
                            selectedFont === font ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                          )}
                          style={{ fontFamily: font === "Mono" ? "monospace" : font === "System" ? "system-ui" : font === "Georgia" ? "Georgia, serif" : "Inter, sans-serif" }}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Size</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {sizeOptions.map((size) => (
                        <button
                          key={size}
                          onClick={() => handleSizeChange(size)}
                          className={cn(
                            "rounded-xl border-2 px-6 py-4 text-sm font-medium transition-all",
                            selectedSize === size ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spacing */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Spacing</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {spacingOptions.map((spacing) => (
                        <button
                          key={spacing}
                          onClick={() => handleSpacingChange(spacing)}
                          className={cn(
                            "rounded-xl border-2 px-6 py-4 text-sm font-medium transition-all",
                            selectedSpacing === spacing ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          {spacing}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Welcome Video */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Welcome Video</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set the video URL that shows to new users after onboarding.
                    </p>
                    <Input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.loom.com/embed/your-video-id"
                      className="mb-3"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={async () => {
                          await upsertPrefs.mutateAsync({ welcome_video_url: videoUrl } as any);
                          toast.success("Video URL saved");
                        }}
                        size="sm"
                      >
                        Save Video URL
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          await upsertPrefs.mutateAsync({ welcome_video_watched: false } as any);
                          toast.success("Video will show again on next visit to Welcome screen");
                        }}
                      >
                        Reset Video (show again)
                      </Button>
                    </div>
                  </div>

                  {/* Banner Color */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Dashboard Banner Color</h3>
                    <p className="text-sm text-muted-foreground mb-4">Choose a gradient color for your dashboard header</p>
                    <div className="flex gap-3 flex-wrap">
                      {['#6366F1','#EC4899','#8B5CF6','#10B981','#F59E0B','#EF4444'].map((c) => (
                        <button
                          key={c}
                          onClick={() => upsertPrefs.mutate({ banner_color: c } as any)}
                          className={cn(
                            "w-12 h-12 rounded-full transition-all",
                            (prefs as any)?.banner_color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-110"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Religion & Scripture */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-1">Faith & Inspiration</h3>
                    <p className="text-sm text-muted-foreground mb-4">Add spiritual content to your dashboard</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Religion</Label>
                        <select
                          value={(prefs as any)?.religion || "none"}
                          onChange={(e) => upsertPrefs.mutate({ religion: e.target.value } as any)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="none">None</option>
                          <option value="christianity">Christianity</option>
                          <option value="islam">Islam</option>
                          <option value="judaism">Judaism</option>
                          <option value="hinduism">Hinduism</option>
                          <option value="buddhism">Buddhism</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Show Daily Scripture</p>
                          <p className="text-xs text-muted-foreground">Display a scripture card on your dashboard</p>
                        </div>
                        <Switch
                          checked={(prefs as any)?.show_scripture_card === true}
                          onCheckedChange={(v) => upsertPrefs.mutate({ show_scripture_card: v } as any)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ==================== BILLING TAB ==================== */}
              {activeTab === "billing" && (
                <>
                  {/* Trial Status Card */}
                  {!profile?.founding_member && !prefs?.is_subscribed && prefs?.trial_end_date && (() => {
                    const endDate = new Date(prefs.trial_end_date);
                    const now = new Date();
                    const diffMs = endDate.getTime() - now.getTime();
                    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                    const isExpired = daysLeft === 0;
                    return (
                      <div className={cn(
                        "rounded-xl p-6 flex items-center gap-4 border",
                        isExpired
                          ? "bg-destructive/5 border-destructive/20"
                          : daysLeft <= 3
                          ? "bg-amber-50 border-amber-200"
                          : "bg-blue-50 border-blue-200"
                      )}>
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                          isExpired ? "bg-destructive/10" : daysLeft <= 3 ? "bg-amber-100" : "bg-blue-100"
                        )}>
                          {isExpired ? '🔒' : daysLeft <= 3 ? '⚠️' : '🎁'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-lg">
                            {isExpired ? "Trial Expired" : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your trial`}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {isExpired
                              ? "Subscribe to continue using all features."
                              : "Subscribe now to keep access to all features."}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Founding Member Badge */}
                  {profile?.founding_member && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">⭐</div>
                      <div>
                        <h4 className="font-semibold text-foreground text-lg">Founding Member — Lifetime Access</h4>
                        <p className="text-sm text-muted-foreground">
                          You're user #{(profile as any)?.user_number ?? '—'} — one of the first 50 to join. All features are yours forever, no payment needed.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Subscription Status + Manage */}
                  {!profile?.founding_member && prefs?.is_subscribed && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Crown size={20} className="text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Pro Membership Active</h4>
                          <p className="text-sm text-muted-foreground">
                            Plan: {(prefs as any)?.subscription_type === "student" ? "Student ($100/yr)" : "Pro ($200/yr)"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={managingBilling}
                        onClick={async () => {
                          setManagingBilling(true);
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            const res = await fetch(
                              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${session?.access_token}`,
                                },
                                body: JSON.stringify({
                                  returnUrl: `${window.location.origin}/settings?tab=billing`,
                                }),
                              }
                            );
                            const data = await res.json();
                            if (data.url) {
                              window.location.href = data.url;
                            } else {
                              toast.error(data.error || "Failed to open billing portal");
                            }
                          } catch {
                            toast.error("Failed to open billing portal");
                          } finally {
                            setManagingBilling(false);
                          }
                        }}
                      >
                        {managingBilling ? "Opening..." : "Manage Subscription"}
                      </Button>
                    </div>
                  )}

                  {/* Pro Membership Card — hidden for founding members */}
                  {!profile?.founding_member && (
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Crown size={24} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">Pro Membership</h3>
                        <p className="text-sm text-muted-foreground">Unlock the full Digital Home experience</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">
                          ${studentDiscount ? "100" : "200"}
                        </span>
                        <span className="text-muted-foreground">/year</span>
                        {studentDiscount && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            50% Student Discount
                          </span>
                        )}
                      </div>
                      {studentDiscount && (
                        <p className="text-sm text-muted-foreground mt-1 line-through">$200/year</p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {[
                        "Unlimited projects & tasks",
                        "AI Brain Dump & task generation",
                        "Vision Room with unlimited boards",
                        "Wealth & investment tracker",
                        "College & job application tracker",
                        "Team collaboration",
                        "Custom themes & branding",
                        "Priority support",
                        "All future features included",
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <Check size={16} className="text-primary shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Subscribe Button */}
                    {!(prefs as any)?.is_subscribed && (
                      <Button
                        className="w-full h-12 text-base font-semibold"
                        disabled={checkingOut}
                        onClick={async () => {
                          setCheckingOut(true);
                          try {
                            const { data: { session } } = await supabase.auth.getSession();
                            const baseUrl = window.location.origin;
                            const res = await fetch(
                              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${session?.access_token}`,
                                },
                                body: JSON.stringify({
                                  plan: studentDiscount ? "student" : "pro",
                                  successUrl: `${baseUrl}/dashboard?payment=success`,
                                  cancelUrl: `${baseUrl}/settings?tab=billing`,
                                }),
                              }
                            );
                            const data = await res.json();
                            if (data.url) {
                              window.location.href = data.url;
                            } else {
                              toast.error(data.error || "Failed to create checkout session");
                            }
                          } catch (err: any) {
                            toast.error("Failed to start checkout");
                          } finally {
                            setCheckingOut(false);
                          }
                        }}
                      >
                        {checkingOut ? "Redirecting to checkout..." : `Subscribe — $${studentDiscount ? "100" : "200"}/year`}
                      </Button>
                    )}
                  </div>
                  )}

                  {/* Student Discount Verification */}
                  {!(prefs as any)?.founding_member && !(prefs as any)?.is_subscribed && (
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <GraduationCap size={20} className="text-muted-foreground" />
                        <div>
                          <h4 className="font-medium text-foreground">Student Discount</h4>
                          <p className="text-sm text-muted-foreground">50% off with a valid student email</p>
                        </div>
                      </div>

                      {verificationStep === "verified" ? (
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Check size={16} />
                          <span>Verified: {studentEmail}</span>
                        </div>
                      ) : verificationStep === "sent" ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            A 6-digit code was sent to <strong>{studentEmail}</strong>. Check your email (and spam folder).
                          </p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter 6-digit code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              maxLength={6}
                              className="max-w-[200px]"
                            />
                            <Button
                              disabled={verifying || verificationCode.length !== 6}
                              onClick={async () => {
                                setVerifying(true);
                                try {
                                  const { data: { session } } = await supabase.auth.getSession();
                                  const res = await fetch(
                                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-verification`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${session?.access_token}`,
                                      },
                                      body: JSON.stringify({ action: "verify", code: verificationCode }),
                                    }
                                  );
                                  const data = await res.json();
                                  if (data.success) {
                                    setVerificationStep("verified");
                                    setStudentDiscount(true);
                                    toast.success("Student status verified! Discount applied.");
                                  } else {
                                    toast.error(data.error || "Verification failed");
                                  }
                                } catch {
                                  toast.error("Verification failed");
                                } finally {
                                  setVerifying(false);
                                }
                              }}
                            >
                              {verifying ? "Verifying..." : "Verify"}
                            </Button>
                          </div>
                          <button
                            className="text-xs text-muted-foreground underline"
                            onClick={() => setVerificationStep("idle")}
                          >
                            Use a different email
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="your-name@university.edu"
                              type="email"
                              value={studentEmail}
                              onChange={(e) => setStudentEmail(e.target.value.slice(0, 255))}
                              className="max-w-[320px]"
                            />
                            <Button
                              variant="secondary"
                              disabled={verifying || !studentEmail.trim().endsWith(".edu")}
                              onClick={async () => {
                                setVerifying(true);
                                try {
                                  const { data: { session } } = await supabase.auth.getSession();
                                  const res = await fetch(
                                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-verification`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${session?.access_token}`,
                                      },
                                      body: JSON.stringify({ action: "send", email: studentEmail.trim() }),
                                    }
                                  );
                                  const data = await res.json();
                                  if (data.success) {
                                    setVerificationStep("sent");
                                    toast.success("Verification code sent!");
                                  } else {
                                    toast.error(data.error || "Failed to send code");
                                  }
                                } catch {
                                  toast.error("Failed to send verification code");
                                } finally {
                                  setVerifying(false);
                                }
                              }}
                            >
                              {verifying ? "Sending..." : "Send Code"}
                            </Button>
                          </div>
                          {studentEmail && !studentEmail.trim().endsWith(".edu") && studentEmail.includes("@") && (
                            <p className="text-xs text-destructive">Only .edu email addresses qualify</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ==================== ACCOUNT TAB ==================== */}
              {activeTab === "account" && (
                <>
                  {/* Change password */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Change password</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-medium">New password</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <Button onClick={handleChangePassword} disabled={changingPw}>
                        {changingPw ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div className="rounded-xl border-2 border-red-200 p-8">
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Danger zone</h3>
                    <Button
                      variant="destructive"
                      onClick={async () => { await signOut(); navigate("/login"); }}
                    >
                      Log out
                    </Button>
                  </div>
                </>
              )}

              {/* ==================== AI RESOURCES TAB ==================== */}
              {activeTab === "resources" && (
                <>
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <div className="flex items-start gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">AI Resources & Integrations</h3>
                        <p className="text-sm text-muted-foreground">Connect your favorite tools to enhance your workflow</p>
                      </div>
                    </div>

                    {/* Category filters */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 flex-wrap">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors",
                            selectedCategory === cat
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Resource cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredResources.map((resource) => {
                        const Icon = resource.icon;
                        const faviconUrl = getFaviconUrl(resource.url);
                        const count = engagementCounts[resource.id] || { clicks: 0, signups: 0 };
                        return (
                          <div
                            key={resource.id}
                            className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              trackClick(resource);
                              window.open(resource.url, "_blank");
                            }}
                          >
                            <div className="flex items-start gap-4 mb-3">
                              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {faviconUrl ? (
                                  <img src={faviconUrl} alt={resource.name} className="w-full h-full object-cover" onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }} />
                                ) : Icon ? (
                                  <Icon className={cn("h-6 w-6", resource.iconColor || "text-primary")} />
                                ) : null}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-foreground">{resource.name}</h4>
                                <p className="text-xs text-muted-foreground">{resource.category}</p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {count.clicks} clicks&nbsp;&nbsp;{count.signups} signups
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ==================== ARCHIVED PROJECTS TAB ==================== */}
              {activeTab === "archived" && (
                <>
                  {/* Header */}
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <div className="flex items-start gap-4 mb-2">
                      <Archive size={28} className="text-muted-foreground mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">Archived Projects</h3>
                        <p className="text-sm text-muted-foreground">View and manage your archived projects. Restore them to continue working or permanently delete them.</p>
                      </div>
                    </div>
                  </div>

                  {/* Count card */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Archived Projects</p>
                        <p className="text-3xl font-bold text-foreground">{archivedProjects?.length || 0}</p>
                      </div>
                      <Archive size={32} className="text-muted-foreground/30" />
                    </div>
                  </div>

                  {/* Project list */}
                  {!archivedProjects || archivedProjects.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No archived projects yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {archivedProjects.map((project) => (
                        <div key={project.id} className="bg-card rounded-xl border border-border p-6 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Archive size={16} className="text-muted-foreground" />
                            <h4 className="font-semibold text-foreground">{project.name}</h4>
                          </div>
                          {project.goal && (
                            <p className="text-sm text-muted-foreground mb-1">{project.goal}</p>
                          )}
                          <p className="text-xs text-muted-foreground mb-4">
                            Archived on {new Date(project.updated_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <div className="flex gap-3 items-center">
                            <Button
                              onClick={() => handleRestoreProject(project.id)}
                              className="flex-1"
                              disabled={restoreProject.isPending}
                            >
                              <RotateCcw size={16} className="mr-2" />
                              Restore
                            </Button>
                            <Button
                              onClick={() => navigate(`/projects/${project.id}`)}
                              variant="outline"
                            >
                              View Details
                            </Button>
                            <button
                              onClick={() => handleDeleteArchivedProject(project.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              disabled={deleteArchivedProject.isPending}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Info box */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h4 className="font-semibold text-foreground mb-2">About Archived Projects</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Archived projects are stored safely and don't count toward your active project list</li>
                      <li>• You can restore an archived project at any time to continue working on it</li>
                      <li>• Permanently deleting an archived project cannot be undone</li>
                    </ul>
                  </div>
                </>
              )}

              {/* ==================== SUPPORT TAB ==================== */}
              {activeTab === "support" && (
                <>
                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <div className="flex items-start gap-4 mb-2">
                      <HeadphonesIcon size={28} className="text-muted-foreground mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">Support & Feedback</h3>
                        <p className="text-sm text-muted-foreground">We'd love to hear from you. Share your thoughts, report issues, or suggest features.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
                    <h4 className="text-lg font-semibold text-foreground mb-6">Send Feedback</h4>

                    {feedbackSent ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Star size={28} className="text-primary fill-primary" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground mb-1">Thank you!</h4>
                        <p className="text-sm text-muted-foreground mb-4">Your feedback has been submitted successfully.</p>
                        <Button variant="outline" onClick={() => { setFeedbackSent(false); setFeedbackMsg(""); setFeedbackRating(0); }}>Send More Feedback</Button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Star Rating */}
                        <div>
                          <Label className="text-sm font-medium text-foreground mb-2 block">How would you rate your experience? (optional)</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackRating(feedbackRating === star ? 0 : star)}
                                className="p-1 transition-transform hover:scale-110"
                              >
                                <Star
                                  size={28}
                                  className={cn(
                                    "transition-colors",
                                    star <= feedbackRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <Label htmlFor="feedback-email" className="text-sm font-medium text-foreground mb-1.5 block">Your Email</Label>
                          <Input
                            id="feedback-email"
                            type="email"
                            value={feedbackEmail}
                            onChange={(e) => setFeedbackEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="max-w-sm"
                          />
                        </div>

                        {/* Message */}
                        <div>
                          <Label htmlFor="feedback-msg" className="text-sm font-medium text-foreground mb-1.5 block">Your Feedback</Label>
                          <Textarea
                            id="feedback-msg"
                            value={feedbackMsg}
                            onChange={(e) => setFeedbackMsg(e.target.value)}
                            placeholder="Tell us what you think, report a bug, or suggest a feature..."
                            rows={5}
                            className="resize-none"
                          />
                        </div>

                        <Button
                          onClick={async () => {
                            if (!feedbackMsg.trim()) { toast.error("Please enter a feedback message"); return; }
                            if (!user) { toast.error("You must be logged in"); return; }
                            setSendingFeedback(true);
                            const { error } = await supabase.from("feedback" as any).insert({
                              user_id: user.id,
                              email: feedbackEmail.trim() || null,
                              message: feedbackMsg.trim(),
                              rating: feedbackRating || null,
                            });
                            setSendingFeedback(false);
                            if (error) { toast.error("Failed to send feedback"); console.error(error); }
                            else { setFeedbackSent(true); toast.success("Feedback sent! Thank you 💜"); }
                          }}
                          disabled={sendingFeedback || !feedbackMsg.trim()}
                          className="w-full sm:w-auto"
                        >
                          {sendingFeedback ? "Sending..." : "Send Feedback"}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
