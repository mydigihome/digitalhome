import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Trash2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useCollaborators,
  useCreateCollaborator,
  useDeleteCollaborator,
} from "@/hooks/useCollaborators";
import { useAuth } from "@/hooks/useAuth";

export default function CollaboratorPanel() {
  const { user } = useAuth();
  const { data: collaborators = [] } = useCollaborators();
  const createCollab = useCreateCollaborator();
  const deleteCollab = useDeleteCollaborator();

  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");

  const ROLES = [
    { value: "editor", label: "Content Manager" },
    { value: "designer", label: "Graphic Designer" },
    { value: "viewer", label: "Viewer" },
  ];

  // Filter to content-planner collaborators (those with project_ids containing "content-planner" tag or empty)
  const plannerCollabs = collaborators.filter(
    (c) => c.project_ids?.includes("content-planner") || c.project_ids?.length === 0
  );

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    try {
      await createCollab.mutateAsync({
        invited_email: trimmed,
        role,
        project_ids: ["content-planner"],
      });
      toast.success(`Invited ${trimmed}`);
      setEmail("");
      setShowInvite(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to invite");
    }
  };

  return (
    <>
      {/* Invite Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowInvite(true)}
        className="gap-1.5"
      >
        <Users className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Collaborators</span>
        {plannerCollabs.length > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
            {plannerCollabs.length}
          </Badge>
        )}
      </Button>

      {/* Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Content Planner Team
                </h3>
                <button onClick={() => setShowInvite(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Invite form */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    className="flex-1"
                  />
                  <Button onClick={handleInvite} size="sm" disabled={createCollab.isPending}>
                    <Plus className="h-4 w-4 mr-1" /> Invite
                  </Button>
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Current collaborators */}
              <div className="space-y-1">
                {/* Owner */}
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-secondary/50">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || "Y"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Crown className="h-3 w-3" /> Owner
                  </Badge>
                </div>

                {plannerCollabs.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-semibold">
                      {collab.invited_email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{collab.invited_email}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{collab.role === "editor" ? "Content Manager" : collab.role === "designer" ? "Graphic Designer" : collab.role}</p>
                    </div>
                    <Badge
                      variant={collab.status === "active" ? "default" : "secondary"}
                      className="text-[10px] capitalize"
                    >
                      {collab.status}
                    </Badge>
                    <button
                      onClick={() => {
                        deleteCollab.mutate(collab.id);
                        toast.success("Collaborator removed");
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {plannerCollabs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No collaborators yet. Invite someone to work together.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
