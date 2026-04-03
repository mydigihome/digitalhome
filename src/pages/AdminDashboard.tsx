import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import {
  Shield, Users, Activity, DollarSign, FileText, Target, BookOpen,
  ShoppingBag, UserCheck, Bell, Download, ExternalLink, RefreshCw, Lock, ChevronRight,
  X, Trash2, CreditCard, MessageSquare, Megaphone, Loader2,
  TrendingUp, UserMinus, Check, Send, Hash, Calendar, Clock, MapPin, Mail, Folder, Film,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface AdminStats {
  totalUsers: number;
  newThisWeek: number;
  activeToday: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  totalContent: number;
  totalJournals: number;
  totalContacts: number;
  totalProjects: number;
  totalPurchases: number;
}

function UserActivityStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<any>({});
  useEffect(() => {
    (async () => {
      const [
        { count: projects },
        { count: contacts },
        { count: journals },
        { count: content },
      ] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("content_items").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      setStats({ projects: projects || 0, contacts: contacts || 0, journals: journals || 0, content: content || 0 });
    })();
  }, [userId]);
  return stats;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const isDark = document.documentElement.classList.contains("dark");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, newThisWeek: 0, activeToday: 0, totalRevenue: 0, thisMonthRevenue: 0, totalContent: 0, totalJournals: 0, totalContacts: 0, totalProjects: 0, totalPurchases: 0 });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<any[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [ghostUser, setGhostUser] = useState<any>(null);
  const [ghostPanelOpen, setGhostPanelOpen] = useState(false);
  const [userDetail, setUserDetail] = useState<any>({});
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState("system");
  const [announcementSending, setAnnouncementSending] = useState(false);
  const [announcementHistory, setAnnouncementHistory] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<"overview" | "strategy">("overview");
  const [churnRiskUsers, setChurnRiskUsers] = useState<any[]>([]);
  const [strategyNotes, setStrategyNotes] = useState("");

  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.4)" : "#6B7280";
  const cardBg = isDark ? "#1C1C1E" : "white";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6";
  const inputBg = isDark ? "#252528" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";
  const tableBg = isDark ? "#252528" : "#F9FAFB";
  const rowBorder = isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6";

  const isAdmin = user?.email === "myslimher@gmail.com";

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const [
        { count: totalUsers },
        { count: newThisWeek },
        { data: profilesList },
        { count: totalContent },
        { count: totalJournals },
        { count: totalContacts },
        { count: totalProjects },
        { data: purchases },
        { data: activity },
        { data: feedbackData },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("content_items").select("*", { count: "exact", head: true }),
        supabase.from("journal_entries").select("*", { count: "exact", head: true }),
        supabase.from("contacts").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("template_purchases").select("*"),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("feedback").select("*").order("created_at", { ascending: false }),
      ]);
      const totalRevenue = (purchases || []).reduce((s: number, p: any) => s + (p.amount_paid || 0), 0) / 100;
      const now = new Date();
      const thisMonthRevenue = (purchases || []).filter((p: any) => { const d = new Date(p.purchased_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s: number, p: any) => s + (p.amount_paid || 0), 0) / 100;
      setStats({ totalUsers: totalUsers || 0, newThisWeek: newThisWeek || 0, activeToday: 0, totalRevenue, thisMonthRevenue, totalContent: totalContent || 0, totalJournals: totalJournals || 0, totalContacts: totalContacts || 0, totalProjects: totalProjects || 0, totalPurchases: (purchases || []).length });
      setUsersList(profilesList || []);
      setRecentActivity(activity || []);
      setFeedbackItems(feedbackData || []);
      const byMonth: Record<string, number> = {};
      (purchases || []).forEach((p: any) => { const m = new Date(p.purchased_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" }); byMonth[m] = (byMonth[m] || 0) + (p.amount_paid || 0) / 100; });
      setRevenueData(Object.entries(byMonth).map(([month, amount]) => ({ month, amount })));
      const growthMap: Record<string, number> = {};
      (profilesList || []).forEach((u: any) => { const m = new Date(u.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" }); growthMap[m] = (growthMap[m] || 0) + 1; });
      setGrowthData(Object.entries(growthMap).reverse().map(([month, count]) => ({ month, count })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadAnnouncementHistory = async () => {
    const { data } = await (supabase as any).from("announcements").select("*").order("created_at", { ascending: false }).limit(10);
    setAnnouncementHistory(data || []);
  };

  const loadStrategyData = async () => {
    const { data: allUsers } = await supabase.from("profiles").select("id, email, last_login, created_at");
    const churnRisk = (allUsers || []).filter((u: any) => { if (!u.last_login) return true; const days = Math.floor((Date.now() - new Date(u.last_login).getTime()) / 86400000); return days >= 14; }).map((u: any) => ({ ...u, daysSinceLogin: u.last_login ? Math.floor((Date.now() - new Date(u.last_login).getTime()) / 86400000) : 999 })).sort((a: any, b: any) => b.daysSinceLogin - a.daysSinceLogin);
    setChurnRiskUsers(churnRisk.slice(0, 20));
    const { data: notes } = await (supabase as any).from("app_settings").select("value").eq("key", "strategy_notes").maybeSingle();
    if (notes?.value) setStrategyNotes(notes.value);
  };

  const loadUserDetail = async (userId: string) => {
    const [
      { data: projects },
      { data: contacts },
      { data: journals },
      { data: content },
      { data: feedback },
    ] = await Promise.all([
      supabase.from("projects").select("id, name, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("contacts").select("id, name, created_at").eq("user_id", userId).limit(5),
      supabase.from("journal_entries").select("id, title, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("content_items").select("id, title, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("feedback").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    ]);
    setUserDetail({ projects: projects || [], contacts: contacts || [], journals: journals || [], content: content || [], feedback: feedback || [] });
  };

  useEffect(() => { loadData(); loadAnnouncementHistory(); loadStrategyData(); }, [isAdmin]);

  if (!isAdmin) {
    return (
      <AppShell>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
          <Lock size={48} color={text2} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Admin Access Only</h2>
          <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif" }}>You don't have permission to view this page.</p>
        </div>
      </AppShell>
    );
  }

  const metricCards = [
    { label: "Total Users", value: stats.totalUsers, change: `+${stats.newThisWeek} this week`, Icon: Users, color: "#3B82F6" },
    { label: "Active Today", value: stats.activeToday || "—", change: `of ${stats.totalUsers} total`, Icon: Activity, color: "#10B981" },
    { label: "This Month Revenue", value: `$${stats.thisMonthRevenue.toFixed(2)}`, change: `$${stats.totalRevenue.toFixed(2)} all time`, Icon: DollarSign, color: "#F59E0B" },
    { label: "Content Created", value: stats.totalContent, change: `${stats.totalJournals} journal entries`, Icon: FileText, color: "#7B5EA7" },
  ];

  const secondRow = [
    { label: "Total Contacts", value: stats.totalContacts, Icon: UserCheck, color: "#EC4899" },
    { label: "Projects/Goals", value: stats.totalProjects, Icon: Target, color: "#10B981" },
    { label: "Journal Entries", value: stats.totalJournals, Icon: BookOpen, color: "#06B6D4" },
    { label: "Template Sales", value: stats.totalPurchases, Icon: ShoppingBag, color: "#F59E0B" },
  ];

  const usageItems = [
    { label: "Journal Entries", count: stats.totalJournals, color: "#06B6D4", Icon: BookOpen },
    { label: "Contacts", count: stats.totalContacts, color: "#EC4899", Icon: Users },
    { label: "Projects/Goals", count: stats.totalProjects, color: "#10B981", Icon: Target },
    { label: "Content Items", count: stats.totalContent, color: "#7B5EA7", Icon: FileText },
  ];
  const maxUsage = Math.max(...usageItems.map(i => i.count), 1);

  const filteredUsers = usersList.filter(u => !userSearch || u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()));

  const sendAnnouncementHandler = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) return;
    setAnnouncementSending(true);
    try {
      const { data: allUsers } = await supabase.from("profiles").select("id");
      if (!allUsers?.length) { toast.error("No users found"); return; }
      await supabase.from("notifications").insert(allUsers.map((u: any) => ({ user_id: u.id, type: announcementType, title: announcementTitle.trim(), message: announcementMessage.trim(), category: "Announcement", read: false })));
      await (supabase as any).from("announcements").insert({ sent_by: user!.id, title: announcementTitle.trim(), message: announcementMessage.trim(), type: announcementType, recipient_count: allUsers.length });
      setAnnouncementTitle(""); setAnnouncementMessage(""); setAnnouncementType("system");
      await loadAnnouncementHistory();
      toast.success(`Sent to ${allUsers.length} users!`);
    } catch (err: any) { toast.error("Send failed: " + err.message); } finally { setAnnouncementSending(false); }
  };

  const exportCSV = async () => {
    const { data: users, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error || !users) { toast.error("Export failed"); return; }
    const headers = ["ID", "Name", "Plan", "Joined", "Last Active"];
    const rows = users.map(u => [u.id || "", (u.full_name || "").replace(/,/g, ";"), "free", u.created_at ? new Date(u.created_at).toLocaleDateString() : "", u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `digitalhome-users-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${users.length} users`);
  };

  const cardStyle: React.CSSProperties = { background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 18 };

  return (
    <AppShell>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 16px 100px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>Admin Dashboard</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
              <span style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif" }}>Live · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
          <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: cardBg, border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* TAB NAV */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: isDark ? "#252528" : "#F3F4F6", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {(["overview", "strategy"] as const).map(tab => (
            <button key={tab} onClick={() => setAdminTab(tab)} style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: adminTab === tab ? (isDark ? "#333" : "white") : "transparent", fontSize: 13, fontWeight: adminTab === tab ? 600 : 400, color: adminTab === tab ? text1 : text2, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: adminTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none", textTransform: "capitalize" as const }}>{tab === "strategy" ? "Strategy" : "Overview"}</button>
          ))}
        </div>

        {adminTab === "overview" && (<>
        {/* COMPACT ANNOUNCEMENTS */}
        <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${cardBorder}`, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Megaphone size={15} color="#10B981" />
            <span style={{ fontSize: 14, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Broadcast to All Users</span>
            {announcementHistory.length > 0 && <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif", marginLeft: "auto" }}>{announcementHistory.length} sent</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <input value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} placeholder="Title" style={{ width: "100%", padding: "8px 12px", border: `1px solid ${inputBorder}`, borderRadius: 7, fontSize: 13, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" as const, marginBottom: 6, background: inputBg }} onFocus={e => { e.target.style.borderColor = "#10B981"; }} onBlur={e => { e.target.style.borderColor = inputBorder; }} />
              <textarea value={announcementMessage} onChange={e => setAnnouncementMessage(e.target.value)} placeholder="Write your message to all users..." rows={2} style={{ width: "100%", padding: "8px 12px", border: `1px solid ${inputBorder}`, borderRadius: 7, fontSize: 13, color: text1, fontFamily: "Inter, sans-serif", resize: "none" as const, outline: "none", boxSizing: "border-box" as const, lineHeight: "1.5", background: inputBg }} onFocus={e => { e.target.style.borderColor = "#10B981"; }} onBlur={e => { e.target.style.borderColor = inputBorder; }} />
            </div>
            <button onClick={sendAnnouncementHandler} disabled={announcementSending || !announcementTitle.trim() || !announcementMessage.trim()} style={{ padding: "8px 16px", background: announcementTitle.trim() && announcementMessage.trim() ? "#10B981" : (isDark ? "#333" : "#F3F4F6"), color: announcementTitle.trim() && announcementMessage.trim() ? "white" : text2, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: announcementTitle.trim() && announcementMessage.trim() ? "pointer" : "not-allowed", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" as const, flexShrink: 0, alignSelf: "flex-end", marginBottom: 1, display: "flex", alignItems: "center", gap: 6, transition: "all 150ms" }}>
              {announcementSending ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send</>}
            </button>
          </div>
          {announcementHistory.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB"}` }}>
              {announcementHistory.slice(0, 3).map((a: any) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: text1, fontFamily: "Inter, sans-serif" }}>{a.title}</span>
                  <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>{new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {a.recipient_count} users</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOP METRICS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
          {metricCards.map((s, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: text2, fontFamily: "Inter, sans-serif", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}><s.Icon size={16} color={s.color} /></div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif" }}>{loading ? "—" : s.value}</div>
              <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>{s.change}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {secondRow.map((s, i) => (
            <div key={i} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><s.Icon size={18} color={s.color} /></div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif" }}>{loading ? "—" : s.value}</div>
                <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Revenue Over Time</h3>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}><XAxis dataKey="month" tick={{ fontSize: 11, fill: text2 }} /><YAxis tick={{ fontSize: 11, fill: text2 }} tickFormatter={(v: number) => `$${v}`} /><Tooltip formatter={(v: number) => [`$${v}`, "Revenue"]} /><Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            ) : <p style={{ fontSize: 13, color: text2, textAlign: "center", padding: 40, fontFamily: "Inter, sans-serif" }}>No revenue data yet</p>}
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>User Growth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={growthData}><XAxis dataKey="month" tick={{ fontSize: 11, fill: text2 }} /><YAxis tick={{ fontSize: 11, fill: text2 }} /><Tooltip /><Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F620" /></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PLATFORM USAGE */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Platform Usage</h3>
          {usageItems.map(item => {
            const pct = Math.round((item.count / maxUsage) * 100);
            return (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><item.Icon size={14} color={item.color} /><span style={{ fontSize: 13, color: text1, fontFamily: "Inter, sans-serif" }}>{item.label}</span></div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>{item.count}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: isDark ? "#252528" : "#F3F4F6" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: item.color, width: `${pct}%`, transition: "width 500ms" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* USER TABLE */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>All Users ({stats.totalUsers})</h3>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." style={{ padding: "7px 12px", border: `1px solid ${inputBorder}`, borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", width: 200, background: inputBg, color: text1 }} />
          </div>
          <div style={{ background: tableBg, borderRadius: 8, padding: "8px 14px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 140px", gap: 8, marginBottom: 4 }}>
            {["Name", "Plan", "Joined", "Actions"].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: text2, fontFamily: "Inter, sans-serif", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{h}</span>)}
          </div>
          {filteredUsers.slice(0, 30).map(u => (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 140px", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${rowBorder}`, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: isDark ? "#252528" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: text2 }}>{(u.full_name || "?").charAt(0).toUpperCase()}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif" }}>{u.full_name || "No name"}</span>
              </div>
              <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>free</span>
              <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => { setGhostUser(u); setGhostPanelOpen(true); loadUserDetail(u.id); }} style={{ padding: "4px 8px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, fontSize: 11, color: "#1D4ED8", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>View</button>
                <button onClick={async () => { const msg = prompt("Notification message:"); if (!msg) return; await supabase.from("notifications").insert({ user_id: u.id, type: "system", title: "Message from Admin", message: msg, read: false }); toast.success("Notification sent!"); }} style={{ padding: "4px 8px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, fontSize: 11, color: "#065F46", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Notify</button>
              </div>
            </div>
          ))}
        </div>

        {/* FEEDBACK INBOX */}
        <div style={{ ...cardStyle, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>User Feedback</h3>
              {feedbackItems.filter(f => f.status === "pending").length > 0 && (
                <span style={{ padding: "2px 8px", background: "#FEF2F2", color: "#DC2626", borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>{feedbackItems.filter(f => f.status === "pending").length} new</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "Bug Report", "Feature Request", "General Feedback", "Billing Issue"].map(f => (
                <button key={f} onClick={() => setFeedbackFilter(f)} style={{ padding: "4px 10px", borderRadius: 999, border: "1px solid", borderColor: feedbackFilter === f ? "#10B981" : inputBorder, background: feedbackFilter === f ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : cardBg, color: feedbackFilter === f ? "#065F46" : text2, fontSize: 11, fontWeight: feedbackFilter === f ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{f === "all" ? "All" : f}</button>
              ))}
            </div>
          </div>
          {(feedbackItems || []).filter(f => feedbackFilter === "all" || f.message?.includes(feedbackFilter)).map(item => (
            <div key={item.id} style={{ padding: "16px 0", borderBottom: `1px solid ${rowBorder}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {item.status === "pending" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />}
                  <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>From: {item.email || "Unknown"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>{new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  {item.status === "pending" && (
                    <button onClick={async () => { await supabase.from("feedback").update({ status: "reviewed" } as any).eq("id", item.id); setFeedbackItems(prev => prev.map(f => f.id === item.id ? { ...f, status: "reviewed" } : f)); }} style={{ padding: "3px 8px", background: "transparent", border: `1px solid ${inputBorder}`, borderRadius: 6, fontSize: 11, color: text2, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Mark read</button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: text1, fontFamily: "Inter, sans-serif", lineHeight: 1.5, margin: 0 }}>{item.message}</p>
            </div>
          ))}
          {feedbackItems.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <MessageSquare size={36} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif" }}>No feedback submitted yet</p>
            </div>
          )}
        </div>

        {/* BOTTOM ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Recent Platform Activity</h3>
            {recentActivity.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < recentActivity.length - 1 ? `1px solid ${rowBorder}` : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#3B82F615", display: "flex", alignItems: "center", justifyContent: "center" }}><Activity size={12} color="#3B82F6" /></div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: text1, fontFamily: "Inter, sans-serif" }}>{a.message?.substring(0, 60) || "Activity"}</span>
                  <span style={{ fontSize: 10, color: text2, fontFamily: "Inter, sans-serif", display: "block" }}>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Admin Actions</h3>
            {[
              { label: "Export User Data", desc: "Download users as CSV", Icon: Download, color: "#3B82F6", action: exportCSV },
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, cursor: "pointer", marginBottom: 8, textAlign: "left" as const }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><item.Icon size={16} color={item.color} /></div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", display: "block" }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>{item.desc}</span>
                </div>
                <ChevronRight size={14} color={text2} />
              </button>
            ))}
          </div>
        </div>
        </>)}

        {/* STRATEGY TAB */}
        {adminTab === "strategy" && (
          <div>
            {/* Pricing Roadmap — Horizontal Timeline */}
            <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${cardBorder}`, padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <TrendingUp size={16} color="#10B981" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>Pricing Roadmap</h3>
                <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif", marginLeft: "auto" }}>Based on user milestones</span>
              </div>
              <div style={{ position: "relative", paddingBottom: 8 }}>
                <div style={{ position: "absolute", top: 16, left: 16, right: 16, height: 2, background: "linear-gradient(90deg, #10B981, #F59E0B, #3B82F6, #7B5EA7)", zIndex: 0 }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, position: "relative", zIndex: 1 }}>
                  {[
                    { range: "0 – 50", label: "Launch", standard: "$12", note: "Founding closes at 50", status: "current", color: "#10B981" },
                    { range: "51 – 150", label: "Growth", standard: "$15", note: "Raise after founding closes", status: "next", color: "#F59E0B" },
                    { range: "150 – 500", label: "Scale", standard: "$19", note: "Add Pro tier, Studio $49", status: "future", color: "#3B82F6" },
                    { range: "500+", label: "Enterprise", standard: "$24", note: "Team accounts, API", status: "future", color: "#7B5EA7" },
                  ].map((stage, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: stage.status === "current" ? stage.color : cardBg, border: `2px solid ${stage.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {stage.status === "current" ? <Check size={14} color="white" /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />}
                      </div>
                      <div style={{ textAlign: "center", padding: "10px 8px", background: stage.status === "current" ? stage.color + "08" : (isDark ? "#252528" : "#F9FAFB"), borderRadius: 8, border: `1px solid ${stage.status === "current" ? stage.color + "30" : cardBorder}`, width: "100%", boxSizing: "border-box" as const }}>
                        <p style={{ fontSize: 10, fontWeight: 600, color: text2, textTransform: "uppercase" as const, letterSpacing: "0.5px", fontFamily: "Inter, sans-serif", marginBottom: 2 }}>{stage.range} users</p>
                        <p style={{ fontSize: 13, fontWeight: 800, color: stage.color, fontFamily: "Inter, sans-serif", marginBottom: 2 }}>{stage.standard}/mo</p>
                        <p style={{ fontSize: 11, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>{stage.label}</p>
                        <p style={{ fontSize: 10, color: text2, fontFamily: "Inter, sans-serif", lineHeight: "1.3" }}>{stage.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Churn Risk — compact table */}
            <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${cardBorder}`, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6"}`, display: "flex", alignItems: "center", gap: 8 }}>
                <UserMinus size={15} color="#EF4444" />
                <span style={{ fontSize: 14, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Churn Risk</span>
                <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", marginLeft: "auto" }}>Inactive 14+ days</span>
              </div>
              {churnRiskUsers.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: text2, fontFamily: "Inter, sans-serif" }}>No at-risk users right now</div>
              ) : (
                churnRiskUsers.slice(0, 8).map((u: any) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.02)" : "#F9FAFB"}`, gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#EF4444", flexShrink: 0 }}>{(u.email || "?").charAt(0).toUpperCase()}</div>
                    <span style={{ fontSize: 13, color: text1, fontFamily: "Inter, sans-serif", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{u.email || u.full_name || u.id?.slice(0, 8)}</span>
                    <span style={{ fontSize: 12, color: "#EF4444", fontFamily: "Inter, sans-serif", fontWeight: 500, flexShrink: 0 }}>{u.daysSinceLogin}d</span>
                    <button onClick={async () => { await supabase.from("notifications").insert({ user_id: u.id, type: "system", title: "We miss you", message: "Come back and check what's new in Digital Home.", read: false, created_at: new Date().toISOString() }); toast.success("Re-engagement sent"); }} style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${inputBorder}`, borderRadius: 6, fontSize: 11, color: text2, cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>Ping</button>
                  </div>
                ))
              )}
            </div>

            {/* Strategy Notes — minimal */}
            <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${cardBorder}`, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <FileText size={15} color={text2} />
                <span style={{ fontSize: 14, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>Founder Notes</span>
                <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif", marginLeft: "auto" }}>Private · autosaves</span>
              </div>
              <textarea value={strategyNotes} onChange={e => setStrategyNotes(e.target.value)} placeholder="Pricing strategy, what's working, what to change..." rows={4} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${inputBorder}`, borderRadius: 8, fontSize: 13, color: text1, fontFamily: "Inter, sans-serif", resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const, lineHeight: "1.6", background: inputBg }} onFocus={e => { e.target.style.borderColor = "#10B981"; }} onBlur={async e => { e.target.style.borderColor = inputBorder; await (supabase as any).from("app_settings").upsert({ key: "strategy_notes", value: strategyNotes }); }} />
            </div>
          </div>
        )}
      </div>

      {/* GHOST USER PANEL — Clean Professional */}
      {ghostPanelOpen && ghostUser && (
        <div style={{ position: "fixed", top: 0, right: 0, width: 480, height: "100vh", background: isDark ? "#1C1C1E" : "white", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", zIndex: 9999, overflow: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: isDark ? "#1C1C1E" : "white", zIndex: 1 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>User Details</h2>
              <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>Admin view</p>
            </div>
            <button onClick={() => setGhostPanelOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} color={text2} /></button>
          </div>

          {/* Identity */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#7B5EA7", flexShrink: 0, overflow: "hidden" }}>
                {ghostUser.avatar_url ? <img src={ghostUser.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (ghostUser.full_name || ghostUser.email || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0, marginBottom: 2 }}>{ghostUser.full_name || "No name"}</p>
                <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", margin: 0, display: "flex", alignItems: "center", gap: 5 }}><Mail size={12} color={text2} />{ghostUser.email || "No email"}</p>
              </div>
              <span style={{ padding: "3px 10px", background: ghostUser.plan_tier === "pro" ? "#F5F3FF" : ghostUser.plan_tier === "standard" ? "#F0FDF4" : ghostUser.plan_tier === "founding" ? "#FFFBEB" : (isDark ? "#252528" : "#F3F4F6"), color: ghostUser.plan_tier === "pro" ? "#7B5EA7" : ghostUser.plan_tier === "standard" ? "#065F46" : ghostUser.plan_tier === "founding" ? "#92400E" : text2, borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif", flexShrink: 0 }}>{ghostUser.plan_tier || "free"}</span>
            </div>
            {[
              { Icon: Hash, label: "User ID", value: ghostUser.id?.substring(0, 16) + "...", mono: true, highlight: false },
              { Icon: Calendar, label: "Joined", value: ghostUser.created_at ? new Date(ghostUser.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Unknown", mono: false, highlight: false },
              { Icon: Clock, label: "Last Login", value: ghostUser.last_login ? new Date(ghostUser.last_login).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Never", mono: false, highlight: !ghostUser.last_login || Math.floor((Date.now() - new Date(ghostUser.last_login).getTime()) / 86400000) > 14 },
              { Icon: MapPin, label: "Location", value: ghostUser.location || "Not set", mono: false, highlight: false },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.02)" : "#F9FAFB"}` }}>
                <item.Icon size={13} color={text2} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", width: 72, flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontSize: 12, color: item.highlight ? "#EF4444" : text1, fontFamily: item.mono ? "monospace" : "Inter, sans-serif", fontWeight: item.highlight ? 600 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Activity Stats — 2x2 grid */}
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6"}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: text2, textTransform: "uppercase" as const, letterSpacing: "0.6px", fontFamily: "Inter, sans-serif", marginBottom: 10 }}>Activity</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Projects", value: userDetail.projects?.length || 0, Icon: Folder },
                { label: "Contacts", value: userDetail.contacts?.length || 0, Icon: Users },
                { label: "Journal Entries", value: userDetail.journals?.length || 0, Icon: BookOpen },
                { label: "Content Items", value: userDetail.content?.length || 0, Icon: Film },
              ].map(stat => (
                <div key={stat.label} style={{ padding: "10px 12px", background: isDark ? "#252528" : "#F9FAFB", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <stat.Icon size={14} color={text2} />
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0, lineHeight: 1 }}>{stat.value}</p>
                    <p style={{ fontSize: 10, color: text2, fontFamily: "Inter, sans-serif", margin: 0, marginTop: 1 }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity — timeline */}
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6"}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: text2, textTransform: "uppercase" as const, letterSpacing: "0.6px", fontFamily: "Inter, sans-serif", marginBottom: 10 }}>Recent Activity</p>
            {(() => {
              const items = [
                ...(userDetail.journals || []).slice(0, 2).map((j: any) => ({ label: `Journal: ${j.title || "Untitled"}`, date: j.created_at, Icon: BookOpen, color: "#06B6D4" })),
                ...(userDetail.projects || []).slice(0, 2).map((p: any) => ({ label: `Project: ${p.name}`, date: p.created_at, Icon: Folder, color: "#10B981" })),
                ...(userDetail.content || []).slice(0, 1).map((c: any) => ({ label: `Content: ${c.title}`, date: c.created_at, Icon: Film, color: "#7B5EA7" })),
              ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
              return items.length === 0 ? <p style={{ fontSize: 12, color: text2, fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>No recent activity</p> : items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < items.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.02)" : "#F9FAFB"}` : "none" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: item.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><item.Icon size={12} color={item.color} /></div>
                  <span style={{ fontSize: 12, color: text1, fontFamily: "Inter, sans-serif", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif", flexShrink: 0 }}>{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              ));
            })()}
          </div>

          {/* Feedback from this user */}
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6"}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: text2, textTransform: "uppercase" as const, letterSpacing: "0.6px", fontFamily: "Inter, sans-serif", marginBottom: 8 }}>Submitted Feedback</p>
            {(userDetail.feedback?.length || 0) === 0 ? (
              <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", fontStyle: "italic" }}>No feedback submitted</p>
            ) : (
              userDetail.feedback?.map((f: any) => (
                <div key={f.id} style={{ padding: "8px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.02)" : "#F9FAFB"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: text2, fontFamily: "Inter, sans-serif" }}>{f.status}</span>
                    <span style={{ fontSize: 10, color: text2, fontFamily: "Inter, sans-serif" }}>{new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                  <p style={{ fontSize: 12, color: text1, fontFamily: "Inter, sans-serif", lineHeight: "1.4", margin: 0 }}>{f.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Admin Actions */}
          <div style={{ padding: "14px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: text2, textTransform: "uppercase" as const, letterSpacing: "0.6px", fontFamily: "Inter, sans-serif", marginBottom: 10 }}>Admin Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={async () => { const msg = window.prompt(`Notification to ${ghostUser.email}:`); if (!msg) return; await supabase.from("notifications").insert({ user_id: ghostUser.id, type: "system", title: "Message from Admin", message: msg, read: false, created_at: new Date().toISOString() }); toast.success("Notification sent"); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: isDark ? "#252528" : "#F9FAFB", border: `1px solid ${inputBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" as const }}>
                <Bell size={13} color="#10B981" /> Send notification
              </button>
              <button onClick={async () => { const plan = window.prompt("Set plan (founding/standard/pro):"); if (!["founding", "standard", "pro"].includes(plan || "")) { toast.error("Invalid plan"); return; } await supabase.from("profiles").update({ plan_tier: plan } as any).eq("id", ghostUser.id); setGhostUser((prev: any) => ({ ...prev, plan_tier: plan })); setUsersList((prev: any) => prev.map((u: any) => u.id === ghostUser.id ? { ...u, plan_tier: plan } : u)); toast.success(`Plan set to ${plan}`); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: isDark ? "#252528" : "#F9FAFB", border: `1px solid ${inputBorder}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: text1, cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" as const }}>
                <CreditCard size={13} color="#3B82F6" /> Change plan tier
              </button>
              <button onClick={async () => { if (!window.confirm(`Permanently delete ${ghostUser.email}? Cannot be undone.`)) return; await supabase.from("profiles").delete().eq("id", ghostUser.id); setUsersList(prev => prev.filter(u => u.id !== ghostUser.id)); setGhostPanelOpen(false); toast.success("Account deleted"); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "transparent", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#DC2626", cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" as const }}>
                <Trash2 size={13} color="#DC2626" /> Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
