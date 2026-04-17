import { useState } from "react";
import { Upload, Video, Loader2 } from "lucide-react";
import { useOnboardingVideo, useUploadOnboardingVideo } from "@/hooks/useOnboardingVideo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminVideoUpload() {
  const { data: currentVideo } = useOnboardingVideo();
  const uploadVideo = useUploadOnboardingVideo();
  const [title, setTitle] = useState("Welcome to Digital Home");
  const [urlInput, setUrlInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"url" | "file">("url");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (mode === "url" && !urlInput.trim()) { toast.error("Enter a video URL"); return; }
    if (mode === "file" && !file) { toast.error("Select a video file"); return; }
    setUploading(true);
    try {
      if (mode === "file" && file) {
        await uploadVideo.mutateAsync({ file, title });
      } else {
        await (supabase as any).from("onboarding_video").update({ is_active: false }).eq("is_active", true);
        await (supabase as any).from("onboarding_video").insert({ video_url: urlInput.trim(), title, is_active: true });
      }
      toast.success("Onboarding video updated! All new users will see it.");
      setUrlInput(""); setFile(null);
    } catch (err: any) { toast.error("Failed: " + err.message); }
    setUploading(false);
  };

  return (
    <div style={{ background: "white", border: "1px solid #F3F4F6", borderRadius: 14, padding: 20, fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Video size={16} color="#6366f1" />
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Onboarding Video</span>
        {currentVideo && <span style={{ fontSize: 11, color: "#10B981", background: "#F0FDF4", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>Active</span>}
      </div>

      {currentVideo && (
        <div style={{ padding: "10px 14px", background: "#F9FAFB", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#374151" }}>
          <strong>{currentVideo.title}</strong><br />
          <span style={{ fontSize: 11, color: "#6B7280", wordBreak: "break-all" as const }}>{currentVideo.video_url}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["url", "file"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${mode === m ? "#6366f1" : "#E5E7EB"}`, background: mode === m ? "#EEF2FF" : "white", color: mode === m ? "#6366f1" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {m === "url" ? "YouTube / URL" : "Upload File"}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
      </div>

      {mode === "url" ? (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Video URL</label>
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Video File (MP4, MOV)</label>
          <input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
      )}

      <button onClick={handleSubmit} disabled={uploading} style={{ padding: "10px 20px", background: "#6366f1", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: uploading ? 0.7 : 1 }}>
        {uploading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Upload size={14} /> Save Video</>}
      </button>
    </div>
  );
}
