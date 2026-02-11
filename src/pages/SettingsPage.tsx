import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Moon, Sun, Sparkles, ExternalLink, Palette, Shield, Camera, Brain, FileText, Calendar, MessageSquare, Zap, Workflow, Layers, Github, TrendingUp, CheckCircle, Columns, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";


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

const fontOptions = [
  { label: "Inter", value: "Inter" },
  { label: "Georgia", value: "Georgia" },
  { label: "Mono", value: "ui-monospace, monospace" },
  { label: "System", value: "system-ui, sans-serif" },
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
  customImage?: string;
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
] as const;

type SettingsTab = typeof settingsTabs[number]["id"];

export default function SettingsPage() {
  const { user, profile, signOut, updateProfile, updatePassword } = useAuth();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(prefs?.bio || "");
  const [location, setLocation] = useState(prefs?.location || "");
  const [website, setWebsite] = useState(prefs?.website || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [engagementCounts, setEngagementCounts] = useState<Record<number, { clicks: number; signups: number }>>({});

  // Fetch engagement counts from database
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

  const filteredResources = selectedCategory === "All"
    ? aiResources : aiResources.filter((r) => r.category === selectedCategory);

  const themeColor = prefs?.theme_color || "#8B5CF6";
  const fontSize = prefs?.font_size || "medium";
  const density = prefs?.density || "comfortable";
  const accentData = prefs?.accent_colors as Record<string, string> | null;
  const selectedFont = accentData?.font_family || "Inter";

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

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = (profile?.full_name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Settings"
          icon="⚙️"
          editable={false}
          subtitle="Manage your profile, appearance, and account"
        />

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden md:block w-[200px] shrink-0">
            <nav className="space-y-1 sticky top-24">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile tabs */}
          <div className="flex md:hidden mb-4 gap-1 overflow-x-auto -mx-4 px-4 w-[calc(100%+2rem)]">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
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
                {/* Theme */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Theme</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => { setDarkMode(false); document.documentElement.classList.remove("dark"); upsertPrefs.mutate({ sidebar_theme: "light" }); }}
                        className={cn("rounded-xl border-2 p-5 text-left transition-colors", !darkMode ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30")}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <Sun className="h-5 w-5 text-warning" />
                          <span className="font-medium text-foreground">Light</span>
                        </div>
                        <div className="rounded-lg bg-card p-3 shadow-sm border border-border">
                          <div className="mb-1.5 h-2 rounded bg-secondary" />
                          <div className="h-2 w-3/4 rounded bg-secondary" />
                        </div>
                      </button>
                      <button
                        onClick={() => { setDarkMode(true); document.documentElement.classList.add("dark"); upsertPrefs.mutate({ sidebar_theme: "dark" }); }}
                        className={cn("rounded-xl border-2 p-5 text-left transition-colors", darkMode ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30")}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <Moon className="h-5 w-5 text-primary" />
                          <span className="font-medium text-foreground">Dark</span>
                        </div>
                        <div className="rounded-lg bg-foreground/90 p-3">
                          <div className="mb-1.5 h-2 rounded bg-foreground/70" />
                          <div className="h-2 w-3/4 rounded bg-foreground/70" />
                        </div>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Accent Color */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Accent color</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {accentColors.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => upsertPrefs.mutate({ theme_color: c.value })}
                          className={cn(
                            "h-10 w-10 rounded-full transition-all hover:scale-110",
                            themeColor === c.value && "ring-2 ring-offset-2 ring-foreground/30"
                          )}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Font Family */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Font</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {fontOptions.map((f) => (
                        <button
                          key={f.label}
                          onClick={() => upsertPrefs.mutate({ accent_colors: { ...accentData, font_family: f.value } })}
                          className={cn(
                            "rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                            selectedFont === f.value ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground/30"
                          )}
                          style={{ fontFamily: f.value }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Size</p>
                    <div className="flex gap-2">
                      {["small", "medium", "large"].map((size) => (
                        <button
                          key={size}
                          onClick={() => upsertPrefs.mutate({ font_size: size })}
                          className={cn(
                            "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium capitalize transition-colors",
                            fontSize === size ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground/30"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Density */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Spacing</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {["compact", "comfortable", "spacious"].map((d) => (
                        <button
                          key={d}
                          onClick={() => upsertPrefs.mutate({ density: d })}
                          className={cn(
                            "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium capitalize transition-colors",
                            density === d ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground/30"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Change password</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>New password</Label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                    </div>
                    <Button onClick={handleChangePassword} disabled={changingPw}>
                      {changingPw ? "Updating..." : "Update Password"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive/30">
                  <CardHeader><CardTitle className="text-base text-destructive">Danger zone</CardTitle></CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleLogout}>Log out</Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Resources Tab */}
            {activeTab === "resources" && (
              <div>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground">AI Resources & Integrations</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Connect your favorite tools to enhance your workflow</p>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {filteredResources.map((resource) => {
                    const IconComp = resource.icon;
                    const counts = engagementCounts[resource.id] || { clicks: 0, signups: 0 };
                    return (
                      <div
                        key={resource.id}
                        onClick={() => {
                          trackClick(resource);
                          if (!resource.isIntegration) window.open(resource.url, "_blank");
                        }}
                        className="group cursor-pointer rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {(() => {
                            const faviconUrl = getFaviconUrl(resource.url);
                            const imgSrc = resource.customImage || faviconUrl;
                            
                            if (resource.icon) {
                              // For integrations with custom icons
                              const IconComp = resource.icon;
                              return (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                                  <IconComp className={cn("h-5 w-5", resource.iconColor)} />
                                </div>
                              );
                            } else if (imgSrc) {
                              // For resources with favicon
                              return (
                                <div className="relative h-10 w-10 flex-shrink-0 rounded-lg bg-secondary overflow-hidden flex items-center justify-center">
                                  <img
                                    src={imgSrc}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                  {!imgSrc && <AlertCircle className="h-5 w-5 text-muted-foreground" />}
                                </div>
                              );
                            } else {
                              // Fallback emoji
                              return <span className="text-2xl">{resource.image}</span>;
                            }
                          })()}
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-foreground">{resource.name}</h3>
                            <span className="text-xs text-muted-foreground">{resource.category}</span>
                          </div>
                          {resource.isIntegration ? (
                            <Button variant="outline" size="sm" className="text-xs h-8" onClick={(e) => {
                              e.stopPropagation();
                              trackSignup(resource);
                            }}>
                              Connect
                            </Button>
                          ) : (
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{resource.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                          <span>{counts.clicks.toLocaleString()} clicks</span>
                          <span>{counts.signups.toLocaleString()} signups</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
