import { format, parseISO } from "date-fns";
import { SetupData, WeekData, STATUS_COLORS } from "./types";

interface Props {
  setup: SetupData;
  week: WeekData;
  setWeek: React.Dispatch<React.SetStateAction<WeekData>>;
  updateDay: (i: number, patch: Partial<WeekData["days"][0]>) => void;
  updateDayChecklist: (i: number, key: string, val: boolean) => void;
  updateDayAnalytics: (i: number, key: string, val: string) => void;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CHECKLIST_KEYS = ["script", "graphics", "filmed", "edited", "posted"] as const;

function CellSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent px-2 py-1 text-xs outline-none cursor-pointer"
      style={{ color: "#2C2C2C" }}
    >
      <option value="">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function WeeklyCalendarTab({ setup, week, setWeek, updateDay, updateDayChecklist, updateDayAnalytics }: Props) {
  const totalPosts = week.days.filter(d => d.title.trim()).length;
  const toReview = week.days.filter(d => d.status === "Draft" || d.status === "Editing").length;

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse" style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 1100 }}>
        <thead>
          <tr>
            <th
              className="sticky left-0 top-0 z-20 border px-3 py-2 text-left text-xs font-bold uppercase"
              style={{ background: "#E8E0D5", color: "#2C2C2C", borderColor: "#C9B99A", width: 160 }}
            >
              Week Info
            </th>
            {week.days.map((d, i) => (
              <th
                key={i}
                className="sticky top-0 z-10 border px-2 py-2 text-center text-xs font-bold uppercase"
                style={{ background: "#E8E0D5", color: "#2C2C2C", borderColor: "#C9B99A", minWidth: 140 }}
              >
                {DOW[i]}
                <div className="font-semibold text-[11px] mt-0.5">{format(parseISO(d.date), "MMM d")}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Image */}
          <Row label="Image" sidebar sticky>
            {week.days.map((d, i) => (
              <td key={i} className="border px-1 py-1" style={{ borderColor: "#E8E0D5", background: i % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
                {d.imageUrl ? (
                  <img src={d.imageUrl} alt="" className="h-16 w-full rounded object-cover" />
                ) : (
                  <input
                    className="w-full bg-transparent px-2 py-1 text-xs outline-none"
                    placeholder="Paste URL…"
                    style={{ color: "#2C2C2C" }}
                    onBlur={e => updateDay(i, { imageUrl: e.target.value })}
                  />
                )}
              </td>
            ))}
          </Row>

          {/* Platform */}
          <Row label="Platform" sidebar>
            {week.days.map((d, i) => (
              <td key={i} className="border px-0 py-0" style={{ borderColor: "#E8E0D5", background: i % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
                <CellSelect value={d.platform} options={setup.platforms} onChange={v => updateDay(i, { platform: v })} />
              </td>
            ))}
          </Row>

          {/* Content Type */}
          <Row label="Content Type" sidebar>
            {week.days.map((d, i) => (
              <td key={i} className="border px-0 py-0" style={{ borderColor: "#E8E0D5", background: i % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
                <CellSelect value={d.contentType} options={setup.contentFormats} onChange={v => updateDay(i, { contentType: v })} />
              </td>
            ))}
          </Row>

          {/* Title */}
          <Row label="Title / Hook" sidebar>
            {week.days.map((d, i) => (
              <td key={i} className="border px-0 py-0" style={{ borderColor: "#E8E0D5", background: i % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
                <input
                  className="w-full bg-transparent px-2 py-1.5 text-xs font-medium outline-none"
                  style={{ color: "#2C2C2C" }}
                  value={d.title}
                  onChange={e => updateDay(i, { title: e.target.value })}
                  placeholder="Enter title…"
                />
              </td>
            ))}
          </Row>

          {/* Caption */}
          <Row label="Caption" sidebar>
            {week.days.map((d, i) => (
              <td key={i} className="border px-0 py-0" style={{ borderColor: "#E8E0D5", background: i % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
                <textarea
                  className="w-full resize-none bg-transparent px-2 py-1.5 text-xs outline-none"
                  style={{ color: "#2C2C2C", minHeight: 60 }}
                  value={d.caption}
                  onChange={e => updateDay(i, { caption: e.target.value })}
                  placeholder="Write caption…"
                />
              </td>
            ))}
          </Row>

          {/* Status */}
          <Row label="Status" sidebar>
            {week.days.map((d, i) => (
              <td
                key={i}
                className="border px-0 py-0"
                style={{
                  borderColor: "#E8E0D5",
                  background: d.status ? `${STATUS_COLORS[d.status] || "#FAF7F2"}22` : (i % 2 === 0 ? "#FAF7F2" : "#F3EDE4"),
                }}
              >
                <select
                  value={d.status}
                  onChange={e => updateDay(i, { status: e.target.value })}
                  className="w-full bg-transparent px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
                  style={{ color: STATUS_COLORS[d.status] || "#2C2C2C" }}
                >
                  {setup.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            ))}
          </Row>

          {/* Checklist */}
          <Row label="Checklist" sidebar>
            {week.days.map((d, i) => (
              <td key={i} className="border px-2 py-1" style={{ borderColor: "#E8E0D5", background: i % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {CHECKLIST_KEYS.map(k => (
                    <label key={k} className="flex items-center gap-1 text-[10px] cursor-pointer" style={{ color: "#2C2C2C" }}>
                      <input
                        type="checkbox"
                        checked={d.checklist[k]}
                        onChange={e => updateDayChecklist(i, k, e.target.checked)}
                        className="h-3 w-3 accent-[#C9B99A]"
                      />
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </label>
                  ))}
                </div>
              </td>
            ))}
          </Row>

          {/* Analytics */}
          <Row label="Analytics" sidebar>
            {week.days.map((d, i) => (
              <td key={i} className="border px-1 py-1" style={{ borderColor: "#E8E0D5", background: i % 2 === 0 ? "#FAF7F2" : "#F3EDE4" }}>
                <div className="grid grid-cols-2 gap-0.5">
                  {(["views", "likes", "comments", "shares"] as const).map(k => (
                    <div key={k} className="flex items-center gap-1">
                      <span className="text-[9px] uppercase tracking-wide" style={{ color: "#C9B99A" }}>{k.slice(0, 1).toUpperCase()}</span>
                      <input
                        className="w-full bg-transparent text-[10px] outline-none"
                        style={{ color: "#2C2C2C" }}
                        value={d.analytics[k]}
                        onChange={e => updateDayAnalytics(i, k, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </td>
            ))}
          </Row>
        </tbody>
      </table>

      {/* Left sidebar meta rendered below for simplicity */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ maxWidth: 700 }}>
        <MetaBox label="Week #" value={String(week.weekNumber)} onChange={v => setWeek(p => ({ ...p, weekNumber: parseInt(v) || 1 }))} />
        <MetaBox label="Total Posts" value={String(totalPosts)} readOnly />
        <MetaBox label="To Review" value={String(toReview)} readOnly />
        <MetaBox label="Weekly Goal" value={week.weeklyGoal} onChange={v => setWeek(p => ({ ...p, weeklyGoal: v }))} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" style={{ maxWidth: 700 }}>
        <div className="rounded border p-2" style={{ borderColor: "#E8E0D5", background: "#FAF7F2" }}>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#C9B99A" }}>Weekly To-Do</div>
          {week.weeklyTodos.map((t, i) => (
            <input
              key={i}
              className="block w-full bg-transparent py-0.5 text-xs outline-none"
              style={{ color: "#2C2C2C" }}
              value={t}
              onChange={e => setWeek(p => {
                const todos = [...p.weeklyTodos];
                todos[i] = e.target.value;
                return { ...p, weeklyTodos: todos };
              })}
              placeholder={`To-do ${i + 1}`}
            />
          ))}
        </div>
        <div className="rounded border p-2" style={{ borderColor: "#E8E0D5", background: "#FAF7F2" }}>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#C9B99A" }}>Weekly Review</div>
          <textarea
            className="w-full resize-none bg-transparent text-xs outline-none"
            style={{ color: "#2C2C2C", minHeight: 60 }}
            value={week.weeklyReview}
            onChange={e => setWeek(p => ({ ...p, weeklyReview: e.target.value }))}
            placeholder="Notes on the week…"
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, sidebar, sticky, children }: { label: string; sidebar?: boolean; sticky?: boolean; children: React.ReactNode }) {
  return (
    <tr>
      <td
        className="border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
        style={{
          background: "#E8E0D5",
          color: "#2C2C2C",
          borderColor: "#C9B99A",
          position: "sticky",
          left: 0,
          zIndex: 5,
        }}
      >
        {label}
      </td>
      {children}
    </tr>
  );
}

function MetaBox({ label, value, onChange, readOnly }: { label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean }) {
  return (
    <div className="rounded border p-2" style={{ borderColor: "#E8E0D5", background: "#FAF7F2" }}>
      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#C9B99A" }}>{label}</div>
      <input
        className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
        style={{ color: "#2C2C2C" }}
        value={value}
        readOnly={readOnly}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
      />
    </div>
  );
}
