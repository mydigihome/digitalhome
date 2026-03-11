import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TrendingUp, ExternalLink, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.3)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 24,
};

interface Allocation {
  id: string;
  company_name: string;
  is_private_company: boolean;
  investment_type: string;
  investment_platform: string | null;
  platform_url: string | null;
  frequency: string;
  amount_per_investment: number;
  next_investment_date: string;
  total_invested: number;
  investment_count: number;
  weekly_leftover: number;
}

export const InvestmentScheduleCard = () => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: schedules } = useQuery({
    queryKey: ["investment_allocations", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("investment_allocations")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("next_investment_date", { ascending: true });
      return data as Allocation[];
    },
    enabled: !!user,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={glass}
      className="p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Investment Schedule</h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          + New
        </button>
      </div>

      {!schedules || schedules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400 mb-3">Set up automatic investments</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Create Schedule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{s.company_name}</p>
                  <p className="text-[11px] text-slate-400">
                    {s.is_private_company && "🔒 Private · "}
                    {s.investment_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">${Number(s.amount_per_investment).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{s.frequency}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div>
                  <span className="text-slate-400">Next: </span>
                  <span className="font-medium text-slate-700">
                    {new Date(s.next_investment_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Invested: </span>
                  <span className="font-medium text-slate-700">{s.investment_count}x</span>
                </div>
                <div>
                  <span className="text-slate-400">Total: </span>
                  <span className="font-medium text-slate-700">${Number(s.total_invested).toLocaleString()}</span>
                </div>
              </div>
              {s.platform_url && (
                <a
                  href={s.platform_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open {s.investment_platform || "Platform"}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddInvestmentScheduleModal onClose={() => setShowAddModal(false)} />}
    </motion.div>
  );
};

const AddInvestmentScheduleModal = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weeklyLeftover, setWeeklyLeftover] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [investmentType, setInvestmentType] = useState("stocks");
  const [platform, setPlatform] = useState("");
  const [platformUrl, setPlatformUrl] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const createSchedule = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await (supabase as any)
        .from("investment_allocations")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment_allocations"] });
      toast.success("Investment schedule created!");
      onClose();
    },
    onError: () => toast.error("Failed to create schedule"),
  });

  const handleCreate = () => {
    if (!companyName || !amount || !weeklyLeftover) {
      toast.error("Fill in company name, amount, and weekly leftover");
      return;
    }
    const nextDate = new Date();
    if (frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
    if (frequency === "biweekly") nextDate.setDate(nextDate.getDate() + 14);
    if (frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);

    createSchedule.mutate({
      user_id: user!.id,
      weekly_leftover: parseFloat(weeklyLeftover),
      company_name: companyName,
      is_private_company: isPrivate,
      investment_type: investmentType,
      investment_platform: platform || null,
      platform_url: platformUrl || null,
      frequency,
      amount_per_investment: parseFloat(amount),
      next_investment_date: nextDate.toISOString().split("T")[0],
      notes: notes || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Set Up Investment Schedule</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Weekly Leftover Available</label>
            <Input type="number" value={weeklyLeftover} onChange={(e) => setWeeklyLeftover(e.target.value)} placeholder="$500" />
            <p className="text-[11px] text-slate-400 mt-1">How much you have left over each week</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Company/Fund Name</label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Tesla, StartupXYZ, Whole Life Policy..." />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-600">Private company (not publicly traded)</span>
          </label>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Investment Type</label>
            <select value={investmentType} onChange={(e) => setInvestmentType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm">
              <option value="stocks">Stocks</option>
              <option value="private_equity">Private Equity</option>
              <option value="insurance">Insurance Plan</option>
              <option value="retirement">Retirement Fund</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="real_estate">Real Estate</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$100" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Where to Invest (Optional)</label>
            <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Vanguard, Fidelity..." className="mb-2" />
            <Input value={platformUrl} onChange={(e) => setPlatformUrl(e.target.value)} placeholder="https://direct-link.com" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={createSchedule.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {createSchedule.isPending ? "Creating..." : "Create Schedule"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
