import { Star } from "lucide-react";

interface ContactData {
  id: string;
  name: string;
  type: string;
  role: string;
  company?: string;
  lastDays: string;
  isPriority: boolean;
  isDigiHome?: boolean;
}

interface Props {
  contact: ContactData;
  onToggleStar: (id: string) => void;
  onClick: (id: string) => void;
}

function getStatusFromDays(lastDays: string) {
  const num = parseInt(lastDays);
  if (isNaN(num) || num <= 7) return { border: "#22c55e", dotColor: "#22c55e", avatarBg: "rgba(34,197,94,0.1)", avatarText: "#22c55e" };
  if (num <= 14) return { border: "#f59e0b", dotColor: "#f59e0b", avatarBg: "rgba(245,158,11,0.1)", avatarText: "#f59e0b" };
  return { border: "#f43f5e", dotColor: "#f43f5e", avatarBg: "rgba(244,63,94,0.1)", avatarText: "#f43f5e" };
}

export default function ContactRow({ contact, onToggleStar, onClick }: Props) {
  const isDigiHome = contact.isDigiHome || contact.type === "Digi Home";
  const status = isDigiHome
    ? { border: "#4648d4", dotColor: "#4648d4", avatarBg: "rgba(70,72,212,0.1)", avatarText: "#4648d4" }
    : getStatusFromDays(contact.lastDays);

  return (
    <div
      className="bg-white rounded-[20px] px-5 py-4 flex items-center gap-4 cursor-pointer shadow-[0_4px_16px_rgba(70,69,84,0.04)]"
      style={{ borderLeft: `4px solid ${status.border}` }}
      onClick={() => onClick(contact.id)}
    >
      <div className="relative flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm"
          style={{ background: status.avatarBg, color: status.avatarText }}
        >
          {contact.name[0]}
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
          style={{ background: status.dotColor }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-[#1a1c1f]">{contact.name}</span>
          {isDigiHome && (
            <span className="bg-[#4648d4]/10 text-[#4648d4] text-[9px] font-bold rounded-full px-1.5 py-0.5">
              Digi Home
            </span>
          )}
        </div>
        <div className="text-xs text-[#767586]">
          {contact.type} • {contact.role}{contact.company ? ` • ${contact.company}` : ""}
        </div>
      </div>
      <div className="text-xs text-[#767586] flex-shrink-0">Last: {contact.lastDays}</div>
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
  );
}
