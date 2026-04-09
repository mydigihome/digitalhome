import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUpsertUserFinances } from "@/hooks/useUserFinances";
import { useAddBill } from "@/hooks/useBills";
import { useAddDebt } from "@/hooks/useDebts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const TOTAL_STEPS = 7;

const BILL_SUGGESTIONS = ["Rent", "Car Payment", "Internet", "Phone", "Insurance", "Subscriptions", "Utilities"];

const DEBT_TYPES = [
  { id: "student_loan", label: "Student Loans" },
  { id: "auto_loan", label: "Auto Loan" },
  { id: "credit_card", label: "Credit Card" },
  { id: "other", label: "Other Loan" },
  { id: "none", label: "No debt" },
];

interface IncomeSource {
  name: string;
  amount: string;
}

interface BillRow {
  name: string;
  amount: string;
  dueDay: string;
}

interface DebtRow {
  type: string;
  balance: string;
  interestRate: string;
  monthlyPayment: string;
  lender: string;
}

export default function WealthOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const upsertFinances = useUpsertUserFinances();
  const addBill = useAddBill();
  const addDebt = useAddDebt();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Income
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [hasMultipleSources, setHasMultipleSources] = useState(false);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([{ name: "Salary", amount: "" }]);

  // Step 2 — Bills
  const [bills, setBills] = useState<BillRow[]>([]);

  // Step 3 — Debt
  const [selectedDebtTypes, setSelectedDebtTypes] = useState<string[]>([]);
  const [debts, setDebts] = useState<DebtRow[]>([]);

  // Step 4 — Savings
  const [emergencyFund, setEmergencyFund] = useState("");
  const [generalSavings, setGeneralSavings] = useState("");
  const [investmentsSavings, setInvestmentsSavings] = useState("");

  // Step 5 — Credit Score
  const [creditScore, setCreditScore] = useState("");
  const [skipCredit, setSkipCredit] = useState(false);

  // Step 6 — Savings Goal
  const [savingsGoal, setSavingsGoal] = useState("");

  const totalIncome = hasMultipleSources
    ? incomeSources.reduce((s, src) => s + (parseFloat(src.amount) || 0), 0)
    : parseFloat(monthlyIncome) || 0;

  const totalBills = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const totalDebtBalance = debts.reduce((s, d) => s + (parseFloat(d.balance) || 0), 0);
  const totalSavings = (parseFloat(emergencyFund) || 0) + (parseFloat(generalSavings) || 0) + (parseFloat(investmentsSavings) || 0);

  const canContinue = () => {
    switch (step) {
      case 1: return hasMultipleSources ? incomeSources.some(s => parseFloat(s.amount) > 0) : parseFloat(monthlyIncome) > 0;
      case 2: return true; // bills are optional
      case 3: return selectedDebtTypes.length > 0;
      case 4: return true; // savings optional
      case 5: return true; // can skip
      case 6: return true; // optional
      default: return true;
    }
  };

  const toggleDebtType = (id: string) => {
    if (id === "none") {
      setSelectedDebtTypes(["none"]);
      setDebts([]);
      return;
    }
    setSelectedDebtTypes(prev => {
      const filtered = prev.filter(t => t !== "none");
      const next = filtered.includes(id) ? filtered.filter(t => t !== id) : [...filtered, id];
      // Sync debt rows
      const newDebts = next.map(type => {
        const existing = debts.find(d => d.type === type);
        return existing || { type, balance: "", interestRate: "", monthlyPayment: "", lender: "" };
      });
      setDebts(newDebts);
      return next;
    });
  };

  const addBillRow = (name = "") => {
    setBills(prev => [...prev, { name, amount: "", dueDay: "" }]);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Save bills to bills table
      for (const bill of bills) {
        if (bill.name && parseFloat(bill.amount) > 0) {
          const day = parseInt(bill.dueDay) || 1;
          const now = new Date();
          const dueDate = new Date(now.getFullYear(), now.getMonth(), day);
          if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

          await addBill.mutateAsync({
            merchant: bill.name,
            amount: parseFloat(bill.amount),
            due_date: dueDate.toISOString().split("T")[0],
            frequency: "monthly",
            category: null,
            status: "upcoming",
          });
        }
      }

      // Save debts
      for (const debt of debts) {
        if (parseFloat(debt.balance) > 0) {
          await addDebt.mutateAsync({
            creditor: debt.lender || debt.type,
            type: debt.type,
            balance: parseFloat(debt.balance),
            interest_rate: parseFloat(debt.interestRate) || 0,
            monthly_payment: parseFloat(debt.monthlyPayment) || 0,
            due_date: null,
            status: "current",
            notes: null,
            payment_url: null,
          });
        }
      }

      // Save user_finances
      await upsertFinances.mutateAsync({
        monthly_income: totalIncome,
        total_debt: totalDebtBalance,
        credit_score: skipCredit ? null : (parseInt(creditScore) || null),
        savings_goal: parseFloat(savingsGoal) || 0,
        current_savings: totalSavings,
        has_student_loans: selectedDebtTypes.includes("student_loan"),
        invests: parseFloat(investmentsSavings) > 0,
        investment_types: [],
        onboarding_completed: true,
      });

      // Invalidate all money-related queries
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["user_finances"] });

      toast.success("Your financial plan is ready!");
      onComplete();
    } catch (err: any) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  const inputClass = "w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";
  const currencyInputClass = "w-full h-11 pl-7 pr-3 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-[520px] bg-card rounded-xl shadow-2xl border border-border overflow-hidden"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Progress bar */}
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-6" style={{ minHeight: 320 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1 — Income */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">What's your monthly take-home income?</h2>
                    <p className="text-sm text-muted-foreground mt-1">After taxes, what hits your account each month?</p>
                  </div>

                  {!hasMultipleSources && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <input
                        type="number"
                        placeholder="4,000"
                        className={currencyInputClass}
                        value={monthlyIncome}
                        onChange={e => setMonthlyIncome(e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setHasMultipleSources(!hasMultipleSources)}
                      className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${hasMultipleSources ? "bg-primary" : "bg-muted"}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${hasMultipleSources ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-sm text-foreground">I have multiple income sources</span>
                  </label>

                  {hasMultipleSources && (
                    <div className="space-y-3">
                      {incomeSources.map((src, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            placeholder="Source name"
                            className={inputClass}
                            style={{ flex: 1 }}
                            value={src.name}
                            onChange={e => {
                              const next = [...incomeSources];
                              next[i] = { ...next[i], name: e.target.value };
                              setIncomeSources(next);
                            }}
                          />
                          <div className="relative" style={{ flex: 1 }}>
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <input
                              type="number"
                              placeholder="Amount"
                              className={currencyInputClass}
                              value={src.amount}
                              onChange={e => {
                                const next = [...incomeSources];
                                next[i] = { ...next[i], amount: e.target.value };
                                setIncomeSources(next);
                              }}
                            />
                          </div>
                          {incomeSources.length > 1 && (
                            <button
                              onClick={() => setIncomeSources(prev => prev.filter((_, idx) => idx !== i))}
                              className="w-9 h-9 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition bg-transparent border-none cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => setIncomeSources(prev => [...prev, { name: "", amount: "" }])}
                        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline bg-transparent border-none cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add source
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 — Monthly Bills */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">What are your recurring monthly bills?</h2>
                    <p className="text-sm text-muted-foreground mt-1">Add each bill you pay every month</p>
                  </div>

                  {/* Suggestion pills */}
                  <div className="flex flex-wrap gap-2">
                    {BILL_SUGGESTIONS.filter(s => !bills.some(b => b.name === s)).map(s => (
                      <button
                        key={s}
                        onClick={() => addBillRow(s)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-foreground hover:bg-primary/10 hover:border-primary/30 transition bg-transparent cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>

                  {/* Bill rows */}
                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {bills.map((bill, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          placeholder="Bill name"
                          className={inputClass}
                          style={{ flex: 2 }}
                          value={bill.name}
                          onChange={e => {
                            const next = [...bills];
                            next[i] = { ...next[i], name: e.target.value };
                            setBills(next);
                          }}
                        />
                        <div className="relative" style={{ flex: 1 }}>
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                          <input
                            type="number"
                            placeholder="Amount"
                            className={currencyInputClass}
                            value={bill.amount}
                            onChange={e => {
                              const next = [...bills];
                              next[i] = { ...next[i], amount: e.target.value };
                              setBills(next);
                            }}
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="Day"
                          min={1}
                          max={31}
                          className={inputClass}
                          style={{ width: 64, flex: "none" }}
                          value={bill.dueDay}
                          onChange={e => {
                            const next = [...bills];
                            next[i] = { ...next[i], dueDay: e.target.value };
                            setBills(next);
                          }}
                        />
                        <button
                          onClick={() => setBills(prev => prev.filter((_, idx) => idx !== i))}
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition bg-transparent border-none cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addBillRow()}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline bg-transparent border-none cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add bill
                  </button>
                </div>
              )}

              {/* STEP 3 — Debt */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Do you carry any debt?</h2>
                    <p className="text-sm text-muted-foreground mt-1">Include loans, credit cards, anything with a balance</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DEBT_TYPES.map(dt => {
                      const isSelected = selectedDebtTypes.includes(dt.id);
                      return (
                        <button
                          key={dt.id}
                          onClick={() => toggleDebtType(dt.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-transparent border-border text-foreground hover:border-primary/30"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                          {dt.label}
                        </button>
                      );
                    })}
                  </div>

                  {debts.length > 0 && (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto">
                      {debts.map((debt, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {DEBT_TYPES.find(d => d.id === debt.type)?.label}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <input type="number" placeholder="Balance" className={currencyInputClass}
                                value={debt.balance}
                                onChange={e => { const n = [...debts]; n[i] = { ...n[i], balance: e.target.value }; setDebts(n); }}
                              />
                            </div>
                            <input type="number" placeholder="Interest %" className={inputClass}
                              value={debt.interestRate}
                              onChange={e => { const n = [...debts]; n[i] = { ...n[i], interestRate: e.target.value }; setDebts(n); }}
                            />
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <input type="number" placeholder="Monthly payment" className={currencyInputClass}
                                value={debt.monthlyPayment}
                                onChange={e => { const n = [...debts]; n[i] = { ...n[i], monthlyPayment: e.target.value }; setDebts(n); }}
                              />
                            </div>
                            <input placeholder="Lender name" className={inputClass}
                              value={debt.lender}
                              onChange={e => { const n = [...debts]; n[i] = { ...n[i], lender: e.target.value }; setDebts(n); }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4 — Savings */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">How much do you currently have saved?</h2>
                    <p className="text-sm text-muted-foreground mt-1">Approximate is fine</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Emergency fund</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input type="number" placeholder="0" className={currencyInputClass}
                          value={emergencyFund} onChange={e => setEmergencyFund(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">General savings</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input type="number" placeholder="0" className={currencyInputClass}
                          value={generalSavings} onChange={e => setGeneralSavings(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Investments / retirement</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input type="number" placeholder="0" className={currencyInputClass}
                          value={investmentsSavings} onChange={e => setInvestmentsSavings(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5 — Credit Score */}
              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">What's your current credit score?</h2>
                    <p className="text-sm text-muted-foreground mt-1">You can find this in your bank app or Credit Karma</p>
                  </div>

                  {!skipCredit && (
                    <input
                      type="number"
                      min={300}
                      max={850}
                      placeholder="e.g. 720"
                      className={inputClass}
                      value={creditScore}
                      onChange={e => setCreditScore(e.target.value)}
                      autoFocus
                    />
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => { setSkipCredit(!skipCredit); if (!skipCredit) setCreditScore(""); }}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition ${
                        skipCredit ? "bg-primary border-primary" : "border-border bg-transparent"
                      }`}
                    >
                      {skipCredit && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm text-muted-foreground">I don't know my score</span>
                  </label>

                  {creditScore && !skipCredit && parseInt(creditScore) >= 300 && parseInt(creditScore) <= 850 && (
                    <CreditScoreGauge score={parseInt(creditScore)} />
                  )}
                </div>
              )}

              {/* STEP 6 — Savings Goal */}
              {step === 6 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">What's your savings goal for this year?</h2>
                    <p className="text-sm text-muted-foreground mt-1">How much do you want to save total by December?</p>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      type="number"
                      placeholder="10,000"
                      className={currencyInputClass}
                      value={savingsGoal}
                      onChange={e => setSavingsGoal(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* STEP 7 — Summary */}
              {step === 7 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Your financial plan is ready</h2>
                    <p className="text-sm text-muted-foreground mt-1">Here's a summary of everything you entered</p>
                  </div>

                  <div className="rounded-lg border border-border divide-y divide-border">
                    <SummaryRow label="Monthly income" value={`$${totalIncome.toLocaleString()}`} />
                    <SummaryRow label="Total bills" value={`$${totalBills.toLocaleString()}/mo`} />
                    <SummaryRow label="Total debt" value={totalDebtBalance > 0 ? `$${totalDebtBalance.toLocaleString()}` : "None"} />
                    <SummaryRow label="Current savings" value={`$${totalSavings.toLocaleString()}`} />
                    <SummaryRow label="Credit score" value={skipCredit || !creditScore ? "Not provided" : creditScore} />
                    <SummaryRow label="Savings goal" value={savingsGoal ? `$${parseFloat(savingsGoal).toLocaleString()}` : "Not set"} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer — Back / Continue */}
        <div className="px-6 pb-5 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 h-11 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition bg-transparent border border-border cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canContinue()}
              className={`flex items-center gap-1.5 px-6 h-11 rounded-lg text-sm font-semibold transition cursor-pointer border-none ${
                canContinue()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 h-11 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition cursor-pointer border-none"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Building plan...
                </>
              ) : (
                <>Build my financial plan <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Summary Row ── */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

/* ── Credit Score Gauge ── */
function CreditScoreGauge({ score }: { score: number }) {
  const clampedScore = Math.max(300, Math.min(850, score));
  const percentage = ((clampedScore - 300) / 550) * 100;
  const angle = (percentage / 100) * 180;
  const color = clampedScore >= 670 ? "hsl(var(--success))" : clampedScore >= 580 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const label = clampedScore >= 670 ? "Good" : clampedScore >= 580 ? "Fair" : "Poor";

  return (
    <div className="flex flex-col items-center py-2">
      <svg viewBox="0 0 200 120" className="w-40">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 251.3} 251.3`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="100" y="85" textAnchor="middle" className="fill-foreground text-2xl font-bold" fontSize="28">{clampedScore}</text>
        <text x="100" y="105" textAnchor="middle" fontSize="12" fill={color} fontWeight="600">{label}</text>
      </svg>
    </div>
  );
}
