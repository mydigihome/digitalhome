import { useRef, useCallback, DragEvent } from "react";
import { X, Upload, Image } from "lucide-react";
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

  const imgSrc = post.imageFile || post.imageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">Post Details</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Image */}
          {imgSrc ? (
            <div className="relative group">
              <img src={imgSrc} alt="" className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={() => onUpdate({ imageFile: undefined, imageUrl: "" })}
                className="absolute top-2 right-2 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-gray-50 transition-colors text-gray-400"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <Image size={24} className="mb-2" />
              <span className="text-xs">Drop image, click to upload, or paste URL below</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <input
                className="mt-2 w-3/4 px-3 py-1.5 text-xs bg-gray-50 outline-none text-center text-gray-500 rounded border border-gray-200"
                placeholder="Paste image URL..."
                onBlur={e => { if (e.target.value) onUpdate({ imageUrl: e.target.value }); }}
                onKeyDown={e => { if (e.key === "Enter") { onUpdate({ imageUrl: (e.target as HTMLInputElement).value }); } }}
              />
            </div>
          )}

          {/* Platform + Content Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 block">Platform</label>
              <select
                className="w-full text-sm bg-white outline-none text-gray-700 border border-gray-200 rounded-md px-3 py-2"
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
                  className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ background: getPlatformColor(setup.platforms, post.platform) }}
                >
                  {post.platform}
                </span>
              )}
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 block">Content Type</label>
              <select
                className="w-full text-sm bg-white outline-none text-gray-700 border border-gray-200 rounded-md px-3 py-2"
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
            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 block">Title / Hook</label>
            <AutoTextarea
              className="w-full text-sm bg-white outline-none text-gray-800 border border-gray-200 rounded-md px-3 py-2"
              value={post.title}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder="Enter title..."
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 block">Caption</label>
            <AutoTextarea
              className="w-full text-sm bg-white outline-none text-gray-600 border border-gray-200 rounded-md px-3 py-2 leading-relaxed"
              value={post.caption}
              onChange={e => onUpdate({ caption: e.target.value })}
              placeholder="Write caption..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-1 block">Status</label>
            <div className="flex items-center gap-2">
              <select
                className="text-sm bg-white outline-none text-gray-700 border border-gray-200 rounded-md px-3 py-2"
                value={post.status}
                onChange={e => onUpdate({ status: e.target.value })}
              >
                {setup.statuses.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
              </select>
              <span
                className="inline-block text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: getStatusColor(setup.statuses, post.status), color: "#374151" }}
              >
                {post.status}
              </span>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-2 block">Checklist</label>
            <div className="flex flex-wrap gap-2">
              {CHECKLIST_KEYS.map(k => (
                <label
                  key={k}
                  className="flex items-center gap-1.5 text-xs cursor-pointer px-2.5 py-1.5 rounded-md border transition-colors"
                  style={{
                    background: post.checklist[k] ? "#D4EDDA" : "white",
                    borderColor: post.checklist[k] ? "#86EFAC" : "#E5E7EB",
                    color: post.checklist[k] ? "#166534" : "#6B7280",
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
            <label className="text-[10px] uppercase font-semibold text-gray-400 mb-2 block">Analytics</label>
            <div className="grid grid-cols-4 gap-2">
              {(["views", "likes", "comments", "shares"] as const).map(k => (
                <div key={k}>
                  <div className="text-[10px] text-gray-400 mb-0.5 capitalize">{k}</div>
                  <input
                    className="w-full text-sm bg-gray-50 outline-none text-gray-700 border border-gray-200 rounded-md px-2 py-1.5 text-center"
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
