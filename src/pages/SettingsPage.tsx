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
  ChevronLeft, DollarSign, CreditCard, Target, Users, Loader2, Save, BarChart2, Receipt,
  Lock as LockIcon, Unlock,
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
    tier: "free", name: "Free", badge: null,
    monthlyPrice: 0, annualPrice: 0,
    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB",
    description: "Get started and explore the basics",
    features: ["Dashboard overview", "1 active project", "Basic journal (5 entries/mo)", "Money snapshot", "Calendar view"],
    stripeMonthly: "", stripeAnnual: "",
  },
  {
    tier: "standard", name: "Standard", badge: "⭐ Most Popular",
    monthlyPrice: 12, annualPrice: 99,
    color: "#10B981", bg: "#F0FDF4", border: "#BBF7D0",
    description: "Full access to everything. No feature locks.",
    features: ["Everything in Free", "Unlimited projects + AI stages", "Unlimited journal + voice", "Full finance suite", "Contacts CRM + import", "Content Planner", "Monthly Review", "Resource Center"],
    stripeMonthly: "PASTE_STANDARD_MONTHLY_LINK", stripeAnnual: "PASTE_STANDARD_ANNUAL_LINK",
  },
  {
    tier: "pro", name: "Pro", badge: "🚀 Power User",
    monthlyPrice: 29, annualPrice: 199,
    color: "#7B5EA7", bg: "#F5F3FF", border: "#DDD6FE",
    description: "For creators and entrepreneurs who want it all.",
    features: ["Everything in Standard", "Studio HQ included", "Priority AI features", "Team collaboration", "Advanced analytics", "API access (coming soon)", "Founding member perks"],
    stripeMonthly: "PASTE_PRO_MONTHLY_LINK", stripeAnnual: "PASTE_PRO_ANNUAL_LINK",
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
  const [reviewMonth, setReviewMonth] = useState(new Date().getMonth() + 1);
  const [reviewYear, setReviewYear] = useState(new Date().getFullYear());
  const [reviewData, setReviewData] = useState({ went_well: "", was_hard: "", proud_of: "", do_differently: "", focus_word: "" });
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [monthStats, setMonthStats] = useState<any>({});
  const [pastReviews, setPastReviews] = useState<any[]>([]);
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

  // Monthly review: load stats & existing review when month changes
  useEffect(() => {
    if (!user) return;
    const start = new Date(reviewYear, reviewMonth - 1, 1).toISOString();
    const end = new Date(reviewYear, reviewMonth, 0, 23, 59, 59).toISOString();
    (async () => {
      const [
        { data: txns },
        { count: goalsDone },
        { data: journals },
        { count: contactsReached },
        { count: contentPosted },
        { count: billsPaid },
      ] = await Promise.all([
        (supabase as any).from("transactions").select("amount, category").eq("user_id", user.id).gte("date", start).lte("date", end),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("archived", true).gte("updated_at", start).lte("updated_at", end),
        supabase.from("journal_entries").select("mood").eq("user_id", user.id).gte("created_at", start).lte("created_at", end),
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("last_contacted_date", start).lte("last_contacted_date", end),
        supabase.from("content_items").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("stage", "posted").gte("updated_at", start).lte("updated_at", end),
        supabase.from("bills").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "paid").gte("due_date", start.split("T")[0]).lte("due_date", end.split("T")[0]),
      ]);
      const income = (txns || []).filter((t: any) => (t.amount || 0) > 0).reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0);
      const expenses = (txns || []).filter((t: any) => (t.amount || 0) < 0).reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0);
      const moodCounts: Record<string, number> = {};
      (journals || []).forEach((j: any) => { if (j.mood) moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1; });
      const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      setMonthStats({ income, expenses, saved: income - expenses, goalsDone: goalsDone || 0, journalCount: (journals || []).length, topMood, contactsReached: contactsReached || 0, contentPosted: contentPosted || 0, billsPaid: billsPaid || 0 });
    })();

    // Load existing review
    (async () => {
      const { data } = await (supabase as any).from("monthly_reviews").select("*").eq("user_id", user.id).eq("month", reviewMonth).eq("year", reviewYear).maybeSingle();
      if (data) {
        setReviewData({ went_well: data.went_well || "", was_hard: data.was_hard || "", proud_of: data.proud_of || "", do_differently: data.do_differently || "", focus_word: data.focus_word || "" });
        setReviewSaved(true);
      } else {
        setReviewData({ went_well: "", was_hard: "", proud_of: "", do_differently: "", focus_word: "" });
        setReviewSaved(false);
      }
    })();
  }, [user, reviewMonth, reviewYear]);

  // Load past reviews
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any).from("monthly_reviews").select("*").eq("user_id", user.id).not("month", "is", null).order("year", { ascending: false }).order("month", { ascending: false });
      setPastReviews(data || []);
    })();
  }, [user, reviewSaved]);

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
            <div style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <BarChart2 size={18} color="#10B981" />
                <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Monthly Review</span>
              </div>
              <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 20 }}>Reflect on your month and set your intention for next month. Saved automatically.</p>

              {/* Month navigation */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20 }}>
                <button onClick={() => { if (reviewMonth === 1) { setReviewMonth(12); setReviewYear(y => y - 1); } else { setReviewMonth(m => m - 1); } }} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, background: isDark ? "#252528" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronLeft size={16} color={text2} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", minWidth: 160, textAlign: "center" }}>
                  {new Date(reviewYear, reviewMonth - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => { const now = new Date(); if (reviewMonth === now.getMonth() + 1 && reviewYear === now.getFullYear()) return; if (reviewMonth === 12) { setReviewMonth(1); setReviewYear(y => y + 1); } else { setReviewMonth(m => m + 1); } }} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, background: isDark ? "#252528" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: reviewMonth === new Date().getMonth() + 1 && reviewYear === new Date().getFullYear() ? 0.3 : 1 }}>
                  <ChevronRight size={16} color={text2} />
                </button>
              </div>

              {/* Auto-pulled stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
                {[
                  { Icon: DollarSign, label: "Income", value: `$${(monthStats.income || 0).toLocaleString()}`, color: "#10B981", bg: isDark ? "rgba(16,185,129,0.08)" : "#F0FDF4" },
                  { Icon: CreditCard, label: "Spent", value: `$${(monthStats.expenses || 0).toLocaleString()}`, color: "#EF4444", bg: isDark ? "rgba(239,68,68,0.08)" : "#FEF2F2" },
                  { Icon: TrendingUp, label: "Saved", value: `$${Math.max(0, monthStats.saved || 0).toLocaleString()}`, color: (monthStats.saved || 0) >= 0 ? "#10B981" : "#EF4444", bg: (monthStats.saved || 0) >= 0 ? (isDark ? "rgba(16,185,129,0.08)" : "#F0FDF4") : (isDark ? "rgba(239,68,68,0.08)" : "#FEF2F2") },
                  { Icon: Target, label: "Goals Done", value: monthStats.goalsDone || 0, color: "#7B5EA7", bg: isDark ? "rgba(123,94,167,0.08)" : "#F5F3FF" },
                  { Icon: BookOpen, label: "Journal Entries", value: monthStats.journalCount || 0, color: "#06B6D4", bg: isDark ? "rgba(6,182,212,0.08)" : "#ECFEFF" },
                  { Icon: Heart, label: "Top Mood", value: monthStats.topMood || "—", color: "#EC4899", bg: isDark ? "rgba(236,72,153,0.08)" : "#FDF2F8" },
                  { Icon: Users, label: "Contacts Reached", value: monthStats.contactsReached || 0, color: "#F59E0B", bg: isDark ? "rgba(245,158,11,0.08)" : "#FFFBEB" },
                  { Icon: FileText, label: "Content Posted", value: monthStats.contentPosted || 0, color: "#F59E0B", bg: isDark ? "rgba(245,158,11,0.08)" : "#FFFBEB" },
                  { Icon: Receipt, label: "Bills Paid", value: monthStats.billsPaid || 0, color: "#3B82F6", bg: isDark ? "rgba(59,130,246,0.08)" : "#EFF6FF" },
                ].map((stat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: stat.bg, borderRadius: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${stat.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <stat.Icon size={14} color={stat.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: stat.color, fontFamily: "Inter, sans-serif" }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reflection questions */}
              {[
                { key: "went_well", emoji: "✨", label: "What went well?" , placeholder: "Wins, progress, moments you are proud of..." },
                { key: "was_hard", emoji: "💪", label: "What was challenging?", placeholder: "What drained you or did not go as planned..." },
                { key: "proud_of", emoji: "🏆", label: "One thing I am most proud of", placeholder: "If you had to pick just one thing..." },
                { key: "do_differently", emoji: "🔄", label: "I would do this differently", placeholder: "One thing to change or approach differently..." },
              ].map(q => (
                <div key={q.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: text1, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif" }}>{q.emoji} {q.label}</label>
                  <textarea value={(reviewData as any)[q.key]} onChange={e => setReviewData(prev => ({ ...prev, [q.key]: e.target.value }))} placeholder={q.placeholder} rows={3} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${inputBorder}`, borderRadius: 10, fontSize: 14, color: text1, fontFamily: "Inter, sans-serif", resize: "vertical", outline: "none", background: inputBg, boxSizing: "border-box" as const, lineHeight: "1.6" }} onFocus={e => { e.target.style.borderColor = "#10B981"; }} onBlur={e => { e.target.style.borderColor = inputBorder; }} />
                </div>
              ))}

              {/* Focus word */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: text1, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif" }}>🎯 My focus word for next month</label>
                <input value={reviewData.focus_word} onChange={e => setReviewData(prev => ({ ...prev, focus_word: e.target.value }))} placeholder="e.g. Consistency, Growth, Balance, Discipline..." maxLength={30} style={{ ...inputStyle, fontSize: 16, fontWeight: 600, letterSpacing: "0.3px" }} onFocus={e => { e.target.style.borderColor = "#10B981"; }} onBlur={e => { e.target.style.borderColor = inputBorder; }} />
              </div>

              {/* Save button */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <button onClick={async () => {
                  setReviewSaving(true);
                  try {
                    await (supabase as any).from("monthly_reviews").upsert({ user_id: user!.id, month: reviewMonth, year: reviewYear, review_month: `${reviewYear}-${String(reviewMonth).padStart(2, "0")}`, went_well: reviewData.went_well, was_hard: reviewData.was_hard, proud_of: reviewData.proud_of, do_differently: reviewData.do_differently, focus_word: reviewData.focus_word, completed_at: new Date().toISOString() }, { onConflict: "user_id,month,year" });
                    setReviewSaved(true);
                    toast.success("Review saved ✓", { description: `Your ${new Date(reviewYear, reviewMonth - 1).toLocaleDateString("en-US", { month: "long" })} review has been saved.` });
                  } catch { toast.error("Save failed"); } finally { setReviewSaving(false); }
                }} style={{ padding: "11px 28px", background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                  {reviewSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save Review</>}
                </button>
                {reviewSaved && <span style={{ fontSize: 13, color: "#10B981", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}><Check size={14} /> Saved</span>}
              </div>

              {/* Past reviews */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: text2, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12, fontFamily: "Inter, sans-serif" }}>Past Reviews</p>
                {pastReviews.length === 0 ? (
                  <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", fontStyle: "italic" }}>Complete your first review to see your history here.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {pastReviews.map((review: any) => (
                      <button key={review.id} onClick={() => { setReviewMonth(review.month); setReviewYear(review.year); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: isDark ? "#252528" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`, borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#10B981"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"; }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart2 size={15} color="#10B981" /></div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif" }}>{new Date(review.year, review.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {review.focus_word && <span style={{ padding: "3px 10px", background: isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF", border: `1px solid ${isDark ? "rgba(123,94,167,0.3)" : "#DDD6FE"}`, borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#7B5EA7", fontFamily: "Inter, sans-serif" }}>{review.focus_word}</span>}
                          <ChevronRight size={14} color="#D1D5DB" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

            {/* Billing cycle toggle or locked state */}
            {annualLocked ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: isDark ? "rgba(16,185,129,0.08)" : "#F0FDF4", border: `1px solid ${isDark ? "rgba(16,185,129,0.2)" : "#BBF7D0"}`, borderRadius: 12, marginBottom: 28 }}>
                <LockIcon size={16} color="#10B981" />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#065F46", fontFamily: "Inter, sans-serif", margin: 0 }}>Annual Plan Active</p>
                  <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>Your plan renews {renewalDate} · You can upgrade anytime but cannot switch to monthly until renewal</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 28, background: isDark ? "#252528" : "#F3F4F6", borderRadius: 12, padding: 5, width: "fit-content", margin: "0 auto 28px" }}>
                <button onClick={() => setBillingCycle("monthly")} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: billingCycle === "monthly" ? (isDark ? "#333" : "white") : "transparent", fontSize: 14, fontWeight: billingCycle === "monthly" ? 600 : 400, color: billingCycle === "monthly" ? text1 : text2, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: billingCycle === "monthly" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 150ms" }}>Monthly</button>
                <button onClick={() => setBillingCycle("annual")} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: billingCycle === "annual" ? (isDark ? "#333" : "white") : "transparent", fontSize: 14, fontWeight: billingCycle === "annual" ? 600 : 400, color: billingCycle === "annual" ? text1 : text2, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: billingCycle === "annual" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 150ms", display: "flex", alignItems: "center", gap: 6 }}>
                  Annual
                  <span style={{ padding: "2px 8px", background: billingCycle === "annual" ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : (isDark ? "#333" : "#E5E7EB"), color: billingCycle === "annual" ? "#065F46" : text2, borderRadius: 999, fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>Save 28%</span>
                </button>
              </div>
            )}
            {billingCycle === "annual" && !annualLocked && (
              <p style={{ textAlign: "center", fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 20, marginTop: -16 }}>Billed annually · Cancel anytime after your year ends</p>
            )}

            {/* Plan cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 680, margin: "0 auto 24px" }}>
              {BILLING_PLANS.map(plan => (
                <div key={plan.tier} style={{ border: `2px solid ${currentPlan === plan.tier ? plan.color : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`, borderRadius: 18, padding: 24, position: "relative", background: currentPlan === plan.tier ? (isDark ? "rgba(255,255,255,0.03)" : plan.bg) : (isDark ? "#1C1C1E" : "white"), transition: "all 150ms" }}>
                  {plan.badge && (
                    <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "white", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 999, fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>{plan.badge}</div>
                  )}
                  {plan.limited && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444" }} />
                      <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 700, fontFamily: "Inter, sans-serif" }}>Limited — first 50 users only</span>
                    </div>
                  )}
                  <p style={{ fontSize: 13, fontWeight: 700, color: plan.color, textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "Inter, sans-serif", marginBottom: 8 }}>{plan.name}</p>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif", letterSpacing: "-1px" }}>${billingCycle === "annual" ? plan.annualMonthly : plan.monthlyPrice}</span>
                    <span style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif" }}>/month</span>
                  </div>
                  {billingCycle === "annual" && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif" }}>${plan.annualPrice} billed annually</span>
                      <span style={{ marginLeft: 8, padding: "2px 7px", background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4", color: "#065F46", borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>Save ${plan.monthlyPerYear - plan.annualPrice}/yr</span>
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 16, lineHeight: 1.5 }}>{plan.description}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                        <Check size={13} color={plan.color} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  {currentPlan === plan.tier ? (
                    <div>
                      <div style={{ padding: 10, background: plan.color + "15", borderRadius: 10, textAlign: "center", fontSize: 13, fontWeight: 700, color: plan.color, fontFamily: "Inter, sans-serif", marginBottom: 8 }}>Current Plan ✓</div>
                      {annualLocked && <p style={{ textAlign: "center", fontSize: 11, color: text2, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><LockIcon size={10} /> Renews {renewalDate}</p>}
                    </div>
                  ) : (
                    <button onClick={() => {
                      const url = billingCycle === "annual" ? plan.stripeAnnual : plan.stripeMonthly;
                      if (billingCycle === "annual") {
                        (supabase as any).from("user_preferences").upsert({ user_id: user!.id, billing_cycle: "annual", annual_start_date: new Date().toISOString() });
                      }
                      const link = document.createElement("a"); link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    }} style={{ width: "100%", padding: 12, background: plan.color, color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "opacity 150ms" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}>
                      Get {plan.name}{billingCycle === "annual" ? " — Annual" : ""}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Studio Add-on */}
            <div style={{ maxWidth: 680, margin: "0 auto 24px", background: "linear-gradient(135deg, #1C1C1E, #2D2B3D)", borderRadius: 18, padding: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 80% 50%, rgba(123,94,167,0.2) 0%, transparent 60%)" }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <FileText size={18} color="#C4B5FD" />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#C4B5FD", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "Inter, sans-serif", margin: 0 }}>Studio Add-on</p>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "white", fontFamily: "Inter, sans-serif", marginBottom: 6, letterSpacing: "-0.3px" }}>
                    Unlock Studio — $29.99<span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>one-time</span>
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", marginTop: 10 }}>
                    {["Full Studio HQ", "Content pipeline (8 stages)", "Invite your editor", "Real-time collaboration", "Content calendar", "Platform analytics", "Brand document storage", "Studio goals tracker"].map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Check size={12} color="#A78BFA" />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter, sans-serif" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {studioUnlocked ? (
                    <div style={{ padding: "12px 24px", background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 10, textAlign: "center" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#C4B5FD", fontFamily: "Inter, sans-serif", margin: 0, display: "flex", alignItems: "center", gap: 6 }}><Check size={16} /> Studio Unlocked</p>
                    </div>
                  ) : (
                    <button onClick={() => { const link = document.createElement("a"); link.href = "PASTE_STUDIO_ADDON_LINK"; link.target = "_blank"; link.rel = "noopener noreferrer"; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} style={{ padding: "14px 28px", background: "#7B5EA7", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                      <LockIcon size={16} /> Unlock Studio
                    </button>
                  )}
                  <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "Inter, sans-serif", marginTop: 6 }}>One-time payment · Yours forever</p>
                </div>
              </div>
            </div>

            {/* Student discount */}
            <div style={{ maxWidth: 680, margin: "0 auto 16px", padding: "16px 20px", background: isDark ? "rgba(59,130,246,0.08)" : "#EFF6FF", border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "#BFDBFE"}`, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BookOpen size={20} color="#3B82F6" />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D4ED8", fontFamily: "Inter, sans-serif", margin: 0 }}>Student? Get 50% off</p>
                  <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>Verify your .edu email address</p>
                </div>
              </div>
              <button onClick={() => setStudentModalOpen(true)} style={{ padding: "8px 18px", background: "#3B82F6", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>Verify Status</button>
            </div>

            {/* Student modal */}
            {studentModalOpen && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setStudentModalOpen(false)}>
                <div onClick={e => e.stopPropagation()} style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: 16, padding: 28, width: "90%", maxWidth: 400 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>Verify Student Status</h3>
                  <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Enter your .edu email to verify</p>
                  <input value={eduEmail} onChange={e => setEduEmail(e.target.value)} placeholder="you@university.edu" style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 14, color: text1, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" as const, background: inputBg, marginBottom: 12 }} />
                  <button onClick={async () => {
                    if (!eduEmail.endsWith(".edu")) { toast.error("Please use a .edu email address"); return; }
                    await (supabase as any).from("user_preferences").upsert({ user_id: user!.id, student_verified: true, student_email: eduEmail });
                    toast.success("Student status verified! 🎓 50% discount applied. Use code STUDENT50 at checkout.");
                    setStudentModalOpen(false);
                  }} style={{ width: "100%", padding: 10, background: "#3B82F6", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Verify & Apply Discount</button>
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
    </AppShell>
  );
}
