import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";

const categories = [
  { name: "Housing", emoji: "", spent: 1200, budget: 1500, color: "#6366f1" },
  { name: "Food", emoji: "🍔", spent: 450, budget: 600, color: "#6cf8bb" },
  { name: "Transport", emoji: "🚗", spent: 320, budget: 400, color: "#6366f1" },
  { name: "Entertainment", emoji: "🎬", spent: 280, budget: 300, color: "#f59e0b" },
  { name: "Subscriptions", emoji: "", spent: 89, budget: 100, color: "#6cf8bb" },
  { name: "Other", emoji: "", spent: 861, budget: 1000, color: "#767586" },
];

const outerData = [{ name: "Essentials", value: 66 }, { name: "Rest", value: 34 }];
const innerData = [{ name: "Discretionary", value: 34 }, { name: "Rest", value: 66 }];

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function SpendingFront() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Spending Allocation</h3>
        <span className="material-symbols-outlined text-base" style={{ color: "#767586" }}>pie_chart</span>
      </div>
      <div className="flex justify-center">
        <div className="relative" style={{ width: 180, height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={outerData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" startAngle={90} endAngle={-270}>
                <Cell fill="#6366f1" /><Cell fill="#e8e8ed" />
              </Pie>
              <Pie data={innerData} cx="50%" cy="50%" innerRadius={35} outerRadius={52} dataKey="value" startAngle={90} endAngle={-270}>
                <Cell fill="#6cf8bb" /><Cell fill="#e8e8ed" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>TOTAL OUT</span>
            <span className="text-xl font-black" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>$3,200</span>
          </div>
        </div>
      </div>
      <div className="space-y-2 mt-3">
        {categories.map((c) => {
          const pct = Math.round((c.spent / c.budget) * 100);
          return (
            <div key={c.name}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#1a1c1f" }}>{c.emoji} {c.name}</span>
                <span className="text-[10px]" style={{ color: "#767586" }}>{fmt(c.spent)} / {fmt(c.budget)}</span>
              </div>
              <div className="h-1.5 rounded-full mt-1" style={{ background: "#e8e8ed" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: c.color }} />
              </div>
            </div>
          );
        })}
      </div>
      {/* Alert */}
      <div className="mt-3 p-3 rounded-r-xl text-xs" style={{ background: "#FFFBEB", borderLeft: "4px solid #F59E0B", color: "#92400E" }}>
        ⚠ Entertainment is at 93% of budget. Consider reducing to hit savings goal.
      </div>
    </div>
  );
}

export function SpendingBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Spending</h3>
      {categories.map((c) => (
        <div key={c.name} className="grid grid-cols-2 gap-2">
          <div><EditLabel>{c.emoji} {c.name} Spent</EditLabel><EditInput value={String(c.spent)} onChange={() => {}} type="number" /></div>
          <div><EditLabel>{c.name} Budget</EditLabel><EditInput value={String(c.budget)} onChange={() => {}} type="number" /></div>
        </div>
      ))}
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
