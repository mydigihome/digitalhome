import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Shield, Hash, FileText, Award, Check,
  Plus, Target, X, Trash2, Pencil,
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

const DOC_ITEMS: { key: string; label: string; Icon: typeof Shield; color: string; isText?: boolean }[] = [
  { key: "llc_document", label: "LLC Document", Icon: Shield, color: "#7B5EA7" },
  { key: "ein_number", label: "EIN Number", Icon: Hash, color: "#10B981", isText: true },
  { key: "pitch_deck", label: "Pitch Deck", Icon: FileText, color: "#F59E0B" },
  { key: "business_license", label: "Business License", Icon: Award, color: "#3B82F6" },
];

const GOAL_CATEGORIES = ["Followers", "Revenue", "Content", "Brand Deal", "Other"];

export default function StudioHeaderCard() {
  const { user } = useAuth();
  const isDark = document.documentElement.classList.contains("dark");

  const [studioName, setStudioName] = useState("");
  const [studioHandle, setStudioHandle] = useState("");
  const [studioDocs, setStudioDocs] = useState<StudioDoc>({});
  const [studioGoals, setStudioGoals] = useState<StudioGoal[]>([]);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [einModalOpen, setEinModalOpen] = useState(false);
  const [einValue, setEinValue] = useState("");

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
      studio_name: formProfile.studio_name || null,
      handle: formProfile.handle || null,
      description: formProfile.description || null,
      instagram_handle: formProfile.instagram_handle || null,
      youtube_url: formProfile.youtube_url || null,
      tiktok_handle: formProfile.tiktok_handle || null,
      twitter_handle: formProfile.twitter_handle || null,
    }, { onConflict: "user_id" });
    setStudioName(formProfile.studio_name || "");
    setStudioHandle(formProfile.handle || "");
    setSettingsOpen(false);
    toast.success("Studio settings saved!");
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

  const currentGoal = studioGoals[currentGoalIndex];

  return (
    <>
      <div style={{
        background: isDark ? "#1C1C1E" : "white",
        borderRadius: "16px",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
        overflow: "hidden",
        marginBottom: "24px",
      }}>
        {/* BANNER */}
        <div style={{
          height: "100px",
          background: "linear-gradient(135deg, #0F0F0F 0%, #1a1a2e 40%, #16213e 70%, #0d3b2e 100%)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(ellipse at 15% 50%, rgba(16,185,129,0.2) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, rgba(123,94,167,0.2) 0%, transparent 55%)",
          }} />
          {studioName ? (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <h1 style={{
                fontSize: "28px", fontWeight: 800, color: "white",
                letterSpacing: "-0.5px", fontFamily: "Inter, sans-serif",
                textShadow: "0 2px 20px rgba(0,0,0,0.5)", margin: 0,
              }}>
                {studioName}
              </h1>
            </div>
          ) : (
            <button
              onClick={() => setSettingsOpen(true)}
              style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: "none", cursor: "pointer",
                gap: "8px", color: "rgba(255,255,255,0.5)", fontSize: "15px",
                fontWeight: 500, fontFamily: "Inter, sans-serif",
              }}>
              <Plus size={18} color="rgba(255,255,255,0.5)" />
              Add your studio name
            </button>
          )}
          <button
            onClick={() => { setFormProfile({ studio_name: studioName, handle: studioHandle, ...formProfile }); setSettingsOpen(true); }}
            style={{
              position: "absolute", top: "14px", right: "16px",
              display: "flex", alignItems: "center", gap: "5px",
              padding: "6px 12px", background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
              color: "rgba(255,255,255,0.8)", fontSize: "12px", fontWeight: 500,
              cursor: "pointer", backdropFilter: "blur(8px)",
              fontFamily: "Inter, sans-serif", zIndex: 2,
            }}>
            <Pencil size={11} />
            Edit Studio
          </button>
        </div>

        {/* BOTTOM — clean horizontal */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto 1fr",
          padding: "20px 28px", alignItems: "start",
        }}>
          {/* LEFT — Business Docs */}
          <div>
            <p style={{
              fontSize: "11px", fontWeight: 600, color: "#9CA3AF",
              textTransform: "uppercase", letterSpacing: "0.8px",
              marginBottom: "14px", fontFamily: "Inter, sans-serif",
            }}>
              Business Documents
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {DOC_ITEMS.map(doc => {
                const val = studioDocs[doc.key as keyof StudioDoc];
                return (
                  <div key={doc.key} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <doc.Icon size={14} color={val ? doc.color : "#D1D5DB"} />
                      <span style={{
                        fontSize: "13px", fontFamily: "Inter, sans-serif",
                        color: val
                          ? (isDark ? "#F2F2F2" : "#111827")
                          : (isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF"),
                        fontWeight: val ? 500 : 400,
                      }}>
                        {doc.label}
                      </span>
                      {val && (
                        <span style={{
                          fontSize: "11px", color: "#10B981",
                          display: "flex", alignItems: "center", gap: "3px",
                        }}>
                          <Check size={10} />
                          {doc.isText ? val : "Added"}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDocAction(doc)}
                      style={{
                        background: "transparent", border: "none",
                        fontSize: "12px",
                        color: val ? "#6B7280" : "#10B981",
                        cursor: "pointer", fontWeight: 500,
                        fontFamily: "Inter, sans-serif",
                      }}>
                      {val ? "View →" : "+ Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER DIVIDER */}
          <div style={{
            width: "1px",
            background: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
            alignSelf: "stretch", margin: "0 32px",
          }} />

          {/* RIGHT — Goals */}
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "14px",
            }}>
              <p style={{
                fontSize: "11px", fontWeight: 600, color: "#9CA3AF",
                textTransform: "uppercase", letterSpacing: "0.8px",
                fontFamily: "Inter, sans-serif", margin: 0,
              }}>
                Studio Goals
              </p>
              <button
                onClick={() => setAddGoalOpen(true)}
                style={{
                  background: "transparent", border: "none",
                  fontSize: "12px", color: "#10B981", cursor: "pointer",
                  fontWeight: 500, display: "flex", alignItems: "center",
                  gap: "4px", fontFamily: "Inter, sans-serif",
                }}>
                <Plus size={12} />
                Add
              </button>
            </div>

            {studioGoals.length > 0 && currentGoal ? (
              <div>
                <div style={{ marginBottom: "14px" }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "6px",
                  }}>
                    <span style={{
                      fontSize: "14px", fontWeight: 600,
                      color: isDark ? "#F2F2F2" : "#111827",
                      fontFamily: "Inter, sans-serif",
                    }}>
                      {currentGoal.title}
                    </span>
                    <span style={{
                      fontSize: "13px", fontWeight: 700, color: "#10B981",
                      fontFamily: "Inter, sans-serif",
                    }}>
                      {currentGoal.progress || 0}%
                    </span>
                  </div>
                  <div style={{
                    height: "4px",
                    background: isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6",
                    borderRadius: "999px", overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${currentGoal.progress || 0}%`,
                      background: "linear-gradient(90deg, #10B981, #059669)",
                      borderRadius: "999px",
                      transition: "width 500ms ease",
                    }} />
                  </div>
                  {currentGoal.deadline && (
                    <p style={{
                      fontSize: "11px",
                      color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
                      marginTop: "4px", fontFamily: "Inter, sans-serif",
                    }}>
                      Due {new Date(currentGoal.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>

                {studioGoals.length > 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {studioGoals
                      .filter((_, i) => i !== currentGoalIndex)
                      .slice(0, 2)
                      .map((goal, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: "8px",
                        }}>
                          <div style={{
                            width: "5px", height: "5px", borderRadius: "50%",
                            background: "#D1D5DB", flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: "12px",
                            color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280",
                            flex: 1, overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                            fontFamily: "Inter",
                          }}>
                            {goal.title}
                          </span>
                          <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
                            {goal.progress}%
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {studioGoals.length > 1 && (
                  <div style={{ display: "flex", gap: "4px", marginTop: "12px" }}>
                    {studioGoals.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentGoalIndex(i)}
                        style={{
                          width: i === currentGoalIndex ? "16px" : "5px",
                          height: "5px", borderRadius: "999px",
                          background: i === currentGoalIndex
                            ? "#10B981"
                            : (isDark ? "rgba(255,255,255,0.15)" : "#E5E7EB"),
                          border: "none", cursor: "pointer", padding: 0,
                          transition: "all 250ms",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p style={{
                  fontSize: "13px",
                  color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
                  fontStyle: "italic", marginBottom: "10px",
                  fontFamily: "Inter, sans-serif",
                }}>
                  No goals added yet
                </p>
                <button
                  onClick={() => setAddGoalOpen(true)}
                  style={{
                    padding: "7px 14px", background: "#F0FDF4",
                    border: "1px solid #BBF7D0", borderRadius: "8px",
                    fontSize: "13px", fontWeight: 600, color: "#065F46",
                    cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}>
                  Add First Goal
                </button>
              </div>
            )}
          </div>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
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
                { label: "Instagram", key: "instagram_handle", placeholder: "yourhandle", prefix: "@" },
                { label: "YouTube", key: "youtube_url", placeholder: "https://youtube.com/..." },
                { label: "TikTok", key: "tiktok_handle", placeholder: "yourhandle", prefix: "@" },
                { label: "Twitter/X", key: "twitter_handle", placeholder: "yourhandle", prefix: "@" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "#9CA3AF" : "#374151", marginBottom: "4px", display: "block" }}>
                    {f.label}
                  </label>
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
    </>
  );
}
