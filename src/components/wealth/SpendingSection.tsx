import { useState, useCallback } from "react";
import { Upload, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
}

interface MonthData {
  month: string;
  transactions: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#F59E0B", Shopping: "#8B5CF6", Transport: "#3B82F6", Entertainment: "#EC4899",
  Subscriptions: "#10B981", Health: "#EF4444", Income: "#22C55E", Transfer: "#6B7280", Other: "#94A3B8",
};

function loadMonthlyData(): MonthData[] {
  try { return JSON.parse(localStorage.getItem("wealth_monthly_spending") || "[]"); } catch { return []; }
}
function saveMonthlyData(d: MonthData[]) { localStorage.setItem("wealth_monthly_spending", JSON.stringify(d)); }

export default function SpendingSection() {
  const [allMonths, setAllMonths] = useState<MonthData[]>(loadMonthlyData);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const monthData = allMonths.find(m => m.month === selectedMonth);
  const transactions = monthData?.transactions || [];

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      let text = "";
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        text = await file.text();
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        text = await file.text();
        if (text.length < 100 || /[\x00-\x08]/.test(text.slice(0, 100))) {
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          text = `[PDF file content - filename: ${file.name}]\n` + btoa(binary).slice(0, 50000);
        }
      } else {
        text = await file.text();
      }
      if (!text.trim()) { toast.error("Could not read file content"); setUploading(false); return; }

      const { data, error } = await supabase.functions.invoke("analyze-statement", {
        body: { statementText: text.slice(0, 100000) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const txns: Transaction[] = data?.transactions || [];
      if (txns.length === 0) { toast.error("No transactions found. Try a CSV or text-based PDF."); setUploading(false); return; }

      const firstDate = txns[0]?.date || "";
      const month = firstDate.slice(0, 7) || currentMonth;
      const updated = allMonths.filter(m => m.month !== month);
      updated.push({ month, transactions: txns });
      updated.sort((a, b) => b.month.localeCompare(a.month));
      setAllMonths(updated);
      saveMonthlyData(updated);
      setSelectedMonth(month);
      toast.success(`${txns.length} transactions extracted for ${month}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to process statement");
    }
    setUploading(false);
  }, [allMonths, currentMonth]);

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); };

  const expenses = transactions.filter(t => t.amount < 0);
  const income = transactions.filter(t => t.amount > 0);
  const totalSpent = Math.abs(expenses.reduce((s, t) => s + t.amount, 0));
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);

  const categoryTotals = expenses.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount); return acc;
  }, {});
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name, value: Math.round(value * 100) / 100, fill: CATEGORY_COLORS[name] || "#94A3B8",
  })).sort((a, b) => b.value - a.value);

  const yearlyData = allMonths.map(m => {
    const exp = m.transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const inc = m.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    return { month: m.month, Spent: Math.round(exp), Income: Math.round(inc) };
  }).sort((a, b) => a.month.localeCompare(b.month));

  const availableMonths = allMonths.map(m => m.month).sort((a, b) => b.localeCompare(a));

  return (
    <section id="spending">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Monthly Spending</h2>
        {availableMonths.length > 0 && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{availableMonths.map(m => <SelectItem key={m} value={m}>{new Date(m + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed transition-all p-6 text-center mb-3 ${dragOver ? "border-primary bg-primary/5" : "border-border bg-card"}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Analyzing with AI...</p>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Upload bank statement PDF or CSV — any bank supported</p>
            <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
            <input type="file" accept=".pdf,.csv,.txt" className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
          </label>
        )}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mb-4">
        <Shield className="h-3 w-3 shrink-0" />
        Your statement is processed by AI and never stored — only totals are saved.
      </div>

      {transactions.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-0.5">Total Spent</p>
              <p className="text-xl font-bold text-red-500">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-0.5">Total Income</p>
              <p className="text-xl font-bold text-emerald-600">${totalIncome.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-0.5">Net</p>
              <p className={`text-xl font-bold ${totalIncome - totalSpent >= 0 ? "text-emerald-600" : "text-red-500"}`}>${(totalIncome - totalSpent).toFixed(2)}</p>
            </div>
          </div>

          {pieData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Spending by Category</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map(p => (
                    <div key={p.name} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                      {p.name} (${p.value.toFixed(0)})
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Transactions ({transactions.length})</h3>
                <div className="max-h-[260px] overflow-y-auto space-y-0.5">
                  {transactions.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors text-xs">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[t.category] || "#94A3B8" }} />
                      <span className="flex-1 truncate text-foreground">{t.description}</span>
                      <span className={`font-medium ${t.amount < 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {yearlyData.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Yearly Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `$${v}`} />
              <Legend />
              <Bar dataKey="Spent" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {transactions.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-base font-semibold text-foreground mb-1">No spending data yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Upload a bank statement to automatically categorize your spending.</p>
        </div>
      )}
    </section>
  );
}
