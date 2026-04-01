import { useState } from "react";
import { X, Mail, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useGmailConnection, useConnectGmail } from "@/hooks/useGmail";

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
  const [saving, setSaving] = useState(false);
  const [draftLink, setDraftLink] = useState<string | null>(null);
  const { data: gmailConnection } = useGmailConnection();
  const { connect: connectGmail } = useConnectGmail();

  if (!isOpen) return null;

  const handleMailto = () => {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast.success("Email app opened");
  };

  const handleGmailDraft = async () => {
    if (!body.trim()) return;
    setSaving(true);
    setDraftLink(null);
    try {
      const { data, error } = await supabase.functions.invoke("gmail-create-draft", {
        body: { to, subject, body },
      });
      if (error) throw error;
      if (data?.draftLink) {
        setDraftLink(data.draftLink);
        toast.success("Draft saved to Gmail ");
      }
    } catch {
      // Fallback to mailto on error
      handleMailto();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setBody("");
    setSubject(initialSubject || "");
    setDraftLink(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#1e2130] rounded-[32px] p-8 max-w-[560px] w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl text-[#1a1c1f] dark:text-[#f9fafb]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isReply ? `Reply to ${toName}` : "New Message"}
          </h2>
          <button onClick={handleClose} className="rounded-full bg-[#f3f3f8] dark:bg-[#252836] p-2">
            <X className="w-4 h-4 text-[#767586] dark:text-[#9ca3af]" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={to}
            disabled
            className="bg-[#f3f3f8] dark:bg-[#252836] rounded-[16px] px-4 py-3 text-sm w-full text-[#767586] dark:text-[#9ca3af]"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="bg-[#f3f3f8] dark:bg-[#252836] rounded-[16px] px-4 py-3 text-sm w-full outline-none focus:ring-2 focus:ring-[#4648d4] text-[#1a1c1f] dark:text-[#f9fafb] placeholder:text-[#9ca3af]"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="bg-[#f3f3f8] dark:bg-[#252836] rounded-[20px] px-4 py-3 text-sm w-full min-h-[160px] outline-none resize-none focus:ring-2 focus:ring-[#4648d4] text-[#1a1c1f] dark:text-[#f9fafb] placeholder:text-[#9ca3af]"
          />
        </div>

        {/* Draft saved success */}
        {draftLink && (
          <div className="mt-4 p-3 bg-[#f0fdf4] dark:bg-[#052e16] rounded-[12px] flex items-center justify-between">
            <span className="text-sm text-[#16a34a] font-medium">Draft saved to Gmail </span>
            <a
              href={draftLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#4648d4] font-semibold flex items-center gap-1 hover:underline"
            >
              Open in Gmail <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2 mt-6">
          <div className="flex gap-3">
            {gmailConnection ? (
              <>
                <button
                  onClick={handleGmailDraft}
                  disabled={saving || !body.trim()}
                  className="flex-1 bg-[#111827] dark:bg-[#6366f1] text-white rounded-[8px] px-5 py-2.5 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M22 6L12 13L2 6V4L12 11L22 4V6Z" fill="#EA4335"/>
                    <path d="M2 6L12 13L22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6Z" fill="#FBBC05" opacity="0.4"/>
                    <path d="M2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6L12 13L2 6Z" fill="#34A853" opacity="0.3"/>
                  </svg>
                  {saving ? "Saving..." : "Save to Gmail Drafts"}
                </button>
                <button
                  onClick={handleMailto}
                  className="bg-[#f9fafb] dark:bg-[#252836] border border-[#e5e7eb] dark:border-[#2a2d3e] rounded-[8px] px-5 py-2.5 font-semibold text-sm text-[#374151] dark:text-[#d1d5db] flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-[#6b7280]" />
                  Open in Email App
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleMailto}
                  className="flex-1 bg-[#111827] dark:bg-[#6366f1] text-white rounded-[8px] px-5 py-2.5 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Open in Email App
                </button>
                <button onClick={handleClose} className="bg-[#f3f3f8] dark:bg-[#252836] text-[#1a1c1f] dark:text-[#d1d5db] rounded-[8px] px-6 py-2.5 font-semibold text-sm">
                  Cancel
                </button>
              </>
            )}
          </div>

          {!gmailConnection && (
            <button
              onClick={() => connectGmail()}
              className="text-[10px] text-[#6366f1] hover:underline text-center mt-1"
            >
              Connect Gmail for draft saving
            </button>
          )}

          <p className="text-[10px] text-[#9ca3af] text-center mt-2">
            Your email will open pre-filled and ready to send.
          </p>
        </div>
      </div>
    </div>
  );
}
