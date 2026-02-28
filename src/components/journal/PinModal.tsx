import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PinModalProps {
  open: boolean;
  onClose: () => void;
  entryId: string;
  mode: "set" | "verify" | "unlock";
  onSuccess: () => void;
}

export default function PinModal({ open, onClose, entryId, mode, onSuccess }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("journal-pin", {
        body: { action: mode, entry_id: entryId, pin },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (mode === "verify" && !data?.success) {
        toast.error("Incorrect PIN");
        return;
      }

      toast.success(
        mode === "set" ? "Entry locked with PIN" :
        mode === "verify" ? "PIN verified" :
        "Entry unlocked"
      );
      onSuccess();
      onClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
      setPin("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {mode === "set" ? "Set PIN" : mode === "verify" ? "Enter PIN" : "Unlock Entry"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          {mode === "set"
            ? "Choose a 4-digit PIN to lock this entry."
            : mode === "verify"
            ? "Enter PIN to view this entry."
            : "Enter PIN to permanently unlock this entry."}
        </p>
        <div className="flex justify-center py-4">
          <InputOTP maxLength={4} value={pin} onChange={setPin}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button onClick={handleSubmit} disabled={loading || pin.length < 4} className="w-full">
          {loading ? "Processing..." : mode === "set" ? "Lock Entry" : mode === "verify" ? "Verify" : "Unlock"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
