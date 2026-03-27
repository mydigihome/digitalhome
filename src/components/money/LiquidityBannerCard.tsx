import { useRef } from "react";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMoneyPreferences } from "@/hooks/useMoneyPreferences";
import { toast } from "sonner";

export default function LiquidityBannerCard() {
  const { user } = useAuth();
  const { cardData, saveCardData } = useMoneyPreferences();
  const fileRef = useRef<HTMLInputElement>(null);

  const bannerUrl = cardData?.liquidity_banner_url || null;
  const fallbackGradient = "linear-gradient(135deg, #006c49, #4648d4)";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/liquidity-banner.jpg`;
    const { error } = await supabase.storage.from("user-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); return; }
    const { data } = supabase.storage.from("user-assets").getPublicUrl(path);
    saveCardData("liquidity_banner_url", data.publicUrl);
    toast.success("Banner image updated");
  };

  return (
    <div
      className="money-card"
      style={{ height: "120px", padding: 0, overflow: "hidden", position: "relative" }}
    >
      {bannerUrl ? (
        <img src={bannerUrl} alt="Liquidity banner" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", background: fallbackGradient }} />
      )}

      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 60%)" }} />

      {/* Text */}
      <div style={{ position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)" }}>
        <div style={{ fontWeight: 800, fontSize: "18px", color: "white" }}>Liquidity Sprints</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>Emergency fund · Tax vault</div>
      </div>

      {/* Camera button */}
      <button
        onClick={() => fileRef.current?.click()}
        style={{ position: "absolute", top: "12px", right: "12px", width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
        title="Change image"
      >
        <Camera className="w-4 h-4" style={{ color: "white" }} />
      </button>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}
