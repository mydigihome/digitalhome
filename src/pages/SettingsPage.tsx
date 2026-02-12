import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useArchivedProjects, useRestoreProject, useDeleteArchivedProject } from "@/hooks/useArchivedProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Moon, Sun, Sparkles, ExternalLink, Palette, Shield, Camera, Brain, FileText, Calendar, MessageSquare, Zap, Workflow, Layers, Github, TrendingUp, CheckCircle, Columns, AlertCircle, Archive, RotateCcw, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";

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
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return null;
  }
};

const aiResources: ResourceItem[] = [
  { id: 1, name: "Gamma", description: "Make a pitch deck/powerpoint in minutes", image: "🎨", category: "Presentations", url: "https://gamma.app" },
  { id: 2, name: "Midjourney", description: "Create stunning AI-generated images and art", image: "🎭", category: "Image Generation", url: "https://midjourney.com" },
  { id: 3, name: "Runway", description: "AI video generation and editing tools", image: "🎬", category: "Video", url: "https://runwayml.com" },
  { id: 4, name: "Zocks", description: "AI-powered meeting notes and action items", image: "🎙️", category: "Finance", url: "https://zocks.ai" },
  { id: 5, name: "Monarch Money", description: "Smart financial tracking and budgeting with AI insights", image: "💰", category: "Finance", url: "https://monarchmoney.com" },
  { id: 6, name: "Luma", description: "Beautiful event pages and calendar management", image: "✨", category: "Events", url: "https://lu.ma" },
  { id: 7, name: "Posh VIP", description: "Premium event hosting and ticketing platform", image: "🎫", category: "Events", url: "https://posh.vip" },
  { id: 8, name: "Partiful", description: "Fun and easy party planning and invitations", image: "🎉", category: "Events", url: "https://partiful.com" },
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

const categories = ["All", "AI", "Productivity", "Automation", "Development", "Design", "Communication", "Presentations", "Image Generation", "Video", "Finance", "Events"];

const settingsTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "account", label: "Account", icon: Shield },
  { id: "resources", label: "AI Resources", icon: Sparkles },
  { id: "archived", label: "Archived Projects", icon: Archive },
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

  const initials = (profile?.full_name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <AppShell>
      <div className="w-full min-h-screen bg-background">
        {/* SLIM GRADIENT BANNER */}
        <div className="w-full h-[100px] relative" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        </div>

        {/* MAIN CONTENT */}
        <div className="max-w-[1200px] mx-auto -mt-10 px-6 md:px-10 pb-20 relative">
          {/* PAGE HEADER */}
          <div className="bg-card rounded-2xl p-8 mb-8 shadow-sm border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <Settings size={24} className="text-muted-foreground" />
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
            <div className="bg-card rounded-xl border border-border p-8">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-card shadow-md overflow-hidden bg-gradient-primary">
                        {prefs?.profile_photo ? (
                          <img src={prefs.profile_photo} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-4xl font-bold text-primary-foreground">{initials}</span>
                        )}
                      </div>
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Camera className="h-6 w-6 text-primary-foreground" />
                      </button>
                      <input ref={photoInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoUpload} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {uploadingPhoto ? "Uploading..." : "Click to change photo"}
                    </p>
                  </div>

                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label>Full name</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user?.email || ""} disabled className="bg-muted" />
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
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Theme</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Accent Color</Label>
                        <div className="grid grid-cols-4 gap-3">
                          {accentColors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => upsertPrefs.mutate({ theme_color: color.value } as any)}
                              className={cn(
                                "w-12 h-12 rounded-lg border-2 transition-all",
                                themeColor === color.value ? "border-foreground" : "border-transparent"
                              )}
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dark Mode</Label>
                        <button
                          onClick={() => {
                            document.documentElement.classList.toggle("dark");
                            setDarkMode(!darkMode);
                          }}
                          className="flex items-center gap-3"
                        >
                          {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                          <span>{darkMode ? "Dark" : "Light"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                        />
                      </div>
                      <Button onClick={handleChangePassword} disabled={changingPw} className="w-full">
                        {changingPw ? "Updating..." : "Update Password"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI Resources Tab */}
              {activeTab === "resources" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors",
                            selectedCategory === cat
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredResources.map((resource) => {
                        const Icon = resource.icon;
                        const faviconUrl = getFaviconUrl(resource.url);
                        const count = engagementCounts[resource.id] || { clicks: 0, signups: 0 };
                        return (
                          <Card key={resource.id} className="flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={() => trackClick(resource)}>
                            <CardContent className="p-4 flex-1">
                              <div className="flex items-start gap-3 mb-3">
                                {resource.image ? (
                                  <span className="text-2xl">{resource.image}</span>
                                ) : Icon ? (
                                  <Icon className={cn("h-6 w-6", resource.iconColor || "text-primary")} />
                                ) : faviconUrl ? (
                                  <img src={faviconUrl} alt={resource.name} className="h-6 w-6 rounded" />
                                ) : null}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm">{resource.name}</h4>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
                                </div>
                              </div>
                              {(count.clicks > 0 || count.signups > 0) && (
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {count.clicks > 0 && <p>Clicks: {count.clicks}</p>}
                                  {count.signups > 0 && <p>Signups: {count.signups}</p>}
                                </div>
                              )}
                            </CardContent>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(resource.url, "_blank");
                                if (resource.isIntegration) trackSignup(resource);
                              }}
                              variant="outline"
                              className="w-full"
                              size="sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              {resource.isIntegration ? "Integrate" : "Explore"}
                            </Button>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Archived Projects Tab */}
              {activeTab === "archived" && (
                <div className="space-y-6">
                  {!archivedProjects || archivedProjects.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No archived projects yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {archivedProjects.map((project) => (
                        <Card key={project.id} className="overflow-hidden">
                          <div className="p-4 space-y-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{project.name}</h3>
                            </div>
                            {project.goal && (
                              <p className="text-sm text-muted-foreground mb-2">{project.goal}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Archived on {new Date(project.updated_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-border">
                              <Button
                                onClick={() => handleRestoreProject(project.id)}
                                className="flex-1"
                                disabled={restoreProject.isPending}
                              >
                                <RotateCcw size={16} className="mr-2" />
                                {restoreProject.isPending ? "Restoring..." : "Restore"}
                              </Button>
                              <Button
                                onClick={() => handleDeleteArchivedProject(project.id)}
                                variant="destructive"
                                className="flex-1"
                                disabled={deleteArchivedProject.isPending}
                              >
                                <Trash2 size={16} className="mr-2" />
                                {deleteArchivedProject.isPending ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Info Box */}
                  {archivedProjects && archivedProjects.length > 0 && (
                    <div className="mt-8 bg-secondary rounded-lg border border-border p-4">
                      <h4 className="font-semibold text-foreground mb-2">About Archived Projects</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Archived projects are stored safely and don't count toward your active project list</li>
                        <li>• You can restore an archived project at any time to continue working on it</li>
                        <li>• Permanently deleting an archived project cannot be undone</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}