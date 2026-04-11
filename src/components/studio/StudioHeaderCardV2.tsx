import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield, Hash, FileText, Award,
  Plus, Target, X, Trash2, Pencil,
  ChevronRight, Upload, MoreHorizontal,
  ImagePlus,
} from "lucide-react";

const DOC_ITEMS = [
  { key: "ein_number", label: "EIN", Icon: Hash, color: "#10B981", isText: true },
  { key: "llc_document", label: "LLC Document", Icon: Shield, color: "#7B5EA7" },
  { key: "pitch_deck", label: "Pitch Deck", Icon: FileText, color: "#F59E0B" },
  { key: "business_license", label: "Business License", Icon: Award, color: "#3B82F6" },
];

const GOAL_CATEGORIES = ["Followers","Revenue","Content","Brand Deal","Other"];
const TABS = ["Overview","HQ","Platforms","Deals","Revenue"];

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function StudioHeaderCardV2({ activeTab, onTabChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isDark = document.documentElement.classList.contains("dark");
  const isMobile = window.innerWidth < 768;

  const [studioName, setStudioName] = useState("");
  const [studioHandle, setStudioHandle] = useState("");
  const [studioDocs, setStudioDocs] = useState<any>({});
  const [studioGoals, setStudioGoals] = useState<any[]>([]);
  const [studioImages, setStudioImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [studioStats, setStudioStats] = useState<any>({});
  const [editingStat, setEditingStat] = useState<string | null>(null);
  const [formProfile, setFormProfile] = useState<any>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [einModalOpen, setEinModalOpen] = useState(false);
  const [einValue, setEinValue] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalCategory, setGoalCategory] = useState("Other");
  const imgRef = useRef<HTMLInputElement>(null);

  const border = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const bg = isDark ? "#1C1C1E" : "#ffffff";
  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.45)" : "#6B7280";
  const inputBg = isDark ? "#252528" : "#ffffff";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("studio_profile").select("*")
        .eq("user_id", user.id).maybeSingle();
      if (p) {
        setStudioName((p as any).studio_name || "");
        setStudioHandle((p as any).handle || "");
        setStudioDocs({
          llc_document: (p as any).llc_document,
          ein_number: (p as any).ein_number,
          pitch_deck: (p as any).pitch_deck,
          business_license: (p as any).business_license,
        });
        setFormProfile(p);
        if (Array.isArray((p as any).images)) setStudioImages((p as any).images);
        const ig = Number((p as any).instagram_followers) || 0;
        const yt = Number((p as any).youtube_subscribers) || 0;
        const tt = Number((p as any).tiktok_followers) || 0;
        const tw = Number((p as any).twitter_followers) || 0;
        const sub = Number((p as any).substack_subscriber_count) || 0;
        const manual = Number((p as any).combined_followers) || 0;
        const calc = ig + yt + tt + tw + sub;
        setStudioStats({
          combined_followers: manual > 0 ? manual : (calc || undefined),
          reach_30d: (p as any).reach_30d || undefined,
          interactions_30d: (p as any).interactions_30d || undefined,
          avg_engagement: (p as any).avg_engagement || undefined,
        });
      }
      const { data: goals } = await supabase
        .from("studio_goals").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: true });
      if (goals) setStudioGoals(goals);
    })();
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;
    const h = () => setMenuOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  useEffect(() => {
    if (studioImages.length <= 1) return;
    const t = setInterval(() => setCurrentImageIndex(p => (p + 1) % studioImages.length), 4000);
    return () => clearInterval(t);
  }, [studioImages.length]);

  const upsertProfile = async (data: any) => {
    return supabase.from("studio_profile")
      .upsert({ user_id: user!.id, ...data } as any, { onConflict: "user_id" });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/studio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("user-assets").upload(path, file, { upsert: true });
      if (error) { toast.error("Upload failed: " + error.message); continue; }
      const { data: u } = supabase.storage.from("user-assets").getPublicUrl(path);
      if (u?.publicUrl) newUrls.push(u.publicUrl);
    }
    setUploading(false);
    if (!newUrls.length) return;
    const updated = [...studioImages, ...newUrls];
    const { error: dbErr } = await upsertProfile({ images: updated });
    if (dbErr) { toast.error("Photo not saved to DB: " + dbErr.message); return; }
    setStudioImages(updated);
    setCurrentImageIndex(updated.length - 1);
    toast.success(newUrls.length + " photo" + (newUrls.length > 1 ? "s" : "") + " uploaded!");
  };

  const handleRemoveImage = async (idx: number) => {
    if (!user) return;
    const updated = studioImages.filter((_, i) => i !== idx);
    const { error } = await upsertProfile({ images: updated });
    if (error) { toast.error("Remove failed"); return; }
    setStudioImages(updated);
    setCurrentImageIndex(Math.max(0, Math.min(idx, updated.length - 1)));
    toast.success("Photo removed");
  };

  const handleDocAction = async (doc: typeof DOC_ITEMS[number]) => {
    if (!user) return;
    const val = studioDocs[doc.key];
    if (val) {
      if (doc.isText) { navigator.clipboard.writeText(val); toast.success("Copied"); }
      else window.open(val, "_blank");
      return;
    }
    if (doc.isText) { setEinValue(""); setEinModalOpen(true); return; }
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".pdf,.doc,.docx,.pptx";
    input.onchange = async (ev: any) => {
      const file = ev.target?.files?.[0]; if (!file) return;
      const path = `${user.id}/docs/${doc.key}-${Date.now()}`;
      const { error } = await supabase.storage.from("user-assets").upload(path, file, { upsert: true });
      if (error) { toast.error("Upload failed"); return; }
      const { data: u } = supabase.storage.from("user-assets").getPublicUrl(path);
      await upsertProfile({ [doc.key]: u.publicUrl });
      setStudioDocs((p: any) => ({ ...p, [doc.key]: u.publicUrl }));
      toast.success(doc.label + " uploaded!");
    };
    input.click();
  };

  const handleSaveEin = async () => {
    if (!user || !einValue.trim()) return;
    await upsertProfile({ ein_number: einValue.trim() });
    setStudioDocs((p: any) => ({ ...p, ein_number: einValue.trim() }));
    setEinModalOpen(false); toast.success("EIN saved!");
  };

  const extractHandle = (url: string): string => {
    if (!url || !url.startsWith("http")) return url || "";
    try {
      const u = new URL(url);
      return u.pathname.replace(/^\//, "").replace(/^@/, "").split("/")[0].split("?")[0] || "";
    } catch { return url; }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    const igHandle = formProfile.instagram_url?.includes("instagram.com")
      ? extractHandle(formProfile.instagram_url)
      : formProfile.instagram_handle || "";
    const ttHandle = formProfile.tiktok_url?.includes("tiktok.com")
      ? extractHandle(formProfile.tiktok_url)
      : formProfile.tiktok_handle || "";
    const twHandle = (formProfile.twitter_url?.includes("twitter.com") || formProfile.twitter_url?.includes("x.com"))
      ? extractHandle(formProfile.twitter_url)
      : formProfile.twitter_handle || "";
    const { error } = await upsertProfile({
      studio_name: formProfile.studio_name || null,
      handle: formProfile.handle || null,
      description: formProfile.description || null,
      instagram_handle: igHandle || null,
      instagram_followers: Number(formProfile.instagram_followers) || null,
      instagram_url: formProfile.instagram_url || null,
      youtube_url: formProfile.youtube_url || null,
      youtube_subscribers: Number(formProfile.youtube_subscribers) || null,
      tiktok_handle: ttHandle || null,
      tiktok_followers: Number(formProfile.tiktok_followers) || null,
      tiktok_url: formProfile.tiktok_url || null,
      twitter_handle: twHandle || null,
      twitter_followers: Number(formProfile.twitter_followers) || null,
      twitter_url: formProfile.twitter_url || null,
      linkedin_url: formProfile.linkedin_url || null,
      substack_url: formProfile.substack_url || null,
      substack_subscriber_count: Number(formProfile.substack_subscriber_count) || null,
      podcast_name: formProfile.podcast_name || null,
      podcast_url: formProfile.podcast_url || null,
    });
    if (error) { toast.error("Save failed: " + error.message); return; }
    setStudioName(formProfile.studio_name || "");
    setStudioHandle(formProfile.handle || "");
    setSettingsOpen(false);
    toast.success("Saved!");
    queryClient.invalidateQueries({ queryKey: ["studio_profile_overview"] });
    const calc = (Number(formProfile.instagram_followers) || 0) + (Number(formProfile.youtube_subscribers) || 0) + (Number(formProfile.tiktok_followers) || 0) + (Number(formProfile.twitter_followers) || 0) + (Number(formProfile.substack_subscriber_count) || 0);
    if (calc > 0) setStudioStats((p: any) => ({ ...p, combined_followers: calc }));
  };

  const handleAddGoal = async () => {
    if (!user || !goalTitle.trim()) return;
    const { data, error } = await supabase.from("studio_goals").insert({ user_id: user.id, title: goalTitle.trim(), progress: goalProgress, deadline: goalDeadline || null, category: goalCategory } as any).select().single();
    if (error) { toast.error("Failed"); return; }
    setStudioGoals(p => [...p, data]);
    setGoalTitle(""); setGoalProgress(0); setGoalDeadline(""); setGoalCategory("Other");
    setAddGoalOpen(false); toast.success("Goal added!");
  };

  const handleStatSave = async (key: string, val: number) => {
    if (!user) return;
    await upsertProfile({ [key]: val });
    setStudioStats((p: any) => ({ ...p, [key]: val }));
    setEditingStat(null);
  };

  const statItems = [
    { label: "Combined Followers", key: "combined_followers", value: studioStats?.combined_followers?.toLocaleString() || "—", raw: studioStats?.combined_followers },
    { label: "30D Reach", key: "reach_30d", value: studioStats?.reach_30d?.toLocaleString() || "—", raw: studioStats?.reach_30d },
    { label: "30D Interactions", key: "interactions_30d", value: studioStats?.interactions_30d?.toLocaleString() || "—", raw: studioStats?.interactions_30d },
    { label: "Avg Engagement", key: "avg_engagement", value: studioStats?.avg_engagement ? studioStats.avg_engagement + "%" : "—", raw: studioStats?.avg_engagement },
  ];

  const inp = (key: string, placeholder: string, type = "text", prefix?: string) => (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      {prefix && <span style={{ display: "flex", alignItems: "center", padding: "0 10px", background: isDark ? "#333" : "#F3F4F6", borderRadius: "8px 0 0 8px", border: `1px solid ${inputBorder}`, borderRight: "none", fontSize: 13, color: text2 }}>{prefix}</span>}
      <input value={(formProfile as any)?.[key] || ""} type={type} onChange={e => setFormProfile((p: any) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
        style={{ flex: 1, padding: "8px 12px", fontSize: 13, border: `1px solid ${inputBorder}`, borderRadius: prefix ? "0 8px 8px 0" : "8px", outline: "none", background: inputBg, color: text1, boxSizing: "border-box" as const, minHeight: 38 }} />
    </div>
  );

  const label = (text: string) => (
    <span style={{ fontSize: 12, fontWeight: 500, color: text2, marginBottom: 2, display: "block" }}>{text}</span>
  );

  const modalWrap = (children: React.ReactNode, onClose: () => void, maxW = 500) => (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: maxW, margin: "0 16px", background: bg, borderRadius: 14, border: `1px solid ${border}`, maxHeight: "88vh", overflow: "auto" }}>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <div style={{ background: bg, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden", fontFamily: "Inter, sans-serif" }}>

        {/* TOP */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px" }}>

          {/* LEFT */}
          <div style={{ padding: isMobile ? "20px 16px" : "28px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Studio</span>
              {studioHandle && <span style={{ fontSize: 11, color: text2 }}>@{studioHandle.replace(/^@/, "")}</span>}
            </div>

            {studioName
              ? <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: text1, margin: "0 0 16px", lineHeight: 1.2 }}>{studioName}</h2>
              : <button onClick={() => setSettingsOpen(true)} style={{ fontSize: 22, fontWeight: 600, color: isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><Plus size={18} /> Add studio name</button>
            }

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginBottom: 20 }}>
              {DOC_ITEMS.map(doc => {
                const val = studioDocs[doc.key];
                return (
                  <div key={doc.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <doc.Icon size={14} color={doc.color} />
                    <button onClick={() => handleDocAction(doc)} style={{ background: "transparent", border: "none", padding: 0, fontSize: 13, color: val ? (isDark ? "rgba(255,255,255,0.5)" : "#374151") : (isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB"), cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      {val ? (doc.isText ? val : `${doc.label} →`) : `+ Add ${doc.label}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {[
                { label: "Edit Studio", dark: true, onClick: () => { setFormProfile((p: any) => ({ studio_name: studioName, handle: studioHandle, ...p })); setSettingsOpen(true); } },
                { label: "Preview", onClick: () => { if (!studioName) { toast("Add your studio name first"); return; } setPreviewOpen(true); } },
                { label: "Share", onClick: () => { const url = `${window.location.origin}/studio/${user?.id}`; if (navigator.share) navigator.share({ title: studioName, url }).catch(() => {}); else { navigator.clipboard.writeText(url); toast("Link copied!"); } } },
              ].map(b => (
                <button key={b.label} onClick={b.onClick} style={{ padding: "8px 18px", borderRadius: 8, border: (b as any).dark ? "none" : `1px solid ${border}`, background: (b as any).dark ? "#111827" : "transparent", color: (b as any).dark ? "white" : text1, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6, minHeight: 44 }}>
                  {(b as any).dark && <Pencil size={13} />}{b.label}
                </button>
              ))}
              <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ padding: 9, background: "transparent", border: `1px solid ${border}`, borderRadius: 8, cursor: "pointer", color: text2, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 44 }}>
                  <MoreHorizontal size={18} />
                </button>
                {menuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 4, minWidth: 180, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                    {[
                      { label: "Edit Studio", Icon: Pencil, action: () => { setSettingsOpen(true); setMenuOpen(false); } },
                      { label: "Add Photos", Icon: ImagePlus, action: () => { imgRef.current?.click(); setMenuOpen(false); } },
                      { label: "Add Goal", Icon: Target, action: () => { setAddGoalOpen(true); setMenuOpen(false); } },
                      { label: "Remove All Photos", Icon: Trash2, color: "#DC2626", action: async () => { setStudioImages([]); await upsertProfile({ images: [] }); toast("Photos removed"); setMenuOpen(false); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: item.color || text1, fontFamily: "Inter, sans-serif", borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                        <item.Icon size={15} />{item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Photos */}
          <div style={{ borderLeft: isMobile ? "none" : `1px solid ${border}`, borderTop: isMobile ? `1px solid ${border}` : "none", background: isDark ? "#252528" : "#F9FAFB", minHeight: isMobile ? 200 : 260, position: "relative" }}>
            {uploading ? (
              <div style={{ width: "100%", height: "100%", minHeight: isMobile ? 200 : 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, border: "3px solid #10B981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 13, color: text2 }}>Uploading...</span>
              </div>
            ) : studioImages.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ position: "relative", flex: 1, minHeight: isMobile ? 180 : 220 }}>
                  <img src={studioImages[currentImageIndex]} alt="Studio" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <button onClick={() => handleRemoveImage(currentImageIndex)} style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, zIndex: 10 }}>×</button>
                  <button onClick={() => imgRef.current?.click()} style={{ position: "absolute", bottom: 10, right: 10, padding: "5px 12px", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, color: "white", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 4, zIndex: 10 }}>
                    <Plus size={12} /> Add Photo
                  </button>
                  {studioImages.length > 1 && <div style={{ position: "absolute", bottom: 10, left: 10, padding: "3px 10px", background: "rgba(0,0,0,0.55)", borderRadius: 6, color: "white", fontSize: 11, fontWeight: 500 }}>{currentImageIndex + 1} / {studioImages.length}</div>}
                </div>
                {studioImages.length > 1 && (
                  <div style={{ display: "flex", gap: 6, padding: "8px 12px", overflowX: "auto" }}>
                    {studioImages.slice(0, 10).map((img, idx) => (
                      <button key={idx} onClick={() => setCurrentImageIndex(idx)} style={{ width: 38, height: 38, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: currentImageIndex === idx ? "2px solid #10B981" : "2px solid transparent", cursor: "pointer", padding: 0, background: "none" }}>
                        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div onClick={() => imgRef.current?.click()} style={{ width: "100%", height: "100%", minHeight: isMobile ? 200 : 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: isDark ? "rgba(16,185,129,0.1)" : "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImagePlus size={22} color="#10B981" />
                </div>
                <span style={{ fontSize: 13, color: text2 }}>Add a studio photo or logo</span>
              </div>
            )}
            <input ref={imgRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", borderTop: `1px solid ${border}` }}>
          {statItems.map((stat, i) => (
            <div key={stat.key} onClick={() => setEditingStat(stat.key)} style={{ padding: isMobile ? "12px 14px" : "16px 24px", borderRight: isMobile ? (i % 2 === 0 ? `1px solid ${border}` : "none") : (i < 3 ? `1px solid ${border}` : "none"), borderBottom: isMobile && i < 2 ? `1px solid ${border}` : "none", cursor: "pointer" }}>
              <div style={{ fontSize: 11, color: text2, marginBottom: 4 }}>{stat.label}</div>
              {editingStat === stat.key
                ? <input autoFocus type="number" defaultValue={stat.raw || ""} onBlur={e => handleStatSave(stat.key, parseInt(e.target.value) || 0)} onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingStat(null); }} onClick={e => e.stopPropagation()} style={{ fontSize: 20, fontWeight: 700, border: "none", borderBottom: "2px solid #10B981", outline: "none", background: "transparent", width: 120, fontFamily: "Inter, sans-serif", color: text1 }} />
                : <div style={{ fontSize: 20, fontWeight: 700, color: text1 }}>{stat.value}</div>
              }
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", borderTop: `1px solid ${border}`, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => onTabChange(tab.toLowerCase())} style={{ padding: isMobile ? "12px 16px" : "14px 24px", background: "transparent", border: "none", borderBottom: activeTab === tab.toLowerCase() ? "2px solid #10B981" : "2px solid transparent", fontSize: isMobile ? 13 : 14, fontWeight: activeTab === tab.toLowerCase() ? 600 : 400, color: activeTab === tab.toLowerCase() ? "#10B981" : text2, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" as const, transition: "all 150ms", flexShrink: 0 }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* SETTINGS MODAL */}
      {settingsOpen && modalWrap(
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: `1px solid ${border}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: text1, margin: 0 }}>Studio Settings</h3>
            <button onClick={() => setSettingsOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={18} /></button>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>{label("Studio / Brand Name")}{inp("studio_name", "e.g. Chloe Creates")}</div>
            <div>{label("Handle")}{inp("handle", "yourhandle", "text", "@")}</div>
            <div>{label("Description")}<textarea value={(formProfile as any)?.description || ""} onChange={e => setFormProfile((p: any) => ({ ...p, description: e.target.value }))} placeholder="What your studio is about..." rows={3} style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${inputBorder}`, borderRadius: 8, resize: "vertical" as const, outline: "none", background: inputBg, color: text1, fontFamily: "inherit", boxSizing: "border-box" as const }} /></div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "4px 0 0" }}>Instagram</p>
            <div>{label("Instagram Profile URL")}{inp("instagram_url", "https://instagram.com/yourhandle")}</div>
            <div>{label("Followers")}{inp("instagram_followers", "e.g. 12500", "number")}</div>

            <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "4px 0 0" }}>YouTube</p>
            <div>{label("YouTube Channel URL")}{inp("youtube_url", "https://youtube.com/@channel")}</div>
            <div>{label("Subscribers")}{inp("youtube_subscribers", "e.g. 5000", "number")}</div>

            <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "4px 0 0" }}>TikTok</p>
            <div>{label("TikTok Profile URL")}{inp("tiktok_url", "https://tiktok.com/@yourhandle")}</div>
            <div>{label("Followers")}{inp("tiktok_followers", "e.g. 8000", "number")}</div>

            <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "4px 0 0" }}>Twitter / X</p>
            <div>{label("Twitter / X Profile URL")}{inp("twitter_url", "https://twitter.com/yourhandle")}</div>
            <div>{label("Followers")}{inp("twitter_followers", "e.g. 3200", "number")}</div>

            <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "4px 0 0" }}>LinkedIn</p>
            <div>{label("LinkedIn Profile URL")}{inp("linkedin_url", "https://linkedin.com/in/...")}</div>

            <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "4px 0 0" }}>Substack</p>
            <div>{label("Substack URL")}{inp("substack_url", "https://yourname.substack.com")}</div>
            <div>{label("Subscribers")}{inp("substack_subscriber_count", "e.g. 1200", "number")}</div>

            <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "4px 0 0" }}>Podcast</p>
            <div>{label("Podcast Name")}{inp("podcast_name", "The Daily Hustle")}</div>
            <div>{label("Podcast URL")}{inp("podcast_url", "https://...")}</div>

            <button onClick={handleSaveSettings} style={{ marginTop: 8, padding: "12px 0", width: "100%", background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Save Settings</button>
            <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center" as const, margin: "6px 0 0" }}>Paste your profile URL — handles are extracted automatically when you save.</p>
          </div>
        </>,
        () => setSettingsOpen(false)
      )}

      {/* ADD GOAL MODAL */}
      {addGoalOpen && modalWrap(
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: `1px solid ${border}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: text1, margin: 0 }}>Add Studio Goal</h3>
            <button onClick={() => setAddGoalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={18} /></button>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>{label("Goal Title *")}<input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g. Reach 50K followers" style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${inputBorder}`, borderRadius: 8, outline: "none", background: inputBg, color: text1, boxSizing: "border-box" as const }} /></div>
            <div>{label(`Progress: ${goalProgress}%`)}<input type="range" min={0} max={100} value={goalProgress} onChange={e => setGoalProgress(Number(e.target.value))} style={{ width: "100%", accentColor: "#10B981" }} /></div>
            <div>{label("Deadline (optional)")}<input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${inputBorder}`, borderRadius: 8, outline: "none", background: inputBg, color: text1, boxSizing: "border-box" as const }} /></div>
            <div>{label("Category")}<select value={goalCategory} onChange={e => setGoalCategory(e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${inputBorder}`, borderRadius: 8, outline: "none", background: inputBg, color: text1, boxSizing: "border-box" as const }}>{GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <button onClick={handleAddGoal} style={{ marginTop: 4, padding: "12px 0", width: "100%", background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Add Goal</button>
          </div>
        </>,
        () => setAddGoalOpen(false), 420
      )}

      {/* EIN MODAL */}
      {einModalOpen && modalWrap(
        <div style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: text1, marginBottom: 14 }}>Enter your EIN Number</h3>
          <input value={einValue} onChange={e => setEinValue(e.target.value)} placeholder="XX-XXXXXXX" style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${inputBorder}`, borderRadius: 8, outline: "none", background: inputBg, color: text1, marginBottom: 14, boxSizing: "border-box" as const }} />
          <button onClick={handleSaveEin} style={{ padding: "10px 0", width: "100%", background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Save</button>
        </div>,
        () => setEinModalOpen(false), 360
      )}

      {/* PREVIEW MODAL */}
      {previewOpen && modalWrap(
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: `1px solid ${border}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: text1, margin: 0 }}>Studio Preview</h3>
            <button onClick={() => setPreviewOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={18} /></button>
          </div>
          <div style={{ padding: 24, textAlign: "center" as const }}>
            {studioImages[0] && <img src={studioImages[0]} alt="" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px" }} />}
            <h2 style={{ fontSize: 22, fontWeight: 700, color: text1, margin: "0 0 4px" }}>{studioName || "Your Studio"}</h2>
            {studioHandle && <p style={{ fontSize: 13, color: text2, margin: "0 0 16px" }}>@{studioHandle}</p>}
            {studioGoals.length > 0 && studioGoals.map((g: any) => (
              <div key={g.id} style={{ textAlign: "left" as const, padding: "10px 0", borderTop: `1px solid ${border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: text1, fontWeight: 500 }}>{g.title}</span>
                  <span style={{ color: "#10B981", fontWeight: 600 }}>{g.progress}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: "#10B981", width: `${g.progress}%`, transition: "width 300ms" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setPreviewOpen(false)} style={{ padding: "8px 24px", background: "#111827", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        </>,
        () => setPreviewOpen(false)
      )}
    </>
  );
}