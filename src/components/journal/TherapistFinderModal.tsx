import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Heart, ExternalLink, AlertTriangle } from "lucide-react";

interface TherapistFinderModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TherapistFinderModal({ open, onClose }: TherapistFinderModalProps) {
  const [tab, setTab] = useState<"search" | "request" | "crisis">("search");
  const [insurance, setInsurance] = useState("");
  const [requestForm, setRequestForm] = useState({ name: "", email: "", phone: "", contact: "email" });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Find Support
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {([
            { id: "search", label: "Search" },
            { id: "request", label: "Free Session" },
            { id: "crisis", label: "Crisis Resources" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "search" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Search by Insurance Provider</label>
              <Input
                placeholder="e.g., Blue Cross, Aetna, United..."
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Browse therapist directories:</p>
              {[
                { name: "BetterHelp", url: "https://www.betterhelp.com" },
                { name: "Talkspace", url: "https://www.talkspace.com" },
                { name: "Psychology Today", url: "https://www.psychologytoday.com/us/therapists" },
              ].map((link) => (
                <a
                  key={link.name}
                  href={insurance ? `${link.url}?insurance=${encodeURIComponent(insurance)}` : link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {tab === "request" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Request a free initial session with a licensed therapist.</p>
            <Input placeholder="Full name" value={requestForm.name} onChange={(e) => setRequestForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Email" type="email" value={requestForm.email} onChange={(e) => setRequestForm(f => ({ ...f, email: e.target.value }))} />
            <Input placeholder="Phone" type="tel" value={requestForm.phone} onChange={(e) => setRequestForm(f => ({ ...f, phone: e.target.value }))} />
            <div>
              <label className="text-xs text-muted-foreground">Preferred contact method</label>
              <div className="mt-1 flex gap-2">
                {["email", "phone", "text"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setRequestForm(f => ({ ...f, contact: m }))}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      requestForm.contact === m ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" disabled>Submit Request (Coming Soon)</Button>
          </div>
        )}

        {tab === "crisis" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">If you are in immediate danger, call 911</span>
              </div>
            </div>
            {[
              { name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988", icon: Phone },
              { name: "Crisis Text Line", detail: "Text HOME to 741741", icon: Phone },
              { name: "SAMHSA Helpline", detail: "1-800-662-4357 (free, 24/7)", icon: Phone },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <r.icon className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
