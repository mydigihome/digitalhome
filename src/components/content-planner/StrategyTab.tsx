import { StrategyRow } from "./types";

interface Props {
  strategy: StrategyRow[];
  setStrategy: React.Dispatch<React.SetStateAction<StrategyRow[]>>;
}

export default function StrategyTab({ strategy, setStrategy }: Props) {
  const update = (idx: number, value: string) => {
    setStrategy(prev => {
      const rows = [...prev];
      rows[idx] = { ...rows[idx], value };
      return rows;
    });
  };

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse" style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 900 }}>
        <thead>
          <tr>
            <th
              className="sticky top-0 z-10 border px-4 py-2 text-left text-xs font-bold uppercase tracking-wider"
              style={{ background: "#E8E0D5", color: "#2C2C2C", borderColor: "#C9B99A", width: 220 }}
            >
              Section
            </th>
            <th
              className="sticky top-0 z-10 border px-4 py-2 text-left text-xs font-bold uppercase tracking-wider"
              style={{ background: "#E8E0D5", color: "#2C2C2C", borderColor: "#C9B99A" }}
            >
              Fill In Your Details
            </th>
          </tr>
        </thead>
        <tbody>
          {strategy.map((row, idx) => (
            <tr key={row.label} style={{ background: idx % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
              <td
                className="border px-4 py-3 text-sm font-semibold"
                style={{ color: "#2C2C2C", borderColor: "#E8E0D5" }}
              >
                {row.label}
              </td>
              <td className="border px-0 py-0" style={{ borderColor: "#E8E0D5" }}>
                <textarea
                  className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none"
                  style={{ color: "#2C2C2C", minHeight: 80 }}
                  value={row.value}
                  onChange={e => update(idx, e.target.value)}
                  placeholder="Type here…"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
