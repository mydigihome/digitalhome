import { useState, useEffect, useRef } from "react";
import { Mail } from "lucide-react";
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

interface ContactInfo {
  id: string;
  name: string;
  email?: string;
  lastContactDays: number;
  role?: string;
  location?: string;
}

interface Props {
  contact: ContactInfo | null;
  suggestedContact: ContactInfo;
}

export default function AIEmailWidget({ contact, suggestedContact }: Props) {
  const active = contact || suggestedContact;
  const firstName = active.name.split(" ")[0];
  const category = active.lastContactDays > 14 ? "overdue" : active.lastContactDays > 7 ? "dueSoon" : "recent";
  const drafts = DRAFTS[category];

  const [draftIndex, setDraftIndex] = useState(0);
  const [body, setBody] = useState(drafts[0].replace(/{name}/g, firstName));
  const [subject, setSubject] = useState(
    active.lastContactDays > 14 ? "Checking in — Investment Property" : "Staying connected"
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { data: gmailConn } = useGmailConnection();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset draft when contact changes
  useEffect(() => {
    const fn = active.name.split(" ")[0];
    const cat = active.lastContactDays > 14 ? "overdue" : active.lastContactDays > 7 ? "dueSoon" : "recent";
    const d = DRAFTS[cat];
    setDraftIndex(0);
    setBody(d[0].replace(/{name}/g, fn));
    setSubject(active.lastContactDays > 14 ? "Checking in — Investment Property" : "Staying connected");
    setSent(false);
  }, [active.id]);

  const regenerate = () => {
    const next = (draftIndex + 1) % drafts.length;
    setDraftIndex(next);
    const newBody = drafts[next].replace(/{name}/g, firstName);
    setBody(newBody);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.substring(start, end);
    if (start === end) return; // nothing selected
    const newBody = body.substring(0, start) + prefix + selected + suffix + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const trackEmailSent = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from("contact_emails").insert({
        user_id: user.id,
        contact_id: active.id,
        content: `Subject: ${subject}\n\n${body}`,
        tone: "professional",
      });
      if (error) console.error("Failed to track email:", error);

      // Update last_contacted_date on the contact
      await supabase.from("contacts").update({
        last_contacted_date: new Date().toISOString(),
        last_email_date: new Date().toISOString(),
        email_count: (active as any).email_count ? (active as any).email_count + 1 : 1,
      }).eq("id", active.id);
    } catch (e) {
      console.error("Email tracking error:", e);
    }
  };

  const handleMailto = async () => {
    if (!active.email) {
      toast.error("No email address for this contact");
      return;
    }
    await trackEmailSent();
    const mailto = `mailto:${encodeURIComponent(active.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast.success("Email app opened");
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    await (supabase as any).from("email_drafts").insert({
      user_id: user.id,
      contact_id: active.id,
      content: `Subject: ${subject}\n\n${body}`,
      tone: "professional",
    });
    toast.success("Draft saved");
  };

  const handleGmailDraft = async () => {
    if (!active.email) {
      toast.error("No email address for this contact");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("gmail-create-draft", {
        body: { to: active.email, subject, body },
      });
      if (error) throw error;
      if (data?.draftLink) {
        window.open(data.draftLink, "_blank");
        toast.success("Draft saved to Gmail");
      }
      await trackEmailSent();
      setSent(true);
    } catch {
      handleMailto();
    } finally {
      setSending(false);
    }
  };

  const statusLabel = active.lastContactDays > 14
    ? `Overdue · ${active.lastContactDays}d`
    : active.lastContactDays > 7
    ? `Follow up · ${active.lastContactDays}d`
    : `Active · ${active.lastContactDays}d`;

  const statusColor = active.lastContactDays > 14 ? "#f43f5e" : active.lastContactDays > 7 ? "#f59e0b" : "#22c55e";

  if (sent) {
    return (
      <div className="rounded-[24px] p-5 flex flex-col items-center justify-center gap-3 min-h-[200px]"
        style={{ background: "#ffffff", boxShadow: "0 12px 40px rgba(70,69,84,0.06)", border: "1px solid #f0f0f5" }}>
        <div className="w-12 h-12 rounded-full bg-[#f0fdf4] flex items-center justify-center text-2xl"></div>
        <p className="font-bold text-sm text-[#1a1c1f]">Sent to {active.name}</p>
      </div>
    );
  }

  const toolbarBtnStyle: React.CSSProperties = {
    height: 32, minWidth: 32, padding: "0 8px",
    background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 6,
    fontFamily: "Inter, sans-serif", fontSize: 13, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    color: "#1a1c1f",
  };

  return (
    <div className="rounded-[24px] p-5" style={{ background: "#ffffff", boxShadow: "0 12px 40px rgba(70,69,84,0.06)", border: "1px solid #f0f0f5" }}>
      {/* Header */}
      {!contact ? (
        <div className="mb-3">
          <div className="text-sm font-bold text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Send an email to...
          </div>
          <div className="text-sm font-bold text-[#4648d4] mt-0.5">{active.name}</div>
          <div className="bg-[#f3f3f8] rounded-full px-3 py-1 text-[10px] font-bold text-[#767586] inline-flex mt-1">
            {statusLabel} · {active.role} · {active.location}
          </div>
          <div className="text-[10px] text-[#767586] mt-1">Or select a contact</div>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center bg-[#e1e0ff] text-[#4648d4] border border-[#e8e8ed]">
            {active.name[0]}
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-[#1a1c1f]">Email to {active.name}</div>
            <span className="text-[10px] font-bold rounded-full px-2 py-0.5 inline-block mt-0.5"
              style={{ background: `${statusColor}15`, color: statusColor }}>
              {statusLabel}
            </span>
          </div>
        </div>
      )}

      {/* Subject */}
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="bg-[#f3f3f8] rounded-[14px] px-3 py-2 text-xs w-full border-none focus:ring-1 focus:ring-[#4648d4]/30 focus:outline-none mb-2"
        placeholder="Subject"
      />

      {/* AI Draft label */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4648d4", marginBottom: 4, marginTop: 8, fontFamily: "Inter, sans-serif" }}>AI DRAFT</div>

      {/* Toolbar + Textarea — only show when draft exists */}
      {body.length > 0 && (
        <>
          {/* B / I / U toolbar */}
          <div style={{ display: "flex", flexDirection: "row", gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #E5E7EB" }}>
            <button type="button" onClick={() => wrapSelection("**", "**")} style={{ ...toolbarBtnStyle, fontWeight: 700 }}>B</button>
            <button type="button" onClick={() => wrapSelection("_", "_")} style={{ ...toolbarBtnStyle, fontStyle: "italic" }}>I</button>
            <button type="button" onClick={() => wrapSelection("<u>", "</u>")} style={{ ...toolbarBtnStyle, textDecoration: "underline" }}>U</button>
          </div>

          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{
              width: "100%", minHeight: 180, padding: 12,
              fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.6,
              color: "#1a1c1f", background: "#f3f3f8",
              border: "1px solid #E5E7EB", borderRadius: 8,
              resize: "vertical", outline: "none", display: "block", boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#7B5EA7"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
          />
        </>
      )}

      <button onClick={regenerate} style={{ fontSize: 10, color: "#4648d4", fontWeight: 700, marginTop: 4, background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: 0 }}>
        Regenerate
      </button>

      {/* Send */}
      <div className="flex flex-col gap-2 mt-3">
        <div className="flex gap-2">
          {gmailConn ? (
            <>
              <button
                onClick={handleGmailDraft}
                disabled={sending}
                className="flex-1 bg-[#111827] text-white rounded-[8px] font-bold text-xs py-2.5 disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{ minHeight: 44 }}
              >
                {sending ? "Saving..." : "Save to Gmail Drafts"}
              </button>
              <button
                onClick={handleMailto}
                className="bg-[#f3f3f8] text-[#374151] rounded-[8px] font-bold text-xs py-2.5 px-3 flex items-center gap-1"
                title="Open in Email App"
                style={{ minHeight: 44 }}
              >
                <Mail className="w-3 h-3" /> Email App
              </button>
            </>
          ) : (
            <button
              onClick={handleMailto}
              className="flex-1 bg-[#111827] text-white rounded-[8px] font-bold text-xs py-2.5 flex items-center justify-center gap-1.5"
              style={{ minHeight: 44 }}
            >
              <Mail className="w-3 h-3" /> Open in Mail
            </button>
          )}
        </div>
        <button
          onClick={handleSaveDraft}
          className="w-full bg-[#f3f3f8] text-[#374151] rounded-[8px] font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 hover:bg-[#e5e7eb] transition-colors"
          style={{ minHeight: 44 }}
        >
          Save Draft
        </button>
        <p className="text-[10px] text-[#9ca3af] text-center">
          Your email will open pre-filled and ready to send.
        </p>
      </div>
    </div>
  );
}
