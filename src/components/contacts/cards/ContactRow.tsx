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

function getAvatarStyle(type: string) {
  switch (type) {
    case "Professional": return { bg: "#e1e0ff", text: "#4648d4" };
    case "Family": return { bg: "#ffe4e6", text: "#be123c" };
    case "Friends": return { bg: "#dcfce7", text: "#16a34a" };
    case "Digi Home": return { bg: "#e1e0ff", text: "#4648d4" };
    default: return { bg: "#f3f3f8", text: "#464554" };
  }
}

function getTypeDotColor(type: string) {
  switch (type) {
    case "Professional": return "#4648d4";
    case "Family": return "#f43f5e";
    case "Friends": return "#22c55e";
    case "Digi Home": return "#4648d4";
    default: return "#767586";
  }
}

export default function ContactRow({ contact, onToggleStar, onClick }: Props) {
  const isDigiHome = contact.isDigiHome || contact.type === "Digi Home";
  const avatar = getAvatarStyle(contact.type);
  const dotColor = getTypeDotColor(contact.type);

  return (
    <div
      className="rounded-[20px] px-5 py-4 flex items-center gap-4 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_16px_rgba(70,69,84,0.08)] hover:border-[#e1e0ff]"
      style={{
        background: "#ffffff",
        border: "1px solid #f0f0f5",
        boxShadow: "0 2px 8px rgba(70,69,84,0.04)",
      }}
      onClick={() => onClick(contact.id)}
    >
      {/* Relationship dot */}
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm border border-[#e8e8ed]"
          style={{ background: avatar.bg, color: avatar.text }}
        >
          {contact.name[0]}
        </div>
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
          {contact.role} · {contact.type}{contact.company ? ` · ${contact.company}` : ""}
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
          <Star className="w-4 h-4 text-[#e8e8ed] hover:text-[#f59e0b] transition-colors" />
        )}
      </button>
    </div>
  );
}
