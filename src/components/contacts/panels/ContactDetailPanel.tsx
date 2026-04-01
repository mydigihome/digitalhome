import { useState } from "react";
import { X, Star } from "lucide-react";

interface ContactDetail {
  id: string;
  name: string;
  role: string;
  company?: string;
  type: string;
  isPriority: boolean;
  emailCount: number;
  meetingCount: number;
  daysSince: number;
  linkedProjects: string[];
  recentEmails: { subject: string; date: string }[];
  notes: string;
}

interface Props {
  contact: ContactDetail | null;
  onClose: () => void;
  onToggleStar: (id: string) => void;
  onEmail: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}

export default function ContactDetailPanel({ contact, onClose, onToggleStar, onEmail, onNotesChange }: Props) {
  const [localNotes, setLocalNotes] = useState(contact?.notes || "");

  if (!contact) return null;

  return (
    <div
      className="bg-white rounded-[32px] p-6 shadow-[0_12px_40px_rgba(70,69,84,0.1)] h-fit"
      style={{ animation: "slideInRight 300ms cubic-bezier(0.25,1,0.5,1)" }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="flex justify-end mb-4">
        <button onClick={onClose} className="rounded-full bg-[#f3f3f8] p-2">
          <X className="w-4 h-4 text-[#767586]" />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-[#e1e0ff] text-[#4648d4] font-extrabold text-2xl flex items-center justify-center">
          {contact.name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-2xl text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {contact.name}
            </h3>
            <button onClick={() => onToggleStar(contact.id)}>
              {contact.isPriority ? (
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              ) : (
                <Star className="w-5 h-5 text-[#e8e8ed]" />
              )}
            </button>
          </div>
          <div className="text-sm text-[#767586]">{contact.role}{contact.company ? ` • ${contact.company}` : ""}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { value: contact.emailCount, label: "EMAILS" },
          { value: contact.meetingCount, label: "MEETINGS" },
          { value: contact.daysSince, label: "DAYS SINCE" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#f3f3f8] rounded-[16px] p-3 text-center">
            <div className="font-bold text-lg text-[#1a1c1f]">{stat.value}</div>
            <div className="text-[10px] text-[#767586] uppercase font-bold tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#767586] mb-2">LINKED PROJECTS</div>
        <div className="flex flex-wrap gap-2">
          {contact.linkedProjects.map((p) => (
            <span key={p} className="bg-[#4648d4]/8 text-[#4648d4] rounded-full px-3 py-1 text-xs font-bold">{p}</span>
          ))}
          <button className="text-[#4648d4] text-xs font-bold">+ Link project</button>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#767586] mb-2">RECENT EMAILS</div>
        <div className="space-y-2">
          {contact.recentEmails.map((em, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-[#1a1c1f] truncate flex-1">{em.subject}</span>
              <span className="text-xs text-[#767586] flex-shrink-0 ml-2">{em.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#767586] mb-2">NOTES</div>
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={() => onNotesChange(contact.id, localNotes)}
          placeholder="Add notes about this contact..."
          className="bg-[#f3f3f8] rounded-[20px] p-4 text-sm w-full resize-none min-h-[80px] outline-none"
        />
      </div>

      <div className="mt-5 space-y-2">
        <button
          onClick={() => onEmail(contact.id)}
          className="w-full text-white rounded-full py-2.5 font-bold text-sm"
          style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
        >
          ▶ Send Email
        </button>
        <button className="w-full bg-[#f3f3f8] text-[#1a1c1f] rounded-full py-2.5 font-bold text-sm">
           Schedule Meeting
        </button>
        <button className="w-full bg-[#f3f3f8] text-[#1a1c1f] rounded-full py-2.5 font-bold text-sm">
          🔗 Share Profile
        </button>
      </div>
    </div>
  );
}
