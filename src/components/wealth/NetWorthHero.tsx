import { useState } from "react";
import { Pencil, X, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: "asset" | "liability";
}

function load(): Account[] {
  return loadStoredJson<Account[]>("wealth_accounts", []);
}
function save(a: Account[]) { saveStoredJson("wealth_accounts", a); }

function getMonthlySpendingData() {
  try {
    const data = loadStoredJson<any[]>("wealth_monthly_spending", []);
    if (data.length === 0) return { income: 0, spending: 0 };
    const latest = data[0];
    const income = latest.transactions.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
    const spending = Math.abs(latest.transactions.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + t.amount, 0));
    return { income, spending };
  } catch { return { income: 0, spending: 0 }; }
}

export default function NetWorthHero() {
  const [accounts, setAccounts] = useState<Account[]>(load);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", balance: "", type: "asset" as "asset" | "liability" });

  const persist = (next: Account[]) => { setAccounts(next); save(next); };

  const addAccount = () => {
    if (!form.name || !form.balance) return;
    persist([...accounts, { id: crypto.randomUUID(), name: form.name, balance: Number(form.balance), type: form.type }]);
    setForm({ name: "", balance: "", type: "asset" });
  };

  const removeAccount = (id: string) => persist(accounts.filter(a => a.id !== id));
  const updateBalance = (id: string, balance: number) => persist(accounts.map(a => a.id === id ? { ...a, balance } : a));

  const assets = accounts.filter(a => a.type === "asset").reduce((s, a) => s + a.balance, 0);
  const liabilities = accounts.filter(a => a.type === "liability").reduce((s, a) => s + a.balance, 0);
  const netWorth = assets - liabilities;
  const { income, spending } = getMonthlySpendingData();
  const cashFlow = income - spending;

  const fmt = (n: number) => {
    const abs = Math.abs(n);
    return (n < 0 ? "-" : "") + "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <section id="net-worth">
      <div className="group rounded-2xl border border-border bg-card p-8 md:p-10 text-center relative">
        <button
          onClick={() => setEditing(!editing)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
        >
          {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </button>

        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Net Worth</p>
        <p className={`text-5xl md:text-6xl font-bold tracking-tight ${netWorth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {fmt(netWorth)}
        </p>

        <div className="flex items-center justify-center gap-8 mt-6">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total Assets</p>
            <p className="text-lg font-semibold text-emerald-600">{fmt(assets)}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total Liabilities</p>
            <p className="text-lg font-semibold text-red-500">{fmt(liabilities)}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Monthly Cash Flow</p>
            <p className={`text-lg font-semibold ${cashFlow >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {cashFlow !== 0 ? fmt(cashFlow) : "—"}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-6 pt-6 border-t border-border text-left space-y-4 max-w-lg mx-auto">
                {accounts.map(a => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.type === "asset" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {a.type === "asset" ? "Asset" : "Debt"}
                    </span>
                    <span className="text-sm font-medium text-foreground flex-1">{a.name}</span>
                    <Input
                      type="number"
                      value={a.balance}
                      onChange={e => updateBalance(a.id, Number(e.target.value) || 0)}
                      className="h-8 w-28 text-sm text-right"
                    />
                    <button onClick={() => removeAccount(a.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Debt</option>
                  </select>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Account name" className="h-8 text-sm flex-1" />
                  <Input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} placeholder="Amount" className="h-8 text-sm w-28" />
                  <Button size="sm" onClick={addAccount} className="h-8 px-3"><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
