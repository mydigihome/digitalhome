import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import {
  Shield, Users, Activity, DollarSign, FileText, Target, BookOpen,
  ShoppingBag, UserCheck, Bell, Download, ExternalLink, RefreshCw, Lock, ChevronRight,
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

  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.4)" : "#6B7280";
  const cardBg = isDark ? "#1C1C1E" : "white";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6";
  const inputBg = isDark ? "#252528" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB";
  const tableBg = isDark ? "#252528" : "#F9FAFB";
  const rowBorder = isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6";

  // ACCESS GATE
  if (user?.email !== "myslimher@gmail.com") {
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

  const loadData = async () => {
    setLoading(true);
    try {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const today = new Date(); today.setHours(0, 0, 0, 0);

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
      ]);

      const totalRevenue = (purchases || []).reduce((s: number, p: any) => s + (p.amount_paid || 0), 0) / 100;
      const now = new Date();
      const thisMonthRevenue = (purchases || []).filter((p: any) => { const d = new Date(p.purchased_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s: number, p: any) => s + (p.amount_paid || 0), 0) / 100;

      setStats({ totalUsers: totalUsers || 0, newThisWeek: newThisWeek || 0, activeToday: 0, totalRevenue, thisMonthRevenue, totalContent: totalContent || 0, totalJournals: totalJournals || 0, totalContacts: totalContacts || 0, totalProjects: totalProjects || 0, totalPurchases: (purchases || []).length });
      setUsersList(profilesList || []);
      setRecentActivity(activity || []);

      // Revenue by month
      const byMonth: Record<string, number> = {};
      (purchases || []).forEach((p: any) => {
        const m = new Date(p.purchased_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        byMonth[m] = (byMonth[m] || 0) + (p.amount_paid || 0) / 100;
      });
      setRevenueData(Object.entries(byMonth).map(([month, amount]) => ({ month, amount })));

      // User growth by month
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

  useEffect(() => { loadData(); }, []);

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
    const msg = window.prompt("Message to send to all users:");
    if (!msg) return;
    const { data: allUsers } = await supabase.from("profiles").select("id");
    if (!allUsers) return;
    await supabase.from("notifications").insert(allUsers.map((u: any) => ({ user_id: u.id, type: "system", title: "Message from Digital Home", message: msg, read: false })));
    toast.success("Sent to all users!");
  };

  const exportCSV = () => {
    const csv = ["Name,Joined", ...usersList.map(u => `${u.full_name || ""},${u.created_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `users-${new Date().toISOString().split("T")[0]}.csv`; a.click();
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
          <div style={{ background: tableBg, borderRadius: 8, padding: "8px 14px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 8, marginBottom: 4 }}>
            {["Name", "Plan", "Joined", "Actions"].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: text2, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>)}
          </div>
          {filteredUsers.slice(0, 30).map(u => (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 8, padding: "10px 14px", borderBottom: `1px solid ${rowBorder}`, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: isDark ? "#252528" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: text2 }}>{(u.full_name || "?").charAt(0).toUpperCase()}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: text1, fontFamily: "Inter, sans-serif" }}>{u.full_name || "No name"}</span>
              </div>
              <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>free</span>
              <span style={{ fontSize: 12, color: text2, fontFamily: "Inter, sans-serif" }}>{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <button onClick={async () => { const msg = prompt("Notification message:"); if (!msg) return; await supabase.from("notifications").insert({ user_id: u.id, type: "system", title: "Message from Admin", message: msg, read: false }); toast.success("Notification sent!"); }} style={{ padding: "4px 8px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, fontSize: 11, color: "#065F46", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Notify</button>
            </div>
          ))}
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
              { label: "View Backend Dashboard", desc: "Open database directly", Icon: ExternalLink, color: "#7B5EA7", action: () => toast.success("Use Lovable Cloud to manage your backend") },
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
      </div>
    </AppShell>
  );
}
