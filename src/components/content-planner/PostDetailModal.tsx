import { useRef, useCallback, useState, useEffect } from "react";
import { SetupData, PostEntry, getStatusColor, getPlatformColor } from "./types";
import AutoTextarea from "./AutoTextarea";

interface Props {
  post: PostEntry;
  setup: SetupData;
  onUpdate: (patch: Partial<PostEntry>) => void;
  onUpdateChecklist: (key: string, val: boolean) => void;
  onUpdateAnalytics: (key: string, val: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

const CHECKLIST_KEYS = ["script", "graphics", "filmed", "edited", "posted"] as const;

// ─── YouTube ID extractor ──────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || null;
  } catch { /* ignore */ }
  return null;
}

// ─── Link preview hook (YouTube-direct, microlink fallback) ────────────────
function useLinkPreview() {
  const [preview, setPreview] = useState<{ title: string; image: string | null; domain: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPreview = useCallback((url: string) => {
    if (!url || !url.startsWith("http")) { setPreview(null); return; }
    if (timerRef.current) clearTimeout(timerRef.current);

    // YouTube: extract video ID and build thumbnail URL directly
    const ytId = extractYouTubeId(url);
    if (ytId) {
      setPreview({
        title: "YouTube Video",
        image: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
        domain: "youtube.com",
      });
      return;
    }

    // Non-YouTube: debounced microlink
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (json.status === "success") {
          setPreview({
            title: json.data.title || url,
            image: json.data.image?.url || json.data.logo?.url || null,
            domain: new URL(url).hostname.replace("www.", ""),
          });
        } else {
          setPreview({ title: url, image: null, domain: new URL(url).hostname.replace("www.", "") });
        }
      } catch {
        setPreview({ title: url, image: null, domain: "" });
      }
      setLoading(false);
    }, 600);
  }, []);

  return { preview, loading, fetchPreview };
}

// ─── Link Preview Bar ──────────────────────────────────────────────────────
function LinkPreviewBar({ preview, loading, url }: {
  preview: { title: string; image: string | null; domain: string } | null;
  loading: boolean;
  url: string;
}) {
  if (!url) return null;
  return (
    <div
      className="flex items-center gap-2.5 mt-2"
      style={{ border: "1px solid #EBEBEB", borderRadius: 8, padding: "8px 10px", background: "#FAFAFA", minHeight: 56 }}
    >
      {loading ? (
        <span className="text-[12px] text-gray-400">Fetching preview…</span>
      ) : preview ? (
        <>
          {preview.image && (
            <img src={preview.image} alt="" className="shrink-0" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-gray-800 truncate">{preview.title}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{preview.domain}</div>
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="text-[11px] text-gray-500 underline shrink-0">Open ↗</a>
        </>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" className="text-[12px] text-gray-500 underline">{url}</a>
      )}
    </div>
  );
}

// ─── Post Detail Modal ─────────────────────────────────────────────────────
export default function PostDetailModal({ post, setup, onUpdate, onUpdateChecklist, onUpdateAnalytics, onDelete, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { preview, loading, fetchPreview } = useLinkPreview();

  // Store link thumbnail separately so it can be used on the card
  const [linkThumb, setLinkThumb] = useState<string | null>(null);

  // Auto-fetch preview when modal opens with existing link
  useEffect(() => {
    if (post.postLink) fetchPreview(post.postLink);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When preview changes, store the thumbnail on the post so the card can use it
  useEffect(() => {
    if (preview?.image && preview.image !== linkThumb) {
      setLinkThumb(preview.image);
      // Persist the link thumbnail to the post data so PostCard can display it
      onUpdate({ imageUrl: post.imageFile ? post.imageUrl : preview.image });
    }
  }, [preview]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => onUpdate({ imageFile: e.target?.result as string });
    reader.readAsDataURL(file);
  }, [onUpdate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const imgSrc = post.imageFile || post.imageUrl;

  const labelStyle = "text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block";
  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #EBEBEB", borderRadius: 8,
    padding: "8px 10px", fontSize: 13, fontFamily: "inherit",
    background: "#FAFAFA", color: "#111", boxSizing: "border-box" as const,
  };
  const selectStyle: React.CSSProperties = {
    border: "1px solid #EBEBEB", borderRadius: 8, padding: "6px 10px",
    fontSize: 12, background: "#FAFAFA", color: "#111", width: "100%",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <div
        className="bg-white w-full max-h-[88vh] overflow-y-auto mx-4"
        style={{ borderRadius: 16, maxWidth: 520, padding: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <span className="text-[15px] font-bold text-gray-900">Post Details</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none bg-transparent border-none cursor-pointer">×</button>
        </div>

        {/* IMAGE UPLOAD — 16:9 drag-and-drop zone */}
        <label className={labelStyle}>Image</label>
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !post.imageFile && fileRef.current?.click()}
          className="w-full overflow-hidden flex items-center justify-center mb-2 relative"
          style={{
            aspectRatio: "16/9", borderRadius: 12,
            border: post.imageFile ? "none" : "2px dashed #DDD",
            background: post.imageFile ? "transparent" : "#F8F8F8",
            cursor: post.imageFile ? "default" : "pointer",
          }}
        >
          {post.imageFile ? (
            <>
              <img src={post.imageFile} alt="" className="w-full h-full object-cover" />
              <button
                onClick={e => { e.stopPropagation(); onUpdate({ imageFile: undefined, imageUrl: preview?.image || "" }); }}
                className="absolute top-2 right-2 text-white cursor-pointer text-base leading-none"
                style={{ background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 28, height: 28 }}
              >×</button>
            </>
          ) : (
            <div className="text-center text-gray-400">
              <div className="text-[28px] mb-1.5">📷</div>
              <div className="text-[12px]">Drop image or click to upload</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {post.imageFile && (
          <button onClick={() => fileRef.current?.click()} className="text-[11px] text-gray-400 bg-transparent border-none cursor-pointer underline mb-3">
            Change image
          </button>
        )}

        {/* POST LINK */}
        <label className={labelStyle} style={{ marginTop: 12 }}>Post Link / URL</label>
        <input
          type="url"
          placeholder="https://..."
          value={post.postLink || ""}
          onChange={e => { onUpdate({ postLink: e.target.value }); fetchPreview(e.target.value); }}
          style={{ ...inputStyle, minHeight: "auto" }}
        />
        <LinkPreviewBar preview={preview} loading={loading} url={post.postLink || ""} />

        {/* PLATFORM + STATUS */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className={labelStyle}>Platform</label>
            <select value={post.platform} onChange={e => onUpdate({ platform: e.target.value })} style={selectStyle}>
              <option value="">Select…</option>
              {setup.platforms.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelStyle}>Status</label>
            <select value={post.status} onChange={e => onUpdate({ status: e.target.value })} style={selectStyle}>
              <option value="">Select…</option>
              {setup.statuses.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* CONTENT TYPE */}
        <div className="mt-3.5">
          <label className={labelStyle}>Content Type</label>
          <select value={post.contentType} onChange={e => onUpdate({ contentType: e.target.value })} style={selectStyle}>
            <option value="">Select…</option>
            {setup.contentFormats.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* TITLE */}
        <div className="mt-3.5">
          <label className={labelStyle}>Title / Hook</label>
          <AutoTextarea
            value={post.title}
            onChange={e => onUpdate({ title: e.target.value })}
            placeholder="What's the hook?"
            className="w-full text-[13px] outline-none"
            style={{ ...inputStyle, resize: "none", overflow: "hidden" }}
          />
        </div>

        {/* CAPTION */}
        <div className="mt-3.5">
          <label className={labelStyle}>Caption</label>
          <AutoTextarea
            value={post.caption}
            onChange={e => onUpdate({ caption: e.target.value })}
            placeholder="Write your full caption here — no limit…"
            className="w-full text-[13px] outline-none"
            style={{ ...inputStyle, resize: "none", overflow: "hidden", minHeight: 100 }}
          />
        </div>

        {/* CHECKLIST */}
        <div className="mt-3.5">
          <label className={labelStyle}>Checklist</label>
          <div className="flex flex-wrap gap-2">
            {CHECKLIST_KEYS.map(k => (
              <label
                key={k}
                className="flex items-center gap-1.5 text-[12px] cursor-pointer px-3 py-1 transition-colors duration-150"
                style={{
                  background: post.checklist[k] ? "#D4EDDA" : "#F4F4F4",
                  borderRadius: 20,
                }}
              >
                <input
                  type="checkbox"
                  checked={post.checklist[k]}
                  onChange={e => onUpdateChecklist(k, e.target.checked)}
                  style={{ accentColor: "#2ECC71" }}
                />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* ANALYTICS */}
        <div className="mt-3.5">
          <label className={labelStyle}>Analytics</label>
          <div className="grid grid-cols-4 gap-2">
            {(["views", "likes", "comments", "shares"] as const).map(k => (
              <div key={k}>
                <div className="text-[10px] text-gray-400 mb-0.5">{k.charAt(0).toUpperCase() + k.slice(1)}</div>
                <input
                  type="number"
                  value={post.analytics[k]}
                  onChange={e => onUpdateAnalytics(k, e.target.value)}
                  placeholder="0"
                  className="text-center"
                  style={{ ...inputStyle, minHeight: "auto" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="cursor-pointer text-[13px]"
            style={{ background: "none", border: "1px solid #FFD0D0", borderRadius: 8, color: "#E55", padding: "8px 16px" }}
          >Delete Post</button>
          <button
            onClick={onClose}
            className="cursor-pointer text-[13px] font-semibold text-white"
            style={{ background: "#111", border: "none", borderRadius: 8, padding: "8px 20px" }}
          >Done</button>
        </div>
      </div>
    </div>
  );
}
