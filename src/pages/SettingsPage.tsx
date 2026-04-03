import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useArchivedProjects, useRestoreProject } from "@/hooks/useArchivedProjects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  User, Moon, Sun, Check, Building2, FileText, TrendingUp,
  Bell, ExternalLink, Archive, HelpCircle, ChevronRight,
  Heart, BookOpen, MapPin, RotateCcw, Mail, MessageSquare,
  ChevronLeft, Loader2, Save, BarChart2, Trash2, CalendarDays, Plus, X,
  Lock as LockIcon, Clapperboard, GraduationCap,
} from "lucide-react";

const ACCENT_THEMES = [
  { name: "Emerald", primary: "#10B981", secondary: "#7B5EA7", label: "Default" },
  { name: "Ocean", primary: "#3B82F6", secondary: "#06B6D4", label: "Ocean" },
  { name: "Sunset", primary: "#F59E0B", secondary: "#EF4444", label: "Sunset" },
  { name: "Rose", primary: "#EC4899", secondary: "#7B5EA7", label: "Rose" },
  { name: "Slate", primary: "#6366F1", secondary: "#8B5CF6", label: "Violet" },
  { name: "Minimal", primary: "#374151", secondary: "#6B7280", label: "Minimal" },
];

const BILLING_PLANS = [
  {
    tier: "founding", name: "Founding Member", badge: "🏆 First 50 Only",
    monthlyPrice: 7, annualPrice: 49, monthlyPerYear: 84, annualMonthly: 4,
    color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A",
    description: "Locked forever · Never increases · First 50 users only",
    features: ["✦ Everything in Standard", "✦ Price locked forever at $7/mo", "✦ Founding Member gold badge", "✦ Direct line to the founder", "✦ First access to every new feature", "✦ Your name in the founding members wall"],
    stripeMonthly: "PASTE_FOUNDING_MONTHLY_LINK", stripeAnnual: "PASTE_FOUNDING_ANNUAL_LINK", limited: true,
  },
  {
    tier: "standard", name: "Standard", badge: "⭐ Full Platform Access",
    monthlyPrice: 12, annualPrice: 99, monthlyPerYear: 144, annualMonthly: 8,
    color: "#10B981", bg: "#F0FDF4", border: "#BBF7D0",
    description: "Complete access to everything we built. No feature locks.",
    features: ["Dashboard — all widgets + market watch", "Journal unlimited + voice + Substack", "Projects unlimited + AI stages", "Contacts unlimited + import + CRM", "Money — full finance suite", "Content Planner", "Monthly Review", "Notifications + settings", "Resource Center"],
    stripeMonthly: "PASTE_STANDARD_MONTHLY_LINK", stripeAnnual: "PASTE_STANDARD_ANNUAL_LINK",
  },
];

const BROKERS: { name: string; url: string }[] = [
  { name: "Robinhood", url: "https://robinhood.com" },
  { name: "Webull", url: "https://webull.com" },
  { name: "TopStep", url: "https://topstep.com" },
  { name: "IBKR", url: "https://interactivebrokers.com" },
  { name: "E*Trade", url: "https://etrade.com" },
  { name: "Fidelity", url: "https://fidelity.com" },
  { name: "TD Ameritrade", url: "https://tdameritrade.com" },
  { name: "Schwab", url: "https://schwab.com" },
];

const RELIGIONS = [
  { value: "", label: "None" },
  { value: "christianity", label: "Christianity" },
  { value: "islam", label: "Islam" },
  { value: "judaism", label: "Judaism" },
  { value: "hinduism", label: "Hinduism" },
  { value: "buddhism", label: "Buddhism" },
];

const FAQ_ITEMS = [
  { q: "How do I connect my bank?", a: "Go to Settings → Connections → Plaid. Bank connection requires Plaid setup. Contact support to enable it for your account." },
  { q: "How does AI stage generation work?", a: "When you create an event project, our AI automatically generates preparation stages and tasks based on your event type and details." },
  { q: "How do I invite a studio editor?", a: "Go to your Studio page and click the 'Invite' button. Enter your collaborator's email to send them an invitation." },
  { q: "How do I export my journal?", a: "Open any journal entry and use the share/export option. You can also connect Substack in Settings to auto-publish drafts." },
  { q: "How do I change my plan?", a: "Go to Settings → Plan & Billing and select the plan you want. Upgrades take effect immediately." },
];

function hexToHsl(hex: string): string {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const { data: archivedProjects = [] } = useArchivedProjects();
  const restoreProject = useRestoreProject();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isDark = document.documentElement.classList.contains("dark");

  const [profileData, setProfileData] = useState({ full_name: "", handle: "", email: "", location: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(isDark);
  const [selectedTheme, setSelectedTheme] = useState("Emerald");
  const [currentPlan, setCurrentPlan] = useState("standard");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [annualLocked, setAnnualLocked] = useState(false);
  const [renewalDate, setRenewalDate] = useState<string | null>(null);
  const [studioUnlocked, setStudioUnlocked] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [eduEmail, setEduEmail] = useState("");
  const [substackModalOpen, setSubstackModalOpen] = useState(false);
  const [substackEmail, setSubstackEmail] = useState("");
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);
  const [preferredBroker, setPreferredBroker] = useState("");
  const [brokerUrl, setBrokerUrl] = useState("");
  const [plaidModalOpen, setPlaidModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedReligion, setSelectedReligion] = useState("");
  const [showScripture, setShowScripture] = useState(false);
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [feedbackType, setFeedbackType] = useState("General Feedback");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Monthly Review state
  const [writingReview, setWritingReview] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [reviewMonth, setReviewMonth] = useState(new Date().getMonth() + 1);
  const [reviewYear, setReviewYear] = useState(new Date().getFullYear());
  const [reviewData, setReviewData] = useState({ went_well: "", was_hard: "", proud_of: "", do_differently: "", focus_word: "" });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [savedReviews, setSavedReviews] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfileData({
        full_name: profile?.full_name || user?.user_metadata?.full_name || "",
        handle: (profile as any)?.handle || "",
        email: user?.email || "",
        location: (profile as any)?.location || "",
      });
      setAvatarUrl((profile as any)?.avatar_url || user?.user_metadata?.avatar_url || null);
    })();
  }, [user]);

  // Load preferences
  useEffect(() => {
    if (!prefs) return;
    const p = prefs as any;
    if (p.sidebar_theme === "dark") setIsDarkMode(true);
    if (p.theme_color) {
      const match = ACCENT_THEMES.find(t => t.primary === p.theme_color);
      if (match) setSelectedTheme(match.name);
    }
    if (p.religion) setSelectedReligion(p.religion);
    if (p.show_scripture_card) setShowScripture(true);
    if (p.preferred_broker) setPreferredBroker(p.preferred_broker);
    if (p.broker_url) setBrokerUrl(p.broker_url);
    if (p.welcome_video_url) setWelcomeVideoUrl(p.welcome_video_url);
    if (p.billing_cycle) setBillingCycle(p.billing_cycle as "monthly" | "annual");
    if (p.studio_unlocked) setStudioUnlocked(true);
    if (p.billing_cycle === "annual" && p.annual_start_date) {
      setAnnualLocked(true);
      const renewal = new Date(p.annual_start_date);
      renewal.setFullYear(renewal.getFullYear() + 1);
      setRenewalDate(renewal.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    }
    setSubstackEmail(localStorage.getItem("substack-email") || "");
  }, [prefs]);

  // Load welcome video from app_settings (for admin)
  useEffect(() => {
    if (user?.email === "myslimher@gmail.com") {
      (async () => {
        const { data } = await (supabase as any).from("app_settings").select("value").eq("key", "welcome_video_url").maybeSingle();
        if (data?.value) setWelcomeVideoUrl(data.value);
      })();
    }
  }, [user]);

  // Load saved reviews on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any).from("monthly_reviews").select("*").eq("user_id", user.id).order("year", { ascending: false }).order("month", { ascending: false });
      setSavedReviews(data || []);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").upsert({ id: user.id, full_name: profileData.full_name, updated_at: new Date().toISOString() } as any);
    if (profileData.email !== user.email) {
      await supabase.auth.updateUser({ email: profileData.email });
    }
    setSaving(false);
    toast.success("Profile saved!");
  };

  const saveAppearance = () => {
    if (!user) return;
    const theme = ACCENT_THEMES.find(t => t.name === selectedTheme);
    if (!theme) return;

    // Apply accent color via CSS variables
    const hsl = hexToHsl(theme.primary);
    const hslSecondary = hexToHsl(theme.secondary);
    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--chart-1", hsl);

    // Persist to localStorage for cross-page persistence
    localStorage.setItem("dh_accent_color", theme.primary);
    localStorage.setItem("dh_secondary_color", theme.secondary);
    localStorage.setItem("dh_theme_name", theme.name);

    // Dark mode
    if (isDarkMode) {
      root.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
    }

    // Fire custom event for any listeners
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: { accent: theme.primary, secondary: theme.secondary } }));

    // Save welcome video to app_settings if admin
    if (user.email === "myslimher@gmail.com" && welcomeVideoUrl) {
      (supabase as any).from("app_settings").upsert({ key: "welcome_video_url", value: welcomeVideoUrl, updated_at: new Date().toISOString() }).then(() => {});
    }

    // Save to DB via upsertPrefs
    upsertPrefs.mutate({
      theme_color: theme.primary,
      sidebar_theme: isDarkMode ? "dark" : "light",
      religion: selectedReligion || null,
      show_scripture_card: showScripture,
      welcome_video_url: welcomeVideoUrl || null,
    } as any);

    toast.success("Appearance saved! ✓", { description: "Your theme has been applied across the platform." });
  };

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("dh_dark_mode", next.toString());
    if (next) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    upsertPrefs.mutate({ sidebar_theme: next ? "dark" : "light" } as any);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `avatars/${user.id}/${Date.now()}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: url } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(url.publicUrl);
    await supabase.auth.updateUser({ data: { avatar_url: url.publicUrl } });
    toast.success("Photo updated!");
  };

  const saveBroker = () => {
    if (!user) return;
    const broker = BROKERS.find(b => b.name === preferredBroker);
    const url = broker?.url || brokerUrl;
    localStorage.setItem("preferred-broker", preferredBroker);
    localStorage.setItem("broker-url", url);
    upsertPrefs.mutate({ preferred_broker: preferredBroker, broker_url: url } as any);
    setBrokerModalOpen(false);
    toast.success("Broker saved!");
  };

  const saveSubstack = () => {
    localStorage.setItem("substack-email", substackEmail);
    setSubstackModalOpen(false);
    toast.success("Substack connected!");
  };

  const submitFeedback = async () => {
    if (!user) return;
    if (!feedbackMessage.trim()) {
      toast.error("Write something first");
      return;
    }
    await supabase.from("feedback").insert({
      user_id: user.id,
      email: user.email,
      message: feedbackMessage.trim(),
      rating: null,
      status: "pending",
    });
    setFeedbackMessage("");
    setFeedbackType("General Feedback");
    toast.success("Feedback sent! 💚", { description: "We'll review it shortly." });
  };

  const bg = isDark ? "#1C1C1E" : "white";
  const border = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6";
  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.4)" : "#6B7280";
  const inputBg = isDark ? "#252528" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  const sectionStyle: React.CSSProperties = { background: bg, borderRadius: 16, border: `1px solid ${border}`, padding: 24, marginBottom: 20 };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 14, color: text1, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" as const, background: inputBg };

  const TABS = [
    { key: "general", label: "General" },
    { key: "connections", label: "Connections" },
    { key: "billing", label: "Plan & Billing" },
    { key: "archive", label: "Archive" },
    { key: "support", label: "Support" },
  ];

  const connections = [
    { key: "plaid", icon: Building2, color: "#3B82F6", title: "Plaid — Bank Sync", desc: "Connect your bank accounts for automatic transaction tracking", connected: false, actionLabel: "Connect Bank", action: () => setPlaidModalOpen(true) },
    { key: "substack", icon: FileText, color: "#FF6719", title: "Substack", desc: "Post journal entries directly to your Substack as drafts", connected: !!substackEmail, actionLabel: substackEmail ? "Change Email" : "Connect", detail: substackEmail || null, action: () => setSubstackModalOpen(true) },
    { key: "broker", icon: TrendingUp, color: "#10B981", title: "Trading Broker", desc: "Link your brokerage for one-click access from the Investing tab", connected: !!preferredBroker, actionLabel: preferredBroker ? "Change Broker" : "Connect", detail: preferredBroker || null, action: () => setBrokerModalOpen(true) },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 100px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif", margin: "4px 0 20px" }}>Manage your account and preferences</p>

        {/* Tab navigation */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${border}`, paddingBottom: 0 }}>
          {TABS.map(tab => (
            <button key={tab.key} data-tab={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "8px 16px", fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 500,
              color: activeTab === tab.key ? (localStorage.getItem("dh_accent_color") || "#10B981") : text2,
              borderBottom: activeTab === tab.key ? `2px solid ${localStorage.getItem("dh_accent_color") || "#10B981"}` : "2px solid transparent",
              background: "transparent", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
              marginBottom: -1, transition: "all 150ms",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════ GENERAL TAB ══════════ */}
        {activeTab === "general" && (
          <>
            {/* PROFILE */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <User size={18} color={localStorage.getItem("dh_accent_color") || "#10B981"} />
                <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Profile</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div onClick={() => avatarInputRef.current?.click()} style={{ width: 72, height: 72, borderRadius: "50%", background: isDark ? "#252528" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", border: `2px solid ${inputBorder}`, flexShrink: 0 }}>
                  {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, fontWeight: 700, color: text2 }}>{user?.email?.charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <button onClick={() => avatarInputRef.current?.click()} style={{ padding: "7px 16px", background: inputBg, border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "block", marginBottom: 4 }}>Upload Photo</button>
                  <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>JPG, PNG up to 5MB</span>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Full Name", key: "full_name", placeholder: "Your name" },
                  { label: "Handle", key: "handle", placeholder: "@yourhandle" },
                  { label: "Email", key: "email", placeholder: "you@email.com" },
                  { label: "Location", key: "location", placeholder: "Denver, CO" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <input value={(profileData as any)[f.key]} onChange={e => setProfileData(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
                  </div>
                ))}
              </div>
              <button onClick={saveProfile} disabled={saving} style={{ marginTop: 16, padding: "10px 24px", background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{saving ? "Saving..." : "Save Profile"}</button>
            </div>

            {/* MONTHLY REVIEW */}
            <div style={{ marginTop: 32, paddingTop: 28, borderTop: `2px solid ${border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif", letterSpacing: "-0.3px", margin: 0 }}>Monthly Reviews</h3>
                  <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", marginTop: 4 }}>Reflect on your month. Saves automatically.</p>
                </div>
                <button onClick={() => { setEditingReview(null); setReviewData({ went_well: "", was_hard: "", proud_of: "", do_differently: "", focus_word: "" }); setReviewMonth(new Date().getMonth() + 1); setReviewYear(new Date().getFullYear()); setWritingReview(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#10B981", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  <Plus size={14} /> Write Review
                </button>
              </div>

              {savedReviews.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", background: isDark ? "#252528" : "#F9FAFB", borderRadius: 12, border: `1px dashed ${border}` }}>
                  <BarChart2 size={32} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>No reviews yet</p>
                  <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif" }}>Write your first monthly review</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {savedReviews.map((review: any) => (
                    <div key={review.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: isDark ? "#252528" : "white", borderRadius: 12, border: `1px solid ${border}`, transition: "all 150ms" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CalendarDays size={20} color="#7B5EA7" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 2 }}>
                          {new Date(review.year, review.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          {review.focus_word && <span style={{ padding: "1px 8px", background: isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF", border: `1px solid ${isDark ? "rgba(123,94,167,0.3)" : "#DDD6FE"}`, borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#7B5EA7", fontFamily: "Inter, sans-serif" }}>{review.focus_word}</span>}
                          <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>{review.completed_at ? `Saved ${new Date(review.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Draft"}</span>
                        </div>
                        {review.went_well && <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>"{review.went_well.substring(0, 80)}{review.went_well.length > 80 ? "..." : ""}"</p>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => { setEditingReview(review); setReviewData({ went_well: review.went_well || "", was_hard: review.was_hard || "", proud_of: review.proud_of || "", do_differently: review.do_differently || "", focus_word: review.focus_word || "" }); setReviewMonth(review.month); setReviewYear(review.year); setWritingReview(true); }} style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#7B5EA7", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>View</button>
                        <button onClick={async () => { if (!window.confirm("Delete this review?")) return; await (supabase as any).from("monthly_reviews").delete().eq("id", review.id).eq("user_id", user!.id); setSavedReviews(prev => prev.filter(r => r.id !== review.id)); toast.success("Review deleted"); }} style={{ width: 32, height: 32, background: "transparent", border: `1px solid ${border}`, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: text2 }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.color = "#DC2626"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF"; }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Moon size={18} color="#7B5EA7" />
                <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Appearance</span>
              </div>

              {/* Dark mode toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "12px 14px", background: isDark ? "#252528" : "#F9FAFB", borderRadius: 10 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif" }}>Dark Mode</span>
                  <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: "2px 0 0" }}>Switch between light and dark theme</p>
                </div>
                <button onClick={toggleDarkMode} style={{ width: 48, height: 28, borderRadius: 14, border: "none", background: isDarkMode ? "#10B981" : "#D1D5DB", cursor: "pointer", position: "relative", transition: "background 200ms" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: isDarkMode ? 23 : 3, transition: "left 200ms", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isDarkMode ? <Moon size={12} color="#10B981" /> : <Sun size={12} color="#F59E0B" />}
                  </div>
                </button>
              </div>

              {/* Accent color */}
              <label style={labelStyle}>Accent Color</label>
              <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: "0 0 12px" }}>Customize your platform colors</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {ACCENT_THEMES.map(theme => (
                  <button key={theme.name} onClick={() => setSelectedTheme(theme.name)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 10, border: `2px solid ${selectedTheme === theme.name ? theme.primary : inputBorder}`, borderRadius: 12, background: inputBg, cursor: "pointer", minWidth: 80, transition: "all 150ms" }}>
                    <div style={{ display: "flex", gap: 3 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: theme.primary }} />
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: theme.secondary }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: text2, fontFamily: "Inter, sans-serif" }}>{theme.label}</span>
                    {selectedTheme === theme.name && <Check size={14} color={theme.primary} />}
                  </button>
                ))}
              </div>

              {/* Faith & Scripture */}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Heart size={16} color="#EC4899" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif" }}>Faith & Inspiration</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Religion / Faith</label>
                    <select value={selectedReligion} onChange={e => setSelectedReligion(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                      {RELIGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 14px", background: isDark ? "#252528" : "#F9FAFB", borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: text1, fontFamily: "Inter, sans-serif" }}>Daily Scripture</span>
                      <button onClick={() => setShowScripture(!showScripture)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: showScripture ? "#10B981" : "#D1D5DB", cursor: "pointer", position: "relative", transition: "background 200ms" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: showScripture ? 23 : 3, transition: "left 200ms" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Welcome video — admin only */}
              {user?.email === "myslimher@gmail.com" && (
                <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, marginBottom: 16 }}>
                  <label style={labelStyle}>Welcome Video URL (shows to all new users)</label>
                  <input value={welcomeVideoUrl} onChange={e => setWelcomeVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={inputStyle} />
                </div>
              )}

              <button onClick={saveAppearance} style={{ marginTop: 8, padding: "10px 24px", background: "#7B5EA7", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Save Appearance</button>
            </div>

            {/* NOTIFICATIONS */}
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Bell size={18} color="#EF4444" />
                <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Notifications</span>
              </div>
              <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", margin: "0 0 14px" }}>Notification settings are managed in the notification panel.</p>
              <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: inputBg, border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                <Bell size={14} /> Open Notification Settings
              </button>
            </div>
          </>
        )}

        {/* ══════════ CONNECTIONS TAB ══════════ */}
        {activeTab === "connections" && (
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <ExternalLink size={18} color="#3B82F6" />
              <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Connections</span>
            </div>
            {connections.map(item => (
              <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <item.icon size={18} color={item.color} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif" }}>{item.title}</span>
                      {item.connected && <span style={{ fontSize: 10, fontWeight: 600, color: "#10B981", background: isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4", padding: "2px 8px", borderRadius: 999, fontFamily: "Inter, sans-serif" }}>Connected ✓</span>}
                    </div>
                    <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>{item.detail || item.desc}</span>
                  </div>
                </div>
                <button onClick={item.action} style={{ padding: "7px 16px", background: inputBg, border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{item.actionLabel}</button>
              </div>
            ))}
          </div>
        )}

        {/* ══════════ BILLING TAB ══════════ */}
        {activeTab === "billing" && (
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <TrendingUp size={18} color="#F59E0B" />
              <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Plan & Billing</span>
            </div>

            {/* Billing cycle toggle */}
            <div style={{ display: "flex", background: isDark ? "#252528" : "#F3F4F6", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 24 }}>
              {(["monthly", "annual"] as const).map(cycle => (
                <button key={cycle} onClick={() => { if (cycle === "annual" || !annualLocked) setBillingCycle(cycle); }} style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: billingCycle === cycle ? (isDark ? "#333" : "white") : "transparent", fontSize: 14, fontWeight: billingCycle === cycle ? 600 : 400, color: billingCycle === cycle ? text1 : text2, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: billingCycle === cycle ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 150ms", display: "flex", alignItems: "center", gap: 6, textTransform: "capitalize" }}>
                  {cycle}
                  {cycle === "annual" && <span style={{ padding: "1px 6px", background: billingCycle === "annual" ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : (isDark ? "#333" : "#E5E7EB"), color: billingCycle === "annual" ? "#065F46" : text2, borderRadius: 999, fontSize: 10, fontWeight: 700 }}>Save 28%</span>}
                </button>
              ))}
            </div>
            {annualLocked && <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 16, display: "flex", alignItems: "center", gap: 5 }}><LockIcon size={12} color="#10B981" /> Annual plan active · Renews {renewalDate} · Billed annually · Cancel anytime after year ends</p>}

            {/* Plan selection */}
            <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>Select plan</h3>
            <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Simple pricing. Full access.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { tier: "founding", name: "Founding Member", monthlyPrice: "$7", annualMonthly: "$4", annualPrice: "$49", color: "#F59E0B", border: "#FDE68A", bg: "#FFFBEB", stripe_monthly: "PASTE_FOUNDING_MONTHLY", stripe_annual: "PASTE_FOUNDING_ANNUAL", limited: true },
                { tier: "standard", name: "Standard", monthlyPrice: "$12", annualMonthly: "$8", annualPrice: "$99", color: "#10B981", border: "#BBF7D0", bg: "#F0FDF4", stripe_monthly: "PASTE_STANDARD_MONTHLY", stripe_annual: "PASTE_STANDARD_ANNUAL", limited: false },
              ].map(plan => (
                <div key={plan.tier} style={{ border: `2px solid ${currentPlan === plan.tier ? plan.color : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`, borderRadius: 14, padding: 20, position: "relative", background: currentPlan === plan.tier ? (isDark ? "rgba(255,255,255,0.03)" : plan.bg) : (isDark ? "#1C1C1E" : "white"), cursor: "pointer", transition: "all 150ms" }}
                  onMouseEnter={e => { if (currentPlan !== plan.tier) { e.currentTarget.style.borderColor = plan.color; e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : plan.bg; } }}
                  onMouseLeave={e => { if (currentPlan !== plan.tier) { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"; e.currentTarget.style.background = isDark ? "#1C1C1E" : "white"; } }}>
                  {currentPlan === plan.tier && <div style={{ position: "absolute", top: 14, right: 14, width: 22, height: 22, borderRadius: "50%", background: plan.color, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={13} color="white" /></div>}
                  {plan.limited && <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} /><span style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>First 50 users only</span></div>}
                  <p style={{ fontSize: 14, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 10 }}>{plan.name}</p>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif", letterSpacing: "-1px" }}>{billingCycle === "annual" ? plan.annualMonthly : plan.monthlyPrice}</span>
                    <span style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif" }}>/month</span>
                  </div>
                  {billingCycle === "annual" && <p style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 14 }}>{plan.annualPrice} billed annually</p>}
                  {currentPlan === plan.tier ? (
                    <div style={{ padding: 8, background: `${plan.color}20`, borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: 700, color: plan.color, fontFamily: "Inter, sans-serif", marginTop: 12 }}>Current Plan ✓</div>
                  ) : (
                    <button onClick={() => { const url = billingCycle === "annual" ? plan.stripe_annual : plan.stripe_monthly; const link = document.createElement("a"); link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer"; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} style={{ width: "100%", padding: 9, background: plan.color, color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", marginTop: 12 }}>Upgrade</button>
                  )}
                </div>
              ))}
            </div>

            {/* Studio Add-on */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", background: "#1C1C1E", borderRadius: 12, marginBottom: 20, gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(123,94,167,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Clapperboard size={17} color="#C4B5FD" /></div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "Inter, sans-serif", margin: 0 }}>Studio Add-on</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "Inter, sans-serif", margin: 0 }}>Full Studio HQ · Collaboration · Content pipeline</p>
                </div>
              </div>
              {studioUnlocked ? (
                <span style={{ padding: "6px 14px", background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#C4B5FD", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>Unlocked ✓</span>
              ) : (
                <button onClick={() => { const link = document.createElement("a"); link.href = "PASTE_STUDIO_LINK"; link.target = "_blank"; link.rel = "noopener noreferrer"; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} style={{ padding: "8px 16px", background: "#7B5EA7", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>$29.99 one-time</button>
              )}
            </div>

            {/* Student Discount */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isDark ? "rgba(59,130,246,0.08)" : "#EFF6FF", borderRadius: 10, marginBottom: 20, gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <GraduationCap size={18} color="#3B82F6" />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", fontFamily: "Inter, sans-serif", margin: 0 }}>Student? 50% off</p>
                  <p style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>Verify with your .edu email</p>
                </div>
              </div>
              <button onClick={() => setStudentModalOpen(true)} style={{ padding: "7px 14px", background: "#3B82F6", color: "white", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>Verify</button>
            </div>

            {/* Student modal */}
            {studentModalOpen && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setStudentModalOpen(false)}>
                <div onClick={e => e.stopPropagation()} style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: 16, padding: 28, width: "90%", maxWidth: 400 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>Verify Student Status</h3>
                  <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Enter your .edu email to verify</p>
                  <input value={eduEmail} onChange={e => setEduEmail(e.target.value)} placeholder="you@university.edu" style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 14, color: text1, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" as const, background: inputBg, marginBottom: 12 }} />
                  <button onClick={async () => { if (!eduEmail.endsWith(".edu")) { toast.error("Please use a .edu email address"); return; } await (supabase as any).from("user_preferences").upsert({ user_id: user!.id, student_verified: true, student_email: eduEmail }); toast.success("Student status verified! 🎓 50% discount applied. Use code STUDENT50 at checkout."); setStudentModalOpen(false); }} style={{ width: "100%", padding: 10, background: "#3B82F6", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Verify & Apply Discount</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ ARCHIVE TAB ══════════ */}
        {activeTab === "archive" && (
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Archive size={18} color="#6B7280" />
              <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Archived Items</span>
            </div>
            {archivedProjects.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Archive size={40} color={text2} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>No archived items</p>
                <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif" }}>Archived projects and goals will appear here</p>
              </div>
            ) : (
              <div>
                {archivedProjects.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${border}` }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif" }}>{item.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#7B5EA7", background: isDark ? "rgba(123,94,167,0.15)" : "#F3E8FF", padding: "2px 8px", borderRadius: 999, fontFamily: "Inter, sans-serif" }}>{item.type}</span>
                        <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>
                          Archived {new Date(item.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => { restoreProject.mutate(item.id); toast.success("Project restored!"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: isDark ? "#252528" : "#F0FDF4", border: `1px solid ${isDark ? "rgba(16,185,129,0.2)" : "#BBF7D0"}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#10B981", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      <RotateCcw size={13} /> Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════ SUPPORT TAB ══════════ */}
        {activeTab === "support" && (
          <>
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <HelpCircle size={18} color="#3B82F6" />
                <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Support & Help</span>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 20, marginTop: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 8 }}>Need more help?</p>
                <button onClick={() => window.open("mailto:support@mydigitalhome.app")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#3B82F6", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  <Mail size={15} /> Contact Support
                </button>
              </div>
            </div>

            {/* FEEDBACK FORM */}
            <div id="feedback-form" style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <MessageSquare size={18} color="#F59E0B" />
                <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Send Feedback</span>
              </div>
              <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", margin: "0 0 16px" }}>Help us improve Digital Home. We read every message.</p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {["Bug Report", "Feature Request", "General Feedback", "Billing Issue"].map(type => (
                  <button key={type} onClick={() => setFeedbackType(type)} style={{
                    padding: "6px 14px", borderRadius: 999, border: "1.5px solid",
                    borderColor: feedbackType === type ? "#10B981" : inputBorder,
                    background: feedbackType === type ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : inputBg,
                    color: feedbackType === type ? (isDark ? "#10B981" : "#065F46") : text2,
                    fontSize: 12, fontWeight: feedbackType === type ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 150ms",
                  }}>
                    {type}
                  </button>
                ))}
              </div>

              <textarea
                value={feedbackMessage}
                onChange={e => setFeedbackMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical" as const, marginBottom: 12 }}
              />

              <button onClick={submitFeedback} style={{ padding: "10px 24px", background: "#10B981", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                Send Feedback
              </button>
            </div>

            <div style={{ padding: "12px 16px", background: isDark ? "#252528" : "#F9FAFB", borderRadius: 10, textAlign: "center" }}>
              <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>Digital Home v1.0 · Built with ♥</p>
            </div>
          </>
        )}
      </div>

      {/* ══════════ MODALS ══════════ */}
      {substackModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>Substack Email</h3>
            <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Enter your Substack draft email to auto-publish journal entries</p>
            <label style={labelStyle}>Your Substack draft email</label>
            <input value={substackEmail} onChange={e => setSubstackEmail(e.target.value)} placeholder="you@email.substack.com" style={inputStyle} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setSubstackModalOpen(false)} style={{ flex: 1, padding: 10, border: `1.5px solid ${inputBorder}`, borderRadius: 10, background: inputBg, fontSize: 13, fontWeight: 500, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={saveSubstack} style={{ flex: 1, padding: 10, background: "#FF6719", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {brokerModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>Preferred Broker</h3>
            <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Select your brokerage for one-click access</p>
            <label style={labelStyle}>Select your broker</label>
            <select value={preferredBroker} onChange={e => {
              setPreferredBroker(e.target.value);
              const b = BROKERS.find(br => br.name === e.target.value);
              if (b) setBrokerUrl(b.url);
            }} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Select a broker...</option>
              {BROKERS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              <option value="Custom">Custom URL</option>
            </select>
            {preferredBroker === "Custom" && (
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Custom broker URL</label>
                <input value={brokerUrl} onChange={e => setBrokerUrl(e.target.value)} placeholder="https://yourbroker.com" style={inputStyle} />
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setBrokerModalOpen(false)} style={{ flex: 1, padding: 10, border: `1.5px solid ${inputBorder}`, borderRadius: 10, background: inputBg, fontSize: 13, fontWeight: 500, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={saveBroker} style={{ flex: 1, padding: 10, background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {plaidModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>Connect Your Bank</h3>
            <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 20, lineHeight: 1.5 }}>
              Bank connection requires Plaid setup. This is a development feature — contact support to enable it for your account.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => window.open("https://plaid.com", "_blank")} style={{ flex: 1, padding: 10, background: "#3B82F6", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Learn More</button>
              <button onClick={() => setPlaidModalOpen(false)} style={{ flex: 1, padding: 10, border: `1.5px solid ${inputBorder}`, borderRadius: 10, background: inputBg, fontSize: 13, fontWeight: 500, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {writingReview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
          <div style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: 20, width: "min(600px, 95vw)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
            {/* Modal header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: isDark ? "#1C1C1E" : "white", zIndex: 1 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>
                  {new Date(reviewYear, reviewMonth - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })} Review
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <button onClick={() => { if (reviewMonth === 1) { setReviewMonth(12); setReviewYear(y => y - 1); } else { setReviewMonth(m => m - 1); } }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: text2 }}><ChevronLeft size={14} /></button>
                  <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>Change month</span>
                  <button onClick={() => { const now = new Date(); if (reviewMonth === now.getMonth() + 1 && reviewYear === now.getFullYear()) return; if (reviewMonth === 12) { setReviewMonth(1); setReviewYear(y => y + 1); } else { setReviewMonth(m => m + 1); } }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: text2 }}><ChevronRight size={14} /></button>
                </div>
              </div>
              <button onClick={() => { setWritingReview(false); setEditingReview(null); setReviewData({ went_well: "", was_hard: "", proud_of: "", do_differently: "", focus_word: "" }); }} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} color={text2} /></button>
            </div>
            {/* Questions */}
            <div style={{ padding: "20px 24px" }}>
              {[
                { key: "went_well", emoji: "✨", label: "What went well?", placeholder: "Wins, progress, moments you are proud of..." },
                { key: "was_hard", emoji: "💪", label: "What was challenging?", placeholder: "What drained you or did not go as planned..." },
                { key: "proud_of", emoji: "🏆", label: "One thing I am most proud of", placeholder: "If you had to pick just one thing..." },
                { key: "do_differently", emoji: "🔄", label: "I would do this differently", placeholder: "One thing to change next month..." },
              ].map(q => (
                <div key={q.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: text1, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif" }}>{q.emoji} {q.label}</label>
                  <textarea value={(reviewData as any)[q.key]} onChange={e => setReviewData(prev => ({ ...prev, [q.key]: e.target.value }))} placeholder={q.placeholder} rows={3} style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${inputBorder}`, borderRadius: 10, fontSize: 14, color: text1, fontFamily: "Inter, sans-serif", resize: "vertical", outline: "none", background: inputBg, boxSizing: "border-box" as const, lineHeight: "1.6", transition: "border 150ms" }} onFocus={e => { e.target.style.borderColor = "#10B981"; }} onBlur={e => { e.target.style.borderColor = inputBorder; }} />
                </div>
              ))}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: text1, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif" }}>🎯 My focus word for next month</label>
                <input value={reviewData.focus_word} onChange={e => setReviewData(prev => ({ ...prev, focus_word: e.target.value }))} placeholder="e.g. Consistency, Growth, Balance..." maxLength={30} style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${inputBorder}`, borderRadius: 10, fontSize: 15, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", outline: "none", background: inputBg, boxSizing: "border-box" as const, transition: "border 150ms" }} onFocus={e => { e.target.style.borderColor = "#10B981"; }} onBlur={e => { e.target.style.borderColor = inputBorder; }} />
              </div>
              <button onClick={async () => {
                setReviewSaving(true);
                try {
                  await (supabase as any).from("monthly_reviews").upsert({ user_id: user!.id, month: reviewMonth, year: reviewYear, went_well: reviewData.went_well, was_hard: reviewData.was_hard, proud_of: reviewData.proud_of, do_differently: reviewData.do_differently, focus_word: reviewData.focus_word, completed_at: new Date().toISOString() }, { onConflict: "user_id,month,year" });
                  const { data: reviews } = await (supabase as any).from("monthly_reviews").select("*").eq("user_id", user!.id).order("year", { ascending: false }).order("month", { ascending: false });
                  setSavedReviews(reviews || []);
                  setWritingReview(false);
                  setEditingReview(null);
                  toast.success("Review saved ✓", { description: `Your ${new Date(reviewYear, reviewMonth - 1).toLocaleDateString("en-US", { month: "long" })} review has been saved.` });
                } catch { toast.error("Save failed"); } finally { setReviewSaving(false); }
              }} style={{ width: "100%", padding: 13, background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {reviewSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Review</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
