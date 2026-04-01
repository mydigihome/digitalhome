import { useState } from "react";
import { Plus, Trash2, BarChart3, FileText, Pencil, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment, type Investment } from "@/hooks/useInvestments";

interface HoldingsSectionProps {
  onViewChart: (symbol: string) => void;
  onTradingPlan: (symbol: string, name: string, price: number) => void;
}

export default function HoldingsSection({ onViewChart, onTradingPlan }: HoldingsSectionProps) {
  const { data: investments } = useInvestments();
  const createInv = useCreateInvestment();
  const updateInv = useUpdateInvestment();
  const deleteInv = useDeleteInvestment();

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    asset_name: "", ticker_symbol: "", asset_type: "stock",
    quantity: "", purchase_price: "", current_price: "", purchase_date: new Date().toISOString().split("T")[0],
  });

  const resetForm = () => {
    setForm({ asset_name: "", ticker_symbol: "", asset_type: "stock", quantity: "", purchase_price: "", current_price: "", purchase_date: new Date().toISOString().split("T")[0] });
    setEditingId(null);
    setShowAdd(false);
  };

  const handleSave = async () => {
    if (!form.asset_name || !form.quantity || !form.purchase_price) {
      toast.error("Fill name, quantity, and purchase price");
      return;
    }
    try {
      if (editingId) {
        await updateInv.mutateAsync({
          id: editingId,
          asset_name: form.asset_name,
          ticker_symbol: form.ticker_symbol || null,
          asset_type: form.asset_type,
          quantity: parseFloat(form.quantity),
          purchase_price: parseFloat(form.purchase_price),
          current_price: form.current_price ? parseFloat(form.current_price) : null,
          purchase_date: form.purchase_date,
        });
        toast.success("Updated!");
      } else {
        await createInv.mutateAsync({
          asset_name: form.asset_name,
          ticker_symbol: form.ticker_symbol || null,
          asset_type: form.asset_type,
          quantity: parseFloat(form.quantity),
          purchase_price: parseFloat(form.purchase_price),
          current_price: form.current_price ? parseFloat(form.current_price) : null,
          purchase_date: form.purchase_date,
        });
        toast.success("Investment added!");
      }
      resetForm();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleEdit = (inv: Investment) => {
    setForm({
      asset_name: inv.asset_name,
      ticker_symbol: inv.ticker_symbol || "",
      asset_type: inv.asset_type,
      quantity: String(inv.quantity),
      purchase_price: String(inv.purchase_price),
      current_price: inv.current_price ? String(inv.current_price) : "",
      purchase_date: inv.purchase_date,
    });
    setEditingId(inv.id);
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    await deleteInv.mutateAsync(id);
    toast.success("Removed");
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">My Holdings</h2>
        <Button size="sm" variant="outline" onClick={() => { resetForm(); setShowAdd(true); }} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Holding
        </Button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Name</label>
                  <Input value={form.asset_name} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} placeholder="Apple Inc." className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Ticker</label>
                  <Input value={form.ticker_symbol} onChange={(e) => setForm({ ...form, ticker_symbol: e.target.value.toUpperCase() })} placeholder="AAPL" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Type</label>
                  <Select value={form.asset_type} onValueChange={(v) => setForm({ ...form, asset_type: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Purchase Date</label>
                  <Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Quantity</label>
                  <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="10" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Avg Price ($)</label>
                  <Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} placeholder="175" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Current Price ($)</label>
                  <Input type="number" value={form.current_price} onChange={(e) => setForm({ ...form, current_price: e.target.value })} placeholder="185" className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>{editingId ? "Update" : "Add"}</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Holdings Cards */}
      {!investments?.length ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-3"></div>
          <h3 className="text-base font-semibold text-foreground mb-1">No holdings yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">Add your investments to track performance and create trading plans.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {investments.map((inv) => {
            const currentPrice = Number(inv.current_price || inv.purchase_price);
            const costBasis = Number(inv.purchase_price) * Number(inv.quantity);
            const currentValue = currentPrice * Number(inv.quantity);
            const profit = currentValue - costBasis;
            const profitPct = costBasis > 0 ? (profit / costBasis) * 100 : 0;
            const isUp = profit >= 0;

            return (
              <div key={inv.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{inv.ticker_symbol || inv.asset_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium capitalize">{inv.asset_type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{inv.asset_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${currentPrice.toFixed(2)}</p>
                    <p className={`text-xs font-medium ${isUp ? "text-success" : "text-destructive"}`}>
                      {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{profitPct.toFixed(2)}% (${profit.toFixed(2)})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-border/50">
                  <div>
                    <p className="text-muted-foreground">Shares</p>
                    <p className="font-medium text-foreground">{Number(inv.quantity)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Cost</p>
                    <p className="font-medium text-foreground">${Number(inv.purchase_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Value</p>
                    <p className="font-medium text-foreground">${currentValue.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-2">
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => onViewChart(inv.ticker_symbol || inv.asset_name)}>
                    <BarChart3 className="h-3 w-3" /> Chart
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => onTradingPlan(inv.ticker_symbol || inv.asset_name, inv.asset_name, currentPrice)}>
                    <FileText className="h-3 w-3" /> Plan
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => handleEdit(inv)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-destructive hover:text-destructive" onClick={() => handleDelete(inv.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
