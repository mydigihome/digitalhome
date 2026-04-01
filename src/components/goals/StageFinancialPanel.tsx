import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";

const FINANCIAL_KEYWORDS = [
  "financial", "finance", "budget", "cost", "payment", "mortgage", "loan", "fund",
  "save", "savings", "afford", "money", "price", "invest", "down payment", "tax",
  "insurance", "credit", "bank", "purchase", "buy", "expense", "capital", "cash",
];

function aiEstimatedGoal(name: string): number {
  const n = name.toLowerCase();
  if (/property|house|real estate|home/.test(n)) return 50000;
  if (/business|startup/.test(n)) return 25000;
  if (/car|vehicle/.test(n)) return 15000;
  if (/travel|trip/.test(n)) return 5000;
  if (/education|school|course/.test(n)) return 10000;
  return 20000;
}

export function isFinancialStage(title: string, description?: string | null): boolean {
  const text = ((title || "") + " " + (description || "")).toLowerCase();
  return FINANCIAL_KEYWORDS.some(k => text.includes(k));
}

interface Contact {
  id: string;
  name: string;
  job_title?: string | null;
  company?: string | null;
  relationship_type?: string | null;
  last_contacted_date?: string | null;
  photo_url?: string | null;
}

function getAIMessage(
  stageTitle: string,
  goalAmount: number,
  savedAmount: number,
): string {
  const pct = goalAmount ? Math.round((savedAmount / goalAmount) * 100) : 0;
  const remaining = Math.max(goalAmount - savedAmount, 0);
  const months = Math.ceil(remaining / 1300);
  const t = stageTitle.toLowerCase();

  if (/financial preparation|financial|budget/.test(t)) {
    return `You're currently ${pct}% funded toward your project goal of $${goalAmount.toLocaleString()}. At your current savings rate of $1,300/month, you'll be fully ready for this stage in ${months} months. Consider increasing your monthly savings by $200 to accelerate by 3 months.`;
  }
  if (/mortgage|financing|loan/.test(t)) {
    return `Your credit score of 785 puts you in a strong position for mortgage approval. Current rates average 6.8% — locking in soon could save you significantly over the loan term.`;
  }
  if (/down payment|purchase|buy/.test(t)) {
    return `You have $${savedAmount.toLocaleString()} saved toward a $${goalAmount.toLocaleString()} goal — that's ${pct}% of a typical down payment. At your current rate you'll hit this milestone in ${months} months.`;
  }
  if (/insurance|tax/.test(t)) {
    const estimate = Math.round(goalAmount * 0.08);
    return `Based on your income data, your estimated tax liability for this transaction is approximately $${estimate.toLocaleString()}. Set aside funds in your Q4 Tax Vault to cover this.`;
  }
  return `This stage has financial implications. You're ${pct}% funded toward your overall project goal. Stay on track with your savings plan in the Money tab.`;
}

function matchContact(stageTitle: string, contacts: Contact[]): Contact | null {
  const t = stageTitle.toLowerCase();
  const patterns: [RegExp, RegExp][] = [
    [/mortgage|financing|loan/, /mortgage|broker|lender/i],
    [/property|purchase|buy|house|real estate/, /real estate|agent|realtor/i],
    [/financial|budget|fund|save|invest/, /financial|advisor|accountant/i],
  ];
  for (const [stagePat, contactPat] of patterns) {
    if (stagePat.test(t)) {
      const found = contacts.find(c => contactPat.test(c.job_title || ""));
      if (found) return found;
    }
  }
  return null;
}

function contactBg(type?: string | null) {
  if (type === "professional") return { bg: "#e1e0ff", color: "#4f46e5" };
  if (type === "family") return { bg: "#ffe4e6", color: "#be123c" };
  if (type === "friends") return { bg: "#dcfce7", color: "#16a34a" };
  return { bg: "#e1e0ff", color: "#4f46e5" };
}

function daysAgo(date?: string | null) {
  if (!date) return { label: "No contact", color: "#ef4444", dot: "" };
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d <= 14) return { label: `${d}d ago`, color: "#22c55e", dot: "🟢" };
  return { label: `${d}d ago`, color: "#ef4444", dot: "" };
}

/* ── Trigger Row ── */
export function StageFinancialTrigger({
  stageId,
  stageTitle,
  stageDescription,
  projectGoal,
  projectName,
  expandedId,
  onToggle,
}: {
  stageId: string;
  stageTitle: string;
  stageDescription?: string | null;
  projectGoal?: number | null;
  projectName: string;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  if (!isFinancialStage(stageTitle, stageDescription)) return null;

  const goalAmount = projectGoal || aiEstimatedGoal(projectName);
  const savedAmount = 45234;
  const msg = getAIMessage(stageTitle, goalAmount, savedAmount);
  const preview = msg.length > 60 ? msg.slice(0, 60) + "..." : msg;
  const isOpen = expandedId === stageId;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onToggle(stageId); }}
      className="group/fin cursor-pointer"
      style={{
        borderTop: "1px solid #f3f3f8",
        marginTop: 12,
        paddingTop: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 8,
        padding: "12px 8px 0 8px",
        transition: "background 150ms",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#f9f9fe")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
        <span style={{ color: "#6366f1", fontSize: 12, marginRight: 8, flexShrink: 0 }}>✦</span>
        <span style={{ fontSize: 12, color: "#767586", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {preview}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 8 }}>
        <span style={{ fontSize: 10, color: "#6366f1", fontWeight: 700 }}>{isOpen ? "Close" : "See more"}</span>
        <ChevronDown
          style={{
            width: 14, height: 14,
            color: "#6366f1",
            transition: "transform 300ms",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>
    </div>
  );
}

/* ── Expanded Panel ── */
export function StageFinancialPanel({
  stageId,
  stageTitle,
  projectGoal,
  projectName,
  expandedId,
  onClose,
}: {
  stageId: string;
  stageTitle: string;
  projectGoal?: number | null;
  projectName: string;
  expandedId: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data: contacts = [] } = useContacts();
  if (expandedId !== stageId) return null;

  const goalAmount = projectGoal || aiEstimatedGoal(projectName);
  const savedAmount = 45234;
  const msg = getAIMessage(stageTitle, goalAmount, savedAmount);
  const contact = matchContact(stageTitle, contacts as Contact[]);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: 20,
        marginTop: 8,
        border: "1px solid #f0f0f5",
        boxShadow: "0 8px 32px rgba(70,69,84,0.08)",
        position: "relative",
        animation: "panelSlideIn 350ms cubic-bezier(0.25,1,0.5,1)",
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* X close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 12, right: 12,
          width: 24, height: 24, borderRadius: "50%",
          background: "#f3f3f8", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 150ms",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#e8e8ed")}
        onMouseLeave={e => (e.currentTarget.style.background = "#f3f3f8")}
      >
        <X style={{ width: 12, height: 12, color: "#767586" }} />
      </button>

      {/* Part A */}
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6366f1", marginBottom: 8 }}>
        ✦ AI Insight
      </p>
      <p style={{ fontSize: 14, color: "#464554", lineHeight: 1.7 }}>{msg}</p>

      {/* Part B — contact */}
      {contact && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f3f3f8" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#767586", marginBottom: 12 }}>
            Suggested Contact
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {contact.photo_url ? (
              <img src={contact.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "1px solid #e8e8ed" }} />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: contactBg(contact.relationship_type).bg,
                color: contactBg(contact.relationship_type).color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14, border: "1px solid #e8e8ed",
              }}>
                {contact.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#1a1c1f" }}>{contact.name}</p>
              <p style={{ fontSize: 12, color: "#767586" }}>{contact.job_title || contact.company || ""}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11 }}>{daysAgo(contact.last_contacted_date).dot}</span>
              <span style={{ fontSize: 11, color: daysAgo(contact.last_contacted_date).color }}>
                {daysAgo(contact.last_contacted_date).label}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => navigate("/relationships", { state: { openContactId: contact.id, openEmailWidget: true } })}
              style={{
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "white", border: "none", borderRadius: 999,
                padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              ▶ Email
            </button>
            <button
              onClick={() => navigate("/relationships", { state: { openContactId: contact.id, openModal: true } })}
              style={{
                background: "#f3f3f8", color: "#1a1c1f", border: "none", borderRadius: 999,
                padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              View Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
