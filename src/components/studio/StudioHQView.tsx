import { useState, useEffect, useRef } from "react";
import {
  Calendar, LayoutGrid, Plus, UserPlus, X, ChevronLeft, ChevronRight,
  Clock, MessageSquare, Send, Trash2, ArrowRight, Lightbulb,
  MoreHorizontal, Maximize2, MoveRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  user_id: string;
  title: string;
  platform: string | null;
  content_type: string | null;
  stage: string;
  due_date: string | null;
  assigned_to: string | null;
  caption_notes: string | null;
  comment_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface StudioInvite {
  id: string;
  invitee_email: string;
  status: string;
  created_at: string;
}

interface Idea {
  id: string;
  text: string;
  platform: string;
  contentType: string;
  date: string;
  targetDate?: string;
}

const STAGES = [
  { id: "idea", label: "Ideas", color: "#9CA3AF" },
  { id: "in_progress", label: "In Progress", color: "#F59E0B" },
  { id: "scheduled", label: "Scheduled", color: "#3B82F6" },
  { id: "posted", label: "Published", color: "#10B981" },
];

const PLATFORMS = ["Instagram", "YouTube", "TikTok", "Twitter", "LinkedIn", "Multiple"];
const CONTENT_TYPES = ["Reel", "Post", "Video", "Carousel", "Thread", "Story", "Short"];
const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C", YouTube: "#FF0000", TikTok: "#010101",
  Twitter: "#1DA1F2", LinkedIn: "#0A66C2", Multiple: "#6366F1",
};

const MOCK_IDEAS: Idea[] = [
  { id: "1", text: "Behind the scenes of my morning routine", platform: "Instagram", contentType: "Reel", date: "Mar 27" },
  { id: "2", text: "Top 5 tools I use to run my business", platform: "Instagram", contentType: "Carousel", date: "Mar 26" },
  { id: "3", text: "Why I stopped posting daily", platform: "YouTube", contentType: "Video", date: "Mar 25" },
  { id: "4", text: "Brand deal red flags to watch out for", platform: "Twitter", contentType: "Post", date: "Mar 24" },
];

export default function StudioHQView() {
  const { user } = useAuth();
  const isDark = document.documentElement.classList.contains("dark");

  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>(MOCK_IDEAS);
  const [newIdea, setNewIdea] = useState("");
  const [invites, setInvites] = useState<StudioInvite[]>([]);
  const [collaborators] = useState<any[]>([]);

  // Modals
  const [newContentOpen, setNewContentOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState("idea");
  const [detailCard, setDetailCard] = useState<ContentItem | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [cardMenuOpen, setCardMenuOpen] = useState<string | null>(null);

  // New content form
  const [formTitle, setFormTitle] = useState("");
  const [formPlatform, setFormPlatform] = useState("");
  const [formType, setFormType] = useState("");
  const [formStage, setFormStage] = useState("idea");
  const [formDueDate, setFormDueDate] = useState("");
  const [formCaption, setFormCaption] = useState("");

  // Calendar
  const [calView, setCalView] = useState<"pipeline" | "calendar">("pipeline");
  const [calMode, setCalMode] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [calMonthDate, setCalMonthDate] = useState(() => new Date());

  // Detail modal
  const [detailComments, setDetailComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const captionTimer = useRef<any>(null);

  // Load content items
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("content_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setContentItems(data as ContentItem[]);

      const { data: inv } = await supabase
        .from("studio_invites")
        .select("*")
        .eq("inviter_user_id", user.id)
        .order("created_at", { ascending: false });
      if (inv) setInvites(inv as StudioInvite[]);
    })();
  }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("content-changes")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "content_items",
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        if (payload.eventType === "UPDATE") {
          setContentItems(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        }
        if (payload.eventType === "INSERT") {
          setContentItems(prev => [payload.new as ContentItem, ...prev]);
        }
        if (payload.eventType === "DELETE") {
          setContentItems(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Drag & drop
  const handleStageDrop = async (contentId: string, newStage: string) => {
    setContentItems(prev => prev.map(c =>
      c.id === contentId ? { ...c, stage: newStage } : c
    ));
    await supabase.from("content_items").update({
      stage: newStage, updated_at: new Date().toISOString(),
    }).eq("id", contentId);
    if (newStage === "review") toast.success("Moved to Review");
    if (newStage === "approved") toast.success("Content Approved! ✓");
  };

  // Create content
  const handleCreateContent = async () => {
    if (!user || !formTitle.trim()) return;
    const { error } = await supabase.from("content_items").insert({
      user_id: user.id,
      title: formTitle.trim(),
      platform: formPlatform || null,
      content_type: formType || null,
      stage: formStage,
      due_date: formDueDate || null,
      caption_notes: formCaption || null,
      created_by: user.id,
    });
    if (error) { toast.error("Failed to create"); return; }
    setFormTitle(""); setFormPlatform(""); setFormType("");
    setFormStage("idea"); setFormDueDate(""); setFormCaption("");
    setNewContentOpen(false);
    toast.success("Content created!");
    // Refresh
    const { data } = await supabase.from("content_items").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setContentItems(data as ContentItem[]);
  };

  // Detail modal - update field
  const updateDetailField = async (field: string, value: any) => {
    if (!detailCard) return;
    setDetailCard(prev => prev ? { ...prev, [field]: value } : null);
    clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(async () => {
      await supabase.from("content_items").update({
        [field]: value, updated_at: new Date().toISOString(),
      }).eq("id", detailCard.id);
    }, 1000);
  };

  // Load comments for detail
  useEffect(() => {
    if (!detailCard) return;
    (async () => {
      const { data } = await supabase
        .from("content_comments")
        .select("*")
        .eq("content_piece_id", detailCard.id)
        .order("created_at", { ascending: false });
      setDetailComments(data || []);
    })();
  }, [detailCard?.id]);

  const handleAddComment = async () => {
    if (!user || !detailCard || !newComment.trim()) return;
    await supabase.from("content_comments").insert({
      content_piece_id: detailCard.id,
      user_id: user.id,
      comment: newComment.trim(),
    });
    setNewComment("");
    // Refresh comments
    const { data } = await supabase.from("content_comments")
      .select("*").eq("content_piece_id", detailCard.id)
      .order("created_at", { ascending: false });
    setDetailComments(data || []);
    // Increment comment count
    await supabase.from("content_items").update({
      comment_count: (detailCard.comment_count || 0) + 1,
    }).eq("id", detailCard.id);
    setDetailCard(prev => prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : null);
  };

  // Ideas
  const addIdea = () => {
    if (!newIdea.trim()) return;
    setIdeas(prev => [{
      id: Date.now().toString(), text: newIdea.trim(),
      platform: "", contentType: "", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }, ...prev]);
    setNewIdea("");
  };

  const moveIdeaToPipeline = async (idea: Idea) => {
    if (!user) return;
    await supabase.from("content_items").insert({
      user_id: user.id, title: idea.text,
      platform: idea.platform || null,
      content_type: idea.contentType || null,
      stage: "idea", created_by: user.id,
    });
    setIdeas(prev => prev.filter(i => i.id !== idea.id));
    toast.success("Moved to Pipeline - Ideas");
    const { data } = await supabase.from("content_items").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setContentItems(data as ContentItem[]);
  };

  // Invite
  const handleSendInvite = async () => {
    if (!user || !inviteEmail.trim()) return;
    const { error } = await supabase.from("studio_invites").insert({
      inviter_user_id: user.id,
      invitee_email: inviteEmail.trim(),
      studio_name: "My Studio",
      status: "pending",
    });
    if (error) { toast.error("Failed to send invite"); return; }
    setInviteSent(true);
    const { data: inv } = await supabase.from("studio_invites")
      .select("*").eq("inviter_user_id", user.id)
      .order("created_at", { ascending: false });
    if (inv) setInvites(inv as StudioInvite[]);
  };

  // Calendar helpers
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (weekOffset * 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();
  const weekLabel = `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: "13px",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
    borderRadius: "8px", outline: "none",
    background: isDark ? "#252528" : "white",
    color: isDark ? "#F2F2F2" : "#374151",
    boxSizing: "border-box", fontFamily: "Inter, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px", fontWeight: 600, color: "#9CA3AF",
    textTransform: "uppercase", letterSpacing: "0.5px",
    marginBottom: "6px", display: "block", fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ===== CONTENT PIPELINE ===== */}
      <div style={{
        background: isDark ? "#1C1C1E" : "white",
        borderRadius: "12px",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
        padding: "20px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: 0, fontFamily: "Inter, sans-serif" }}>
              Content Pipeline
            </h3>
            <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "2px 0 0", fontFamily: "Inter, sans-serif" }}>
              Your content workflow
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => { setInviteOpen(true); setInviteSent(false); setInviteEmail(""); }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", background: isDark ? "#252528" : "white",
                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>
              <UserPlus size={14} /> Invite Editor
            </button>
            <button onClick={() => { setNewContentOpen(true); setFormStage("idea"); }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", background: "#10B981", color: "white",
                border: "none", borderRadius: "8px", fontSize: "13px",
                fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>
              <Plus size={14} /> New Content
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
          <button onClick={() => setCalView("pipeline")}
            style={{
              display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px",
              borderRadius: "6px", fontSize: "12px", fontWeight: calView === "pipeline" ? 600 : 400,
              background: calView === "pipeline" ? (isDark ? "#252528" : "#F3F4F6") : "transparent",
              color: calView === "pipeline" ? (isDark ? "#F2F2F2" : "#111827") : "#9CA3AF",
              border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
            <LayoutGrid size={12} /> Pipeline
          </button>
          <button onClick={() => setCalView("calendar")}
            style={{
              display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px",
              borderRadius: "6px", fontSize: "12px", fontWeight: calView === "calendar" ? 600 : 400,
              background: calView === "calendar" ? (isDark ? "#252528" : "#F3F4F6") : "transparent",
              color: calView === "calendar" ? (isDark ? "#F2F2F2" : "#111827") : "#9CA3AF",
              border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
            <Calendar size={12} /> Calendar
          </button>
        </div>

        {calView === "pipeline" ? (
          /* KANBAN */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {STAGES.map(stage => {
              const cards = contentItems.filter(c => c.stage === stage.id);
              return (
                <div key={stage.id} style={{
                  background: isDark ? "#1C1C1E" : "white",
                  borderRadius: "12px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`,
                  padding: "16px",
                  minHeight: "400px",
                }}>
                  {/* Column header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: stage.color }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>
                      {stage.label}
                    </span>
                    <span style={{ fontSize: "11px", color: "#9CA3AF", marginLeft: "auto", fontWeight: 500 }}>{cards.length}</span>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      const id = e.dataTransfer.getData("contentId");
                      if (id) handleStageDrop(id, stage.id);
                    }}
                    style={{ minHeight: "300px", display: "flex", flexDirection: "column", gap: "8px" }}
                  >
                    {cards.map(card => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={e => e.dataTransfer.setData("contentId", card.id)}
                        style={{
                          background: isDark ? "#252528" : "white",
                          borderRadius: "10px",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`,
                          padding: "14px",
                          cursor: "grab",
                          boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
                          transition: "all 150ms",
                          position: "relative",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.1)";
                          (e.currentTarget as HTMLDivElement).style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "#E5E7EB";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "none" : "0 1px 3px rgba(0,0,0,0.06)";
                          (e.currentTarget as HTMLDivElement).style.borderColor = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6";
                        }}
                      >
                        {/* Platform + type tags */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                          {card.platform && (
                            <span style={{
                              padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 600,
                              background: card.platform === "Instagram" ? "#FDF2F8" : card.platform === "YouTube" ? "#FEF2F2" : card.platform === "TikTok" ? "#F0FDF4" : card.platform === "Twitter" ? "#EFF6FF" : card.platform === "LinkedIn" ? "#EFF6FF" : "#F3F4F6",
                              color: card.platform === "Instagram" ? "#BE185D" : card.platform === "YouTube" ? "#DC2626" : card.platform === "TikTok" ? "#065F46" : card.platform === "Twitter" ? "#1D4ED8" : card.platform === "LinkedIn" ? "#1D4ED8" : "#6B7280",
                              border: "1px solid",
                              borderColor: card.platform === "Instagram" ? "#FBCFE8" : card.platform === "YouTube" ? "#FECACA" : card.platform === "TikTok" ? "#BBF7D0" : "#BFDBFE",
                            }}>{card.platform}</span>
                          )}
                          {card.content_type && (
                            <span style={{
                              padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 500,
                              background: isDark ? "rgba(255,255,255,0.06)" : "#F9FAFB",
                              color: "#6B7280", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`,
                            }}>{card.content_type}</span>
                          )}
                        </div>

                        {/* Title — editable inline */}
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={async e => {
                            const newTitle = e.currentTarget.textContent || "";
                            if (newTitle && newTitle !== card.title) {
                              await supabase.from("content_items").update({ title: newTitle }).eq("id", card.id);
                              setContentItems(prev => prev.map(c => c.id === card.id ? { ...c, title: newTitle } : c));
                            }
                          }}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLElement).blur(); } }}
                          style={{
                            fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827",
                            lineHeight: "1.4", marginBottom: "10px", fontFamily: "Inter, sans-serif",
                            outline: "none", cursor: "text", borderRadius: "4px", padding: "2px 4px",
                            margin: "0 -4px 10px", transition: "background 150ms",
                          }}
                          onFocus={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB"; e.currentTarget.style.outline = "2px solid #10B981"; }}
                          onBlurCapture={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.outline = "none"; }}
                        >
                          {card.title}
                        </p>

                        {/* Due date */}
                        {card.due_date && (
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px" }}>
                            <Calendar size={11} color={new Date(card.due_date) < new Date() ? "#EF4444" : "#9CA3AF"} />
                            <span style={{
                              fontSize: "11px", fontFamily: "Inter, sans-serif",
                              color: new Date(card.due_date) < new Date() ? "#EF4444" : "#6B7280",
                            }}>
                              {new Date(card.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            {new Date(card.due_date) < new Date() && (
                              <span style={{ fontSize: "10px", color: "#EF4444", fontWeight: 600 }}>Overdue</span>
                            )}
                          </div>
                        )}

                        {/* Caption preview */}
                        {card.caption_notes && (
                          <p style={{
                            fontSize: "11px", color: "#9CA3AF", lineHeight: "1.4", marginBottom: "10px",
                            fontFamily: "Inter, sans-serif", overflow: "hidden",
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          }}>{card.caption_notes}</p>
                        )}

                        {/* Divider */}
                        <div style={{ height: "1px", background: isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB", margin: "10px -14px" }} />

                        {/* Footer */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            {[card.assigned_to, card.created_by].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).map((userId, i) => {
                              const person = userId === user?.id ? user : collaborators?.find((c: any) => c.id === userId);
                              return (
                                <div key={i} title={(person as any)?.full_name || (person as any)?.email || "Unknown"} style={{
                                  width: "24px", height: "24px", borderRadius: "50%",
                                  border: "2px solid white", background: i === 0 ? "#F5F3FF" : "#F0FDF4",
                                  overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "9px", fontWeight: 700, color: i === 0 ? "#7B5EA7" : "#065F46",
                                  marginLeft: i > 0 ? "-6px" : "0", boxShadow: "0 0 0 2px white",
                                }}>
                                  {((person as any)?.full_name || (person as any)?.email || "?").charAt(0).toUpperCase()}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {(card.comment_count || 0) > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#9CA3AF" }}>
                                <MessageSquare size={11} />
                                <span style={{ fontSize: "11px" }}>{card.comment_count}</span>
                              </div>
                            )}
                            <div style={{ position: "relative" }}>
                              <button
                                onClick={e => { e.stopPropagation(); setCardMenuOpen(cardMenuOpen === card.id ? null : card.id); }}
                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "2px", borderRadius: "4px", display: "flex", alignItems: "center" }}>
                                <MoreHorizontal size={13} />
                              </button>
                              {cardMenuOpen === card.id && (
                                <div style={{
                                  position: "absolute", right: 0, top: "100%", zIndex: 50,
                                  background: isDark ? "#1C1C1E" : "white", borderRadius: "10px",
                                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)", minWidth: "160px", overflow: "hidden",
                                }}>
                                  {[
                                    { label: "Open details", Icon: Maximize2, action: () => setDetailCard(card) },
                                    { label: "Move to...", Icon: MoveRight, action: () => {} },
                                  ].map(item => (
                                    <button key={item.label} onClick={() => { item.action(); setCardMenuOpen(null); }}
                                      style={{
                                        width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px",
                                        border: "none", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB"}`,
                                        background: "transparent", fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151",
                                        cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif",
                                      }}>
                                      <item.Icon size={13} color="#9CA3AF" /> {item.label}
                                    </button>
                                  ))}
                                  <button onClick={async () => {
                                    if (window.confirm("Delete this content?")) {
                                      await supabase.from("content_items").delete().eq("id", card.id);
                                      setContentItems(prev => prev.filter(c => c.id !== card.id));
                                    }
                                    setCardMenuOpen(null);
                                  }} style={{
                                    width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px",
                                    border: "none", background: "transparent", fontSize: "13px", color: "#DC2626",
                                    cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif",
                                  }}>
                                    <Trash2 size={13} color="#DC2626" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => { setDefaultStage(stage.id); setFormStage(stage.id); setNewContentOpen(true); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                        padding: "8px", background: "transparent",
                        border: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                        borderRadius: "8px", fontSize: "12px", color: "#9CA3AF",
                        cursor: "pointer", width: "100%",
                      }}>
                      <Plus size={11} /> Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* CALENDAR VIEW */
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button onClick={() => {
                  if (calMode === "week") setWeekOffset(p => p - 1);
                  else { const d = new Date(calMonthDate); d.setMonth(d.getMonth() - 1); setCalMonthDate(d); }
                }} style={{ background: "transparent", border: "none", cursor: "pointer", color: isDark ? "#F2F2F2" : "#374151", padding: "4px" }}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: "14px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>
                  {calMode === "week" ? weekLabel : calMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => {
                  if (calMode === "week") setWeekOffset(p => p + 1);
                  else { const d = new Date(calMonthDate); d.setMonth(d.getMonth() + 1); setCalMonthDate(d); }
                }} style={{ background: "transparent", border: "none", cursor: "pointer", color: isDark ? "#F2F2F2" : "#374151", padding: "4px" }}>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {(["week", "month"] as const).map(m => (
                  <button key={m} onClick={() => setCalMode(m)} style={{
                    padding: "4px 10px", borderRadius: "6px", fontSize: "11px",
                    fontWeight: calMode === m ? 600 : 400,
                    background: calMode === m ? (isDark ? "#252528" : "#F3F4F6") : "transparent",
                    color: calMode === m ? (isDark ? "#F2F2F2" : "#111827") : "#9CA3AF",
                    border: "none", cursor: "pointer", textTransform: "capitalize", fontFamily: "Inter, sans-serif",
                  }}>{m}</button>
                ))}
              </div>
            </div>

            {calMode === "week" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", minHeight: "400px" }}>
                {weekDates.map((date, i) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const dayItems = contentItems.filter(c => c.due_date && new Date(c.due_date).toDateString() === date.toDateString());
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <div key={i} style={{
                      background: isDark ? (isToday ? "rgba(16,185,129,0.08)" : "#252528") : (isToday ? "#F0FDF4" : "#F9FAFB"),
                      border: `1px solid ${isDark ? (isToday ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)") : (isToday ? "#BBF7D0" : "#F3F4F6")}`,
                      borderRadius: "10px", padding: "10px", minHeight: "300px",
                    }}>
                      <div style={{ textAlign: "center", marginBottom: "10px", paddingBottom: "8px", borderBottom: `1px solid ${isDark ? (isToday ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)") : (isToday ? "#BBF7D0" : "#F3F4F6")}` }}>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Inter, sans-serif", margin: 0 }}>
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p style={{ fontSize: "18px", fontWeight: isToday ? 800 : 500, color: isToday ? "#10B981" : (isDark ? "#F2F2F2" : "#111827"), fontFamily: "Inter, sans-serif", margin: "2px 0 0" }}>
                          {date.getDate()}
                        </p>
                      </div>
                      {dayItems.map(item => (
                        <div key={item.id} onClick={() => setDetailCard(item)} style={{
                          padding: "6px 8px", borderRadius: "6px", marginBottom: "5px", cursor: "pointer",
                          background: item.platform === "Instagram" ? "#FDF2F8" : item.platform === "YouTube" ? "#FEF2F2" : item.platform === "TikTok" ? "#F0FDF4" : item.platform === "Twitter" ? "#EFF6FF" : "#F5F3FF",
                          borderLeft: "3px solid",
                          borderColor: item.platform === "Instagram" ? "#BE185D" : item.platform === "YouTube" ? "#DC2626" : item.platform === "TikTok" ? "#065F46" : item.platform === "Twitter" ? "#1D4ED8" : "#7B5EA7",
                        }}>
                          <p style={{ fontSize: "11px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 0 2px" }}>
                            {item.title}
                          </p>
                          {item.platform && (
                            <p style={{ fontSize: "10px", color: "#9CA3AF", fontFamily: "Inter, sans-serif", margin: 0 }}>
                              {item.platform}{item.content_type ? ` · ${item.content_type}` : ""}
                            </p>
                          )}
                        </div>
                      ))}
                      <button onClick={() => { setFormDueDate(dateStr); setFormStage("idea"); setNewContentOpen(true); }}
                        style={{
                          width: "100%", padding: "5px", background: "transparent",
                          border: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                          borderRadius: "6px", fontSize: "11px", color: "#D1D5DB",
                          cursor: "pointer", fontFamily: "Inter, sans-serif", marginTop: "4px",
                        }}>+ Add</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MONTH VIEW */
              (() => {
                const firstDay = new Date(calMonthDate.getFullYear(), calMonthDate.getMonth(), 1);
                const lastDay = new Date(calMonthDate.getFullYear(), calMonthDate.getMonth() + 1, 0);
                const startOffset = firstDay.getDay();
                const totalCells = startOffset + lastDay.getDate();
                const rows = Math.ceil(totalCells / 7);
                const calDays = Array.from({ length: rows * 7 }, (_, i) => {
                  const dayNum = i - startOffset + 1;
                  if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
                  return new Date(calMonthDate.getFullYear(), calMonthDate.getMonth(), dayNum);
                });

                return (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "4px" }}>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                        <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: "#9CA3AF", padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Inter, sans-serif" }}>
                          {d}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                      {calDays.map((day, i) => {
                        if (!day) return (
                          <div key={i} style={{ minHeight: "80px", background: isDark ? "rgba(255,255,255,0.02)" : "#FAFAFA", borderRadius: "6px", opacity: 0.3 }} />
                        );
                        const isToday = day.toDateString() === new Date().toDateString();
                        const dayItems = contentItems.filter(item => item.due_date && new Date(item.due_date).toDateString() === day.toDateString());
                        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                        return (
                          <div key={i} style={{
                            minHeight: "80px",
                            background: isDark ? (isToday ? "rgba(16,185,129,0.08)" : "#1C1C1E") : (isToday ? "#F0FDF4" : "white"),
                            border: `1px solid ${isDark ? (isToday ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)") : (isToday ? "#BBF7D0" : "#F3F4F6")}`,
                            borderRadius: "6px", padding: "6px",
                          }}>
                            <div style={{ textAlign: "right", marginBottom: "4px" }}>
                              <span style={{
                                fontSize: "12px", fontWeight: isToday ? 800 : 400,
                                color: isToday ? "#10B981" : (isDark ? "#F2F2F2" : "#374151"),
                                fontFamily: "Inter, sans-serif",
                                width: "22px", height: "22px", display: "inline-flex", alignItems: "center", justifyContent: "center",
                                borderRadius: "50%", background: isToday ? "rgba(16,185,129,0.15)" : "transparent",
                              }}>
                                {day.getDate()}
                              </span>
                            </div>
                            {dayItems.slice(0, 2).map(item => (
                              <div key={item.id} onClick={() => setDetailCard(item)} style={{
                                padding: "2px 5px", borderRadius: "4px", marginBottom: "2px", cursor: "pointer",
                                fontSize: "10px", fontWeight: 500, fontFamily: "Inter, sans-serif",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                background: item.platform === "Instagram" ? "#FDF2F8" : item.platform === "YouTube" ? "#FEF2F2" : item.platform === "TikTok" ? "#F0FDF4" : item.platform === "Twitter" ? "#EFF6FF" : "#F5F3FF",
                                color: item.platform === "Instagram" ? "#BE185D" : item.platform === "YouTube" ? "#DC2626" : item.platform === "TikTok" ? "#065F46" : item.platform === "Twitter" ? "#1D4ED8" : "#7B5EA7",
                              }}>
                                {item.title}
                              </div>
                            ))}
                            {dayItems.length > 2 && (
                              <div style={{ fontSize: "10px", color: "#9CA3AF", fontFamily: "Inter, sans-serif", paddingLeft: "4px" }}>
                                +{dayItems.length - 2} more
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* ===== IDEAS BANK ===== */}
      <div style={{
        background: isDark ? "#1C1C1E" : "white",
        borderRadius: "12px",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
        padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Lightbulb size={14} color="#F59E0B" />
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: 0, fontFamily: "Inter, sans-serif" }}>
            Ideas Bank
          </h3>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input
            value={newIdea}
            onChange={e => setNewIdea(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addIdea()}
            placeholder="Drop an idea..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={addIdea} style={{
            padding: "8px 14px", background: isDark ? "#252528" : "#111827",
            color: isDark ? "#F2F2F2" : "white", border: "none", borderRadius: "8px",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>+</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {ideas.map(idea => (
            <div key={idea.id} className="group" style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 12px", margin: "0 -12px",
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F5F5F5"}`,
              cursor: "default",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = isDark ? "#252528" : "#FAFAFA"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <span style={{ flex: 1, fontSize: "13px", color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>
                {idea.text}
              </span>
              {idea.contentType && <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{idea.contentType}</span>}
              {idea.targetDate && <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{idea.targetDate}</span>}
              <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{idea.date}</span>
              <button onClick={() => moveIdeaToPipeline(idea)}
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "4px 10px", background: "transparent",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  borderRadius: "6px", fontSize: "11px", fontWeight: 500,
                  color: "#10B981", cursor: "pointer",
                  opacity: 0, transition: "opacity 150ms",
                }}
                className="group-hover:!opacity-100"
              >
                <ArrowRight size={10} /> Pipeline
              </button>
              <button onClick={() => setIdeas(prev => prev.filter(i => i.id !== idea.id))}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "#9CA3AF", padding: "2px", opacity: 0, transition: "opacity 150ms",
                }}
                className="group-hover:!opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {ideas.length === 0 && (
            <p style={{ fontSize: "13px", color: "#9CA3AF", textAlign: "center", padding: "20px 0", fontStyle: "italic" }}>
              No ideas yet. Drop one above!
            </p>
          )}
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* New Content Modal */}
      {newContentOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setNewContentOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "480px", margin: "0 16px",
            background: isDark ? "#1C1C1E" : "white", borderRadius: "14px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
            maxHeight: "85vh", overflow: "auto",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>
                New Content
              </h3>
              <button onClick={() => setNewContentOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Morning routine BTS" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Platform</label>
                <select value={formPlatform} onChange={e => setFormPlatform(e.target.value)}
                  style={inputStyle as any}>
                  <option value="">Select platform</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Content Type</label>
                <select value={formType} onChange={e => setFormType(e.target.value)}
                  style={inputStyle as any}>
                  <option value="">Select type</option>
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Stage</label>
                <select value={formStage} onChange={e => setFormStage(e.target.value)}
                  style={inputStyle as any}>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Due Date</label>
                <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Caption Notes</label>
                <textarea value={formCaption} onChange={e => setFormCaption(e.target.value)}
                  placeholder="Optional notes..." rows={3}
                  style={{ ...inputStyle, resize: "vertical" } as any} />
              </div>
              <button onClick={handleCreateContent} disabled={!formTitle.trim()}
                style={{
                  width: "100%", padding: "10px", background: formTitle.trim() ? "#10B981" : "#D1D5DB",
                  color: "white", border: "none", borderRadius: "8px", fontSize: "14px",
                  fontWeight: 600, cursor: formTitle.trim() ? "pointer" : "not-allowed",
                  fontFamily: "Inter, sans-serif",
                }}>
                Create Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Detail Modal */}
      {detailCard && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setDetailCard(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "640px", margin: "0 16px",
            background: isDark ? "#1C1C1E" : "white", borderRadius: "14px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
            maxHeight: "85vh", overflow: "auto",
          }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
            }}>
              <input
                value={detailCard.title}
                onChange={e => updateDetailField("title", e.target.value)}
                style={{
                  fontSize: "16px", fontWeight: 700, border: "none", outline: "none",
                  background: "transparent", color: isDark ? "#F2F2F2" : "#111827",
                  flex: 1, fontFamily: "Inter, sans-serif",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <select
                  value={detailCard.stage}
                  onChange={e => {
                    updateDetailField("stage", e.target.value);
                    setContentItems(prev => prev.map(c => c.id === detailCard.id ? { ...c, stage: e.target.value } : c));
                  }}
                  style={{
                    padding: "4px 8px", fontSize: "12px", borderRadius: "6px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    background: isDark ? "#252528" : "white",
                    color: isDark ? "#F2F2F2" : "#374151", outline: "none",
                  }}>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button onClick={() => setDetailCard(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Meta row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>Platform</label>
                  <select value={detailCard.platform || ""} onChange={e => updateDetailField("platform", e.target.value)}
                    style={inputStyle as any}>
                    <option value="">None</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={detailCard.content_type || ""} onChange={e => updateDetailField("content_type", e.target.value)}
                    style={inputStyle as any}>
                    <option value="">None</option>
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" value={detailCard.due_date || ""} onChange={e => updateDetailField("due_date", e.target.value)}
                    style={inputStyle} />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label style={labelStyle}>Caption / Script Notes</label>
                <textarea
                  value={detailCard.caption_notes || ""}
                  onChange={e => updateDetailField("caption_notes", e.target.value)}
                  placeholder="Write your caption or script notes..."
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" } as any}
                />
              </div>

              {/* Comments */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ ...labelStyle, margin: 0 }}>Comments</span>
                  {detailComments.length > 0 && (
                    <span style={{
                      padding: "1px 8px", borderRadius: "999px", fontSize: "10px",
                      background: isDark ? "#252528" : "#F3F4F6", color: "#9CA3AF",
                    }}>{detailComments.length}</span>
                  )}
                </div>

                {detailComments.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                    {detailComments.map((c: any) => (
                      <div key={c.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: "#F5F3FF", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: "11px", fontWeight: 700,
                          color: "#7B5EA7", flexShrink: 0,
                        }}>U</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "12px", color: isDark ? "#F2F2F2" : "#374151", margin: "0 0 2px", lineHeight: 1.4 }}>
                            {c.comment}
                          </p>
                          <span style={{ fontSize: "10px", color: "#9CA3AF" }}>
                            {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        {c.user_id === user?.id && (
                          <button onClick={async () => {
                            await supabase.from("content_comments").delete().eq("id", c.id);
                            setDetailComments(prev => prev.filter(x => x.id !== c.id));
                          }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#D1D5DB", padding: "2px" }}>
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic", marginBottom: "10px" }}>No comments yet</p>
                )}

                {/* Add comment */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddComment()}
                    placeholder="Add a comment..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button onClick={handleAddComment} style={{
                    padding: "8px 12px", background: "#10B981", color: "white",
                    border: "none", borderRadius: "8px", cursor: "pointer",
                  }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={async () => {
                  await supabase.from("content_items").delete().eq("id", detailCard.id);
                  setContentItems(prev => prev.filter(c => c.id !== detailCard.id));
                  setDetailCard(null);
                  toast.success("Content deleted");
                }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "8px", background: "transparent",
                  border: `1px solid ${isDark ? "rgba(220,38,38,0.3)" : "#FECACA"}`,
                  borderRadius: "8px", fontSize: "12px", color: "#EF4444",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>
                <Trash2 size={12} /> Delete Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Editor Modal */}
      {inviteOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setInviteOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "400px", margin: "0 16px",
            background: isDark ? "#1C1C1E" : "white", borderRadius: "14px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>
                Invite a Collaborator
              </h3>
              <button onClick={() => setInviteOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "20px" }}>
              {!inviteSent ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>
                    They'll see your content pipeline and can move cards and leave comments.
                  </p>
                  <input
                    type="email" value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="editor@email.com"
                    style={inputStyle}
                  />
                  <div style={{
                    padding: "10px 12px", borderRadius: "8px",
                    background: isDark ? "#252528" : "#F9FAFB",
                    fontSize: "12px", color: "#6B7280", lineHeight: 1.5,
                  }}>
                    <p style={{ margin: "0 0 4px" }}>✅ They will see: Content Pipeline, Ideas Bank, Calendar</p>
                    <p style={{ margin: 0 }}>🔒 They will NOT see: Money, Contacts, or personal data</p>
                  </div>
                  <button onClick={handleSendInvite} disabled={!inviteEmail.trim()}
                    style={{
                      width: "100%", padding: "10px", background: inviteEmail.trim() ? "#10B981" : "#D1D5DB",
                      color: "white", border: "none", borderRadius: "8px", fontSize: "14px",
                      fontWeight: 600, cursor: inviteEmail.trim() ? "pointer" : "not-allowed",
                    }}>
                    Send Invite
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    background: "#F0FDF4", display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto 12px",
                  }}>
                    <span style={{ fontSize: "24px" }}>✓</span>
                  </div>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", marginBottom: "4px" }}>
                    Invite sent to {inviteEmail}
                  </p>
                  <p style={{ fontSize: "13px", color: "#9CA3AF" }}>
                    They'll receive an email with a link to join your studio.
                  </p>
                </div>
              )}

              {/* Pending invites */}
              {invites.length > 0 && (
                <div style={{ marginTop: "16px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`, paddingTop: "12px" }}>
                  <p style={{ ...labelStyle, marginBottom: "8px" }}>Sent Invites</p>
                  {invites.map(inv => (
                    <div key={inv.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F5F5F5"}`,
                    }}>
                      <span style={{ fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151" }}>{inv.invitee_email}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 500,
                          background: inv.status === "accepted" ? "#F0FDF4" : "#FFFBEB",
                          color: inv.status === "accepted" ? "#10B981" : "#F59E0B",
                        }}>{inv.status === "accepted" ? "Accepted" : "Pending"}</span>
                        <button
                          onClick={async () => {
                            await supabase.from("studio_invites").delete().eq("id", inv.id);
                            setInvites(prev => prev.filter(i => i.id !== inv.id));
                            toast.success("Invite revoked");
                          }}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#D1D5DB", fontSize: "11px" }}>
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
