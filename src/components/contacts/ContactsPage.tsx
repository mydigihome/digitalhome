import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VerticalTabRail from "./VerticalTabRail";
import ProfileHeader from "./ProfileHeader";
import OverviewView from "./views/OverviewView";
import EmailView from "./views/EmailView";
import ComposeModal from "./modals/ComposeModal";
import { useGmailConnection, useConnectGmail } from "@/hooks/useGmail";
import { toast } from "sonner";
import "../../styles/contacts-tab.css";

export default function ContactsPage() {
  const [activeView, setActiveView] = useState("overview");
  const [compose, setCompose] = useState<{
    open: boolean;
    to: string;
    name: string;
    subject?: string;
    threadId?: string;
    isReply?: boolean;
  }>({ open: false, to: "", name: "" });

  const { data: gmailConnection } = useGmailConnection();
  const { connect: connectGmail, connecting } = useConnectGmail();

  const handleGmailImport = () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      toast.error("Add Google Client ID in settings to enable Gmail");
      return;
    }
    connectGmail();
  };

  const handleLinkedInImport = () => {
    toast.info("Add LinkedIn Client ID in settings to enable LinkedIn import");
  };

  const openCompose = (to: string, name: string, subject?: string, threadId?: string, isReply?: boolean) => {
    setCompose({ open: true, to, name, subject, threadId, isReply });
  };

  return (
    <div className="contacts-root" style={{ flexDirection: 'column' }}>
      <div className="contacts-main">
        {/* Profile Header */}
        <ProfileHeader />

        {/* Import buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleLinkedInImport}
            className="text-white rounded-full px-6 py-2.5 font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
          >
            ↗ Import from LinkedIn
          </button>
          {gmailConnection ? (
            <button className="bg-[#006c49] text-white rounded-full px-6 py-2.5 font-bold text-sm">
              ✓ Gmail Connected
            </button>
          ) : (
            <button
              onClick={handleGmailImport}
              disabled={connecting}
              className="bg-white text-[#1a1c1f] rounded-full px-6 py-2.5 font-bold text-sm shadow-sm"
            >
              {connecting ? "Connecting..." : "✉ Import from Gmail"}
            </button>
          )}
        </div>

        <VerticalTabRail activeView={activeView} onViewChange={setActiveView} />

        {/* Views */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === "overview" && (
              <OverviewView
                onSwitchToEmails={() => setActiveView("emails")}
                onCompose={(to, name) => openCompose(to, name)}
              />
            )}
            {activeView === "emails" && (
              <EmailView
                onReply={(to, name, subject, threadId) => openCompose(to, name, subject, threadId, true)}
              />
            )}
            {activeView === "contacts" && (
              <OverviewView
                onSwitchToEmails={() => setActiveView("emails")}
                onCompose={(to, name) => openCompose(to, name)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ComposeModal
        isOpen={compose.open}
        onClose={() => setCompose({ ...compose, open: false })}
        to={compose.to}
        toName={compose.name}
        subject={compose.subject}
        threadId={compose.threadId}
        isReply={compose.isReply}
      />
    </div>
  );
}
