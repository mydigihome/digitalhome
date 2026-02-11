import { useState } from "react";
import { TrendingUp, Target, DollarSign, Check, X, Upload, Plus, FileText, ChevronRight } from "lucide-react";
import ApplicationsTracker from "@/components/ApplicationsTracker";
import { motion } from "framer-motion";
import AppShell from "@/components/AppShell";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type Character = "buddie" | "innie" | "goalie";
type FinanceTab = "wealth" | "applications";

interface MonthStatus {
  month: string;
  status: "on-track" | "off-track";
}

interface Investment {
  id: string;
  name: string;
  broker: "webull" | "vanguard" | "schwab" | "fidelity" | "robinhood";
  targetDate: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}

interface Goal {
  id: string;
  name: string;
  why: string;
  dueDate: string;
  moneyGoal: number;
  promise: string;
  signature: string;
  signatureDate: string;
  checkIns: { day: number; completed: boolean }[];
}

const brokerStyles: Record<string, string> = {
  webull: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  vanguard: "bg-destructive/10 text-destructive border-destructive/30",
  schwab: "bg-primary/10 text-primary border-primary/30",
  fidelity: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  robinhood: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
};


export default function FinancePage() {
  const [financeTab, setFinanceTab] = useState<FinanceTab>("wealth");
  const [activeCharacter, setActiveCharacter] = useState<Character>("buddie");
  const [savingsGoal, setSavingsGoal] = useState(500);
  const [currentSavings, setCurrentSavings] = useState(0);

  const [monthlyStreak] = useState<MonthStatus[]>([
    { month: "Jan", status: "on-track" },
    { month: "Feb", status: "on-track" },
    { month: "Mar", status: "off-track" },
    { month: "Apr", status: "on-track" },
    { month: "May", status: "off-track" },
    { month: "Jun", status: "on-track" },
    { month: "Jul", status: "on-track" },
    { month: "Aug", status: "on-track" },
    { month: "Sep", status: "off-track" },
    { month: "Oct", status: "on-track" },
    { month: "Nov", status: "on-track" },
    { month: "Dec", status: "on-track" },
  ]);

  const [investments] = useState<Investment[]>([
    { id: "1", name: "Apple Inc.", broker: "robinhood", targetDate: "2027-01-01", quantity: 10, purchasePrice: 150, currentPrice: 175 },
    { id: "2", name: "Tesla", broker: "webull", targetDate: "2026-12-31", quantity: 5, purchasePrice: 200, currentPrice: 245 },
  ]);

  const [goals] = useState<Goal[]>([
    {
      id: "1",
      name: "Buy My First Home",
      why: "Create stability for my family and build wealth",
      dueDate: "2027-06-01",
      moneyGoal: 50000,
      promise: "I will save $1000 every month no matter what",
      signature: "John Doe",
      signatureDate: "2026-02-10",
      checkIns: [
        { day: 30, completed: true },
        { day: 60, completed: true },
        { day: 90, completed: false },
      ],
    },
  ]);


  const [showInvestmentForm, setShowInvestmentForm] = useState(false);

  const calculateProfit = (inv: Investment) =>
    ((inv.currentPrice - inv.purchasePrice) * inv.quantity).toFixed(2);
  const calculateProfitPercent = (inv: Investment) =>
    (((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100).toFixed(2);

  const savingsProgress = savingsGoal > 0 ? Math.min((currentSavings / savingsGoal) * 100, 100) : 0;

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Finance</h1>
          <p className="mt-1 text-muted-foreground">Manage your wealth, investments, and applications</p>
        </div>

        {/* Finance Tabs */}
        <div className="mb-6 flex items-center gap-1 rounded-lg border border-border bg-card p-1 w-fit">
          <button
            onClick={() => setFinanceTab("wealth")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
              financeTab === "wealth" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Wealth Tracker
          </button>
          <button
            onClick={() => setFinanceTab("applications")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
              financeTab === "applications" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-4 w-4" />
            Applications Tracker
          </button>
        </div>

        {/* Wealth Tracker */}
        {financeTab === "wealth" && (
          <div className="space-y-6">
            {/* Character Tabs */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-center gap-4">
                <div className="relative cursor-pointer transition hover:scale-110">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-primary shadow-lg">
                    <span className="text-2xl">🎩</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Buddie
                  </div>
                </div>
                <div className="relative cursor-pointer transition hover:scale-110">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-purple-500 px-2 py-0.5 text-xs font-medium text-white">
                    Innie
                  </div>
                </div>
                <div className="relative cursor-pointer transition hover:scale-110">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                    <span className="text-2xl">🥅</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                    Goalie
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setActiveCharacter("buddie")}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                    activeCharacter === "buddie"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  💼 Buddie - Budget
                </button>
                <button
                  onClick={() => setActiveCharacter("innie")}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                    activeCharacter === "innie"
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  📈 Innie - Investments
                </button>
                <button
                  onClick={() => setActiveCharacter("goalie")}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                    activeCharacter === "goalie"
                      ? "bg-green-500 text-white shadow-lg"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  🎯 Goalie - Goals
                </button>
              </div>
            </div>

            {/* Buddie - Budget Tracker */}
            {activeCharacter === "buddie" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                      <span className="text-2xl">🎩</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">30-Day Savings Habit</h2>
                      <p className="text-muted-foreground">Build consistency, one month at a time</p>
                    </div>
                  </div>

                  {/* Goal Setting */}
                  <div className="mb-6 rounded-xl bg-primary/5 p-6">
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      My goal to save this month:
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-1 items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <input
                          type="number"
                          value={savingsGoal}
                          onChange={(e) => setSavingsGoal(Number(e.target.value))}
                          className="flex-1 rounded-lg border-2 border-primary/30 bg-background px-4 py-3 text-lg font-semibold text-foreground"
                        />
                      </div>
                      <button className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90">
                        Set Goal
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Progress</span>
                        <span className="text-sm font-semibold text-primary">
                          ${currentSavings} / ${savingsGoal}
                        </span>
                      </div>
                      <Progress value={savingsProgress} className="h-3" />
                    </div>
                  </div>

                  {/* Upload Expenses */}
                  <div className="mb-6 cursor-pointer rounded-xl border-2 border-dashed border-border p-8 transition hover:border-primary">
                    <div className="text-center">
                      <Upload className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                      <p className="mb-1 font-medium text-foreground">Upload Your Expense Tracker</p>
                      <p className="text-sm text-muted-foreground">After 30 days, upload to see if you're on track</p>
                      <button className="mt-4 rounded-lg bg-primary px-6 py-2 text-primary-foreground transition hover:bg-primary/90">
                        Choose File
                      </button>
                    </div>
                  </div>

                  {/* On Track Card */}
                  <div className="relative overflow-hidden rounded-xl border-2 border-green-300 bg-green-50 p-6 dark:border-green-700 dark:bg-green-900/20">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-bold text-green-900 dark:text-green-200">🎉 On Track!</h3>
                        <p className="text-green-700 dark:text-green-300">
                          Amazing work! You saved ${savingsGoal} this month. Keep up the great habits!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streak Report Card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-bold text-foreground">📊 Yearly Streak Report Card</h3>
                  <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 p-6 dark:border-yellow-600 dark:bg-yellow-900/20">
                    <div className="grid grid-cols-6 gap-3 md:grid-cols-12">
                      {monthlyStreak.map((month, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "rounded-lg border-2 p-3 text-center",
                            month.status === "on-track"
                              ? "border-green-400 bg-green-100 dark:border-green-600 dark:bg-green-900/30"
                              : "border-destructive/40 bg-destructive/10"
                          )}
                        >
                          <div className="text-sm font-bold text-foreground">{month.month}</div>
                          <div className="mt-1 text-xl">{month.status === "on-track" ? "🔥" : "❌"}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-8">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-green-400" />
                        <span className="text-sm font-medium text-foreground">On Track</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-destructive" />
                        <span className="text-sm font-medium text-foreground">Off Track</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Innie - Investments */}
            {activeCharacter === "innie" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Investment Portfolio</h2>
                        <p className="text-muted-foreground">Track your investments across all brokers</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInvestmentForm(true)}
                      className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-white transition hover:bg-purple-600"
                    >
                      <Plus className="h-5 w-5" />
                      Add Investment
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-secondary">
                          <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-foreground">Investment</th>
                          <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-foreground">Broker</th>
                          <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-foreground">Qty</th>
                          <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-foreground">Purchase</th>
                          <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-foreground">Current</th>
                          <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-foreground">P/L</th>
                          <th className="border border-border px-4 py-3 text-left text-sm font-semibold text-foreground">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investments.map((inv) => {
                          const profit = Number(calculateProfit(inv));
                          const profitPercent = Number(calculateProfitPercent(inv));
                          return (
                            <tr key={inv.id} className="transition hover:bg-secondary/50">
                              <td className="border border-border px-4 py-3 font-medium text-foreground">{inv.name}</td>
                              <td className="border border-border px-4 py-3">
                                <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", brokerStyles[inv.broker])}>
                                  {inv.broker.charAt(0).toUpperCase() + inv.broker.slice(1)}
                                </span>
                              </td>
                              <td className="border border-border px-4 py-3 text-foreground">{inv.quantity}</td>
                              <td className="border border-border px-4 py-3 text-foreground">${inv.purchasePrice.toFixed(2)}</td>
                              <td className="border border-border px-4 py-3 text-foreground">${inv.currentPrice.toFixed(2)}</td>
                              <td className={cn("border border-border px-4 py-3 font-semibold", profit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                                ${profit} ({profitPercent}%)
                              </td>
                              <td className="border border-border px-4 py-3 text-muted-foreground">{inv.targetDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Goalie - Goals */}
            {activeCharacter === "goalie" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                        <span className="text-2xl">🥅</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Goal Dashboard</h2>
                        <p className="text-muted-foreground">Visualize and track your financial goals</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white transition hover:bg-green-600">
                      <Plus className="h-5 w-5" />
                      New Goal
                    </button>
                  </div>

                  {goals.map((goal) => (
                    <div key={goal.id} className="mb-6 rounded-xl border-2 border-border p-6">
                      <div className="mb-6 flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{goal.name}</h3>
                          <p className="mt-1 text-muted-foreground">{goal.why}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">${goal.moneyGoal.toLocaleString()}</div>
                          <p className="text-sm text-muted-foreground">Target Amount</p>
                        </div>
                      </div>

                      {/* Check-ins */}
                      <div className="mb-6 rounded-xl bg-green-50 p-6 dark:bg-green-900/20">
                        <h4 className="mb-4 font-semibold text-foreground">📍 Progress Check-ins</h4>
                        <div className="flex items-center gap-4">
                          {goal.checkIns.map((checkIn, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "flex-1 rounded-lg border-2 p-4 text-center",
                                checkIn.completed
                                  ? "border-green-400 bg-green-100 dark:border-green-600 dark:bg-green-900/30"
                                  : "border-border bg-secondary"
                              )}
                            >
                              <div className="mb-2 text-3xl">{checkIn.completed ? "✅" : "⭕"}</div>
                              <div className="font-bold text-foreground">{checkIn.day} Days</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Promise Card */}
                      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
                        <h4 className="mb-3 font-semibold text-foreground">My Promise</h4>
                        <p className="mb-4 italic text-muted-foreground">"{goal.promise}"</p>
                        <div className="flex items-center justify-between border-t border-primary/20 pt-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Signature</p>
                            <p className="font-semibold text-foreground">{goal.signature}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-semibold text-foreground">{goal.signatureDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vision Board */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-bold text-foreground">🎨 Vision Board</h3>
                  <div className="mb-4 grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary transition hover:border-green-500"
                      >
                        <Plus className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    ))}
                  </div>
                  <button className="w-full rounded-lg bg-green-500 px-4 py-3 font-medium text-white transition hover:bg-green-600">
                    Upload Images or Connect Pinterest
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Applications Tracker */}
        {financeTab === "applications" && <ApplicationsTracker />}

        {/* Investment Form Modal */}
        {showInvestmentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
              <h3 className="mb-4 text-2xl font-bold text-foreground">Add Investment</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Investment Name" className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground" />
                <select className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground">
                  <option>Select Broker</option>
                  <option>Webull</option>
                  <option>Vanguard</option>
                  <option>Charles Schwab</option>
                  <option>Fidelity</option>
                  <option>Robinhood</option>
                </select>
                <input type="number" placeholder="Quantity" className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground" />
                <input type="number" placeholder="Purchase Price" className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground" />
                <input type="date" className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground" />
                <div className="flex gap-3">
                  <button onClick={() => setShowInvestmentForm(false)} className="flex-1 rounded-lg border border-border px-4 py-2 text-foreground">
                    Cancel
                  </button>
                  <button className="flex-1 rounded-lg bg-purple-500 px-4 py-2 text-white">Add</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
