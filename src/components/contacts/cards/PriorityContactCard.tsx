import { useState, useRef } from "react";
import { Star, ChevronRight } from "lucide-react";

interface PriorityContact {
  id: string;
  name: string;
  role: string;
  location: string;
  isPriority: boolean;
  whyPriority: string[];
  lastContactDays: number;
  recentEmail?: string;
}

interface Props {
  contact: PriorityContact;
  onToggleStar: (id: string) => void;
  onEmail: (id: string) => void;
  onSchedule: (id: string) => void;
  onEdit: (id: string) => void;
  onEmailClick?: (id: string) => void;
}

function getStatusColor(days: number) {
  if (days > 14) return { border: "#f43f5e", bg: "bg-[#fff1f2]", text: "text-[#be123c]", label: `Overdue · ${days} days ago`, avatarBg: "rgba(244,63,94,0.1)", avatarText: "#f43f5e" };
  if (days > 7) return { border: "#f59e0b", bg: "bg-[#fffbeb]", text: "text-[#b45309]", label: `Follow up · ${days} days ago`, avatarBg: "rgba(245,158,11,0.1)", avatarText: "#f59e0b" };
  return { border: "#22c55e", bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", label: `Active · ${days} days ago`, avatarBg: "rgba(34,197,94,0.1)", avatarText: "#22c55e" };
}

export default function PriorityContactCard({ contact, onToggleStar, onEmail, onSchedule, onEdit, onEmailClick }: Props) {
  const [expanded, setExpanded] = useState(false);
  const status = getStatusColor(contact.lastContactDays);

  return (
    <div
      className="bg-white rounded-[24px] overflow-hidden transition-shadow duration-200"
      style={{
        boxShadow: "0 4px 20px rgba(70,69,84,0.05)",
        borderLeft: `4px solid ${contact.isPriority ? "#ec4899" : status.border}`,
      }}
    >
      {/* Collapsed row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center flex-shrink-0"
          style={{ background: status.avatarBg, color: status.avatarText }}
        >
          {contact.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {contact.name}
          </div>
          <div className="text-xs text-[#767586]">{contact.role} · {contact.location}</div>
        </div>
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
        <ChevronRight
          className={`w-4 h-4 text-[#c7c4d7] flex-shrink-0 transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}
        />
      </div>

      {/* Expanded content */}
      <div
        className="overflow-hidden transition-all duration-350"
        style={{
          maxHeight: expanded ? 500 : 0,
          opacity: expanded ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.25,1,0.5,1)",
        }}
      >
        <div className="bg-[#f3f3f8] h-px w-full" />
        <div className="px-5 pb-5 pt-3 space-y-3">
          {/* Status pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${status.bg} ${status.text} rounded-full px-3 py-1 text-xs font-bold`}>
              {status.label}
            </span>
            <span className="text-xs text-[#767586]">Reach out every 14 days</span>
          </div>

          {/* Why priority */}
          <div className="bg-[#f3f3f8] rounded-[16px] p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#4648d4] mb-2">⚡ WHY PRIORITY</div>
            <ul className="space-y-1">
              {contact.whyPriority.map((r, i) => (
                <li key={i} className="text-xs text-[#464554]">• {r}</li>
              ))}
            </ul>
          </div>

          {/* Last email */}
          {contact.recentEmail && (
            <div className="cursor-pointer" onClick={() => onEmailClick?.(contact.id)}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#767586] mb-1">LAST EMAIL</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-[#464554] italic truncate flex-1">"{contact.recentEmail}"</span>
                <span className="text-[10px] text-[#767586] flex-shrink-0">2h ago</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#767586] mb-1">NOTES</div>
            <textarea
              className="bg-[#f3f3f8] rounded-[16px] px-3 py-2 text-xs w-full border-none resize-none min-h-[52px] focus:ring-2 focus:ring-[#4648d4]/20 focus:outline-none"
              placeholder="Add a note..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEmail(contact.id); }}
              className="text-white rounded-full px-4 py-2 text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
            >
              ▶ Email
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSchedule(contact.id); }}
              className="bg-[#f3f3f8] text-[#1a1c1f] rounded-full px-4 py-2 text-xs font-bold"
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
