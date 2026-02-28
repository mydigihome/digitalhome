import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, Trash2, DollarSign, CreditCard, PiggyBank, TrendingUp, Sparkles, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useUpsertUserFinances } from "@/hooks/useUserFinances";
import { useCreateExpense } from "@/hooks/useExpenses";
import { useCreateLoan } from "@/hooks/useLoans";
import { useCreateInvestment } from "@/hooks/useInvestments";
import { useCreateChildInvestment } from "@/hooks/useChildInvestments";
import { getRandomQuote } from "./quotes";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const EXPENSE_CATEGORIES = ["Rent/Mortgage", "Utilities", "Subscriptions", "Insurance", "Food", "Transportation", "Other"];
const INVESTMENT_TYPES = ["Stocks", "401k", "IRA", "Real Estate", "Crypto", "Other"];
const PIE_COLORS = [
  "hsl(258, 89%, 66%)", "hsl(263, 70%, 50%)", "hsl(206, 52%, 55%)",
  "hsl(168, 80%, 27%)", "hsl(36, 100%, 57%)", "hsl(0, 65%, 55%)", "hsl(320, 60%, 50%)",
];

interface LocalExpense {
  description: string;
  amount: string;
  category: string;
  frequency: string;
  expense_date: string;
}

interface LocalLoan {
  loan_type: string;
  amount: string;
  interest_rate: string;
  monthly_payment: string;
  provider_name: string;
  provider_phone: string;
  provider_website: string;
  start_date: string;
}

interface LocalChildInv {
  child_name: string;
  investment_type: string;
  amount: string;
}

const TOTAL_PAGES = 5; // welcome + 4 form pages

export default function WealthOnboarding({ onComplete }: { onComplete: () => void }) {
  const { profile } = useAuth();
  const upsertFinances = useUpsertUserFinances();
  const createExpense = useCreateExpense();
  const createLoan = useCreateLoan();
  const createInvestment = useCreateInvestment();
  const createChildInv = useCreateChildInvestment();

  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const quote = useMemo(() => getRandomQuote(), []);

  // Page 1 - Expenses
  const [expenses, setExpenses] = useState<LocalExpense[]>([
    { description: "", amount: "", category: "Other", frequency: "monthly", expense_date: new Date().toISOString().split("T")[0] },
  ]);

  // Page 2 - Debt
  const [hasStudentLoans, setHasStudentLoans] = useState(false);
  const [loans, setLoans] = useState<LocalLoan[]>([]);
  const [totalDebt, setTotalDebt] = useState("");

  // Page 3 - Credit & Savings
  const [creditScore, setCreditScore] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");

  // Page 4 - Income & Investment
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [invests, setInvests] = useState(false);
  const [investmentTypes, setInvestmentTypes] = useState<string[]>([]);
  const [childInvestments, setChildInvestments] = useState<LocalChildInv[]>([]);

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const addExpense = () => setExpenses(prev => [...prev, { description: "", amount: "", category: "Other", frequency: "monthly", expense_date: new Date().toISOString().split("T")[0] }]);
  const removeExpense = (i: number) => setExpenses(prev => prev.filter((_, idx) => idx !== i));
  const updateExpense = (i: number, field: keyof LocalExpense, value: string) => {
    setExpenses(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const addLoan = () => setLoans(prev => [...prev, { loan_type: "student", amount: "", interest_rate: "", monthly_payment: "", provider_name: "", provider_phone: "", provider_website: "", start_date: "" }]);
  const removeLoan = (i: number) => setLoans(prev => prev.filter((_, idx) => idx !== i));
  const updateLoan = (i: number, field: keyof LocalLoan, value: string) => {
    setLoans(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const addChildInv = () => setChildInvestments(prev => [...prev, { child_name: "", investment_type: "Stocks", amount: "" }]);
  const removeChildInv = (i: number) => setChildInvestments(prev => prev.filter((_, idx) => idx !== i));

  const toggleInvestmentType = (type: string) => {
    setInvestmentTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const expenseChartData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
      const amt = parseFloat(e.amount) || 0;
      if (amt > 0) byCategory[e.category] = (byCategory[e.category] || 0) + amt;
    });
    return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const progressPercent = (page / (TOTAL_PAGES - 1)) * 100;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Save expenses
      for (const exp of expenses) {
        if (exp.description && parseFloat(exp.amount) > 0) {
          await createExpense.mutateAsync({
            description: exp.description,
            amount: parseFloat(exp.amount),
            category: exp.category,
            frequency: exp.frequency,
            expense_date: exp.expense_date,
            priority: "medium",
          });
        }
      }

      // Save loans
      for (const loan of loans) {
        if (parseFloat(loan.amount) > 0) {
          await createLoan.mutateAsync({
            loan_type: loan.loan_type,
            amount: parseFloat(loan.amount),
            interest_rate: parseFloat(loan.interest_rate) || 0,
            monthly_payment: parseFloat(loan.monthly_payment) || 0,
            provider_name: loan.provider_name || null,
            provider_phone: loan.provider_phone || null,
            provider_website: loan.provider_website || null,
            start_date: loan.start_date || null,
          });
        }
      }

      // Save child investments
      for (const ci of childInvestments) {
        if (ci.child_name && parseFloat(ci.amount) > 0) {
          await createChildInv.mutateAsync({
            child_name: ci.child_name,
            investment_type: ci.investment_type,
            amount: parseFloat(ci.amount),
          });
        }
      }

      // Save main financial profile
      await upsertFinances.mutateAsync({
        monthly_income: parseFloat(monthlyIncome) || 0,
        total_debt: parseFloat(totalDebt) || 0,
        credit_score: parseInt(creditScore) || null,
        savings_goal: parseFloat(savingsGoal) || 0,
        current_savings: parseFloat(currentSavings) || 0,
        has_student_loans: hasStudentLoans,
        invests,
        investment_types: investmentTypes,
        onboarding_completed: true,
      });

      toast.success("Your financial plan is ready!");
      onComplete();
    } catch (err: any) {
      toast.error("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const pageVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        {page > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Step 1 of 3 — Financial Intake</span>
              <span>Page {page} of {TOTAL_PAGES - 1}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            <div className="bg-card rounded-3xl border border-border shadow-lg p-8">
              {/* PAGE 0 - Welcome */}
              {page === 0 && (
                <div className="text-center space-y-6 py-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Financial Freedom Plan
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Build Your Financial Freedom Plan
                  </h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    This will take 15–30 minutes. Ready to take control of your finances, {firstName}?
                  </p>
                  <div className="bg-accent/30 rounded-2xl p-6 max-w-md mx-auto">
                    <Quote className="w-5 h-5 text-primary mb-2 mx-auto" />
                    <p className="text-sm italic text-foreground">"{quote.text}"</p>
                    <p className="text-xs text-muted-foreground mt-2">— {quote.author}</p>
                  </div>
                  <Button
                    onClick={() => setPage(1)}
                    className="bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground px-8 py-3 rounded-xl text-base font-semibold"
                  >
                    Let's Begin <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* PAGE 1 - Bills & Expenses */}
              {page === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-destructive/10">
                      <DollarSign className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Bills & Expenses</h2>
                      <p className="text-sm text-muted-foreground">What are your monthly expenses?</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                    {expenses.map((exp, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-muted/30 border border-border">
                        <div className="col-span-4">
                          <Label className="text-xs">Name</Label>
                          <Input placeholder="Netflix" value={exp.description} onChange={e => updateExpense(i, "description", e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Amount</Label>
                          <Input type="number" placeholder="15" value={exp.amount} onChange={e => updateExpense(i, "amount", e.target.value)} />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Category</Label>
                          <Select value={exp.category} onValueChange={v => updateExpense(i, "category", v)}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Freq</Label>
                          <Select value={exp.frequency} onValueChange={v => updateExpense(i, "frequency", v)}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeExpense(i)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" onClick={addExpense} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-1" /> Add Expense
                  </Button>

                  {expenseChartData.length > 0 && (
                    <div className="h-48">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Spending Breakdown</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={expenseChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                            {expenseChartData.map((_, idx) => (
                              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* PAGE 2 - Debt & Loans */}
              {page === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-warning/10">
                      <CreditCard className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Debt & Loans</h2>
                      <p className="text-sm text-muted-foreground">Let's understand your debt situation</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <Label className="text-sm font-medium">Do you have student loans?</Label>
                    <Switch checked={hasStudentLoans} onCheckedChange={v => { setHasStudentLoans(v); if (v && loans.length === 0) addLoan(); }} />
                  </div>

                  {hasStudentLoans && (
                    <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1">
                      {loans.map((loan, i) => (
                        <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-foreground">Loan {i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLoan(i)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Amount</Label>
                              <Input type="number" placeholder="25000" value={loan.amount} onChange={e => updateLoan(i, "amount", e.target.value)} />
                            </div>
                            <div>
                              <Label className="text-xs">Interest Rate %</Label>
                              <Input type="number" placeholder="5.5" value={loan.interest_rate} onChange={e => updateLoan(i, "interest_rate", e.target.value)} />
                            </div>
                            <div>
                              <Label className="text-xs">Monthly Payment</Label>
                              <Input type="number" placeholder="300" value={loan.monthly_payment} onChange={e => updateLoan(i, "monthly_payment", e.target.value)} />
                            </div>
                            <div>
                              <Label className="text-xs">Provider Name</Label>
                              <Input placeholder="Navient" value={loan.provider_name} onChange={e => updateLoan(i, "provider_name", e.target.value)} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addLoan} className="rounded-xl">
                        <Plus className="w-4 h-4 mr-1" /> Add Loan
                      </Button>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium">Total Debt (credit cards, car loans, etc.)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" placeholder="0" className="pl-7" value={totalDebt} onChange={e => setTotalDebt(e.target.value)} />
                    </div>
                  </div>

                  {(parseFloat(totalDebt) > 0 || loans.some(l => parseFloat(l.amount) > 0)) && (
                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                      <p className="text-sm font-medium text-foreground">Total Debt:</p>
                      <p className="text-2xl font-bold text-warning">
                        ${((parseFloat(totalDebt) || 0) + loans.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0)).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PAGE 3 - Credit & Savings */}
              {page === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-success/10">
                      <PiggyBank className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Credit & Savings</h2>
                      <p className="text-sm text-muted-foreground">Your credit health and savings goals</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Credit Score (300–850)</Label>
                    <Input type="number" min={300} max={850} placeholder="720" value={creditScore} onChange={e => setCreditScore(e.target.value)} className="mt-1" />
                    {creditScore && (
                      <CreditScoreGauge score={parseInt(creditScore)} />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Savings Goal This Year</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input type="number" placeholder="5000" className="pl-7" value={savingsGoal} onChange={e => setSavingsGoal(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Current Savings</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input type="number" placeholder="1000" className="pl-7" value={currentSavings} onChange={e => setCurrentSavings(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {parseFloat(savingsGoal) > 0 && parseFloat(currentSavings) >= 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">
                          {Math.min(100, Math.round((parseFloat(currentSavings) / parseFloat(savingsGoal)) * 100))}%
                        </span>
                      </div>
                      <Progress value={Math.min(100, (parseFloat(currentSavings) / parseFloat(savingsGoal)) * 100)} className="h-3" />
                    </div>
                  )}
                </div>
              )}

              {/* PAGE 4 - Income & Investment */}
              {page === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Income & Investments</h2>
                      <p className="text-sm text-muted-foreground">Your earning and investment profile</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Monthly Income (after tax)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" placeholder="4000" className="pl-7" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <Label className="text-sm font-medium">Do you invest?</Label>
                    <Switch checked={invests} onCheckedChange={setInvests} />
                  </div>

                  {invests && (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Investment Types</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {INVESTMENT_TYPES.map(type => (
                          <label key={type} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border cursor-pointer hover:bg-accent/20 transition-colors">
                            <Checkbox checked={investmentTypes.includes(type)} onCheckedChange={() => toggleInvestmentType(type)} />
                            <span className="text-sm">{type}</span>
                          </label>
                        ))}
                      </div>

                      <div className="pt-2">
                        <Label className="text-sm font-medium">Child Investments (optional)</Label>
                        <div className="space-y-3 mt-2">
                          {childInvestments.map((ci, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-muted/30 border border-border">
                              <div className="col-span-4">
                                <Input placeholder="Child name" value={ci.child_name} onChange={e => setChildInvestments(prev => prev.map((c, idx) => idx === i ? { ...c, child_name: e.target.value } : c))} />
                              </div>
                              <div className="col-span-4">
                                <Select value={ci.investment_type} onValueChange={v => setChildInvestments(prev => prev.map((c, idx) => idx === i ? { ...c, investment_type: v } : c))}>
                                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {INVESTMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-3">
                                <Input type="number" placeholder="Amount" value={ci.amount} onChange={e => setChildInvestments(prev => prev.map((c, idx) => idx === i ? { ...c, amount: e.target.value } : c))} />
                              </div>
                              <div className="col-span-1">
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeChildInv(i)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addChildInv} className="rounded-xl">
                            <Plus className="w-4 h-4 mr-1" /> Add Child Investment
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              {page > 0 && (
                <div className="flex justify-between mt-8 pt-4 border-t border-border">
                  <Button variant="ghost" onClick={() => setPage(p => p - 1)} className="rounded-xl">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  {page < TOTAL_PAGES - 1 ? (
                    <Button onClick={() => setPage(p => p + 1)} className="bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground rounded-xl">
                      Continue <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={saving} className="bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground rounded-xl px-8">
                      {saving ? "Saving…" : "Complete Setup"} <Sparkles className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
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
    <div className="flex flex-col items-center py-4">
      <svg viewBox="0 0 200 120" className="w-48">
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
        {/* Score arc */}
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
