import { useState } from "react";
import { ExternalLink, Search, Sparkles } from "lucide-react";

const CATEGORIES = [
  "All", "Finance", "Events", "College", "AI", "Productivity",
  "Automation", "Development", "Design", "Communication",
  "Presentations", "Image Generation", "Video",
];

const RESOURCES = [
  // Finance
  { name: "Robinhood", url: "https://robinhood.com", category: "Finance", desc: "Commission-free stock trading" },
  { name: "Fidelity", url: "https://fidelity.com", category: "Finance", desc: "Investment management & retirement" },
  { name: "Webull", url: "https://webull.com", category: "Finance", desc: "Advanced trading platform" },
  { name: "Schwab", url: "https://schwab.com", category: "Finance", desc: "Full-service brokerage" },
  { name: "Vanguard", url: "https://vanguard.com", category: "Finance", desc: "Index funds & ETFs" },
  { name: "Mint", url: "https://mint.intuit.com", category: "Finance", desc: "Budgeting & expense tracking" },
  { name: "YNAB", url: "https://ynab.com", category: "Finance", desc: "You Need A Budget" },
  { name: "Plaid", url: "https://plaid.com", category: "Finance", desc: "Bank account connectivity" },
  // Events
  { name: "Eventbrite", url: "https://eventbrite.com", category: "Events", desc: "Event discovery & ticketing" },
  { name: "Luma", url: "https://lu.ma", category: "Events", desc: "Beautiful event pages" },
  { name: "Partiful", url: "https://partiful.com", category: "Events", desc: "Social event invitations" },
  // College
  { name: "Common App", url: "https://commonapp.org", category: "College", desc: "College application portal" },
  { name: "Khan Academy", url: "https://khanacademy.org", category: "College", desc: "Free courses & SAT prep" },
  { name: "College Board", url: "https://collegeboard.org", category: "College", desc: "SAT, AP & college planning" },
  // AI
  { name: "ChatGPT", url: "https://chat.openai.com", category: "AI", desc: "AI assistant by OpenAI" },
  { name: "Claude", url: "https://claude.ai", category: "AI", desc: "AI assistant by Anthropic" },
  { name: "Gemini", url: "https://gemini.google.com", category: "AI", desc: "Google's AI model" },
  { name: "Perplexity", url: "https://perplexity.ai", category: "AI", desc: "AI-powered research" },
  // Productivity
  { name: "Notion", url: "https://notion.so", category: "Productivity", desc: "All-in-one workspace" },
  { name: "Todoist", url: "https://todoist.com", category: "Productivity", desc: "Task management" },
  { name: "Linear", url: "https://linear.app", category: "Productivity", desc: "Project management for teams" },
  { name: "Cron", url: "https://cron.com", category: "Productivity", desc: "Next-gen calendar" },
  // Automation
  { name: "Zapier", url: "https://zapier.com", category: "Automation", desc: "Connect apps & automate workflows" },
  { name: "Make", url: "https://make.com", category: "Automation", desc: "Visual automation platform" },
  { name: "n8n", url: "https://n8n.io", category: "Automation", desc: "Open-source workflow automation" },
  // Development
  { name: "GitHub", url: "https://github.com", category: "Development", desc: "Code hosting & collaboration" },
  { name: "Vercel", url: "https://vercel.com", category: "Development", desc: "Frontend deployment platform" },
  { name: "Supabase", url: "https://supabase.com", category: "Development", desc: "Open-source Firebase alternative" },
  // Design
  { name: "Figma", url: "https://figma.com", category: "Design", desc: "Collaborative design tool" },
  { name: "Canva", url: "https://canva.com", category: "Design", desc: "Easy graphic design" },
  { name: "Dribbble", url: "https://dribbble.com", category: "Design", desc: "Design inspiration & portfolio" },
  // Communication
  { name: "Slack", url: "https://slack.com", category: "Communication", desc: "Team messaging" },
  { name: "Discord", url: "https://discord.com", category: "Communication", desc: "Community communication" },
  { name: "Loom", url: "https://loom.com", category: "Communication", desc: "Async video messaging" },
  // Presentations
  { name: "Pitch", url: "https://pitch.com", category: "Presentations", desc: "Collaborative presentations" },
  { name: "Beautiful.ai", url: "https://beautiful.ai", category: "Presentations", desc: "AI-powered slide design" },
  { name: "Gamma", url: "https://gamma.app", category: "Presentations", desc: "AI presentations & docs" },
  // Image Generation
  { name: "Midjourney", url: "https://midjourney.com", category: "Image Generation", desc: "AI image generation" },
  { name: "DALL·E", url: "https://openai.com/dall-e-3", category: "Image Generation", desc: "OpenAI image generation" },
  { name: "Leonardo.ai", url: "https://leonardo.ai", category: "Image Generation", desc: "AI creative suite" },
  // Video
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

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const isDark = document.documentElement.classList.contains("dark");
  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.5)" : "#6B7280";
  const cardBg = isDark ? "#1C1C1E" : "white";
  const border = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6";
  const inputBg = isDark ? "#252528" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  const filtered = RESOURCES.filter(r => {
    const matchesCategory = activeCategory === "All" || r.category === activeCategory;
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 80px" }}>
      <div style={{ padding: "28px 0 24px", borderBottom: `1px solid ${border}`, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif", letterSpacing: "-0.3px", margin: 0, marginBottom: 4 }}>
          Resource Center
        </h1>
        <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>
          Tools and resources to level up your workflow
        </p>
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
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {CATEGORIES.map(cat => (
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
        {filtered.map(tool => (
          <button
            key={tool.name}
            onClick={() => {
              const link = document.createElement("a");
              link.href = tool.url;
              link.target = "_blank";
              link.rel = "noopener noreferrer";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
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
                <img
                  src={getFaviconUrl(tool.url)!}
                  alt={tool.name}
                  style={{ width: 24, height: 24, borderRadius: 4 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <Sparkles size={18} color={text2} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 2 }}>
                {tool.name}
              </p>
              <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {tool.desc}
              </p>
            </div>
            <ExternalLink size={14} color={text2} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif" }}>No tools found matching your search.</p>
        </div>
      )}
    </div>
  );
}
