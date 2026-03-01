import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EmailSuggestion {
  label: string;
  subject: string;
  body: string;
}

function getEmailSuggestion(projectName: string, projectType: string): EmailSuggestion {
  const nameLower = projectName.toLowerCase();

  if (projectType === "event") {
    return {
      label: "Email your guests",
      subject: `About ${projectName}`,
      body: `Hi there,\n\nJust wanted to check in about ${projectName}. Looking forward to seeing you!\n\nBest regards`,
    };
  }

  if (nameLower.includes("home") || nameLower.includes("house") || nameLower.includes("realtor") || nameLower.includes("mortgage")) {
    return {
      label: "Email your realtor",
      subject: `Following up - ${projectName}`,
      body: `Hi,\n\nI wanted to follow up regarding my goal: "${projectName}". Could we schedule a time to discuss next steps?\n\nThank you`,
    };
  }
  if (nameLower.includes("music") || nameLower.includes("ep") || nameLower.includes("album") || nameLower.includes("producer") || nameLower.includes("studio")) {
    return {
      label: "Email your producer",
      subject: `Update on ${projectName}`,
      body: `Hi,\n\nChecking in on the progress of "${projectName}". When would be a good time to connect?\n\nBest`,
    };
  }
  if (nameLower.includes("job") || nameLower.includes("career") || nameLower.includes("interview") || nameLower.includes("recruiter") || nameLower.includes("hire")) {
    return {
      label: "Email the recruiter",
      subject: `Following up - ${projectName}`,
      body: `Hi,\n\nI wanted to follow up regarding the opportunity we discussed. I'm very interested and would love to learn about next steps.\n\nBest regards`,
    };
  }

  return {
    label: "Email about this project",
    subject: `Update: ${projectName}`,
    body: `Hi,\n\nI wanted to share an update on "${projectName}".\n\n[Your update here]\n\nBest regards`,
  };
}

interface Props {
  projectName: string;
  projectType: string;
}

export default function QuickEmailComposer({ projectName, projectType }: Props) {
  const [open, setOpen] = useState(false);
  const suggestion = getEmailSuggestion(projectName, projectType);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(suggestion.subject);
  const [body, setBody] = useState(suggestion.body);

  const handleOpen = () => {
    const s = getEmailSuggestion(projectName, projectType);
    setSubject(s.subject);
    setBody(s.body);
    setOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${body}`);
    toast.success("Copied to clipboard");
  };

  const handleSend = () => {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto);
    setOpen(false);
    toast.success("Email client opened");
  };

  return (
    <>
      {/* Static inline email button */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        title={suggestion.label}
      >
        <Mail className="h-3.5 w-3.5" />
        <span>{suggestion.label}</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" /> Quick Email
                </h3>
                <button onClick={() => setOpen(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="recipient@example.com"
                    type="email"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button onClick={handleSend} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-1" /> Send
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
