import { useState, useMemo } from "react";
import { ShieldCheck, Pencil } from "lucide-react";
import { useMoneyPreferences } from "@/hooks/useMoneyPreferences";

const BANDS = [
  { label: "Poor", range: "300–579", color: "#EF4444" },
  { label: "Fair", range: "580–669", color: "#F97316" },
  { label: "Good", range: "670–739", color: "#EAB308" },
  { label: "Very Good", range: "740–799", color: "#84CC16" },
  { label: "Exceptional", range: "800–850", color: "#10B981" },
];

function getRating(score: number) {
  if (score < 580) return { label: "Poor", color: "#EF4444" };
  if (score < 670) return { label: "Fair", color: "#F97316" };
  if (score < 740) return { label: "Good", color: "#EAB308" };
  if (score < 800) return { label: "Very Good", color: "#84CC16" };
  return { label: "Exceptional", color: "#10B981" };
}

export default function CreditScoreGaugeCard() {
  const { cardData, saveCardData } = useMoneyPreferences();
  const creditData = (cardData as any)?.credit || {};
  const score = creditData.score as number | undefined;
  const updatedAt = creditData.updatedAt as string | undefined;

  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(score?.toString() || "");

  const handleSave = () => {
    const val = parseInt(inputVal);
    if (isNaN(val) || val < 300 || val > 850) return;
    saveCardData("credit", { score: val, updatedAt: new Date().toISOString() });
    setEditing(false);
  };

  // Gauge angle calculation (0-180 degrees)
  const angle = score ? ((score - 300) / 550) * 180 : 0;
  const rating = score ? getRating(score) : null;

  // SVG gauge
  const cx = 120, cy = 110, r = 90;

  return (
    <div className="bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4.5 h-4.5 text-foreground" />
          <h3 className="text-base font-semibold text-foreground">Credit Score</h3>
        </div>
        <button onClick={() => { setInputVal(score?.toString() || ""); setEditing(true); }} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {!score ? (
        <div className="flex flex-col items-center py-8">
          <svg width={240} height={130} viewBox="0 0 240 130">
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="hsl(var(--muted))" strokeWidth={16} strokeLinecap="round" />
          </svg>
          <span className="text-5xl font-bold text-muted-foreground mt-2">?</span>
          <button onClick={() => setEditing(true)} className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground">Set your credit score</button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <svg width={240} height={130} viewBox="0 0 240 130">
            {/* Background arc segments */}
            {BANDS.map((band, i) => {
              const startAngle = (i / 5) * 180;
              const endAngle = ((i + 1) / 5) * 180;
              const startRad = ((180 - startAngle) * Math.PI) / 180;
              const endRad = ((180 - endAngle) * Math.PI) / 180;
              const x1 = cx + r * Math.cos(startRad);
              const y1 = cy - r * Math.sin(startRad);
              const x2 = cx + r * Math.cos(endRad);
              const y2 = cy - r * Math.sin(endRad);
              return (
                <path key={band.label} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke={band.color} strokeWidth={16} strokeLinecap="butt" opacity={0.3} />
              );
            })}
            {/* Active arc up to score */}
            {(() => {
              const endRad = ((180 - angle) * Math.PI) / 180;
              const x2 = cx + r * Math.cos(endRad);
              const y2 = cy - r * Math.sin(endRad);
              const largeArc = angle > 180 ? 1 : 0;
              return (
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={rating!.color} strokeWidth={16} strokeLinecap="round" />
              );
            })()}
            {/* Needle */}
            {(() => {
              const needleRad = ((180 - angle) * Math.PI) / 180;
              const nx = cx + (r - 20) * Math.cos(needleRad);
              const ny = cy - (r - 20) * Math.sin(needleRad);
              return <circle cx={nx} cy={ny} r={6} fill={rating!.color} stroke="hsl(var(--card))" strokeWidth={3} />;
            })()}
          </svg>
          <span className="text-5xl font-bold text-foreground -mt-4">{score}</span>
          <span className="text-sm font-semibold mt-1" style={{ color: rating!.color }}>{rating!.label}</span>
          {updatedAt && <span className="text-xs text-muted-foreground mt-1">Last updated: {new Date(updatedAt).toLocaleDateString()}</span>}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-4">
        {BANDS.map(b => (
          <div key={b.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
            {b.label}
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditing(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Update Credit Score</h3>
            <input value={inputVal} onChange={e => setInputVal(e.target.value)} type="number" min={300} max={850} placeholder="300–850" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-foreground">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
