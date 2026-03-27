import { Star, Mail, Calendar, Pencil } from "lucide-react";

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

export default function PriorityContactCard({ contact, onToggleStar, onEmail, onSchedule, onEdit, onEmailClick }: Props) {
  const getStatusStyle = () => {
    if (contact.lastContactDays > 14)
      return { bg: "bg-[#ba1a1a]/10", text: "text-[#ba1a1a]", dot: "🔴" };
    if (contact.lastContactDays > 7)
      return { bg: "bg-amber-50", text: "text-amber-700", dot: "🟡" };
    return { bg: "bg-[#6cf8bb]/20", text: "text-[#006c49]", dot: "✅" };
  };

  const status = getStatusStyle();

  return (
    <div className="contacts-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#e1e0ff] text-[#4648d4] font-extrabold text-xl flex items-center justify-center flex-shrink-0">
            {contact.name[0]}
          </div>
          <div>
            <div className="font-bold text-lg text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {contact.name}
            </div>
            <div className="text-sm text-[#767586]">{contact.role}</div>
            <div className="text-xs text-[#767586]">{contact.location}</div>
          </div>
        </div>
        <button onClick={() => onToggleStar(contact.id)} className="text-xl">
          {contact.isPriority ? (
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          ) : (
            <Star className="w-5 h-5 text-[#e8e8ed]" />
          )}
        </button>
      </div>

      <div className="bg-[#f3f3f8] rounded-[20px] p-4 mt-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#4648d4] mb-2">⚡ WHY PRIORITY</div>
        <ul className="space-y-1">
          {contact.whyPriority.map((reason, i) => (
            <li key={i} className="text-sm text-[#464554]">• {reason}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <span className={`${status.bg} ${status.text} rounded-full px-3 py-1 text-xs font-bold inline-flex items-center gap-1`}>
          {status.dot} Last contact: {contact.lastContactDays} days ago
        </span>
      </div>

      {contact.recentEmail && (
        <div
          className="mt-3 cursor-pointer"
          onClick={() => onEmailClick?.(contact.id)}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#767586] mb-1">RECENT EMAIL</div>
          <div className="text-sm text-[#464554] italic truncate">"{contact.recentEmail}"</div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onEmail(contact.id)}
          className="text-white rounded-full px-4 py-2 text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
        >
          ▶ Email
        </button>
        <button
          onClick={() => onSchedule(contact.id)}
          className="bg-[#f3f3f8] text-[#1a1c1f] rounded-full px-4 py-2 text-sm font-bold"
        >
          Schedule
        </button>
        <button
          onClick={() => onEdit(contact.id)}
          className="bg-[#f3f3f8] text-[#1a1c1f] rounded-full px-4 py-2 text-sm font-bold"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
