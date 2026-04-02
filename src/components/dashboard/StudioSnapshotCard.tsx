import { Clapperboard, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function StudioSnapshotCard() {
  const navigate = useNavigate();

  // For now, show empty state since studio data requires setup
  return (
    <div className="p-5 bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Studio Snapshot</h2>
        </div>
        <button
          onClick={() => navigate("/studio")}
          className="text-sm font-medium text-success hover:underline flex items-center gap-1"
        >
          View Studio <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-3">
          Your studio insights will appear here once you connect your accounts.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/studio")}
          className="rounded-lg"
        >
          Set Up Studio
        </Button>
      </div>
    </div>
  );
}
