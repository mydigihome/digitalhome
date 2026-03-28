import { useRef } from "react";
import { Camera } from "lucide-react";
import defaultLiquidityBanner from "@/assets/liquidity-banner-default.jpg";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";
import { useMoneyPreferences } from "@/hooks/useMoneyPreferences";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function SegmentBar({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div className="flex gap-1 h-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`flex-1 ${i === 0 ? "rounded-l-full" : ""} ${i === total - 1 ? "rounded-r-full" : ""}`}
          style={{ background: i < filled ? color : "#e8e8ed" }}
        />
      ))}
    </div>
  );
}

export function EmergencyFundFront() {
  const { user } = useAuth();
  const { cardData, saveCardData } = useMoneyPreferences();
  const fileRef = useRef<HTMLInputElement>(null);

  const bannerUrl = cardData?.liquidity_banner_url || defaultLiquidityBanner;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/liquidity-banner.jpg`;
    const { error } = await supabase.storage.from("user-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("user-assets").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    saveCardData("liquidity_banner_url", url);
    toast.success("Image updated");
  };

  return (
    <div>
      {/* Banner image strip */}
      <div
        style={{
          width: "calc(100% + 48px)",
          height: "88px",
          position: "relative",
          marginTop: "-24px",
          marginLeft: "-24px",
          marginBottom: "16px",
          borderRadius: "24px 24px 0 0",
          overflow: "hidden",
        }}
      >
        <img src={bannerUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 100%)" }} />
        <button
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          style={{
            position: "absolute", top: 8, right: 8, width: 28, height: 28,
            borderRadius: "50%", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "white",
          }}
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Liquidity Sprints</h3>
        <span className="material-symbols-outlined text-lg" style={{ color: "#6366f1" }}>bolt</span>
      </div>

      {/* Emergency Fund */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm" style={{ color: "#1a1c1f" }}>Emergency Fund</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: "#767586" }}>Target: $13,500</span>
            <span className="font-bold text-sm" style={{ color: "#1a1c1f" }}>59%</span>
          </div>
        </div>
        <p className="text-3xl font-extrabold tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>$8,000</p>
        <p className="text-xs mb-3" style={{ color: "#767586" }}>3 months of expenses covered</p>
        <SegmentBar filled={3} total={5} color="#6366f1" />
        <p className="text-xs font-bold mt-2" style={{ color: "#006c49" }}>Fully funded in 11 months at $500/month</p>
        <p className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: "#6366f1" }}>Completion: Nov 2024</p>
      </div>

      <div className="mt-3 h-px" style={{ background: "#f3f3f8" }} />

      {/* Tax Vault */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm" style={{ color: "#1a1c1f" }}>Q4 Tax Vault</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: "#767586" }}>Target: $22,000</span>
            <span className="font-bold text-sm" style={{ color: "#1a1c1f" }}>45%</span>
          </div>
        </div>
        <p className="text-3xl font-extrabold tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>$9,900</p>
        <SegmentBar filled={2} total={5} color="#6cf8bb" />
        <p className="text-[9px] font-bold uppercase mt-2" style={{ color: "#006c49" }}>Active Sprint</p>
      </div>

      <div className="rounded-[16px] p-3 mt-3" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "#464554" }}>
          <span className="font-bold" style={{ color: "#6366f1" }}>✦</span> Increase monthly transfer by $400 to hit tax goal 12 days early.
        </p>
      </div>
    </div>
  );
}

export function EmergencyFundBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Funds</h3>
      <div><EditLabel>Emergency Fund Current</EditLabel><EditInput value="8000" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Emergency Fund Target</EditLabel><EditInput value="13500" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Monthly Contribution</EditLabel><EditInput value="500" onChange={() => {}} type="number" /></div>
      <div className="h-px" style={{ background: "#f3f3f8" }} />
      <div><EditLabel>Tax Vault Current</EditLabel><EditInput value="9900" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Tax Vault Target</EditLabel><EditInput value="22000" onChange={() => {}} type="number" /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
