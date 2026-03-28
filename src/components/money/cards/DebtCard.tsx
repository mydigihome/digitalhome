import { EditLabel, EditInput, EditActions } from "../MoneyCard";

export function DebtFront() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Debt Architecture</h3>
        <button onClick={(e) => e.stopPropagation()} className="rounded-full px-4 py-1.5 text-xs font-bold border" style={{ borderColor: "#6366f1", color: "#6366f1" }}>Manage Liabilities</button>
      </div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-3xl font-extrabold tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>$69,300</span>
        <span className="text-sm" style={{ color: "#767586" }}>Payoff date: Aug 2029</span>
      </div>

      {/* Student Loans */}
      <div className="rounded-[16px] p-3 mb-2" style={{ background: "#f3f3f8" }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl p-2" style={{ background: "#e1e0ff" }}><span className="material-symbols-outlined text-lg" style={{ color: "#6366f1" }}>school</span></div>
          <span className="font-bold text-sm flex-1" style={{ color: "#1a1c1f" }}>Student Loans</span>
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>97% Remaining</span>
        </div>
        <p className="text-xs mb-2" style={{ color: "#767586" }}>4.5% APR · Remaining: $67,400 · Est. payoff: 74 months</p>
        <div className="h-2 rounded-full" style={{ background: "#e8e8ed" }}><div className="h-full rounded-full" style={{ width: "3%", background: "#6366f1" }} /></div>
      </div>

      {/* Credit Card */}
      <div className="rounded-[16px] p-3 mb-3" style={{ background: "#f3f3f8" }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl p-2" style={{ background: "rgba(186,26,26,0.1)" }}><span className="material-symbols-outlined text-lg" style={{ color: "#ba1a1a" }}>credit_card</span></div>
          <span className="font-bold text-sm flex-1" style={{ color: "#1a1c1f" }}>Sapphire Reserve</span>
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: "rgba(186,26,26,0.1)", color: "#ba1a1a" }}>Priority</span>
        </div>
        <p className="text-xs mb-2" style={{ color: "#767586" }}>21.9% APR · Remaining: $2,300 · Est. payoff: 4 months</p>
        <div className="h-2 rounded-full" style={{ background: "#e8e8ed" }}><div className="h-full rounded-full" style={{ width: "15%", background: "#ba1a1a" }} /></div>
        <p className="text-right mt-2"><button onClick={(e) => e.stopPropagation()} className="text-xs font-bold" style={{ color: "#ba1a1a" }}>Pay Off Now →</button></p>
      </div>

      {/* Insight */}
      <div className="rounded-[20px] p-4" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "#464554" }}>
          <span className="font-bold" style={{ color: "#6366f1" }}>✦</span> Pay $100 extra/month on student loans → Save $12,400 in interest and be debt-free 1.2 years early.
        </p>
      </div>
    </div>
  );
}

export function DebtBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Debt</h3>
      <div><EditLabel>Student Loan Balance</EditLabel><EditInput value="67400" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Student Loan APR %</EditLabel><EditInput value="4.5" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Credit Card Balance</EditLabel><EditInput value="2300" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Credit Card APR %</EditLabel><EditInput value="21.9" onChange={() => {}} type="number" /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
