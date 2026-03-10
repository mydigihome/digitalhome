import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Heart, ExternalLink, AlertTriangle, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TherapistFinderModalProps {
  open: boolean;
  onClose: () => void;
}

const INSURANCE_OPTIONS = [
  { value: "aetna", label: "Aetna" },
  { value: "anthem", label: "Anthem Blue Cross Blue Shield" },
  { value: "cigna", label: "Cigna" },
  { value: "unitedhealthcare", label: "UnitedHealthcare" },
  { value: "medicare", label: "Medicare" },
  { value: "medicaid", label: "Medicaid" },
  { value: "out-of-network", label: "Out of Network / Self-Pay" },
  { value: "other", label: "Other" },
];

const ISSUE_OPTIONS = [
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Depression" },
  { value: "trauma-and-ptsd", label: "Trauma and PTSD" },
  { value: "relationship-issues", label: "Relationship Issues" },
  { value: "grief", label: "Grief and Loss" },
  { value: "stress", label: "Stress Management" },
  { value: "life-transitions", label: "Life Transitions" },
  { value: "self-esteem", label: "Self-Esteem" },
  { value: "other", label: "Other" },
];

export default function TherapistFinderModal({ open, onClose }: TherapistFinderModalProps) {
  const [insurance, setInsurance] = useState("");
  const [issue, setIssue] = useState("");
  const [location, setLocation] = useState("");

  const handleFindTherapists = () => {
    let url = "https://www.psychologytoday.com/us/therapists";
    const params: string[] = [];

    if (insurance && insurance !== "other") {
      params.push(`insurance=${encodeURIComponent(insurance)}`);
    }
    if (issue && issue !== "other") {
      params.push(`spec=${encodeURIComponent(issue)}`);
    }
    if (location) {
      // Psychology Today uses location in the path
      const locationSlug = location.trim().toLowerCase().replace(/[,\s]+/g, "-").replace(/-+/g, "-");
      url = `https://www.psychologytoday.com/us/therapists/${locationSlug}`;
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Find a Therapist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Insurance */}
          <div className="space-y-1.5">
            <Label>What's your insurance provider?</Label>
            <Select value={insurance} onValueChange={setInsurance}>
              <SelectTrigger>
                <SelectValue placeholder="Select insurance..." />
              </SelectTrigger>
              <SelectContent>
                {INSURANCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issue */}
          <div className="space-y-1.5">
            <Label>What are you seeking help for?</Label>
            <Select value={issue} onValueChange={setIssue}>
              <SelectTrigger>
                <SelectValue placeholder="Select concern..." />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>Your location (optional)</Label>
            <Input
              placeholder="City, State or Zip code"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleFindTherapists} className="flex-1">
              <Search className="mr-1.5 h-4 w-4" />
              Find Therapists
            </Button>
          </div>

          {/* Also browse */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Also browse:</p>
            {[
              { name: "BetterHelp", url: "https://www.betterhelp.com" },
              { name: "Talkspace", url: "https://www.talkspace.com" },
            ].map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Crisis Resources - Always visible */}
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-semibold text-destructive">In Crisis? Get Immediate Help</span>
            </div>
          </div>
          {[
            { name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988" },
            { name: "Crisis Text Line", detail: "Text HOME to 741741" },
            { name: "NAMI Helpline", detail: "1-800-950-6264" },
          ].map((r) => (
            <div key={r.name} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
              <div>
                <div className="text-xs font-medium text-foreground">{r.name}</div>
                <div className="text-[10px] text-muted-foreground">{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}