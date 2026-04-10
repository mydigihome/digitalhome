import { useState, useEffect, useRef } from "react";
import { ExternalLink, Search, Sparkles, Plus, X, Pencil, Trash2, Upload, Link, Video, FileText, Eye, Download, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SINGLE_STRIPE_URL = "https://buy.stripe.com/6oUfZhdWa88m71a1Tsak005";
const BUNDLE_STRIPE_URL = "https://buy.stripe.com/cNiaEXcS6dsG5X6bu2ak006";
const STATIC_CATEGORIES = [
  "All", "Finance", "Events", "College", "AI", "Productivity",
  "Automation", "Development", "Design", "Communication",
  "Presentations", "Image Generation", "Video",
];

const DYNAMIC_CATEGORIES = ["All", "Career", "Finance", "Wellness", "Productivity", "Creativity", "Legal", "Other"];

const STATIC_RESOURCES = [
  { name: "Robinhood", url: "https://robinhood.com", category: "Finance", desc: "Commission-free stock trading" },
  { name: "Fidelity", url: "https://fidelity.com", category: "Finance", desc: "Investment management & retirement" },
  { name: "Webull", url: "https://webull.com", category: "Finance", desc: "Advanced trading platform" },
  { name: "Schwab", url: "https://schwab.com", category: "Finance", desc: "Full-service brokerage" },
  { name: "Vanguard", url: "https://vanguard.com", category: "Finance", desc: "Index funds & ETFs" },
  { name: "Mint", url: "https://mint.intuit.com", category: "Finance", desc: "Budgeting & expense tracking" },
  { name: "YNAB", url: "https://ynab.com", category: "Finance", desc: "You Need A Budget" },
  { name: "Plaid", url: "https://plaid.com", category: "Finance", desc: "Bank account connectivity" },
  { name: "Eventbrite", url: "https://eventbrite.com", category: "Events", desc: "Event discovery & ticketing" },
  { name: "Luma", url: "https://lu.ma", category: "Events", desc: "Beautiful event pages" },
  { name: "Partiful", url: "https://partiful.com", category: "Events", desc: "Social event invitations" },
  { name: "Common App", url: "https://commonapp.org", category: "College", desc: "College application portal" },
  { name: "Khan Academy", url: "https://khanacademy.org", category: "College", desc: "Free courses & SAT prep" },
  { name: "College Board", url: "https://collegeboard.org", category: "College", desc: "SAT, AP & college planning" },
  { name: "ChatGPT", url: "https://chat.openai.com", category: "AI", desc: "AI assistant by OpenAI" },
  { name: "Claude", url: "https://claude.ai", category: "AI", desc: "AI assistant by Anthropic" },
  { name: "Gemini", url: "https://gemini.google.com", category: "AI", desc: "Google's AI model" },
  { name: "Perplexity", url: "https://perplexity.ai", category: "AI", desc: "AI-powered research" },
  { name: "Notion", url: "https://notion.so", category: "Productivity", desc: "All-in-one workspace" },
  { name: "Todoist", url: "https://todoist.com", category: "Productivity", desc: "Task management" },
  { name: "Linear", url: "https://linear.app", category: "Productivity", desc: "Project management for teams" },
  { name: "Cron", url: "https://cron.com", category: "Productivity", desc: "Next-gen calendar" },
  { name: "Zapier", url: "https://zapier.com", category: "Automation", desc: "Connect apps & automate workflows" },
  { name: "Make", url: "https://make.com", category: "Automation", desc: "Visual automation platform" },
  { name: "n8n", url: "https://n8n.io", category: "Automation", desc: "Open-source workflow automation" },
  { name: "GitHub", url: "https://github.com", category: "Development", desc: "Code hosting & collaboration" },
  { name: "Vercel", url: "https://vercel.com", category: "Development", desc: "Frontend deployment platform" },
  { name: "Supabase", url: "https://supabase.com", category: "Development", desc: "Open-source Firebase alternative" },
  { name: "Figma", url: "https://figma.com", category: "Design", desc: "Collaborative design tool" },
  { name: "Canva", url: "https://canva.com", category: "Design", desc: "Easy graphic design" },
  { name: "Dribbble", url: "https://dribbble.com", category: "Design", desc: "Design inspiration & portfolio" },
  { name: "Slack", url: "https://slack.com", category: "Communication", desc: "Team messaging" },
  { name: "Discord", url: "https://discord.com", category: "Communication", desc: "Community communication" },
  { name: "Loom", url: "https://loom.com", category: "Communication", desc: "Async video messaging" },
  { name: "Pitch", url: "https://pitch.com", category: "Presentations", desc: "Collaborative presentations" },
  { name: "Beautiful.ai", url: "https://beautiful.ai", category: "Presentations", desc: "AI-powered slide design" },
  { name: "Gamma", url: "https://gamma.app", category: "Presentations", desc: "AI presentations & docs" },
  { name: "Midjourney", url: "https://midjourney.com", category: "Image Generation", desc: "AI image generation" },
  { name: "DALL-E", url: "https://openai.com/dall-e-3", category: "Image Generation", desc: "OpenAI image generation" },
  { name: "Leonardo.ai", url: "https://leonardo.ai", category: "Image Generation", desc: "AI creative suite" },
  { name: "CapCut", url: "https://capcut.com", category: "Video", desc: "Free video editing" },
  { name: "Descript", url: "https://descript.com", category: "Video", desc: "AI-powered video editing" },
  { name: "Runway", url: "https://runwayml.com", category: "Video", desc: "AI video generation" },
];

function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  Career: "#7B5EA7", Finance: "#10B981", Wellness: "#F59E0B",
  Productivity: "#3B82F6", Creativity: "#EC4899", Legal: "#6B7280", Other: "#8B5CF6",
};

interface DynamicResource {
  id: string;
  title: string;
  description: string;
  category: string;
  resource_type: string;
  url: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  published: boolean;
  user_id: string;
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "myslimher@gmail.com";

  const [view, setView] = useState<"tools" | "resources">("tools");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const isDark = document.documentElement.classList.contains("dark");
  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.5)" : "#6B7280";
  const cardBg = isDark ? "#1C1C1E" : "white";
  const border = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6";
  const inputBg = isDark ? "#252528" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  // Dynamic resources state
  const [dynamicResources, setDynamicResources] = useState<DynamicResource[]>([]);
  const [resourceCategory, setResourceCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState<DynamicResource | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DynamicResource | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", category: "Career",
    resource_type: "link", url: "", published: true,
    thumbnail_url: "" as string,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [autoLogoUrl, setAutoLogoUrl] = useState<string | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [previewResource, setPreviewResource] = useState<DynamicResource | null>(null);

  useEffect(() => {
    fetchResources();
  }, [user]);

  const fetchResources = async () => {
    const { data } = await (supabase as any).from("resources").select("*").order("created_at", { ascending: false });
    if (data) setDynamicResources(data);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", category: "Career", resource_type: "link", url: "", published: true });
    setThumbnailFile(null);
    setResourceFile(null);
    setEditingResource(null);
  };

  const handleSaveResource = async () => {
    if (!form.title || !form.description) { toast.error("Title and description required"); return; }
    if (!user) return;
    setUploading(true);

    let file_url = editingResource?.file_url || null;
    let thumbnail_url = editingResource?.thumbnail_url || null;

    // Upload file if provided
    if (resourceFile) {
      const path = `${user.id}/resources/${Date.now()}-${resourceFile.name}`;
      const { error } = await supabase.storage.from("user-assets").upload(path, resourceFile, { upsert: true });
      if (error) {
        console.error("Storage upload failed:", error);
        toast.error("File upload failed: " + error.message);
        setUploading(false);
        return;
      }
      const { data: pubData } = supabase.storage.from("user-assets").getPublicUrl(path);
      file_url = pubData.publicUrl;
      console.log("publicUrl obtained:", file_url);
    }

    // Upload thumbnail if provided
    if (thumbnailFile) {
      const path = `${user.id}/thumbnails/${Date.now()}-${thumbnailFile.name}`;
      const { error } = await supabase.storage.from("user-assets").upload(path, thumbnailFile, { upsert: true });
      if (error) {
        console.error("Thumbnail upload failed:", error);
        toast.error("Thumbnail upload failed: " + error.message);
        setUploading(false);
        return;
      }
      const { data: pubData } = supabase.storage.from("user-assets").getPublicUrl(path);
      thumbnail_url = pubData.publicUrl;
      console.log("thumbnail publicUrl obtained:", thumbnail_url);
    }

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      resource_type: form.resource_type,
      url: form.url || null,
      file_url,
      thumbnail_url,
      published: form.published,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    console.log("Saving resource payload:", JSON.stringify(payload));

    if (editingResource) {
      const { data: updateData, error: updateError } = await (supabase as any)
        .from("resources")
        .update(payload)
        .eq("id", editingResource.id)
        .select();

      console.log("DB update result:", updateData, updateError);

      if (updateError) {
        console.error("CRITICAL: DB update failed:", updateError);
        toast.error("Update failed: " + updateError.message);
        setUploading(false);
        return;
      }

      if (!updateData || updateData.length === 0) {
        console.error("CRITICAL: No rows updated. Check RLS policy.");
        toast.error("File uploaded but not saved. Contact support.");
        setUploading(false);
        return;
      }

      setDynamicResources(prev => prev.map(r =>
        r.id === editingResource.id
          ? { ...r, ...updateData[0] }
          : r
      ));
      toast.success("Resource updated successfully");
    } else {
      console.log("INSERT PAYLOAD:", JSON.stringify(payload));
      console.log("CURRENT USER:", user?.id, user?.email);

      const { data: insertData, error: insertError } = await (supabase as any)
        .from("resources")
        .insert({
          ...payload,
          user_id: user.id,
        })
        .select();

      console.log("INSERT RESULT:", insertData, insertError);

      if (insertError) {
        console.error("INSERT ERROR DETAILS:", JSON.stringify(insertError));
        toast.error("Failed: " + insertError.message);
        setUploading(false);
        return;
      }

      if (!insertData || insertData.length === 0) {
        console.error("CRITICAL: No rows inserted. Check RLS policy.");
        toast.error("Resource not saved. Contact support.");
        setUploading(false);
        return;
      }

      setDynamicResources(prev => [insertData[0], ...prev]);
      toast.success("Resource added successfully");
    }

    setUploading(false);
    setShowAddForm(false);
    resetForm();
  };

  const handleDeleteResource = async () => {
    if (!deleteConfirm) return;
    const deleteId = deleteConfirm.id;
    // Optimistic removal
    setDynamicResources(prev => prev.filter(r => r.id !== deleteId));
    setDeleteConfirm(null);
    const { error } = await (supabase as any).from("resources").delete().eq("id", deleteId);
    if (error) {
      toast.error("Delete failed: " + error.message);
      fetchResources(); // Refetch on error
      return;
    }
    toast.success("Resource deleted");
  };

  const handleEditResource = (r: DynamicResource) => {
    setForm({
      title: r.title, description: r.description, category: r.category,
      resource_type: r.resource_type, url: r.url || "", published: r.published,
    });
    setEditingResource(r);
    setShowAddForm(true);
  };

  // Filter static tools
  const filteredTools = STATIC_RESOURCES.filter(r => {
    const matchesCategory = activeCategory === "All" || r.category === activeCategory;
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter dynamic resources
  const visibleResources = dynamicResources.filter(r => {
    if (!isAdmin && !r.published) return false;
    const matchesCat = resourceCategory === "All" || r.category === resourceCategory;
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getActionLabel = (type: string) => {
    if (type === "link") return "Visit Link";
    if (type === "video") return "Watch";
    return "Download";
  };

  const getActionIcon = (type: string) => {
    if (type === "link") return <ExternalLink size={14} />;
    if (type === "video") return <Video size={14} />;
    return <Download size={14} />;
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 80px" }}>
      <div style={{ padding: "28px 0 24px", borderBottom: `1px solid ${border}`, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif", letterSpacing: "-0.3px", margin: 0, marginBottom: 4 }}>
            Resource Center
          </h1>
          <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>
            Tools and resources to level up your workflow
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", background: "#10B981", color: "white",
              border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: "pointer", minHeight: 44,
            }}
          >
            <Plus size={15} /> Add Resource
          </button>
        )}
      </div>

      {/* Sub-tabs: Tools Directory | Custom Resources */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${border}`, marginBottom: 20 }}>
        {[
          { id: "tools" as const, label: "Tools Directory" },
          { id: "resources" as const, label: "Custom Resources" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setView(tab.id); setSearch(""); }}
            style={{
              padding: "8px 16px", border: "none",
              borderBottom: `2px solid ${view === tab.id ? "#10B981" : "transparent"}`,
              background: "transparent", fontSize: 13,
              fontWeight: view === tab.id ? 600 : 400,
              color: view === tab.id ? text1 : text2,
              cursor: "pointer", fontFamily: "Inter, sans-serif",
              marginBottom: -1, transition: "all 150ms",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} color={text2} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={view === "tools" ? "Search tools..." : "Search resources..."}
          style={{
            width: "100%", padding: "10px 14px 10px 40px", border: `1.5px solid ${inputBorder}`,
            borderRadius: 10, fontSize: 14, color: text1, fontFamily: "Inter, sans-serif",
            outline: "none", background: inputBg, boxSizing: "border-box" as const,
          }}
        />
      </div>

      {view === "tools" ? (
        <>
          {/* Category pills for static tools */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
            {STATIC_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "6px 14px", borderRadius: 999, border: "1.5px solid",
                  borderColor: activeCategory === cat ? "#10B981" : inputBorder,
                  background: activeCategory === cat ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : inputBg,
                  color: activeCategory === cat ? (isDark ? "#10B981" : "#065F46") : text2,
                  fontSize: 12, fontWeight: activeCategory === cat ? 600 : 400,
                  cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 150ms",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tools grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {filteredTools.map(tool => (
              <button
                key={tool.name}
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = tool.url; link.target = "_blank"; link.rel = "noopener noreferrer";
                  document.body.appendChild(link); link.click(); document.body.removeChild(link);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: 16,
                  background: cardBg, border: `1px solid ${border}`, borderRadius: 14,
                  cursor: "pointer", textAlign: "left", transition: "all 150ms", width: "100%",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#10B981"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: isDark ? "#252528" : "#F9FAFB",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden",
                }}>
                  {getFaviconUrl(tool.url) ? (
                    <img src={getFaviconUrl(tool.url)!} alt={tool.name} style={{ width: 24, height: 24, borderRadius: 4 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <Sparkles size={18} color={text2} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 2 }}>{tool.name}</p>
                  <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tool.desc}</p>
                </div>
                <ExternalLink size={14} color={text2} style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
          {filteredTools.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif" }}>No tools found matching your search.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Category pills for dynamic resources */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
            {DYNAMIC_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setResourceCategory(cat)}
                style={{
                  padding: "6px 14px", borderRadius: 999, border: "1.5px solid",
                  borderColor: resourceCategory === cat ? "#10B981" : inputBorder,
                  background: resourceCategory === cat ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : inputBg,
                  color: resourceCategory === cat ? (isDark ? "#10B981" : "#065F46") : text2,
                  fontSize: 12, fontWeight: resourceCategory === cat ? 600 : 400,
                  cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 150ms",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dynamic resources grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {visibleResources.map(r => {
              const catColor = CATEGORY_COLORS[r.category] || "#6B7280";
              return (
                <div
                  key={r.id}
                  style={{
                    background: cardBg, border: `1px solid ${border}`, borderRadius: 14,
                    overflow: "hidden", display: "flex", flexDirection: "column",
                    transition: "border-color 150ms",
                    position: "relative",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#10B981"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; }}
                >
                  {isAdmin && r.file_url && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Remove preview file from this resource?")) {
                          (supabase as any)
                            .from("resources")
                            .update({
                              file_url: null,
                              thumbnail_url: null,
                              updated_at: new Date().toISOString()
                            })
                            .eq("id", r.id)
                            .then(({ error }: { error: any }) => {
                              if (error) {
                                toast.error("Failed to remove: " + error.message);
                                return;
                              }
                              setDynamicResources(prev =>
                                prev.map(res => res.id === r.id
                                  ? { ...res, file_url: null, thumbnail_url: null }
                                  : res
                                )
                              );
                              toast.success("Preview removed");
                            });
                        }
                      }}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 24,
                        height: 24,
                        background: "rgba(0,0,0,0.55)",
                        border: "none",
                        borderRadius: "50%",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        zIndex: 10,
                        lineHeight: 1,
                      }}
                      title="Remove preview file"
                    >×</button>
                  )}
                  {/* Thumbnail or category icon */}
                  {r.thumbnail_url ? (
                    <img src={r.thumbnail_url} alt={r.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      height: 80, display: "flex", alignItems: "center", justifyContent: "center",
                      background: isDark ? "#252528" : "#F9FAFB",
                    }}>
                      {r.resource_type === "video" ? <Video size={28} color={catColor} /> :
                       r.resource_type === "file" || r.resource_type === "template" ? <FileText size={28} color={catColor} /> :
                       <Globe size={28} color={catColor} />}
                    </div>
                  )}

                  <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                        background: catColor + "15", color: catColor,
                      }}>
                        {r.category}
                      </span>
                      {!r.published && isAdmin && (
                        <span style={{
                          padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600,
                          background: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6", color: text2,
                        }}>
                          Draft
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 4 }}>{r.title}</p>
                    <p style={{
                      fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 12,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden",
                    }}>{r.description}</p>

                    <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                      {(r.resource_type === "file" || r.resource_type === "template") && r.file_url ? (
                        <>
                          <button
                            onClick={() => setPreviewResource(r)}
                            style={{
                              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                              padding: "8px 14px", background: isDark ? "#252528" : "#F3F4F6",
                              color: text1, border: `1px solid ${inputBorder}`, borderRadius: 8,
                              fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: 44,
                            }}
                          >
                            <Eye size={14} /> Preview
                          </button>
                          <button
                            onClick={() => {
                              if (isAdmin) {
                                window.open(r.file_url!, "_blank");
                              } else {
                                window.location.href = SINGLE_STRIPE_URL;
                              }
                            }}
                            style={{
                              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                              padding: "8px 14px", background: "#10B981", color: "white",
                              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                              cursor: "pointer", minHeight: 44,
                            }}
                          >
                            <Download size={14} /> Download
                          </button>
                        </>
                      ) : !r.file_url && (r.resource_type === "file" || r.resource_type === "template") ? (
                        <span style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                          padding: "8px 14px", background: isDark ? "#252528" : "#F9FAFB",
                          color: text2, border: `1px solid ${inputBorder}`, borderRadius: 8,
                          fontSize: 12, fontWeight: 500, minHeight: 44,
                        }}>
                          Coming soon
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (r.resource_type === "link" || r.resource_type === "video") {
                              if (r.url) window.open(r.url, "_blank");
                            } else if (r.file_url) {
                              window.open(r.file_url, "_blank");
                            }
                          }}
                          style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            padding: "8px 14px", background: "#10B981", color: "white",
                            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            cursor: "pointer", minHeight: 44,
                          }}
                        >
                          {getActionIcon(r.resource_type)} {getActionLabel(r.resource_type)}
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button onClick={() => handleEditResource(r)} style={{
                            padding: "8px 10px", border: `1px solid ${inputBorder}`, background: "transparent",
                            borderRadius: 8, cursor: "pointer", minHeight: 44,
                          }}>
                            <Pencil size={14} color={text2} />
                          </button>
                          <button onClick={() => setDeleteConfirm(r)} style={{
                            padding: "8px 10px", border: `1px solid ${inputBorder}`, background: "transparent",
                            borderRadius: 8, cursor: "pointer", minHeight: 44,
                          }}>
                            <Trash2 size={14} color="#DC2626" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleResources.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif" }}>
                {isAdmin ? "No resources yet. Click 'Add Resource' to create one." : "No resources available yet."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Resource Modal (Admin Only) */}
      {showAddForm && isAdmin && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => { setShowAddForm(false); resetForm(); }}>
          <div style={{
            width: "100%", maxWidth: 520, background: isDark ? "#1C1C1E" : "white",
            borderRadius: 16, padding: 28, maxHeight: "90vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>
                {editingResource ? "Edit Resource" : "Add Resource"}
              </h3>
              <button onClick={() => { setShowAddForm(false); resetForm(); }} style={{ padding: 6, border: "none", background: "transparent", cursor: "pointer" }}>
                <X size={18} color={text2} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Resource name" style={{
                    width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                    borderRadius: 10, fontSize: 14, color: text1, background: inputBg,
                    outline: "none", boxSizing: "border-box" as const,
                  }} />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>Description *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Short description" rows={3} style={{
                    width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                    borderRadius: 10, fontSize: 14, color: text1, background: inputBg,
                    outline: "none", resize: "vertical", boxSizing: "border-box" as const,
                    fontFamily: "Inter, sans-serif",
                  }} />
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                    borderRadius: 10, fontSize: 14, color: text1, background: inputBg, cursor: "pointer",
                  }}>
                  {DYNAMIC_CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Resource Type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { id: "link", label: "Link", icon: <Link size={14} /> },
                    { id: "file", label: "File", icon: <FileText size={14} /> },
                    { id: "video", label: "Video", icon: <Video size={14} /> },
                    { id: "template", label: "Template", icon: <FileText size={14} /> },
                  ].map(t => (
                    <button key={t.id} onClick={() => setForm(p => ({ ...p, resource_type: t.id }))}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                        padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: `1.5px solid ${form.resource_type === t.id ? "#10B981" : inputBorder}`,
                        background: form.resource_type === t.id ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : "transparent",
                        color: form.resource_type === t.id ? "#10B981" : text2, cursor: "pointer",
                      }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL field (for Link and Video) */}
              {(form.resource_type === "link" || form.resource_type === "video") && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>URL</label>
                  <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                    placeholder="https://..." style={{
                      width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                      borderRadius: 10, fontSize: 14, color: text1, background: inputBg,
                      outline: "none", boxSizing: "border-box" as const,
                    }} />
                </div>
              )}

              {/* File upload (for File and Template) */}
              {(form.resource_type === "file" || form.resource_type === "template") && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>File Upload</label>
                  <input type="file" onChange={e => setResourceFile(e.target.files?.[0] || null)}
                    style={{ fontSize: 13, color: text1 }} />
                </div>
              )}

              {/* Thumbnail */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>Thumbnail (optional)</label>
                <input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
                  style={{ fontSize: 13, color: text1 }} />
              </div>

              {/* Published toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none",
                    background: form.published ? "#10B981" : (isDark ? "#333" : "#D1D5DB"),
                    cursor: "pointer", position: "relative", transition: "background 150ms",
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "white",
                    position: "absolute", top: 3,
                    left: form.published ? 23 : 3, transition: "left 150ms",
                  }} />
                </button>
                <span style={{ fontSize: 13, color: text1, fontWeight: 500 }}>
                  {form.published ? "Published (visible to all)" : "Draft (admin only)"}
                </span>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveResource}
              disabled={uploading}
              style={{
                width: "100%", marginTop: 20, padding: "12px 24px",
                background: "#10B981", color: "white", border: "none",
                borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: uploading ? "not-allowed" : "pointer", minHeight: 44,
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? "Saving..." : editingResource ? "Save Changes" : "Add Resource"}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => setDeleteConfirm(null)}>
          <div style={{
            width: "100%", maxWidth: 360, background: isDark ? "#1C1C1E" : "white",
            borderRadius: 16, padding: 24, textAlign: "center",
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 18, fontWeight: 700, color: text1, marginBottom: 8 }}>Delete this resource?</p>
            <p style={{ fontSize: 14, color: text2, marginBottom: 20 }}>{deleteConfirm.title}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                flex: 1, padding: "10px 16px", border: `1.5px solid ${inputBorder}`,
                borderRadius: 10, background: "transparent", color: text1,
                fontSize: 14, fontWeight: 500, cursor: "pointer", minHeight: 44,
              }}>Cancel</button>
              <button onClick={handleDeleteResource} style={{
                flex: 1, padding: "10px 16px", background: "#DC2626", color: "white",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: "pointer", minHeight: 44,
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => setPreviewResource(null)}>
          <div style={{
            width: "100%", maxWidth: 700, height: "80vh",
            background: isDark ? "#1C1C1E" : "white", borderRadius: 16,
            overflow: "hidden", position: "relative", display: "flex", flexDirection: "column",
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 20px", borderBottom: `1px solid ${border}`,
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>
                {previewResource.title}
              </p>
              <button onClick={() => setPreviewResource(null)} style={{
                padding: 6, border: "none", background: "transparent", cursor: "pointer",
              }}>
                <X size={18} color={text2} />
              </button>
            </div>

            {/* Document preview area */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              {previewResource.file_url ? (
                <iframe
                  src={previewResource.file_url}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Document preview"
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <p style={{ color: text2, fontSize: 14 }}>No file available</p>
                </div>
              )}

              {/* Blur overlay for non-admin */}
              {!isAdmin && previewResource.file_url && (
                <div style={{
                  position: "absolute", top: "30%", left: 0, right: 0, bottom: 0,
                  backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    background: isDark ? "#1C1C1E" : "white",
                    borderRadius: 16, padding: "32px 28px", textAlign: "center",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)", maxWidth: 320,
                    border: `1px solid ${border}`,
                  }}>
                    {/* Lock SVG icon */}
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={text2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px", display: "block" }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <p style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: "0 0 8px" }}>
                      Purchase to unlock full access
                    </p>
                    <button
                      onClick={() => { window.location.href = SINGLE_STRIPE_URL; }}
                      style={{
                        width: "100%", padding: "12px 20px", background: "#10B981",
                        color: "white", border: "none", borderRadius: 10,
                        fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44,
                        marginBottom: 10,
                      }}
                    >
                      Download Template
                    </button>
                    <button
                      onClick={() => { window.location.href = BUNDLE_STRIPE_URL; }}
                      style={{
                        background: "none", border: "none", color: "#7B5EA7",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Or get all templates for $25
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
