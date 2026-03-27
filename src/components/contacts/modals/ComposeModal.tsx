import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  to: string;
  toName: string;
  subject?: string;
  threadId?: string;
  contactId?: string;
  isReply?: boolean;
}

export default function ComposeModal({ isOpen, onClose, to, toName, subject: initialSubject, threadId, contactId, isReply }: Props) {
  const [subject, setSubject] = useState(initialSubject || "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("gmail-send", {
        body: { to, subject, body, thread_id: threadId, contact_id: contactId },
      });
      if (error) throw error;
      toast.success(`Message sent to ${toName}`);
      onClose();
      setBody("");
      setSubject("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] p-8 max-w-[560px] w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isReply ? `Reply to ${toName}` : "New Message"}
          </h2>
          <button onClick={onClose} className="rounded-full bg-[#f3f3f8] p-2">
            <X className="w-4 h-4 text-[#767586]" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={to}
            disabled
            className="bg-[#f3f3f8] rounded-[16px] px-4 py-3 text-sm w-full text-[#767586]"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="bg-[#f3f3f8] rounded-[16px] px-4 py-3 text-sm w-full outline-none focus:ring-2 focus:ring-[#4648d4]"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="bg-[#f3f3f8] rounded-[20px] px-4 py-3 text-sm w-full min-h-[160px] outline-none resize-none focus:ring-2 focus:ring-[#4648d4]"
          />
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="bg-[#f3f3f8] text-[#1a1c1f] rounded-full px-6 py-2.5 font-bold text-sm">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="text-white rounded-full px-6 py-2.5 font-bold text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
          >
            {sending ? "Sending..." : "Send Message ▶"}
          </button>
        </div>
      </div>
    </div>
  );
}
