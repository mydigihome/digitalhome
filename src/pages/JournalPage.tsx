import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import { Plus, Search, MoreVertical, FileDown, Mic, Image as ImageIcon, X } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

const EMOTION_COLORS: Record<string, string> = {
  Happy: "#F59E0B",
  Sad: "#7C3A2D",
  Calm: "#6B8F3A",
  Anxious: "#7B7464",
  Inspired: "#7B5EA7",
  Focused: "#10B981",
};

const FILTER_TAGS = ["All", "Happy", "Calm", "Inspired", "Focused", "Sad", "Anxious"];

function calculateStreak(entries: any[]) {
  if (!entries?.length) return 0;
  const dates = entries.map(e => new Date(e.created_at).toDateString());
  const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  for (const dateStr of uniqueDates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor((checkDate.getTime() - d.getTime()) / 86400000);
    if (diff === 0 || diff === 1) {
      streak++;
      checkDate = d;
    } else break;
  }
  return streak;
}

function getEmotionStats(entries: any[]) {
  const counts: Record<string, number> = {};
  let total = 0;
  entries.forEach(e => {
    if (e.mood) {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
      total++;
    }
    e.tags?.forEach((t: string) => {
      if (t !== e.mood) {
        counts[t] = (counts[t] || 0) + 1;
        total++;
      }
    });
  });
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, percentage: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

function getLast7Days(entries: any[]) {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateSet = new Set(entries.map(e => new Date(e.created_at).toDateString()));
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(dateSet.has(d.toDateString()));
  }
  return result;
}

export default function JournalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: entries = [] } = useQuery({
    queryKey: ["journal-entries-all", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const currentStreak = calculateStreak(entries);
  const emotionStats = getEmotionStats(entries);
  const last7Days = getLast7Days(entries);

  const filtered = entries.filter(e => {
    const matchesSearch = !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.content_preview?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || e.mood === activeFilter || e.tags?.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  const isDark = document.documentElement.classList.contains("dark");

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    let y = 20;
    entries.forEach((entry, i) => {
      if (i > 0) doc.addPage();
      y = 20;
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(new Date(entry.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), 20, y);
      y += 8;
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text(entry.title || "Untitled Entry", 20, y);
      y += 10;
      if (entry.mood || entry.tags?.length) {
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text([entry.mood, ...(entry.tags || [])].filter(Boolean).join(", "), 20, y);
        y += 8;
      }
      doc.setFontSize(12);
      doc.setTextColor(55, 65, 81);
      const text = String(entry.content_preview || entry.content || "").replace(/<[^>]*>/g, "").substring(0, 2000);
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, y);
      if (entry.audio_url) {
        y += lines.length * 6 + 8;
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text("🎙 Voice note attached", 20, y);
      }
    });
    doc.save(`my-journal-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Journal exported as PDF");
  };

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 100px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "0 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E8E5E0"}`, background: isDark ? "#252528" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <X size={18} color={isDark ? "rgba(255,255,255,0.6)" : "#374151"} />
            </button>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif", margin: 0 }}>My Journal</h1>
              <p style={{ fontSize: 13, color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", fontFamily: "Inter, sans-serif", margin: "4px 0 0" }}>
                {entries.length} entries{currentStreak > 0 ? ` · ${currentStreak} day streak` : " · Start your streak today"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div ref={menuRef} style={{ position: "relative" }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, background: isDark ? "#252528" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MoreVertical size={16} color={isDark ? "rgba(255,255,255,0.6)" : "#6B7280"} />
              </button>
              {menuOpen && (
                <div style={{ position: "absolute", right: 0, top: 42, background: isDark ? "#252528" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 160, padding: 4 }}>
                  <button onClick={() => { setMenuOpen(false); handleExportPDF(); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer", borderRadius: 8, fontSize: 13, color: isDark ? "#F2F2F2" : "#374151", fontFamily: "Inter, sans-serif" }}>
                    <FileDown size={14} /> Export PDF
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => navigate("/journal/new")} style={{ padding: "10px 20px", background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={16} /> New Entry
            </button>
          </div>
        </div>

        {/* STREAK CARD — Journal notebook style */}
        <div style={{
          margin: "0 12px 20px", padding: "20px 24px",
          background: isDark ? "#1C1C1E" : "#FFFDF7",
          borderRadius: 14,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E8E2D4"}`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Notebook lines */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute", left: 24, right: 24,
                top: 28 + i * 24,
                height: 1, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(16,185,129,0.12)",
              }} />
            ))}
            {/* Left margin line */}
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: 52,
              width: 1, background: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.2)",
            }} />
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#10B981", margin: 0, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Streak</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>{currentStreak}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280" }}>days</span>
              </div>
              <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF", margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>{entries.length} total entries</p>
            </div>
            <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF", maxWidth: 160, textAlign: "right", fontFamily: "Inter, sans-serif", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Celebrate what made you smile today.</p>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 16, position: "relative", zIndex: 1 }}>
            {last7Days.map((has, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: "50%",
                background: has ? (isDark ? "rgba(16,185,129,0.2)" : "#D1FAE5") : (isDark ? "#252528" : "#F3F4F6"),
                display: "flex", alignItems: "center", justifyContent: "center",
                border: has ? "1.5px solid #10B981" : `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
              }}>
                {has && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* EMOTIONS */}
        {emotionStats.length > 0 && (
          <div style={{ margin: "0 12px 20px", padding: 20, background: isDark ? "#1C1C1E" : "white", borderRadius: 14, border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: "0 0 4px", fontFamily: "Inter, sans-serif" }}>Emotions</h3>
            <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF", margin: "0 0 16px", fontFamily: "Inter, sans-serif" }}>Based on all your journal entries</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {emotionStats.map(emotion => (
                <div key={emotion.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 28, background: isDark ? "#252528" : "#F3F4F6", borderRadius: 999, overflow: "hidden", position: "relative" }}>
                    <div style={{ height: "100%", width: `${Math.max(emotion.percentage, 8)}%`, background: EMOTION_COLORS[emotion.label] || "#9CA3AF", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10, transition: "width 600ms ease" }}>
                      {emotion.percentage > 15 && <span style={{ fontSize: 11, fontWeight: 600, color: "white", fontFamily: "Inter, sans-serif" }}>{emotion.percentage}%</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", width: 60, fontFamily: "Inter, sans-serif" }}>{emotion.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH + FILTERS */}
        <div style={{ margin: "0 12px 12px", padding: "10px 14px", background: isDark ? "#1C1C1E" : "white", borderRadius: 10, border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`, display: "flex", alignItems: "center", gap: 8 }}>
          <Search size={16} color={isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search entries..." style={{ border: "none", outline: "none", fontSize: 14, color: isDark ? "#F2F2F2" : "#374151", background: "transparent", width: "100%", fontFamily: "Inter, sans-serif" }} />
        </div>
        <div style={{ display: "flex", gap: 6, margin: "0 12px 16px", flexWrap: "wrap" }}>
          {FILTER_TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveFilter(tag)} style={{ padding: "5px 14px", borderRadius: 999, border: `1.5px solid ${activeFilter === tag ? "#10B981" : isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, background: activeFilter === tag ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : (isDark ? "#252528" : "white"), color: activeFilter === tag ? "#10B981" : (isDark ? "rgba(255,255,255,0.5)" : "#6B7280"), fontSize: 12, fontWeight: activeFilter === tag ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              {tag}
            </button>
          ))}
        </div>

        {/* ENTRIES LIST */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF" }}>
            <p style={{ fontSize: 14, fontFamily: "Inter, sans-serif" }}>No entries found. Start writing!</p>
          </div>
        )}
        {/* ENTRIES LIST VIEW */}
        <div style={{ margin: "0 12px" }}>
          {filtered.map((entry, idx) => (
            <div key={entry.id} onClick={() => navigate(`/journal/${entry.id}`)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 0",
                borderBottom: idx < filtered.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}` : "none",
                cursor: "pointer", transition: "background 150ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {/* Date column */}
              <div style={{ width: 48, flexShrink: 0, textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#10B981", margin: 0, fontFamily: "Inter, sans-serif", lineHeight: 1 }}>
                  {new Date(entry.created_at).getDate()}
                </p>
                <p style={{ fontSize: 10, fontWeight: 500, color: isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF", margin: "2px 0 0", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>
                  {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short" })}
                </p>
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", margin: 0, fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.title || "Untitled Entry"}
                  </p>
                  {entry.mood && (
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 500, background: `${EMOTION_COLORS[entry.mood] || "#9CA3AF"}20`, color: EMOTION_COLORS[entry.mood] || "#9CA3AF", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
                      {entry.mood}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.35)" : "#6B7280", margin: "3px 0 0", fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {String(entry.content_preview || entry.content || "").replace(/<[^>]*>/g, "").substring(0, 100)}
                </p>
              </div>
              {/* Indicators */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {entry.audio_url && <Mic size={13} color={isDark ? "rgba(255,255,255,0.25)" : "#9CA3AF"} />}
                {entry.image_url && <ImageIcon size={13} color={isDark ? "rgba(255,255,255,0.25)" : "#9CA3AF"} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
