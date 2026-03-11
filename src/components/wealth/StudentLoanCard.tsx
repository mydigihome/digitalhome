import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { GraduationCap, ExternalLink, Phone, Mail, X } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.3)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 24,
};

interface StudentLoan {
  id: string;
  loan_name: string;
  total_owed: number;
  remaining_balance: number;
  interest_rate: number | null;
  monthly_payment: number | null;
  loan_servicer: string | null;
  loan_officer_name: string | null;
  loan_officer_phone: string | null;
  loan_officer_email: string | null;
  servicer_website: string | null;
  loan_type: string;
  status: string;
}

export const StudentLoanCard = () => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: loans } = useQuery({
    queryKey: ["student_loans", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("student_loans")
        .select("*")
        .eq("user_id", user!.id)
        .neq("status", "paid_off")
        .order("created_at", { ascending: false });
      return data as StudentLoan[];
    },
    enabled: !!user,
  });

  const totalOwed = loans?.reduce((sum, l) => sum + Number(l.remaining_balance), 0) || 0;
  const monthlyPayment = loans?.reduce((sum, l) => sum + Number(l.monthly_payment || 0), 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      style={glass}
      className="p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Student Loans</h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
        >
          + Add
        </button>
      </div>

      {!loans || loans.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400 mb-3">Track your student loans</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold"
          >
            Add First Loan
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
              <p className="text-[11px] text-slate-400 uppercase font-medium">Total Owed</p>
              <p className="text-lg font-bold text-slate-900">${totalOwed.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
              <p className="text-[11px] text-slate-400 uppercase font-medium">Monthly Payment</p>
              <p className="text-lg font-bold text-slate-900">${monthlyPayment.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            {loans.map((loan) => (
              <div key={loan.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{loan.loan_name}</p>
                    <p className="text-[11px] text-slate-400">{loan.loan_servicer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">${Number(loan.remaining_balance).toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400">{loan.interest_rate}% APR</p>
                  </div>
                </div>

                {loan.loan_officer_name && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-medium mb-1">Loan Officer</p>
                    <p className="text-xs font-semibold text-slate-700">{loan.loan_officer_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {loan.loan_officer_phone && (
                        <a href={`tel:${loan.loan_officer_phone}`} className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                          <Phone className="w-3 h-3" />
                          {loan.loan_officer_phone}
                        </a>
                      )}
                      {loan.loan_officer_email && (
                        <a href={`mailto:${loan.loan_officer_email}`} className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                          <Mail className="w-3 h-3" />
                          {loan.loan_officer_email}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {loan.servicer_website && (
                  <a
                    href={loan.servicer_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Manage Loan
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showAddModal && <AddStudentLoanModal onClose={() => setShowAddModal(false)} />}
    </motion.div>
  );
};

const AddStudentLoanModal = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loanName, setLoanName] = useState("");
  const [totalOwed, setTotalOwed] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [servicer, setServicer] = useState("");
  const [loanType, setLoanType] = useState("federal");
  const [officerName, setOfficerName] = useState("");
  const [officerPhone, setOfficerPhone] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");
  const [servicerWebsite, setServicerWebsite] = useState("");

  const createLoan = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await (supabase as any)
        .from("student_loans")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student_loans"] });
      toast.success("Student loan added!");
      onClose();
    },
    onError: () => toast.error("Failed to add loan"),
  });

  const handleCreate = () => {
    if (!loanName || !totalOwed) {
      toast.error("Enter loan name and total owed");
      return;
    }
    createLoan.mutate({
      user_id: user!.id,
      loan_name: loanName,
      total_owed: parseFloat(totalOwed),
      remaining_balance: parseFloat(totalOwed),
      interest_rate: interestRate ? parseFloat(interestRate) : null,
      monthly_payment: monthlyPayment ? parseFloat(monthlyPayment) : null,
      loan_servicer: servicer || null,
      loan_type: loanType,
      loan_officer_name: officerName || null,
      loan_officer_phone: officerPhone || null,
      loan_officer_email: officerEmail || null,
      servicer_website: servicerWebsite || null,
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
          <h2 className="text-lg font-bold text-slate-900">Add Student Loan</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Loan Name</label>
            <Input value={loanName} onChange={(e) => setLoanName(e.target.value)} placeholder="Federal Stafford, Sallie Mae Private..." />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Loan Type</label>
            <select value={loanType} onChange={(e) => setLoanType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm">
              <option value="federal">Federal</option>
              <option value="private">Private</option>
              <option value="parent_plus">Parent PLUS</option>
              <option value="grad_plus">Grad PLUS</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Total Owed</label>
              <Input type="number" value={totalOwed} onChange={(e) => setTotalOwed(e.target.value)} placeholder="25000" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Interest Rate (%)</label>
              <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="6.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Monthly Payment</label>
            <Input type="number" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} placeholder="250" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Loan Servicer</label>
            <Input value={servicer} onChange={(e) => setServicer(e.target.value)} placeholder="Navient, Great Lakes, Nelnet..." />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Loan Officer Contact (Optional)</p>
            <Input value={officerName} onChange={(e) => setOfficerName(e.target.value)} placeholder="Officer Name" className="mb-2" />
            <Input value={officerPhone} onChange={(e) => setOfficerPhone(e.target.value)} placeholder="(555) 123-4567" className="mb-2" />
            <Input value={officerEmail} onChange={(e) => setOfficerEmail(e.target.value)} placeholder="officer@servicer.com" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Servicer Website</label>
            <Input value={servicerWebsite} onChange={(e) => setServicerWebsite(e.target.value)} placeholder="https://www.navient.com" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={createLoan.isPending}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition"
          >
            {createLoan.isPending ? "Adding..." : "Add Loan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
