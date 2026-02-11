import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, DollarSign, TrendingUp, Target, Lightbulb, ExternalLink, ChevronDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { format, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AppShell from "@/components/AppShell";
import { useExpenses, useCreateExpense, useDeleteExpense, useUpdateExpense } from "@/hooks/useExpenses";
import { useWealthGoals, useCreateWealthGoal, useUpdateWealthGoal, useDeleteWealthGoal } from "@/hooks/useWealthGoals";
import { useInvestments, useCreateInvestment, useDeleteInvestment } from "@/hooks/useInvestments";
import { useProjects } from "@/hooks/useProjects";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const expenseCategories = [
  "Mortgage", "Car Payment", "Student Loans", "Gas", "Electricity",
  "Water", "Cellphone", "Cable", "Internet", "Credit Card", "Groceries", "Other"
];

const categoryColors: Record<string, string> = {
  Mortgage: "#8B5CF6", "Car Payment": "#3B82F6", "Student Loans": "#EF4444",
  Gas: "#3B82F6", Electricity: "#10B981", Water: "#10B981",
  Cellphone: "#10B981", Cable: "#10B981", Internet: "#10B981",
  "Credit Card": "#EF4444", Groceries: "#F59E0B", Other: "#F59E0B",
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-green-500",
};

const gradientPresets = [
  "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 50%, #6EE7B7 100%)",
  "linear-gradient(135deg, #DBEAFE 0%, #93C5FD 50%, #60A5FA 100%)",
  "linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 50%, #A78BFA 100%)",
  "linear-gradient(135deg, #FEF3C7 0%, #FCD34D 50%, #FBBF24 100%)",
  "linear-gradient(135deg, #FCE7F3 0%, #F9A8D4 50%, #F472B6 100%)",
  "linear-gradient(135deg, #CFFAFE 0%, #67E8F9 50%, #22D3EE 100%)",
  "linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 50%, #F87171 100%)",
  "linear-gradient(135deg, #F3F4F6 0%, #D1D5DB 50%, #9CA3AF 100%)",
];

const financeTips = [
  { title: "Investing 101: A Tutorial for Beginner Investors", excerpt: "Learn the basics of investing, from stocks and bonds to mutual funds and ETFs.", url: "https://www.fidelity.com/learning-center/trading-investing/investing-for-beginners", readTime: "8 min" },
  { title: "How to Start Investing: A Guide", excerpt: "A comprehensive guide to getting started with investing, including how to set goals.", url: "https://www.fidelity.com/learning-center/trading-investing/getting-started", readTime: "6 min" },
  { title: "Stock Market Basics", excerpt: "Understand how the stock market works and how to make informed decisions.", url: "https://www.fidelity.com/learning-center/trading-investing/stock-market-basics", readTime: "5 min" },
  { title: "Understanding Mutual Funds", excerpt: "Mutual funds pool money from many investors to purchase a diversified portfolio.", url: "https://www.fidelity.com/learning-center/investment-products/mutual-funds", readTime: "7 min" },
  { title: "401(k) and IRA Basics", excerpt: "Learn about retirement accounts and how to maximize your contributions.", url: "https://www.fidelity.com/learning-center/personal-finance/retirement", readTime: "6 min" },
  { title: "Diversification Strategies", excerpt: "Reduce risk by spreading your investments across different asset classes.", url: "https://www.fidelity.com/learning-center/trading-investing/diversification", readTime: "5 min" },
  { title: "Risk Management", excerpt: "Understanding and managing investment risk for long-term success.", url: "https://www.fidelity.com/learning-center/trading-investing/risk-management", readTime: "4 min" },
  { title: "Long-term vs Short-term Investing", excerpt: "Compare strategies to find the right approach for your financial goals.", url: "https://www.fidelity.com/learning-center/trading-investing/investing-strategies", readTime: "5 min" },
];

const assetTypeColors: Record<string, string> = {
  stock: "#8B5CF6", bond: "#3B82F6", etf: "#10B981",
  crypto: "#F59E0B", real_estate: "#EF4444", other: "#6B7280",
};

export default function WealthTrackerPage() {
  const { user } = useAuth();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const { data: expenses = [] } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();
  const { data: goals = [] } = useWealthGoals();
  const createGoal = useCreateWealthGoal();
  const updateGoal = useUpdateWealthGoal();
  const deleteGoal = useDeleteWealthGoal();
  const { data: investments = [] } = useInvestments();
  const createInvestment = useCreateInvestment();
  const deleteInvestment = useDeleteInvestment();
  const { data: projects = [] } = useProjects();

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [completedGoals, setCompletedGoals] = useState(false);
  const [spendingGoal, setSpendingGoal] = useState<number | "">("");
  const [goalPeriod, setGoalPeriod] = useState<"monthly" | "yearly">("monthly");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Expense form state
  const [expForm, setExpForm] = useState({ description: "", category: "Other", amount: "", frequency: "monthly", priority: "medium", expense_date: format(new Date(), "yyyy-MM-dd") });
  // Goal form state
  const [goalForm, setGoalForm] = useState({ title: "", description: "", due_date: format(addDays(new Date(), 90), "yyyy-MM-dd"), linked_project_id: "" });
  // Investment form state
  const [invForm, setInvForm] = useState({ asset_name: "", ticker_symbol: "", asset_type: "stock", quantity: "", purchase_price: "", current_price: "", purchase_date: format(new Date(), "yyyy-MM-dd") });
  // Banner text editor state
  const [bannerText, setBannerText] = useState((prefs as any)?.wealth_banner_text || "GET RICH OR DIE TRYING");
  const [bannerTextColor, setBannerTextColor] = useState((prefs as any)?.wealth_banner_text_color || "#065F46");

  const bannerUrl = (prefs as any)?.wealth_banner_url;
  const bannerBg = bannerUrl
    ? `url(${bannerUrl})`
    : "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 50%, #6EE7B7 100%)";

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoalsList = goals.filter(g => g.is_completed);

  // Expense chart data
  const expenseByCategory = expenses.reduce<Record<string, number>>((acc, exp) => {
    const monthly = exp.frequency === "yearly" ? exp.amount / 12 : exp.amount;
    acc[exp.category] = (acc[exp.category] || 0) + monthly;
    return acc;
  }, {});
  const totalMonthly = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
  const chartData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name, value: Math.round(value * 100) / 100, fill: categoryColors[name] || "#6B7280",
    percent: totalMonthly > 0 ? Math.round((value / totalMonthly) * 100) : 0,
  })).sort((a, b) => b.value - a.value);

  // Investment chart data
  const invByType = investments.reduce<Record<string, number>>((acc, inv) => {
    const val = inv.quantity * (inv.current_price || inv.purchase_price);
    acc[inv.asset_type] = (acc[inv.asset_type] || 0) + val;
    return acc;
  }, {});
  const invChartData = Object.entries(invByType).map(([name, value]) => ({
    name: name.replace("_", " "), value: Math.round(value * 100) / 100, fill: assetTypeColors[name] || "#6B7280",
  }));
  const totalInvested = investments.reduce((s, i) => s + i.quantity * i.purchase_price, 0);
  const totalCurrentValue = investments.reduce((s, i) => s + i.quantity * (i.current_price || i.purchase_price), 0);

  const handleAddExpense = async () => {
    if (!expForm.description || !expForm.amount) { toast.error("Fill required fields"); return; }
    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, ...expForm, amount: Number(expForm.amount) } as any);
      setEditingExpense(null);
      toast.success("Expense updated");
    } else {
      await createExpense.mutateAsync({ ...expForm, amount: Number(expForm.amount) } as any);
      toast.success("Expense added");
    }
    setExpForm({ description: "", category: "Other", amount: "", frequency: "monthly", priority: "medium", expense_date: format(new Date(), "yyyy-MM-dd") });
    setShowExpenseForm(false);
  };

  const handleEditExpense = (exp: any) => {
    setExpForm({
      description: exp.description,
      category: exp.category,
      amount: String(exp.amount),
      frequency: exp.frequency,
      priority: exp.priority,
      expense_date: exp.expense_date,
    });
    setEditingExpense(exp);
    setShowExpenseForm(true);
  };

  const handleAddGoal = async () => {
    if (!goalForm.title || !goalForm.due_date) { toast.error("Fill required fields"); return; }
    await createGoal.mutateAsync({ ...goalForm, linked_project_id: goalForm.linked_project_id || null });
    setGoalForm({ title: "", description: "", due_date: format(addDays(new Date(), 90), "yyyy-MM-dd"), linked_project_id: "" });
    setShowGoalForm(false);
    toast.success("Goal added");
  };

  const handleCompleteGoal = async (goalId: string) => {
    await updateGoal.mutateAsync({ id: goalId, is_completed: true, completed_at: new Date().toISOString(), progress: 100 });
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#8B5CF6", "#3B82F6", "#10B981"] });
    toast.success("🎉 Goal completed!");
  };

  const handleAddInvestment = async () => {
    if (!invForm.asset_name || !invForm.quantity || !invForm.purchase_price) { toast.error("Fill required fields"); return; }
    await createInvestment.mutateAsync({
      ...invForm,
      quantity: Number(invForm.quantity),
      purchase_price: Number(invForm.purchase_price),
      current_price: invForm.current_price ? Number(invForm.current_price) : null,
    } as any);
    setInvForm({ asset_name: "", ticker_symbol: "", asset_type: "stock", quantity: "", purchase_price: "", current_price: "", purchase_date: format(new Date(), "yyyy-MM-dd") });
    setShowInvestmentForm(false);
    toast.success("Investment added");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const path = `${user.id}/wealth-tracker-${Date.now()}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    await upsertPrefs.mutateAsync({ wealth_banner_url: publicUrl } as any);
    setShowBannerMenu(false);
    toast.success("Banner updated");
  };

  const handleSetGradient = async (gradient: string) => {
    await upsertPrefs.mutateAsync({ wealth_banner_url: gradient } as any);
    setShowBannerMenu(false);
    toast.success("Banner updated");
  };

  const handleSaveBannerText = async () => {
    await upsertPrefs.mutateAsync({ wealth_banner_text: bannerText, wealth_banner_text_color: bannerTextColor } as any);
    setShowTextEditor(false);
    toast.success("Banner text updated");
  };

  const handleResetBanner = async () => {
    await upsertPrefs.mutateAsync({ wealth_banner_url: null, wealth_banner_text: "GET RICH OR DIE TRYING", wealth_banner_text_color: "#065F46" } as any);
    setShowBannerMenu(false);
    toast.success("Banner reset");
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Banner */}
        <div
          className="relative w-full h-[280px] rounded-2xl overflow-hidden mb-6 group"
          style={{
            background: bannerUrl?.startsWith("linear-gradient") ? bannerUrl : undefined,
            backgroundImage: bannerUrl && !bannerUrl.startsWith("linear-gradient") ? `url(${bannerUrl})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
            ...((!bannerUrl) ? { background: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 50%, #6EE7B7 100%)" } : {}),
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <h1
              className="text-5xl font-bold uppercase text-center px-8"
              style={{
                color: (prefs as any)?.wealth_banner_text_color || "#065F46",
                letterSpacing: "2px",
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {(prefs as any)?.wealth_banner_text || "GET RICH OR DIE TRYING"}
            </h1>
          </div>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <Button variant="secondary" size="sm" onClick={() => setShowBannerMenu(!showBannerMenu)}>
                Change cover
              </Button>
              {showBannerMenu && (
                <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-border bg-card p-2 shadow-lg">
                  <button onClick={() => bannerInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">Upload image</button>
                  <div className="px-3 py-2 text-xs text-muted-foreground">Gradients</div>
                  <div className="grid grid-cols-4 gap-1 px-3 pb-2">
                    {gradientPresets.map((g, i) => (
                      <button key={i} onClick={() => handleSetGradient(g)} className="h-8 w-full rounded" style={{ background: g }} />
                    ))}
                  </div>
                  <button onClick={() => { setShowTextEditor(true); setShowBannerMenu(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">Edit text</button>
                  <button onClick={handleResetBanner} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10">Reset to default</button>
                </div>
              )}
            </div>
          </div>
          <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleBannerUpload} />
        </div>

        {/* Banner Text Editor Modal */}
        {showTextEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Edit Banner Text</h3>
              <div className="space-y-2">
                <Label>Text</Label>
                <Input value={bannerText} onChange={(e) => setBannerText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bannerTextColor} onChange={(e) => setBannerTextColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                  <Input value={bannerTextColor} onChange={(e) => setBannerTextColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowTextEditor(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleSaveBannerText} className="flex-1">Save</Button>
              </div>
            </div>
          </div>
        )}

        {/* Page title */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">💰</span>
          <h1 className="text-3xl font-bold text-foreground">Wealth Tracker</h1>
        </div>

        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="expenses"><DollarSign className="h-4 w-4 mr-1" /> Expenses</TabsTrigger>
            <TabsTrigger value="goals"><Target className="h-4 w-4 mr-1" /> Goals</TabsTrigger>
            <TabsTrigger value="investments"><TrendingUp className="h-4 w-4 mr-1" /> Investments</TabsTrigger>
            <TabsTrigger value="tips"><Lightbulb className="h-4 w-4 mr-1" /> Tips</TabsTrigger>
          </TabsList>

          {/* EXPENSES TAB */}
          <TabsContent value="expenses">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-primary">${totalMonthly.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">monthly</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Entries</p>
                  <p className="text-2xl font-bold text-info">{expenses.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold text-success">{Object.keys(expenseByCategory).length}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Top Category</p>
                  <p className="text-lg font-bold text-warning">{chartData[0]?.name || "—"}</p>
                </div>
              </div>

              {/* Add Expense */}
              <div className="flex justify-end">
                <Button onClick={() => setShowExpenseForm(true)}><Plus className="h-4 w-4 mr-1" /> Add Expense</Button>
              </div>

              {/* Expense Table */}
              {expenses.length > 0 && (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Frequency</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-secondary/50 transition">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{exp.description}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{exp.category}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-foreground">${Number(exp.amount).toFixed(2)}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize">{exp.frequency}</span></td>
                          <td className="px-4 py-3"><span className={cn("inline-block h-2 w-2 rounded-full", priorityColors[exp.priority])} /></td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{exp.expense_date}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleEditExpense(exp)} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => deleteExpense.mutate(exp.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Spending Goal Section */}
              {expenses.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Spending Goal</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Label className="whitespace-nowrap">I want to spend</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 3000"
                        value={spendingGoal}
                        onChange={e => setSpendingGoal(e.target.value ? Number(e.target.value) : "")}
                        className="w-32"
                      />
                    </div>
                    <div className="flex gap-2">
                      {(["monthly", "yearly"] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setGoalPeriod(p)}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors capitalize",
                            goalPeriod === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {spendingGoal && Number(spendingGoal) > 0 && (() => {
                    const goalAmount = Number(spendingGoal);
                    const currentSpend = goalPeriod === "monthly" ? totalMonthly : totalMonthly * 12;
                    const overspend = currentSpend - goalAmount;
                    const sortedExpenses = [...chartData].sort((a, b) => b.value - a.value);
                    
                    // Find what to cut
                    let remaining = overspend;
                    const suggestions: { name: string; amount: number; cut: number }[] = [];
                    if (overspend > 0) {
                      for (const exp of sortedExpenses) {
                        if (remaining <= 0) break;
                        const expAmount = goalPeriod === "yearly" ? exp.value * 12 : exp.value;
                        const cutAmount = Math.min(expAmount * 0.5, remaining);
                        suggestions.push({ name: exp.name, amount: expAmount, cut: cutAmount });
                        remaining -= cutAmount;
                      }
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Current: ${currentSpend.toFixed(0)}</span>
                              <span className={cn("font-medium", overspend > 0 ? "text-destructive" : "text-success")}>
                                Goal: ${goalAmount.toFixed(0)}
                              </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", overspend > 0 ? "bg-destructive" : "bg-success")}
                                style={{ width: `${Math.min((currentSpend / goalAmount) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {overspend > 0 ? (
                          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
                            <p className="text-sm font-medium text-warning">💡 You're ${overspend.toFixed(0)} over your {goalPeriod} goal. Consider cutting:</p>
                            {suggestions.map((s, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-foreground">{s.name}</span>
                                <span className="text-muted-foreground">
                                  Cut ~${s.cut.toFixed(0)} (from ${s.amount.toFixed(0)})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                            <p className="text-sm font-medium text-success">✅ You're ${Math.abs(overspend).toFixed(0)} under your {goalPeriod} goal!</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Expenses by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </TabsContent>

          {/* GOALS TAB */}
          <TabsContent value="goals">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">90-Day Goals</h2>
                  <p className="text-muted-foreground">Your top 3 priorities for this quarter</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(), "MMM d")} – {format(addDays(new Date(), 90), "MMM d, yyyy")}</p>
                </div>
                <Button onClick={() => setShowGoalForm(true)} disabled={activeGoals.length >= 3}>
                  <Plus className="h-4 w-4 mr-1" /> Add Goal
                </Button>
              </div>

              {activeGoals.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">No active goals. Add up to 3 goals!</p>
                </div>
              )}

              {activeGoals.map(goal => {
                const daysLeft = differenceInDays(new Date(goal.due_date), new Date());
                return (
                  <div key={goal.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground">{goal.title}</h3>
                        {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleCompleteGoal(goal.id)} className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary transition">✓ Complete</button>
                        <button onClick={() => deleteGoal.mutate(goal.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-3" />
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={cn("font-medium", daysLeft < 7 ? (daysLeft < 0 ? "text-destructive" : "text-warning") : "text-muted-foreground")}>
                        {daysLeft < 0 ? "Overdue" : `${daysLeft} days remaining`}
                      </span>
                      {goal.linked_project_id && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Linked to project
                        </span>
                      )}
                    </div>
                    {/* Progress slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Update:</span>
                      <input
                        type="range" min={0} max={100} value={goal.progress}
                        onChange={(e) => updateGoal.mutate({ id: goal.id, progress: Number(e.target.value) })}
                        className="flex-1 accent-primary"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Completed Goals */}
              {completedGoalsList.length > 0 && (
                <div>
                  <button onClick={() => setCompletedGoals(!completedGoals)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", completedGoals && "rotate-180")} />
                    Completed Goals ({completedGoalsList.length})
                  </button>
                  <AnimatePresence>
                    {completedGoals && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 space-y-2">
                        {completedGoalsList.slice(0, 10).map(g => (
                          <div key={g.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
                            <span className="text-green-500">🎉</span>
                            <span className="flex-1 text-sm text-muted-foreground">{g.title}</span>
                            <span className="text-xs text-muted-foreground">{g.completed_at ? format(new Date(g.completed_at), "MMM d") : ""}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>

          {/* INVESTMENTS TAB */}
          <TabsContent value="investments">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground">Investment Portfolio</h2>
                  <a
                    href="/settings?tab=resources&category=Finance"
                    title="Check out where you can invest"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </a>
                </div>
                <Button onClick={() => setShowInvestmentForm(true)}><Plus className="h-4 w-4 mr-1" /> Add Investment</Button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Total Invested</p>
                  <p className="text-xl font-bold text-foreground">${totalInvested.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Current Value</p>
                  <p className="text-xl font-bold text-foreground">${totalCurrentValue.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">Total Gain/Loss</p>
                  <p className={cn("text-xl font-bold", totalCurrentValue - totalInvested >= 0 ? "text-green-600" : "text-destructive")}>
                    ${(totalCurrentValue - totalInvested).toFixed(2)}
                    <span className="text-sm ml-1">
                      ({totalInvested > 0 ? (((totalCurrentValue - totalInvested) / totalInvested) * 100).toFixed(1) : 0}%)
                    </span>
                  </p>
                </div>
              </div>

              {/* Table */}
              {investments.length > 0 && (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Asset</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Ticker</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Buy Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Current</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Total Value</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Gain/Loss</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {investments.map(inv => {
                        const cur = inv.current_price || inv.purchase_price;
                        const totalVal = inv.quantity * cur;
                        const gainLoss = (cur - inv.purchase_price) * inv.quantity;
                        const gainPct = inv.purchase_price > 0 ? ((cur - inv.purchase_price) / inv.purchase_price * 100) : 0;
                        return (
                          <tr key={inv.id} className="hover:bg-secondary/50 transition">
                            <td className="px-4 py-3 text-sm font-medium text-foreground">{inv.asset_name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{inv.ticker_symbol || "—"}</td>
                            <td className="px-4 py-3"><span className="rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: assetTypeColors[inv.asset_type] + "20", color: assetTypeColors[inv.asset_type] }}>{inv.asset_type.replace("_", " ")}</span></td>
                            <td className="px-4 py-3 text-sm text-foreground">{inv.quantity}</td>
                            <td className="px-4 py-3 text-sm text-foreground">${Number(inv.purchase_price).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-foreground">${cur.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-foreground">${totalVal.toFixed(2)}</td>
                            <td className={cn("px-4 py-3 text-sm font-semibold", gainLoss >= 0 ? "text-green-600" : "text-destructive")}>
                              ${gainLoss.toFixed(2)} ({gainPct.toFixed(1)}%)
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => deleteInvestment.mutate(inv.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pie Chart */}
              {invChartData.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Allocation</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={invChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {invChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TIPS TAB */}
          <TabsContent value="tips">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground mb-4">Finance Tips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {financeTips.map((tip, i) => (
                  <a key={i} href={tip.url} target="_blank" rel="noopener noreferrer"
                    className="group rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{tip.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Fidelity Learning Center</span>
                      <span>{tip.readTime} read</span>
                    </div>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary">
                      Read more <ExternalLink className="h-3 w-3" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* MODALS */}
        {/* Expense Form Modal */}
        {showExpenseForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }}>
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-foreground">{editingExpense ? "Edit Expense" : "Add Expense"}</h3>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Description</Label><Input value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Category</Label>
                  <select value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    {expenseCategories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><Label>Amount ($)</Label><Input type="number" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Frequency</Label>
                  <div className="flex gap-3">
                    {["monthly", "yearly", "one-time"].map(f => (
                      <label key={f} className="flex items-center gap-1.5 text-sm"><input type="radio" name="freq" checked={expForm.frequency === f} onChange={() => setExpForm(p => ({ ...p, frequency: f }))} /> <span className="capitalize">{f}</span></label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1"><Label>Priority</Label>
                  <select value={expForm.priority} onChange={e => setExpForm(p => ({ ...p, priority: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    {["critical", "high", "medium", "low"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><Label>Date</Label><Input type="date" value={expForm.expense_date} onChange={e => setExpForm(p => ({ ...p, expense_date: e.target.value }))} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }} className="flex-1">Cancel</Button>
                <Button onClick={handleAddExpense} disabled={createExpense.isPending || updateExpense.isPending} className="flex-1">
                  {(createExpense.isPending || updateExpense.isPending) ? "Saving..." : editingExpense ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Goal Form Modal */}
        {showGoalForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setShowGoalForm(false)}>
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-foreground">Add Goal</h3>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Title</Label><Input value={goalForm.title} onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Description (optional)</Label><Textarea value={goalForm.description} onChange={e => setGoalForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={goalForm.due_date} onChange={e => setGoalForm(p => ({ ...p, due_date: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Link to Project (optional)</Label>
                  <select value={goalForm.linked_project_id} onChange={e => setGoalForm(p => ({ ...p, linked_project_id: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    <option value="">None</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowGoalForm(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddGoal} disabled={createGoal.isPending} className="flex-1">{createGoal.isPending ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Investment Form Modal */}
        {showInvestmentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setShowInvestmentForm(false)}>
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-foreground">Add Investment</h3>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Asset Name</Label><Input value={invForm.asset_name} onChange={e => setInvForm(p => ({ ...p, asset_name: e.target.value }))} placeholder="e.g. Apple Stock" /></div>
                <div className="space-y-1"><Label>Ticker Symbol</Label><Input value={invForm.ticker_symbol} onChange={e => setInvForm(p => ({ ...p, ticker_symbol: e.target.value }))} placeholder="e.g. AAPL" /></div>
                <div className="space-y-1"><Label>Asset Type</Label>
                  <select value={invForm.asset_type} onChange={e => setInvForm(p => ({ ...p, asset_type: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                    {["stock", "bond", "etf", "crypto", "real_estate", "other"].map(t => <option key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={invForm.quantity} onChange={e => setInvForm(p => ({ ...p, quantity: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Purchase Price ($)</Label><Input type="number" value={invForm.purchase_price} onChange={e => setInvForm(p => ({ ...p, purchase_price: e.target.value }))} /></div>
                </div>
                <div className="space-y-1"><Label>Current Price (optional)</Label><Input type="number" value={invForm.current_price} onChange={e => setInvForm(p => ({ ...p, current_price: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Purchase Date</Label><Input type="date" value={invForm.purchase_date} onChange={e => setInvForm(p => ({ ...p, purchase_date: e.target.value }))} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowInvestmentForm(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddInvestment} disabled={createInvestment.isPending} className="flex-1">{createInvestment.isPending ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
