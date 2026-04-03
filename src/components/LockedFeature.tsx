import { Check, ExternalLink, Clapperboard, FileText, TrendingUp, Building2 } from "lucide-react";
import { STRIPE_LINKS, openStripeLink } from "@/lib/stripe";

interface LockedFeatureProps {
  feature: "studio" | "templates" | "investing" | "plaid";
  children: React.ReactNode;
}

const featureConfig = {
  studio: {
    title: "Studio",
    description: "Your creator headquarters. Content pipeline, collaboration, platform analytics and more.",
    price: "$29.99 one-time",
    stripeUrl: STRIPE_LINKS.studio_addon,
    icon: Clapperboard,
    color: "#7B5EA7",
    bg: "#F5F3FF",
    features: [
      "Full Studio HQ",
      "Content pipeline (8 stages)",
      "Invite your editor",
      "Real-time collaboration",
      "Platform analytics",
      "Brand document storage",
    ],
  },
  templates: {
    title: "Templates",
    description: "Done-for-you application templates for jobs, grants, and opportunities.",
    price: "$8 single · $25 bundle",
    stripeUrl: null as string | null,
    icon: FileText,
    color: "#3B82F6",
    bg: "#EFF6FF",
    features: [
      "Job application templates",
      "Grant application templates",
      "Cover letter templates",
      "Follow-up email templates",
    ],
  },
  investing: {
    title: "Investing",
    description: "AI trading plans, market terminal, and broker connect.",
    price: "Included in Pro",
    stripeUrl: STRIPE_LINKS.standard_monthly,
    icon: TrendingUp,
    color: "#10B981",
    bg: "#F0FDF4",
    features: [
      "AI trading plans",
      "Live market terminal",
      "Broker connect",
      "Watchlist tracking",
    ],
  },
  plaid: {
    title: "Bank Sync",
    description: "Connect your bank accounts to automatically track spending and net worth.",
    price: "Included in Standard",
    stripeUrl: STRIPE_LINKS.standard_monthly,
    icon: Building2,
    color: "#3B82F6",
    bg: "#EFF6FF",
    features: [
      "Automatic transaction sync",
      "Net worth tracking",
      "Spending categories",
      "Bill detection",
    ],
  },
};

export default function LockedFeature({ feature, children }: LockedFeatureProps) {
  const config = featureConfig[feature];
  const Icon = config.icon;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "380px",
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: config.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon size={28} color={config.color} />
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
            Unlock {config.title}
          </h3>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 20px", lineHeight: 1.5 }}>
            {config.description}
          </p>

          <div style={{ textAlign: "left", marginBottom: 20 }}>
            {config.features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Check size={14} color={config.color} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
            {config.price}
          </p>

          {feature === "templates" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => openStripeLink(STRIPE_LINKS.template_single)}
                style={{
                  flex: 1,
                  padding: "11px 20px",
                  background: config.color,
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Single — $8
              </button>
              <button
                onClick={() => openStripeLink(STRIPE_LINKS.template_bundle)}
                style={{
                  flex: 1,
                  padding: "11px 20px",
                  background: "#111827",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Bundle — $25
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (config.stripeUrl) openStripeLink(config.stripeUrl);
              }}
              style={{
                width: "100%",
                padding: 13,
                background: config.color,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ExternalLink size={16} />
              Unlock {config.title}
            </button>
          )}

          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 12 }}>
            {feature === "studio" || feature === "templates"
              ? "One-time payment · Yours forever"
              : "Upgrade your plan to access"}
          </p>
        </div>
      </div>
    </div>
  );
}
