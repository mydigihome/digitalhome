import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Users, BarChart3, MessageSquare, CreditCard, Search, X, ExternalLink } from "lucide-react";

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

// ── Analytics Overview ──
function AnalyticsOverview() {
  const [analytics, setAnalytics] = useState({
    projects: 0, tasks: 0, notes: 0, expenses: 0, resourceClicks: 0,
  });
  const [chartData, setChartData] = useState<{ date: string; users: number }[]>([]);

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, []);

  const cards = [
    { label: "Projects Created", value: analytics.projects, color: "#EC4899" },
    { label: "Tasks Created", value: analytics.tasks, color: "#10B981" },
    { label: "Notes Created", value: analytics.notes, color: "#6366F1" },
    { label: "Finance Entries", value: analytics.expenses, color: "#F59E0B" },
    { label: "Resource Engagements", value: analytics.resourceClicks, color: "#8B5CF6" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" /> Analytics Overview
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs font-medium text-muted-foreground mb-1">{c.label}</div>
            <div className="text-2xl font-semibold" style={{ color: c.color }}>
              {c.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">User Signups (Last 7 Days)</h3>
        <div className="flex items-end justify-between h-[180px] gap-2">
          {chartData.map((day, i) => {
            const max = Math.max(...chartData.map((d) => d.users), 1);
            const h = (day.users / max) * 150;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-foreground">{day.users}</span>
                <div
                  className="w-full rounded-t bg-primary transition-all duration-300"
                  style={{ height: `${Math.max(h, 4)}px` }}
                />
                <span className="text-[10px] text-muted-foreground text-center">{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── User Count ──
function UserCount() {
  const [counts, setCounts] = useState({ total: 0, students: 0, main: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { count: total } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { data: roles } = await supabase.from("user_roles").select("role");
      const students = (roles || []).filter((r) => r.role === "student").length;
      const main = (roles || []).filter((r) => r.role === "main_account").length;
      setCounts({ total: total || 0, students, main });
    };
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: "Total Active Users", value: counts.total, color: "#8B5CF6" },
    { label: "Student Accounts", value: counts.students, color: "#3B82F6" },
    { label: "Main Accounts", value: counts.main, color: "#10B981" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm font-medium text-muted-foreground mb-1">{item.label}</div>
          <div className="text-4xl font-semibold" style={{ color: item.color }}>
            {item.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── User Management Table ──
function UserManagementTable() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");

  const fetchUsers = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await supabase.functions.invoke("admin-users", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.data && Array.isArray(res.data)) {
      setUsers(res.data);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const id = setInterval(fetchUsers, 60000);
    return () => clearInterval(id);
  }, [fetchUsers]);

  const filtered = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const adminAction = async (action: string, targetUserId: string, extra: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await supabase.functions.invoke("admin-update-role", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action, targetUserId, ...extra },
    });
    if (res.error) {
      toast.error(res.error.message || "Action failed");
    } else {
      toast.success("Action completed");
      fetchUsers();
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    adminAction("update_role", userId, { newRole });
  };

  const handleDelete = (u: AdminUser) => {
    if (!confirm(`Delete ${u.full_name || u.email}? This cannot be undone.`)) return;
    adminAction("delete_user", u.id);
  };

  const handleResetPw = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.error(error.message);
    else toast.success(`Reset email sent to ${email}`);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    adminAction("update_profile", editingUser.id, { updates: { full_name: editName } });
    setEditingUser(null);
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> User Management ({filtered.length})
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                {["Name", "Email", "Joined", "Last Login", "Role", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2.5 text-sm text-foreground">{u.full_name || "N/A"}</td>
                  <td className="px-3 py-2.5 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-2.5 text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-muted-foreground">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.role === "super_admin"}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="student">Student</option>
                      <option value="main_account">Main Account</option>
                      <option value="moderator">Moderator</option>
                      {u.role === "super_admin" && <option value="super_admin">Super Admin</option>}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => { setEditingUser(u); setEditName(u.full_name); }}
                        className="rounded-md bg-secondary px-2.5 py-1 text-xs text-foreground hover:bg-secondary/80">
                        Edit
                      </button>
                      <button onClick={() => handleResetPw(u.email)}
                        className="rounded-md bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs text-blue-700 dark:text-blue-300 hover:opacity-80">
                        Reset PW
                      </button>
                      {u.role !== "super_admin" && (
                        <button onClick={() => handleDelete(u)}
                          className="rounded-md bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs text-red-600 dark:text-red-300 hover:opacity-80">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setEditingUser(null)}>
          <div className="w-[420px] rounded-xl bg-card border border-border p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Edit: {editingUser.full_name || editingUser.email}</h3>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm mb-4 outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-3">
              <button onClick={handleSaveEdit}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                Save Changes
              </button>
              <button onClick={() => setEditingUser(null)}
                className="flex-1 h-10 rounded-lg bg-secondary text-muted-foreground text-sm font-medium hover:opacity-80">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Feedback Hub ──
function FeedbackHub() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState("all");

  const fetchFeedback = useCallback(async () => {
    let query = supabase.from("feedback").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setFeedback((data as FeedbackItem[]) || []);
  }, [filter]);

  useEffect(() => {
    fetchFeedback();
    const id = setInterval(fetchFeedback, 120000);
    return () => clearInterval(id);
  }, [fetchFeedback]);

  const markResolved = async (id: string) => {
    await supabase.from("feedback").update({ status: "resolved" } as any).eq("id", id);
    fetchFeedback();
  };

  const deleteFb = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    await supabase.from("feedback").delete().eq("id", id);
    fetchFeedback();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> Feedback Hub ({feedback.length})
        </h2>
        <div className="flex gap-1.5">
          {["all", "pending", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {feedback.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No feedback to display</p>
        ) : (
          feedback.map((item) => (
            <div key={item.id} className="rounded-lg bg-secondary/50 border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{item.email || "Anonymous"}</span>
                  {item.rating && <span className="text-xs text-muted-foreground">⭐ {item.rating}/5</span>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  item.status === "resolved"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                }`}>
                  {item.status || "pending"}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3">{item.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                <div className="flex gap-2">
                  {item.status !== "resolved" && (
                    <button onClick={() => markResolved(item.id)}
                      className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground hover:opacity-90">
                      Resolve
                    </button>
                  )}
                  <button onClick={() => deleteFb(item.id)}
                    className="rounded-md bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs text-red-600 dark:text-red-300 hover:opacity-80">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Stripe Billing ──
function StripeBillingSection() {
  const [billing, setBilling] = useState<StripeBilling>({
    totalRevenue: 0, activeSubscriptions: 0, recentTransactions: [], loading: true,
  });

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke("admin-stripe-overview", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.data) {
        setBilling({ ...res.data, loading: false });
      } else {
        setBilling((p) => ({ ...p, loading: false }));
      }
    };
    fetch();
    const id = setInterval(fetch, 300000);
    return () => clearInterval(id);
  }, []);

  if (billing.loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center text-muted-foreground text-sm">
        Loading Stripe data...
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" /> Stripe Billing
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg bg-secondary/50 border border-border p-4">
          <div className="text-xs font-medium text-muted-foreground mb-1">Total Revenue</div>
          <div className="text-3xl font-semibold text-green-600">${billing.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-secondary/50 border border-border p-4">
          <div className="text-xs font-medium text-muted-foreground mb-1">Active Subscriptions</div>
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
                <div className="text-xs text-muted-foreground">
                  {new Date(tx.created * 1000).toLocaleString()}
                </div>
              </div>
              <div className="text-base font-semibold text-green-600">+${(tx.amount / 100).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}

      <a
        href="https://dashboard.stripe.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: "#635BFF" }}
      >
        Open Stripe Dashboard <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

// ── Main Admin Dashboard ──
export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

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

      if (!data) {
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      setChecking(false);
    };
    check();
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Super Admin Control Panel</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300">
            <Shield className="h-3.5 w-3.5" /> Super Admin
          </span>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80"
          >
            ← Back to App
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-6">
        <AnalyticsOverview />
        <UserCount />
        <UserManagementTable />
        <FeedbackHub />
        <StripeBillingSection />
      </div>
    </div>
  );
}
