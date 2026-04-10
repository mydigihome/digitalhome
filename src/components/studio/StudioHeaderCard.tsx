import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Shield, Hash, FileText, Award, Check,
  Plus, Target, X, Trash2, Pencil,
  ChevronRight, Upload, Maximize2, MoreHorizontal,
  ImagePlus, Share2, Eye,
} from "lucide-react";

interface StudioDoc {
  llc_document?: string | null;
  ein_number?: string | null;
  pitch_deck?: string | null;
  business_license?: string | null;
}

interface StudioGoal {
  id: string;
  title: string;
  progress: number;
  deadline: string | null;
  category: string;
}

interface StudioProfile {
  studio_name?: string | null;
  handle?: string | null;
  description?: string | null;
  instagram_handle?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
  llc_document?: string | null;
  ein_number?: string | null;
  pitch_deck?: string | null;
  business_license?: string | null;
}

interface StudioStats {
  combined_followers?: number;
  followers_change?: number;
  reach_30d?: number;
  reach_change?: number;
  interactions_30d?: number;
  interactions_change?: number;
  avg_engagement?: number;
  engagement_change?: number;
}

const DOC_ITEMS: { key: string; label: string; Icon: typeof Shield; color: string; isText?: boolean }[] = [
  { key: "ein_number", label: "EIN", Icon: Hash, color: "#10B981", isText: true },
  { key: "llc_document", label: "LLC Document", Icon: Shield, color: "#7B5EA7" },
  { key: "pitch_deck", label: "Pitch Deck", Icon: FileText, color: "#F59E0B" },
  { key: "business_license", label: "Business License", Icon: Award, color: "#3B82F6" },
];

const GOAL_CATEGORIES = ["Followers", "Revenue", "Content", "Brand Deal", "Other"];

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function StudioHeaderCard({ activeTab, onTabChange }: Props) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isDark = document.documentElement.classList.contains("dark");
  const queryClient = useQueryClient();

  const [studioName, setStudioName] = useState("");
  const [studioHandle, setStudioHandle] = useState("");
  const [studioDocs, setStudioDocs] = useState<StudioDoc>({});
  const [studioGoals, setStudioGoals] = useState<StudioGoal[]>([]);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [studioImages, setStudioImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const studioImageInputRef = useRef<HTMLInputElement>(null);
  const [studioStats, setStudioStats] = useState<StudioStats>({});
  const [editingStat, setEditingStat] = useState<string | null>(null);

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [einModalOpen, setEinModalOpen] = useState(false);
  const [einValue, setEinValue] = useState("");
  const [studioPreviewOpen, setStudioPreviewOpen] = useState(false);
  const [studioMenuOpen, setStudioMenuOpen] = useState(false);

  // Settings form
  const [formProfile, setFormProfile] = useState<StudioProfile>({});

  // Goal form
  const [goalTitle, setGoalTitle] = useState("");
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalCategory, setGoalCategory] = useState("Other");

  // Load data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("studio_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setStudioName(profile.studio_name || "");
        setStudioHandle(profile.handle || "");
        setStudioDocs({
          llc_document: profile.llc_document,
          ein_number: profile.ein_number,
          pitch_deck: profile.pitch_deck,
          business_license: profile.business_license,
        });
        setFormProfile(profile);
        if ((profile as any).images) {
          setStudioImages((profile as any).images);
        }
        // Load all platform stats into header
        const p = profile as any;
        const ig = Number(p.instagram_followers) || 0;
        const yt = Number(p.youtube_subscribers) || 0;
        const tt = Number(p.tiktok_followers) || 0;
        const tw = Number(p.twitter_followers) || 0;
        const sub = Number(p.substack_subscriber_count) || 0;
        const manualCombined = Number(p.combined_followers) || 0;
        const calculatedCombined = ig + yt + tt + tw + sub;
        const finalCombined = manualCombined > 0 ? manualCombined : calculatedCombined;
        setStudioStats({
          combined_followers: finalCombined || undefined,
          reach_30d: p.reach_30d || undefined,
          interactions_30d: p.interactions_30d || undefined,
          avg_engagement: p.avg_engagement || undefined,
          followers_change: p.followers_change || undefined,
          reach_change: p.reach_change || undefined,
          interactions_change: p.interactions_change || undefined,
          engagement_change: p.engagement_change || undefined,
        });
      }

      const { data: goals } = await supabase
        .from("studio_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (goals) setStudioGoals(goals as StudioGoal[]);
    })();
  }, [user]);

  // Auto-cycle goals
  useEffect(() => {
    if (studioGoals.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentGoalIndex(prev => (prev + 1) % studioGoals.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [studioGoals.length]);

  // Auto-rotate images
  useEffect(() => {
    if (studioImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % studioImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [studioImages.length]);

  // Close three-dots menu on outside click
  useEffect(() => {
    if (!studioMenuOpen) return;
    const handler = () => setStudioMenuOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [studioMenuOpen]);

  const handleDocAction = async (doc: typeof DOC_ITEMS[number]) => {
    if (!user) return;
    const val = studioDocs[doc.key as keyof StudioDoc];
    if (val) {
      if (doc.isText) {
        navigator.clipboard.writeText(val);
        toast.success("EIN copied to clipboard");
      } else {
        window.open(val, "_blank");
      }
      return;
    }
    if (doc.isText) {
      setEinValue("");
      setEinModalOpen(true);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.pptx";
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const filePath = `studio-docs/${user.id}/${doc.key}-${Date.now()}`;
      const { error } = await supabase.storage.from("studio-documents").upload(filePath, file);
      if (error) { toast.error("Upload failed"); return; }
      const { data: urlData } = supabase.storage.from("studio-documents").getPublicUrl(filePath);
      await supabase.from("studio_profile").upsert({
        user_id: user.id,
        [doc.key]: urlData.publicUrl,
      }, { onConflict: "user_id" });
      setStudioDocs(prev => ({ ...prev, [doc.key]: urlData.publicUrl }));
      toast.success(`${doc.label} uploaded!`);
    };
    input.click();
  };

  const handleSaveEin = async () => {
    if (!user || !einValue.trim()) return;
    await supabase.from("studio_profile").upsert({
      user_id: user.id,
      ein_number: einValue.trim(),
    }, { onConflict: "user_id" });
    setStudioDocs(prev => ({ ...prev, ein_number: einValue.trim() }));
    setEinModalOpen(false);
    toast.success("EIN saved!");
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    await supabase.from("studio_profile").upsert({
      user_id: user.id,
      studio_name: (formProfile as any).studio_name || null,
      handle: (formProfile as any).handle || null,
      description: (formProfile as any).description || null,
      instagram_handle: (formProfile as any).instagram_handle || null,
      instagram_url: (formProfile as any).instagram_url || null,
      instagram_followers: Number((formProfile as any).instagram_followers) || null,
      youtube_url: (formProfile as any).youtube_url || null,
      youtube_handle: (formProfile as any).youtube_handle || null,
      youtube_subscribers: Number((formProfile as any).youtube_subscribers) || null,
      tiktok_handle: (formProfile as any).tiktok_handle || null,
      tiktok_url: (formProfile as any).tiktok_url || null,
      tiktok_followers: Number((formProfile as any).tiktok_followers) || null,
      twitter_handle: (formProfile as any).twitter_handle || null,
      twitter_url: (formProfile as any).twitter_url || null,
      twitter_followers: Number((formProfile as any).twitter_followers) || null,
      linkedin_url: (formProfile as any).linkedin_url || null,
      substack_url: (formProfile as any).substack_url || null,
      substack_subscriber_count: Number((formProfile as any).substack_subscriber_count) || null,
      podcast_name: (formProfile as any).podcast_name || null,
      podcast_url: (formProfile as any).podcast_url || null,
    } as any, { onConflict: "user_id" });
    setStudioName(formProfile.studio_name || "");
    setStudioHandle(formProfile.handle || "");
    setSettingsOpen(false);
    toast.success("Studio settings saved!");
    queryClient.invalidateQueries({ 
      queryKey: ["studio_profile_overview"] 
    });
  };

  const handleAddGoal = async () => {
    if (!user || !goalTitle.trim()) return;
    const { data, error } = await supabase.from("studio_goals").insert({
      user_id: user.id,
      title: goalTitle.trim(),
      progress: goalProgress,
      deadline: goalDeadline || null,
      category: goalCategory,
    }).select().single();
    if (error) { toast.error("Failed to add goal"); return; }
    setStudioGoals(prev => [...prev, data as StudioGoal]);
    setGoalTitle(""); setGoalProgress(0); setGoalDeadline(""); setGoalCategory("Other");
    setAddGoalOpen(false);
    toast.success("Goal added!");
  };

  const handleDeleteGoal = async (id: string) => {
    await supabase.from("studio_goals").delete().eq("id", id);
    setStudioGoals(prev => prev.filter(g => g.id !== id));
    toast.success("Goal removed");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";

    const newUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const uniqueName = Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
      const path = user.id + "/studio-images/" + uniqueName;

      const { error: uploadErr } = await supabase.storage
        .from("studio-documents")
        .upload(path, file, { upsert: true });

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        toast.error("Upload failed: " + uploadErr.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("studio-documents")
        .getPublicUrl(path);

      if (urlData?.publicUrl) {
        newUrls.push(urlData.publicUrl);
      }
    }

    if (newUrls.length === 0) {
      toast.error("No photos uploaded successfully");
      return;
    }

    const updated = [...studioImages, ...newUrls];

    const { error: dbErr } = await supabase
      .from("studio_profile")
      .upsert(
        { user_id: user.id, images: updated } as any,
        { onConflict: "user_id" }
      );

    if (dbErr) {
      console.error("DB save error:", dbErr);
      toast.error("Uploaded but not saved: " + dbErr.message);
      return;
    }

    setStudioImages(updated);
    setCurrentImageIndex(updated.length - 1);
    toast.success(newUrls.length + " photo" + (newUrls.length > 1 ? "s" : "") + " uploaded!");
  };

  const handleRemoveImage = async (index: number) => {
    if (!user) return;
    const updated = studioImages.filter((_, i) => i !== index);
    const { error } = await supabase
      .from("studio_profile")
      .upsert(
        { user_id: user.id, images: updated } as any,
        { onConflict: "user_id" }
      );
    if (error) {
      toast.error("Failed to remove photo");
      return;
    }
    setStudioImages(updated);
    setCurrentImageIndex(Math.max(0, Math.min(currentImageIndex, updated.length - 1)));
    if (updated.length === 0) setCurrentImageIndex(0);
    toast.success("Photo removed");
  };

  const TABS = ["Overview", "HQ", "Platforms", "Deals", "Revenue"];

  const statItems = [
    { label: "Combined Followers", key: "combined_followers", value: studioStats?.combined_followers?.toLocaleString() || "—", raw: studioStats?.combined_followers, change: studioStats?.followers_change ? `+${studioStats.followers_change} YTD` : null, hint: "Connect platforms" },
    { label: "30D Reach", key: "reach_30d", value: studioStats?.reach_30d?.toLocaleString() || "—", raw: studioStats?.reach_30d, change: studioStats?.reach_change ? `+${studioStats.reach_change}%` : null, hint: "Click to edit" },
    { label: "30D Interactions", key: "interactions_30d", value: studioStats?.interactions_30d?.toLocaleString() || "—", raw: studioStats?.interactions_30d, change: studioStats?.interactions_change ? `+${studioStats.interactions_change}%` : null, hint: "Click to edit" },
    { label: "Avg Engagement", key: "avg_engagement", value: studioStats?.avg_engagement ? `${studioStats.avg_engagement}%` : "—", raw: studioStats?.avg_engagement, change: studioStats?.engagement_change ? `+${studioStats.engagement_change}%` : null, hint: "Click to edit" },
  ];

  const handleStatSave = async (key: string, val: number) => {
    if (!user) return;
    await supabase.from("studio_profile").upsert({ user_id: user.id, [key]: val } as any, { onConflict: "user_id" });
    setStudioStats(prev => ({ ...prev, [key]: val }));
    setEditingStat(null);
  };

  return (
    <>
      <div style={{
        background: isDark ? "#1C1C1E" : "white",
        borderRadius: "16px",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
        overflow: "hidden",
        marginBottom: "24px",
      }}>
        {/* TOP SECTION */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 380px",
          minHeight: isMobile ? undefined : "260px",
        }}>
          {/* LEFT — Identity + docs */}
          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column" }}>
            {/* Breadcrumb */}
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              marginBottom: "8px",
            }}>
              <Target size={13} color="#10B981" />
              <span style={{
                fontSize: "12px", fontWeight: 500,
                color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280",
                fontFamily: "Inter, sans-serif",
              }}>Studio</span>
              {studioHandle && (
                <>
                  <ChevronRight size={11} color={isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB"} />
                  <span style={{
                    fontSize: "12px", fontWeight: 500,
                    color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF",
                    fontFamily: "Inter, sans-serif",
                  }}>@{studioHandle.replace(/^@/, '')}</span>
                </>
              )}
            </div>

            {/* Studio name */}
            {studioName ? (
              <h1 style={{
                fontSize: "26px", fontWeight: 800,
                color: isDark ? "#F2F2F2" : "#111827",
                letterSpacing: "-0.5px",
                fontFamily: "Inter, sans-serif",
                margin: "0 0 16px",
              }}>
                {studioName}
              </h1>
            ) : (
              <button
                onClick={() => setSettingsOpen(true)}
                style={{
                  fontSize: "22px", fontWeight: 600,
                  color: "#D1D5DB", background: "transparent",
                  border: "none", cursor: "pointer",
                  fontFamily: "Inter, sans-serif", padding: 0,
                  marginBottom: "16px", display: "flex",
                  alignItems: "center", gap: "8px", textAlign: "left",
                }}>
                <Plus size={18} />
                Add studio name
              </button>
            )}

            {/* Business docs — plain text */}
            <div style={{
              display: "flex", flexDirection: "column", gap: "6px",
              marginBottom: "20px",
            }}>
              {DOC_ITEMS.map(doc => {
                const val = studioDocs[doc.key as keyof StudioDoc];
                return (
                  <div key={doc.key} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <doc.Icon size={12} color={val ? doc.color : (isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB")} />
                    {val ? (
                      <button
                        onClick={() => handleDocAction(doc)}
                        style={{
                          background: "transparent", border: "none", padding: 0,
                          fontSize: "13px",
                          color: isDark ? "rgba(255,255,255,0.5)" : "#374151",
                          cursor: "pointer", fontFamily: "Inter, sans-serif",
                          textAlign: "left",
                        }}>
                        {doc.isText ? val : `${doc.label} →`}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDocAction(doc)}
                        style={{
                          background: "transparent", border: "none", padding: 0,
                          fontSize: "13px",
                          color: isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB",
                          cursor: "pointer", fontFamily: "Inter, sans-serif",
                          textAlign: "left",
                        }}>
                        + Add {doc.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              marginTop: "auto",
            }}>
              <button
                onClick={() => { setFormProfile({ studio_name: studioName, handle: studioHandle, ...formProfile }); setSettingsOpen(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "9px 18px",
                  background: isDark ? "#F2F2F2" : "#111827",
                  color: isDark ? "#111827" : "white",
                  border: "none", borderRadius: "8px",
                  fontSize: "14px", fontWeight: 600, cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}>
                <Pencil size={13} />
                Edit Studio
              </button>
              <button
                onClick={() => {
                  if (!studioName) {
                    toast("Add your studio name first", { description: "Click Edit Studio to get started." });
                    return;
                  }
                  setStudioPreviewOpen(true);
                }}
                style={{
                  padding: "9px 16px",
                  background: "transparent",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#E5E7EB"}`,
                  borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                  color: isDark ? "#F2F2F2" : "#374151",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>Preview</button>
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/studio/${user?.id}`;
                  if (navigator.share) {
                    navigator.share({ title: studioName || "My Studio", text: "Check out my studio on Digital Home", url: shareUrl }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast("Link copied!", { description: "Studio link copied to clipboard." });
                  }
                }}
                style={{
                  padding: "9px 16px",
                  background: "transparent",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#E5E7EB"}`,
                  borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                  color: isDark ? "#F2F2F2" : "#374151",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>Share</button>
              <div style={{ position: "relative" }} onMouseDown={e => e.stopPropagation()}>
                <button
                  onClick={() => setStudioMenuOpen(!studioMenuOpen)}
                  style={{
                    padding: "9px",
                    background: "transparent",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#E5E7EB"}`,
                    borderRadius: "8px", cursor: "pointer",
                    color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <MoreHorizontal size={15} />
                </button>
                {studioMenuOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: isDark ? "#1C1C1E" : "white",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    borderRadius: "10px", padding: "4px", minWidth: "160px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 50,
                  }}>
                    {[
                      { label: "Edit Studio", Icon: Pencil, action: () => { setSettingsOpen(true); setStudioMenuOpen(false); } },
                      { label: "Add Photos", Icon: ImagePlus, action: () => { studioImageInputRef.current?.click(); setStudioMenuOpen(false); } },
                      {
                        label: "Remove Photos", Icon: Trash2, color: "#DC2626",
                        action: async () => {
                          setStudioImages([]);
                          await supabase.from("studio_profile").upsert({ user_id: user!.id, images: [] as any } as any, { onConflict: "user_id" });
                          toast("Photos removed");
                          setStudioMenuOpen(false);
                        },
                      },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px", width: "100%",
                          padding: "8px 12px", background: "transparent", border: "none",
                          borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                          color: item.color || (isDark ? "#F2F2F2" : "#374151"),
                          fontFamily: "Inter, sans-serif", textAlign: "left",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <item.Icon size={14} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Image panel */}
          <div style={{
            position: "relative",
            background: isDark ? "#252528" : "#F3F4F6",
            overflow: "hidden",
            borderLeft: isMobile ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
            borderTop: isMobile ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}` : "none",
            display: "flex",
            flexDirection: "column",
            minHeight: isMobile ? "200px" : "260px",
          }}>
            {studioImages.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Main image */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: isMobile ? "160px" : "200px" }}>
                  <img
                    src={studioImages[currentImageIndex]}
                    alt="Studio"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  {/* Remove current photo */}
                  <button
                    onClick={() => handleRemoveImage(currentImageIndex)}
                    title="Remove this photo"
                    style={{
                      position: "absolute", top: 10, right: 10,
                      width: 30, height: 30,
                      background: "rgba(0,0,0,0.6)",
                      border: "none", borderRadius: "50%",
                      color: "white", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 700, zIndex: 10, lineHeight: 1,
                    }}
                  >×</button>
                  {/* Add more photos */}
                  <button
                    onClick={() => studioImageInputRef.current?.click()}
                    style={{
                      position: "absolute", bottom: 10, right: 10,
                      padding: "5px 12px",
                      background: "rgba(0,0,0,0.55)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "8px", color: "white", cursor: "pointer",
                      fontSize: "11px", fontWeight: 600, fontFamily: "Inter, sans-serif",
                      display: "flex", alignItems: "center", gap: 4, zIndex: 10,
                    }}
                  >+ Add Photo</button>
                  {/* Image counter */}
                  {studioImages.length > 1 && (
                    <div style={{
                      position: "absolute", bottom: 10, left: 10,
                      padding: "3px 8px", borderRadius: 6,
                      background: "rgba(0,0,0,0.55)", color: "white",
                      fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
                    }}>
                      {currentImageIndex + 1} / {studioImages.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {studioImages.length > 1 && (
                  <div style={{
                    display: "flex", gap: 4, padding: "8px 10px",
                    overflowX: "auto",
                    borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
                  }}>
                    {studioImages.slice(0, 10).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        style={{
                          width: 38, height: 38, borderRadius: 6,
                          overflow: "hidden", flexShrink: 0,
                          border: currentImageIndex === idx ? "2px solid #10B981" : "2px solid transparent",
                          cursor: "pointer", padding: 0, background: "none",
                          transition: "border-color 150ms",
                        }}
                      >
                        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Empty state */
              <div
                onClick={() => studioImageInputRef.current?.click()}
                style={{
                  width: "100%", height: "100%", minHeight: "220px",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer", gap: 10,
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Upload size={18} color={isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF"} />
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif",
                  color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
                }}>
                  Add a studio photo or logo
                </span>
              </div>
            )}

            <input
              ref={studioImageInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
        }}>
          {statItems.map((stat, i) => (
            <div key={i} style={{
              padding: "16px 24px",
              borderRight: i < 3 ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}` : "none",
              cursor: "pointer",
            }} onClick={() => { if (editingStat !== stat.key) setEditingStat(stat.key); }} title={!stat.raw ? "Add in Platforms tab" : "Click to edit"}>
              <p style={{
                fontSize: "11px", fontWeight: 500,
                color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
                margin: "0 0 4px", fontFamily: "Inter, sans-serif",
                textTransform: "uppercase", letterSpacing: "0.3px",
              }}>
                {stat.label}
              </p>
              {editingStat === stat.key ? (
                <input
                  autoFocus
                  type="number"
                  defaultValue={stat.raw || 0}
                  onBlur={e => handleStatSave(stat.key, parseInt(e.target.value) || 0)}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingStat(null); }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    fontSize: "20px", fontWeight: 700, border: "none",
                    borderBottom: "2px solid #10B981", outline: "none",
                    background: "transparent", width: "120px",
                    fontFamily: "Inter, sans-serif", color: isDark ? "#F2F2F2" : "#111827",
                  }}
                />
              ) : (
                <p style={{
                  fontSize: "20px", fontWeight: 700,
                  color: isDark ? "#F2F2F2" : "#111827",
                  margin: "0 0 2px", fontFamily: "Inter, sans-serif",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {stat.value}
                </p>
              )}
              {stat.change && editingStat !== stat.key && (
                <p style={{
                  fontSize: "11px", fontWeight: 600,
                  color: "#10B981", margin: 0,
                  fontFamily: "Inter, sans-serif",
                }}>
                  {stat.change}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* SETTINGS MODAL */}
      {settingsOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setSettingsOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "500px", margin: "0 16px",
            background: isDark ? "#1C1C1E" : "white", borderRadius: "14px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
            maxHeight: "85vh", overflow: "auto",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: isDark ? "#F2F2F2" : "#111827" }}>
                Studio Settings
              </h3>
              <button onClick={() => setSettingsOpen(false)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "#9CA3AF", padding: "4px",
              }}><X size={16} /></button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Studio / Brand Name", key: "studio_name", placeholder: "e.g. Chloe Creates" },
                { label: "Handle / Username", key: "handle", placeholder: "yourhandle", prefix: "@" },
                { label: "Description", key: "description", placeholder: "What your studio is about...", textarea: true },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "#9CA3AF" : "#374151", marginBottom: "4px", display: "block" }}>
                    {f.label}
                  </label>
                  {f.textarea ? (
                    <textarea
                      value={(formProfile as any)[f.key] || ""}
                      onChange={e => setFormProfile(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      rows={3}
                      style={{
                        width: "100%", padding: "8px 12px", fontSize: "13px",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                        borderRadius: "8px", resize: "vertical", outline: "none",
                        background: isDark ? "#252528" : "white",
                        color: isDark ? "#F2F2F2" : "#374151", fontFamily: "inherit",
                        boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {f.prefix && (
                        <span style={{
                          padding: "8px 10px", fontSize: "13px",
                          background: isDark ? "#252528" : "#F3F4F6",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                          borderRight: "none", borderRadius: "8px 0 0 8px",
                          color: "#9CA3AF",
                        }}>{f.prefix}</span>
                      )}
                      <input
                        type="text"
                        value={(formProfile as any)[f.key] || ""}
                        onChange={e => setFormProfile(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{
                          flex: 1, padding: "8px 12px", fontSize: "13px",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                          borderRadius: f.prefix ? "0 8px 8px 0" : "8px",
                          outline: "none",
                          background: isDark ? "#252528" : "white",
                          color: isDark ? "#F2F2F2" : "#374151",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
              <p style={{
                fontSize: "11px", fontWeight: 600, color: "#9CA3AF",
                textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 0",
              }}>Social Accounts</p>
              {[
                { label: "Instagram Handle", key: "instagram_handle", placeholder: "yourhandle", prefix: "@" },
                { label: "Instagram Followers", key: "instagram_followers", placeholder: "e.g. 12500", type: "number" },
                { label: "YouTube URL", key: "youtube_url", placeholder: "https://youtube.com/@yourchannel" },
                { label: "YouTube Subscribers", key: "youtube_subscribers", placeholder: "e.g. 5000", type: "number" },
                { label: "TikTok Handle", key: "tiktok_handle", placeholder: "yourhandle", prefix: "@" },
                { label: "TikTok Followers", key: "tiktok_followers", placeholder: "e.g. 8000", type: "number" },
                { label: "Twitter / X Handle", key: "twitter_handle", placeholder: "yourhandle", prefix: "@" },
                { label: "Twitter Followers", key: "twitter_followers", placeholder: "e.g. 3200", type: "number" },
                { label: "LinkedIn URL", key: "linkedin_url", placeholder: "https://linkedin.com/in/..." },
                { label: "Substack URL", key: "substack_url", placeholder: "https://yourname.substack.com" },
                { label: "Substack Subscribers", key: "substack_subscriber_count", placeholder: "e.g. 1200", type: "number" },
                { label: "Podcast Name", key: "podcast_name", placeholder: "e.g. The Daily Hustle" },
                { label: "Podcast URL", key: "podcast_url", placeholder: "https://..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "#9CA3AF" : "#374151", marginBottom: "4px", display: "block" }}>
                    {f.label}
                  </label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {(f as any).prefix && (
                      <span style={{
                        padding: "8px 10px", fontSize: "13px",
                        background: isDark ? "#252528" : "#F3F4F6",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                        borderRight: "none", borderRadius: "8px 0 0 8px",
                        color: "#9CA3AF",
                      }}>{(f as any).prefix}</span>
                    )}
                    <input
                      type={(f as any).type || "text"}
                      value={(formProfile as any)[f.key] || ""}
                      onChange={e => setFormProfile(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{
                        flex: 1, padding: "8px 12px", fontSize: "13px",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                        borderRadius: (f as any).prefix ? "0 8px 8px 0" : "8px",
                        outline: "none",
                        background: isDark ? "#252528" : "white",
                        color: isDark ? "#F2F2F2" : "#374151",
                        boxSizing: "border-box" as const,
                      }}
                    />
                  </div>
                </div>
              ))}
              <button onClick={handleSaveSettings} style={{
                width: "100%", padding: "10px", background: "#10B981", color: "white",
                border: "none", borderRadius: "8px", fontSize: "14px",
                fontWeight: 600, cursor: "pointer", marginTop: "8px",
              }}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {addGoalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setAddGoalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "420px", margin: "0 16px",
            background: isDark ? "#1C1C1E" : "white", borderRadius: "14px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: isDark ? "#F2F2F2" : "#111827" }}>
                Add Studio Goal
              </h3>
              <button onClick={() => setAddGoalOpen(false)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "#9CA3AF", padding: "4px",
              }}><X size={16} /></button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "#9CA3AF" : "#374151", marginBottom: "4px", display: "block" }}>
                  Goal Title *
                </label>
                <input
                  type="text" value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  placeholder="e.g. Reach 50K followers"
                  style={{
                    width: "100%", padding: "8px 12px", fontSize: "13px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    borderRadius: "8px", outline: "none",
                    background: isDark ? "#252528" : "white",
                    color: isDark ? "#F2F2F2" : "#374151",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "#9CA3AF" : "#374151", marginBottom: "4px", display: "block" }}>
                  Progress: {goalProgress}%
                </label>
                <input
                  type="range" min={0} max={100} value={goalProgress}
                  onChange={e => setGoalProgress(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#10B981" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "#9CA3AF" : "#374151", marginBottom: "4px", display: "block" }}>
                  Deadline (optional)
                </label>
                <input
                  type="date" value={goalDeadline}
                  onChange={e => setGoalDeadline(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", fontSize: "13px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    borderRadius: "8px", outline: "none",
                    background: isDark ? "#252528" : "white",
                    color: isDark ? "#F2F2F2" : "#374151",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "#9CA3AF" : "#374151", marginBottom: "4px", display: "block" }}>
                  Category
                </label>
                <select
                  value={goalCategory}
                  onChange={e => setGoalCategory(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", fontSize: "13px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    borderRadius: "8px", outline: "none",
                    background: isDark ? "#252528" : "white",
                    color: isDark ? "#F2F2F2" : "#374151",
                    boxSizing: "border-box",
                  }}>
                  {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                onClick={handleAddGoal}
                disabled={!goalTitle.trim()}
                style={{
                  width: "100%", padding: "10px", background: goalTitle.trim() ? "#10B981" : "#D1D5DB",
                  color: "white", border: "none", borderRadius: "8px", fontSize: "14px",
                  fontWeight: 600, cursor: goalTitle.trim() ? "pointer" : "not-allowed",
                }}>
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EIN MODAL */}
      {einModalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setEinModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "360px", margin: "0 16px",
            background: isDark ? "#1C1C1E" : "white", borderRadius: "14px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
            padding: "24px",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 14px", color: isDark ? "#F2F2F2" : "#111827" }}>
              Enter your EIN Number
            </h3>
            <input
              type="text" value={einValue}
              onChange={e => setEinValue(e.target.value)}
              placeholder="XX-XXXXXXX"
              style={{
                width: "100%", padding: "10px 12px", fontSize: "14px",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                borderRadius: "8px", outline: "none",
                background: isDark ? "#252528" : "white",
                color: isDark ? "#F2F2F2" : "#374151",
                marginBottom: "14px", boxSizing: "border-box",
              }}
            />
            <button onClick={handleSaveEin} disabled={!einValue.trim()} style={{
              width: "100%", padding: "10px", background: einValue.trim() ? "#10B981" : "#D1D5DB",
              color: "white", border: "none", borderRadius: "8px", fontSize: "14px",
              fontWeight: 600, cursor: einValue.trim() ? "pointer" : "not-allowed",
            }}>Save</button>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {studioPreviewOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setStudioPreviewOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "480px", margin: "0 16px",
            background: isDark ? "#1C1C1E" : "white", borderRadius: "14px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>
                Studio Preview
              </h3>
              <button onClick={() => setStudioPreviewOpen(false)} style={{
                background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "4px",
              }}><X size={16} /></button>
            </div>
            <div style={{ padding: "24px 20px" }}>
              {studioImages[0] && (
                <img src={studioImages[0]} alt="Studio" style={{
                  width: "100%", height: "180px", objectFit: "cover", borderRadius: "10px", marginBottom: "16px",
                }} />
              )}
              <h2 style={{
                fontSize: "22px", fontWeight: 800, color: isDark ? "#F2F2F2" : "#111827",
                margin: "0 0 4px", fontFamily: "Inter, sans-serif",
              }}>{studioName || "Your Studio"}</h2>
              {studioHandle && (
                <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>
                  @{studioHandle}
                </p>
              )}
              {studioGoals.length > 0 && (
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", fontFamily: "Inter, sans-serif" }}>
                    Studio Goals
                  </p>
                  {studioGoals.map(goal => (
                    <div key={goal.id} style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#374151", fontFamily: "Inter, sans-serif" }}>{goal.title}</span>
                        <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>{goal.progress}%</span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "999px", background: isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6" }}>
                        <div style={{ height: "100%", borderRadius: "999px", background: "#10B981", width: `${goal.progress}%`, transition: "width 300ms" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`, display: "flex", justifyContent: "center" }}>
              <button onClick={() => setStudioPreviewOpen(false)} style={{
                padding: "8px 20px", background: "#111827", color: "white", border: "none",
                borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
