import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronRight, X, ChevronLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  onNavigateDeals?: () => void;
}

const PLATFORM_COLORS: Record<string, string> = { Instagram: "#E1306C", YouTube: "#FF0000", TikTok: "#000000" };

const STRATEGY_FIELDS = [
  { key: "primary_goals", label: "PRIMARY GOALS", placeholder: "What do you want to achieve in the next 90 days?" },
  { key: "target_audience", label: "TARGET AUDIENCE", placeholder: "Who are you talking to? Age, interests, pain points." },
  { key: "competitor_analysis", label: "COMPETITOR ANALYSIS", placeholder: "Who are you watching? What are they doing well or missing?" },
  { key: "brand_voice", label: "BRAND VOICE", placeholder: "How do you sound? (e.g. direct, warm, educational, bold)" },
  { key: "content_pillars", label: "CONTENT PILLARS", placeholder: "The 3-5 topics you always come back to." },
];

const MOCK_HEADLINES = [
  { title: "Creator economy reaches $250B valuation", source: "AdWeek", time: "2h ago", category: "Industry" },
  { title: "Instagram announces new monetization tools for creators", source: "Social Media Today", time: "4h ago", category: "Platform" },
  { title: "Brand deal rates up 23% for micro-influencers", source: "Digiday", time: "6h ago", category: "Deals" },
];

export default function StudioOverview({ onNavigateDeals }: Props) {
  const { user } = useAuth();
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [strategy, setStrategy] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);

  // Photo state
  const [photos, setPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedForRemove, setSelectedForRemove] = useState<Set<number>>(new Set());
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Studio profile stats
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("studio_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfile(data);
        const p = data as any;
        if (Array.isArray(p.images)) {
          setPhotos(p.images);
        }
      }
    })();
  }, [user]);

  const combined = profile
    ? (profile as any).combined_followers || ((profile as any).instagram_followers || 0) + ((profile as any).youtube_subscribers || 0) + ((profile as any).tiktok_followers || 0) + ((profile as any).twitter_followers || 0)
    : 0;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newUrls: string[] = [];
    for (const file of files) {
      const path = `studio-photos/${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("studio-documents").upload(path, file, { upsert: true });
      if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("studio-documents").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }
    if (!newUrls.length) return;
    const updated = [...photos, ...newUrls];
    setPhotos(updated);
    await supabase.from("studio_profile").upsert(
      { user_id: user.id, images: updated as any } as any,
      { onConflict: "user_id" }
    );
    toast.success(`${newUrls.length} photo(s) uploaded`);
    e.target.value = "";
  };

  const handleRemoveSelected = async () => {
    if (!user || selectedForRemove.size === 0) return;
    const toRemove = Array.from(selectedForRemove);
    // Delete from storage
    for (const idx of toRemove) {
      const url = photos[idx];
      if (!url) continue;
      try {
        const pathMatch = url.split("/studio-documents/")[1];
        if (pathMatch) {
          await supabase.storage.from("studio-documents").remove([decodeURIComponent(pathMatch)]);
        }
      } catch {}
    }
    const updated = photos.filter((_, i) => !selectedForRemove.has(i));
    setPhotos(updated);
    await supabase.from("studio_profile").upsert(
      { user_id: user.id, images: updated as any } as any,
      { onConflict: "user_id" }
    );
    setSelectedForRemove(new Set());
    setRemoveMode(false);
    toast.success("Photos removed");
  };

  const platformRows = profile ? [
    { name: "Instagram", handle: (profile as any).instagram_handle, followers: (profile as any).instagram_followers },
    { name: "YouTube", handle: (profile as any).youtube_url || (profile as any).youtube_handle, followers: (profile as any).youtube_subscribers },
    { name: "TikTok", handle: (profile as any).tiktok_handle, followers: (profile as any).tiktok_followers },
    { name: "Twitter/X", handle: (profile as any).twitter_handle, followers: (profile as any).twitter_followers },
  ].filter(p => p.handle) : [];

  return (
    <div className="space-y-3 max-w-[1200px] mx-auto">
      {/* Combined Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {[
          { label: "COMBINED FOLLOWERS", value: combined ? combined.toLocaleString() : "\u2014", sub: "All platforms combined" },
          { label: "30D REACH", value: (profile as any)?.reach_30d ? (profile as any).reach_30d.toLocaleString() : "\u2014" },
          { label: "30D INTERACTIONS", value: (profile as any)?.interactions_30d ? (profile as any).interactions_30d.toLocaleString() : "\u2014" },
          { label: "AVG ENGAGEMENT", value: (profile as any)?.avg_engagement ? `${(profile as any).avg_engagement}%` : "\u2014" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">{s.label}</p>
            <p className="text-[28px] font-medium text-[#111827] dark:text-[#f9fafb] tracking-tight leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
            {s.sub && <p className="text-[10px] text-[#9ca3af] mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Platform Performance */}
      {platformRows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {platformRows.map(plat => (
            <div key={plat.name} className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#e5e7eb] dark:border-[#1f2937]">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold" style={{ backgroundColor: PLATFORM_COLORS[plat.name] || "#6366f1" }}>
                  {plat.name[0]}
                </div>
                <span className="text-[12px] font-semibold text-[#374151] dark:text-[#e5e7eb]">{plat.handle}</span>
                <span className="text-[10px] text-[#9ca3af] ml-auto">{plat.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-0.5">Followers</p>
                  <p className="text-[20px] font-medium text-[#111827] dark:text-[#f9fafb]" style={{ fontVariantNumeric: "tabular-nums" }}>{plat.followers ? plat.followers.toLocaleString() : "\u2014"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photos Section */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">Studio Photos</p>
          <div className="flex gap-2">
            {photos.length > 0 && !removeMode && (
              <button
                onClick={() => setRemoveMode(true)}
                className="text-[11px] text-[#DC2626] font-medium"
                style={{ minHeight: "44px", padding: "0 8px", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
              >
                Remove
              </button>
            )}
            {removeMode && (
              <>
                <button
                  onClick={() => { setRemoveMode(false); setSelectedForRemove(new Set()); }}
                  className="text-[11px] text-[#9ca3af] font-medium"
                  style={{ minHeight: "44px", padding: "0 8px", background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveSelected}
                  disabled={selectedForRemove.size === 0}
                  style={{
                    minHeight: "44px", padding: "0 14px", borderRadius: "8px",
                    background: selectedForRemove.size > 0 ? "#DC2626" : "#D1D5DB",
                    color: "white", border: "none", fontSize: "12px", fontWeight: 600,
                    cursor: selectedForRemove.size > 0 ? "pointer" : "not-allowed",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Remove {selectedForRemove.size} selected
                </button>
              </>
            )}
            {!removeMode && (
              <button
                onClick={() => photoInputRef.current?.click()}
                style={{
                  minHeight: "44px", padding: "0 14px", borderRadius: "8px",
                  background: "#10B981", color: "white", border: "none",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "4px",
                }}
              >
                <Plus size={14} /> Add Photos
              </button>
            )}
          </div>
        </div>

        {photos.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px" }}>
            {photos.map((url, i) => (
              <div
                key={i}
                style={{ position: "relative", cursor: removeMode ? "pointer" : "pointer" }}
                onClick={() => {
                  if (removeMode) {
                    setSelectedForRemove(prev => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i); else next.add(i);
                      return next;
                    });
                  } else {
                    setLightboxIndex(i);
                  }
                }}
              >
                <img
                  src={url}
                  alt={`Studio photo ${i + 1}`}
                  style={{
                    width: "100%", height: "120px", objectFit: "cover",
                    borderRadius: "8px",
                    border: removeMode && selectedForRemove.has(i) ? "3px solid #DC2626" : "none",
                    opacity: removeMode && selectedForRemove.has(i) ? 0.6 : 1,
                  }}
                />
                {removeMode && (
                  <div style={{
                    position: "absolute", top: "6px", right: "6px",
                    width: "20px", height: "20px", borderRadius: "4px",
                    border: "2px solid white", background: selectedForRemove.has(i) ? "#DC2626" : "rgba(0,0,0,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {selectedForRemove.has(i) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" /></svg>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: "32px", textAlign: "center", borderRadius: "8px",
            border: "1px dashed #E5E7EB", background: "#FAFAFA",
          }}>
            <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "0 0 12px", fontFamily: "Inter, sans-serif" }}>
              No photos yet. Add photos to your studio profile.
            </p>
            <button
              onClick={() => photoInputRef.current?.click()}
              style={{
                minHeight: "44px", padding: "0 20px", borderRadius: "8px",
                background: "#10B981", color: "white", border: "none",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Add Photos
            </button>
          </div>
        )}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/heic"
          multiple
          style={{ display: "none" }}
          onChange={handlePhotoUpload}
        />
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.9)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: "absolute", top: "16px", right: "16px",
              background: "rgba(255,255,255,0.1)", border: "none",
              borderRadius: "8px", padding: "8px", cursor: "pointer", color: "white",
              minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length); }}
                style={{
                  position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.1)", border: "none",
                  borderRadius: "8px", padding: "8px", cursor: "pointer", color: "white",
                  minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % photos.length); }}
                style={{
                  position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.1)", border: "none",
                  borderRadius: "8px", padding: "8px", cursor: "pointer", color: "white",
                  minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          <img
            src={photos[lightboxIndex]}
            alt="Full size"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "8px" }}
          />
        </div>
      )}

      {/* Brand Strategy — Collapsible */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937]">
        <button onClick={() => setStrategyOpen(!strategyOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            <ChevronRight className={`w-3.5 h-3.5 text-[#9ca3af] transition-transform duration-200 ${strategyOpen ? "rotate-90" : ""}`} />
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af]">Brand Strategy</span>
          </div>
          <span className="text-[11px] text-[#6366f1]">Edit</span>
        </button>
        {strategyOpen && (
          <div className="px-4 pb-4 space-y-4">
            {STRATEGY_FIELDS.map(field => (
              <div key={field.key}>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">{field.label}</p>
                {editingField === field.key ? (
                  <textarea
                    autoFocus
                    className="w-full text-[13px] text-[#374151] dark:text-[#e5e7eb] bg-transparent border-0 border-b border-[#6366f1] outline-none resize-none leading-relaxed pb-1"
                    value={strategy[field.key] || ""}
                    onChange={e => setStrategy(prev => ({ ...prev, [field.key]: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={e => e.key === "Escape" && setEditingField(null)}
                    placeholder={field.placeholder}
                    rows={2}
                  />
                ) : (
                  <p
                    onClick={() => setEditingField(field.key)}
                    className={`text-[13px] leading-relaxed cursor-pointer min-h-[20px] ${strategy[field.key] ? "text-[#374151] dark:text-[#e5e7eb]" : "text-[#d1d5db] dark:text-[#4b5563]"}`}
                  >
                    {strategy[field.key] || field.placeholder}
                  </p>
                )}
              </div>
            ))}
            <button onClick={() => setStrategyOpen(false)} className="text-[11px] text-[#9ca3af]">Collapse</button>
          </div>
        )}
      </div>

      {/* Headlines */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] mb-1">Industry Headlines</p>
        <p className="text-[10px] text-[#9ca3af] mb-3">Creator Economy . Brand Deals . Platform Updates</p>
        <div className="space-y-0">
          {MOCK_HEADLINES.map((h, i) => (
            <a key={i} href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#0d1017] transition -mx-4 px-4" style={{ borderBottom: i < MOCK_HEADLINES.length - 1 ? "1px solid #f5f5f5" : "none" }}>
              <span className="text-[10px] font-semibold text-[#9ca3af] shrink-0 w-14">{h.category}</span>
              <span className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb] flex-1 truncate">{h.title}</span>
              <span className="text-[11px] text-[#9ca3af] shrink-0">{h.source}</span>
              <span className="text-[11px] text-[#9ca3af] shrink-0">{h.time}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Active Deals */}
      <div className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">Active Deals</p>
          <button onClick={onNavigateDeals} className="text-[11px] text-[#6366f1] font-medium">View all deals</button>
        </div>
        <p className="text-[12px] text-[#9ca3af]">View your active brand deals in the Deals tab.</p>
      </div>
    </div>
  );
}
