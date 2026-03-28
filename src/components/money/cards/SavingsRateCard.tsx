import { EditLabel, EditInput, EditActions } from "../MoneyCard";

export function SavingsRateFront() {
  return (
    <div style={{ minHeight: 290 }}>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Savings Rate</h3>
        <span className="material-symbols-outlined text-lg" style={{ color: "#6366f1" }}>bolt</span>
      </div>
      <div className="text-center py-6">
        <p className="text-6xl font-extrabold tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#006c49" }}>29%</p>
        <p className="text-sm mt-1" style={{ color: "#767586" }}>of income saved this month</p>
        <div className="inline-block rounded-xl px-4 py-2 mt-3 text-xs font-bold" style={{ background: "rgba(0,108,73,0.08)", color: "#006c49" }}>
          ↑ 9% above recommendation · Efficiency: High
        </div>
      </div>
      <div className="space-y-3">
        {[
          { label: "Income", value: "$4,500", color: "#006c49" },
          { label: "Expenses", value: "$3,200", color: "#ba1a1a" },
          { label: "Saved", value: "$1,300", color: "#6366f1" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: "#f3f3f8" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="relative mt-6">
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "#e8e8ed" }}>
          <div className="h-full rounded-full" style={{ width: "29%", background: "linear-gradient(135deg, #6366f1, #818cf8)" }} />
        </div>
        <div className="absolute" style={{ left: "20%", top: -4, transform: "translateX(-50%)" }}>
          <div className="w-0.5 h-5 rounded" style={{ background: "#767586" }} />
          <span className="text-[9px] block -ml-3" style={{ color: "#767586" }}>Rec. 20%</span>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-xs font-bold" style={{ color: "#464554" }}>At this rate → $15,600 saved by Dec 2024</p>
        <p className="text-xs font-bold" style={{ color: "#6366f1" }}>Projected year-end net worth: $48,900</p>
      </div>
    </div>
  );
}

export function SavingsRateBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Savings Rate</h3>
      <div><EditLabel>Monthly Income</EditLabel><EditInput value="4500" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Monthly Expenses</EditLabel><EditInput value="3200" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Savings Amount</EditLabel><EditInput value="1300" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Recommended Rate %</EditLabel><EditInput value="20" onChange={() => {}} type="number" /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
