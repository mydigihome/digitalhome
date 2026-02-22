import { SetupData } from "./types";

interface Props {
  setup: SetupData;
  setSetup: React.Dispatch<React.SetStateAction<SetupData>>;
}

const COLUMNS: { key: keyof SetupData; label: string }[] = [
  { key: "contentPillars", label: "Content Pillars" },
  { key: "contentFormats", label: "Content Format" },
  { key: "statuses", label: "Status" },
  { key: "platforms", label: "Platform" },
  { key: "goals", label: "Goals" },
];

export default function SetupTab({ setup, setSetup }: Props) {
  const maxRows = Math.max(...COLUMNS.map(c => setup[c.key].length)) + 1;

  const updateCell = (key: keyof SetupData, idx: number, value: string) => {
    setSetup(prev => {
      const arr = [...prev[key]];
      arr[idx] = value;
      return { ...prev, [key]: arr };
    });
  };

  const handleKeyDown = (key: keyof SetupData, idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // add row if at end
      if (idx === setup[key].length - 1) {
        setSetup(prev => ({ ...prev, [key]: [...prev[key], ""] }));
      }
    }
  };

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className="sticky top-0 z-10 border px-3 py-2 text-left text-xs font-bold uppercase tracking-wider"
                style={{ background: "#E8E0D5", color: "#2C2C2C", borderColor: "#C9B99A" }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, rowIdx) => (
            <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
              {COLUMNS.map(col => (
                <td key={col.key} className="border px-0 py-0" style={{ borderColor: "#E8E0D5" }}>
                  <input
                    className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                    style={{ color: "#2C2C2C" }}
                    value={setup[col.key][rowIdx] ?? ""}
                    onChange={e => updateCell(col.key, rowIdx, e.target.value)}
                    onKeyDown={e => handleKeyDown(col.key, rowIdx, e)}
                    placeholder={rowIdx >= setup[col.key].length ? "Add new…" : ""}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
