import { Star } from "lucide-react";

interface PriorityContact {
  id: string;
  name: string;
  role: string;
  location: string;
  isPriority: boolean;
  whyPriority: string[];
  lastContactDays: number;
  recentEmail?: string;
  email?: string;
  type?: string;
}

interface Props {
  contact: PriorityContact;
  isActive?: boolean;
  onToggleStar: (id: string) => void;
  onEmail: (id: string) => void;
  onSchedule: (id: string) => void;
  onEdit: (id: string) => void;
  onSelect: (id: string) => void;
}

function getAvatarStyle(type?: string) {
  switch (type) {
    case "Family": return { bg: "#ffe4e6", text: "#be123c" };
    case "Friends": return { bg: "#dcfce7", text: "#16a34a" };
    case "Professional":
    case "Digi Home":
    default: return { bg: "#e1e0ff", text: "#4648d4" };
  }
}

function getStatusDot(days: number) {
  if (days > 14) return { color: "#f43f5e", label: `Overdue · ${days} days ago`, textClass: "text-[#be123c]" };
  if (days > 7) return { color: "#f59e0b", label: `Follow up · ${days} days ago`, textClass: "text-[#b45309]" };
  return { color: "#22c55e", label: `Active · ${days} days ago`, textClass: "text-[#16a34a]" };
}

export default function PriorityContactCard({ contact, isActive, onToggleStar, onEmail, onSchedule, onEdit, onSelect }: Props) {
  const avatar = getAvatarStyle(contact.type);
  const status = getStatusDot(contact.lastContactDays);

  return (
    <div
      className="rounded-[24px] p-5 cursor-pointer transition-all duration-200"
      style={{
        background: "#ffffff",
        boxShadow: "0 4px 20px rgba(70,69,84,0.06)",
        border: isActive ? "1.5px solid #c0c1ff" : "1px solid #f0f0f5",
        backgroundColor: isActive ? "#f9f9fe" : "#ffffff",
      }}
      onClick={() => onSelect(contact.id)}
    >
      {/* Top row */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#e8e8ed]"
          style={{ background: avatar.bg, color: avatar.text }}
        >
          {contact.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {contact.name}
          </div>
          <div className="text-xs text-[#767586]">{contact.role} · {contact.location}</div>
        </div>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: status.color }} />
        <button
          onClick={(e) => { e.stopPropagation(); onToggleStar(contact.id); }}
          className="flex-shrink-0"
        >
          {contact.isPriority ? (
            <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
          ) : (
            <Star className="w-4 h-4 text-[#e8e8ed]" />
          )}
        </button>
      </div>

      {/* Why priority */}
      <div className="bg-[#f3f3f8] rounded-[16px] p-3 mt-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#4648d4] mb-2"> WHY PRIORITY</div>
        <ul className="space-y-1">
          {contact.whyPriority.map((r, i) => (
            <li key={i} className="text-xs text-[#464554]">• {r}</li>
          ))}
        </ul>
      </div>

      {/* Last contacted */}
      <div className="mt-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: status.color }} />
        <span className={`text-xs font-bold ${status.textClass}`}>{status.label}</span>
        <span className="text-[10px] text-[#767586] ml-auto">Reach out every 14 days</span>
      </div>

      {/* Recent email */}
      {contact.recentEmail && (
        <div className="mt-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#767586] mb-1">RECENT EMAIL</div>
          <span className="text-xs text-[#464554] italic truncate block">"{contact.recentEmail}"</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onEmail(contact.id); }}
          className="text-white rounded-full px-4 py-1.5 text-xs font-bold"
          style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
        >
          ▶ Email
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSchedule(contact.id); }}
          className="bg-[#f3f3f8] text-[#1a1c1f] rounded-full px-4 py-1.5 text-xs font-bold"
        >
          Schedule
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(contact.id); }}
          className="bg-[#f3f3f8] text-[#1a1c1f] rounded-full px-4 py-1.5 text-xs font-bold"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
