import { useState } from "react";
import { Play, X, Minimize2, Maximize2 } from "lucide-react";
import { useOnboardingVideo, useVideoProgress, useDismissVideo } from "@/hooks/useOnboardingVideo";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingVideoCard() {
  const { user } = useAuth();
  const { data: video } = useOnboardingVideo();
  const { data: progress } = useVideoProgress(video?.id);
  const dismiss = useDismissVideo();
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (!video || !user || hidden || progress?.dismissed) return null;

  return (
    <div style={{
      position: "fixed", bottom: 88, right: 16, zIndex: 9000,
      width: expanded ? 440 : 280,
      background: "white", borderRadius: 16,
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      border: "1px solid #F3F4F6",
      overflow: "hidden",
      transition: "width 300ms ease",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#6366f1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Play size={13} color="white" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 160 }}>{video.title || "Welcome to Digital Home"}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, padding: 4, cursor: "pointer", display: "flex", alignItems: "center" }}>
            {expanded ? <Minimize2 size={12} color="white" /> : <Maximize2 size={12} color="white" />}
          </button>
          <button onClick={() => { dismiss.mutate(video.id); setHidden(true); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, padding: 4, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <X size={12} color="white" />
          </button>
        </div>
      </div>
      {expanded ? (
        <div style={{ width: "100%", aspectRatio: "16/9" as any, background: "#000" }}>
          <iframe
            src={video.video_url?.includes("youtube") ? video.video_url.replace("watch?v=", "embed/") : video.video_url}
            style={{ width: "100%", height: "100%", border: "none" }}
            allowFullScreen
            title="Welcome video"
          />
        </div>
      ) : (
        <div onClick={() => setExpanded(true)} style={{ padding: "12px 14px", cursor: "pointer" }}>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px" }}>Watch your welcome walkthrough to learn how to get the most out of Digital Home.</p>
          <button style={{ padding: "7px 16px", background: "#6366f1", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Watch Now</button>
        </div>
      )}
      <div style={{ padding: "8px 14px", borderTop: "1px solid #F3F4F6", textAlign: "center" as const }}>
        <button onClick={() => { dismiss.mutate(video.id); setHidden(true); }} style={{ fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}>Dismiss — I’ll watch this in Settings later</button>
      </div>
    </div>
  );
}
