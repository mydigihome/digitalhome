import { SetupData, IdeaEntry } from "./types";

interface Props {
  setup: SetupData;
  ideas: Record<string, IdeaEntry[]>;
  setIdeas: React.Dispatch<React.SetStateAction<Record<string, IdeaEntry[]>>>;
}

export default function IdeasBankTab({ setup, ideas, setIdeas }: Props) {
  const pillars = setup.contentPillars.filter(p => p.trim());
  const maxRows = Math.max(...pillars.map(p => ideas[p]?.length || 0), 20);

  const updateIdea = (pillar: string, idx: number, text: string) => {
    setIdeas(prev => {
      const arr = [...(prev[pillar] || [])];
      if (idx < arr.length) {
        arr[idx] = { ...arr[idx], text };
      } else {
        arr.push({ id: `new-${Date.now()}`, text });
      }
      return { ...prev, [pillar]: arr };
    });
  };

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <thead>
          <tr>
            {pillars.map(p => (
              <th
                key={p}
                className="sticky top-0 z-10 border px-3 py-2 text-left text-xs font-bold uppercase tracking-wider"
                style={{ background: "#E8E0D5", color: "#2C2C2C", borderColor: "#C9B99A" }}
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, rowIdx) => (
            <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
              {pillars.map(p => (
                <td key={p} className="border px-0 py-0" style={{ borderColor: "#E8E0D5" }}>
                  <input
                    className="w-full bg-transparent px-3 py-1.5 text-xs outline-none"
                    style={{ color: "#2C2C2C" }}
                    value={ideas[p]?.[rowIdx]?.text ?? ""}
                    onChange={e => updateIdea(p, rowIdx, e.target.value)}
                    placeholder="Type idea…"
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
