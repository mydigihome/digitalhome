import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Sparkles, ExternalLink, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import AppShell from "@/components/AppShell";

const aiResources = [
  { id: 1, name: "Gamma", description: "Make a pitch deck/powerpoint in minutes", image: "🎨", category: "Presentations", url: "https://gamma.app", clicks: 0, signups: 0 },
  { id: 2, name: "ChatGPT", description: "AI assistant for writing, research, and brainstorming", image: "💬", category: "Assistant", url: "https://chat.openai.com", clicks: 0, signups: 0 },
  { id: 3, name: "Midjourney", description: "Create stunning AI-generated images and art", image: "🎭", category: "Image Generation", url: "https://midjourney.com", clicks: 0, signups: 0 },
  { id: 4, name: "Notion AI", description: "AI-powered workspace for notes and documentation", image: "📝", category: "Productivity", url: "https://notion.so", clicks: 0, signups: 0 },
  { id: 5, name: "Runway", description: "AI video generation and editing tools", image: "🎬", category: "Video", url: "https://runwayml.com", clicks: 0, signups: 0 },
  { id: 6, name: "Jasper", description: "AI copywriting and content creation assistant", image: "✍️", category: "Writing", url: "https://jasper.ai", clicks: 0, signups: 0 },
  { id: 7, name: "Beautiful.ai", description: "Design presentations with AI-powered templates", image: "🖼️", category: "Presentations", url: "https://beautiful.ai", clicks: 0, signups: 0 },
  { id: 8, name: "Descript", description: "Edit audio and video by editing text", image: "🎙️", category: "Audio/Video", url: "https://descript.com", clicks: 0, signups: 0 },
  { id: 9, name: "Copy.ai", description: "Generate marketing copy and content with AI", image: "📱", category: "Marketing", url: "https://copy.ai", clicks: 0, signups: 0 },
  { id: 10, name: "TLDL", description: "Summarize long videos and podcasts with AI", image: "📹", category: "Productivity", url: "https://tldl.ai", clicks: 0, signups: 0 },
  { id: 11, name: "NotebookLM", description: "Google's AI-powered research and note-taking assistant", image: "📓", category: "Productivity", url: "https://notebooklm.google.com", clicks: 0, signups: 0 },
  { id: 12, name: "Gamma AI", description: "AI-powered presentations, documents, and webpages", image: "⚡", category: "Presentations", url: "https://gamma.app", clicks: 0, signups: 0 },
  { id: 13, name: "Gamma Waves", description: "AI-generated ambient music for focus and productivity", image: "🎵", category: "Audio/Video", url: "https://www.gammawaves.io", clicks: 0, signups: 0 },
  { id: 14, name: "Apollo AI", description: "AI-powered sales intelligence and engagement platform", image: "🚀", category: "Marketing", url: "https://apollo.io", clicks: 0, signups: 0 },
  { id: 15, name: "Truffle Pig AI", description: "AI assistant for creative strategy and content ideas", image: "🐷", category: "Writing", url: "https://trufflepig.ai", clicks: 0, signups: 0 },
  { id: 16, name: "Resume Now", description: "Build professional resumes with AI assistance", image: "📄", category: "Career", url: "https://www.resume-now.com", clicks: 0, signups: 0 },
  { id: 17, name: "Enhance CV", description: "AI-powered CV optimization and enhancement tool", image: "✨", category: "Career", url: "https://enhancv.com", clicks: 0, signups: 0 },
  { id: 18, name: "Leonardo AI", description: "Create production-quality visual assets with AI", image: "🎨", category: "Image Generation", url: "https://leonardo.ai", clicks: 0, signups: 0 },
  { id: 19, name: "Visualize AI", description: "Turn data and ideas into stunning visual graphics", image: "📊", category: "Productivity", url: "https://visualize.ai", clicks: 0, signups: 0 },
  { id: 20, name: "Speechify", description: "Turn any text into natural-sounding audio with AI", image: "🔊", category: "Audio/Video", url: "https://speechify.com", clicks: 0, signups: 0 },
  { id: 21, name: "Zocks", description: "Financial advisors platform for smart wealth management", image: "💼", category: "Wealth", url: "https://zocks.com", clicks: 42, signups: 8 },
  { id: 22, name: "Monarch Money", description: "Complete wealth tracker for all your financial goals", image: "👑", category: "Wealth", url: "https://monarchmoney.com", clicks: 67, signups: 12 },
  { id: 23, name: "Luma", description: "Beautiful event planning and calendar management", image: "🌙", category: "Events", url: "https://lu.ma", clicks: 38, signups: 15 },
  { id: 24, name: "Posh VIP", description: "Premium event experiences and exclusive access", image: "✨", category: "Events", url: "https://poshvip.com", clicks: 29, signups: 6 },
  { id: 25, name: "Partiful", description: "Social event planning made simple and fun", image: "🎉", category: "Events", url: "https://partiful.com", clicks: 51, signups: 19 },
];

const categories = ["All", "Presentations", "Writing", "Image Generation", "Video", "Productivity", "Marketing", "Audio/Video", "Assistant", "Career", "Wealth", "Events"];

export default function SettingsPage() {
  const { user, profile, signOut, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "resources">("profile");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredResources = selectedCategory === "All"
    ? aiResources
    : aiResources.filter((r) => r.category === selectedCategory);

  const handleSaveName = async () => {
    if (!fullName.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    const { error } = await updateProfile({ full_name: fullName.trim() });
    setSaving(false);
    if (error) toast.error("Failed to update name");
    else toast.success("Name updated");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPw(true);
    const { error } = await updatePassword(newPassword);
    setChangingPw(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setNewPassword(""); }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = (profile?.full_name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h1 className="mb-1 text-4xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your profile and discover AI tools</p>
          </div>
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("profile")}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors",
                activeTab === "profile"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="h-4 w-4" /> Profile
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors",
                activeTab === "appearance"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Appearance
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors",
                activeTab === "resources"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="h-4 w-4" /> AI Resources
            </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="max-w-lg space-y-4">
            <Card className="rounded-2xl border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-primary-foreground">
                    {initials}
                  </div>
                  <Button variant="outline" size="sm">Change Photo</Button>
                </div>
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <div className="flex gap-2">
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    <Button onClick={handleSaveName} disabled={saving} size="sm">
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>New password</Label>
                  <div className="flex gap-2">
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                    <Button onClick={handleChangePassword} disabled={changingPw} size="sm">
                      {changingPw ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default view</Label>
                  <Select defaultValue="kanban">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kanban">Kanban</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:text-destructive">
              Log out
            </Button>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div className="max-w-lg space-y-4">
            <Card className="rounded-2xl border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-medium">Theme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Light Mode */}
                  <button
                    onClick={() => {
                      setDarkMode(false);
                      document.documentElement.classList.remove("dark");
                    }}
                    className={cn(
                      "rounded-xl border-2 p-6 text-left transition-colors",
                      !darkMode ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <Sun className="h-6 w-6 text-amber-500" />
                      <span className="font-semibold text-foreground">Light Mode</span>
                    </div>
                    <div className="rounded-lg bg-card p-4 shadow-sm border border-border">
                      <div className="mb-2 h-2 rounded bg-secondary" />
                      <div className="h-2 w-3/4 rounded bg-secondary" />
                    </div>
                  </button>

                  {/* Dark Mode */}
                  <button
                    onClick={() => {
                      setDarkMode(true);
                      document.documentElement.classList.add("dark");
                    }}
                    className={cn(
                      "rounded-xl border-2 p-6 text-left transition-colors",
                      darkMode ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <Moon className="h-6 w-6 text-primary" />
                      <span className="font-semibold text-foreground">Dark Mode</span>
                    </div>
                    <div className="rounded-lg bg-foreground/90 p-4 shadow-sm">
                      <div className="mb-2 h-2 rounded bg-foreground/70" />
                      <div className="h-2 w-3/4 rounded bg-foreground/70" />
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-none">
              <CardContent className="flex items-start gap-3 p-4">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="mb-1 font-medium text-foreground">Tip</p>
                  <p className="text-sm text-muted-foreground">
                    Dark mode reduces eye strain in low-light environments and can help save battery on OLED screens.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Resources Tab */}
        {activeTab === "resources" && (
          <div>
            {/* Category Filter */}
            <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources Grid */}
            {filteredResources.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
                <Sparkles className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">No resources found in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-3xl">
                        {resource.image}
                      </div>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                        {resource.category}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-foreground">{resource.name}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">{resource.description}</p>
                    <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="rounded-md bg-secondary px-2 py-1 font-medium"># clicks: {resource.clicks}</span>
                      <span className="rounded-md bg-secondary px-2 py-1 font-medium"># signups: {resource.signups}</span>
                    </div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-medium text-primary transition-all group-hover:gap-3"
                    >
                      Visit Platform
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
