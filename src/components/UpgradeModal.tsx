import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Star, ArrowRight } from "lucide-react";

export function UpgradeModal() {
  const { data: prefs } = useUserPreferences();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!prefs) return;
    if (prefs.is_subscribed) return;
    if (prefs.founding_member) return;
    if (!prefs.trial_end_date) return;

    const isExpired = new Date(prefs.trial_end_date) < new Date();
    if (isExpired) {
      // Small delay so it doesn't flash on mount
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [prefs?.trial_end_date, prefs?.is_subscribed, prefs?.founding_member]);

  if (prefs?.is_subscribed || prefs?.founding_member) return null;

  const handleUpgrade = () => {
    setOpen(false);
    navigate("/settings?tab=billing");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Your free trial has ended</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upgrade to Pro to keep using all features and never lose your data.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {[
            { icon: Zap, text: "Unlimited projects & tasks" },
            { icon: Star, text: "AI-powered brain dumps & task generation" },
            { icon: Shield, text: "Priority support & early access" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={handleUpgrade} className="w-full gap-2">
            Upgrade Now <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-muted-foreground">
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
