import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Lock } from "lucide-react";

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
  /** If true, blur children and overlay. If false (default), replace children entirely. */
  blur?: boolean;
  className?: string;
}

export function usePremiumStatus() {
  const { profile } = useAuth();
  const { data: prefs } = useUserPreferences();
  const isFoundingMember = profile?.founding_member === true;
  const isSubscribed = prefs?.is_subscribed === true;
  return { isPremium: isFoundingMember || isSubscribed, isFoundingMember, isSubscribed };
}

export default function PremiumGate({ feature, children, blur = true, className = "" }: PremiumGateProps) {
  const navigate = useNavigate();
  const { isPremium } = usePremiumStatus();

  if (isPremium) return <>{children}</>;

  if (!blur) {
    return (
      <div className={`relative flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <Lock style={{ color: "#6366f1", width: 28, height: 28, marginBottom: 12 }} />
        <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", margin: 0 }}>
          {feature} is a premium feature.
        </p>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Upgrade to unlock everything.
        </p>
        <button
          onClick={() => navigate("/settings?tab=billing")}
          style={{
            background: "#6366f1",
            color: "#ffffff",
            borderRadius: 9999,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            marginTop: 16,
          }}
        >
          Upgrade to Premium
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div style={{ filter: "blur(4px)", pointerEvents: "none" }}>{children}</div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(4px)",
          borderRadius: 20,
          padding: 24,
          textAlign: "center",
          zIndex: 5,
        }}
      >
        <Lock style={{ color: "#6366f1", width: 28, height: 28, marginBottom: 12 }} />
        <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", margin: 0 }}>
          {feature} is a premium feature.
        </p>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Upgrade to unlock everything.
        </p>
        <button
          onClick={() => navigate("/settings?tab=billing")}
          style={{
            background: "#6366f1",
            color: "#ffffff",
            borderRadius: 9999,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            marginTop: 16,
          }}
        >
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
}
