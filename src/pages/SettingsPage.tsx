import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import {
  User, Moon, Sun, Check, Camera, Building2, FileText, TrendingUp,
  Bell, ChevronRight, Search, ExternalLink,
} from "lucide-react";

const ACCENT_THEMES = [
  { name: "Emerald", primary: "#10B981", secondary: "#7B5EA7", label: "Default" },
  { name: "Ocean", primary: "#3B82F6", secondary: "#06B6D4", label: "Ocean" },
  { name: "Sunset", primary: "#F59E0B", secondary: "#EF4444", label: "Sunset" },
  { name: "Rose", primary: "#EC4899", secondary: "#7B5EA7", label: "Rose" },
  { name: "Slate", primary: "#6366F1", secondary: "#8B5CF6", label: "Violet" },
  { name: "Minimal", primary: "#374151", secondary: "#6B7280", label: "Minimal" },
];

const PLANS = [
  {
    tier: "free", name: "Free", price: "$0", period: "/month", color: "#6B7280",
    features: ["Dashboard & Journal", "Basic project tracking", "Up to 25 contacts", "Studio overview", "1 bank connection"],
  },
  {
    tier: "standard", name: "Standard", price: "$12", period: "/month", color: "#10B981", popular: true,
    features: ["Everything in Free", "Unlimited contacts", "AI trading plans", "Content pipeline", "Email templates", "Studio collaboration"],
  },
  {
    tier: "pro", name: "Pro", price: "$29", period: "/month", color: "#7B5EA7",
    features: ["Everything in Standard", "Unlimited AI generation", "Priority support", "Custom domain", "White-label option", "API access"],
  },
];

const BROKERS = ["Robinhood", "Webull", "TopStep", "IBKR", "E*Trade", "Fidelity", "TD Ameritrade", "Schwab"];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isDark = document.documentElement.classList.contains("dark");

  const [profileData, setProfileData] = useState({ full_name: "", handle: "", email: "", location: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(isDark);
  const [selectedTheme, setSelectedTheme] = useState("Emerald");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [substackModalOpen, setSubstackModalOpen] = useState(false);
  const [substackEmail, setSubstackEmail] = useState("");
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);
  const [preferredBroker, setPreferredBroker] = useState("");
  const [plaidConnected] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const storedTheme = localStorage.getItem("digi-home-theme");
      if (storedTheme === "dark") setIsDarkMode(true);
      setSubstackEmail(localStorage.getItem("substack-email") || "");
      setPreferredBroker(localStorage.getItem("preferred-broker") || "");
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").upsert({ id: user.id, full_name: profileData.full_name, updated_at: new Date().toISOString() });
    if (profileData.email !== user.email) {
      await supabase.auth.updateUser({ email: profileData.email });
    }
    setSaving(false);
    toast.success("Profile saved!");
  };

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("digi-home-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("digi-home-theme", "light");
    }
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

  const bg = isDark ? "#1C1C1E" : "white";
  const border = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6";
  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.4)" : "#6B7280";
  const inputBg = isDark ? "#252528" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";

  const sectionStyle: React.CSSProperties = { background: bg, borderRadius: 16, border: `1px solid ${border}`, padding: 24, marginBottom: 20 };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: text2, display: "block", marginBottom: 6, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 14, color: text1, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" as const, background: inputBg };

  const connections = [
    { key: "plaid", icon: Building2, color: "#3B82F6", title: "Plaid — Bank Sync", desc: "Connect your bank accounts for automatic transaction tracking", connected: plaidConnected, actionLabel: plaidConnected ? "Reconnect" : "Connect Bank" },
    { key: "substack", icon: FileText, color: "#FF6719", title: "Substack", desc: "Post journal entries directly to your Substack as drafts", connected: !!substackEmail, actionLabel: substackEmail ? "Change Email" : "Connect", detail: substackEmail || null, action: () => setSubstackModalOpen(true) },
    { key: "broker", icon: TrendingUp, color: "#10B981", title: "Trading Broker", desc: "Link your brokerage for one-click access from the Investing tab", connected: !!preferredBroker, actionLabel: preferredBroker ? "Change Broker" : "Connect", detail: preferredBroker || null, action: () => setBrokerModalOpen(true) },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 100px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif", margin: "4px 0 28px" }}>Manage your account and preferences</p>

        {/* PROFILE */}
        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <User size={18} color="#10B981" />
            <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Profile</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div onClick={() => avatarInputRef.current?.click()} style={{ width: 72, height: 72, borderRadius: "50%", background: isDark ? "#252528" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", border: `2px solid ${inputBorder}`, flexShrink: 0 }}>
              {avatarUrl ? <img src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, fontWeight: 700, color: text2 }}>{user?.email?.charAt(0).toUpperCase()}</span>}
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

        {/* APPEARANCE */}
        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Moon size={18} color="#7B5EA7" />
            <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Appearance</span>
          </div>
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
          <label style={labelStyle}>Accent Color</label>
          <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: "0 0 12px" }}>Customize your platform colors</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
          <button onClick={() => toast.success("Appearance saved!")} style={{ marginTop: 16, padding: "10px 24px", background: "#7B5EA7", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Save Appearance</button>
        </div>

        {/* CONNECTIONS */}
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
                    {item.connected && <span style={{ fontSize: 10, fontWeight: 600, color: "#10B981", background: "#F0FDF4", padding: "2px 8px", borderRadius: 999, fontFamily: "Inter, sans-serif" }}>Connected</span>}
                  </div>
                  <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>{item.detail || item.desc}</span>
                </div>
              </div>
              <button onClick={item.action} style={{ padding: "7px 16px", background: inputBg, border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{item.actionLabel}</button>
            </div>
          ))}
        </div>

        {/* PLAN & BILLING */}
        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <TrendingUp size={18} color="#F59E0B" />
            <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Plan & Billing</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {PLANS.map(plan => (
              <div key={plan.tier} style={{ padding: 18, border: `2px solid ${currentPlan === plan.tier ? plan.color : border}`, borderRadius: 14, background: currentPlan === plan.tier ? (isDark ? "#252528" : "#FAFAFA") : inputBg, position: "relative" }}>
                {plan.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "white", fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 999, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>MOST POPULAR</div>}
                <div style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 8 }}>{plan.name}</div>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif" }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif" }}>{plan.period}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Check size={14} color={plan.color} />
                      <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>{f}</span>
                    </div>
                  ))}
                </div>
                {currentPlan === plan.tier ? (
                  <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: plan.color, fontFamily: "Inter, sans-serif", padding: 8 }}>Current Plan</div>
                ) : (
                  <button onClick={() => toast.success("Upgrade coming soon!")} style={{ width: "100%", padding: 8, background: plan.color, color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                    {currentPlan === "free" ? "Upgrade" : "Switch Plan"}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>
            <FileText size={14} color={text2} />
            <span>Templates are available on all plans: <strong style={{ color: text1 }}>$8 single · $25 bundle</strong></span>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Bell size={18} color="#EF4444" />
            <span style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Notifications</span>
          </div>
          <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", margin: "0 0 14px" }}>Notification settings are managed in the notification panel.</p>
          <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: inputBg, border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <Bell size={14} />
            Open Notification Settings
          </button>
        </div>
      </div>

      {/* SUBSTACK MODAL */}
      {substackModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 12 }}>Substack Email</h3>
            <label style={labelStyle}>Your Substack draft email</label>
            <input value={substackEmail} onChange={e => setSubstackEmail(e.target.value)} placeholder="you@email.substack.com" style={inputStyle} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setSubstackModalOpen(false)} style={{ flex: 1, padding: 10, border: `1.5px solid ${inputBorder}`, borderRadius: 10, background: inputBg, fontSize: 13, fontWeight: 500, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={() => { localStorage.setItem("substack-email", substackEmail); setSubstackModalOpen(false); toast.success("Substack connected!"); }} style={{ flex: 1, padding: 10, background: "#FF6719", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* BROKER MODAL */}
      {brokerModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 12 }}>Preferred Broker</h3>
            <label style={labelStyle}>Select your broker</label>
            <select value={preferredBroker} onChange={e => setPreferredBroker(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Select a broker...</option>
              {BROKERS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setBrokerModalOpen(false)} style={{ flex: 1, padding: 10, border: `1.5px solid ${inputBorder}`, borderRadius: 10, background: inputBg, fontSize: 13, fontWeight: 500, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={() => { localStorage.setItem("preferred-broker", preferredBroker); setBrokerModalOpen(false); toast.success("Broker saved!"); }} style={{ flex: 1, padding: 10, background: "#10B981", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
