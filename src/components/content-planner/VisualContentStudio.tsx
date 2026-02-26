import { useState, useRef, useCallback } from "react";
import { FeedPost, StudioProfile, FONT_PAIRINGS } from "./types";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { Plus, Trash2, ChevronLeft, ChevronRight, Instagram, Smartphone, Image, Calendar, Clock, ChevronDown, User, Upload } from "lucide-react";

interface Props {
  feedPosts: FeedPost[];
  setFeedPosts: (fn: FeedPost[] | ((prev: FeedPost[]) => FeedPost[])) => void;
  studioProfile: StudioProfile;
  setStudioProfile: (fn: StudioProfile | ((prev: StudioProfile) => StudioProfile)) => void;
}

const FONTS = [
  "Inter, sans-serif",
  "Georgia, serif",
  "Courier New, monospace",
  "Arial Black, sans-serif",
  "Trebuchet MS, sans-serif",
  "Palatino, serif",
];

const FONT_LABELS: Record<string, string> = {
  "Inter, sans-serif": "Inter",
  "Georgia, serif": "Georgia",
  "Courier New, monospace": "Courier",
  "Arial Black, sans-serif": "Arial Black",
  "Trebuchet MS, sans-serif": "Trebuchet",
  "Palatino, serif": "Palatino",
};

function TilePreview({ post, size, onClick }: { post: FeedPost; size: number; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer group"
      style={{
        width: size,
        height: size,
        backgroundColor: post.backgroundColor,
        borderRadius: 4,
      }}
    >
      {post.imageData ? (
        <img src={post.imageData} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center w-full h-full p-1">
          <span
            className="text-center leading-tight overflow-hidden"
            style={{
              fontFamily: post.fontFamily,
              color: post.accentColor,
              fontSize: Math.max(8, size / 10),
              wordBreak: "break-word",
            }}
          >
            {post.caption || ""}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
    </div>
  );
}

function ProfileHeader({ profile, viewMode }: { profile: StudioProfile; viewMode: "instagram" | "tiktok" }) {
  const pairing = FONT_PAIRINGS[profile.fontPairing] || FONT_PAIRINGS["modern"];

  if (viewMode === "tiktok") {
    return (
      <div className="flex flex-col items-center py-3 border-b border-gray-100">
        {profile.profilePhoto ? (
          <img src={profile.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: profile.brandColors[0] + "30" }}>
            <User size={18} style={{ color: profile.brandColors[0] }} />
          </div>
        )}
        <span className="text-[11px] font-bold mt-1.5 text-gray-900" style={{ fontFamily: pairing.display }}>
          @{profile.username || "username"}
        </span>
        {profile.bio && (
          <span className="text-[9px] text-gray-500 mt-0.5 text-center px-4 leading-tight" style={{ fontFamily: pairing.body }}>
            {profile.bio}
          </span>
        )}
      </div>
    );
  }

  // Instagram style
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      {profile.profilePhoto ? (
        <img src={profile.profilePhoto} alt="" className="w-14 h-14 rounded-full object-cover border-2" style={{ borderColor: profile.brandColors[0] }} />
      ) : (
        <div className="w-14 h-14 rounded-full flex items-center justify-center border-2" style={{ borderColor: profile.brandColors[0], backgroundColor: profile.brandColors[0] + "15" }}>
          <User size={20} style={{ color: profile.brandColors[0] }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-bold text-gray-900 block" style={{ fontFamily: pairing.display }}>
          {profile.username || "username"}
        </span>
        {profile.bio && (
          <span className="text-[9px] text-gray-500 block leading-tight mt-0.5 truncate" style={{ fontFamily: pairing.body }}>
            {profile.bio}
          </span>
        )}
        <div className="flex gap-3 mt-1.5">
          {["Posts", "Followers", "Following"].map(l => (
            <div key={l} className="text-center">
              <span className="text-[9px] font-bold text-gray-900 block">—</span>
              <span className="text-[8px] text-gray-400">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IPhoneMockup({ posts, viewMode, onSelectPost, onReorder, profile }: {
  posts: FeedPost[];
  viewMode: "instagram" | "tiktok";
  onSelectPost: (id: string) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  profile: StudioProfile;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const filtered = posts
    .filter(p => p.platform === viewMode)
    .sort((a, b) => a.order - b.order);

  const phoneW = 280;
  const phoneH = 560;
  const gridGap = 2;
  const tileSize = viewMode === "instagram" ? Math.floor((phoneW - 32 - gridGap * 2) / 3) : phoneW - 32;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative bg-black rounded-[36px] p-[10px] shadow-2xl"
        style={{ width: phoneW + 20, height: phoneH + 20 }}
      >
        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[100px] h-[24px] bg-black rounded-b-2xl z-10" />
        <div
          className="bg-white rounded-[26px] overflow-hidden flex flex-col"
          style={{ width: phoneW, height: phoneH }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <span className="text-[10px] font-semibold text-gray-900">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-2 bg-gray-900 rounded-sm" />
              <div className="w-3 h-2 bg-gray-900 rounded-sm" />
              <div className="w-4 h-2 bg-gray-900 rounded-sm" />
            </div>
          </div>

          {/* App header */}
          <div className="px-4 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-900">
              {viewMode === "instagram" ? "Instagram" : "TikTok"}
            </span>
          </div>

          {/* Profile header */}
          <ProfileHeader profile={profile} viewMode={viewMode} />

          {/* Content area */}
          <div className="flex-1 overflow-auto p-4">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-300 text-xs">
                No posts yet
              </div>
            ) : viewMode === "instagram" ? (
              <div
                className="grid gap-[2px]"
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                {filtered.map((post, idx) => (
                  <div
                    key={post.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={() => {
                      if (dragIdx !== null && dragIdx !== idx) onReorder(dragIdx, idx);
                      setDragIdx(null);
                    }}
                    onDragEnd={() => setDragIdx(null)}
                    className={`cursor-grab active:cursor-grabbing transition-opacity ${dragIdx === idx ? "opacity-40" : ""}`}
                  >
                    <TilePreview post={post} size={tileSize} onClick={() => onSelectPost(post.id)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((post, idx) => (
                  <div
                    key={post.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={() => {
                      if (dragIdx !== null && dragIdx !== idx) onReorder(dragIdx, idx);
                      setDragIdx(null);
                    }}
                    onDragEnd={() => setDragIdx(null)}
                    className={`cursor-grab active:cursor-grabbing transition-opacity ${dragIdx === idx ? "opacity-40" : ""}`}
                  >
                    <TilePreview post={post} size={tileSize} onClick={() => onSelectPost(post.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarStrip({ posts, viewMode, weekStart, onNavigate }: {
  posts: FeedPost[];
  viewMode: "instagram" | "tiktok";
  weekStart: Date;
  onNavigate: (dir: -1 | 1) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const filtered = posts.filter(p => p.platform === viewMode);

  return (
    <div className="flex items-center gap-1 mt-4">
      <button onClick={() => onNavigate(-1)} className="p-1 text-gray-400 hover:text-gray-700">
        <ChevronLeft size={14} />
      </button>
      <div className="flex gap-1 flex-1 justify-center">
        {days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const count = filtered.filter(p => p.scheduledDate === dateStr).length;
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={dateStr}
              className={`flex flex-col items-center px-2 py-1 rounded-lg text-[10px] ${isToday ? "bg-gray-900 text-white" : "text-gray-500"}`}
            >
              <span className="font-medium">{format(day, "EEE")}</span>
              <span>{format(day, "d")}</span>
              {count > 0 && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday ? "bg-white" : "bg-gray-900"}`} />
              )}
            </div>
          );
        })}
      </div>
      <button onClick={() => onNavigate(1)} className="p-1 text-gray-400 hover:text-gray-700">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default function VisualContentStudio({ feedPosts, setFeedPosts, studioProfile, setStudioProfile }: Props) {
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");
  const [bgColor, setBgColor] = useState("#F3F4F6");
  const [accentColor, setAccentColor] = useState("#111827");
  const [fontFamily, setFontFamily] = useState(FONTS[0]);
  const [imageData, setImageData] = useState<string | undefined>();
  const [caption, setCaption] = useState("");
  const [schedDate, setSchedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [schedTime, setSchedTime] = useState("12:00");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"instagram" | "tiktok">("instagram");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [profileOpen, setProfileOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleProfilePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setStudioProfile(prev => ({ ...prev, profilePhoto: reader.result as string }));
    reader.readAsDataURL(file);
  }, [setStudioProfile]);

  const handleAddToFeed = useCallback(() => {
    if (editingId) {
      setFeedPosts(prev => prev.map(p =>
        p.id === editingId
          ? { ...p, platform, backgroundColor: bgColor, accentColor, fontFamily, imageData, caption, scheduledDate: schedDate, scheduledTime: schedTime }
          : p
      ));
      setEditingId(null);
    } else {
      const maxOrder = feedPosts.filter(p => p.platform === platform).reduce((m, p) => Math.max(m, p.order), -1);
      const newPost: FeedPost = {
        id: crypto.randomUUID(),
        platform,
        backgroundColor: bgColor,
        accentColor,
        fontFamily,
        imageData,
        caption,
        scheduledDate: schedDate,
        scheduledTime: schedTime,
        order: maxOrder + 1,
      };
      setFeedPosts(prev => [...prev, newPost]);
    }
    setCaption("");
    setImageData(undefined);
    if (fileRef.current) fileRef.current.value = "";
  }, [editingId, platform, bgColor, accentColor, fontFamily, imageData, caption, schedDate, schedTime, feedPosts, setFeedPosts]);

  const handleSelectPost = useCallback((id: string) => {
    const post = feedPosts.find(p => p.id === id);
    if (!post) return;
    setEditingId(id);
    setPlatform(post.platform);
    setBgColor(post.backgroundColor);
    setAccentColor(post.accentColor);
    setFontFamily(post.fontFamily);
    setImageData(post.imageData);
    setCaption(post.caption);
    setSchedDate(post.scheduledDate);
    setSchedTime(post.scheduledTime);
  }, [feedPosts]);

  const handleDeletePost = useCallback(() => {
    if (!editingId) return;
    setFeedPosts(prev => prev.filter(p => p.id !== editingId));
    setEditingId(null);
    setCaption("");
    setImageData(undefined);
  }, [editingId, setFeedPosts]);

  const handleReorder = useCallback((fromIdx: number, toIdx: number) => {
    const filtered = feedPosts.filter(p => p.platform === viewMode).sort((a, b) => a.order - b.order);
    const moved = filtered[fromIdx];
    if (!moved) return;
    const reordered = [...filtered];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updatedIds = new Map(reordered.map((p, i) => [p.id, i]));
    setFeedPosts(prev => prev.map(p => updatedIds.has(p.id) ? { ...p, order: updatedIds.get(p.id)! } : p));
  }, [feedPosts, viewMode, setFeedPosts]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setCaption("");
    setImageData(undefined);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const previewPost: FeedPost = {
    id: "preview",
    platform,
    backgroundColor: bgColor,
    accentColor,
    fontFamily,
    imageData,
    caption,
    scheduledDate: schedDate,
    scheduledTime: schedTime,
    order: -1,
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* LEFT PANEL */}
      <div className="w-[360px] shrink-0 border-r border-gray-100 overflow-auto">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Visual Content Studio</h2>
            <p className="text-[11px] text-gray-400">Design and schedule feed posts</p>
          </div>

          {/* Collapsible Profile & Theme Settings */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-700">Profile &amp; Theme Settings</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            {profileOpen && (
              <div className="p-4 space-y-4 border-t border-gray-100">
                {/* Profile photo */}
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1.5">Profile Photo</label>
                  <div className="flex items-center gap-3">
                    {studioProfile.profilePhoto ? (
                      <img src={studioProfile.profilePhoto} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gray-200" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                        <User size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => profilePhotoRef.current?.click()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      >
                        <Upload size={11} /> Upload
                      </button>
                      {studioProfile.profilePhoto && (
                        <button
                          onClick={() => setStudioProfile(prev => ({ ...prev, profilePhoto: undefined }))}
                          className="text-[11px] text-red-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
                </div>

                {/* Username */}
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Username</label>
                  <input
                    value={studioProfile.username}
                    onChange={e => setStudioProfile(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="@yourhandle"
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Bio</label>
                  <textarea
                    value={studioProfile.bio}
                    onChange={e => setStudioProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell people about yourself..."
                    rows={2}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:border-gray-400"
                  />
                </div>

                {/* Brand colors */}
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1.5">Brand Colors (3)</label>
                  <div className="flex gap-3">
                    {studioProfile.brandColors.map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <input
                          type="color"
                          value={color}
                          onChange={e => {
                            const next = [...studioProfile.brandColors] as [string, string, string];
                            next[i] = e.target.value;
                            setStudioProfile(prev => ({ ...prev, brandColors: next }));
                          }}
                          className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0"
                        />
                        <span className="text-[9px] text-gray-400">{i === 0 ? "Primary" : i === 1 ? "Secondary" : "Accent"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Font pairing */}
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Font Pairing</label>
                  <select
                    value={studioProfile.fontPairing}
                    onChange={e => setStudioProfile(prev => ({ ...prev, fontPairing: e.target.value }))}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
                  >
                    {Object.entries(FONT_PAIRINGS).map(([key, p]) => (
                      <option key={key} value={key} style={{ fontFamily: p.display }}>{p.label}</option>
                    ))}
                  </select>
                  {/* Preview */}
                  <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="block text-sm font-bold" style={{ fontFamily: FONT_PAIRINGS[studioProfile.fontPairing]?.display }}>
                      Display Font Preview
                    </span>
                    <span className="block text-[11px] text-gray-500 mt-0.5" style={{ fontFamily: FONT_PAIRINGS[studioProfile.fontPairing]?.body }}>
                      Body font preview — lorem ipsum dolor sit amet.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Platform switcher */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Platform</label>
            <div className="flex gap-2">
              {(["instagram", "tiktok"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    platform === p ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p === "instagram" ? <Instagram size={13} /> : <Smartphone size={13} />}
                  {p === "instagram" ? "Instagram" : "TikTok"}
                </button>
              ))}
            </div>
          </div>

          {/* Design toolbar */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Design</label>
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-500">Background</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-500">Accent</label>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Font</label>
                <select
                  value={fontFamily}
                  onChange={e => setFontFamily(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
                >
                  {FONTS.map(f => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{FONT_LABELS[f] || f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Image / Color Block</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    <Image size={13} /> Upload Image
                  </button>
                  {imageData && (
                    <button
                      onClick={() => { setImageData(undefined); if (fileRef.current) fileRef.current.value = ""; }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Preview</label>
            <div className="flex justify-center">
              <TilePreview post={previewPost} size={120} />
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Caption</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write your caption..."
              rows={3}
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:border-gray-400"
            />
          </div>

          {/* Scheduler */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Schedule</label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-gray-400 shrink-0" />
                <input
                  type="time"
                  value={schedTime}
                  onChange={e => setSchedTime(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAddToFeed}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              <Plus size={14} />
              {editingId ? "Update Post" : "Add to Feed"}
            </button>
            {editingId && (
              <>
                <button
                  onClick={handleDeletePost}
                  className="px-3 py-2 rounded-lg text-xs bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-2 rounded-lg text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-6 bg-gray-50/50">
        <div className="flex gap-2 mb-4">
          {(["instagram", "tiktok"] as const).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === v ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {v === "instagram" ? <Instagram size={13} /> : <Smartphone size={13} />}
              {v === "instagram" ? "Grid View" : "Feed View"}
            </button>
          ))}
        </div>

        <IPhoneMockup
          posts={feedPosts}
          viewMode={viewMode}
          onSelectPost={handleSelectPost}
          onReorder={handleReorder}
          profile={studioProfile}
        />

        <CalendarStrip
          posts={feedPosts}
          viewMode={viewMode}
          weekStart={weekStart}
          onNavigate={dir => setWeekStart(prev => dir === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1))}
        />
      </div>
    </div>
  );
}
