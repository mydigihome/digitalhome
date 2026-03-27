import { useState } from "react";
import EmailRow from "../cards/EmailRow";

const MOCK_EMAILS = [
  { id: "e1", senderName: "Sarah Johnson", senderInitial: "S", subject: "Updated Investment ROI Sheet", snippet: "Hi Alex, I've attached the latest figures for the...", time: "2h ago", isUnread: true,
    body: "Hi Alex,\n\nI've attached the latest figures for the Denver investment properties we discussed. The numbers are looking strong for Q2 — the Capitol Hill duplex is showing a 7.2% cap rate.\n\nI've also shortlisted 3 properties that match your ROI criteria exactly. Can we schedule a call this week to walk through them?\n\nBest,\nSarah",
    email: "sarah@realestate.com" },
  { id: "e2", senderName: "Mike Thompson", senderInitial: "M", subject: "Kitchen remodel materials", snippet: "Just checking if you had a chance to look at the quar...", time: "Yesterday", isUnread: false,
    body: "Hey,\n\nJust checking if you had a chance to look at the quartzite samples I dropped off last week. The supplier needs our order by Friday to lock in the current pricing.\n\nAlso, the permit came through for the electrical work. We can start Monday if you give the green light.\n\nLet me know!\nMike",
    email: "mike@contractor.com" },
  { id: "e3", senderName: "Sarah Johnson", senderInitial: "S", subject: "Property viewing - Thursday 3pm", snippet: "Confirmed the viewing for 1842 Vine St. I'll meet you...", time: "2d ago", isUnread: false,
    body: "Hi Alex,\n\nConfirmed the viewing for 1842 Vine St. I'll meet you there at 3pm. Bring your checkbook just in case — this one might go fast!\n\nSarah",
    email: "sarah@realestate.com" },
  { id: "e4", senderName: "Robert Kim", senderInitial: "R", subject: "Mortgage pre-approval update", snippet: "Your pre-approval letter has been issued for up to...", time: "3d ago", isUnread: true,
    body: "Hi Alex,\n\nGreat news! Your pre-approval letter has been issued for up to $450,000. The rate we locked in is 6.25% for a 30-year fixed.\n\nThis pre-approval is valid for 90 days. Let me know if you have any questions.\n\nBest regards,\nRobert Kim\nMortgage Broker",
    email: "robert@mortgage.com" },
];

interface Props {
  onReply: (to: string, name: string, subject: string, threadId?: string) => void;
}

export default function EmailView({ onReply }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selected = MOCK_EMAILS.find((e) => e.id === selectedId);
  const filtered = MOCK_EMAILS.filter(
    (e) => !search || e.senderName.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="contacts-email-panel">
      <div className="contacts-email-list">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emails..."
          className="bg-[#f3f3f8] rounded-[16px] px-4 py-2.5 text-sm w-full mb-4 outline-none"
        />
        <div className="space-y-1">
          {filtered.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              isActive={selectedId === email.id}
              onClick={() => setSelectedId(email.id)}
            />
          ))}
        </div>
      </div>

      <div className="contacts-email-detail">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-6xl text-[#e8e8ed] mb-3">✉</div>
            <div className="text-sm text-[#767586]">Select an email to read</div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="font-bold text-xl text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {selected.subject}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-8 h-8 rounded-full bg-[#e1e0ff] text-[#4648d4] font-bold text-xs flex items-center justify-center">
                  {selected.senderInitial}
                </div>
                <div>
                  <div className="font-bold text-sm text-[#1a1c1f]">{selected.senderName}</div>
                  <div className="text-xs text-[#767586]">{selected.email}</div>
                </div>
                <span className="text-xs text-[#767586] ml-auto">{selected.time}</span>
              </div>
            </div>

            <div className="text-sm text-[#1a1c1f] leading-relaxed whitespace-pre-wrap">{selected.body}</div>

            <div className="mt-8 bg-white rounded-[24px] p-5 shadow-sm">
              <textarea
                placeholder={`Reply to ${selected.senderName}...`}
                className="bg-[#f3f3f8] rounded-[16px] px-4 py-3 text-sm w-full min-h-[100px] outline-none resize-none focus:ring-2 focus:ring-[#4648d4]"
              />
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  onClick={() => onReply(selected.email, selected.senderName, `Re: ${selected.subject}`, selected.id)}
                  className="text-white rounded-full px-5 py-2 text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
                >
                  Send Reply
                </button>
                <button className="bg-[#f3f3f8] text-[#767586] rounded-full px-5 py-2 text-sm font-bold">
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
