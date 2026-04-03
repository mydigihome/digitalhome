import { useState } from "react";
import { ExternalLink, Check, Clock, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const platforms = [
  {
    name: "YouTube",
    icon: "Y",
    color: "#DC2626",
    bg: "#FEF2F2",
    status: "ready" as const,
    description: "Connect via YouTube Data API v3",
    connectUrl: "https://console.cloud.google.com",
    instructions: "Get your API key from Google Cloud Console → YouTube Data API v3",
  },
  {
    name: "Instagram",
    icon: "IG",
    color: "#BE185D",
    bg: "#FDF2F8",
    status: "pending_review" as const,
    description: "Requires Meta app review approval",
    connectUrl: "https://developers.facebook.com",
    instructions: "Meta API review takes 1-2 weeks. Apply at developers.facebook.com",
  },
  {
    name: "TikTok",
    icon: "TK",
    color: "#065F46",
    bg: "#F0FDF4",
    status: "pending_review" as const,
    description: "Requires TikTok developer account",
    connectUrl: "https://developers.tiktok.com",
    instructions: "Register at TikTok for Developers",
  },
  {
    name: "Twitter / X",
    icon: "X",
    color: "#374151",
    bg: "#F9FAFB",
    status: "paid" as const,
    description: "$100/month API access required",
    connectUrl: "https://developer.twitter.com",
    instructions: "Requires paid Twitter API tier",
  },
  {
    name: "LinkedIn",
    icon: "LI",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    status: "limited" as const,
    description: "Limited API — profile only",
    connectUrl: "https://developer.linkedin.com",
    instructions: "LinkedIn API only returns your own profile, not page analytics",
  },
  {
    name: "Substack",
    icon: "SS",
    color: "#FF6719",
    bg: "#FFF7ED",
    status: "connected" as const,
    description: "Connected via email draft",
    connectUrl: null,
    instructions: "Configure in Settings → Connections",
  },
];

type PlatformStatus = "ready" | "pending_review" | "paid" | "limited" | "connected";

function StatusBadge({ status }: { status: PlatformStatus }) {
  switch (status) {
    case "connected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          <Check className="w-3 h-3" /> Connected
        </span>
      );
    case "pending_review":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
          <Clock className="w-3 h-3" /> Pending Review
        </span>
      );
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
          <DollarSign className="w-3 h-3" /> Paid Tier Required
        </span>
      );
    case "limited":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
          <AlertCircle className="w-3 h-3" /> Limited
        </span>
      );
    default:
      return null;
  }
}

export default function StudioPlatformsView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleConnect = (url: string | null, name: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      toast.info(`${name} is already configured`);
    }
  };

  return (
    <div className="space-y-4 max-w-[900px] mx-auto">
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
          Connect Your Platforms
        </h2>
        <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
          Link your social accounts to pull in analytics, followers, and engagement data.
        </p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)" }}>
        {platforms.map((platform) => {
          const expanded = expandedId === platform.name;
          return (
            <div
              key={platform.name}
              className="bg-card border border-border rounded-xl overflow-hidden transition-all"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <div className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: platform.bg, color: platform.color }}
                >
                  {platform.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{platform.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{platform.description}</p>
                </div>
                <div className="shrink-0">
                  {platform.status === "connected" ? (
                    <StatusBadge status="connected" />
                  ) : platform.status === "pending_review" ? (
                    <StatusBadge status="pending_review" />
                  ) : platform.status === "paid" ? (
                    <StatusBadge status="paid" />
                  ) : platform.status === "limited" ? (
                    <StatusBadge status="limited" />
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.connectUrl, platform.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: platform.color, fontFamily: "Inter, sans-serif" }}
                    >
                      Connect <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable instructions */}
              <button
                onClick={() => setExpandedId(expanded ? null : platform.name)}
                className="w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border text-left"
              >
                {expanded ? "Hide details ▲" : "Setup instructions ▼"}
              </button>

              {expanded && (
                <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed">
                  {platform.instructions}
                  {platform.connectUrl && (
                    <a
                      href={platform.connectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-primary hover:underline"
                    >
                      Open developer portal →
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
