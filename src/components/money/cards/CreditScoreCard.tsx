import { EditLabel, EditInput, EditActions } from "../MoneyCard";

export function CreditScoreFront() {
  const score = 785;
  const pct = score / 850;
  const r = 80;
  const circ = Math.PI * r;
  const dash = circ * pct;

  return (
    <div style={{ minHeight: 440 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Credit Matrix</h3>
        <span className="text-[10px] font-black uppercase tracking-widest rounded px-2 py-0.5" style={{ background: "rgba(108,248,187,0.4)", color: "#006c49" }}>EXCELLENT</span>
      </div>

      <div className="flex justify-center">
        <svg width="200" height="120" viewBox="0 0 200 120">
          <defs>
            <linearGradient id="creditGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4648d4" />
              <stop offset="100%" stopColor="#6cf8bb" />
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f3f3f8" strokeWidth="12" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#creditGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} />
          <text x="100" y="90" textAnchor="middle" className="text-5xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fill: "#1a1c1f", fontSize: 40 }}>785</text>
          <text x="100" y="110" textAnchor="middle" className="text-[10px] uppercase tracking-widest" style={{ fill: "#767586", fontSize: 8 }}>+12 pts this month</text>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl p-3" style={{ background: "#f3f3f8" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>Utilization</p>
          <p className="font-bold" style={{ color: "#006c49" }}>2.4%</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "#f3f3f8" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>On-time Pay</p>
          <p className="font-bold" style={{ color: "#1a1c1f" }}>100%</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#767586" }}>FACTORS HELPING</p>
        <p className="text-xs" style={{ color: "#006c49" }}>✅ Payment history: 100% on-time payments</p>
        <p className="text-xs" style={{ color: "#006c49" }}>✅ Credit age: 5 year average</p>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>QUICK WIN</p>
        <p className="text-xs font-bold" style={{ color: "#4648d4" }}>⚡ Pay $1,500 on Sapphire Reserve → Est. +20 points</p>
      </div>

      <div className="rounded-xl p-3 mt-3" style={{ background: "#f3f3f8" }}>
        <p className="text-xs" style={{ color: "#ba1a1a" }}>🔴 Recent Hard Inquiry — Car Loan · Feb 2024</p>
      </div>
    </div>
  );
}

export function CreditScoreBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Credit Score</h3>
      <div><EditLabel>Credit Score</EditLabel><EditInput value="785" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Monthly Change (pts)</EditLabel><EditInput value="12" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Utilization %</EditLabel><EditInput value="2.4" onChange={() => {}} type="number" /></div>
      <div><EditLabel>On-time %</EditLabel><EditInput value="100" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Credit Age (years)</EditLabel><EditInput value="5" onChange={() => {}} type="number" /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
