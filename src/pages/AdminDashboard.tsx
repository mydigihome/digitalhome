import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Users, BarChart3, MessageSquare, CreditCard, Search, ExternalLink, FileText, Settings, Megaphone, ToggleLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_login: string | null;
  role: string;
}

interface FeedbackItem {
  id: string;
  user_id: string;
  message: string;
  rating: number | null;
  email: string | null;
  status: string;
  created_at: string;
}

interface StripeBilling {
  totalRevenue: number;
  activeSubscriptions: number;
  recentTransactions: { id: string; amount: number; created: number; customer_email: string }[];
  loading: boolean;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  target_roles: string[];
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

interface FeatureFlag {
  id: string;
  feature_name: string;
  is_enabled: boolean;
  description: string | null;
  updated_at: string;
}

// ── Analytics Overview (Overview Tab) ──
function OverviewTab() {
  const [analytics, setAnalytics] = useState({
    projects: 0, tasks: 0, notes: 0, expenses: 0, resourceClicks: 0,
  });
  const [chartData, setChartData] = useState<{ date: string; users: number }[]>([]);
  const [counts, setCounts] = useState({ total: 0, students: 0, main: 0, activeToday: 0, newThisWeek: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      const [projects, tasks, notes, expenses, resources] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }),
        supabase.from("notes").select("*", { count: "exact", head: true }),
        supabase.from("expenses").select("*", { count: "exact", head: true }),
        supabase.from("resource_engagements").select("*", { count: "exact", head: true }),
      ]);

      setAnalytics({
        projects: projects.count || 0,
        tasks: tasks.count || 0,
        notes: notes.count || 0,
        expenses: expenses.count || 0,
        resourceClicks: resources.count || 0,
      });

      // User counts
      const { count: total } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { data: roles } = await supabase.from("user_roles").select("role");
      const students = (roles || []).filter((r) => r.role === "student").length;
      const main = (roles || []).filter((r) => r.role === "main_account").length;

      const today = new Date().toISOString().split("T")[0];
      const { count: activeToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_login", `${today}T00:00:00`);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: newThisWeek } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());

      setCounts({ total: total || 0, students, main, activeToday: activeToday || 0, newThisWeek: newThisWeek || 0 });

      // 7-day signup trend
      const days: { date: string; users: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", `${ds}T00:00:00`)
          .lt("created_at", `${ds}T23:59:59`);
        days.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), users: count || 0 });
      }
      setChartData(days);
    };
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, []);

  const kpiCards = [
    { label: "Total Users", value: counts.total, color: "#8B5CF6" },
    { label: "Active Today", value: counts.activeToday, color: "#10B981" },
    { label: "New This Week", value: counts.newThisWeek, color: "#3B82F6" },
  ];

  const statCards = [
    { label: "Projects Created", value: analytics.projects, color: "#EC4899" },
    { label: "Tasks Created", value: analytics.tasks, color: "#10B981" },
    { label: "Notes Created", value: analytics.notes, color: "#6366F1" },
    { label: "Finance Entries", value: analytics.expenses, color: "#F59E0B" },
    { label: "Resource Engagements", value: analytics.resourceClicks, color: "#8B5CF6" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {kpiCards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-medium text-muted-foreground mb-2">{c.label}</div>
            <div className="text-4xl font-semibold" style={{ color: c.color }}>
              {c.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">{c.label}</div>
            <div className="text-2xl font-semibold" style={{ color: c.color }}>
              {c.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Signup Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">User Signups (Last 7 Days)</h3>
        <div className="flex items-end justify-between h-[180px] gap-2">
          {chartData.map((day, i) => {
            const max = Math.max(...chartData.map((d) => d.users), 1);
            const h = (day.users / max) * 150;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-foreground">{day.users}</span>
                <div className="w-full rounded-t bg-primary transition-all duration-300" style={{ height: `${Math.max(h, 4)}px` }} />
                <span className="text-[10px] text-muted-foreground text-center">{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-secondary border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
            <span className="text-lg">💾</span> Export All Data
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-secondary border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
            <span className="text-lg">🔄</span> Refresh Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ──
function UsersTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");

  const fetchUsers = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await supabase.functions.invoke("admin-users", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.data && Array.isArray(res.data)) setUsers(res.data);
  }, []);

  useEffect(() => {
    fetchUsers();
    const id = setInterval(fetchUsers, 60000);
    return () => clearInterval(id);
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const matchesSearch = (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminAction = async (action: string, targetUserId: string, extra: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await supabase.functions.invoke("admin-update-role", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action, targetUserId, ...extra },
    });
    if (res.error) toast.error(res.error.message || "Action failed");
    else { toast.success("Action completed"); fetchUsers(); }
  };

  const handleExportCSV = () => {
    const csv = [
      ["Name", "Email", "Role", "Date Joined", "Last Login"].join(","),
      ...filtered.map((u) => [
        u.full_name || "", u.email, u.role || "main_account",
        new Date(u.created_at).toISOString(),
        u.last_login ? new Date(u.last_login).toISOString() : ""
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Users ({filtered.length})
          </h2>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="main_account">Main Accounts</option>
            <option value="moderator">Moderators</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-72 rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button onClick={handleExportCSV}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl p-5 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border">
              {["Name", "Email", "Role", "Joined", "Last Login", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="px-3 py-2.5 text-sm text-foreground">{u.full_name || "N/A"}</td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2.5">
                  <select
                    value={u.role}
                    onChange={(e) => adminAction("update_role", u.id, { newRole: e.target.value })}
                    disabled={u.role === "super_admin"}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="student">Student</option>
                    <option value="main_account">Main Account</option>
                    <option value="moderator">Moderator</option>
                    {u.role === "super_admin" && <option value="super_admin">Super Admin</option>}
                  </select>
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground">{u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => { setEditingUser(u); setEditName(u.full_name); }}
                      className="rounded-md bg-secondary px-2.5 py-1 text-xs text-foreground hover:bg-secondary/80">Edit</button>
                    <button onClick={async () => {
                      const { error } = await supabase.auth.resetPasswordForEmail(u.email);
                      if (error) toast.error(error.message); else toast.success(`Reset email sent to ${u.email}`);
                    }} className="rounded-md bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs text-blue-700 dark:text-blue-300 hover:opacity-80">Reset PW</button>
                    {u.role !== "super_admin" && (
                      <button onClick={() => {
                        if (!confirm(`Delete ${u.full_name || u.email}? This cannot be undone.`)) return;
                        adminAction("delete_user", u.id);
                      }} className="rounded-md bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs text-red-600 dark:text-red-300 hover:opacity-80">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setEditingUser(null)}>
          <div className="w-[420px] rounded-xl bg-card border border-border p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Edit: {editingUser.full_name || editingUser.email}</h3>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm mb-4 outline-none focus:ring-1 focus:ring-primary" />
            <div className="flex gap-3">
              <button onClick={() => { adminAction("update_profile", editingUser.id, { updates: { full_name: editName } }); setEditingUser(null); }}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Save Changes</button>
              <button onClick={() => setEditingUser(null)}
                className="flex-1 h-10 rounded-lg bg-secondary text-muted-foreground text-sm font-medium hover:opacity-80">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Content Tab ──
function ContentTab() {
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");

  const fetchFeedback = useCallback(async () => {
    let query = supabase.from("feedback").select("*").order("created_at", { ascending: false });
    if (feedbackFilter !== "all") query = query.eq("status", feedbackFilter);
    const { data } = await query;
    setFeedback((data as FeedbackItem[]) || []);
  }, [feedbackFilter]);

  const fetchAnnouncements = useCallback(async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
  }, []);

  useEffect(() => {
    fetchFeedback();
    fetchAnnouncements();
  }, [fetchFeedback, fetchAnnouncements]);

  const handleUpdateFeedback = async (id: string, updates: Record<string, string>) => {
    await supabase.from("feedback").update(updates as any).eq("id", id);
    fetchFeedback();
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    await supabase.from("feedback").delete().eq("id", id);
    fetchFeedback();
  };

  const handleCreateAnnouncement = async () => {
    if (!annTitle || !annMessage) { toast.error("Please fill in title and message"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("announcements").insert([{
      title: annTitle,
      message: annMessage,
      target_roles: ["student", "main_account", "moderator"],
      is_active: true,
      created_by: user?.id,
    }] as any);
    if (!error) {
      fetchAnnouncements();
      setShowAnnouncementModal(false);
      setAnnTitle("");
      setAnnMessage("");
      toast.success("Announcement created!");
    } else {
      toast.error("Failed to create announcement");
    }
  };

  const handleToggleAnnouncement = async (id: string, currentState: boolean) => {
    await supabase.from("announcements").update({ is_active: !currentState } as any).eq("id", id);
    fetchAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    fetchAnnouncements();
  };

  const exportFeedbackCSV = () => {
    const csv = [
      ["Email", "Status", "Rating", "Message", "Created At"].join(","),
      ...feedback.map((f) => [
        f.email || "Anonymous",
        f.status || "pending",
        f.rating || "",
        `"${f.message.replace(/"/g, '""')}"`,
        new Date(f.created_at).toISOString(),
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Announcements */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Announcements ({announcements.length})
          </h2>
          <button onClick={() => setShowAnnouncementModal(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            📢 Create Announcement
          </button>
        </div>
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No announcements yet</p>
          ) : announcements.map((ann) => (
            <div key={ann.id} className={`rounded-lg border p-4 ${ann.is_active ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-secondary/50 border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <strong className="text-base text-foreground">{ann.title}</strong>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${ann.is_active ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                    {ann.is_active ? "Active" : "Inactive"}
                  </span>
                  <button onClick={() => handleToggleAnnouncement(ann.id, ann.is_active)}
                    className="rounded-md bg-secondary px-2 py-1 text-xs text-foreground hover:bg-secondary/80">
                    {ann.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="rounded-md bg-red-100 dark:bg-red-900/30 px-2 py-1 text-xs text-red-600 dark:text-red-300 hover:opacity-80">
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-foreground/80 mb-2">{ann.message}</p>
              <div className="text-xs text-muted-foreground">
                Target: {ann.target_roles?.join(", ")} | {new Date(ann.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> User Feedback ({feedback.length})
            </h2>
            <div className="flex gap-1.5">
              {["all", "pending", "in_progress", "resolved"].map((f) => (
                <button key={f} onClick={() => setFeedbackFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    feedbackFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                  {f === "in_progress" ? "In Progress" : f}
                </button>
              ))}
            </div>
          </div>
          <button onClick={exportFeedbackCSV}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
            📥 Export CSV
          </button>
        </div>
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No feedback to display</p>
          ) : feedback.map((item) => (
            <div key={item.id} className="rounded-lg bg-secondary/50 border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{item.email || "Anonymous"}</span>
                  {item.rating && <span className="text-xs text-muted-foreground">⭐ {item.rating}/5</span>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  item.status === "resolved" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : item.status === "in_progress" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                }`}>
                  {item.status || "pending"}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3">{item.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                <div className="flex gap-2">
                  <select value={item.status || "pending"}
                    onChange={(e) => handleUpdateFeedback(item.id, { status: e.target.value })}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <button onClick={() => handleDeleteFeedback(item.id)}
                    className="rounded-md bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs text-red-600 dark:text-red-300 hover:opacity-80">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setShowAnnouncementModal(false)}>
          <div className="w-[560px] rounded-xl bg-card border border-border p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-foreground mb-6">Create Announcement</h3>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full h-11 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:ring-1 focus:ring-primary" />
              <textarea placeholder="Message" value={annMessage} onChange={(e) => setAnnMessage(e.target.value)}
                className="w-full min-h-[100px] rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary font-[inherit]" />
              <div className="flex gap-3 mt-2">
                <button onClick={handleCreateAnnouncement}
                  className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">Create</button>
                <button onClick={() => setShowAnnouncementModal(false)}
                  className="flex-1 h-11 rounded-lg bg-secondary text-muted-foreground text-sm font-semibold hover:opacity-80">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── System Tab ──
function SystemTab() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [billing, setBilling] = useState<StripeBilling>({
    totalRevenue: 0, activeSubscriptions: 0, recentTransactions: [], loading: true,
  });

  const fetchFeatureFlags = useCallback(async () => {
    const { data } = await supabase.from("feature_flags").select("*").order("feature_name");
    setFeatureFlags((data as FeatureFlag[]) || []);
  }, []);

  useEffect(() => {
    fetchFeatureFlags();
    const fetchBilling = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke("admin-stripe-overview", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.data) setBilling({ ...res.data, loading: false });
      else setBilling((p) => ({ ...p, loading: false }));
    };
    fetchBilling();
  }, [fetchFeatureFlags]);

  const handleToggleFeature = async (id: string, currentState: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("feature_flags").update({
      is_enabled: !currentState,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    } as any).eq("id", id);
    fetchFeatureFlags();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Feature Flags */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
          <ToggleLeft className="h-5 w-5 text-primary" /> Feature Flags
        </h2>
        <div className="space-y-3">
          {featureFlags.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No feature flags configured</p>
          ) : featureFlags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between rounded-lg bg-secondary/50 border border-border p-4">
              <div>
                <strong className="text-sm text-foreground">{flag.feature_name}</strong>
                {flag.description && <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>}
              </div>
              <Switch checked={flag.is_enabled} onCheckedChange={() => handleToggleFeature(flag.id, flag.is_enabled)} />
            </div>
          ))}
        </div>
      </div>

      {/* Stripe Billing */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Stripe Billing Overview
        </h2>
        {billing.loading ? (
          <p className="text-center text-sm text-muted-foreground py-10">Loading Stripe data...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg bg-secondary/50 border border-border p-5">
                <div className="text-xs font-medium text-muted-foreground mb-2">Total Revenue</div>
                <div className="text-3xl font-semibold text-green-600">${billing.totalRevenue.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-secondary/50 border border-border p-5">
                <div className="text-xs font-medium text-muted-foreground mb-2">Active Subscriptions</div>
                <div className="text-3xl font-semibold text-blue-600">{billing.activeSubscriptions}</div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Transactions</h3>
            {billing.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-1">
                {billing.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <div className="text-sm font-medium text-foreground">{tx.customer_email || "Customer"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(tx.created * 1000).toLocaleString()}</div>
                    </div>
                    <div className="text-base font-semibold text-green-600">+${(tx.amount / 100).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}

            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "#635BFF" }}>
              Open Stripe Dashboard <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        )}
      </div>

      {/* System Actions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" /> System Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => toast.info("Database backup requires backend implementation")}
            className="flex flex-col items-center gap-2 rounded-lg bg-green-600 p-4 text-sm font-medium text-white hover:bg-green-700 transition-colors">
            <span className="text-2xl">💾</span> Backup Database
          </button>
          <button onClick={() => toast.info("Cache clearing requires backend implementation")}
            className="flex flex-col items-center gap-2 rounded-lg bg-amber-500 p-4 text-sm font-medium text-white hover:bg-amber-600 transition-colors">
            <span className="text-2xl">⚡</span> Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Config ──
const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "content", label: "Content", icon: "📝" },
  { id: "system", label: "System", icon: "⚙️" },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Main Admin Dashboard ──
export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }

    const check = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (!data) { navigate("/dashboard"); return; }
      setIsAdmin(true);
      setChecking(false);
    };
    check();
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Verifying super admin access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border px-6 lg:px-10 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Super Admin Control Panel — Your Eyes Only</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300">
              <Shield className="h-3.5 w-3.5" /> SUPER ADMIN
            </span>
            <button onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
              Exit Admin
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-10">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "content" && <ContentTab />}
        {activeTab === "system" && <SystemTab />}
      </div>
    </div>
  );
}
