import { Star } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  Family: "#f43f5e",
  Professional: "#4648d4",
  Friends: "#006c49",
};

interface ContactData {
  id: string;
  name: string;
  type: string;
  role: string;
  company?: string;
  lastDays: string;
  isPriority: boolean;
}

interface Props {
  contact: ContactData;
  onToggleStar: (id: string) => void;
  onClick: (id: string) => void;
}

export default function ContactRow({ contact, onToggleStar, onClick }: Props) {
  return (
    <div className="contacts-card-row cursor-pointer" onClick={() => onClick(contact.id)}>
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: TYPE_COLORS[contact.type] || "#767586" }}
      />
      <div className="w-10 h-10 rounded-full bg-[#f3f3f8] text-[#464554] font-bold flex items-center justify-center flex-shrink-0">
        {contact.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-[#1a1c1f]">{contact.name}</div>
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
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        ) : (
          <Star className="w-4 h-4 text-[#e8e8ed]" />
        )}
      </button>
    </div>
  );
}
