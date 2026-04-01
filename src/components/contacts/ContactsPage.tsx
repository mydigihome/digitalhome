import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VerticalTabRail from "./VerticalTabRail";
import ProfileHeader from "./ProfileHeader";
import OverviewView from "./views/OverviewView";
import EmailView from "./views/EmailView";
import ComposeModal from "./modals/ComposeModal";
import LinkedInSelectionPanel from "./panels/LinkedInSelectionPanel";
import { useGmailConnection, useConnectGmail } from "@/hooks/useGmail";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import "../../styles/contacts-tab.css";

interface LinkedInConnection {
  name: string;
  email: string | null;
  job_title: string | null;
  company: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
}

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

  const [linkedInPanel, setLinkedInPanel] = useState<{
    open: boolean;
    connections: LinkedInConnection[];
  }>({ open: false, connections: [] });

  const { data: gmailConnection } = useGmailConnection();
  const { connect: connectGmail, connecting } = useConnectGmail();
  const queryClient = useQueryClient();

  // Handle LinkedIn OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const savedState = sessionStorage.getItem("linkedin_oauth_state");

    if (code && state && savedState === state) {
      sessionStorage.removeItem("linkedin_oauth_state");
      window.history.replaceState({}, "", url.pathname);

      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error("Please sign in to connect LinkedIn");
            return;
          }
          const redirectUri = `${window.location.origin}/relationships`;
          const { data, error } = await supabase.functions.invoke("linkedin-import", {
            body: { code, redirect_uri: redirectUri },
          });
          if (error) {
            toast.error("LinkedIn import failed");
            console.error(error);
            return;
          }
          if (data?.success && data?.connections) {
            // Open selection panel instead of auto-importing
            setLinkedInPanel({ open: true, connections: data.connections });
          } else {
            toast.error(data?.error || "LinkedIn import failed");
          }
        } catch (err) {
          console.error("LinkedIn callback error:", err);
          toast.error("Failed to complete LinkedIn import");
        }
      })();
    }
  }, [queryClient]);

  const handleLinkedInImport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to connect LinkedIn");
        return;
      }
      const redirectUri = `${window.location.origin}/relationships`;
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || "86vrea7sthla29";
      const scope = "openid profile email";
      const state = crypto.randomUUID();
      sessionStorage.setItem("linkedin_oauth_state", state);
      window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    } catch {
      toast.error("Failed to start LinkedIn connection");
    }
  };

  const handleGmailImport = () => {
    connectGmail();
  };

  const openCompose = (to: string, name: string, subject?: string, threadId?: string, isReply?: boolean) => {
    setCompose({ open: true, to, name, subject, threadId, isReply });
  };

  return (
    <div className="contacts-root" style={{ flexDirection: 'column' }}>
      <div className="contacts-main">
        <ProfileHeader />

        <div className="flex gap-3 mb-6">
          <button
            onClick={handleLinkedInImport}
            style={{ backgroundColor: '#0A66C2', color: '#ffffff', border: 'none', outline: 'none' }}
            className="linkedin-btn flex items-center gap-2 rounded-full px-6 py-2.5 font-bold text-sm cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style={{flexShrink: 0}}>
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Import from LinkedIn
          </button>
          {gmailConnection ? (
            <button className="bg-[#006c49] text-white rounded-full px-6 py-2.5 font-bold text-sm">
               Gmail Connected
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

      <LinkedInSelectionPanel
        isOpen={linkedInPanel.open}
        onClose={() => setLinkedInPanel({ open: false, connections: [] })}
        connections={linkedInPanel.connections}
      />
    </div>
  );
}
