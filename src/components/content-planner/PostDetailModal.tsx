import { useRef, useCallback, useState, useEffect, DragEvent } from "react";
import { X, Upload, Image, Link2, Globe, Loader2 } from "lucide-react";
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

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function LinkPreviewCard({ url }: { url: string }) {
  const [data, setData] = useState<{ title?: string; image?: string; url?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.status === "success" && json.data) {
          setData({
            title: json.data.title,
            image: json.data.image?.url || json.data.logo?.url,
            url: json.data.url,
          });
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 text-[12px] text-gray-400" style={{ border: "1px solid #F0F0F0", borderRadius: 8 }}>
        <Loader2 size={14} className="animate-spin" /> Loading preview…
      </div>
    );
  }

  if (failed || !data) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 mt-2 px-3 py-2 hover:bg-gray-50 transition-all duration-150 no-underline"
        style={{ border: "1px solid #F0F0F0", borderRadius: 8 }}
      >
        <Link2 size={14} className="text-gray-400 shrink-0" />
        <span className="text-[13px] text-blue-600 truncate flex-1">{url}</span>
        <span className="text-[11px] text-gray-400 shrink-0">{getDomain(url)}</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 mt-2 overflow-hidden hover:bg-gray-50 transition-all duration-150 no-underline"
      style={{ border: "1px solid #F0F0F0", borderRadius: 8 }}
    >
      {data.image ? (
        <img src={data.image} alt="" className="w-12 h-12 object-cover shrink-0" style={{ borderRadius: "8px 0 0 8px" }} />
      ) : (
        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center shrink-0" style={{ borderRadius: "8px 0 0 8px" }}>
          <Globe size={16} className="text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0 py-1.5">
        <div className="text-[13px] font-medium text-gray-800 truncate">{data.title || getDomain(url)}</div>
      </div>
      <span className="text-[11px] text-gray-400 shrink-0 pr-3">{getDomain(url)}</span>
    </a>
  );
}

export default function PostDetailModal({ post, setup, onUpdate, onUpdateChecklist, onUpdateAnalytics, onDelete, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      onUpdate({ imageFile: e.target?.result as string, imageUrl: "" });
    };
    reader.readAsDataURL(file);
  }, [onUpdate]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleLinkPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text) {
      // Let the input update naturally, then trigger OG fetch via the value change
      setTimeout(() => onUpdate({ postLink: text }), 0);
    }
  }, [onUpdate]);

  const imgSrc = post.imageFile || post.imageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
        style={{ borderRadius: 16 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #F0F0F0" }}>
          <span className="text-[13px] font-semibold text-gray-800">Post Details</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="text-[11px] uppercase tracking-wide text-red-400 hover:text-red-600 transition-colors duration-150 font-medium"
            >
              Delete
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-150">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Image Upload */}
          {imgSrc ? (
            <div className="relative group">
              <img src={imgSrc} alt="" className="w-full h-48 object-cover" style={{ borderRadius: 12 }} />
              <button
                onClick={() => onUpdate({ imageFile: undefined, imageUrl: "" })}
                className="absolute top-2 right-2 bg-white/90 p-1 opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm"
                style={{ borderRadius: 8 }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-gray-50 transition-colors duration-150 text-gray-400"
              style={{ border: "2px dashed #E5E7EB", borderRadius: 12 }}
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <Image size={24} className="mb-2" />
              <span className="text-[12px]">Drop image, click to upload, or paste URL below</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <input
                className="mt-2 w-3/4 px-3 py-1.5 text-[12px] bg-gray-50 outline-none text-center text-gray-500 border"
                style={{ borderRadius: 8, borderColor: "#F0F0F0" }}
                placeholder="Paste image URL..."
                onBlur={e => { if (e.target.value) onUpdate({ imageUrl: e.target.value }); }}
                onKeyDown={e => { if (e.key === "Enter") { onUpdate({ imageUrl: (e.target as HTMLInputElement).value }); } }}
              />
            </div>
          )}

          {/* Post Link / URL — separate from image */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-gray-400 tracking-wider mb-1 block">Post Link / URL</label>
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-gray-400 shrink-0" />
              <input
                className="flex-1 text-[13px] bg-white outline-none text-gray-700 border px-3 py-2"
                style={{ borderRadius: 8, borderColor: "#F0F0F0" }}
                value={post.postLink || ""}
                onChange={e => onUpdate({ postLink: e.target.value })}
                onPaste={handleLinkPaste}
                placeholder="https://..."
              />
            </div>
            {post.postLink && <LinkPreviewCard url={post.postLink} />}
          </div>

          {/* Platform + Content Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-semibold text-gray-400 tracking-wider mb-1 block">Platform</label>
              <select
                className="w-full text-[13px] bg-white outline-none text-gray-700 border px-3 py-2"
                style={{ borderRadius: 8, borderColor: "#F0F0F0" }}
                value={post.platform}
                onChange={e => onUpdate({ platform: e.target.value })}
              >
                <option value="">Select...</option>
                {setup.platforms.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              {post.platform && (
                <span
                  className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 text-white"
                  style={{ background: getPlatformColor(setup.platforms, post.platform), borderRadius: 8 }}
                >
                  {post.platform}
                </span>
              )}
            </div>
            <div>
              <label className="text-[11px] uppercase font-semibold text-gray-400 tracking-wider mb-1 block">Content Type</label>
              <select
                className="w-full text-[13px] bg-white outline-none text-gray-700 border px-3 py-2"
                style={{ borderRadius: 8, borderColor: "#F0F0F0" }}
                value={post.contentType}
                onChange={e => onUpdate({ contentType: e.target.value })}
              >
                <option value="">Select...</option>
                {setup.contentFormats.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-gray-400 tracking-wider mb-1 block">Title / Hook</label>
            <AutoTextarea
              className="w-full text-[13px] bg-white outline-none text-gray-800 border px-3 py-2"
              style={{ borderRadius: 8, borderColor: "#F0F0F0" }}
              value={post.title}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder="Enter title..."
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-gray-400 tracking-wider mb-1 block">Caption</label>
            <AutoTextarea
              className="w-full text-[13px] bg-white outline-none text-gray-600 border px-3 py-2 leading-relaxed"
              style={{ borderRadius: 8, borderColor: "#F0F0F0" }}
              value={post.caption}
              onChange={e => onUpdate({ caption: e.target.value })}
              placeholder="Write caption..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-gray-400 tracking-wider mb-1 block">Status</label>
            <div className="flex items-center gap-2">
              <select
                className="text-[13px] bg-white outline-none text-gray-700 border px-3 py-2"
                style={{ borderRadius: 8, borderColor: "#F0F0F0" }}
                value={post.status}
                onChange={e => onUpdate({ status: e.target.value })}
              >
                {setup.statuses.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
              </select>
              <span
                className="inline-block text-[11px] font-semibold uppercase tracking-wide px-3 py-1"
                style={{ background: getStatusColor(setup.statuses, post.status), color: "#374151", borderRadius: 8 }}
              >
                {post.status}
              </span>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-gray-400 tracking-wider mb-2 block">Checklist</label>
            <div className="flex flex-wrap gap-2">
              {CHECKLIST_KEYS.map(k => (
                <label
                  key={k}
                  className="flex items-center gap-1.5 text-[12px] cursor-pointer px-3 py-1.5 border transition-all duration-150"
                  style={{
                    background: post.checklist[k] ? "#D4EDDA" : "white",
                    borderColor: post.checklist[k] ? "#86EFAC" : "#F0F0F0",
                    color: post.checklist[k] ? "#166534" : "#6B7280",
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={post.checklist[k]}
                    onChange={e => onUpdateChecklist(k, e.target.checked)}
                    className="sr-only"
                  />
                  <span className={post.checklist[k] ? "font-medium" : ""}>
                    {post.checklist[k] ? "✓" : "☐"} {k.charAt(0).toUpperCase() + k.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div>
            <label className="text-[11px] uppercase font-semibold text-gray-400 tracking-wider mb-2 block">Analytics</label>
            <div className="grid grid-cols-4 gap-2">
              {(["views", "likes", "comments", "shares"] as const).map(k => (
                <div key={k}>
                  <div className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wide">{k}</div>
                  <input
                    className="w-full text-[13px] bg-gray-50 outline-none text-gray-700 border px-2 py-1.5 text-center"
                    style={{ borderRadius: 8, borderColor: "#F0F0F0" }}
                    value={post.analytics[k]}
                    onChange={e => onUpdateAnalytics(k, e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
