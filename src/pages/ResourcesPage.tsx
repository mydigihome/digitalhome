import { useState, useEffect } from "react";
import { ExternalLink, Search, Sparkles, Plus, X, Upload, Eye, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const SINGLE_STRIPE_URL = "https://buy.stripe.com/6oUfZhdWa88m71a1Tsak005";
const BUNDLE_STRIPE_URL = "https://buy.stripe.com/cNiaEXcS6dsG5X6bu2ak006";
const STATIC_CATEGORIES = [
  "All", "Finance", "Events", "College", "AI", "Productivity",
  "Automation", "Development", "Design", "Communication",
  "Presentations", "Image Generation", "Video",
  "Career", "Wellness", "Creativity", "Legal", "Other",
];

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

interface CombinedTool {
  name: string;
  url: string;
  category: string;
  desc: string;
  isDynamic?: boolean;
  dynamicId?: string;
  thumbnail_url?: string | null;
  published?: boolean;
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "myslimher@gmail.com";
  const isMobile = useIsMobile();

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const isDark = document.documentElement.classList.contains("dark");
  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.5)" : "#6B7280";
  const cardBg = isDark ? "#1C1C1E" : "white";
  const border = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6";
  const inputBg = isDark ? "#252528" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";
  const [urlFetching, setUrlFetching] = useState(false);

  const [dynamicResources, setDynamicResources] = useState<DynamicResource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState<DynamicResource | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DynamicResource | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewResource, setPreviewResource] = useState<DynamicResource | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", category: "Career",
    resource_type: "link", url: "", published: true,
    thumbnail_url: "" as string,
  });

  const [urlPreviewLogo, setUrlPreviewLogo] = useState("");
  const [urlPreviewDomain, setUrlPreviewDomain] = useState("");

  useEffect(() => {
    fetchResources();
  }, [user]);

  const fetchResources = async () => {
    const { data } = await (supabase as any).from("resources").select("*").order("created_at", { ascending: false });
    if (data) setDynamicResources(data);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", category: "Career", resource_type: "link", url: "", published: true, thumbnail_url: "" });
    setEditingResource(null);
    setUrlPreviewLogo("");
    setUrlPreviewDomain("");
  };

  // Check for duplicate URL across static and dynamic resources
  const isDuplicateUrl = (url: string, excludeId?: string): string | null => {
    if (!url) return null;
    try {
      const normalizedDomain = new URL(url).hostname.replace('www.', '');
      // Check static resources
      const staticMatch = STATIC_RESOURCES.find(r => {
        try { return new URL(r.url).hostname.replace('www.', '') === normalizedDomain; } catch { return false; }
      });
      if (staticMatch) return staticMatch.name;
      // Check dynamic resources
      const dynamicMatch = dynamicResources.find(r => {
        if (excludeId && r.id === excludeId) return false;
        if (!r.url) return false;
        try { return new URL(r.url).hostname.replace('www.', '') === normalizedDomain; } catch { return false; }
      });
      if (dynamicMatch) return dynamicMatch.title;
    } catch {}
    return null;
  };

  // Auto-guess category from description/title keywords
  const guessCategory = (title: string, description: string): string => {
    const text = (title + " " + description).toLowerCase();
    const map: [string, string[]][] = [
      ["Finance", ["finance", "banking", "invest", "budget", "money", "stock", "trading", "payment", "accounting"]],
      ["AI", ["ai", "artificial intelligence", "machine learning", "gpt", "llm", "chatbot"]],
      ["Design", ["design", "ui", "ux", "graphic", "illustration", "figma", "sketch"]],
      ["Development", ["developer", "code", "programming", "github", "deploy", "hosting", "api"]],
      ["Productivity", ["productivity", "task", "project management", "notes", "organize", "calendar", "todo"]],
      ["Communication", ["messaging", "chat", "email", "communication", "slack", "team"]],
      ["Video", ["video", "editing", "streaming", "youtube", "film", "animation"]],
      ["Presentations", ["presentation", "slides", "pitch", "deck"]],
      ["Image Generation", ["image generat", "art generat", "midjourney", "dall-e", "stable diffusion"]],
      ["Automation", ["automat", "workflow", "zapier", "integration"]],
      ["Events", ["event", "ticket", "rsvp", "conference", "meetup"]],
      ["College", ["college", "university", "sat", "admission", "scholarship", "education"]],
      ["Career", ["career", "job", "resume", "hiring", "recruit", "interview"]],
      ["Wellness", ["wellness", "health", "meditation", "fitness", "mental health"]],
      ["Creativity", ["creativ", "music", "art", "writing", "content creation"]],
      ["Legal", ["legal", "law", "contract", "compliance"]],
    ];
    for (const [cat, keywords] of map) {
      if (keywords.some(kw => text.includes(kw))) return cat;
    }
    return "Productivity";
  };

  // Auto-populate from URL using fetch-og-tags
  const autoPopulateFromUrl = async (url: string) => {
    if (!url) return;
    try {
      new URL(url); // validate
    } catch { return; }

    const domain = new URL(url).hostname.replace('www.', '');
    setUrlPreviewDomain(domain);
    const logo = 'https://logo.clearbit.com/' + domain;
    setUrlPreviewLogo(logo);
    setForm(p => ({ ...p, thumbnail_url: logo }));

    // Check for duplicate
    const dupName = isDuplicateUrl(url, editingResource?.id);
    if (dupName) {
      toast.error(`"${dupName}" already exists in the Resource Center`);
      return;
    }

    // Fetch OG tags for auto-populate
    setUrlFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-og-tags", {
        body: { url },
      });
      if (!error && data?.success && data.data) {
        const og = data.data;
        setForm(p => ({
          ...p,
          title: p.title || og.siteName || og.title?.split(/[|\-–—]/)[0]?.trim() || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          description: p.description || og.description?.substring(0, 120) || "",
          category: p.category === "Career" && !editingResource
            ? guessCategory(og.title || "", og.description || "")
            : p.category,
        }));
      } else {
        // Fallback: just set domain-based title
        if (!form.title) {
          setForm(p => ({
            ...p,
            title: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          }));
        }
      }
    } catch {
      if (!form.title) {
        setForm(p => ({
          ...p,
          title: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
        }));
      }
    } finally {
      setUrlFetching(false);
    }
  };

  const handleSaveResource = async () => {
    if (!form.title || !form.description) { toast.error("Title and description required"); return; }
    if (!user) return;

    // Final duplicate check before saving
    const dupName = isDuplicateUrl(form.url, editingResource?.id);
    if (dupName) {
      toast.error(`"${dupName}" already exists in the Resource Center. Duplicate resources are not allowed.`);
      return;
    }

    setUploading(true);

    let thumbnail_url = editingResource?.thumbnail_url || null;

    // Auto-set thumbnail from URL domain
    if (form.url) {
      try {
        const domain = new URL(form.url).hostname.replace('www.', '');
        thumbnail_url = 'https://logo.clearbit.com/' + domain;
      } catch {}
    }

    // Use form thumbnail_url if manually set
    if (form.thumbnail_url) {
      thumbnail_url = form.thumbnail_url;
    }

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      resource_type: "link",
      url: form.url || null,
      file_url: editingResource?.file_url || null,
      thumbnail_url,
      published: form.published,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (editingResource) {
      const { data: updateData, error: updateError } = await (supabase as any)
        .from("resources")
        .update(payload)
        .eq("id", editingResource.id)
        .select();

      if (updateError) {
        toast.error("Update failed: " + updateError.message);
        setUploading(false);
        return;
      }

      if (!updateData || updateData.length === 0) {
        toast.error("File uploaded but not saved. Contact support.");
        setUploading(false);
        return;
      }

      setDynamicResources(prev => prev.map(r =>
        r.id === editingResource.id ? { ...r, ...updateData[0] } : r
      ));
      toast.success("Resource updated successfully");
    } else {
      const { data: insertData, error: insertError } = await (supabase as any)
        .from("resources")
        .insert({ ...payload, user_id: user.id })
        .select();

      if (insertError) {
        toast.error("Failed: " + insertError.message);
        setUploading(false);
        return;
      }

      if (!insertData || insertData.length === 0) {
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
    setDynamicResources(prev => prev.filter(r => r.id !== deleteId));
    setDeleteConfirm(null);
    const { error } = await (supabase as any).from("resources").delete().eq("id", deleteId);
    if (error) {
      toast.error("Delete failed: " + error.message);
      fetchResources();
      return;
    }
    toast.success("Resource deleted");
  };

  const handleEditResource = (r: DynamicResource) => {
    setForm({
      title: r.title, description: r.description, category: r.category,
      resource_type: r.resource_type, url: r.url || "", published: r.published,
      thumbnail_url: r.thumbnail_url || "",
    });
    if (r.url) {
      try {
        const domain = new URL(r.url).hostname.replace('www.', '');
        setUrlPreviewDomain(domain);
        setUrlPreviewLogo('https://logo.clearbit.com/' + domain);
      } catch {}
    }
    setEditingResource(r);
    setShowAddForm(true);
  };

  // Build combined array
  const combinedTools: CombinedTool[] = [
    ...STATIC_RESOURCES.filter(r => {
      const matchCat = activeCategory === "All" || r.category === activeCategory;
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    }),
    ...dynamicResources
      .filter(r => {
        if (!isAdmin && !r.published) return false;
        const matchCat = activeCategory === "All" || r.category === activeCategory;
        const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
      })
      .map(r => ({
        name: r.title,
        url: r.url || "",
        category: r.category,
        desc: r.description,
        isDynamic: true,
        dynamicId: r.id,
        thumbnail_url: r.thumbnail_url,
        published: r.published,
      }))
  ];

  const getDynamicResource = (id: string) => dynamicResources.find(r => r.id === id);

  const getIconForTool = (tool: CombinedTool) => {
    if (tool.isDynamic) {
      if (tool.thumbnail_url) {
        return (
          <img src={tool.thumbnail_url} alt={tool.name}
            style={{ width: 24, height: 24, borderRadius: 4, objectFit: "contain" }}
            onError={e => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              const parent = el.parentElement;
              if (parent) {
                parent.innerHTML = '<span style="font-size:16px;font-weight:700;color:#6B7280">' + tool.name.charAt(0).toUpperCase() + '</span>';
              }
            }}
          />
        );
      }
      if (tool.url) {
        const favicon = getFaviconUrl(tool.url);
        if (favicon) {
          return (
            <img src={favicon} alt={tool.name}
              style={{ width: 24, height: 24, borderRadius: 4 }}
              onError={e => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                const parent = el.parentElement;
                if (parent) {
                  parent.innerHTML = '<span style="font-size:16px;font-weight:700;color:#6B7280">' + tool.name.charAt(0).toUpperCase() + '</span>';
                }
              }}
            />
          );
        }
      }
      return <span style={{ fontSize: 16, fontWeight: 700, color: "#6B7280" }}>{tool.name.charAt(0).toUpperCase()}</span>;
    }
    // Static tool
    const favicon = getFaviconUrl(tool.url);
    if (favicon) {
      return (
        <img src={favicon} alt={tool.name} style={{ width: 24, height: 24, borderRadius: 4 }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      );
    }
    return <Sparkles size={18} color={text2} />;
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

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} color={text2} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tools..."
          style={{
            width: "100%", padding: "10px 14px 10px 40px", border: `1.5px solid ${inputBorder}`,
            borderRadius: 10, fontSize: 14, color: text1, fontFamily: "Inter, sans-serif",
            outline: "none", background: inputBg, boxSizing: "border-box" as const,
          }}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: isMobile ? "auto" : undefined, flexWrap: isMobile ? "nowrap" : "wrap", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" as const }}>
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
              flexShrink: 0, whiteSpace: "nowrap",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Unified tools grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {combinedTools.map(tool => (
          <div
            key={tool.isDynamic ? tool.dynamicId : tool.name}
            onClick={() => {
              if (tool.url) {
                const a = document.createElement("a");
                a.href = tool.url; a.target = "_blank"; a.rel = "noopener noreferrer";
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: 16,
              background: cardBg, border: `1px solid ${border}`, borderRadius: 14,
              cursor: "pointer", textAlign: "left" as const, transition: "all 150ms", width: "100%",
              position: "relative" as const,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#10B981"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: isDark ? "#252528" : "#F9FAFB",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden",
            }}>
              {getIconForTool(tool)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 2 }}>{tool.name}</p>
              <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{tool.desc}</p>
            </div>
            <ExternalLink size={14} color={text2} style={{ flexShrink: 0 }} />
            {tool.isDynamic && isAdmin && tool.dynamicId && (
              <div style={{ display: "flex", gap: 4, position: "absolute" as const, top: 8, right: 8 }}>
                <button
                  onClick={e => { e.stopPropagation(); const dr = getDynamicResource(tool.dynamicId!); if (dr) handleEditResource(dr); }}
                  style={{
                    width: 24, height: 24, background: "rgba(0,0,0,0.4)",
                    border: "none", borderRadius: "50%", color: "white", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                  }}
                >✎</button>
                <button
                  onClick={e => { e.stopPropagation(); const dr = getDynamicResource(tool.dynamicId!); if (dr) setDeleteConfirm(dr); }}
                  style={{
                    width: 24, height: 24, background: "rgba(220,38,38,0.7)",
                    border: "none", borderRadius: "50%", color: "white", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                  }}
                >×</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {combinedTools.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif" }}>No tools found matching your search.</p>
        </div>
      )}

      {/* Add/Edit Resource Modal (Admin Only) */}
      {showAddForm && isAdmin && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 16,
        }} onClick={() => { setShowAddForm(false); resetForm(); }}>
          <div style={{
            width: "100%", maxWidth: isMobile ? "100%" : 520, background: isDark ? "#1C1C1E" : "white",
            borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: isMobile ? "20px 16px" : 28,
            maxHeight: isMobile ? "95vh" : "90vh", overflowY: "auto",
            paddingBottom: isMobile ? "calc(20px + env(safe-area-inset-bottom, 0px))" : 28,
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
              {/* URL */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>Resource URL</label>
                <div style={{ position: "relative" }}>
                  <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                    onBlur={() => autoPopulateFromUrl(form.url)}
                    type="url"
                    placeholder="https://..."
                    style={{
                      width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                      borderRadius: 10, fontSize: 16, color: text1, background: inputBg,
                      outline: "none", boxSizing: "border-box" as const,
                      minHeight: 48,
                    }}
                  />
                  {urlFetching && (
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                      <Loader2 size={16} color="#10B981" className="animate-spin" />
                    </div>
                  )}
                </div>
                {urlPreviewLogo && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginTop: 6,
                    padding: "6px 10px",
                    background: isDark ? "#252528" : "#F9FAFB",
                    borderRadius: 8, width: "fit-content",
                  }}>
                    <img
                      src={urlPreviewLogo}
                      alt=""
                      style={{ width: 20, height: 20, borderRadius: 4 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>
                      {urlPreviewDomain}
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>Name *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Notion, Shopify..."
                  style={{
                    width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                    borderRadius: 10, fontSize: 16, color: text1, background: inputBg,
                    outline: "none", boxSizing: "border-box" as const,
                    minHeight: 48,
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>Short description *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What does this tool do?"
                  rows={2}
                  style={{
                    width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                    borderRadius: 10, fontSize: 16, color: text1, background: inputBg,
                    outline: "none", resize: "vertical", boxSizing: "border-box" as const,
                    fontFamily: "Inter, sans-serif", minHeight: 48,
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 4 }}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`,
                    borderRadius: 10, fontSize: 16, color: text1, background: inputBg, cursor: "pointer",
                    minHeight: 48,
                  }}>
                  {STATIC_CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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
