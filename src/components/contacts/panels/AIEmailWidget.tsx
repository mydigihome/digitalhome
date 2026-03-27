import { useState } from "react";
import { X, Paperclip, Link2, Pencil, Send } from "lucide-react";
import { useGmailConnection } from "@/hooks/useGmail";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const DRAFTS: Record<string, string[]> = {
  overdue: [
    "Hi {name},\n\nHope you're doing well! I've been thinking about the investment property search we discussed — wanted to check in and see if there are any new listings worth exploring.\n\nWould love to catch up this week if you have 20 minutes.\n\nBest,",
    "Hi {name},\n\nIt's been a while since we last connected! I wanted to touch base and see how things are progressing on your end.\n\nLet me know if you're free for a quick call.\n\nBest,",
    "Hi {name},\n\nJust wanted to reach out — I know it's been a bit since we spoke. Would love to reconnect and hear about any updates.\n\nBest,",
  ],
  dueSoon: [
    "Hi {name},\n\nJust wanted to stay in touch — it's been a little while! Would love to hear what you've been working on lately.\n\nLet me know if you'd like to connect soon.\n\nBest,",
    "Hi {name},\n\nHoping to catch up soon! Anything new on your end I should know about?\n\nBest,",
  ],
  recent: [
    "Hi {name},\n\nHoping all is well on your end. Reaching out to stay connected and see if there's anything I can help with.\n\nLooking forward to hearing from you.\n\nBest,",
    "Hi {name},\n\nGreat connecting recently! Just following up on our last conversation.\n\nBest,",
  ],
};

interface Props {
  contact: { id: string; name: string; email?: string; lastContactDays: number };
  onClose: () => void;
}

export default function AIEmailWidget({ contact, onClose }: Props) {
  const firstName = contact.name.split(" ")[0];
  const category = contact.lastContactDays > 14 ? "overdue" : contact.lastContactDays > 7 ? "dueSoon" : "recent";
  const drafts = DRAFTS[category];

  const [draftIndex, setDraftIndex] = useState(0);
  const [body, setBody] = useState(drafts[0].replace(/{name}/g, firstName));
  const [subject, setSubject] = useState(
    contact.lastContactDays > 14 ? "Checking in" : "Staying connected"
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { data: gmailConn } = useGmailConnection();
  const { user } = useAuth();

  const regenerate = () => {
    const next = (draftIndex + 1) % drafts.length;
    setDraftIndex(next);
    setBody(drafts[next].replace(/{name}/g, firstName));
  };

  const handleSend = async () => {
    if (!gmailConn) {
      toast.error("Connect Gmail to send emails");
      return;
    }
    if (!contact.email) {
      toast.error("No email address for this contact");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("gmail-send", {
        body: { user_id: user?.id, to: contact.email, subject, body },
      });
      if (error) throw error;
      setSent(true);
      toast.success(`Sent to ${contact.name}`);
      setTimeout(onClose, 2000);
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const statusLabel = contact.lastContactDays > 14
    ? `Overdue · ${contact.lastContactDays}d`
    : contact.lastContactDays > 7
    ? `Follow up · ${contact.lastContactDays}d`
    : `Active · ${contact.lastContactDays}d`;

  const statusColor = contact.lastContactDays > 14 ? "#f43f5e" : contact.lastContactDays > 7 ? "#f59e0b" : "#22c55e";

  if (sent) {
    return (
      <div className="bg-white rounded-[32px] p-6 shadow-[0_12px_40px_rgba(70,69,84,0.08)] flex flex-col items-center justify-center gap-3 min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-[#f0fdf4] flex items-center justify-center text-2xl">✓</div>
        <p className="font-bold text-sm text-[#1a1c1f]">Sent to {contact.name}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-[0_12px_40px_rgba(70,69,84,0.08)] animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center" style={{ background: `${statusColor}15`, color: statusColor }}>
          {contact.name[0]}
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm text-[#1a1c1f]">Email to {contact.name}</div>
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: `${statusColor}15`, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#f3f3f8] flex items-center justify-center text-[#767586] hover:bg-[#e8e8ed] transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subject */}
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="bg-[#f3f3f8] rounded-[16px] px-4 py-2.5 text-sm w-full border-none focus:ring-2 focus:ring-[#4648d4]/20 focus:outline-none mb-3"
        placeholder="Subject"
      />

      {/* AI Draft */}
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#4648d4] mb-2">✦ AI DRAFT</div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="bg-[#f9f9fe] rounded-[20px] p-4 text-sm text-[#1a1c1f] leading-relaxed w-full border-none resize-y min-h-[180px] focus:ring-2 focus:ring-[#4648d4]/20 focus:outline-none"
      />
      <button onClick={regenerate} className="text-[10px] text-[#4648d4] font-bold mt-1 hover:underline">
        ✦ Regenerate
      </button>

      {/* Toolbar */}
      <div className="flex gap-2 items-center mt-3">
        <button className="w-7 h-7 rounded-full bg-[#f3f3f8] flex items-center justify-center text-[#767586]">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => toast.info("Attachments coming soon")} className="w-7 h-7 rounded-full bg-[#f3f3f8] flex items-center justify-center text-[#767586]">
          <Paperclip className="w-3.5 h-3.5" />
        </button>
        <button className="w-7 h-7 rounded-full bg-[#f3f3f8] flex items-center justify-center text-[#767586]">
          <Link2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Send */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex-1 text-white rounded-full font-bold text-sm py-3 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
        >
          {sending ? "Sending..." : gmailConn ? "Send ▶" : "Connect Gmail to Send"}
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-9 h-9 rounded-full bg-[#4648d4]/10 flex items-center justify-center text-[#4648d4] flex-shrink-0"
          title="Send directly to Gmail"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
