import { EditLabel, EditInput, EditActions } from "../MoneyCard";

function SegmentBar({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div className="flex gap-1 h-3">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`flex-1 ${i === 0 ? "rounded-l-full" : ""} ${i === total - 1 ? "rounded-r-full" : ""}`}
          style={{ background: i < filled ? color : "#e8e8ed" }}
        />
      ))}
    </div>
  );
}

export function EmergencyFundFront() {
  return (
    <div style={{ minHeight: 260 }}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Liquidity Sprints</h3>
        <span className="material-symbols-outlined text-lg" style={{ color: "#4648d4" }}>bolt</span>
      </div>

      {/* Emergency Fund */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm" style={{ color: "#1a1c1f" }}>Emergency Fund</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: "#767586" }}>Target: $13,500</span>
            <span className="font-bold text-sm" style={{ color: "#1a1c1f" }}>59%</span>
          </div>
        </div>
        <p className="text-3xl font-extrabold tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>$8,000</p>
        <p className="text-xs mb-3" style={{ color: "#767586" }}>3 months of expenses covered</p>
        <SegmentBar filled={3} total={5} color="#4648d4" />
        <p className="text-xs font-bold mt-2" style={{ color: "#006c49" }}>Fully funded in 11 months at $500/month</p>
        <p className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: "#4648d4" }}>Completion: Nov 2024</p>
      </div>

      <div className="mt-6 h-px" style={{ background: "#f3f3f8" }} />

      {/* Tax Vault */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm" style={{ color: "#1a1c1f" }}>Q4 Tax Vault</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: "#767586" }}>Target: $22,000</span>
            <span className="font-bold text-sm" style={{ color: "#1a1c1f" }}>45%</span>
          </div>
        </div>
        <p className="text-3xl font-extrabold tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>$9,900</p>
        <SegmentBar filled={2} total={5} color="#6cf8bb" />
        <p className="text-[9px] font-bold uppercase mt-2" style={{ color: "#006c49" }}>Active Sprint</p>
      </div>

      <div className="rounded-[20px] p-4 mt-6" style={{ background: "rgba(70,72,212,0.05)", border: "1px solid rgba(70,72,212,0.1)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "#464554" }}>
          <span className="font-bold" style={{ color: "#4648d4" }}>✦</span> Increase monthly transfer by $400 to hit tax goal 12 days early.
        </p>
      </div>
    </div>
  );
}

export function EmergencyFundBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Funds</h3>
      <div><EditLabel>Emergency Fund Current</EditLabel><EditInput value="8000" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Emergency Fund Target</EditLabel><EditInput value="13500" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Monthly Contribution</EditLabel><EditInput value="500" onChange={() => {}} type="number" /></div>
      <div className="h-px" style={{ background: "#f3f3f8" }} />
      <div><EditLabel>Tax Vault Current</EditLabel><EditInput value="9900" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Tax Vault Target</EditLabel><EditInput value="22000" onChange={() => {}} type="number" /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
