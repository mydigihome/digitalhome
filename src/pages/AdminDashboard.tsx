import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import {
  Shield, Users, Activity, DollarSign, FileText, Target, BookOpen,
  ShoppingBag, UserCheck, Bell, Download, ExternalLink, RefreshCw, Lock, ChevronRight,
  X, Trash2, CreditCard, MessageSquare, Megaphone, Loader2,
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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {[
        { label: "Projects", value: stats.projects || 0, color: "#10B981" },
        { label: "Contacts", value: stats.contacts || 0, color: "#EC4899" },
        { label: "Journal Entries", value: stats.journals || 0, color: "#06B6D4" },
        { label: "Content Items", value: stats.content || 0, color: "#7B5EA7" },
      ].map(stat => (
        <div key={stat.label} style={{ padding: 12, background: "#F9FAFB", borderRadius: 10, border: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: stat.color, fontFamily: "Inter, sans-serif", margin: 0 }}>{stat.value}</p>
          <p style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "Inter, sans-serif", margin: 0 }}>{stat.label}</p>
        </div>
      ))}
    </div>
  );
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
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState("system");
  const [announcementSending, setAnnouncementSending] = useState(false);
  const [announcementHistory, setAnnouncementHistory] = useState<any[]>([]);
  const [adminTab] = useState<"overview">("overview");

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
      (purchases || []).forEach((p: any) => {
        const m = new Date(p.purchased_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        byMonth[m] = (byMonth[m] || 0) + (p.amount_paid || 0) / 100;
      });
      setRevenueData(Object.entries(byMonth).map(([month, amount]) => ({ month, amount })));

      const growthMap: Record<string, number> = {};
      (profilesList || []).forEach((u: any) => {
        const m = new Date(u.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        growthMap[m] = (growthMap[m] || 0) + 1;
      });
      setGrowthData(Object.entries(growthMap).reverse().map(([month, count]) => ({ month, count })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadAnnouncementHistory = async () => {
    const { data } = await (supabase as any).from("announcements").select("*").order("created_at", { ascending: false }).limit(10);
    setAnnouncementHistory(data || []);
  };

  useEffect(() => { loadData(); loadAnnouncementHistory(); }, [isAdmin]);

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

  const filteredUsers = usersList.filter(u => !userSearch || u.full_name?.toLowerCase().includes(userSearch.toLowerCase()));

  const sendGlobalNotification = async () => {
    const msg = window.prompt("Message to send to ALL users:");
    if (!msg || !msg.trim()) return;
    const { data: allUsers, error } = await supabase.from("profiles").select("id");
    if (error || !allUsers?.length) {
      toast.error("Could not load users");
      return;
    }
    const { error: insertError } = await supabase.from("notifications").insert(allUsers.map((u: any) => ({ user_id: u.id, type: "system", title: "Message from Digital Home", message: msg.trim(), read: false })));
    if (insertError) {
      toast.error("Send failed: " + insertError.message);
      return;
    }
    toast.success(`Sent to ${allUsers.length} users! ✓`);
  };

  const exportCSV = async () => {
    const { data: users, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error || !users) { toast.error("Export failed"); return; }
    const headers = ["ID", "Name", "Plan", "Joined", "Last Active"];
    const rows = users.map(u => [
      u.id || "",
      (u.full_name || "").replace(/,/g, ";"),
      "free",
      u.created_at ? new Date(u.created_at).toLocaleDateString() : "",
      u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `digitalhome-users-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <button key={tab} onClick={() => setAdminTab(tab)} style={{ padding: "8px 20px", borderRadius: 7, border: "none", background: adminTab === tab ? (isDark ? "#333" : "white") : "transparent", fontSize: 13, fontWeight: adminTab === tab ? 600 : 400, color: adminTab === tab ? text1 : text2, cursor: "pointer", fontFamily: "Inter, sans-serif", boxShadow: adminTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none", textTransform: "capitalize" }}>{tab === "strategy" ? "📈 Strategy" : "Overview"}</button>
          ))}
        </div>

        {adminTab === "overview" && (<>
        {/* ANNOUNCEMENTS */}
        <div style={{ background: cardBg, borderRadius: 14, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, padding: 24, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}><Megaphone size={18} color="#10B981" /></div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>Send Announcement</h3>
              <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>Broadcasts to all users instantly</p>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <input value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} placeholder="Announcement title..." style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 14, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" as const, background: inputBg }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <textarea value={announcementMessage} onChange={e => setAnnouncementMessage(e.target.value)} placeholder="Write your announcement..." rows={4} style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${inputBorder}`, borderRadius: 8, fontSize: 14, color: text1, fontFamily: "Inter, sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" as const, lineHeight: "1.6", background: inputBg }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { type: "system", label: "📢 General" },
              { type: "feature", label: "✨ New Feature" },
              { type: "maintenance", label: "🔧 Maintenance" },
              { type: "promo", label: "🎉 Special Offer" },
            ].map(opt => (
              <button key={opt.type} onClick={() => setAnnouncementType(opt.type)} style={{ padding: "6px 14px", borderRadius: 999, border: `1.5px solid ${announcementType === opt.type ? "#10B981" : inputBorder}`, background: announcementType === opt.type ? (isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4") : (isDark ? "#252528" : "white"), color: announcementType === opt.type ? "#10B981" : text2, fontSize: 12, fontWeight: announcementType === opt.type ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{opt.label}</button>
            ))}
          </div>
          <button disabled={announcementSending || !announcementTitle.trim() || !announcementMessage.trim()} onClick={async () => {
            if (!announcementTitle.trim() || !announcementMessage.trim()) return;
            setAnnouncementSending(true);
            try {
              const { data: allUsers } = await supabase.from("profiles").select("id");
              if (!allUsers?.length) { toast.error("No users found"); return; }
              await supabase.from("notifications").insert(allUsers.map((u: any) => ({ user_id: u.id, type: announcementType, title: announcementTitle.trim(), message: announcementMessage.trim(), category: "Announcement", read: false })));
              await (supabase as any).from("announcements").insert({ sent_by: user!.id, title: announcementTitle.trim(), message: announcementMessage.trim(), type: announcementType, recipient_count: allUsers.length });
              setAnnouncementTitle(""); setAnnouncementMessage(""); setAnnouncementType("system");
              await loadAnnouncementHistory();
              toast.success(`Sent to ${allUsers.length} users! 📢`);
            } catch (err: any) { toast.error("Send failed: " + err.message); } finally { setAnnouncementSending(false); }
          }} style={{ padding: "11px 28px", background: announcementTitle.trim() && announcementMessage.trim() ? "#10B981" : (isDark ? "#333" : "#F3F4F6"), color: announcementTitle.trim() && announcementMessage.trim() ? "white" : text2, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: announcementTitle.trim() && announcementMessage.trim() ? "pointer" : "not-allowed", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
            {announcementSending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Megaphone size={16} /> Send to All Users</>}
          </button>
          {announcementHistory.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: text2, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10, fontFamily: "Inter, sans-serif" }}>Recently Sent</p>
              {announcementHistory.slice(0, 5).map((a: any) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB"}` }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>{a.title}</p>
                    <p style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>{new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {a.recipient_count} users</p>
                  </div>
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
                <span style={{ fontSize: 12, fontWeight: 600, color: text2, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}><s.Icon size={16} color={s.color} /></div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: text1, fontFamily: "Inter, sans-serif" }}>{loading ? "—" : s.value}</div>
              <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>{s.change}</span>
            </div>
          ))}
        </div>

        {/* SECOND ROW */}
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
            {["Name", "Plan", "Joined", "Actions"].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: text2, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>)}
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
                <button onClick={() => { setGhostUser(u); setGhostPanelOpen(true); }} style={{ padding: "4px 8px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, fontSize: 11, color: "#1D4ED8", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>View</button>
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
                <span style={{ padding: "2px 8px", background: "#FEF2F2", color: "#DC2626", borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                  {feedbackItems.filter(f => f.status === "pending").length} new
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "Bug Report", "Feature Request", "General Feedback", "Billing Issue"].map(f => (
                <button key={f} onClick={() => setFeedbackFilter(f)} style={{
                  padding: "4px 10px", borderRadius: 999, border: "1px solid",
                  borderColor: feedbackFilter === f ? "#10B981" : inputBorder,
                  background: feedbackFilter === f ? (isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4") : cardBg,
                  color: feedbackFilter === f ? "#065F46" : text2,
                  fontSize: 11, fontWeight: feedbackFilter === f ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}>
                  {f === "all" ? "All" : f}
                </button>
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
                  <span style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif" }}>
                    {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                  {item.status === "pending" && (
                    <button onClick={async () => {
                      await supabase.from("feedback").update({ status: "reviewed" } as any).eq("id", item.id);
                      setFeedbackItems(prev => prev.map(f => f.id === item.id ? { ...f, status: "reviewed" } : f));
                    }} style={{ padding: "3px 8px", background: "transparent", border: `1px solid ${inputBorder}`, borderRadius: 6, fontSize: 11, color: text2, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      Mark read
                    </button>
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
          {/* RECENT ACTIVITY */}
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

          {/* ADMIN ACTIONS */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Admin Actions</h3>
            {[
              { label: "Send Global Notification", desc: "Notify all users at once", Icon: Bell, color: "#10B981", action: sendGlobalNotification },
              { label: "Export User Data", desc: "Download users as CSV", Icon: Download, color: "#3B82F6", action: exportCSV },
              { label: "View Backend Dashboard", desc: "Open database directly", Icon: ExternalLink, color: "#7B5EA7", action: () => {
                const link = document.createElement("a");
                link.href = "https://supabase.com/dashboard";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }},
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 10, cursor: "pointer", marginBottom: 8, textAlign: "left" }}>
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
          <div style={{ padding: "0" }}>
            {/* Price Roadmap */}
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>📈 Price Roadmap</h3>
              <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 20 }}>When to raise prices based on user milestones</p>
              {[
                { milestone: "0–50 users", status: "current", standard: "$12/mo", founding: "$7/mo (locked)", note: "Build trust, gather feedback, onboard founding members" },
                { milestone: "51–150 users", status: "upcoming", standard: "$15/mo", founding: "$7/mo (still locked)", note: "Raise Standard after founding closes. Signal growth." },
                { milestone: "150–500 users", status: "future", standard: "$19/mo", founding: "$7/mo (still locked)", note: "Add Pro tier. Studio add-on raises to $49." },
                { milestone: "500+ users", status: "future", standard: "$24/mo", founding: "$7/mo (still locked)", note: "Enterprise tier. Team accounts. API access." },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 0", borderBottom: i < 3 ? `1px solid ${rowBorder}` : "none" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: row.status === "current" ? "#10B981" : row.status === "upcoming" ? "#F59E0B" : (isDark ? "#444" : "#E5E7EB"), flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif" }}>{row.milestone}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ padding: "2px 8px", background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4", color: "#065F46", borderRadius: 999, fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Standard: {row.standard}</span>
                        <span style={{ padding: "2px 8px", background: isDark ? "rgba(245,158,11,0.1)" : "#FFFBEB", color: "#92400E", borderRadius: 999, fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Founding: {row.founding}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>{row.note}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Churn Risk */}
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>⚠️ Churn Risk</h3>
              <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 16 }}>Users who haven't logged in for 14+ days</p>
              {churnRiskUsers.length === 0 && <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", textAlign: "center", padding: 20 }}>No churn risk users detected 🎉</p>}
              {churnRiskUsers.map((u: any) => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${rowBorder}` }}>
                  <span style={{ fontSize: 13, color: text1, fontFamily: "Inter, sans-serif" }}>{u.email || u.full_name || u.id?.slice(0, 8)}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#EF4444", fontFamily: "Inter, sans-serif" }}>{u.daysSinceLogin}d inactive</span>
                    <button onClick={async () => {
                      await supabase.from("notifications").insert({ user_id: u.id, type: "system", title: "We miss you! 👋", message: "Come back and check what's new in Digital Home.", read: false });
                      toast.success("Re-engagement sent!");
                    }} style={{ padding: "4px 10px", background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4", border: `1px solid ${isDark ? "rgba(16,185,129,0.2)" : "#BBF7D0"}`, borderRadius: 6, fontSize: 11, color: "#065F46", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Re-engage</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Strategy Notes */}
            <div style={{ ...cardStyle }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", marginBottom: 4 }}>📝 Strategy Notes</h3>
              <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", marginBottom: 14 }}>Private notes only you can see</p>
              <textarea value={strategyNotes} onChange={e => setStrategyNotes(e.target.value)} placeholder="Write your pricing strategy, what's working, what to change..." rows={6} style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${inputBorder}`, borderRadius: 10, fontSize: 14, color: text1, fontFamily: "Inter, sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box" as const, lineHeight: "1.6", background: inputBg }}
                onFocus={e => { e.target.style.borderColor = "#10B981"; }}
                onBlur={async e => {
                  e.target.style.borderColor = inputBorder;
                  await (supabase as any).from("app_settings").upsert({ key: "strategy_notes", value: strategyNotes });
                }}
              />
              <p style={{ fontSize: 11, color: text2, fontFamily: "Inter, sans-serif", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>✓ Autosaves when you click away</p>
            </div>
          </div>
        )}
      </div>

      {/* GHOST USER PANEL */}
      {ghostPanelOpen && ghostUser && (
        <div style={{ position: "fixed", top: 0, right: 0, width: 480, height: "100vh", background: isDark ? "#1C1C1E" : "white", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", zIndex: 9999, overflow: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: isDark ? "#1C1C1E" : "white", zIndex: 1 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>User Details</h2>
              <p style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>Admin view</p>
            </div>
            <button onClick={() => setGhostPanelOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={20} color={text2} /></button>
          </div>

          {/* User identity */}
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${cardBorder}`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#7B5EA7", flexShrink: 0 }}>
              {(ghostUser.full_name || ghostUser.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: text1, fontFamily: "Inter, sans-serif", margin: 0 }}>{ghostUser.full_name || "No name"}</p>
              <p style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif", margin: 0 }}>{ghostUser.email || "No email"}</p>
              <span style={{ padding: "2px 8px", background: "#F3F4F6", color: text2, borderRadius: 999, fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>free</span>
            </div>
          </div>

          {/* Account info */}
          <div style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: text2, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12, fontFamily: "Inter, sans-serif" }}>Account Info</p>
            {[
              { label: "User ID", value: ghostUser.id },
              { label: "Joined", value: ghostUser.created_at ? new Date(ghostUser.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Unknown" },
              { label: "Last Active", value: ghostUser.last_login ? new Date(ghostUser.last_login).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Never" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${rowBorder}` }}>
                <span style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif" }}>{item.label}</span>
                <span style={{ fontSize: 13, color: text1, fontFamily: "Inter, sans-serif", fontWeight: 500, maxWidth: 240, textAlign: "right", wordBreak: "break-all" }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Activity stats */}
          <div style={{ padding: "0 24px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: text2, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12, fontFamily: "Inter, sans-serif" }}>Activity</p>
            <UserActivityStats userId={ghostUser.id} />
          </div>

          {/* Admin actions */}
          <div style={{ padding: "20px 24px", borderTop: `1px solid ${cardBorder}`, marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: text2, textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "Inter, sans-serif" }}>Admin Actions</p>
            <button onClick={async () => {
              const msg = window.prompt(`Send notification to ${ghostUser.full_name || ghostUser.email}:`);
              if (!msg) return;
              await supabase.from("notifications").insert({ user_id: ghostUser.id, type: "system", title: "Message from Admin", message: msg, read: false });
              toast.success("Notification sent!");
            }} style={{ padding: "10px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#065F46", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
              <Bell size={14} color="#10B981" /> Send Notification
            </button>
            <button onClick={async () => {
              if (!window.confirm(`Permanently delete ${ghostUser.full_name || ghostUser.email}? Cannot be undone.`)) return;
              await supabase.from("profiles").delete().eq("id", ghostUser.id);
              setUsersList(prev => prev.filter(u => u.id !== ghostUser.id));
              setGhostPanelOpen(false);
              toast.success(`${ghostUser.full_name || ghostUser.email} deleted`);
            }} style={{ padding: "10px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#DC2626", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
              <Trash2 size={14} color="#DC2626" /> Delete Account
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
