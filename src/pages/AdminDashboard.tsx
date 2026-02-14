import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Users, BarChart3, MessageSquare, CreditCard, Search, ExternalLink, FileText, Settings, Megaphone, ToggleLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
  const [selectedRange, setSelectedRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("7d");
  const [signupStats, setSignupStats] = useState({ range: "", total: 0, average: 0, max: 0 });

  useEffect(() => {
    const fetchSignupsByRange = async (range: "7d" | "30d" | "90d" | "1y" | "all") => {
      let days = 7, granularity = "daily";
      
      if (range === "30d") days = 30;
      else if (range === "90d") { days = 90; granularity = "weekly"; }
      else if (range === "1y") { days = 365; granularity = "monthly"; }
      else if (range === "all") { days = 1095; granularity = "monthly"; }

      const data: { date: string; users: number }[] = [];
      const now = new Date();

      if (granularity === "daily") {
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().split("T")[0];
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", `${ds}T00:00:00`)
            .lt("created_at", `${ds}T23:59:59`);
          data.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), users: count || 0 });
        }
      } else if (granularity === "weekly") {
        const weeks = Math.ceil(days / 7);
        for (let i = weeks - 1; i >= 0; i--) {
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() - (i * 7));
          const weekStart = new Date(weekEnd);
          weekStart.setDate(weekStart.getDate() - 7);
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", weekStart.toISOString())
            .lt("created_at", weekEnd.toISOString());
          const weekNum = Math.floor((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
          data.push({ date: `Week ${weekNum}`, users: count || 0 });
        }
      } else {
        const months = Math.ceil(days / 30);
        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setMonth(d.getMonth() - i);
          const nextMonth = new Date(d);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", d.toISOString())
            .lt("created_at", nextMonth.toISOString());
          data.push({ date: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), users: count || 0 });
        }
      }

      const total = data.reduce((sum, d) => sum + d.users, 0);
      const avg = data.length > 0 ? Math.round(total / data.length) : 0;
      const max = Math.max(...data.map(d => d.users), 0);

      setChartData(data);
      setSignupStats({ range: range === "all" ? "All Time" : range.toUpperCase(), total, average: avg, max });
    };

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
      await fetchSignupsByRange(selectedRange);
    };

    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [selectedRange]);

  const [refreshing, setRefreshing] = useState(false);

  const handleExportAllData = async () => {
    try {
      const [users, tasks, projects, notes, expenses] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("tasks").select("*"),
        supabase.from("projects").select("*"),
        supabase.from("notes").select("*"),
        supabase.from("expenses").select("*"),
      ]);
      
      const exportData = {
        users: users.data || [],
        tasks: tasks.data || [],
        projects: projects.data || [],
        notes: notes.data || [],
        expenses: expenses.data || [],
        exported_at: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `full_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("All data exported successfully!");
    } catch (error) {
      toast.error("Export failed: " + (error as Error).message);
    }
  };

  const handleRefreshAnalytics = async () => {
    setRefreshing(true);
    try {
      const { count: total } = await supabase.from("profiles").select("*", { count: "exact", head: true });
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
      
      setCounts({ total: total || 0, students: counts.students, main: counts.main, activeToday: activeToday || 0, newThisWeek: newThisWeek || 0 });
      toast.success("Analytics refreshed!");
    } catch (error) {
      toast.error("Refresh failed: " + (error as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

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

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">User Signups Analytics</h3>
          <div className="flex gap-2">
            {(["7d", "30d", "90d", "1y", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedRange === range
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : range === "1y" ? "1 Year" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {signupStats.range && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="text-xs font-medium text-muted-foreground mb-1">Total Signups</div>
              <div className="text-3xl font-semibold text-foreground">{signupStats.total}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="text-xs font-medium text-muted-foreground mb-1">Avg per Period</div>
              <div className="text-3xl font-semibold text-primary">{signupStats.average}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="text-xs font-medium text-muted-foreground mb-1">Peak Period</div>
              <div className="text-3xl font-semibold text-accent">{signupStats.max}</div>
            </div>
          </div>
        )}

        <div className="flex items-end justify-between h-[200px] gap-1.5 bg-secondary/30 rounded-lg p-4">
          {chartData.length > 0 ? (
            chartData.map((day, i) => {
              const max = Math.max(...chartData.map((d) => d.users), 1);
              const h = (day.users / max) * 160;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{day.users}</span>
                  <div className="w-full rounded-t-sm bg-gradient-to-t from-primary to-primary/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30" style={{ height: `${Math.max(h, 3)}px` }} />
                  <span className="text-[10px] text-muted-foreground text-center truncate w-full">{day.date}</span>
                </div>
              );
            })
          ) : (
            <div className="w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={handleExportAllData} className="flex items-center gap-2 rounded-lg bg-secondary border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
            <span className="text-lg">💾</span> Export All Data
          </button>
          <button onClick={handleRefreshAnalytics} disabled={refreshing} className="flex items-center gap-2 rounded-lg bg-secondary border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <span className="text-lg">{refreshing ? "⏳" : "🔄"}</span> {refreshing ? "Refreshing..." : "Refresh Analytics"}
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

// ── Analytics Tab ──
function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("7d");
  const [chartData, setChartData] = useState<{ label: string; users: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = new Date();
      let startDate: Date;
      let granularity: "daily" | "weekly" | "monthly";

      switch (timeRange) {
        case "7d":
          startDate = new Date(now); startDate.setDate(now.getDate() - 7);
          granularity = "daily"; break;
        case "30d":
          startDate = new Date(now); startDate.setDate(now.getDate() - 30);
          granularity = "daily"; break;
        case "90d":
          startDate = new Date(now); startDate.setDate(now.getDate() - 90);
          granularity = "weekly"; break;
        case "1y":
          startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1);
          granularity = "monthly"; break;
        case "all":
          startDate = new Date("2020-01-01");
          granularity = "monthly"; break;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      const buckets: Record<string, number> = {};

      if (granularity === "daily") {
        const days = timeRange === "7d" ? 7 : 30;
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now); d.setDate(now.getDate() - i);
          const key = d.toISOString().split("T")[0];
          const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          buckets[key] = 0;
        }
        (profiles || []).forEach(p => {
          const key = new Date(p.created_at).toISOString().split("T")[0];
          if (buckets[key] !== undefined) buckets[key]++;
        });
      } else if (granularity === "weekly") {
        const weeks = Math.ceil((now.getTime() - startDate.getTime()) / (7 * 86400000));
        for (let i = 0; i < weeks; i++) {
          const wStart = new Date(startDate); wStart.setDate(startDate.getDate() + i * 7);
          const key = wStart.toISOString().split("T")[0];
          buckets[key] = 0;
        }
        (profiles || []).forEach(p => {
          const pDate = new Date(p.created_at);
          const diffDays = Math.floor((pDate.getTime() - startDate.getTime()) / 86400000);
          const weekIdx = Math.floor(diffDays / 7);
          const wStart = new Date(startDate); wStart.setDate(startDate.getDate() + weekIdx * 7);
          const key = wStart.toISOString().split("T")[0];
          if (buckets[key] !== undefined) buckets[key]++;
        });
      } else {
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1;
        for (let i = 0; i < monthsDiff; i++) {
          const m = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
          const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
          buckets[key] = 0;
        }
        (profiles || []).forEach(p => {
          const pDate = new Date(p.created_at);
          const key = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}`;
          if (buckets[key] !== undefined) buckets[key]++;
        });
      }

      const result = Object.entries(buckets).map(([key, count]) => {
        let label: string;
        if (granularity === "daily") {
          const d = new Date(key + "T00:00:00");
          label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else if (granularity === "weekly") {
          const d = new Date(key + "T00:00:00");
          label = `Wk ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        } else {
          const [y, m] = key.split("-");
          const d = new Date(parseInt(y), parseInt(m) - 1, 1);
          label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        }
        return { label, users: count };
      });

      setChartData(result);
      setLoading(false);
    };
    fetchData();
  }, [timeRange]);

  const max = Math.max(...chartData.map(d => d.users), 1);
  const total = chartData.reduce((s, d) => s + d.users, 0);
  const avg = chartData.length ? Math.round(total / chartData.length) : 0;

  const rangeLabels: Record<string, string> = {
    "7d": "Last 7 Days", "30d": "Last 30 Days", "90d": "Last 90 Days", "1y": "Last Year", "all": "All Time"
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground mb-1">Total Signups</div>
          <div className="text-3xl font-bold text-primary">{total}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground mb-1">Avg per Period</div>
          <div className="text-3xl font-bold text-blue-600">{avg}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground mb-1">Period</div>
          <div className="text-3xl font-bold text-foreground">{rangeLabels[timeRange]}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> User Signups
          </h2>
          <div className="flex gap-1.5">
            {(["7d", "30d", "90d", "1y", "all"] as const).map(r => (
              <button key={r} onClick={() => setTimeRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
        ) : (
          <div className="flex items-end gap-1 h-[220px] overflow-x-auto pb-6">
            {chartData.map((d, i) => {
              const h = (d.users / max) * 180;
              return (
                <div key={i} className="flex-1 min-w-[24px] flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-foreground">{d.users || ""}</span>
                  <div className="w-full max-w-[40px] rounded-t bg-primary/80 hover:bg-primary transition-colors"
                    style={{ height: `${Math.max(h, 3)}px` }} />
                  <span className="text-[9px] text-muted-foreground text-center leading-tight whitespace-nowrap">{d.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-2 text-xs text-muted-foreground">
          Granularity: {timeRange === "7d" || timeRange === "30d" ? "Daily" : timeRange === "90d" ? "Weekly" : "Monthly"}
        </div>
      </div>
    </div>
  );
}

// ── AI Resources Tab ──
function ResourcesTab() {
  const [engagements, setEngagements] = useState<{ resource_name: string; clicks: number; signups: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("resource_engagements")
        .select("resource_name, engagement_type");

      const map: Record<string, { clicks: number; signups: number }> = {};
      (data || []).forEach(e => {
        if (!map[e.resource_name]) map[e.resource_name] = { clicks: 0, signups: 0 };
        if (e.engagement_type === "click") map[e.resource_name].clicks++;
        else if (e.engagement_type === "signup") map[e.resource_name].signups++;
      });

      const result = Object.entries(map)
        .map(([name, stats]) => ({ resource_name: name, ...stats }))
        .sort((a, b) => (b.clicks + b.signups) - (a.clicks + a.signups));

      setEngagements(result);
      setLoading(false);
    };
    fetch();
  }, []);

  const totalClicks = engagements.reduce((s, e) => s + e.clicks, 0);
  const totalSignups = engagements.reduce((s, e) => s + e.signups, 0);
  const conversionRate = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground mb-1">Total Clicks</div>
          <div className="text-3xl font-bold text-primary">{totalClicks}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground mb-1">Total Signups</div>
          <div className="text-3xl font-bold text-green-600">{totalSignups}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground mb-1">Conversion Rate</div>
          <div className="text-3xl font-bold text-amber-600">{conversionRate}%</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5">Resource Engagement Breakdown</h2>
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-10">Loading...</p>
        ) : engagements.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No engagement data yet. Clicks and signups from the AI Resources page will appear here.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                {["Resource", "Clicks", "Signups", "Conv. Rate"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {engagements.map(e => (
                <tr key={e.resource_name} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-3 text-sm font-medium text-foreground">{e.resource_name}</td>
                  <td className="px-3 py-3 text-sm text-foreground">{e.clicks}</td>
                  <td className="px-3 py-3 text-sm text-green-600 font-medium">{e.signups}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">
                    {e.clicks > 0 ? ((e.signups / e.clicks) * 100).toFixed(1) : "0"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Tab Config ──
const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "resources", label: "AI Resources", icon: ExternalLink },
  { id: "content", label: "Content", icon: FileText },
  { id: "system", label: "System", icon: Settings },
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
      {/* Header - Professional two-tier */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        {/* Top bar */}
        <div className="px-4 md:px-6 lg:px-10 py-4 md:py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">Admin Dashboard</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Complete control and analytics for Digital Home</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] md:text-xs font-semibold text-primary tracking-wide">
                <Shield className="h-3 w-3" /> SUPER ADMIN
              </span>
              <button onClick={() => navigate("/dashboard")}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs md:text-sm font-medium text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors">
                Exit Admin
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation - scrollable on mobile */}
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex px-4 md:px-6 lg:px-10 min-w-max border-t border-border/50">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 md:px-5 py-3 text-xs md:text-sm font-medium border-b-[3px] transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "resources" && <ResourcesTab />}
        {activeTab === "content" && <ContentTab />}
        {activeTab === "system" && <SystemTab />}
      </div>
    </div>
  );
}
