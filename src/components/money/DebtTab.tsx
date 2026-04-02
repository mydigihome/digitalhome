import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Pencil, Trash2, FileX, ChevronDown } from "lucide-react";
import { useDebts, useAddDebt, useDeleteDebt, useAddLoanApplication, type Debt } from "@/hooks/useDebts";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TIERS = [
  { id: "15k" as const, amount: 15000, fee: 1500, rate: 8 },
  { id: "20k" as const, amount: 20000, fee: 2000, rate: 12 },
  { id: "30k" as const, amount: 30000, fee: 2800, rate: 15 },
];

const PAYMENT_DATA = [
  { month: "Jan", amount: 860, label: "$860" },
  { month: "Feb", amount: 1260, label: "$1,260" },
  { month: "Mar", amount: 1030, label: "$1,030" },
  { month: "Apr", amount: 1498, label: "$1,498" },
  { month: "May", amount: 1015, label: "$1,015" },
];

const DEBT_TYPES = ["Credit Card", "Student Loan", "Auto Loan", "Medical", "Personal", "Other"];
const DEBT_TABS = ["All", "Credit Cards", "Student Loans", "Auto Loans", "Medical", "Other"];

function CustomPaymentTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div style={{
      background: '#7B5EA7', color: 'white', borderRadius: 10,
      padding: '8px 14px', fontSize: 13, fontWeight: 600,
      textAlign: 'center', boxShadow: '0 4px 12px rgba(123,94,167,0.4)',
      position: 'relative',
    }}>
      <div style={{ fontWeight: 700 }}>13% ↗</div>
      <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.9 }}>$ {value.toLocaleString()}</div>
      <div style={{
        position: 'absolute', bottom: -6, left: '50%',
        transform: 'translateX(-50%)', width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid #7B5EA7',
      }} />
    </div>
  );
}

export default function DebtTab() {
  const { data: debts = [] } = useDebts();
  const addDebt = useAddDebt();
  const deleteDebt = useDeleteDebt();
  const applyLoan = useAddLoanApplication();

  const [selectedTier, setSelectedTier] = useState<'15k' | '20k' | '30k'>('20k');
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("5 Months");
  const [showChartDropdown, setShowChartDropdown] = useState(false);
  const [debtTab, setDebtTab] = useState("All");
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [debtForm, setDebtForm] = useState({
    creditor: "", type: "Credit Card", balance: "", interest_rate: "",
    monthly_payment: "", due_date: "", notes: "",
  });

  const tier = TIERS.find(t => t.id === selectedTier)!;

  const filteredDebts = useMemo(() => {
    if (debtTab === "All") return debts;
    const typeMap: Record<string, string> = {
      "Credit Cards": "Credit Card", "Student Loans": "Student Loan",
      "Auto Loans": "Auto Loan", "Medical": "Medical", "Other": "Other",
    };
    return debts.filter(d => d.type === (typeMap[debtTab] || debtTab));
  }, [debts, debtTab]);

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMonthly = debts.reduce((s, d) => s + d.monthly_payment, 0);
  const avgRate = debts.length > 0
    ? debts.reduce((s, d) => s + d.interest_rate * d.balance, 0) / (totalDebt || 1)
    : 0;

  const handleApplyLoan = async () => {
    try {
      await applyLoan.mutateAsync({ amount: tier.amount, fee: tier.fee, interest_rate: tier.rate });
      setShowApplyConfirm(false);
      toast.success("Application submitted!");
    } catch { toast.error("Failed to submit application"); }
  };

  const openAddDebt = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setDebtForm({
        creditor: debt.creditor, type: debt.type, balance: String(debt.balance),
        interest_rate: String(debt.interest_rate), monthly_payment: String(debt.monthly_payment),
        due_date: debt.due_date || "", notes: debt.notes || "",
      });
    } else {
      setEditingDebt(null);
      setDebtForm({ creditor: "", type: "Credit Card", balance: "", interest_rate: "", monthly_payment: "", due_date: "", notes: "" });
    }
    setShowAddDebt(true);
  };

  const handleSaveDebt = async () => {
    if (!debtForm.creditor || !debtForm.balance) return;
    try {
      const payload = {
        creditor: debtForm.creditor, type: debtForm.type,
        balance: parseFloat(debtForm.balance), interest_rate: parseFloat(debtForm.interest_rate) || 0,
        monthly_payment: parseFloat(debtForm.monthly_payment) || 0,
        due_date: debtForm.due_date || null, notes: debtForm.notes || null,
        status: "current",
      };
      if (editingDebt) {
        const { error } = await (await import("@/integrations/supabase/client")).supabase
          .from("debts" as any).update(payload).eq("id", editingDebt.id) as any;
        if (error) throw error;
      } else {
        await addDebt.mutateAsync(payload);
      }
      setShowAddDebt(false);
      toast.success(editingDebt ? "Debt updated" : "Debt added");
    } catch { toast.error("Failed to save debt"); }
  };

  const handleDeleteDebt = async () => {
    if (!deleteTarget) return;
    const debt = debts.find(d => d.id === deleteTarget);
    try {
      await deleteDebt.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      toast.success("Debt deleted", {
        action: { label: "Undo", onClick: () => {
          if (debt) addDebt.mutate({ creditor: debt.creditor, type: debt.type, balance: debt.balance, interest_rate: debt.interest_rate, monthly_payment: debt.monthly_payment, due_date: debt.due_date, notes: debt.notes, status: debt.status });
        }},
        duration: 5000,
      });
    } catch { toast.error("Failed to delete"); }
  };

  const cardStyle = "bg-card border border-border rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

  return (
    <div className="space-y-6">
      {/* Two column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start', width: '100%' }}
        className="max-lg:grid-cols-1"
      >
        {/* LEFT: Loan Offer */}
        <div className={cardStyle} style={{ padding: 28, borderRadius: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700 }} className="text-foreground">Loan Offer</h2>
          <p style={{ fontSize: 13, marginTop: 4, marginBottom: 24 }} className="text-muted-foreground">Based on your strong financial history.</p>

          {TIERS.map(t => {
            const selected = selectedTier === t.id;
            return (
              <div key={t.id} onClick={() => setSelectedTier(t.id)}
                className="cursor-pointer transition-all"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 12, marginBottom: 12,
                  border: selected ? '2px solid #7B5EA7' : '1.5px solid hsl(var(--border))',
                  background: selected ? 'hsl(var(--accent) / 0.3)' : 'transparent',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: selected ? '2px solid #7B5EA7' : '2px solid hsl(var(--muted-foreground) / 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7B5EA7' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }} className="text-foreground">${t.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 13 }} className="text-muted-foreground">
                    Loan fee: ${t.fee.toLocaleString()}   Interest rate: {t.rate}%
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loan details */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid hsl(var(--border))' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }} className="text-foreground">Loan details</h3>
            {[
              { label: "Selected loan amount", value: tier.amount.toLocaleString() },
              { label: "Loan fee", value: tier.fee.toLocaleString() },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
                <span style={{ fontSize: 14 }} className="text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground" style={{ fontSize: 11, background: 'hsl(var(--muted))', borderRadius: 4, padding: '2px 8px', fontWeight: 500 }}>USD</span>
                  <span style={{ fontSize: 16, fontWeight: 700 }} className="text-foreground">{row.value}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between" style={{ marginTop: 8, paddingTop: 12, borderTop: '1.5px solid hsl(var(--border))' }}>
              <span style={{ fontSize: 14 }} className="text-muted-foreground">Total amount</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground" style={{ fontSize: 11, background: 'hsl(var(--muted))', borderRadius: 4, padding: '2px 8px', fontWeight: 500 }}>USD</span>
                <span style={{ fontSize: 20, fontWeight: 800 }} className="text-foreground">{(tier.amount + tier.fee).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="flex-1 border border-border rounded-xl text-foreground hover:bg-muted transition" style={{ height: 48, fontSize: 15, fontWeight: 500, background: 'transparent' }}>
              Cancel
            </button>
            <button onClick={() => setShowApplyConfirm(true)} className="flex-1 rounded-xl text-white transition" style={{ height: 48, fontSize: 15, fontWeight: 600, background: '#7B5EA7', border: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#6D4F9A')}
              onMouseLeave={e => (e.currentTarget.style.background = '#7B5EA7')}
            >
              Apply Loan
            </button>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Available Loan */}
          <div className={cardStyle} style={{ padding: 24, borderRadius: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }} className="text-foreground">Top Available Loan</h3>
            <div className="flex justify-between items-start">
              <div>
                <div style={{ fontSize: 12 }} className="text-muted-foreground mb-1">Loan amount</div>
                <div style={{ fontSize: 28, fontWeight: 700 }} className="text-foreground">$30,000.00</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12 }} className="text-muted-foreground mb-1">Loan period</div>
                <div style={{ fontSize: 13, fontWeight: 500 }} className="text-foreground">Sep 01 - Aug 31, 2025</div>
              </div>
            </div>
            <div className="flex justify-between" style={{ margin: '12px 0', fontSize: 13 }}>
              <span className="text-muted-foreground">Loan fee: $2,800</span>
              <span className="text-muted-foreground">Interest rate: 15%</span>
            </div>
            {/* Segmented bar */}
            <div style={{ display: 'flex', width: '100%', height: 10, borderRadius: 999, overflow: 'hidden', margin: '16px 0 8px' }}>
              <div style={{ width: '60%', background: '#7B5EA7' }} />
              <div style={{ width: '28%', background: '#10B981' }} />
              <div style={{ width: '12%', background: 'hsl(var(--border))' }} />
            </div>
            <div className="flex gap-4" style={{ marginTop: 8 }}>
              {[{ label: "Principal", color: "#7B5EA7" }, { label: "Interest", color: "#10B981" }, { label: "Tax", color: "hsl(var(--border))" }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5" style={{ fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span className="text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payments Chart */}
          <div className={cardStyle} style={{ padding: 24, borderRadius: 16 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 15, fontWeight: 600 }} className="text-foreground">Payments based on your sales</h3>
              <div className="relative">
                <button onClick={() => setShowChartDropdown(!showChartDropdown)} className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 6, padding: '4px 10px' }}>
                  {chartPeriod} <ChevronDown size={10} />
                </button>
                {showChartDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[100px]">
                    {["3 Months", "5 Months", "1 Year"].map(p => (
                      <button key={p} onClick={() => { setChartPeriod(p); setShowChartDropdown(false); }} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${chartPeriod === p ? "font-bold text-foreground" : "text-muted-foreground"}`}>{p}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PAYMENT_DATA} margin={{ top: 40, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <XAxis xAxisId="amount-axis" dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={8} />
                  <YAxis hide />
                  <Tooltip content={<CustomPaymentTooltip />} cursor={false} />
                  <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2.5} fill="url(#payGrad)"
                    dot={(props: any) => <circle key={props.index} cx={props.cx} cy={props.cy} r={6} fill="#10B981" stroke="#FFFFFF" strokeWidth={2.5} />}
                    activeDot={{ r: 8, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* My Debts — Full Width */}
      <div className={cardStyle} style={{ padding: 24, borderRadius: 16 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 20, fontWeight: 700 }} className="text-foreground">My Debts</h2>
          <button onClick={() => openAddDebt()} className="flex items-center gap-2 rounded-lg text-white transition" style={{ background: '#10B981', padding: '8px 16px', fontWeight: 500, fontSize: 14, border: 'none' }}>
            <Plus size={16} /> Add Debt
          </button>
        </div>

        {/* Summary row */}
        {debts.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="text-muted-foreground text-xs mb-1">Total Debt</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="text-muted-foreground text-xs mb-1">Monthly Payments</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>${totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="text-muted-foreground text-xs mb-1">Avg Interest Rate</div>
              <div style={{ fontSize: 20, fontWeight: 700 }} className="text-muted-foreground">{avgRate.toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center border-b border-border mb-4">
          {DEBT_TABS.map(tab => (
            <button key={tab} onClick={() => setDebtTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${debtTab === tab ? "border-success text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >{tab}</button>
          ))}
        </div>

        {/* Debt table or empty state */}
        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileX className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-lg font-semibold text-foreground mb-1">No debts tracked yet</p>
            <p className="text-sm text-muted-foreground mb-4">Add your first debt to start tracking</p>
            <button onClick={() => openAddDebt()} className="flex items-center gap-2 rounded-lg text-white" style={{ background: '#10B981', padding: '8px 16px', fontWeight: 500, fontSize: 14, border: 'none' }}>
              <Plus size={16} /> Add Debt
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Creditor", "Type", "Balance", "Interest Rate", "Monthly Payment", "Due Date", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDebts.map(debt => (
                  <tr key={debt.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                    <td className="py-3 px-3 font-medium text-foreground">{debt.creditor}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{debt.type}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-foreground">${debt.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 text-muted-foreground">{debt.interest_rate}%</td>
                    <td className="py-3 px-3 text-foreground">${debt.monthly_payment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 text-muted-foreground">{debt.due_date ? format(new Date(debt.due_date), "MMM d, yyyy") : "—"}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        debt.status === "current" ? "bg-success/10 text-success" :
                        debt.status === "overdue" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{debt.status === "current" ? "Current" : debt.status === "overdue" ? "Overdue" : "Paid Off"}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => openAddDebt(debt)} className="text-muted-foreground hover:text-foreground"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(debt.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Loan Confirm */}
      <AlertDialog open={showApplyConfirm} onOpenChange={setShowApplyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply for ${tier.amount.toLocaleString()} loan?</AlertDialogTitle>
            <AlertDialogDescription>This will submit your loan application.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyLoan} style={{ background: '#7B5EA7' }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Debt Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this debt?</AlertDialogTitle>
            <AlertDialogDescription>This action can be undone within 5 seconds.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDebt} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Debt Modal */}
      {showAddDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddDebt(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">{editingDebt ? "Edit Debt" : "Add Debt"}</h3>
            <div className="space-y-3">
              <input value={debtForm.creditor} onChange={e => setDebtForm(f => ({ ...f, creditor: e.target.value }))} placeholder="Creditor Name" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <select value={debtForm.type} onChange={e => setDebtForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                {DEBT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={debtForm.balance} onChange={e => setDebtForm(f => ({ ...f, balance: e.target.value }))} placeholder="Current Balance" type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <input value={debtForm.interest_rate} onChange={e => setDebtForm(f => ({ ...f, interest_rate: e.target.value }))} placeholder="Interest Rate %" type="number" step="0.1" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <input value={debtForm.monthly_payment} onChange={e => setDebtForm(f => ({ ...f, monthly_payment: e.target.value }))} placeholder="Monthly Minimum Payment" type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <input value={debtForm.due_date} onChange={e => setDebtForm(f => ({ ...f, due_date: e.target.value }))} type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
              <textarea value={debtForm.notes} onChange={e => setDebtForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none" />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowAddDebt(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-foreground">Cancel</button>
              <button onClick={handleSaveDebt} disabled={addDebt.isPending} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                {addDebt.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
