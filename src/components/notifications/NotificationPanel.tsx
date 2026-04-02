
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, Settings, DollarSign, CreditCard, Clapperboard, FolderOpen, Users, BookOpen, UserPlus, FileText, Download, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  message: string;
  category: string | null;
  read: boolean;
  actioned: boolean;
  action_url: string | null;
  avatar_url: string | null;
  attachment: any;
  created_at: string;
}

interface NotificationPanelProps {
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
  userId: string;
}

const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getNotifColor = (type: string, isDark: boolean) => {
  const colors: Record<string, string> = {
    money: isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4",
    bill: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7",
    studio: isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF",
    project: isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF",
    contact: isDark ? "rgba(236,72,153,0.15)" : "#FDF2F8",
    journal: isDark ? "rgba(6,182,212,0.15)" : "#ECFEFF",
    studio_invite: isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF",
    system: isDark ? "rgba(255,255,255,0.06)" : "#F9FAFB",
  };
  return colors[type] || colors.system;
};

const getNotifIcon = (type: string) => {
  const p = { size: 18, strokeWidth: 2 };
  switch (type) {
    case "money": return <DollarSign {...p} color="#10B981" />;
    case "bill": return <CreditCard {...p} color="#F59E0B" />;
    case "studio": return <Clapperboard {...p} color="#7B5EA7" />;
    case "project": return <FolderOpen {...p} color="#3B82F6" />;
    case "contact": return <Users {...p} color="#EC4899" />;
    case "journal": return <BookOpen {...p} color="#06B6D4" />;
    case "studio_invite": return <UserPlus {...p} color="#7B5EA7" />;
    default: return <Bell {...p} color="#6B7280" />;
  }
};

const sampleNotifs = (userId: string): Omit<Notification, "id">[] => [
  { user_id: userId, type: "bill", title: "Mint Mobile", message: "$150.00 due in 3 days", category: "Money", read: false, actioned: false, action_url: "/finance/wealth", avatar_url: null, attachment: null, created_at: new Date(Date.now() - 3600000).toISOString() },
  { user_id: userId, type: "project", title: "Chicago Summer", message: "Project deadline is approaching — due Apr 29", category: "Projects", read: false, actioned: false, action_url: "/projects", avatar_url: null, attachment: null, created_at: new Date(Date.now() - 7200000).toISOString() },
  { user_id: userId, type: "studio", title: "Weekly Tips Reel", message: "Content is due Next Tuesday — currently In Progress", category: "Studio", read: true, actioned: false, action_url: "/studio", avatar_url: null, attachment: null, created_at: new Date(Date.now() - 86400000).toISOString() },
  { user_id: userId, type: "contact", title: "Princess Tope'", message: "Follow-up overdue — last contacted 999 days ago", category: "Contacts", read: false, actioned: false, action_url: "/relationships", avatar_url: null, attachment: null, created_at: new Date(Date.now() - 172800000).toISOString() },
  { user_id: userId, type: "money", title: "Net Worth Update", message: "Your net worth is $2.8K. Income: $6,000/mo · Debt: $7.2K", category: "Money", read: true, actioned: false, action_url: "/finance/wealth", avatar_url: null, attachment: null, created_at: new Date(Date.now() - 259200000).toISOString() },
];

export default function NotificationPanel({ onClose, onUnreadCountChange, userId }: NotificationPanelProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const isDark = document.documentElement.classList.contains("dark");
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState<Record<string, any>>({
    bills: true, followups: true, projects: true, content: true, studio: true, money: true,
    quiet_mode: false, quiet_from: "22:00", quiet_to: "08:00",
  });
  const [pushPermission, setPushPermission] = useState<string>("default");

  useEffect(() => {
    if ("Notification" in window) setPushPermission(Notification.permission);
  }, []);

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await (supabase as any).from("user_preferences").select("notification_settings").eq("user_id", userId).maybeSingle();
      if (data?.notification_settings && Object.keys(data.notification_settings).length > 0) {
        setNotifSettings(prev => ({ ...prev, ...data.notification_settings }));
      }
    };
    loadSettings();
  }, [userId]);

  const handleRequestPush = async () => {
    if (!("Notification" in window)) { toast("Your browser doesn't support push notifications."); return; }
    if (Notification.permission === "denied") { toast("Notifications blocked — enable in browser settings."); return; }
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission === "granted") {
      toast("Notifications enabled! 🔔");
      setTimeout(() => { new Notification("Digital Home", { body: "You're all set! Notifications are working.", icon: "/favicon.ico" }); }, 1000);
    }
  };

  const toggleNotifType = (key: string) => setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const updateNotifSetting = (key: string, value: any) => setNotifSettings(prev => ({ ...prev, [key]: value }));

  const saveNotifSettings = async () => {
    const { data: existing } = await (supabase as any).from("user_preferences").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await (supabase as any).from("user_preferences").update({ notification_settings: notifSettings, updated_at: new Date().toISOString() }).eq("user_id", userId);
    } else {
      await (supabase as any).from("user_preferences").insert({ user_id: userId, notification_settings: notifSettings });
    }
    setNotifSettingsOpen(false);
    toast("Settings saved!");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    onUnreadCountChange(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Load notifications
  useEffect(() => {
    const load = async () => {
      const { data, count } = await (supabase as any).from("notifications").select("*", { count: "exact" }).eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
      if (count === 0 || (!data || data.length === 0)) {
        const samples = sampleNotifs(userId);
        const { data: inserted } = await (supabase as any).from("notifications").insert(samples).select();
        setNotifications(inserted || []);
      } else {
        setNotifications(data || []);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel("notifs-realtime").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload: any) => {
      setNotifications(prev => [payload.new as Notification, ...prev]);
      toast(payload.new.title || "New notification", { description: payload.new.message });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const panel = document.querySelector(".notif-panel");
      const bell = document.querySelector(".notif-bell");
      if (panel && !panel.contains(e.target as Node) && !bell?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleMarkRead = async (id: string) => {
    await (supabase as any).from("notifications").update({ read: true }).eq("id", id).eq("user_id", userId);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await (supabase as any).from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    const wasUnread = notif && !notif.read;
    await (supabase as any).from("notifications").delete().eq("id", id).eq("user_id", userId);
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast("Notification removed");
  };

  const handleAction = (notif: Notification) => {
    if (!notif.action_url) return;
    onClose();
    navigate(notif.action_url);
  };

  const filtered = notifications.filter(n => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "mentions") return n.type === "mention";
    return true;
  });

  const panelBg = isDark ? "#1C1C1E" : "white";
  const panelBorder = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const panelShadow = isDark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(0,0,0,0.15)";
  const headerBorder = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6";
  const titleColor = isDark ? "#F2F2F2" : "#111827";
  const mutedIcon = isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF";
  const tabActiveBg = isDark ? "#1C1C1E" : "white";
  const tabActiveBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";
  const tabActiveColor = isDark ? "#F2F2F2" : "#111827";
  const tabInactiveColor = isDark ? "rgba(255,255,255,0.4)" : "#6B7280";
  const markAllColor = isDark ? "rgba(255,255,255,0.6)" : "#374151";
  const rowHoverBg = isDark ? "#252528" : "#F9FAFB";
  const rowUnreadBg = isDark ? "rgba(16,185,129,0.04)" : "rgba(16,185,129,0.03)";
  const contentColor = isDark ? "#F2F2F2" : "#111827";
  const timeColor = isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF";
  const deleteBtnBg = isDark ? "#252528" : "white";
  const deleteBtnBorder = isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6";
  const emptyIconColor = isDark ? "rgba(255,255,255,0.15)" : "#D1D5DB";
  const emptyTextColor = isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF";

  return (
    <div className="notif-panel" style={{
      position: "fixed", top: "60px", right: "16px", width: "420px", maxHeight: "600px",
      background: panelBg, borderRadius: "16px", border: `1px solid ${panelBorder}`,
      boxShadow: panelShadow, zIndex: 9999, display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${headerBorder}`, flexShrink: 0 }}>
        <h3 style={{ fontSize: "17px", fontWeight: "700", color: titleColor, fontFamily: "Inter, sans-serif", margin: 0 }}>Notifications</h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Settings size={16} color={mutedIcon} style={{ cursor: "pointer" }} onClick={() => setNotifSettingsOpen(true)} />
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}>
            <X size={18} color={mutedIcon} />
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", padding: "12px 20px 0", gap: "4px", flexShrink: 0, borderBottom: `1px solid ${headerBorder}` }}>
        {[
          { id: "all", label: "View all" },
          { id: "mentions", label: "Mentions" },
          { id: "unread", label: `Unread (${unreadCount})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "7px 14px", borderRadius: "8px 8px 0 0", border: "1px solid",
            borderBottom: "none", borderColor: activeTab === tab.id ? tabActiveBorder : "transparent",
            background: activeTab === tab.id ? tabActiveBg : "transparent",
            fontSize: "13px", fontWeight: activeTab === tab.id ? "600" : "400",
            color: activeTab === tab.id ? tabActiveColor : tabInactiveColor,
            cursor: "pointer", fontFamily: "Inter, sans-serif", marginBottom: "-1px",
          }}>
            {tab.label}
          </button>
        ))}
        <button onClick={handleMarkAllRead} style={{
          marginLeft: "auto", padding: "7px 0", background: "transparent", border: "none",
          fontSize: "13px", fontWeight: "500", color: markAllColor, cursor: "pointer",
          fontFamily: "Inter, sans-serif", marginBottom: "8px",
        }}>
          Mark all as read
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: timeColor, fontFamily: "Inter, sans-serif" }}>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <Bell size={36} color={emptyIconColor} style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ fontSize: "15px", fontWeight: "600", color: titleColor, fontFamily: "Inter, sans-serif", marginBottom: "4px" }}>All caught up</p>
            <p style={{ fontSize: "13px", color: emptyTextColor, fontFamily: "Inter, sans-serif" }}>No notifications yet</p>
          </div>
        ) : (
          filtered.map(notif => (
            <div key={notif.id} className="notif-row" style={{
              display: "flex", gap: "12px", padding: "12px 20px", position: "relative",
              background: notif.read ? "transparent" : rowUnreadBg, cursor: "pointer", transition: "background 150ms",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = rowHoverBg; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = notif.read ? "transparent" : rowUnreadBg; }}
              onClick={() => { handleMarkRead(notif.id); handleAction(notif); }}
            >
              {!notif.read && (
                <div style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
              )}
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                background: getNotifColor(notif.type, isDark), display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {notif.avatar_url ? <img src={notif.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : getNotifIcon(notif.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", color: contentColor, lineHeight: "1.5", fontFamily: "Inter, sans-serif", marginBottom: "3px" }}>
                  {notif.title && <strong style={{ fontWeight: "700" }}>{notif.title} </strong>}
                  {notif.message}
                </p>
                <p style={{ fontSize: "11px", color: timeColor, fontFamily: "Inter, sans-serif" }}>
                  {formatRelativeTime(notif.created_at)}
                  {notif.category && <span style={{ marginLeft: "6px", color: isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB" }}>· {notif.category}</span>}
                </p>
                {notif.attachment && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", padding: "8px 10px",
                    background: isDark ? "#252528" : "#F9FAFB", borderRadius: "8px", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`,
                  }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={14} color="#DC2626" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "12px", fontWeight: "500", color: contentColor, fontFamily: "Inter, sans-serif" }}>{notif.attachment.name}</p>
                      <p style={{ fontSize: "11px", color: timeColor, fontFamily: "Inter, sans-serif" }}>{notif.attachment.size}</p>
                    </div>
                    <button style={{ background: "transparent", border: "none", cursor: "pointer", color: mutedIcon }}><Download size={14} /></button>
                  </div>
                )}
              </div>
              <button className="notif-delete" onClick={e => { e.stopPropagation(); handleDelete(notif.id); }} style={{
                position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
                background: deleteBtnBg, border: `1px solid ${deleteBtnBorder}`, borderRadius: "6px",
                padding: "4px 6px", cursor: "pointer", opacity: 0, transition: "opacity 150ms",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}>
                <X size={12} color={mutedIcon} />
              </button>
            </div>
          ))
        )}
      </div>

      <style>{`.notif-row:hover .notif-delete { opacity: 1 !important; }`}</style>

      {/* Notification Settings Modal */}
      {notifSettingsOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setNotifSettingsOpen(false)}>
          <div style={{ background: isDark ? "#1C1C1E" : "white", borderRadius: "20px", width: "min(480px, 95vw)", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif", margin: 0, marginBottom: "2px" }}>Notification Settings</h2>
                <p style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF", fontFamily: "Inter, sans-serif", margin: 0 }}>Control what you hear about</p>
              </div>
              <button onClick={() => setNotifSettingsOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={18} color="#6B7280" /></button>
            </div>
            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {/* Push Notifications */}
              <div style={{ marginBottom: "28px" }}>
                <p style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "14px", fontFamily: "Inter, sans-serif" }}>Device Notifications</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isDark ? "#252528" : "#F9FAFB", borderRadius: "12px" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif", marginBottom: "2px" }}>Push Notifications</p>
                    <p style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", fontFamily: "Inter, sans-serif" }}>
                      {pushPermission === "granted" ? "✓ Enabled on this device" : pushPermission === "denied" ? "✗ Blocked — enable in browser settings" : "Get notified on your device"}
                    </p>
                  </div>
                  <button onClick={handleRequestPush} style={{ padding: "7px 16px", background: pushPermission === "granted" ? "#F0FDF4" : pushPermission === "denied" ? "#FEF2F2" : "#10B981", color: pushPermission === "granted" ? "#065F46" : pushPermission === "denied" ? "#DC2626" : "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: pushPermission === "denied" ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>
                    {pushPermission === "granted" ? "Enabled ✓" : pushPermission === "denied" ? "Blocked" : "Enable"}
                  </button>
                </div>
              </div>
              {/* Notification Types */}
              <div style={{ marginBottom: "28px" }}>
                <p style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "14px", fontFamily: "Inter, sans-serif" }}>Notify Me About</p>
                {[
                  { key: "bills", Icon: CreditCard, color: "#F59E0B", label: "Upcoming Bills", desc: "Bills due within 7 days" },
                  { key: "followups", Icon: Users, color: "#EC4899", label: "Contact Follow-ups", desc: "Overdue relationship check-ins" },
                  { key: "projects", Icon: FolderOpen, color: "#3B82F6", label: "Project Deadlines", desc: "Tasks due within 3 days" },
                  { key: "content", Icon: Clapperboard, color: "#7B5EA7", label: "Content Due", desc: "Scheduled posts approaching" },
                  { key: "studio", Icon: TrendingUp, color: "#10B981", label: "Studio Updates", desc: "New comments and milestones" },
                  { key: "money", Icon: DollarSign, color: "#10B981", label: "Money Alerts", desc: "Net worth and balance updates" },
                ].map(item => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: item.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <item.Icon size={16} color={item.color} />
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif", marginBottom: "1px" }}>{item.label}</p>
                        <p style={{ fontSize: "11px", color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF", fontFamily: "Inter, sans-serif" }}>{item.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleNotifType(item.key)} style={{ width: "44px", height: "24px", borderRadius: "999px", border: "none", background: notifSettings[item.key] ? "#10B981" : isDark ? "#3A3A3C" : "#E5E7EB", cursor: "pointer", position: "relative", transition: "background 200ms", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: "2px", left: notifSettings[item.key] ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 200ms ease" }} />
                    </button>
                  </div>
                ))}
              </div>
              {/* Quiet Hours */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "14px", fontFamily: "Inter, sans-serif" }}>Quiet Hours</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>Do Not Disturb</p>
                    <p style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", fontFamily: "Inter, sans-serif" }}>Pause all notifications</p>
                  </div>
                  <button onClick={() => toggleNotifType("quiet_mode")} style={{ width: "44px", height: "24px", borderRadius: "999px", border: "none", background: notifSettings.quiet_mode ? "#10B981" : isDark ? "#3A3A3C" : "#E5E7EB", cursor: "pointer", position: "relative", transition: "background 200ms" }}>
                    <div style={{ position: "absolute", top: "2px", left: notifSettings.quiet_mode ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 200ms" }} />
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[{ key: "quiet_from", label: "From", def: "22:00" }, { key: "quiet_to", label: "To", def: "08:00" }].map(t => (
                    <div key={t.key}>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", display: "block", marginBottom: "5px", fontFamily: "Inter, sans-serif" }}>{t.label}</label>
                      <input type="time" value={notifSettings[t.key] || t.def} onChange={e => updateNotifSetting(t.key, e.target.value)} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: "8px", fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151", background: isDark ? "#252528" : "white", outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`, display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setNotifSettingsOpen(false)} style={{ padding: "9px 20px", border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: "8px", background: isDark ? "#252528" : "white", fontSize: "13px", fontWeight: "500", color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={saveNotifSettings} style={{ padding: "9px 20px", border: "none", borderRadius: "8px", background: "#10B981", fontSize: "13px", fontWeight: "600", color: "white", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
